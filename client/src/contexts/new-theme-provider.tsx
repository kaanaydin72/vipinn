import { createContext, ReactNode, useEffect, useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ThemeType, THEMES, themeConfigs, applyTheme, getThemeClasses } from "@/themes";

// Tema bağlamı türleri
type ThemeContextType = {
  currentTheme: ThemeType;
  themeClasses: Record<string, string>;
  availableThemes: typeof themeConfigs;
  isLoading: boolean;
  setTheme: (theme: ThemeType) => void;
  setGlobalTheme: (theme: ThemeType) => void;
};

// Tema bağlamı
export const ThemeContext = createContext<ThemeContextType | null>(null);

// Tema sağlayıcı bileşeni
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(THEMES.CLASSIC);
  const [themeClasses, setThemeClasses] = useState(getThemeClasses(THEMES.CLASSIC));
  
  // Site çapında tema ayarını API'den al
  const { data: siteTheme, isLoading } = useQuery<{theme: ThemeType}>({
    queryKey: ["/api/site-settings/theme"]
  });
  
  // Site çapında tema değiştirme
  const changeGlobalThemeMutation = useMutation({
    mutationFn: async (newTheme: ThemeType) => {
      const res = await apiRequest("POST", `/api/site-settings/theme`, { theme: newTheme });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings/theme"] });
      toast({
        title: "Site Teması Değiştirildi",
        description: "Tüm kullanıcılar için varsayılan tema güncellendi.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Tema Değiştirilemedi",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Sayfa yüklendiğinde tema tercihini kontrol et
  useEffect(() => {
    const savedTheme = localStorage.getItem("preferredTheme") as ThemeType | null;
    
    if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
      updateTheme(savedTheme);
    } else if (siteTheme && 'theme' in siteTheme) {
      // Yerel tercih yoksa, site temasını kullan
      updateTheme(siteTheme.theme);
    }
  }, [siteTheme]);
  
  // Temayı güncelleyen yardımcı fonksiyon
  const updateTheme = (newTheme: ThemeType) => {
    setCurrentTheme(newTheme);
    const appliedTheme = applyTheme(newTheme);
    setThemeClasses(getThemeClasses(newTheme));
  };
  
  // Kullanıcı temasını değiştir ve yerel olarak sakla
  const setTheme = (newTheme: ThemeType) => {
    updateTheme(newTheme);
    localStorage.setItem("preferredTheme", newTheme);
  };
  
  // Site çapında temayı değiştir (admin kullanıcılar için)
  const setGlobalTheme = (newTheme: ThemeType) => {
    updateTheme(newTheme);
    changeGlobalThemeMutation.mutate(newTheme);
  };
  
  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        themeClasses,
        availableThemes: themeConfigs,
        isLoading,
        setTheme,
        setGlobalTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}