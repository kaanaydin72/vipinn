import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import AdminLayout from "@/components/admin/admin-layout";
import { HotelPolicy, Hotel } from "@shared/schema";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Clock, Building2, BadgeInfo, Users, BedDouble, Trash2, Edit, Plus, RefreshCw, Compass, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const formSchema = z.object({
  hotelId: z.coerce.number({
    required_error: "Lütfen bir otel seçin",
  }),
  title: z.string().min(1, "Başlık gereklidir"),
  description: z.string().min(1, "Açıklama gereklidir"),
  cancellationPolicy: z.string().min(1, "İptal politikası gereklidir"),
  cancellationDays: z.coerce.number().min(0, "Gün sayısı 0 veya daha büyük olmalıdır").default(1),
  checkInTime: z.string().min(1, "Giriş saati gereklidir"),
  checkOutTime: z.string().min(1, "Çıkış saati gereklidir"),
  childrenPolicy: z.string().min(1, "Çocuk politikası gereklidir"),
  petPolicy: z.string().min(1, "Evcil hayvan politikası gereklidir"),
  extraBedPolicy: z.string().nullable().optional(),
  extraBedPrice: z.number().nullable().optional(),
  otherRules: z.array(z.string()).optional(),
  depositRequired: z.boolean().default(false),
  depositAmount: z.number().nullable().optional()
});

type FormValues = z.infer<typeof formSchema>;

export default function HotelPolicies() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPolicy, setCurrentPolicy] = useState<HotelPolicy | null>(null);
  const [otherRuleInput, setOtherRuleInput] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      cancellationPolicy: "Rezervasyon başlangıç tarihinden 24 saat öncesine kadar ücretsiz iptal edilebilir.",
      cancellationDays: 1,
      checkInTime: "14:00",
      checkOutTime: "12:00",
      childrenPolicy: "12 yaş altı çocuklar için ilave yatak ücretsizdir.",
      petPolicy: "Evcil hayvan kabul edilmemektedir.",
      extraBedPolicy: "",
      extraBedPrice: null,
      otherRules: [],
      depositRequired: false,
      depositAmount: null
    }
  });

  // API çağrıları
  const { data: policies, isLoading: isLoadingPolicies, error: policiesError } = useQuery({
    queryKey: ["/api/hotel-policies"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/hotel-policies");
      const data = await res.json();
      return data as HotelPolicy[];
    }
  });

  const { data: hotels, isLoading: isLoadingHotels } = useQuery({
    queryKey: ["/api/hotels"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/hotels");
      const data = await res.json();
      return data as Hotel[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/hotel-policies", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Otel koşulları başarıyla oluşturuldu.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hotel-policies"] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Otel koşulları oluşturulurken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        variant: "destructive",
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number, data: Partial<FormValues> }) => {
      const res = await apiRequest("PUT", `/api/hotel-policies/${data.id}`, data.data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Otel koşulları başarıyla güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hotel-policies"] });
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Otel koşulları güncellenirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        variant: "destructive",
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/hotel-policies/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Otel koşulları başarıyla silindi.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hotel-policies"] });
      setIsDeleteDialogOpen(false);
      setCurrentPolicy(null);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: `Otel koşulları silinirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (values: FormValues) => {
    createMutation.mutate(values);
  };

  const onEdit = (policy: HotelPolicy) => {
    setCurrentPolicy(policy);
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
      extraBedPolicy: policy.extraBedPolicy,
      extraBedPrice: policy.extraBedPrice,
      otherRules: policy.otherRules || [],
      depositRequired: policy.depositRequired,
      depositAmount: policy.depositAmount
    });
    setIsEditDialogOpen(true);
  };

  const onUpdate = (values: FormValues) => {
    if (!currentPolicy) return;
    updateMutation.mutate({ id: currentPolicy.id, data: values });
  };

  const onDelete = (policy: HotelPolicy) => {
    setCurrentPolicy(policy);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!currentPolicy) return;
    deleteMutation.mutate(currentPolicy.id);
  };

  const addOtherRule = () => {
    if (!otherRuleInput.trim()) return;
    const currentRules = form.getValues("otherRules") || [];
    form.setValue("otherRules", [...currentRules, otherRuleInput.trim()]);
    setOtherRuleInput("");
  };

  const removeOtherRule = (index: number) => {
    const currentRules = form.getValues("otherRules") || [];
    form.setValue("otherRules", currentRules.filter((_, i) => i !== index));
  };

  const getHotelName = (hotelId: number) => {
    if (!hotels) return "Bilinmeyen Otel";
    const hotel = hotels.find(h => h.id === hotelId);
    return hotel ? hotel.name : "Bilinmeyen Otel";
  };

  // Eğer kullanıcı admin değilse, erişim reddedildi mesajı göster
  if (!user?.isAdmin) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <Alert variant="destructive" className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erişim Reddedildi</AlertTitle>
            <AlertDescription>
              Bu sayfaya erişim yetkiniz bulunmamaktadır. Lütfen yönetici hesabıyla giriş yapın.
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Otel Koşulları Yönetimi</h1>
            <p className="text-muted-foreground">
              Otellerin rezervasyon, iptal ve konaklama koşullarını buradan yönetebilirsiniz.
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Koşul Ekle
          </Button>
        </div>

        {policiesError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Hata</AlertTitle>
            <AlertDescription>
              Otel koşulları yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
            </AlertDescription>
          </Alert>
        )}

        {/* Koşullar listesi */}
        {isLoadingPolicies ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : policies && policies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {policies.map((policy) => (
              <Card key={policy.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        <Building2 className="h-3 w-3 mr-1" />
                        {getHotelName(policy.hotelId)}
                      </Badge>
                      <CardTitle>{policy.title}</CardTitle>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(policy)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(policy)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="general">
                    <TabsList className="w-full mb-4">
                      <TabsTrigger value="general" className="flex-1">Genel</TabsTrigger>
                      <TabsTrigger value="times" className="flex-1">Saat/Zaman</TabsTrigger>
                      <TabsTrigger value="rules" className="flex-1">Kurallar</TabsTrigger>
                    </TabsList>
                    <TabsContent value="general">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium">Açıklama</h4>
                          <p className="text-sm text-muted-foreground">{policy.description}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">İptal Politikası</h4>
                          <p className="text-sm text-muted-foreground">{policy.cancellationPolicy}</p>
                          <div className="text-xs mt-1 flex items-center text-muted-foreground">
                            <span className="font-medium">İptal için gün sayısı:</span>
                            <span className="ml-1">{policy.cancellationDays} gün</span>
                          </div>
                        </div>
                        {policy.depositRequired && (
                          <div>
                            <h4 className="text-sm font-medium">Depozito</h4>
                            <p className="text-sm text-muted-foreground">
                              {policy.depositAmount} TL
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="times">
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>
                            <h4 className="text-sm font-medium">Giriş Saati</h4>
                            <p className="text-sm text-muted-foreground">{policy.checkInTime}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div>
                            <h4 className="text-sm font-medium">Çıkış Saati</h4>
                            <p className="text-sm text-muted-foreground">{policy.checkOutTime}</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="rules">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium">Çocuk Politikası</h4>
                          <p className="text-sm text-muted-foreground">{policy.childrenPolicy}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Evcil Hayvan Politikası</h4>
                          <p className="text-sm text-muted-foreground">{policy.petPolicy}</p>
                        </div>
                        {policy.extraBedPolicy && (
                          <div>
                            <h4 className="text-sm font-medium">İlave Yatak Politikası</h4>
                            <p className="text-sm text-muted-foreground">{policy.extraBedPolicy}</p>
                          </div>
                        )}
                        {policy.otherRules && policy.otherRules.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium">Diğer Kurallar</h4>
                            <ul className="text-sm text-muted-foreground list-disc pl-5 mt-1">
                              {policy.otherRules.map((rule, index) => (
                                <li key={index}>{rule}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="pt-0 border-t text-xs text-muted-foreground">
                  <div className="flex items-center justify-between w-full">
                    <span>Son Güncelleme:</span>
                    <span>{new Date(policy.updatedAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Kayıtlı Koşul Bulunamadı</CardTitle>
              <CardDescription>
                Henüz hiçbir otel için koşul tanımlanmamış. Yeni bir koşul eklemek için "Yeni Koşul Ekle" butonuna tıklayın.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(true)}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Koşul Ekle
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Yeni Koşul Ekleme Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Yeni Otel Koşulu Ekle</DialogTitle>
              <DialogDescription>
                Otel için rezervasyon ve konaklama koşullarını belirleyin.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-4">
              <div className="py-4">
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
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
                                onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
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
                              value={field.value || ""}
                              placeholder="Örn: İlave yatak günlük 300 TL ücretle temin edilebilir."
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
                          <FormLabel>İlave Yatak Fiyatı (TL)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              {...field} 
                              onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                              value={field.value || ""}
                              placeholder="Örn: 300"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3">
                      <h3 className="text-lg font-medium">Diğer Kurallar</h3>
                      <div className="flex gap-2">
                        <Input
                          value={otherRuleInput}
                          onChange={(e) => setOtherRuleInput(e.target.value)}
                          placeholder="Yeni kural ekleyin"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addOtherRule();
                            }
                          }}
                        />
                        <Button type="button" onClick={addOtherRule}>Ekle</Button>
                      </div>
                      {form.watch("otherRules")?.length > 0 && (
                        <div className="border rounded-md p-3">
                          <h4 className="text-sm font-medium mb-2">Eklenen Kurallar:</h4>
                          <ul className="space-y-2">
                            {form.watch("otherRules")?.map((rule, index) => (
                              <li key={index} className="flex justify-between items-center text-sm">
                                <span>{rule}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeOtherRule(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </form>
                </Form>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                İptal
              </Button>
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                )}
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Düzenleme Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Otel Koşulunu Düzenle</DialogTitle>
              <DialogDescription>
                Otel koşullarını güncelleyin.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-4">
              <div className="py-4">
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
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
                                onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
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
                              value={field.value || ""}
                              placeholder="Örn: İlave yatak günlük 300 TL ücretle temin edilebilir."
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
                          <FormLabel>İlave Yatak Fiyatı (TL)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="0"
                              {...field} 
                              onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                              value={field.value || ""}
                              placeholder="Örn: 300"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3">
                      <h3 className="text-lg font-medium">Diğer Kurallar</h3>
                      <div className="flex gap-2">
                        <Input
                          value={otherRuleInput}
                          onChange={(e) => setOtherRuleInput(e.target.value)}
                          placeholder="Yeni kural ekleyin"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addOtherRule();
                            }
                          }}
                        />
                        <Button type="button" onClick={addOtherRule}>Ekle</Button>
                      </div>
                      {form.watch("otherRules")?.length > 0 && (
                        <div className="border rounded-md p-3">
                          <h4 className="text-sm font-medium mb-2">Eklenen Kurallar:</h4>
                          <ul className="space-y-2">
                            {form.watch("otherRules")?.map((rule, index) => (
                              <li key={index} className="flex justify-between items-center text-sm">
                                <span>{rule}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeOtherRule(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </form>
                </Form>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                İptal
              </Button>
              <Button
                onClick={form.handleSubmit(onUpdate)}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                )}
                Güncelle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Silme Onay Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Otel Koşulunu Sil</DialogTitle>
              <DialogDescription>
                Bu işlem geri alınamaz. Bu koşulu silmek istediğinizden emin misiniz?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                İptal
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                )}
                Sil
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}