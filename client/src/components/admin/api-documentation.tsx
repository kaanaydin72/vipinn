import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyIcon, CheckIcon, Code, BookOpen, LockIcon, DatabaseIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function ApiDocumentation() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("introduction");
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const handleCopyCode = (code: string, description: string) => {
    navigator.clipboard.writeText(code);
    setCopiedEndpoint(code);
    
    toast({
      title: "Kopyalandı!",
      description: description,
    });
    
    setTimeout(() => {
      setCopiedEndpoint(null);
    }, 2000);
  };

  // API Endpoint Information
  const endpoints = [
    {
      name: "Otel Listesi Almak",
      endpoint: "GET /api/v1/hotels",
      description: "Sistemdeki tüm otellerin listesini getirir",
      code: "https://api.vipinnhotels.com/v1/hotels",
      response: `{
  "data": [
    {
      "id": 1,
      "name": "Vipinn Hotel İstanbul",
      "location": "İstanbul",
      "stars": 5,
      "thumbnail": "https://example.com/hotel1.jpg"
    },
    {
      "id": 2,
      "name": "Elite Resort Antalya",
      "location": "Antalya",
      "stars": 5,
      "thumbnail": "https://example.com/hotel2.jpg"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 10
}`,
      parameters: [
        { name: "page", type: "number", description: "Sayfa numarası (varsayılan: 1)" },
        { name: "limit", type: "number", description: "Sayfa başına otel sayısı (varsayılan: 10)" },
        { name: "location", type: "string", description: "Şehire göre filtreleme" },
      ]
    },
    {
      name: "Belirli Bir Otelin Bilgilerini Almak",
      endpoint: "GET /api/v1/hotels/:id",
      description: "ID'ye göre belirli bir otelin detaylı bilgilerini getirir",
      code: "https://api.vipinnhotels.com/v1/hotels/1",
      response: `{
  "data": {
    "id": 1,
    "name": "Vipinn Hotel İstanbul",
    "location": "İstanbul",
    "description": "İstanbul'un merkezi Beşiktaş'ta yer alan Vipinn Hotel...",
    "address": "Beşiktaş, İstanbul",
    "stars": 5,
    "amenities": ["Havuz", "Spa", "Restoran"],
    "imageUrl": "https://example.com/hotel1.jpg",
    "rating": 4.8,
    "rooms": [
      {
        "id": 101,
        "name": "Standart Oda",
        "capacity": 2,
        "price": 1450,
        "thumbnail": "https://example.com/room101.jpg"
      }
    ]
  }
}`,
      parameters: [
        { name: "include", type: "string", description: "İlişkili verileri dahil etme (örn: rooms,reviews)" },
      ]
    },
    {
      name: "Oda Müsaitliği Kontrol Etmek",
      endpoint: "GET /api/v1/hotels/:id/availability",
      description: "Belirli bir oteldeki odaların müsaitlik durumunu kontrol eder",
      code: "https://api.vipinnhotels.com/v1/hotels/1/availability?checkIn=2023-07-15&checkOut=2023-07-20",
      response: `{
  "data": [
    {
      "roomId": 101,
      "name": "Standart Oda",
      "available": true,
      "price": 1450,
      "available_count": 5
    },
    {
      "roomId": 102,
      "name": "Deluxe Oda",
      "available": false,
      "price": 2250,
      "available_count": 0
    }
  ]
}`,
      parameters: [
        { name: "checkIn", type: "date", description: "Giriş tarihi (YYYY-MM-DD formatında)" },
        { name: "checkOut", type: "date", description: "Çıkış tarihi (YYYY-MM-DD formatında)" },
        { name: "roomType", type: "string", description: "Oda tipine göre filtreleme" },
      ]
    },
    {
      name: "Fiyat Bilgisi Almak",
      endpoint: "GET /api/v1/hotels/:id/prices",
      description: "Belirli bir oteldeki odaların fiyat bilgilerini getirir",
      code: "https://api.vipinnhotels.com/v1/hotels/1/prices?startDate=2023-07-01&endDate=2023-07-31",
      response: `{
  "data": [
    {
      "roomId": 101,
      "name": "Standart Oda",
      "prices": [
        { "date": "2023-07-01", "price": 1450, "currency": "TRY" },
        { "date": "2023-07-02", "price": 1450, "currency": "TRY" },
        { "date": "2023-07-03", "price": 1550, "currency": "TRY" }
      ]
    }
  ]
}`,
      parameters: [
        { name: "startDate", type: "date", description: "Başlangıç tarihi (YYYY-MM-DD formatında)" },
        { name: "endDate", type: "date", description: "Bitiş tarihi (YYYY-MM-DD formatında)" },
        { name: "roomType", type: "string", description: "Oda tipine göre filtreleme" },
      ]
    },
    {
      name: "Rezervasyon Oluşturmak",
      endpoint: "POST /api/v1/reservations",
      description: "Yeni bir rezervasyon oluşturur",
      code: `curl -X POST https://api.vipinnhotels.com/v1/reservations \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer YOUR_API_KEY" \\
-d '{
  "hotelId": 1,
  "roomId": 101,
  "checkIn": "2023-07-15",
  "checkOut": "2023-07-20",
  "guestName": "Ahmet Yılmaz",
  "guestEmail": "ahmet@example.com",
  "guestPhone": "+905551234567",
  "adults": 2,
  "children": 0,
  "specialRequests": "Üst kat oda tercih edilir"
}'`,
      response: `{
  "data": {
    "id": 5001,
    "reservationCode": "VIP-123456",
    "status": "confirmed",
    "hotelId": 1,
    "roomId": 101,
    "checkIn": "2023-07-15",
    "checkOut": "2023-07-20",
    "totalPrice": 7250,
    "currency": "TRY"
  }
}`,
      parameters: []
    },
    {
      name: "Rezervasyon İptal Etmek",
      endpoint: "PUT /api/v1/reservations/:id/cancel",
      description: "Mevcut bir rezervasyonu iptal eder",
      code: `curl -X PUT https://api.vipinnhotels.com/v1/reservations/5001/cancel \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer YOUR_API_KEY" \\
-d '{
  "reason": "Müşteri isteği",
  "refundRequested": true
}'`,
      response: `{
  "data": {
    "id": 5001,
    "reservationCode": "VIP-123456",
    "status": "cancelled",
    "cancelDate": "2023-06-30T14:15:22Z",
    "refundStatus": "processing"
  }
}`,
      parameters: []
    },
    {
      name: "Kontenjan Güncelleme",
      endpoint: "PUT /api/v1/rooms/:id/inventory",
      description: "Belirli bir oda tipinin kontenjanını günceller",
      code: `curl -X PUT https://api.vipinnhotels.com/v1/rooms/101/inventory \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer YOUR_API_KEY" \\
-d '{
  "date": "2023-07-15",
  "count": 10,
  "stopSell": false
}'`,
      response: `{
  "data": {
    "roomId": 101,
    "date": "2023-07-15",
    "count": 10,
    "stopSell": false,
    "updatedAt": "2023-06-29T09:45:12Z"
  }
}`,
      parameters: []
    }
  ];
  
  const authenticationCode = `
# API kimlik doğrulama örneği
curl -X POST https://api.vipinnhotels.com/v1/auth/token \\
-H "Content-Type: application/json" \\
-d '{
  "apiKey": "YOUR_API_KEY",
  "apiSecret": "YOUR_API_SECRET"
}'

# Dönen cevap:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 86400
}

# Daha sonra isteklerde bu token kullanılır:
curl -X GET https://api.vipinnhotels.com/v1/hotels \\
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Code className="h-5 w-5" />
          Vipinn Hotels API Dokümantasyonu
        </CardTitle>
        <CardDescription>
          Sistem entegrasyon API dokümantasyonu ve kullanım kılavuzu
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="introduction" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-1 md:px-4 py-2">
              <BookOpen className="h-4 w-4" />
              <span className="text-[10px] md:text-sm md:inline">Giriş</span>
            </TabsTrigger>
            <TabsTrigger value="authentication" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-1 md:px-4 py-2">
              <LockIcon className="h-4 w-4" />
              <span className="text-[10px] md:text-sm md:inline">Kimlik</span>
            </TabsTrigger>
            <TabsTrigger value="endpoints" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-1 md:px-4 py-2">
              <DatabaseIcon className="h-4 w-4" />
              <span className="text-[10px] md:text-sm md:inline">API Uçları</span>
            </TabsTrigger>
          </TabsList>

          {/* Introduction Tab */}
          <TabsContent value="introduction" className="space-y-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2>Vipinn Hotels API'sine Hoş Geldiniz</h2>
              <p>
                Bu API, otel yönetim sisteminizi Vipinn Hotels platformuna entegre etmenizi sağlar.
                API sayesinde otellerin bilgilerini, odaları, fiyatları, müsaitlikleri yönetebilir ve
                rezervasyon işlemlerini gerçekleştirebilirsiniz.
              </p>
              
              <h3>API Genel Bakış</h3>
              <ul>
                <li><strong>Base URL:</strong> https://api.vipinnhotels.com/v1</li>
                <li><strong>Veri Formatı:</strong> JSON</li>
                <li><strong>Kimlik Doğrulama:</strong> Bearer JWT token</li>
                <li><strong>Hız Limiti:</strong> 100 istek/dakika</li>
              </ul>
              
              <h3>Entegrasyon Adımları</h3>
              <ol>
                <li>API erişim anahtarı almak için bizimle iletişime geçin.</li>
                <li>Kimlik doğrulama token'ı oluşturun.</li>
                <li>İlgili API uç noktalarına istek gönderin.</li>
                <li>Webhook URL'nizi ayarlayarak gerçek zamanlı güncellemeler alın.</li>
              </ol>
              
              <h3>Kod Örnekleri</h3>
              <p>
                Her programlama dili için örnek kodlar ve SDK'lar sağlıyoruz:
              </p>
              <ul>
                <li><a href="#">PHP SDK</a></li>
                <li><a href="#">Node.js SDK</a></li>
                <li><a href="#">Python SDK</a></li>
                <li><a href="#">Java SDK</a></li>
              </ul>
              
              <h3>Destek</h3>
              <p>
                Entegrasyonla ilgili sorularınız için <a href="mailto:api@vipinnhotels.com">api@vipinnhotels.com</a> adresine e-posta gönderebilirsiniz.
              </p>
            </div>
          </TabsContent>

          {/* Authentication Tab */}
          <TabsContent value="authentication" className="space-y-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2>Kimlik Doğrulama</h2>
              <p>
                Vipinn Hotels API'si, JWT (JSON Web Token) tabanlı bir kimlik doğrulama sistemi kullanır.
                API'ye erişmek için önce bir token almanız ve bu token'ı sonraki isteklerde kullanmanız gerekir.
              </p>
              
              <h3>API Anahtarı Alma</h3>
              <p>
                API anahtarı ve gizli anahtarınızı almak için admin panelindeki "API Yönetimi" bölümünü kullanabilir
                veya Vipinn Hotels teknik ekibiyle iletişime geçebilirsiniz.
              </p>
              
              <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-md my-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium">Token Alma ve Kullanma Örneği</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleCopyCode(authenticationCode, "Kimlik doğrulama kodu kopyalandı!")}
                    className="h-6 px-2"
                  >
                    {copiedEndpoint === authenticationCode ? (
                      <CheckIcon className="h-3.5 w-3.5" />
                    ) : (
                      <CopyIcon className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <pre className="text-xs overflow-auto p-2">
                  {authenticationCode}
                </pre>
              </div>
              
              <h3>Token Güvenliği</h3>
              <ul>
                <li>Token'lar 24 saat geçerlidir</li>
                <li>Token'ları güvenli bir şekilde saklayın ve paylaşmayın</li>
                <li>Token süresi dolmadan önce yeni token alabilirsiniz</li>
                <li>Şüpheli durumlarda API anahtarınızı hemen yenileyin</li>
              </ul>
              
              <h3>Rate Limiting</h3>
              <p>
                Hız sınırlaması uygulanmaktadır: 100 istek/dakika. Limit aşıldığında 429 HTTP kodlu yanıt alırsınız.
                Rate limit durumuyla ilgili bilgiler yanıt başlıklarında sağlanır:
              </p>
              <ul>
                <li><code>X-RateLimit-Limit</code>: Toplam izin verilen istek sayısı</li>
                <li><code>X-RateLimit-Remaining</code>: Kalan istek sayısı</li>
                <li><code>X-RateLimit-Reset</code>: Limitin sıfırlanacağı zaman (Unix timestamp)</li>
              </ul>
            </div>
          </TabsContent>

          {/* API Endpoints Tab */}
          <TabsContent value="endpoints" className="space-y-8">
            <div className="space-y-6">
              {endpoints.map((endpoint, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="bg-neutral-50 dark:bg-neutral-900">
                    <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                    <CardDescription>
                      <code className="text-sm bg-neutral-200 dark:bg-neutral-800 px-2 py-1 rounded">
                        {endpoint.endpoint}
                      </code>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-sm mb-4">{endpoint.description}</p>
                    
                    {endpoint.parameters.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold mb-2">Parametreler:</h4>
                        
                        {/* Mobil parametreler listesi */}
                        <div className="md:hidden space-y-3">
                          {endpoint.parameters.map((param, paramIndex) => (
                            <div key={paramIndex} className="bg-neutral-50 dark:bg-neutral-900 p-3 rounded-md border border-neutral-200 dark:border-neutral-800">
                              <div className="font-mono text-xs font-semibold mb-1">{param.name}</div>
                              <div className="flex items-center mb-1">
                                <Badge variant="outline" className="text-xs">{param.type}</Badge>
                              </div>
                              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                                {param.description}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Desktop tablo görünümü */}
                        <div className="hidden md:block bg-neutral-50 dark:bg-neutral-900 rounded-md">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-3">İsim</th>
                                <th className="text-left py-2 px-3">Tip</th>
                                <th className="text-left py-2 px-3">Açıklama</th>
                              </tr>
                            </thead>
                            <tbody>
                              {endpoint.parameters.map((param, paramIndex) => (
                                <tr key={paramIndex} className="border-b last:border-0">
                                  <td className="py-2 px-3 font-mono text-xs">{param.name}</td>
                                  <td className="py-2 px-3">{param.type}</td>
                                  <td className="py-2 px-3">{param.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-semibold">Örnek İstek:</h4>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCopyCode(endpoint.code, "Endpoint adresi kopyalandı!")}
                          className="h-6 px-2"
                        >
                          {copiedEndpoint === endpoint.code ? (
                            <CheckIcon className="h-3.5 w-3.5" />
                          ) : (
                            <CopyIcon className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                      <pre className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-md text-xs overflow-auto">
                        {endpoint.code}
                      </pre>
                    </div>
                    
                    <div className="mt-6 space-y-2">
                      <h4 className="text-sm font-semibold">Örnek Yanıt:</h4>
                      <pre className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-md text-xs overflow-auto">
                        {endpoint.response}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm text-muted-foreground">
          API Versiyonu: v1.0.0 (Son Güncelleme: 29 Nisan 2023)
        </div>
        <Button onClick={() => window.open('/api/docs', '_blank')}>
          <BookOpen className="mr-2 h-4 w-4" />
          Tam Dokümantasyonu Görüntüle
        </Button>
      </CardFooter>
    </Card>
  );
}