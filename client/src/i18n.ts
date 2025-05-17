import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import commonEN from './locales/en/common.json';
import commonTR from './locales/tr/common.json';

// İlk olarak bu dilleri ve çevirileri tanımlıyoruz
const resources = {
  en: {
    common: commonEN
  },
  tr: {
    common: commonTR
  }
};

i18n
  // Otomatik dil algılama ayarları
  .use(LanguageDetector)
  // React ile entegrasyon
  .use(initReactI18next)
  // Başlangıç yapılandırması
  .init({
    resources,
    fallbackLng: 'tr', // Varsayılan dil
    debug: process.env.NODE_ENV === 'development',
    
    // Kullanılacak ad alanları
    ns: ['common'],
    defaultNS: 'common',
    
    // Çevirilerin nasıl yükleneceği
    interpolation: {
      escapeValue: false // React zaten XSS koruması sağlıyor
    },
    
    // Dil algılama seçenekleri
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });

export default i18n;