/**
 * PayTR ödeme entegrasyonu servis modülü
 * PayTR ile ilgili tüm işlemleri yönetir: token oluşturma, hash hesaplama, ödeme başlatma
 * 
 * API Dokümanı: https://www.paytr.com/entegrasyon/iframe-entegrasyonu
 */

import { Reservation, User } from "@shared/schema";
import { storage } from "../storage";
import { createHmac } from "crypto";
import https from "https";

// ENV’den sabitleri al
const MERCHANT_ID = process.env.PAYTR_MERCHANT_ID || "";
const MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY || "";
const MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT || "";

const checkSettings = () => {
  if (!MERCHANT_ID || !MERCHANT_KEY || !MERCHANT_SALT) {
    throw new Error('PayTR ayarları eksik. Lütfen .env dosyanızı kontrol edin.');
  }
  return true;
};

// Kullanıcı IP’sini BASE64 yap
const generateUserIP = (ip: string): string => {
  return Buffer.from(ip).toString('base64');
};

// PayTR dokümantasyonuna göre token oluşturma
function generatePaytrToken(params: any) {
  // Sıra DOKÜMANTASYONLA BİREBİR UYUMLU OLMALI
  const hash_str = 
    params.merchant_id +
    params.user_ip +
    params.merchant_oid +
    params.email +
    params.payment_amount +
    params.user_basket +
    params.no_installment +
    params.max_installment +
    params.currency +
    params.test_mode +
    MERCHANT_SALT;

  return createHmac('sha256', MERCHANT_KEY).update(hash_str).digest('base64');
}

// Ana token fonksiyonu
const generateToken = async (
  reservation: Reservation, 
  user: User, 
  callbackUrl: string, 
  userIp: string,
  successUrl: string,
  failUrl: string
): Promise<{ token: string, paymentUrl: string }> => {
  const { merchantId, merchantKey, merchantSalt, testMode } = await getPaytrSettings();
  console.log("PAYTR KULLANILAN MerchantId:", merchantId, "Key:", merchantKey.substring(0,4) + "...", "Salt:", merchantSalt.substring(0,4) + "...", "testMode:", testMode);



  const room = await storage.getRoom(reservation.roomId);
  if (!room) throw new Error('Oda bilgileri bulunamadı');
  const hotel = await storage.getHotel(room.hotelId);
  if (!hotel) throw new Error('Otel bilgileri bulunamadı');

  const basketItems = [
    {
      name: `${hotel.name} - ${room.name}`,
      price: reservation.totalPrice.toString(),
      count: 1
    }
  ];

  const userBasketEncoded = Buffer.from(JSON.stringify(basketItems)).toString('base64');
  const merchantOid = reservation.reservationCode || `VIPINN${reservation.id}`;
  const userIpEncoded = generateUserIP(userIp);

  const email = user.email || 'misafir@vipinnhotels.com';
  const nameSurname = user.fullName || user.username;
  const address = 'Türkiye';
  const phone = user.phone || '5555555555';

  // PayTR kuruş cinsinden istiyor, minimum 100 (1 TL)
  const paymentAmount = Math.max(Math.floor(reservation.totalPrice * 100), 100);

  // DİKKAT: Tüm parametreler string olsun!
  const params: Record<string, string> = {
    merchant_id: MERCHANT_ID,
    user_ip: userIpEncoded,
    merchant_oid: merchantOid,
    email,
    payment_amount: paymentAmount.toString(),
    currency: 'TL',
    user_basket: userBasketEncoded,
    no_installment: "0",
    max_installment: "0",
    test_mode: "0", // canlıda 0 yap!
    paytr_token: "",
    debug_on: "1",
    non_3d: "0",
    merchant_ok_url: successUrl,
    merchant_fail_url: failUrl,
    user_name: nameSurname,
    user_address: address,
    user_phone: phone
  };

  // Tokeni oluştur ve params’a ekle
  const paytr_token = generatePaytrToken(params);
  params.paytr_token = paytr_token;

  // DEBUG: Gönderilecek parametre ve post datası
  console.log("PAYTR PARAMS (POSTDATA):", params);
  const postData = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    postData.append(key, value);
  });
  console.log("PAYTR POST DATA:", postData.toString());

  // PayTR API’ye istek at
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.paytr.com',
      port: 443,
      path: '/odeme/api/get-token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData.toString())
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          console.log('PayTR API raw response:', data);
          if (!data || data.trim() === '') {
            console.error('Empty response from PayTR API');
            reject(new Error('Empty response from PayTR API'));
            return;
          }
          const response = JSON.parse(data);
          if (response.status === 'success') {
            const paymentUrl = `https://www.paytr.com/odeme/guvenli/${response.token}`;
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

// Callback hash doğrulama (aynı kalabilir)
import { createHash } from "crypto";
const verifyCallback = (params: Record<string, string>): boolean => {
  try { checkSettings(); } catch (error) { return false; }
  const { hash_params, hash } = params;
  if (!hash_params || !hash) return false;
  const hashParamsArr = hash_params.split('|');
  const hashStr = hashParamsArr.map(param => params[param]).join('');
  const calculatedHash = createHash('sha256')
    .update(MERCHANT_KEY + hashStr + MERCHANT_SALT)
    .digest('base64');
  return calculatedHash === hash;
};

// Diğer ayar fonksiyonları:
// Diğer ayar fonksiyonları:
const getPaytrSettings = async () => {
  // Sadece veritabanından ayarları çekiyoruz
  const settings = await storage.getPaytrSettings();
  if (!settings || !settings.merchantId || !settings.merchantKey || !settings.merchantSalt) {
    throw new Error(
      "PayTR ayarları veritabanında bulunamadı! Lütfen admin panelinden Merchant ID, Key ve Salt bilgisini girin."
    );
  }
  return {
    merchantId: settings.merchantId,
    merchantKey: settings.merchantKey,
    merchantSalt: settings.merchantSalt,
    testMode: !!settings.testMode
  };
};

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
  verifyCallback,
  checkSettings,
  getPaytrSettings,
  updatePaytrSettings
};

