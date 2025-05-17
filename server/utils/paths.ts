import path from "path";
import { fileURLToPath } from "url";

// Node.js'de çeşitli ortamlarda çalışabilecek şekilde dizin ve dosya yollarını alma
export function getProjectRootDir() {
  // ESM için
  if (typeof import.meta.url !== 'undefined') {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      return path.resolve(__dirname, "../..");
    } catch (e) {
      // Hata durumunda alternatif yöntem
      console.warn("ESM path resolution failed, falling back to process.cwd()");
    }
  }
  
  // CJS için veya ESM başarısız olursa process.cwd() kullan
  return process.cwd();
}

// Client dizini yolunu al
export function getClientDir() {
  return path.resolve(getProjectRootDir(), "client");
}

// Client HTML dosyası yolunu al
export function getClientHtmlPath() {
  return path.resolve(getClientDir(), "index.html");
}

// Dist dizini yolunu al
export function getDistDir() {
  return path.resolve(getProjectRootDir(), "dist");
}

// Public dizini yolunu al
export function getPublicDir() {
  return path.resolve(getDistDir(), "public");
}