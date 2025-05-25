import { useState, useEffect, useMemo } from "react";
import { Room } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { format, eachDayOfInterval, addDays } from "date-fns";
import { Calendar as CalendarIcon, Check, Loader2 } from "lucide-react";
import { tr } from "date-fns/locale";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const formSchema = z.object({
  checkIn: z.date({
    required_error: "Giriş tarihi seçmelisiniz",
  }),
  checkOut: z.date({
    required_error: "Çıkış tarihi seçmelisiniz",
  }).refine(date => date > new Date(), {
    message: "Çıkış tarihi bugünden sonra olmalıdır",
  }),
  guests: z.number({
    required_error: "Misafir sayısı gereklidir",
  }).min(1, {
    message: "En az 1 misafir olmalıdır",
  }).max(10, {
    message: "En fazla 10 misafir olabilir",
  }),
});

interface ReservationFormProps {
  hotelId: number;
  room: Room;
  onSuccess?: () => void;
}

export default function ReservationForm({ hotelId, room, onSuccess }: ReservationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Oda fiyatları arraylerini hazırla
  let dailyPricesArray: any[] = [];
  let weekdayPricesArray: any[] = [];

  try {
    if (room.dailyPrices) dailyPricesArray = JSON.parse(room.dailyPrices);
    if (room.weekdayPrices) weekdayPricesArray = JSON.parse(room.weekdayPrices);
  } catch (e) {
    dailyPricesArray = [];
    weekdayPricesArray = [];
  }

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      checkIn: new Date(),
      checkOut: addDays(new Date(), 1),
      guests: 2,
    },
  });

  // Watch dates
  const watchCheckIn = form.watch("checkIn");
  const watchCheckOut = form.watch("checkOut");

  // Gece sayısı hesapla
  const nightCount = useMemo(() => {
    if (!watchCheckIn || !watchCheckOut) return 1;
    const diffTime = watchCheckOut.getTime() - watchCheckIn.getTime();
    const diffDays = Math.max(Math.round(diffTime / (1000 * 60 * 60 * 24)), 1);
    return diffDays;
  }, [watchCheckIn, watchCheckOut]);

  // Tüm geceler için fiyat ve müsaitlik hesapla
  const { totalPrice, priceForAllDays, unavailableDate } = useMemo(() => {
    if (!watchCheckIn || !watchCheckOut) return { totalPrice: 0, priceForAllDays: true, unavailableDate: null };
    const days = eachDayOfInterval({ start: watchCheckIn, end: addDays(watchCheckOut, -1) }); // checkOut günü konaklama değildir!
    let total = 0;
    let allAvailable = true;
    let firstUnavailable = null;

    for (let i = 0; i < days.length; i++) {
      const date = days[i];
      const dateStr = format(date, "yyyy-MM-dd");
      const found = dailyPricesArray.find((p) => p.date === dateStr);
      if (found) {
        total += found.price;
      } else {
        // Haftalık fiyatı bul
        const dayOfWeek = date.getDay();
        const weekly = weekdayPricesArray.find((p) => p.day === dayOfWeek);
        if (weekly) {
          total += weekly.price;
        } else {
          allAvailable = false;
          firstUnavailable = dateStr;
          break;
        }
      }
    }
    return { totalPrice: total, priceForAllDays: allAvailable, unavailableDate: firstUnavailable };
  }, [watchCheckIn, watchCheckOut, dailyPricesArray, weekdayPricesArray]);

  // Rezervasyon kaydı
  
  const reservation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!user) throw new Error("Rezervasyon yapmak için giriş yapmalısınız");

      let dailyPricesArray: any[] = [];
      if (room.dailyPrices) {
        try {
          dailyPricesArray = JSON.parse(room.dailyPrices);
        } catch (e) {
          console.error("dailyPrices parse hatası:", e);
        }
      }

      const reservationData = {
        userId: user.id,
        roomId: room.id,
        hotelId,
        checkIn: values.checkIn,
        checkOut: values.checkOut,
        guests: values.guests,
        totalPrice,
        status: "pending",
        dailyPrices: JSON.stringify(dailyPricesArray),
      };

      const res = await apiRequest("POST", "/api/reservations", reservationData);
      return await res.json();
    },

    onSuccess: (data) => {
  queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
  
  // Eğer ödeme linki varsa, otomatik yönlendir
  if (data && data.paymentUrl) {
    window.location.href = data.paymentUrl;
    return;
  }
  if (data && data.iframeToken) {
    // Eğer PayTR iframe kullanılıyorsa
    window.location.href = `/odeme/paytr?token=${data.iframeToken}`;
    return;
  }

  toast({
    title: "Rezervasyon başarılı",
    description: `${room.name} için rezervasyonunuz alındı.`,
  });
  if (onSuccess) onSuccess();
  navigate("/reservations");
},

    onError: (error) => {
      toast({
        title: "Rezervasyon hatası",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: "Giriş gerekiyor",
        description: "Rezervasyon yapmak için lütfen giriş yapın.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    reservation.mutate(values);
  };

  // Oda tükendi mi? (roomCount kontrolü + fiyat kontrolü)
  const roomSoldOut = room.roomCount === 0 || !priceForAllDays;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
                          variant="outline"
                          className="pl-3 text-left font-normal"
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
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
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
                          variant="outline"
                          className="pl-3 text-left font-normal"
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
                        disabled={(date) =>
                          date <= watchCheckIn ||
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
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
            name="guests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Misafir Sayısı</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value.toString()}
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
                    <SelectItem value="6">6+ Kişi</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Fiyat ve uygunluk alanı */}
        <div className="pt-4 border-t border-border">
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">Oda Ücreti (gece başına)</span>
            <span>
              {roomSoldOut
                ? "—"
                : totalPrice && nightCount
                  ? `${Math.round(totalPrice / nightCount).toLocaleString()} ₺`
                  : "—"}
            </span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">Konaklama süresi</span>
            <span>{nightCount} gece</span>
          </div>
          <div className="flex justify-between font-medium text-lg pt-2 border-t border-border">
            <span>Toplam</span>
            <span className="text-primary">
              {roomSoldOut ? (
                <span className="text-red-600 font-semibold">Oda tükendi</span>
              ) : (
                `${totalPrice.toLocaleString()} ₺`
              )}
            </span>
          </div>
          {!priceForAllDays && unavailableDate && (
            <div className="text-red-600 text-sm mt-2 font-medium">
              {unavailableDate} tarihi veya seçili tarihlerde oda bulunmamaktadır.
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={reservation.isPending || roomSoldOut}
        >
          {reservation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> İşleniyor...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" /> Rezervasyonu Tamamla
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
