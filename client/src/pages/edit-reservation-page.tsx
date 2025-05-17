import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getQueryFn, apiRequest, queryClient } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import MainLayout from '@/components/layout/main-layout';
import { useDeviceType } from '@/hooks/use-mobile';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle,
  User2,
  Home,
  Loader2,
  AlertCircle,
  CreditCard,
  Landmark,
  MessageSquare
} from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Form şeması
const reservationFormSchema = z.object({
  checkIn: z.date({
    required_error: "Giriş tarihi gereklidir",
  }),
  checkOut: z.date({
    required_error: "Çıkış tarihi gereklidir",
  }),
  guestCount: z.coerce.number().min(1, {
    message: "En az 1 misafir gereklidir",
  }),
  paymentMethod: z.enum(["on_site", "credit_card"], {
    required_error: "Ödeme yöntemi seçilmelidir",
  }),
  specialRequests: z.string().optional(),
}).refine(data => {
  return data.checkOut > data.checkIn;
}, {
  message: "Çıkış tarihi giriş tarihinden sonra olmalıdır",
  path: ["checkOut"],
});

type ReservationFormValues = z.infer<typeof reservationFormSchema>;

export default function EditReservationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // URL'den rezervasyon ID'sini al
  const [, params] = useLocation();
  const pathSegments = window.location.pathname.split('/');
  const reservationId = pathSegments[pathSegments.length - 1];

  // Mevcut rezervasyonu getir
  const { data: reservation, isLoading: reservationLoading } = useQuery({
    queryKey: [`/api/reservations/${reservationId}`],
    queryFn: getQueryFn(),
    enabled: !!reservationId,
  });

  // İlgili rezervasyonun odasını getir
  const { data: room, isLoading: roomLoading } = useQuery({
    queryKey: [`/api/rooms/${reservation?.roomId}`],
    queryFn: getQueryFn(),
    enabled: !!reservation?.roomId,
  });

  // İlgili oteli getir
  const { data: hotel, isLoading: hotelLoading } = useQuery({
    queryKey: [`/api/hotels/${room?.hotelId}`],
    queryFn: getQueryFn(),
    enabled: !!room?.hotelId,
  });

  // Form oluştur
  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      checkIn: new Date(),
      checkOut: new Date(new Date().setDate(new Date().getDate() + 1)),
      guestCount: 2,
      paymentMethod: "on_site",
      specialRequests: "",
    },
  });

  // Rezervasyon verileri geldiğinde formu doldur
  useEffect(() => {
    if (reservation) {
      form.reset({
        checkIn: new Date(reservation.checkIn),
        checkOut: new Date(reservation.checkOut),
        guestCount: reservation.numberOfGuests,
        paymentMethod: reservation.paymentMethod as "on_site" | "credit_card",
        specialRequests: reservation.specialRequests || "",
      });
    }
  }, [reservation, form]);

  // Rezervasyon güncelleme mutation'ı
  const updateReservationMutation = useMutation({
    mutationFn: async (data: ReservationFormValues) => {
      if (!reservationId) {
        throw new Error("Rezervasyon ID'si bulunamadı");
      }
      
      // Toplam gecelik hesapla
      const checkInDate = new Date(data.checkIn);
      const checkOutDate = new Date(data.checkOut);
      const nights = Math.ceil(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Gece başına fiyat
      const nightlyPrice = room?.price || 0;
      const totalPrice = nightlyPrice * nights;
      
      const updatedReservation = {
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        numberOfGuests: data.guestCount,
        totalPrice,
        paymentMethod: data.paymentMethod,
        specialRequests: data.specialRequests,
      };
      
      const response = await apiRequest(
        "PUT",
        `/api/reservations/${reservationId}`,
        updatedReservation
      );
      
      return await response.json();
    },
    onSuccess: (data) => {
      setIsSuccess(true);
      
      toast({
        title: "Rezervasyon Güncellendi",
        description: "Rezervasyon bilgileriniz başarıyla güncellendi.",
        variant: "default",
      });
      
      // Rezervasyonları yeniden getir
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      queryClient.invalidateQueries({ queryKey: [`/api/reservations/${reservationId}`] });
      
      // Kısa bir süre sonra rezervasyon sayfasına yönlendir
      setTimeout(() => {
        setLocation("/reservations");
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Rezervasyon güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: ReservationFormValues) => {
    setIsSubmitting(true);
    updateReservationMutation.mutate(data);
  };

  // Gecelik sayısını ve toplam fiyatı hesapla
  const checkIn = form.watch("checkIn");
  const checkOut = form.watch("checkOut");
  const nightCount = checkIn && checkOut 
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)) 
    : 0;
  const totalPrice = (room?.price || 0) * nightCount;

  // Yükleniyor durumu
  if (reservationLoading || roomLoading || hotelLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#2094f3]" />
            <p className="mt-4 text-neutral-600">Rezervasyon bilgileri yükleniyor...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Rezervasyon, oda veya otel bulunamadı
  if (!reservation || !room || !hotel) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center text-center max-w-md px-4">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-lg font-bold text-neutral-800 mb-2">Rezervasyon Bulunamadı</h2>
            <p className="text-neutral-600 mb-6">İstediğiniz rezervasyon bilgilerine ulaşılamadı.</p>
            <Button onClick={() => setLocation("/reservations")}>
              Rezervasyonlarım
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Başarılı durumu
  if (isSuccess) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center text-center max-w-md px-4">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-xl font-bold text-neutral-800 mb-2">Rezervasyon Güncellendi</h2>
            <p className="text-neutral-600 mb-6">Rezervasyon bilgileriniz başarıyla güncellendi.</p>
            <p className="text-neutral-500 text-sm mb-6">Rezervasyonlarım sayfasına yönlendiriliyorsunuz...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Mobil başlık bileşeni
  const MobileHeader = () => (
    <div className="sticky top-0 left-0 right-0 bg-gradient-to-r from-[#2094f3] to-[#30b8f3] dark:from-[#1a75c2] dark:to-[#2094f3] border-b border-[#65c0ff]/30 shadow-lg shadow-[#2094f3]/10 backdrop-blur-lg z-10 py-3 px-4">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="text-white mr-3"
          onClick={() => setLocation("/reservations")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-white font-semibold text-lg">Rezervasyon Düzenle</h1>
          <p className="text-white/80 text-xs">#{reservationId}</p>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      {isMobile && <MobileHeader />}
      
      <div className="container max-w-6xl px-4 py-8">
        {!isMobile && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[#2094f3]"
                onClick={() => setLocation("/reservations")}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Rezervasyonlarım
              </Button>
              <span className="text-neutral-400">/</span>
              <span className="text-neutral-600">Rezervasyon #{reservationId} Düzenle</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">Rezervasyon Düzenle</h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Rezervasyon detaylarınızı buradan güncelleyebilirsiniz.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Rezervasyon Bilgileri</CardTitle>
                <CardDescription>
                  Lütfen konaklamanız için gereken bilgileri eksiksiz doldurun.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="checkIn"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Giriş Tarihi</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {field.value ? (
                                        format(field.value, "PPP", { locale: tr })
                                      ) : (
                                        <span>Tarih seçin</span>
                                      )}
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="checkOut"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Çıkış Tarihi</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {field.value ? (
                                        format(field.value, "PPP", { locale: tr })
                                      ) : (
                                        <span>Tarih seçin</span>
                                      )}
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="guestCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Misafir Sayısı</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              defaultValue={field.value.toString()}
                              value={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Misafir sayısı seçin" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">1 Kişi</SelectItem>
                                <SelectItem value="2">2 Kişi</SelectItem>
                                <SelectItem value="3">3 Kişi</SelectItem>
                                <SelectItem value="4">4 Kişi</SelectItem>
                                <SelectItem value="5">5 Kişi</SelectItem>
                                <SelectItem value="6">6 Kişi</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ödeme Yöntemi</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Ödeme yöntemi seçin" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="on_site">
                                  <div className="flex items-center gap-2">
                                    <Landmark className="h-4 w-4" />
                                    <span>Otelde Öde</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="credit_card">
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    <span>Kredi Kartı</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="specialRequests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Özel İstekler</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Örn: Odanın üst katta olmasını tercih ederim, alerjilerim var, vb."
                                {...field}
                                className="resize-none"
                                rows={4}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <CardFooter className="px-0 pt-4 pb-0 border-t border-neutral-700">
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Rezervasyonu Güncelle
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Rezervasyon Özeti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-medium text-neutral-800 dark:text-white">{hotel.name}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{hotel.address}</p>
                </div>
                
                <div className="space-y-1 border-t border-b border-neutral-200 dark:border-neutral-700 py-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <h3 className="font-medium text-neutral-800 dark:text-white">{room.name}</h3>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-[#2094f3] dark:text-[#38b6ff] font-medium">{room.price.toLocaleString()}₺/gece</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-neutral-600 dark:text-neutral-400 mt-2">
                    <span>Konaklama: {nightCount} gece</span>
                    <span>{totalPrice.toLocaleString()}₺</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center font-semibold text-lg">
                  <span>Toplam Tutar</span>
                  <span className="text-[#2094f3] dark:text-[#38b6ff]">{totalPrice.toLocaleString()}₺</span>
                </div>
              </CardContent>
            </Card>
            
            <div className="mt-4">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-base">Otel Politikaları</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-neutral-800 dark:text-white mb-1">İptal Politikası</p>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                      Giriş tarihinden 48 saat öncesine kadar ücretsiz iptal edilebilir. Daha sonra yapılan iptallerde ilk gece ücreti alınır.
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="font-medium text-neutral-800 dark:text-white mb-1">Giriş/Çıkış Saatleri</p>
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>Giriş (Check-in): 14:00</span>
                      <span>Çıkış (Check-out): 12:00</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}