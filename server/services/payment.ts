/**
 * Ödeme işlemlerini yöneten servis modülü
 * PayTR entegrasyonunu kullanarak rezervasyonlar için ödeme işlemleri yapar
 */

import { paytrService } from "./paytr";
import { storage } from "../storage";
import { Reservation, User } from "@shared/schema";

// Ödeme yöntemleri
export type PaymentMethod = 'credit_card' | 'on_site';

/**
 * Rezervasyon için ödeme başlat
 * Ödeme yöntemine göre işlem yapar
 * 
 * @param reservationId - Rezervasyon ID
 * @param paymentMethod - Ödeme yöntemi 
 * @param userId - Kullanıcı ID
 * @param requestDetails - İstek detayları
 */
export const initiatePayment = async (
  reservationId: number,
  paymentMethod: PaymentMethod,
  userId: number,
  requestDetails: {
    userIp: string,
    baseUrl: string,
  }
): Promise<{
  success: boolean,
  message: string,
  reservationId?: number,
  paymentMethod?: string,
  paymentStatus?: string,
  paymentUrl?: string,
  token?: string
}> => {
  try {
    // Rezervasyon bilgilerini al
    const reservation = await storage.getReservation(reservationId);
    if (!reservation) {
      throw new Error('Rezervasyon bulunamadı');
    }
    
    // Kullanıcı bilgilerini al
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }
    
    // Kullanıcı rezervasyonun sahibi mi kontrol et
    if (reservation.userId !== userId) {
      throw new Error('Bu rezervasyonu başlatma yetkiniz yok');
    }
    
    // Ödeme yöntemine göre işlem yap
    if (paymentMethod === 'on_site') {
      // Otelde ödeme - Doğrudan rezervasyonu onayla
      await storage.updateReservationPayment(
        reservationId,
        'on_site',
        'pending',
        null
      );
      
      return {
        success: true,
        message: 'Rezervasyon başarıyla oluşturuldu. Ödeme otelde yapılacak.',
        reservationId,
        paymentMethod: 'on_site',
        paymentStatus: 'pending'
      };
    } else if (paymentMethod === 'credit_card') {
      // Kredi kartı ile ödeme - PayTR entegrasyonu kullan
      
      // Callback URL'leri oluştur
      const callbackUrl = `${requestDetails.baseUrl}/api/payments/paytr-callback`;
      const successUrl = `${requestDetails.baseUrl}/payment-success`;
      const failUrl = `${requestDetails.baseUrl}/payment-fail`;
      
      // PayTR token oluştur
      const paytrResult = await paytrService.generateToken(
        reservation,
        user,
        callbackUrl,
        requestDetails.userIp,
        successUrl,
        failUrl
      );
      
      // Ödeme kaydını güncelle
      await storage.updateReservationPayment(
        reservationId,
        'credit_card',
        'pending',
        paytrResult.token
      );
      
      console.log('PayTR Ödeme bilgileri:', {
        token: paytrResult.token,
        paymentUrl: paytrResult.paymentUrl
      });
      
      // Başarılı sonucu döndür
      return {
        success: true,
        message: 'Ödeme işlemi başarıyla başlatıldı',
        reservationId,
        paymentMethod: 'credit_card',
        paymentStatus: 'pending',
        paymentUrl: paytrResult.paymentUrl,
        token: paytrResult.token
      };
    } else {
      throw new Error('Geçersiz ödeme yöntemi');
    }
  } catch (error: any) {
    console.error('Ödeme başlatılırken hata:', error);
    return {
      success: false,
      message: error.message || 'Ödeme işlemi başlatılamadı'
    };
  }
};

/**
 * PayTR callback isteğini işle
 * 
 * @param callbackData - PayTR'den gelen callback verileri 
 */
export const handlePaytrCallback = async (
  callbackData: Record<string, string>
): Promise<{
  success: boolean,
  message: string,
  status?: string
}> => {
  try {
    // Callback verisinin hash değerini doğrula
    const isValid = paytrService.verifyCallback(callbackData);
    if (!isValid) {
      throw new Error('Geçersiz callback hash değeri');
    }
    
    // Gerekli callback parametrelerini al
    const {
      merchant_oid,
      status,
      total_amount
    } = callbackData;
    
    // İşlem kaydını bul
    const transaction = await storage.getPaytrTransactionByMerchantOid(merchant_oid);
    if (!transaction) {
      throw new Error('İşlem kaydı bulunamadı');
    }
    
    // İşlem durumunu güncelle
    const newStatus = status === 'success' ? 'completed' : 'failed';
    await storage.updatePaytrTransactionStatus(
      transaction.id,
      newStatus,
      JSON.stringify(callbackData)
    );
    
    // Rezervasyon ödeme durumunu güncelle
    if (status === 'success') {
      await storage.updateReservationPayment(
        transaction.reservationId,
        'credit_card',
        'completed',
        transaction.token
      );
    } else {
      await storage.updateReservationPayment(
        transaction.reservationId,
        'credit_card',
        'failed',
        transaction.token
      );
    }
    
    return {
      success: true,
      message: 'Callback başarıyla işlendi',
      status: newStatus
    };
  } catch (error: any) {
    console.error('PayTR callback işlenirken hata:', error);
    return {
      success: false,
      message: error.message || 'Callback işlenemedi'
    };
  }
};