/**
 * Shared theme constants
 * 
 * Used both on the client and server for consistency
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