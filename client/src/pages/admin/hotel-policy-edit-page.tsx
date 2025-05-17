import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  ArrowLeft, Loader2, Plus, Trash, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Form, FormControl, FormDescription, FormField, 
  FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertHotelPolicySchema, Hotel, HotelPolicy } from "@shared/schema";
import AdminLayout from "@/components/admin/admin-layout";

// Form validation schema with extended rules
const formSchema = insertHotelPolicySchema.extend({
  cancellationDays: z.coerce.number().min(0, {
    message: "İptal günü 0 veya daha büyük olmalıdır",
  }),
  extraBedPrice: z.coerce.number().min(0, {
    message: "Ekstra yatak fiyatı 0 veya daha büyük olmalıdır",
  }),
  depositAmount: z.coerce.number().min(0, {
    message: "Depozito tutarı 0 veya daha büyük olmalıdır",
  }).optional().nullable(),
});

export default function HotelPolicyEditPage() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [otherRules, setOtherRules] = useState<string[]>([""]);
  const [policyId, setPolicyId] = useState<number | null>(null);
  
  // Parse policy ID from URL
  useEffect(() => {
    const pathParts = location.split("/");
    const id = parseInt(pathParts[pathParts.length - 1]);
    if (!isNaN(id)) {
      setPolicyId(id);
    } else {
      toast({
        title: "Hata",
        description: "Geçersiz politika ID'si",
        variant: "destructive",
      });
      navigate("/admin/hotel-policies");
    }
  }, [location, navigate, toast]);

  // Fetch available hotels
  const { data: hotels } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
  });

  // Fetch policy data
  const { data: policy, isLoading: isPolicyLoading, error: policyError } = useQuery<HotelPolicy>({
    queryKey: ['/api/hotel-policies', policyId],
    queryFn: async ({ signal }) => {
      if (!policyId) throw new Error("Politika ID'si bulunamadı");
      const res = await fetch(`/api/hotel-policies/${policyId}`, { signal });
      if (!res.ok) throw new Error("Politika bilgileri alınamadı");
      return res.json();
    },
    enabled: !!policyId,
    onSuccess: (data) => {
      // Initialize form with existing data
      form.reset({
        title: data.title,
        description: data.description,
        hotelId: data.hotelId,
        cancellationPolicy: data.cancellationPolicy,
        cancellationDays: data.cancellationDays,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        childrenPolicy: data.childrenPolicy,
        petPolicy: data.petPolicy,
        extraBedPolicy: data.extraBedPolicy,
        extraBedPrice: data.extraBedPrice,
        depositRequired: data.depositRequired,
        depositAmount: data.depositAmount,
      });

      // Initialize other rules
      if (data.otherRules && data.otherRules.length > 0) {
        setOtherRules(data.otherRules);
      }
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Politika bilgileri alınamadı",
        variant: "destructive",
      });
      navigate("/admin/hotel-policies");
    }
  });

  // Form handling
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      hotelId: 0,
      cancellationPolicy: "",
      cancellationDays: 0,
      checkInTime: "",
      checkOutTime: "",
      childrenPolicy: "",
      petPolicy: "",
      extraBedPolicy: "",
      extraBedPrice: 0,
      depositRequired: false,
      depositAmount: null,
    },
  });

  // Update policy mutation
  const updatePolicyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!policyId) throw new Error("Politika ID'si bulunamadı");
      
      // Construct the full data object including any array fields
      const policyData = {
        ...data,
        otherRules: otherRules.filter(rule => rule.trim() !== ""),
      };
      
      const res = await apiRequest("PATCH", `/api/hotel-policies/${policyId}`, policyData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hotel-policies'] });
      toast({
        title: "Başarılı",
        description: "Otel politikası başarıyla güncellendi.",
      });
      navigate("/admin/hotel-policies");
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Politika güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    updatePolicyMutation.mutate(data);
  };

  // Handle other rules management
  const addOtherRule = () => {
    setOtherRules([...otherRules, ""]);
  };

  const updateOtherRule = (index: number, value: string) => {
    const updatedRules = [...otherRules];
    updatedRules[index] = value;
    setOtherRules(updatedRules);
  };

  const removeOtherRule = (index: number) => {
    const updatedRules = [...otherRules];
    updatedRules.splice(index, 1);
    setOtherRules(updatedRules);
  };

  if (isPolicyLoading) {
    return (
      <AdminLayout activeMenuItem="policies">
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (policyError || !policy) {
    return (
      <AdminLayout activeMenuItem="policies">
        <div className="container mx-auto py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Hata</AlertTitle>
            <AlertDescription>
              Politika bilgileri alınamadı. Lütfen tekrar deneyin.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => navigate("/admin/hotel-policies")}>
              Politika Listesine Dön
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeMenuItem="policies">
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/admin/hotel-policies")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Otel Politikası Düzenle</h1>
            <p className="text-muted-foreground">
              {policy.title} politikasını düzenleyin
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Politika Başlığı</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Standart Rezervasyon Politikası" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Konaklama politikasının adı
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hotelId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Otel</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(Number(value))}
                            value={field.value ? field.value.toString() : undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Otel seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {hotels?.map((hotel) => (
                                <SelectItem key={hotel.id} value={hotel.id.toString()}>
                                  {hotel.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Bu politikanın uygulanacağı otel
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Açıklama</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Bu politika, standart rezervasyonlar için geçerlidir..." 
                              className="min-h-24" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="cancellationPolicy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>İptal Politikası</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Konaklamadan X gün öncesine kadar ücretsiz iptal..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cancellationDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>İptal Günü</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              placeholder="1" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Ücretsiz iptal yapılabilecek son gün (konaklamadan kaç gün önce)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="checkInTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Giriş Saati</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="14:00" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="checkOutTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Çıkış Saati</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="12:00" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="childrenPolicy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Çocuk Politikası</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="12 yaş altı çocuklar ücretsiz konaklar..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="petPolicy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Evcil Hayvan Politikası</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Evcil hayvanlar kabul edilmez..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="extraBedPolicy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ekstra Yatak Politikası</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Talep üzerine ekstra yatak sağlanabilir..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="extraBedPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ekstra Yatak Fiyatı (TL)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              placeholder="0" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="depositRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-0.5">
                            <FormLabel>Depozito Gerekli</FormLabel>
                            <FormDescription>
                              Rezervasyon için ön ödeme gerekli mi?
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

                    {form.watch("depositRequired") && (
                      <FormField
                        control={form.control}
                        name="depositAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Depozito Tutarı (TL)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={0} 
                                placeholder="100" 
                                {...field} 
                                value={field.value === null ? "" : field.value}
                                onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Rezervasyon sırasında alınacak depozito tutarı
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Diğer Kurallar</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addOtherRule}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Kural Ekle
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {otherRules.map((rule, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={rule}
                          onChange={(e) => updateOtherRule(index, e.target.value)}
                          placeholder="Ek kural..."
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeOtherRule(index)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="mr-2"
                    onClick={() => navigate("/admin/hotel-policies")}
                  >
                    İptal
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updatePolicyMutation.isPending}
                  >
                    {updatePolicyMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Kaydet
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}