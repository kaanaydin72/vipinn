/**
 * PayTR ödeme entegrasyonu servis modülü
 * PayTR ile ilgili tüm işlemleri yönetir: token oluşturma, hash hesaplama, ödeme başlatma
 * 
 * API Dokümanı: https://www.paytr.com/entegrasyon/iframe-entegrasyonu
 */

import { Reservation, User } from "@shared/schema";
import { storage } from "../storage";
import { createHash } from "crypto";
import https from "https";

// Token için gerekli sabitleri ayarla
const MERCHANT_ID = process.env.PAYTR_MERCHANT_ID || "";
const MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY || "";
const MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT || "";

// PayTR bilgilerinin kontrol edilmesi
const checkSettings = () => {
  if (!MERCHANT_ID || !MERCHANT_KEY || !MERCHANT_SALT) {
    throw new Error('PayTR ayarları eksik. Lütfen .env dosyanızı kontrol edin.');
  }
  
  console.log('PayTR ayarları başarıyla yüklendi');
  return true;
};

/**
 * PayTR için Base64 ile URL güvenli kodlama yap
 */
const base64UrlEncode = (str: string): string => {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

/**
 * PayTR hash değerini oluştur
 * Bu fonksiyon, PayTR'nin beklediği formatta hash oluşturur
 * 
 * @param params - Hash oluşturulacak parametreler
 * @returns Oluşturulan hash değeri
 */
const generateHash = (params: Record<string, string | number>): string => {
  // PayTR'nin beklediği sıralama ile bir string oluşturulmalı
  const paramsStr = Object.entries(params)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  // MERCHANT_SALT + paramsStr + MERCHANT_KEY kombinasyonundan hash oluştur
  const hashStr = `${MERCHANT_SALT}${paramsStr}${MERCHANT_KEY}`;
  const hash = createHash('sha256').update(hashStr).digest('base64');
  
  return hash;
};

/**
 * Base64 ile kodlanmış kullanıcı bilgilerini oluştur
 */
const generateUserIP = (ip: string): string => {
  return Buffer.from(ip).toString('base64');
};

/**
 * PayTR entegrasyonu için gerekli token bilgilerini oluştur
 */
const generateToken = async (
  reservation: Reservation, 
  user: User, 
  callbackUrl: string, 
  userIp: string,
  successUrl: string,
  failUrl: string
): Promise<{ token: string, paymentUrl: string }> => {
  // PayTR ayarlarını kontrol et
  checkSettings();
  
  // rezervasyondan room bilgilerini al
  const room = await storage.getRoom(reservation.roomId);
  if (!room) {
    throw new Error('Oda bilgileri bulunamadı');
  }
  
  // otelin bilgilerini al
  const hotel = await storage.getHotel(room.hotelId);
  if (!hotel) {
    throw new Error('Otel bilgileri bulunamadı');
  }
  
  // PayTR için user_basket parametresi oluştur (JSON string ve base64 kodlanmış)
  const basketItems = [
    {
      name: `${hotel.name} - ${room.name}`,
      price: reservation.totalPrice.toString(),
      count: 1
    }
  ];
  
  const userBasketEncoded = Buffer.from(JSON.stringify(basketItems)).toString('base64');
  
  // Sipariş numarası olarak reservationCode veya reservationId kullan
  const merchantOid = reservation.reservationCode || `VIPINN${reservation.id}`;
  
  // Kullanıcı IP adresini base64 ile kodla
  const userIpEncoded = generateUserIP(userIp);
  
  // Kullanıcı bilgilerini oluştur
  const email = user.email || 'misafir@vipinnhotels.com';
  const nameSurname = user.fullName || user.username;
  const address = 'Türkiye'; // Varsayılan adres
  const phone = user.phone || '5555555555';
  
  // PayTR'nin minimum ödeme tutarını (1 TL) korumak için kontrol
  const paymentAmount = Math.max(Math.floor(reservation.totalPrice * 100), 100);
  console.log(`Rezervasyon tutarı: ${reservation.totalPrice} TL, PayTR için ödeme tutarı: ${paymentAmount/100} TL`);
  
  // PayTR beklenen parametreler
  const params: Record<string, string | number> = {
    merchant_id: MERCHANT_ID,
    user_ip: userIpEncoded,
    merchant_oid: merchantOid,
    email,
    payment_amount: paymentAmount, // kuruş cinsinden (1 TL = 100 kuruş), minimum 100 kuruş (1 TL)
    currency: 'TL',
    user_basket: userBasketEncoded,
    no_installment: 0, // taksit seçeneği açık
    max_installment: 0, // maksimum taksit sayısı (0=sınırsız)
    test_mode: 1, // test modu açık (geliştirme sırasında)
    paytr_token: '',
    debug_on: 1, // hata ayıklama açık (geliştirme sırasında)
    non_3d: 0, // 3D Secure açık
    merchant_ok_url: successUrl,
    merchant_fail_url: failUrl,
    user_name: nameSurname,
    user_address: address,
    user_phone: phone
  };
  
  // Token değerini oluştur
  const token = generateHash(params);
  params.paytr_token = token;
  
  // PayTR'ye POST isteği için verileri hazırla
  const postData = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    postData.append(key, value.toString());
  });
  
  // PayTR API'ye istek gönder ve token al
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.paytr.com',
      port: 443,
      path: '/odeme/api/get-token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.toString().length
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // Debug the raw response data
          console.log('PayTR API raw response:', data);
          
          // Handle empty response
          if (!data || data.trim() === '') {
            console.error('Empty response from PayTR API');
            reject(new Error('Empty response from PayTR API'));
            return;
          }
          
          // Try to parse the JSON response
          const response = JSON.parse(data);
          
          if (response.status === 'success') {
            // İşlem başarılı
            console.log(`PayTR token oluşturuldu:`, {
              token: response.token,
              tokenLength: response.token.length,
              expectedUrlFormat: 'https://www.paytr.com/odeme/guvenli/{TOKEN}'
            });
            
            const paymentUrl = `https://www.paytr.com/odeme/guvenli/${response.token}`;
            
            // PayTR transaction kaydı oluştur
            storage.createPaytrTransaction({
              reservationId: reservation.id,
              merchantOid: merchantOid,
              token: response.token,
              amount: reservation.totalPrice,
              status: 'pending',
              requestData: JSON.stringify(params),
              responseData: data
            }).catch(err => {
              console.error('PayTR transaction kaydedilirken hata:', err);
            });
            
            resolve({
              token: response.token,
              paymentUrl
            });
          } else {
            // İşlem başarısız
            console.error('PayTR token alınamadı:', response);
            reject(new Error(response.reason || 'PayTR token alınamadı'));
          }
        } catch (error) {
          console.error('PayTR API cevabı işlenirken hata:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('PayTR API isteği başarısız:', error);
      reject(error);
    });
    
    req.write(postData.toString());
    req.end();
  });
};

/**
 * PayTR'den gelen callback için hash doğrulaması yap
 */
const verifyCallback = (params: Record<string, string>): boolean => {
  // PayTR ayarlarını kontrol et
  try {
    checkSettings();
  } catch (error) {
    return false;
  }
  
  // Gelen parametrelerden hash_params ve hash değerlerini al
  const { hash_params, hash } = params;
  
  if (!hash_params || !hash) {
    return false;
  }
  
  // Hash parametrelerini doğrula
  const hashParamsArr = hash_params.split('|');
  const hashStr = hashParamsArr
    .map(param => params[param])
    .join('');
  
  // MERCHANT_KEY + hashStr + MERCHANT_SALT ile hash oluştur
  const calculatedHash = createHash('sha256')
    .update(MERCHANT_KEY + hashStr + MERCHANT_SALT)
    .digest('base64');
  
  return calculatedHash === hash;
};

/**
 * PayTR servis ayarlarını getir
 */
const getPaytrSettings = async () => {
  try {
    const settings = await storage.getPaytrSettings();
    
    // Ayarlar hala varsayılan mı kontrol et
    if (!settings || !settings.merchantId || !settings.merchantKey || !settings.merchantSalt) {
      return {
        merchantId: MERCHANT_ID,
        merchantKey: MERCHANT_KEY,
        merchantSalt: MERCHANT_SALT,
        testMode: process.env.NODE_ENV !== 'production'
      };
    }
    
    return settings;
  } catch (error) {
    console.error('PayTR ayarları getirilemedi:', error);
    return {
      merchantId: MERCHANT_ID,
      merchantKey: MERCHANT_KEY,
      merchantSalt: MERCHANT_SALT,
      testMode: process.env.NODE_ENV !== 'production'
    };
  }
};

/**
 * PayTR servis ayarlarını güncelle
 */
const updatePaytrSettings = async (
  merchantId: string,
  merchantKey: string,
  merchantSalt: string,
  testMode: boolean
) => {
  try {
    const updatedSettings = await storage.updatePaytrSettings({
      merchantId,
      merchantKey,
      merchantSalt,
      testMode
    });
    
    return updatedSettings;
  } catch (error) {
    console.error('PayTR ayarları güncellenemedi:', error);
    throw error;
  }
};

export const paytrService = {
  generateToken,
  generateHash,
  verifyCallback,
  checkSettings,
  getPaytrSettings,
  updatePaytrSettings
};