# Sorun Giderme ve SSS

## Sık Karşılaşılan Sorunlar ve Çözümleri

### 1. Uygulama PM2 ile başlatıldıktan sonra erişilemiyorsa

**Kontrol edilecekler:**

```bash
# PM2 log'ları kontrol et
pm2 logs hotel-app

# Uygulamanın çalıştığını doğrula
pm2 list

# Uygulamanın doğru portta dinlediğini kontrol et
sudo netstat -tuln | grep 9060

# Firewall ayarları kontrol et
sudo ufw status
```

**Çözümler:**

- Port çakışması: Başka bir uygulama aynı portu kullanıyor olabilir, portu değiştirin.
- .env dosyasındaki PORT değerini PM2 yapılandırma dosyasıyla uyumlu olacak şekilde ayarlayın.
- Firewall'da portu açın: `sudo ufw allow 9060/tcp`

### 2. Nginx proxy hatası alıyorsanız

**Kontrol edilecekler:**

```bash
# Nginx yapılandırma dosyasını kontrol et
sudo nginx -t

# Nginx hata günlüklerini inceleme
sudo tail -f /var/log/nginx/error.log

# Nginx servisinin çalıştığını doğrula
sudo systemctl status nginx
```

**Çözümler:**

- Nginx yapılandırma dosyasındaki sözdizimi hatalarını düzeltin.
- Proxy yönlendirme ayarlarını kontrol edin (doğru port ve adres).
- Nginx'i yeniden yükleyin: `sudo systemctl restart nginx`

### 3. Build ve derleme hataları

**Kontrol edilecekler:**

```bash
# Node.js ve npm sürümleri kontrol et
node -v
npm -v

# Bağımlılıkların tam olarak yüklendiğini kontrol et
npm ls --depth=0
```

**Çözümler:**

- `npm ci` kullanarak temiz kurulum yapın (node_modules klasörünü siler ve package-lock.json'a göre tam olarak yükler).
- Node.js sürüm uyumluluğunu kontrol edin (Node.js v18 önerilir).
- Disk alanı yetersizliğini kontrol edin: `df -h`

### 4. ESM modül çözümleme sorunları

**Hata örneği:** `Error [ERR_MODULE_NOT_FOUND]: Cannot find module ...` veya `Error [ERR_UNSUPPORTED_DIR_IMPORT]: Directory import ...`

**Çözümler:**

- `startup.sh` içinde Node.js'e gerekli flag'leri eklediğinizden emin olun:
  ```bash
  node --experimental-specifier-resolution=node --experimental-import-meta-resolve start-server.js
  ```
- Node.js 18.x veya üzeri sürüm kullandığınızdan emin olun.
- Dosya yolu çözümleme hatalarına karşı `server/utils/paths.ts` modülünün doğru yapılandırıldığından emin olun.

### 5. PayTR API entegrasyon sorunları

**Kontrol edilecekler:**

```bash
# Ortam değişkenlerinin ayarlandığından emin olun
grep -r "PAYTR" .env
pm2 env hotel-app | grep PAYTR
```

**Çözümler:**

- PayTR API anahtarlarının doğru olduğundan emin olun.
- API isteklerindeki hataları yakalamak için daha fazla log ekleyin.
- Aşağıdaki komutla PM2 ortam değişkenlerini güncelleyin:
  ```bash
  pm2 restart hotel-app --update-env
  ```

## SSL Sertifikası Yenileme

Certbot SSL sertifikalarını otomatik olarak yeniler, ancak bir sorun olursa:

```bash
# Manuel SSL yenileme
sudo certbot renew

# SSL durumunu kontrol etme
sudo certbot certificates
```

## Veritabanı Yedekleme ve Geri Yükleme

```bash
# PostgreSQL veritabanı yedekleme
pg_dump -U hoteluser -d hotelapp -f backup.sql

# Veritabanı geri yükleme
psql -U hoteluser -d hotelapp -f backup.sql
```

## PM2 Sık Kullanılan Komutlar

### PM2 Güncelleme

```bash
# PM2'yi global olarak güncelle
npm install -g pm2@latest

# Uygulamayı PM2'de güncelle
pm2 update
```

### PM2 İzleme

```bash
# Web tabanlı izleme arayüzü
pm2 plus

# Terminal tabanlı monitör
pm2 monit

# Uygulama durumunu görüntüle
pm2 show hotel-app
```

### PM2 Günlük Yönetimi

```bash
# Günlükleri temizle
pm2 flush

# Günlük dosyalarının yerini değiştir
pm2 restart hotel-app --log /new/log/path.log

# Günlük döndürme
pm2 install pm2-logrotate
```

## Sunucu Performans İzleme

```bash
# Canlı sistem monitörü
htop

# Disk kullanımı
du -h --max-depth=1 /home/ubuntuuser/projects/vipinn

# Canlı ağ trafiği
sudo iftop
```

## Bağlantı Sorunları için Kontroller

```bash
# DNS ayarlarını kontrol et
dig herach.com

# Alan adı bağlantısını doğrula
ping herach.com

# Port açık mı kontrol et
nc -zv herach.com 80
nc -zv herach.com 443
```

## Önemli Uyarılar

1. Node.js ESM modülleriyle çalışırken path çözümleme sorunları yaygındır. Her zaman `--experimental-specifier-resolution=node` flag'ini kullanın.

2. PM2 ortam değişkenleri, uygulama yeniden başlatıldığında sıfırlanmaz. Değişkenleri güncellemek için `--update-env` flag'ini kullanın:
   ```bash
   pm2 restart hotel-app --update-env
   ```

3. SSL sertifikaları 90 günde bir yenilenmeli, Certbot bunu genellikle otomatik olarak yapar.

4. Nginx yapılandırması değiştikten sonra mutlaka `sudo nginx -t` komutuyla sözdizimini kontrol edin ve ardından `sudo systemctl reload nginx` ile yükleyin.

5. Disk alanının dolu olması beklenmedik hatalara neden olabilir. Düzenli olarak `df -h` ile kontrol edin.

6. Güvenlik güncellemeleri için sistemi düzenli olarak güncelleyin:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```