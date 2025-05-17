import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ThemeOption {
  id: string;
  name: string;
  color: string;
  darkMode: boolean;
}

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  
  const themeOptions: ThemeOption[] = [
    {
      id: "classic",
      name: "Klasik",
      color: "#2563EB",
      darkMode: false
    },
    {
      id: "modern",
      name: "Modern",
      color: "#10B981",
      darkMode: false
    },
    {
      id: "luxury",
      name: "Lüks",
      color: "#F59E0B",
      darkMode: true
    },
    {
      id: "coastal",
      name: "Sahil",
      color: "#0EA5E9",
      darkMode: false
    },
    {
      id: "boutique",
      name: "Butik",
      color: "#8B5CF6",
      darkMode: false
    },
  ];
  
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-800 font-heading">Tema Seçenekleri</h2>
        <p className="mt-2 text-neutral-600">Sitenizin görünümünü zevkinize göre özelleştirin</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {themeOptions.map((option) => (
          <Button
            key={option.id}
            variant="outline"
            className={`flex flex-col items-center p-4 rounded-lg border hover:border-primary hover:shadow-md transition duration-200 transform hover:scale-105 h-auto ${
              theme === option.id ? "ring-2 ring-primary scale-110" : ""
            }`}
            onClick={() => setTheme(option.id as any)}
          >
            <div className={`w-full h-20 mb-3 ${option.darkMode ? "bg-neutral-900" : "bg-white"} border ${option.darkMode ? "border-neutral-700" : "border-neutral-200"} rounded flex items-center justify-center`}>
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: option.color }}></div>
            </div>
            <span className="text-sm font-medium text-neutral-700">{option.name}</span>
          </Button>
        ))}
      </div>
    </section>
  );
}
