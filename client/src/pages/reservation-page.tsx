import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Room, Hotel, insertReservationSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar as CalendarIcon, CreditCard, Check, Users, CalendarDays, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";

// Extended schema for form validation
const reservationFormSchema = z.object({
  roomId: z.coerce.number(),
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
  phone: z.string().min(10, "Telefon numarası en az 10 karakter olmalıdır").max(20, "Telefon numarası çok uzun"),
  specialRequests: z.string().optional(),
}).refine(data => {
  return data.checkOut > data.checkIn;
}, {
  message: "Çıkış tarihi giriş tarihinden sonra olmalıdır",
  path: ["checkOut"],
});

type ReservationFormValues = z.infer<typeof reservationFormSchema>;

export default function ReservationPage() {
  const [, setLocation] = useLocation();
  const location = useLocation()[0];
  const { toast } = useToast();
  const { user, isLoading: isLoadingUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Get parameters from URL
  const params = new URLSearchParams(window.location.search);
  const roomId = parseInt(params.get("roomId") || "0");
  const checkInParam = params.get("checkIn");
  const checkOutParam = params.get("checkOut");
  const adultsParam = parseInt(params.get("adults") || "1");
  const childrenParam = parseInt(params.get("children") || "0");
  
  // Convert URL date strings to Date objects if provided
  // Tarih formatını doğru şekilde parse et (YYYY-MM-DD formatı)
  const checkInDate = checkInParam 
    ? new Date(checkInParam + 'T12:00:00') // Saat kısmını ekleyerek tarih kayması sorununu önle
    : new Date();
    
  const checkOutDate = checkOutParam 
    ? new Date(checkOutParam + 'T12:00:00') 
    : new Date(new Date().setDate(new Date().getDate() + 1));
  
  // Tarih parametrelerinin saat dilimi farkı nedeniyle bir gün kaymasını önlemek için ayarlama
  const adjustedCheckIn = new Date(checkInDate);
  const adjustedCheckOut = new Date(checkOutDate);
  
  // Debug logs
  console.log("Window location:", window.location.href);
  console.log("Search params:", window.location.search);
  console.log("RoomId from URL:", roomId);
  console.log("CheckIn from URL param:", checkInParam);
  console.log("CheckOut from URL param:", checkOutParam);
  console.log("Adjusted CheckIn date:", adjustedCheckIn);
  console.log("Adjusted CheckOut date:", adjustedCheckOut);
  console.log("Adults from URL:", adultsParam);
  console.log("Children from URL:", childrenParam);
  
  // Fetch all rooms and find the specific one
  const { data: rooms, isLoading: isLoadingRooms } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });
  
  // Find the selected room from all rooms
  const room = useMemo(() => {
    return rooms?.find(r => r.id === roomId);
  }, [rooms, roomId]);
  
  const isLoadingRoom = isLoadingRooms;
  
  // Fetch hotel details if room is available
  const { data: hotel, isLoading: isLoadingHotel } = useQuery<Hotel>({
    queryKey: [`/api/hotels/${room?.hotelId}`],
    enabled: !!room?.hotelId,
  });
  
  // Set up form with default values from URL or fallback to defaults
  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      roomId,
      checkIn: adjustedCheckIn,
      checkOut: adjustedCheckOut,
      guestCount: adultsParam + childrenParam, // Toplam misafir sayısı
      paymentMethod: "on_site", // Default olarak otelde ödeme
      phone: user?.phone || "", // Kullanıcının telefon numarası (varsa)
      specialRequests: "",
    },
  });
  
  // Create reservation mutation
  const [createdReservation, setCreatedReservation] = useState<any>(null);

  const createReservationMutation = useMutation({
    mutationFn: async (data: ReservationFormValues) => {
      // Takvim bazlı fiyatlandırma ile toplam fiyatı hesapla
      const totalPrice = calculateDailyPrice();
      
      // Format dates to ISO strings for the API and match schema field names
      // First convert to Date objects for safety, then to ISO strings
      const checkInDate = new Date(data.checkIn);
      const checkOutDate = new Date(data.checkOut);
      
      // Şema ile aynı alan adlarını kullanarak veri oluştur
      const reservationData = {
        userId: user?.id, // Bu değer sunucu tarafında otomatik olarak ekleniyor ancak yine de gönderelim
        roomId: data.roomId,
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        numberOfGuests: data.guestCount, // API'da bu alanı bekliyor
        paymentMethod: data.paymentMethod, // Ödeme yöntemini ekledik
        phone: data.phone, // Telefon numarasını ekleyelim (PayTR için önemli)
        totalPrice: totalPrice
      };
      
      console.log("Sending reservation data:", reservationData);
      const res = await apiRequest("POST", "/api/reservations", reservationData);
      return await res.json();
    },
    onSuccess: (response) => {
      console.log("Rezervasyon başarılı, yanıt:", response);
      
      // Rezervasyon yanıtını state'e kaydet
      setCreatedReservation(response);
      
      // Ödeme yöntemine göre farklı işlem yapılır
      if (form.getValues("paymentMethod") === "credit_card") {
        // Hem response.payment?.url hem de response.paymentUrl kontrol et (farklı API yanıt formatlarına uyum için)
        const paymentUrl = response.paymentUrl || response.payment?.url;
        
        if (paymentUrl) {
          console.log("Kredi kartı ödemesi için yönlendiriliyor:", paymentUrl);
          
          // Rezervasyon başarılı mesajı göster
          toast({
            title: "Rezervasyon Onaylandı",
            description: "Rezervasyonunuz başarıyla oluşturuldu. Ödeme sayfasına yönlendiriliyorsunuz...",
            variant: "default",
          });
          
          // Kredi kartı ödemesi için PayTR sayfasına yönlendirme
          // Önce 2 saniye bekleyip sonra yönlendir
          setTimeout(() => {
            try {
              // Console log to see the structure clearly
              console.log("Extracting reservationId from response:", response);
              
              // Rezervasyon ID'sini almaya çalış - farklı response formatlarına uyumlu
              let reservationId = null;
              
              // 1. Doğrudan response.id 
              if (response.id) {
                reservationId = response.id;
              }
              // 2. response.reservation.id
              else if (response.reservation && response.reservation.id) {
                reservationId = response.reservation.id;
              }
              // 3. createdReservation'dan bul
              else if (createdReservation && createdReservation.id) {
                reservationId = createdReservation.id;
              }
              // 4. Son çare - eğer response kendisi bir reservation objesi ise
              else if (response.roomId && response.userId && response.checkIn) {
                reservationId = response.id;
              }
              
              console.log("Extracted reservationId:", reservationId);
              
              if (!reservationId) {
                console.error("Reservation ID could not be found in:", response);
                throw new Error("Rezervasyon ID'si bulunamadı");
              }
              
              // PayTR ödeme sayfasına yönlendir
              console.log("PayTR ödeme sayfasına yönlendiriliyor:", paymentUrl);
              
              // Düzgün çalışmıyorsa simülasyon sayfasına yönlendirmeyi deneyin
              if (paymentUrl.includes("paytr.com")) {
                window.location.href = paymentUrl;
              } else {
                console.log("PayTR URL bulunamadı, simülasyon sayfasına yönlendiriliyor");
                setLocation(`/payment-simulation/${reservationId}`);
              }
            } catch (error) {
              console.error("Ödeme sayfasına yönlendirme hatası:", error);
              // Hata durumunda rezervasyonlar sayfasına yönlendir
              toast({
                title: "Ödeme Hatası",
                description: "Ödeme sayfasına yönlendirilemedi. Rezervasyonlarınıza yönlendiriliyorsunuz.",
                variant: "destructive",
              });
              setTimeout(() => setLocation("/reservations"), 1500);
            }
          }, 2000);
        } else {
          // Ödeme URL'i yoksa hata bildir ve rezervasyonlar sayfasına yönlendir
          console.error("Ödeme URL'i alınamadı:", response);
          setIsSuccess(true);
          queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
          
          toast({
            title: "Ödeme Bilgisi Alınamadı",
            description: "Rezervasyonunuz oluşturuldu ancak ödeme sayfasına yönlendirilemedi. Rezervasyonlarınızı kontrol edebilirsiniz.",
            variant: "destructive",
          });
          
          setTimeout(() => {
            setLocation("/reservations");
          }, 2500);
        }
      } else {
        // Otelde ödeme veya başka bir durum için mevcut akış
        setIsSuccess(true);
        queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
        
        toast({
          title: "Rezervasyon Onaylandı",
          description: "Rezervasyonunuz başarıyla oluşturuldu.",
          variant: "default",
        });
        
        // Redirect to reservations page after 2 seconds
        setTimeout(() => {
          setLocation("/reservations");
        }, 2000);
      }
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Rezervasyon oluşturulurken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });
  
  const onSubmit = (data: ReservationFormValues) => {
    setIsSubmitting(true);
    createReservationMutation.mutate(data);
  };
  
  // Calculate total nights and price
  const checkIn = form.watch("checkIn");
  const checkOut = form.watch("checkOut");
  const guestCount = form.watch("guestCount");
  
  const totalNights = checkOut && checkIn 
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  // Takvim bazlı fiyatlandırma için günlük fiyatları hesapla
  const calculateDailyPrice = () => {
    if (!room || !checkIn || !checkOut) return 0;
    
    let totalPrice = 0;
    const oneDay = 24 * 60 * 60 * 1000; // 1 gün milisaniye cinsinden
    
    // Kaç gece konaklama olduğunu hesapla (çıkış tarihi dahil değil)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / oneDay);
    console.log(`Rezervasyon ${nights} gece için yapılıyor.`);
    
    if (nights <= 0) {
      console.error("Geçersiz tarih aralığı: Çıkış tarihi giriş tarihinden önce veya aynı gün");
      return 0;
    }
    
    try {
      console.log("Oda dailyPrices değeri:", room.dailyPrices);
      
      if (!room.dailyPrices) {
        console.error("Oda için dailyPrices bulunamadı!");
        return 0;
      }
      
      // dailyPrices'ı parse et
      const dailyPricesArray = typeof room.dailyPrices === 'string' 
        ? JSON.parse(room.dailyPrices) 
        : room.dailyPrices;
      
      console.log("Parse edilmiş dailyPrices:", dailyPricesArray);
      
      // Fiyat listesinde bulunan tarihleri düzgün formatta hazırla (YYYY-MM-DD)
      const availablePrices: Record<string, number> = {};
      
      dailyPricesArray.forEach((item: {date: string | Date, price: number}) => {
        if (item.date && item.price) {
          // Tarih formatını normalize et, sadece YYYY-MM-DD kısmını al
          const dateObj = new Date(item.date);
          const dateKey = dateObj.toISOString().split('T')[0];
          availablePrices[dateKey] = item.price;
        }
      });
      
      console.log("Normalize edilmiş tarih-fiyat listesi:", availablePrices);
      
      // Rezervasyon tarih aralığındaki her gün için fiyat topla
      let currentDate = new Date(checkIn);
      
      for (let i = 0; i < nights; i++) {
        const dateKey = currentDate.toISOString().split('T')[0];
        console.log(`Gece ${i+1} için tarih: ${dateKey}`);
        
        if (availablePrices[dateKey]) {
          totalPrice += availablePrices[dateKey];
          console.log(`${dateKey} tarihli gecenin fiyatı: ${availablePrices[dateKey]} TL`);
        } else {
          // Eğer o tarih için fiyat bulunamazsa, en son fiyatı kullan
          const lastPrice = dailyPricesArray.length > 0 
            ? dailyPricesArray[dailyPricesArray.length - 1].price 
            : 0;
          
          totalPrice += lastPrice;
          console.log(`${dateKey} tarihinin fiyatı bulunamadı. Varsayılan fiyat: ${lastPrice} TL kullanılıyor.`);
        }
        
        // Sonraki güne geç
        currentDate = new Date(currentDate.getTime() + oneDay);
      }
      
      console.log(`Toplam ${nights} gece için hesaplanan fiyat: ${totalPrice} TL`);
      
    } catch (error) {
      console.error("Fiyat hesaplama hatası:", error);
      return 0;
    }
    
    return totalPrice;
  };
  
  const totalPrice = calculateDailyPrice();
  
  const isLoading = isLoadingUser || isLoadingRoom || isLoadingHotel;
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!room || !hotel) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Oda Bulunamadı</h1>
            <p className="mb-6">Rezervasyon yapmak istediğiniz oda bilgilerine ulaşılamadı.</p>
            <Button onClick={() => setLocation("/hotels")}>
              Otellere Dön
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <div className="bg-green-100 dark:bg-green-900 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
              <Check className="h-12 w-12 text-green-600 dark:text-green-300" />
            </div>
            <h1 className="text-2xl font-bold mb-4 text-neutral-800 dark:text-white">Rezervasyon Onaylandı</h1>
            
            {createdReservation && createdReservation.reservationCode && (
              <div className="mb-6">
                <div className="inline-block bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2 text-blue-700 dark:text-blue-300">
                  <p className="font-medium">Rezervasyon Kodunuz:</p> 
                  <p className="text-xl font-bold tracking-wider">{createdReservation.reservationCode}</p>
                </div>
              </div>
            )}
            
            <p className="mb-6 text-neutral-600 dark:text-neutral-300">
              Rezervasyonunuz başarıyla oluşturuldu. Rezervasyon detaylarınız e-posta adresinize gönderilecektir.
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              Rezervasyon sayfanıza yönlendiriliyorsunuz...
            </p>
            <Button onClick={() => setLocation("/reservations")}>
              Rezervasyonlarıma Git
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Rezervasyon</h1>
            <p className="text-neutral-600 dark:text-neutral-300 mt-2">
              Rezervasyon detaylarınızı gözden geçirin ve tamamlayın.
            </p>
          </div>
          
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
                                        {field.value ? (
                                          format(field.value, "PPP", { locale: tr })
                                        ) : (
                                          <span>Tarih seçin</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) => date < new Date()}
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
                                        {field.value ? (
                                          format(field.value, "PPP", { locale: tr })
                                        ) : (
                                          <span>Tarih seçin</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) => date <= checkIn}
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
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  max={room.capacity}
                                  placeholder="1"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="paymentMethod"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Ödeme Yöntemi</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="flex flex-col space-y-1"
                                >
                                  <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-muted">
                                    <RadioGroupItem value="on_site" id="on_site" />
                                    <Label htmlFor="on_site" className="flex items-center cursor-pointer">
                                      <span className="font-medium">Otelde Ödeme</span>
                                      <span className="ml-auto text-sm text-muted-foreground">Check-in sırasında ödeme yapılır</span>
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-muted">
                                    <RadioGroupItem value="credit_card" id="credit_card" />
                                    <Label htmlFor="credit_card" className="flex items-center cursor-pointer">
                                      <CreditCard className="mr-2 h-4 w-4" />
                                      <span className="font-medium">Kredi Kartı ile Ödeme</span>
                                      <span className="ml-auto text-sm text-muted-foreground">Güvenli online ödeme</span>
                                    </Label>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefon Numarası</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="+90 5XX XXX XX XX"
                                  {...field}
                                  required
                                />
                              </FormControl>
                              <FormDescription>
                                Ödeme işlemleri ve rezervasyon onayları için telefon numaranız gereklidir.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="specialRequests"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Özel İstekler (Opsiyonel)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Özel isteklerinizi belirtebilirsiniz"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <CardFooter className="px-0 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={isSubmitting}
                        >
                          {isSubmitting && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Rezervasyonu Tamamla
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
                        <Badge className="ml-2">{room.type}</Badge>
                      </div>
                      <p className="font-medium text-neutral-800 dark:text-white">Takvim bazlı fiyatlandırma</p>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Kapasite: {room.capacity} Kişi
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <CalendarDays className="h-4 w-4 mr-2 text-neutral-500" />
                      <span className="text-neutral-600 dark:text-neutral-400">
                        {checkIn && format(checkIn, "d MMMM", { locale: tr })} - {checkOut && format(checkOut, "d MMMM yyyy", { locale: tr })}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2 text-neutral-500" />
                      <span className="text-neutral-600 dark:text-neutral-400">
                        {guestCount} Misafir
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">Geceleme</span>
                      <span className="text-neutral-800 dark:text-white">{totalNights} gece</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">Oda Ücreti</span>
                      <span className="text-neutral-800 dark:text-white">Takvim bazlı fiyatlandırma</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t border-neutral-200 dark:border-neutral-700">
                      <span>Toplam Tutar</span>
                      <span className="text-primary">{totalPrice} ₺</span>
                    </div>
                  </div>
                  
                  <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-md text-sm">
                    <h4 className="font-medium text-neutral-800 dark:text-white mb-2 flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-primary" />
                      Ödeme Bilgisi
                    </h4>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {form.watch("paymentMethod") === "on_site" 
                        ? "Ödeme, otele giriş sırasında doğrudan otele yapılacaktır. Nakit veya kredi kartı ile ödeme yapabilirsiniz."
                        : "Güvenli online ödeme sistemiyle şimdi ödeme yapabilirsiniz. Kredi kartı bilgileriniz PayTR güvenli ödeme sistemi üzerinden işlenecektir."
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}