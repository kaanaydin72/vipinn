// ESM modüllerini kullanmadan önce gerekli polyfill'leri ekleyelim
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

// Node.js ortamını hazırlayalım
if (typeof global.__filename === 'undefined') {
  global.__filename = fileURLToPath(import.meta.url);
  global.__dirname = dirname(__filename);
  global.require = createRequire(import.meta.url);
}

// Path çözümleme hatalarını önlemek için
process.env.NODE_OPTIONS = '--experimental-specifier-resolution=node --experimental-import-meta-resolve';

// Uygulamayı başlatalım
import './dist/index.js';