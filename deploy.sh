#!/bin/bash

echo "🔄 Deploy başlatılıyor..."

git pull origin main

echo "🚀 Proje yeniden başlatılıyor..."
pm2 restart all

echo "✅ Deploy tamamlandı!"
