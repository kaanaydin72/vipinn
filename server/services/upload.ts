import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getPublicDir } from '../utils/paths';

// Yükleme dizini
//const uploadDir = path.join(getPublicDir(), 'uploads');
 const uploadDir = path.resolve('dist/public/uploads');

// Dizinin var olduğundan emin olalım
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Depolama konfigürasyonu
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Benzersiz dosya adı oluştur
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
  }
});

// Dosya filtreleme (sadece resim dosyalarını kabul et)
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Sadece .jpeg, .jpg, .png, .gif ve .webp formatındaki resimler kabul edilir'));
  }
};

// Multer yapılandırması
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 5MB max boyut
  }
});

// Yüklenen dosya yolunu URL'e çevirme yardımcı fonksiyonu
export function getFileUrl(filename: string): string {
  if (!filename) return '';
  return `/uploads/${filename}`;
}

// Dosya silme işlemi
export function deleteFile(filename: string): boolean {
  try {
    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Dosya silinirken hata oluştu:', error);
    return false;
  }
}
