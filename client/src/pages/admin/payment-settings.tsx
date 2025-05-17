import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/admin-layout";

// Form validation şeması
const paytrSettingsSchema = z.object({
  merchantId: z.string().min(1, "Merchant ID gereklidir"),
  merchantKey: z.string().min(1, "Merchant Key gereklidir"),
  merchantSalt: z.string().min(1, "Merchant Salt gereklidir"),
  testMode: z.boolean().default(true),
});

type PaytrSettingsFormValues = z.infer<typeof paytrSettingsSchema>;

export default function PaymentSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  // Form kurulumu
  const form = useForm<PaytrSettingsFormValues>({
    resolver: zodResolver(paytrSettingsSchema),
    defaultValues: {
      merchantId: "",
      merchantKey: "",
      merchantSalt: "",
      testMode: true,
    },
  });

  // Mevcut ayarları getir
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        console.log("PayTR ayarları getiriliyor...");
        const response = await fetch("/api/admin/payment-settings", {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          credentials: 'include' // Oturum bilgilerini dahil et
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("PayTR ayarları başarıyla alındı:", {
            merchantIdPresent: !!data.merchantId,
            merchantKeyPresent: !!data.merchantKey,
            merchantSaltPresent: !!data.merchantSalt,
            testMode: data.testMode
          });
          
          form.reset({
            merchantId: data.merchantId || "",
            merchantKey: data.merchantKey || "",
            merchantSalt: data.merchantSalt || "",
            testMode: data.testMode === undefined ? true : data.testMode,
          });
        } else {
          console.error("Ödeme ayarları getirilemedi:", response.statusText);
          
          // Hata durumunda detaylı bilgi göster
          const errorData = await response.json().catch(() => ({}));
          console.error("Hata detayları:", errorData);
          
          toast({
            title: "Hata",
            description: `Ödeme ayarları yüklenemedi. Hata: ${response.status} ${response.statusText}`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Ödeme ayarları getirme hatası:", error);
        toast({
          title: "Hata",
          description: "Ödeme ayarları yüklenirken bir sorun oluştu. Lütfen ağ bağlantınızı kontrol edin.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [form, toast]);

  // Ayarları kaydetme mutasyonu
  const saveSettingsMutation = useMutation({
    mutationFn: async (values: PaytrSettingsFormValues) => {
      // Veriyi temizle ve doğru tipte olduğundan emin ol
      const cleanData = {
        merchantId: String(values.merchantId).trim(),
        merchantKey: String(values.merchantKey).trim(),
        merchantSalt: String(values.merchantSalt).trim(),
        testMode: Boolean(values.testMode)
      };
      console.log("Gönderilen temiz veri:", {
        merchantIdLength: cleanData.merchantId.length,
        merchantKeyLength: cleanData.merchantKey.length,
        merchantSaltLength: cleanData.merchantSalt.length,
        testMode: cleanData.testMode
      });
      
      // Doğrudan fetch kullanarak POST isteği gönder
      const response = await fetch("/api/admin/payment-settings", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include', // Oturum bilgilerini dahil et
        body: JSON.stringify(cleanData)
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("Ödeme ayarları kaydedilirken hata:", {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Ödeme ayarları başarıyla kaydedildi:", {
        merchantIdSaved: !!data.merchantId,
        merchantKeySaved: !!data.merchantKey,
        merchantSaltSaved: !!data.merchantSalt,
        testMode: data.testMode
      });
      
      // Form verilerini temizle ve güncelle
      form.reset({
        merchantId: data.merchantId || "",
        merchantKey: data.merchantKey || "",
        merchantSalt: data.merchantSalt || "",
        testMode: data.testMode === undefined ? true : data.testMode,
      });
      
      toast({
        title: "Başarılı",
        description: "Ödeme ayarları başarıyla kaydedildi.",
      });
      
      // 2 saniye sonra sayfayı yenile - bu, ödeme ayarlarının hemen uygulanmasını sağlar
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    },
    onError: (error: Error) => {
      console.error("Ödeme ayarları kaydetme hatası:", error);
      toast({
        title: "Hata",
        description: `Ödeme ayarları kaydedilirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form gönderme
  const onSubmit = (values: PaytrSettingsFormValues) => {
    saveSettingsMutation.mutate(values);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Ödeme Ayarları</h1>
          <p className="text-muted-foreground">Kredi kartı ödeme entegrasyonu için gerekli ayarları yapılandırın.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>PayTR Entegrasyonu</CardTitle>
            <CardDescription>
              PayTR ödeme altyapısı ile kredi kartı ödemelerini kabul etmek için gerekli API anahtarlarını yapılandırın.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <Alert>
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Güvenlik Uyarısı</AlertTitle>
                    <AlertDescription>
                      Bu bilgiler ödeme işlemleri için kullanılacak hassas bilgilerdir. Yetkisiz kişilerle paylaşmayın.
                    </AlertDescription>
                  </Alert>

                  <FormField
                    control={form.control}
                    name="merchantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Merchant ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Örn: 266629" {...field} />
                        </FormControl>
                        <FormDescription>
                          PayTR tarafından sağlanan mağaza numarası.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="merchantKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Merchant Key</FormLabel>
                        <FormControl>
                          <Input placeholder="Merchant Key" type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          PayTR tarafından sağlanan API anahtarı.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="merchantSalt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Merchant Salt</FormLabel>
                        <FormControl>
                          <Input placeholder="Merchant Salt" type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          PayTR tarafından sağlanan güvenlik anahtarı.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator className="my-4" />

                  <FormField
                    control={form.control}
                    name="testMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Test Modu</FormLabel>
                          <FormDescription>
                            Test modunda gerçek ödeme alınmaz. Canlıya geçmeden önce test edin.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <CardFooter className="flex justify-end px-0 pb-0 pt-4">
                    <Button 
                      type="submit" 
                      disabled={saveSettingsMutation.isPending}
                    >
                      {saveSettingsMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Save className="mr-2 h-4 w-4" />
                      Ayarları Kaydet
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}