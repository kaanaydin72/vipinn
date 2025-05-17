import { useState } from "react";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { themeConfigs, THEMES } from "@/themes";
import { useChangeGlobalTheme, useTheme } from "@/hooks/use-theme";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Check, Palette } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ThemeManagement() {
  const { currentTheme, availableThemes, isLoading } = useTheme();
  const changeGlobalTheme = useChangeGlobalTheme();
  const [activeTab, setActiveTab] = useState<string>("site");
  
  const handleChangeTheme = (theme: THEMES) => {
    changeGlobalTheme(theme);
  };
  
  return (
    <AdminLayout activeMenuItem="themes">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Tema Yönetimi</h1>
        
        <Tabs defaultValue="site" onValueChange={setActiveTab} className="mb-6">
          <TabsList className="mb-6">
            <TabsTrigger value="site">Site Teması</TabsTrigger>
            <TabsTrigger value="preview">Tema Önizleme</TabsTrigger>
          </TabsList>
          
          <TabsContent value="site">
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Tema Yönetimi</AlertTitle>
              <AlertDescription>
                Burada sitenin genel temasını değiştirebilirsiniz. Seçtiğiniz tema tüm kullanıcılar için varsayılan tema olarak ayarlanacaktır.
                Kullanıcılar kendi profillerinden farklı bir tema seçebilirler.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {availableThemes.map((theme) => (
                <Card 
                  key={theme.id} 
                  className={`overflow-hidden transition-all hover:-translate-y-1 cursor-pointer
                    ${currentTheme === theme.id ? 'ring-2 ring-primary' : ''}
                  `}
                  onClick={() => handleChangeTheme(theme.id as THEMES)}
                >
                  <div className="h-40 bg-muted relative">
                    {theme.thumbnail ? (
                      <img 
                        src={theme.thumbnail} 
                        alt={theme.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Palette className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    
                    {currentTheme === theme.id && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  
                  <CardHeader className="p-4">
                    <CardTitle>{theme.name}</CardTitle>
                    <CardDescription>{theme.description}</CardDescription>
                  </CardHeader>
                  
                  <CardFooter className="p-4 pt-0">
                    <Button 
                      variant={currentTheme === theme.id ? "outline" : "default"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChangeTheme(theme.id as THEMES);
                      }}
                      disabled={currentTheme === theme.id || isLoading}
                      className="w-full"
                    >
                      {currentTheme === theme.id ? 'Aktif Tema' : 'Temayı Uygula'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="preview">
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Tema Önizleme</AlertTitle>
              <AlertDescription>
                Her temanın bileşen tasarımlarını görebilirsiniz. Bu bölüm sadece önizleme amaçlıdır.
              </AlertDescription>
            </Alert>
            
            <ScrollArea className="h-[calc(100vh-300px)] pr-4">
              <ThemeComponentsPreview />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// Tema bileşenlerini önizlemek için yardımcı bileşen
function ThemeComponentsPreview() {
  return (
    <div className="space-y-12">
      {Object.values(THEMES).map((theme) => (
        <div key={theme} className="space-y-6">
          <h2 className="text-2xl font-bold border-b pb-2">{theme.charAt(0).toUpperCase() + theme.slice(1)} Tema Bileşenleri</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Düğmeler</CardTitle>
                <CardDescription>Tema düğme stillerini gösterir</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    className={`theme-${theme} themed-component`}
                    data-theme-class="primaryButton"
                  >
                    Ana Buton
                  </Button>
                  <Button 
                    variant="outline"
                    className={`theme-${theme} themed-component`}
                    data-theme-class="secondaryButton"
                  >
                    İkincil Buton
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Kartlar</CardTitle>
                <CardDescription>Tema kart stillerini gösterir</CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className={`theme-${theme} themed-component p-4 border rounded-md`}
                  data-theme-class="card"
                >
                  <div 
                    className="themed-component mb-2 font-bold" 
                    data-theme-class="cardTitle"
                  >
                    Örnek Kart Başlığı
                  </div>
                  <div className="text-sm">Örnek kart içeriği burada gösterilir.</div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Otel Kartı</CardTitle>
                <CardDescription>Tema otel kartı stillerini gösterir</CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className={`theme-${theme} themed-component border rounded-md overflow-hidden`}
                  data-theme-class="hotelCard"
                >
                  <div className="themed-component bg-gray-200 w-32 h-24" data-theme-class="hotelImage"></div>
                  <div className="p-4">
                    <div className="themed-component font-bold mb-1" data-theme-class="hotelName">Grand Hotel</div>
                    <div className="themed-component text-sm mb-2" data-theme-class="hotelLocation">İstanbul, Türkiye</div>
                    <div className="themed-component text-xs mb-4" data-theme-class="hotelDescription">
                      Şehir merkezinde lüks konaklama deneyimi sunan 5 yıldızlı otel.
                    </div>
                    <div className="themed-component font-bold" data-theme-class="hotelPrice">₺1.500 / gece</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
}