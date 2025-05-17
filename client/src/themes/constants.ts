/**
 * Tema sabitleri
 * 
 * Uygulama genelinde kullanılan tema türleri ve özellikleri
 */

// Tema türleri
export enum THEMES {
  CLASSIC = 'classic',
  MODERN = 'modern',
  LUXURY = 'luxury',
  COASTAL = 'coastal',
  BOUTIQUE = 'boutique'
}

// Tema türü tipi
export type ThemeType = THEMES | string;

// Temaları değer olarak içeren nesne
const THEME_NAMES = Object.values(THEMES);

// Tema değerini kontrol eden fonksiyon
export function isValidTheme(theme: string): theme is THEMES {
  return THEME_NAMES.includes(theme as THEMES);
}

// Tema yapılandırması
export interface ThemeConfig {
  id: THEMES;
  name: string;
  description: string;
  icon: string;
  thumbnail: string;
}

// Tüm temalar
export const themeConfigs: ThemeConfig[] = [
  {
    id: THEMES.CLASSIC,
    name: 'Klasik',
    description: 'Geleneksel ve zamansız bir tasarım',
    icon: 'clock',
    thumbnail: '/themes/classic-theme.png',
  },
  {
    id: THEMES.MODERN,
    name: 'Modern',
    description: 'Sade ve minimalist, çağdaş stil',
    icon: 'square',
    thumbnail: '/themes/modern-theme.png',
  },
  {
    id: THEMES.LUXURY,
    name: 'Lüks',
    description: 'Zarif ve gösterişli premium tasarım',
    icon: 'gem',
    thumbnail: '/themes/luxury-theme.png',
  },
  {
    id: THEMES.COASTAL,
    name: 'Sahil',
    description: 'Ferah ve huzurlu deniz teması',
    icon: 'waves',
    thumbnail: '/themes/coastal-theme.png',
  },
  {
    id: THEMES.BOUTIQUE,
    name: 'Butik',
    description: 'Özel ve benzersiz sanatsal tasarım',
    icon: 'palette',
    thumbnail: '/themes/boutique-theme.png',
  }
];