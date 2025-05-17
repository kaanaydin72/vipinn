#!/bin/bash

# Çalışma dizinini ayarla
cd "$(dirname "$0")"

# Ortam değişkenleri
export NODE_ENV=production
export PORT=5000
export DATABASE_URL=postgresql://hoteluser:güvenli_şifre@localhost:5432/hotelapp
export SESSION_SECRET=ultra-gizli-key
export PAYTR_MERCHANT_ID=your_merchant_id
export PAYTR_MERCHANT_KEY=your_merchant_key
export PAYTR_MERCHANT_SALT=your_merchant_salt

# Hack: import.meta.dirname yerine geçici çözüm
export CLIENT_PATH=$(pwd)/client/src

# Uygulamayı başlat
node --experimental-specifier-resolution=node --experimental-import-meta-resolve start-server.js
