import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { HotelPolicy, InsertHotelPolicy } from "@shared/schema";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/admin-layout";
import { Check, Edit, Plus, RefreshCw, TrashIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  hotelId: z.number(),
  title: z.string().min(1, "Başlık zorunludur"),
  description: z.string().min(1, "Açıklama zorunludur"),
  cancellationPolicy: z.string().min(1, "İptal politikası zorunludur"),
  cancellationDays: z.number().min(0),
  checkInTime: z.string().min(1, "Giriş saati zorunludur"),
  checkOutTime: z.string().min(1, "Çıkış saati zorunludur"),
  childrenPolicy: z.string().min(1, "Çocuk politikası zorunludur"),
  petPolicy: z.string().min(1, "Evcil hayvan politikası zorunludur"),
  extraBedPolicy: z.string().optional(),
  extraBedPrice: z.number().optional(),
  depositRequired: z.boolean(),
  depositAmount: z.number().nullable(),
  otherRules: z.array(z.string()).default([]),
});

export default function HotelPolicies() {
  const { toast } = useToast();
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPolicy, setCurrentPolicy] = useState<HotelPolicy | null>(null);
  const [penaltyType, setPenaltyType] = useState<CancellationPenaltyType>(
    CancellationPenaltyType.FIRST_NIGHT
  );

  enum CancellationPenaltyType {
    FIRST_NIGHT = "first_night",
    FIFTY_PERCENT = "fifty_percent",
    FULL_AMOUNT = "full_amount"
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hotelId: 0,
      title: "",
      description: "",
      cancellationPolicy: "",
      cancellationDays: 1,
      checkInTime: "14:00",
      checkOutTime: "12:00",
      childrenPolicy: "",
      petPolicy: "",
      extraBedPolicy: "",
      extraBedPrice: undefined,
      depositRequired: false,
      depositAmount: null,
      otherRules: [],
    },
  });

  // İptal politikası metni oluşturma
  const generateCancellationPolicy = (days: number, penalty: CancellationPenaltyType = penaltyType) => {
    let penaltyText = "";
    
    switch (penalty) {
      case CancellationPenaltyType.FIRST_NIGHT:
        penaltyText = "ilk gece konaklama bedeli kadar";
        break;
      case CancellationPenaltyType.FIFTY_PERCENT:
        penaltyText = "toplam rezervasyon bedelinin %50'si kadar";
        break;
      case CancellationPenaltyType.FULL_AMOUNT:
        penaltyText = "toplam rezervasyon bedelinin tamamı kadar";
        break;
    }
    
    if (days === 0) {
      return `Rezervasyon iptal edilemez. İptal durumunda ${penaltyText} ceza uygulanır.`;
    } else if (days === 1) {
      return `Rezervasyon başlangıç tarihinden 24 saat öncesine kadar ücretsiz iptal yapılabilir. Daha sonra yapılan iptallerde ${penaltyText} ceza uygulanır.`;
    } else {
      return `Rezervasyon başlangıç tarihinden ${days} gün öncesine kadar ücretsiz iptal yapılabilir. Daha sonra yapılan iptallerde ${penaltyText} ceza uygulanır.`;
    }
  };

  const { data: policies, isLoading } = useQuery<HotelPolicy[]>({
    queryKey: ["/api/hotel-policies"],
    queryFn: ({ signal }) =>
      fetch("/api/hotel-policies", { signal }).then((res) => res.json()),
  });

  const { data: hotels } = useQuery({
    queryKey: ["/api/hotels"],
    queryFn: ({ signal }) =>
      fetch("/api/hotels", { signal }).then((res) => res.json()),
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest(
        "POST",
        "/api/hotel-policies",
        data as InsertHotelPolicy
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Otel koşulu eklenemedi");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotel-policies"] });
      toast({
        title: "Başarılı",
        description: "Otel koşulu başarıyla eklendi",
      });
      setIsCreateMode(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!currentPolicy) throw new Error("Güncellenecek politika bulunamadı");
      
      const response = await apiRequest(
        "PUT",
        `/api/hotel-policies/${currentPolicy.id}`,
        data as InsertHotelPolicy
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Otel koşulu güncellenemedi");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotel-policies"] });
      toast({
        title: "Başarılı",
        description: "Otel koşulu başarıyla güncellendi",
      });
      setIsEditMode(false);
      setCurrentPolicy(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/hotel-policies/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Otel koşulu silinemedi");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hotel-policies"] });
      toast({
        title: "Başarılı",
        description: "Otel koşulu başarıyla silindi",
      });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate(values);
  };

  const onEdit = (policy: HotelPolicy) => {
    setCurrentPolicy(policy);
    setIsEditMode(true);
    
    // İptal ceza tipini belirle
    let detectedPenaltyType = CancellationPenaltyType.FIRST_NIGHT;
    if (policy.cancellationPolicy.includes("%50")) {
      detectedPenaltyType = CancellationPenaltyType.FIFTY_PERCENT;
    } else if (policy.cancellationPolicy.includes("tamamı")) {
      detectedPenaltyType = CancellationPenaltyType.FULL_AMOUNT;
    }
    setPenaltyType(detectedPenaltyType);
    
    form.reset({
      hotelId: policy.hotelId,
      title: policy.title,
      description: policy.description,
      cancellationPolicy: policy.cancellationPolicy,
      cancellationDays: policy.cancellationDays,
      checkInTime: policy.checkInTime,
      checkOutTime: policy.checkOutTime,
      childrenPolicy: policy.childrenPolicy,
      petPolicy: policy.petPolicy,
      extraBedPolicy: policy.extraBedPolicy || "",
      extraBedPrice: policy.extraBedPrice || undefined,
      depositRequired: policy.depositRequired,
      depositAmount: policy.depositAmount,
      otherRules: policy.otherRules,
    });
  };

  const onUpdate = (values: z.infer<typeof formSchema>) => {
    updateMutation.mutate(values);
  };

  const onDelete = (policy: HotelPolicy) => {
    deleteMutation.mutate(policy.id);
  };

  const onCancel = () => {
    if (isCreateMode) {
      setIsCreateMode(false);
    } else if (isEditMode) {
      setIsEditMode(false);
      setCurrentPolicy(null);
    }
    form.reset();
  };

  const getHotelNameById = (id: number) => {
    const hotel = hotels?.find((h) => h.id === id);
    return hotel?.name || "Bilinmeyen Otel";
  };

  // Ana yükleme göstergesi
  if (isLoading) {
    return (
      <AdminLayout activeMenuItem="policies">
        <div className="flex justify-center items-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  // Form alanı
  const renderForm = () => (
    <div className="container mx-auto py-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {isCreateMode
            ? "Yeni Otel Koşulu Ekle"
            : isEditMode
            ? "Otel Koşulunu Düzenle"
            : ""}
        </h2>
        <Button variant="outline" onClick={onCancel}>
          İptal
        </Button>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <Form {...form}>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hotelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Otel</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                      value={field.value?.toString()}
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Başlık</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Örn: Standart Koşullar" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Otel koşulları hakkında genel bilgiler"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="checkInTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giriş Saati</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="14:00" />
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
                      <Input {...field} placeholder="12:00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="cancellationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İptal için Gün Sayısı</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="0"
                        step="1"
                        {...field} 
                        onChange={e => {
                          const value = e.target.value ? parseInt(e.target.value) : 0;
                          field.onChange(value);
                          
                          // İptal gün sayısına göre iptal politikasını da güncelle
                          form.setValue("cancellationPolicy", generateCancellationPolicy(value));
                        }}
                        value={field.value || 0}
                        placeholder="Örn: 1"
                      />
                    </FormControl>
                    <FormDescription>
                      Ücretsiz iptal için gereken gün sayısı
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                name="penaltyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İptal Ceza Tipi</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        const selectedPenalty = value as CancellationPenaltyType;
                        setPenaltyType(selectedPenalty);
                        // Ceza tipi değiştiğinde iptal politikası metnini güncelle
                        const days = form.getValues("cancellationDays");
                        form.setValue("cancellationPolicy", generateCancellationPolicy(days, selectedPenalty));
                      }}
                      defaultValue={penaltyType}
                      value={penaltyType}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Ceza tipi seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={CancellationPenaltyType.FIRST_NIGHT}>İlk Gece Ücreti</SelectItem>
                        <SelectItem value={CancellationPenaltyType.FIFTY_PERCENT}>Rezervasyon Bedelinin %50'si</SelectItem>
                        <SelectItem value={CancellationPenaltyType.FULL_AMOUNT}>Rezervasyon Bedelinin %100'ü</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Geç iptal durumunda uygulanacak ceza türü
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cancellationPolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İptal Politikası</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Örn: Rezervasyon başlangıç tarihinden 24 saat öncesine kadar ücretsiz iptal edilebilir."
                      />
                    </FormControl>
                    <FormDescription>
                      Gün sayısı ve ceza tipini değiştirdiğinizde bu metin otomatik olarak güncellenir.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="childrenPolicy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Çocuk Politikası</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Örn: 12 yaş altı çocuklar için ilave yatak ücretsizdir."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="depositRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 mt-1"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Depozito Gerekli</FormLabel>
                    <FormDescription>
                      Konaklama sırasında depozito alınıp alınmayacağını belirleyin
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {form.watch("depositRequired") && (
              <FormField
                control={form.control}
                name="depositAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Depozito Miktarı (TL)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="0"
                        {...field} 
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                        value={field.value || ""}
                        placeholder="Miktar"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Separator />

            <FormField
              control={form.control}
              name="petPolicy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evcil Hayvan Politikası</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Örn: Evcil hayvan kabul edilmemektedir."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="extraBedPolicy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İlave Yatak Politikası</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Örn: Odada bir adet ilave yatak eklenebilir."
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
                  <FormLabel>İlave Yatak Ücreti (TL)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      {...field} 
                      onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      value={field.value || ""}
                      placeholder="Miktar"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={
                  isCreateMode
                    ? form.handleSubmit(onSubmit)
                    : form.handleSubmit(onUpdate)
                }
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isCreateMode ? "Ekle" : "Güncelle"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );

  // Politikalar listesi
  const renderPolicyList = () => (
    <div className="container mx-auto py-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Otel Koşulları</h2>
        <Button onClick={() => window.location.href = "/admin/hotel-policies/create"}>
          <Plus className="mr-2 h-4 w-4" /> Yeni Koşul Ekle
        </Button>
      </div>

      {policies && policies.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {policies.map((policy) => (
            <Card key={policy.id} className="overflow-hidden">
              <CardHeader className="bg-muted pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{policy.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/admin/hotel-policies/edit/${policy.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bu koşul kalıcı olarak silinecektir. Bu işlem geri
                            alınamaz.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(policy)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Sil
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground mb-2">
                  Otel: {getHotelNameById(policy.hotelId)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                  <div>
                    <div className="text-sm font-semibold">Giriş/Çıkış</div>
                    <div className="text-sm">
                      Giriş: {policy.checkInTime}, Çıkış: {policy.checkOutTime}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">İptal Politikası</div>
                    <div className="text-sm">{policy.cancellationPolicy}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-semibold">Çocuk Politikası</div>
                    <div className="text-sm">{policy.childrenPolicy}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">
                      Evcil Hayvan Politikası
                    </div>
                    <div className="text-sm">{policy.petPolicy}</div>
                  </div>
                </div>
                {policy.depositRequired && (
                  <div className="mt-2">
                    <div className="text-sm font-semibold">Depozito</div>
                    <div className="text-sm">
                      {policy.depositAmount
                        ? `${policy.depositAmount} TL depozito alınır`
                        : "Depozito gereklidir"}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-center mb-4">
              <p className="text-muted-foreground">
                Henüz hiç otel koşulu eklenmemiş
              </p>
            </div>
            <Button onClick={() => window.location.href = "/admin/hotel-policies/create"}>
              <Plus className="mr-2 h-4 w-4" /> Yeni Koşul Ekle
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <AdminLayout activeMenuItem="policies">
      {renderPolicyList()}
    </AdminLayout>
  );
}