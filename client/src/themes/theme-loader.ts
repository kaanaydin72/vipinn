import { ThemeType, THEMES } from './constants';

// CSS modülleri
import classicStyles from './classic.module.css';
import modernStyles from './modern.module.css';
import luxuryStyles from './luxury.module.css';
import coastalStyles from './coastal.module.css';
import boutiqueStyles from './boutique.module.css';

// Tema stilleri koleksiyonu tiplendirilmesi
type ThemeStyles = {
  [key in THEMES]: Record<string, string>;
};

// Tema stilleri koleksiyonu
const themeStyles: ThemeStyles = {
  [THEMES.CLASSIC]: classicStyles,
  [THEMES.MODERN]: modernStyles,
  [THEMES.LUXURY]: luxuryStyles,
  [THEMES.COASTAL]: coastalStyles,
  [THEMES.BOUTIQUE]: boutiqueStyles
};

// Tema renkleri koleksiyonu tiplendirilmesi
type ThemeColors = {
  [key in THEMES]: string;
};

// Tema renkleri koleksiyonu
const themeColors: ThemeColors = {
  [THEMES.CLASSIC]: '#1e40af',
  [THEMES.MODERN]: '#0f172a',
  [THEMES.LUXURY]: '#854d0e',
  [THEMES.COASTAL]: '#0891b2',
  [THEMES.BOUTIQUE]: '#7e22ce'
};

/**
 * Belirtilen tema için stil sınıflarını yükler
 * @param theme Tema türü
 * @returns CSS modül sınıfları
 */
export function getThemeClasses(theme: ThemeType): Record<string, string> {
  // theme bir enum değeri olduğundan emin olmak için
  const themeKey = Object.values(THEMES).includes(theme as THEMES) 
    ? theme as THEMES 
    : THEMES.CLASSIC;
  
  return themeStyles[themeKey];
}

/**
 * Temayı belge gövdesine uygular
 * @param theme Uygulanacak tema
 */
export function applyTheme(theme: ThemeType): Record<string, string> {
  // theme bir enum değeri olduğundan emin olmak için
  const themeKey = Object.values(THEMES).includes(theme as THEMES) 
    ? theme as THEMES 
    : THEMES.CLASSIC;
  
  // Eski tema sınıflarını temizle
  document.body.classList.forEach(cls => {
    if (cls.startsWith('theme-')) {
      document.body.classList.remove(cls);
    }
  });
  
  // Yeni tema sınıfını ekle
  document.body.classList.add(`theme-${themeKey}`);
  
  // Tema meta etiketini güncelle (tema rengi için)
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', themeColors[themeKey]);
  }
  
  return themeStyles[themeKey];
}

/**
 * Bir bileşen için tema sınıfını döndürür
 * @param theme Tema türü
 * @param componentClass Bileşen sınıfı (ör: 'card', 'button', vb.)
 * @returns Tema ve bileşene özel CSS sınıfı
 */
export function getThemeClass(theme: ThemeType, componentClass: string): string {
  // theme bir enum değeri olduğundan emin olmak için
  const themeKey = Object.values(THEMES).includes(theme as THEMES) 
    ? theme as THEMES 
    : THEMES.CLASSIC;
  
  const styles = themeStyles[themeKey];
  return styles[componentClass] || '';
}

/**
 * Bir bileşen için mevcut aktif temaya göre sınıfı döndürür
 * @param componentClass Bileşen sınıfı (ör: 'card', 'button', vb.)
 * @returns Aktif temaya göre bileşen CSS sınıfı
 */
export function getActiveThemeClass(componentClass: string): string {
  const activeThemeClass = document.body.classList.value
    .split(' ')
    .find(cls => cls.startsWith('theme-'));
    
  let activeTheme = THEMES.CLASSIC;
  
  if (activeThemeClass) {
    const themeName = activeThemeClass.replace('theme-', '');
    activeTheme = Object.values(THEMES).includes(themeName as THEMES)
      ? themeName as THEMES
      : THEMES.CLASSIC;
  }
    
  return getThemeClass(activeTheme, componentClass);
}