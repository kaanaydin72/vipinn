import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  
  const themes = [
    { id: "classic", name: "Klasik", colorClass: "bg-primary" },
    { id: "modern", name: "Modern", colorClass: "bg-emerald-500" },
    { id: "luxury", name: "Lüks", colorClass: "bg-amber-500" },
    { id: "coastal", name: "Sahil", colorClass: "bg-sky-500" },
    { id: "boutique", name: "Butik", colorClass: "bg-purple-500" }
  ];
  
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground font-heading">Tema Seçenekleri</h2>
        <p className="mt-2 text-muted-foreground">Sitenizin görünümünü zevkinize göre özelleştirin</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {themes.map((themeOption) => (
          <Button
            key={themeOption.id}
            variant="outline"
            className={cn(
              "theme-preview flex flex-col items-center p-4 rounded-lg border hover:border-primary hover:shadow-md transition duration-200",
              theme === themeOption.id && "ring-2 ring-primary scale-105"
            )}
            onClick={() => setTheme(themeOption.id)}
          >
            <div className="w-full h-20 mb-3 bg-white border border-neutral-200 rounded flex items-center justify-center">
              <div className={cn("w-4 h-4 rounded-full", themeOption.colorClass)}></div>
            </div>
            <span className="text-sm font-medium text-foreground">{themeOption.name}</span>
          </Button>
        ))}
      </div>
    </section>
  );
}
