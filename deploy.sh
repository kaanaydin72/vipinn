#!/bin/bash

echo "🔄 Deploy başlatılıyor..."

git pull origin main

echo "🚀 Proje yeniden başlatılıyor..."
pm2 restart all

echo "✅ Deploy tamamlandı!"

echo "📂 Upload klasörü oluşturuluyor..."
mkdir -p dist/public/uploads
chmod -R 777 dist/public/uploads
touch dist/public/uploads/.gitkeep
