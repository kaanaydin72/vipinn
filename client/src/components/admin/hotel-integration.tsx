import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw, Globe, Share2, Database } from "lucide-react";

// Integration providers
const integrationProviders = [
  { id: "booking", name: "Booking.com", logo: "https://cf.bstatic.com/static/img/favicon/favicon-32x32.png" },
  { id: "airbnb", name: "Airbnb", logo: "https://a0.muscache.com/airbnb/static/icons/android-icon-192x192-c0465f9f0380893768972a31a614b670.png" },
  { id: "expedia", name: "Expedia", logo: "https://www.expedia.com/_dms/header/logo.svg?locale=en_US&siteid=1&2" },
  { id: "agoda", name: "Agoda", logo: "https://cdn6.agoda.net/images/kite-js/logo/agoda/color-default.svg" },
  { id: "hotelbeds", name: "Hotelbeds", logo: "https://corporate.hotelbeds.com/wp-content/themes/hotelbeds/assets/images/hbg_logo.svg" },
  { id: "hotels", name: "Hotels.com", logo: "https://a.travel-assets.com/imagery/binaries/content/gallery/etrips-brand/all/ecom/HCOM-2.png" },
  { id: "trivago", name: "Trivago", logo: "https://cdn.trivago.com/assets/images/logos/favicon-70x70.png" },
];

interface HotelIntegrationProps {
  hotelId?: number;
  className?: string;
}

export default function HotelIntegration({ hotelId, className }: HotelIntegrationProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("api");
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<Record<string, boolean>>({
    booking: false,
    airbnb: false,
    expedia: false,
    agoda: false,
    hotelbeds: false,
    hotels: false,
    trivago: false,
  });

  const handleConnectProvider = (providerId: string) => {
    setIsLoading(true);
    
    // Simülasyon: API bağlantı işlemi
    setTimeout(() => {
      setProviders(prev => ({
        ...prev,
        [providerId]: !prev[providerId]
      }));
      
      setIsLoading(false);
      
      toast({
        title: providers[providerId] ? "Bağlantı kesildi" : "Bağlantı kuruldu",
        description: providers[providerId] 
          ? `${integrationProviders.find(p => p.id === providerId)?.name} entegrasyonu kaldırıldı.`
          : `${integrationProviders.find(p => p.id === providerId)?.name} ile başarıyla entegre edildi.`,
      });
    }, 1500);
  };

  const handleSaveSettings = () => {
    setIsLoading(true);
    
    // Simülasyon: API ayarlarını kaydetme işlemi
    setTimeout(() => {
      setIsLoading(false);
      
      toast({
        title: "Ayarlar kaydedildi",
        description: "Entegrasyon ayarları başarıyla güncellendi.",
      });
    }, 1000);
  };

  const handleSyncNow = () => {
    setIsLoading(true);
    
    // Simülasyon: Senkronizasyon işlemi
    setTimeout(() => {
      setIsLoading(false);
      
      toast({
        title: "Senkronizasyon tamamlandı",
        description: "Tüm veriler başarıyla senkronize edildi.",
      });
    }, 2000);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Kanal Entegrasyonları
        </CardTitle>
        <CardDescription>
          Otel bilgilerinizi ve rezervasyonlarınızı diğer platformlarla entegre edin
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden md:inline">API Bağlantıları</span>
            </TabsTrigger>
            <TabsTrigger value="channels" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              <span className="hidden md:inline">Kanal Yöneticisi</span>
            </TabsTrigger>
            <TabsTrigger value="sync" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden md:inline">Veri Senkronizasyonu</span>
            </TabsTrigger>
          </TabsList>

          {/* API Connections Tab */}
          <TabsContent value="api" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Anahtarı</Label>
                <Input id="api-key" value="eht_9a8b7c6d5e4f3g2h1i" readOnly />
                <p className="text-sm text-muted-foreground">
                  Bu anahtarı kullanarak harici sistemlere bağlanabilirsiniz.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api-endpoint">API Endpoint</Label>
                <Input id="api-endpoint" value="https://api.elitehotels.com/v1" readOnly />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <div className="flex">
                  <Input id="webhook-url" value="https://elitehotels.com/webhook/reservations" readOnly />
                  <Button variant="outline" className="ml-2">
                    Kopyala
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Bu URL'ye rezervasyon güncellemeleri gönderilebilir
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api-token">Güvenlik Jetonu (Token)</Label>
                <Input id="api-token" type="password" value="••••••••••••••••••••••••••••••" readOnly />
                <Button variant="outline" className="mt-2">
                  Jeton Yenile
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Channel Manager Tab */}
          <TabsContent value="channels">
            <div className="space-y-6">
              <div className="grid gap-6">
                {integrationProviders.map((provider) => (
                  <div 
                    key={provider.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 overflow-hidden">
                        <img 
                          src={provider.logo} 
                          alt={provider.name} 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium">{provider.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {providers[provider.id] ? "Bağlı" : "Bağlı değil"}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleConnectProvider(provider.id)}
                      variant={providers[provider.id] ? "destructive" : "default"}
                      size="sm"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : providers[provider.id] ? (
                        "Bağlantıyı Kes"
                      ) : (
                        "Bağlan"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Sync Settings Tab */}
          <TabsContent value="sync" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Senkronizasyon Sıklığı</Label>
                <Select defaultValue="30">
                  <SelectTrigger>
                    <SelectValue placeholder="Senkronizasyon sıklığını seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 dakika</SelectItem>
                    <SelectItem value="30">30 dakika</SelectItem>
                    <SelectItem value="60">1 saat</SelectItem>
                    <SelectItem value="360">6 saat</SelectItem>
                    <SelectItem value="720">12 saat</SelectItem>
                    <SelectItem value="1440">24 saat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <Label>Senkronize Edilecek Veriler</Label>
                <div className="grid gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sync-rooms" defaultChecked />
                    <Label htmlFor="sync-rooms">Odalar ve Oda Tipleri</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sync-prices" defaultChecked />
                    <Label htmlFor="sync-prices">Fiyat ve Müsaitlik</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sync-reservations" defaultChecked />
                    <Label htmlFor="sync-reservations">Rezervasyonlar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sync-reviews" defaultChecked />
                    <Label htmlFor="sync-reviews">Değerlendirmeler</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sync-promos" />
                    <Label htmlFor="sync-promos">Promosyonlar ve Kampanyalar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sync-images" />
                    <Label htmlFor="sync-images">Fotoğraflar ve Görselller</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sync-log">Son Senkronizasyon Günlüğü</Label>
                <Textarea 
                  id="sync-log" 
                  readOnly 
                  rows={4}
                  value="2023-04-29 13:45: Başarıyla 24 oda senkronize edildi
2023-04-29 13:45: Başarıyla 8 rezervasyon alındı
2023-04-29 13:44: Başarıyla 12 fiyat güncellendi
2023-04-29 13:44: Bağlantı başlatıldı" 
                />
              </div>
              
              <div className="flex justify-between">
                <Button
                  onClick={handleSyncNow}
                  className="flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Şimdi Senkronize Et
                </Button>
                
                <div className="text-sm text-muted-foreground flex items-center">
                  Son Senkronizasyon: 29 Nisan 2023, 13:45
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Varsayılan Ayarlara Döndür</Button>
        <Button
          onClick={handleSaveSettings}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Ayarları Kaydet
        </Button>
      </CardFooter>
    </Card>
  );
}