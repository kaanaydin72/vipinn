import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { THEMES, ThemeType, isValidTheme } from "@shared/themes";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, PaintBucket, CheckCircle, PaletteIcon, Loader2 } from "lucide-react";

export default function ThemeManagementMobile() {
  const [theme, setTheme] = useState<ThemeType>(THEMES.CLASSIC);
  const [tab, setTab] = useState("site");
  const { toast } = useToast();

  // Load theme from server when component mounts
  useEffect(() => {
    fetch('/api/site-settings/theme')
      .then(res => res.json())
      .then(data => {
        if (isValidTheme(data.theme)) {
          setTheme(data.theme);
        }
      })
      .catch(err => {
        console.error("Tema bilgisi alınamadı:", err);
      });
  }, []);

  // Update site-wide theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: async (newTheme: ThemeType) => {
      const response = await apiRequest("POST", "/api/site-settings/theme", { theme: newTheme });
      return response.json();
    },
    onSuccess: (data) => {
      setTheme(data.theme);
      toast({
        title: "Tema güncellendi",
        description: "Site teması başarıyla güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/site-settings/theme'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Tema güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleThemeChange = (value: string) => {
    if (isValidTheme(value)) {
      updateThemeMutation.mutate(value);
    }
  };

  const containerAnimation = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const getThemePreviewPath = (themeType: string) => {
    return `/images/themes/${themeType.toLowerCase()}_preview.jpg`;
  };

  const themeOptions = [
    { id: THEMES.CLASSIC, title: "Klasik", description: "Zarif ve klasik bir tasarım" },
    { id: THEMES.MODERN, title: "Modern", description: "Minimal ve çağdaş bir tasarım" },
    { id: THEMES.LUXURY, title: "Lüks", description: "Zengin ve sofistike bir tasarım" },
    { id: THEMES.COASTAL, title: "Sahil", description: "Ferah ve dinlendirici bir tasarım" },
    { id: THEMES.BOUTIQUE, title: "Butik", description: "Benzersiz ve özelleştirilmiş bir tasarım" }
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* iOS/Android tarzı başlık */}
      <div className="sticky top-0 z-10">
        <div className="bg-gradient-to-r from-[#2094f3] to-[#38b6ff] text-white shadow-md">
          <div className="flex items-center px-4 h-14">
            <Button variant="ghost" size="icon" className="text-white" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="flex-1 text-center font-semibold text-lg">Tema Yönetimi</h1>
            <Button variant="ghost" size="icon" className="text-white">
              <PaletteIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="site" className="w-full" value={tab} onValueChange={setTab}>
          <div className="mb-4 border rounded-lg overflow-hidden">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="site" className="text-sm py-3">Site Teması</TabsTrigger>
              <TabsTrigger value="preview" className="text-sm py-3">Tema Önizleme</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="site" className="mt-0">
            <RadioGroup 
              value={theme} 
              onValueChange={handleThemeChange} 
              className="space-y-4"
            >
              <motion.div 
                variants={containerAnimation}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {themeOptions.map((option) => (
                  <motion.div key={option.id} variants={itemAnimation}>
                    <Card 
                      className={`relative overflow-hidden transition-all duration-150 ${
                        theme === option.id ? 'border-[#2094f3] ring-2 ring-[#2094f3]/20' : 'border-neutral-200'
                      }`}
                    >
                      <label className="block cursor-pointer">
                        <div className="absolute top-3 right-3 z-10">
                          {theme === option.id && (
                            <CheckCircle className="h-6 w-6 text-[#2094f3] fill-white" />
                          )}
                        </div>
                        <div className="aspect-[16/9] w-full overflow-hidden">
                          <img 
                            src={getThemePreviewPath(option.id)} 
                            alt={`${option.title} teması`} 
                            className="w-full h-full object-cover"
                            onError={(e) => { 
                              e.currentTarget.src = "https://via.placeholder.com/400x225?text=Tema+Önizleme"; 
                            }}
                          />
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-start">
                            <RadioGroupItem 
                              value={option.id} 
                              id={option.id} 
                              className="mt-1 mr-3"
                            />
                            <div>
                              <Label htmlFor={option.id} className="font-medium text-base cursor-pointer">
                                {option.title}
                              </Label>
                              <p className="text-sm text-neutral-500 mt-0.5">{option.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </label>
                    </Card>
                  </motion.div>
                ))}
                
                {updateThemeMutation.isPending && (
                  <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-4 shadow-lg flex items-center space-x-3">
                      <Loader2 className="animate-spin h-5 w-5 text-[#2094f3]" />
                      <p>Tema uygulanıyor...</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </RadioGroup>
          </TabsContent>
          
          <TabsContent value="preview" className="mt-0">
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="aspect-[16/9] w-full overflow-hidden rounded-lg mb-4">
                <img 
                  src={getThemePreviewPath(theme)}
                  alt={`${theme} teması önizleme`} 
                  className="w-full h-full object-cover"
                  onError={(e) => { 
                    e.currentTarget.src = "https://via.placeholder.com/400x225?text=Tema+Önizleme"; 
                  }}
                />
              </div>
              
              <h3 className="font-semibold text-lg mb-1">
                {themeOptions.find(t => t.id === theme)?.title || 'Tema'} Önizlemesi
              </h3>
              <p className="text-sm text-neutral-600 mb-4">
                Bu tema şu anda site genelinde aktif.
              </p>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="aspect-square rounded-md bg-neutral-100 flex items-center justify-center">
                  <div className={`w-8 h-8 rounded-full bg-${theme === THEMES.CLASSIC ? 'gray' : theme === THEMES.LUXURY ? 'amber' : theme === THEMES.MODERN ? 'zinc' : theme === THEMES.COASTAL ? 'blue' : 'purple'}-500`}></div>
                </div>
                <div className="aspect-square rounded-md bg-neutral-100 flex items-center justify-center">
                  <div className={`w-8 h-8 rounded bg-${theme === THEMES.CLASSIC ? 'gray' : theme === THEMES.LUXURY ? 'amber' : theme === THEMES.MODERN ? 'zinc' : theme === THEMES.COASTAL ? 'blue' : 'purple'}-500`}></div>
                </div>
                <div className="aspect-square rounded-md bg-neutral-100 flex items-center justify-center">
                  <div className={`w-8 h-8 rounded-xl bg-${theme === THEMES.CLASSIC ? 'gray' : theme === THEMES.LUXURY ? 'amber' : theme === THEMES.MODERN ? 'zinc' : theme === THEMES.COASTAL ? 'blue' : 'purple'}-500`}></div>
                </div>
              </div>

              <Button 
                onClick={() => setTab("site")} 
                className="bg-[#2094f3] w-full"
              >
                <PaintBucket className="h-4 w-4 mr-2" />
                Temayı Değiştir
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}