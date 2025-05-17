import { useContext } from "react";
import { ThemeContext } from "@/contexts/new-theme-provider";
import { ThemeType } from "@/themes";

/**
 * Tema stillerine erişmek için hook
 * @returns Tema bağlamı değerleri
 */
export function useThemeStyles() {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error("useThemeStyles must be used within a ThemeProvider");
  }
  
  return context;
}

/**
 * Belirli bir bileşen için tema sınıfını döndüren yardımcı fonksiyon
 * @param componentClass Bileşen CSS sınıf adı
 * @returns Tema sınıfı
 */
export function useThemeClass(componentClass: string) {
  const { themeClasses } = useThemeStyles();
  return themeClasses[componentClass] || '';
}

/**
 * Mevcut tema adını döndürür
 * @returns Aktif tema adı
 */
export function useCurrentTheme(): ThemeType {
  const { currentTheme } = useThemeStyles();
  return currentTheme;
}

/**
 * Tema değiştirme fonksiyonunu döndüren hook
 * @returns Tema değiştirme fonksiyonu
 */
export function useSetTheme() {
  const { setTheme } = useThemeStyles();
  return setTheme;
}

/**
 * Site çapında tema değiştirme fonksiyonunu döndüren hook (admin için)
 * @returns Site çapında tema değiştirme fonksiyonu
 */
export function useSetGlobalTheme() {
  const { setGlobalTheme } = useThemeStyles();
  return setGlobalTheme;
}