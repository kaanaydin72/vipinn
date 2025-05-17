import { useContext } from "react";
import { ThemeContext } from "@/contexts/theme-provider";
import { ThemeType } from "@/themes";

/**
 * Ana tema hook'u
 * @returns Tema bağlamı
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

/**
 * Mevcut tema adını döndürür
 * @returns Aktif tema adı
 */
export function useActiveThemeName(): ThemeType {
  const { currentTheme } = useTheme();
  return currentTheme;
}

/**
 * Belirli bir bileşen için tema sınıfını döndüren yardımcı fonksiyon
 * @param componentClass Bileşen CSS sınıf adı
 * @returns Tema sınıfı
 */
export function useThemeClass(componentClass: string) {
  const { themeClasses } = useTheme();
  return themeClasses[componentClass] || '';
}

/**
 * Tema değiştirme fonksiyonunu döndüren hook
 * @returns Tema değiştirme fonksiyonu
 */
export function useChangeTheme() {
  const { setTheme } = useTheme();
  return setTheme;
}

/**
 * Site çapında tema değiştirme fonksiyonunu döndüren hook (admin için)
 * @returns Site çapında tema değiştirme fonksiyonu
 */
export function useChangeGlobalTheme() {
  const { setGlobalTheme } = useTheme();
  return setGlobalTheme;
}
