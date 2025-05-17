# Ubuntu Sunucu Kurulum Rehberi

Bu rehber, hotel-app uygulamasını Ubuntu sunucunuzda Nginx ve PM2 kullanarak nasıl kurulacağını adım adım anlatmaktadır.

## Sunucu Bilgileri
- **IP Adresi:** 165.140.216.134
- **Domain:** herach.com
- **Kullanıcı:** ubuntuuser
- **Proje Dizini:** ~/projects/vipinn

## 1. Node.js ve npm Kurulumu

```bash
# Gerekli paketleri güncelle
sudo apt update

# Node.js ve npm kur (Node.js v18 önerilen)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Sürümleri kontrol et
node -v  # v18.x görmelisiniz
npm -v   # 9.x veya üzeri görmelisiniz
```

## 2. PostgreSQL Kurulumu (veritabanı kullanıyorsak)

```bash
# PostgreSQL kurulumu
sudo apt install -y postgresql postgresql-contrib

# PostgreSQL servisini başlat
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Veritabanı ve kullanıcı oluştur
sudo -u postgres psql -c "CREATE DATABASE hotelapp;"
sudo -u postgres psql -c "CREATE USER hoteluser WITH ENCRYPTED PASSWORD 'güvenli_şifre';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE hotelapp TO hoteluser;"
```

## 3. PM2 Kurulumu

```bash
# PM2'yi global olarak kur
sudo npm install -g pm2

# PM2'nin sistem başlangıcında otomatik başlamasını ayarla
pm2 startup ubuntu
# (Çıktıdaki komutu çalıştır)
```

## 4. Nginx Kurulumu ve Yapılandırması

```bash
# Nginx kur
sudo apt install -y nginx

# Nginx'i başlat ve sistem başlangıcında otomatik başlamasını sağla
sudo systemctl start nginx
sudo systemctl enable nginx

# Firewall'u yapılandır (gerekirse)
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable
```

## 5. Proje Dosyalarını Kopyalama

```bash
# Proje dizinini oluştur
mkdir -p ~/projects/vipinn

# Projeyi sunucuya kopyalamak için git kullan (önerilen)
cd ~/projects/vipinn
git clone <repo_url> .

# Ya da SFTP/SCP ile dosyaları yerel bilgisayarınızdan kopyalayın
# (Yerel bilgisayarınızda çalıştır)
# scp -r ./project_files ubuntuuser@165.140.216.134:~/projects/vipinn
```

## 6. Uygulama Bağımlılıklarını Kurma ve Yapılandırma

```bash
# Projede npm paketlerini kur
cd ~/projects/vipinn
npm install

# .env dosyasını oluştur
cat > .env << EOL
NODE_ENV=production
PORT=9060
DATABASE_URL=postgresql://hoteluser:güvenli_şifre@localhost:5432/hotelapp
# PayTR API bilgileri
PAYTR_MERCHANT_ID=your_merchant_id
PAYTR_MERCHANT_KEY=your_merchant_key
PAYTR_MERCHANT_SALT=your_merchant_salt
EOL
```

## 7. Uygulamayı Build Etme

```bash
# Uygulamayı build et
npm run build
```

## 8. PM2 ile Uygulamayı Başlatma

```bash
# PM2 ekosistem dosyası oluştur
cat > ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: 'hotel-app',
    script: './startup.sh',
    env: {
      NODE_ENV: 'production',
      PORT: 9060
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
EOL

# PM2 ile uygulamayı başlat
pm2 start ecosystem.config.js

# PM2 yapılandırmasını kaydet (sistem yeniden başlatıldığında otomatik başlaması için)
pm2 save
```

## 9. Nginx Sunucu Bloku Yapılandırması

```bash
# Nginx site yapılandırması oluştur
sudo cat > /etc/nginx/sites-available/herach.com << EOL
server {
    listen 80;
    server_name herach.com www.herach.com;

    location / {
        proxy_pass http://localhost:9060;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Nginx site yapılandırmasını etkinleştir
sudo ln -s /etc/nginx/sites-available/herach.com /etc/nginx/sites-enabled/

# Nginx yapılandırmasını test et
sudo nginx -t

# Nginx'i yeniden başlat
sudo systemctl restart nginx
```

## 10. SSL Sertifikası Eklemek (HTTPS için)

```bash
# Certbot kur
sudo apt install -y certbot python3-certbot-nginx

# SSL sertifikası al ve otomatik olarak Nginx'i yapılandır
sudo certbot --nginx -d herach.com -d www.herach.com

# SSL otomatik yenilemeyi test et
sudo certbot renew --dry-run
```

## 11. Uygulamayı Güncellemek İçin

```bash
# Proje dizinine git
cd ~/projects/vipinn

# Yeni değişiklikleri çek (git kullanıyorsak)
git pull

# Bağımlılıkları güncelle
npm install

# Uygulamayı yeniden build et
npm run build

# PM2 ile uygulamayı yeniden başlat
pm2 restart hotel-app
```

## 12. Hata Ayıklama

```bash
# PM2 log'larını görüntüle
pm2 logs hotel-app

# Nginx log'larını kontrol et
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Sistem servislerinin durumunu kontrol et
sudo systemctl status nginx
sudo systemctl status postgresql
```

## Önemli Notlar

1. Güvenlik duvarı (firewall) yapılandırmasını sunucunuzun güvenlik ihtiyaçlarına göre ayarlayın.
2. PostgreSQL şifresini güçlü bir şifreyle değiştirin.
3. Üretim ortamında daima HTTPS kullanın.
4. `.env` dosyasında bulunan API anahtarlarını ve diğer hassas bilgileri güvende tutun.
5. Düzenli olarak sunucu ve uygulama yedeklerini alın.

## PM2 Sık Kullanılan Komutlar

```bash
# Tüm uygulamaları listele
pm2 list

# Uygulama yeniden başlat
pm2 restart hotel-app

# Uygulamayı durdur
pm2 stop hotel-app

# Uygulamayı tamamen kaldır
pm2 delete hotel-app

# Detaylı izleme
pm2 monit

# Performans izleme
pm2 dashboard
```