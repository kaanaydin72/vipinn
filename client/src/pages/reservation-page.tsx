import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Room, Hotel } from "@shared/schema";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format, isAfter, addDays } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  CreditCard,
  Check,
  Users,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Custom mobil modal (daha iyi hissiyat için dilersen npm: react-modal-sheet kullanabilirsin)
function Modal({ open, onClose, children }: any) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/30"
      onClick={onClose}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <div
        className="bg-white dark:bg-neutral-900 rounded-t-xl w-full max-w-md mx-auto animate-slideUp"
        onClick={e => e.stopPropagation()}
        style={{ minHeight: 320, padding: 16 }}
      >
        {children}
      </div>
      <style>{`
        @keyframes slideUp { 0% { transform: translateY(100%); } 100% { transform: translateY(0);} }
        .animate-slideUp { animation: slideUp 0.35s cubic-bezier(.36,.66,.04,1) both; }
      `}</style>
    </div>
  );
}

// Medya sorgusu için
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// Schema
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
}).refine(data => isAfter(data.checkOut, data.checkIn), {
  message: "Çıkış tarihi girişten sonra olmalı",
  path: ["checkOut"],
});
type ReservationFormValues = z.infer<typeof reservationFormSchema>;

export default function ReservationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isLoadingUser } = useAuth();
  const isMobile = useIsMobile();
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // URL Params
  const params = new URLSearchParams(window.location.search);
  const roomId = parseInt(params.get("roomId") || "0");
  const checkInParam = params.get("checkIn");
  const checkOutParam = params.get("checkOut");
  const adultsParam = parseInt(params.get("adults") || "1");
  const childrenParam = parseInt(params.get("children") || "0");
  const guestCountDefault = adultsParam + childrenParam;

  // Tarihleri parse et
  const checkInDate = checkInParam ? new Date(checkInParam + "T12:00:00") : new Date();
  const checkOutDate = checkOutParam
    ? new Date(checkOutParam + "T12:00:00")
    : addDays(checkInDate, 1);

  // API
  const { data: rooms, isLoading: isLoadingRooms } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });
  const room = useMemo(() => rooms?.find((r) => r.id === roomId), [rooms, roomId]);
  const { data: hotel, isLoading: isLoadingHotel } = useQuery<Hotel>({
    queryKey: [`/api/hotels/${room?.hotelId}`],
    enabled: !!room?.hotelId,
  });

  // Form setup
  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guestCount: guestCountDefault,
      paymentMethod: "on_site",
      phone: user?.phone || "",
      specialRequests: "",
    },
  });

  // Takvim kontrolü
  const checkIn = form.watch("checkIn");
  const checkOut = form.watch("checkOut");
  const guestCount = form.watch("guestCount");

  // Oda uygun mu/fiyat var mı?
  const [available, totalNights, totalPrice] = useMemo(() => {
    if (!room || !checkIn || !checkOut || guestCount > room.capacity) return [false, 0, 0];

    let total = 0;
    const oneDay = 24 * 60 * 60 * 1000;
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / oneDay);
    if (nights <= 0) return [false, 0, 0];
    let ok = true;
    try {
      const dailyPricesArray =
        typeof room.dailyPrices === "string"
          ? JSON.parse(room.dailyPrices)
          : room.dailyPrices;
      const priceMap: Record<string, number> = {};
      dailyPricesArray.forEach((d: any) => {
        if (d.date && d.price) priceMap[new Date(d.date).toISOString().split("T")[0]] = d.price;
      });

      let d = new Date(checkIn);
      for (let i = 0; i < nights; i++) {
        const key = d.toISOString().split("T")[0];
        if (!priceMap[key]) {
          ok = false;
          break;
        }
        total += priceMap[key];
        d = new Date(d.getTime() + oneDay);
      }
      return [ok, nights, ok ? total : 0];
    } catch {
      return [false, 0, 0];
    }
  }, [room, checkIn, checkOut, guestCount]);

  // Submit
  const mutation = useMutation({
    mutationFn: async (data: ReservationFormValues) => {
      const reservationData = {
        userId: user?.id,
        roomId: data.roomId,
        checkIn: data.checkIn.toISOString(),
        checkOut: data.checkOut.toISOString(),
        numberOfGuests: data.guestCount,
        paymentMethod: data.paymentMethod,
        phone: data.phone,
        totalPrice,
      };
      const res = await apiRequest("POST", "/api/reservations", reservationData);
      return await res.json();
    },
    onSuccess: (response, variables) => {
      // Kredi kartı ile ödeme yönlendirme
      if (variables.paymentMethod === "credit_card") {
        const paymentUrl = response.paymentUrl || response.payment?.url;
        if (paymentUrl) {
          setTimeout(() => {
            window.location.href = paymentUrl;
          }, 1500);
          toast({
            title: "Rezervasyon Onaylandı",
            description: "Ödeme sayfasına yönlendiriliyorsunuz...",
          });
          return;
        }
      }
      setIsSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      setTimeout(() => setLocation("/reservations"), 1600);
    },
    onError: (e: any) => {
      toast({ title: "Hata", description: e.message, variant: "destructive" });
    },
    onSettled: () => setIsSubmitting(false),
  });

  // Takvim modalında seçim
  function handleDateSelect(date: Date) {
    // Giriş seçildi -> çıkış 1 gün sonrası
    form.setValue("checkIn", date);
    const out = addDays(date, 1);
    form.setValue("checkOut", out);
    setTimeout(() => setModalOpen(false), 350); // Modal animasyonlu kapansın
  }
  function handleCheckOutChange(date: Date) {
    form.setValue("checkOut", date);
    setTimeout(() => setModalOpen(false), 350); // Modal animasyonlu kapansın
  }

  // Masaüstünde popover, mobilde modal
  function CalendarField() {
    return isMobile ? (
      <>
        <Button
          onClick={() => setModalOpen(true)}
          className="w-full text-left py-4 px-3 border mb-2"
          variant="outline"
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
          {checkIn && checkOut
            ? `${format(checkIn, "d MMMM", { locale: tr })} - ${format(
                checkOut,
                "d MMMM yyyy",
                { locale: tr }
              )}`
            : "Tarih seçin"}
        </Button>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <div>
            <div className="text-center font-bold mb-2">Giriş Tarihi</div>
            <Calendar
              mode="single"
              selected={checkIn}
              onSelect={handleDateSelect}
              locale={tr}
              disabled={date => date < new Date()}
              initialFocus
            />
            <div className="text-center font-bold mt-6 mb-2">Çıkış Tarihi</div>
            <Calendar
              mode="single"
              selected={checkOut}
              onSelect={handleCheckOutChange}
              locale={tr}
              disabled={date => !checkIn || date <= checkIn}
              initialFocus
            />
          </div>
        </Modal>
      </>
    ) : (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full pl-3 text-left py-4"
            type="button"
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
            {checkIn && checkOut
              ? `${format(checkIn, "d MMMM", { locale: tr })} - ${format(
                  checkOut,
                  "d MMMM yyyy",
                  { locale: tr }
                )}`
              : "Tarih seçin"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4">
            <div className="font-bold mb-2">Giriş Tarihi</div>
            <Calendar
              mode="single"
              selected={checkIn}
              onSelect={date => {
                form.setValue("checkIn", date);
                form.setValue("checkOut", addDays(date, 1));
              }}
              locale={tr}
              disabled={date => date < new Date()}
              initialFocus
            />
            <div className="font-bold mt-6 mb-2">Çıkış Tarihi</div>
            <Calendar
              mode="single"
              selected={checkOut}
              onSelect={date => form.setValue("checkOut", date)}
              locale={tr}
              disabled={date => !checkIn || date <= checkIn}
              initialFocus
            />
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Loading / error / success states
  if (isLoadingUser || isLoadingRooms || isLoadingHotel)
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );

  if (!room || !hotel)
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center">
          <h1 className="text-xl font-bold mb-4">Oda veya Otel bulunamadı</h1>
          <Button onClick={() => setLocation("/hotels")}>Otellere Dön</Button>
        </main>
        <Footer />
      </div>
    );

  if (isSuccess)
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center py-12">
          <div className="bg-green-100 dark:bg-green-900 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
            <Check className="h-12 w-12 text-green-600 dark:text-green-300" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-neutral-800 dark:text-white">
            Rezervasyon Onaylandı
          </h1>
          <Button onClick={() => setLocation("/reservations")}>
            Rezervasyonlarıma Git
          </Button>
        </main>
        <Footer />
      </div>
    );

  // ASIL SAYFA
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900">
      <Header />
      <main className="flex-grow py-6">
        <div className="max-w-lg mx-auto w-full px-2">
          {/* Oda & fiyat yukarıda */}
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <h2 className="font-bold text-lg">{room.name}</h2>
                  <Badge className="ml-2">{room.type}</Badge>
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-300">{hotel.name}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-primary text-xl">
                  {available ? `${totalPrice.toLocaleString()} ₺` : "--"}
                </div>
                <div className="text-xs text-neutral-500">{available ? `${totalNights} gece` : "Tarih/kontenjan uygun değil"}</div>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rezervasyon Detayları</CardTitle>
              <CardDescription>
                Rezervasyonunuzu tamamlamak için lütfen aşağıdaki bilgileri doldurun.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => {
                    setIsSubmitting(true);
                    mutation.mutate(data);
                  })}
                  className="space-y-4"
                >
                  {/* Takvim */}
                  <FormField
                    control={form.control}
                    name="checkIn"
                    render={() => (
                      <FormItem>
                        <FormLabel>Tarih Aralığı</FormLabel>
                        <FormControl>
                          <CalendarField />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Misafir sayısı */}
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
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Ödeme */}
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Ödeme Yöntemi</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col gap-2"
                          >
                            <div className="flex items-center border rounded-md p-2">
                              <RadioGroupItem value="on_site" id="on_site" />
                              <Label htmlFor="on_site" className="ml-2">Otelde Ödeme</Label>
                              <span className="ml-auto text-xs text-neutral-400">Check-in sırasında ödeme yapılır</span>
                            </div>
                            <div className="flex items-center border rounded-md p-2">
                              <RadioGroupItem value="credit_card" id="credit_card" />
                              <Label htmlFor="credit_card" className="ml-2 flex items-center">
                                <CreditCard className="h-4 w-4 mr-1" />
                                Kredi Kartı ile Ödeme
                              </Label>
                              <span className="ml-auto text-xs text-neutral-400">Online ödeme</span>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Telefon */}
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Özel istek */}
                  <FormField
                    control={form.control}
                    name="specialRequests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Özel İstekler (Opsiyonel)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Özel isteklerinizi yazabilirsiniz"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Buton */}
                  <CardFooter className="px-0 pt-4">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={
                        isSubmitting ||
                        !available ||
                        !totalPrice ||
                        guestCount > room.capacity
                      }
                    >
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {available && totalPrice
                        ? `Rezervasyonu Tamamla (${totalPrice.toLocaleString()} ₺)`
                        : "Rezervasyon Yapılamaz"}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
