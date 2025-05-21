import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Room, Hotel, insertRoomSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, CalendarDays, Calendar as CalendarIcon, Clock, Save, Upload, Star, Trash } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const availableFeatures = [
  { id: "kingYatak", label: "King Yatak" },
  { id: "wifi", label: "Ücretsiz Wi-Fi" },
  { id: "tv", label: "Akıllı TV" },
  { id: "klima", label: "Klima" },
  { id: "banyo", label: "Özel Banyo" },
  { id: "minibar", label: "Mini Bar" },
  { id: "denizManzara", label: "Deniz Manzarası" },
  { id: "jakuzi", label: "Jakuzi" },
  { id: "oturmaAlani", label: "Oturma Alanı" },
  { id: "teras", label: "Özel Teras" },
  { id: "ikiYatakOdasi", label: "2 Yatak Odası" },
  { id: "ikiBanyo", label: "2 Banyo" },
];

const roomTypes = [
  { id: "standart", label: "Standart Oda" },
  { id: "deluxe", label: "Deluxe Oda" },
  { id: "suit", label: "Suit Oda" },
  { id: "aile", label: "Aile Odası" },
];

const weekdays = [
  { index: 0, name: "Pazar" },
  { index: 1, name: "Pazartesi" },
  { index: 2, name: "Salı" },
  { index: 3, name: "Çarşamba" },
  { index: 4, name: "Perşembe" },
  { index: 5, name: "Cuma" },
  { index: 6, name: "Cumartesi" },
];

const roomFormSchema = insertRoomSchema.extend({
  features: z.array(z.string()).min(1, {
    message: "En az bir özellik seçmelisiniz",
  }),
  hotelId: z.coerce.number(),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

export default function RoomEditPageMobile() {
  const [match, params] = useRoute("/admin/rooms/edit/:id");
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");

  // Fiyatlandırma state'leri
  const [selectedRange, setSelectedRange] = useState<{ from: Date | null, to: Date | null }>({ from: null, to: null });
  const [rangePrice, setRangePrice] = useState<number>(0);

  // Takvimde gösterilecek fiyatlar
  const [dailyPrices, setDailyPrices] = useState<Array<{ date: Date, price: number }>>([]);
  // Haftanın günleri için fiyatlar
  const [weekdayPrices, setWeekdayPrices] = useState<Array<{ dayIndex: number, price: number }>>([]);

  // Takvimde gün seçince o güne ait fiyatı göster
  const [calendarSelectedDay, setCalendarSelectedDay] = useState<Date | null>(null);

  // Hotel ve oda çekme kodları
  const roomId = params?.id ? parseInt(params.id) : 0;

  const { data: room, isLoading: isLoadingRoom } = useQuery<Room>({
    queryKey: ['/api/rooms', roomId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/rooms/${roomId}`);
      const json = await response.json();
      if (!json || Object.keys(json).length === 0) return null;
      if (json.data) return json.data;
      return json;
    },
    enabled: !!roomId,
  });

  const { data: hotels = [], isLoading: isLoadingHotels } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
  });

  const isLoading = isLoadingRoom || isLoadingHotels;

  useEffect(() => {
    if (room && room.dailyPrices) {
      try {
        const parsedDailyPrices = JSON.parse(room.dailyPrices);
        setDailyPrices(parsedDailyPrices.map((item: any) => ({
          date: new Date(item.date),
          price: item.price
        })));
      } catch (e) { }
    }
    if (room && room.weekdayPrices) {
      try {
        const parsedWeekdayPrices = JSON.parse(room.weekdayPrices);
        setWeekdayPrices(parsedWeekdayPrices);
      } catch (e) { }
    }
  }, [room]);

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: "",
      description: "",
      hotelId: 1,
      imageUrl: "",
      capacity: 2,
      type: "Standart Oda",
      features: [],
    },
  });

  useEffect(() => {
    if (room) {
      form.reset({
        name: room.name,
        description: room.description,
        hotelId: room.hotelId,
        imageUrl: room.imageUrl,
        capacity: room.capacity,
        type: room.type,
        features: room.features,
      });
    }
  }, [room, form]);

  // Odayı güncelle
  const updateRoomMutation = useMutation({
    mutationFn: async (roomData: any) => {
      if (typeof roomData.dailyPrices === 'object') {
        roomData.dailyPrices = JSON.stringify(roomData.dailyPrices);
      }
      if (typeof roomData.weekdayPrices === 'object') {
        roomData.weekdayPrices = JSON.stringify(roomData.weekdayPrices);
      }
      const response = await apiRequest("PUT", `/api/rooms/${roomId}`, roomData);
      if (!response.ok) throw new Error(await response.text());
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Oda güncellendi", description: "Oda bilgileri başarıyla güncellendi." });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms', roomId] });
      navigate("/admin/rooms");
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Oda güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Tarih aralığına fiyat ekle
  function handleAddRangePrice() {
    if (!selectedRange.from || !selectedRange.to || rangePrice <= 0) return;
    const start = new Date(selectedRange.from);
    const end = new Date(selectedRange.to);
    const newPrices: Array<{ date: Date, price: number }> = [];
    let currentDate = new Date(start);
    while (currentDate <= end) {
      newPrices.push({ date: new Date(currentDate), price: rangePrice });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    // Önceki fiyatlar silinmeden, aynı günü tekrar eklerse üstüne yaz
    const updatedPrices = [...dailyPrices];
    newPrices.forEach(newPrice => {
      const idx = updatedPrices.findIndex(p => p.date.toDateString() === newPrice.date.toDateString());
      if (idx >= 0) updatedPrices[idx] = newPrice;
      else updatedPrices.push(newPrice);
    });
    setDailyPrices(updatedPrices);
    setSelectedRange({ from: null, to: null });
    setRangePrice(0);
    toast({ title: "Fiyat eklendi", description: "Tarih aralığına fiyatlar atandı." });
  }

  // Haftanın günlerine fiyat atama
  function handleAddWeekdayPrice(dayIndex: number, price: number) {
    if (price <= 0) return;
    const idx = weekdayPrices.findIndex(w => w.dayIndex === dayIndex);
    let updated = [...weekdayPrices];
    if (idx >= 0) updated[idx] = { dayIndex, price };
    else updated.push({ dayIndex, price });
    setWeekdayPrices(updated);
    toast({ title: "Fiyat eklendi", description: `${weekdays[dayIndex].name}: ${price}₺` });
  }

  // Takvimde o güne fiyat bul (öncelik dailyPrices, yoksa weekdayPrices)
  function getPriceForDate(date: Date) {
    const daily = dailyPrices.find(p => p.date.toDateString() === date.toDateString());
    if (daily) return daily.price;
    const week = weekdayPrices.find(w => w.dayIndex === date.getDay());
    if (week) return week.price;
    return null;
  }

  // Submit işlemi
  function onSubmit(formData: RoomFormValues) {
    // Tüm resimler ve diğer alanlar aynen
    const updatedData = {
      ...formData,
      price: 0,
      dailyPrices: JSON.stringify(dailyPrices),
      weekdayPrices: JSON.stringify(weekdayPrices)
    };
    updateRoomMutation.mutate(updatedData);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0e7ff] via-white to-[#f0f9ff] dark:from-neutral-900 dark:to-neutral-800">
      <div className="sticky top-0 z-10">
        <div className="bg-gradient-to-r from-[#2094f3] to-[#38b6ff] text-white shadow-md rounded-b-2xl">
          <div className="flex items-center px-4 h-14">
            <Button variant="ghost" size="icon" className="text-white" onClick={() => navigate("/admin/rooms")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="flex-1 text-center font-semibold text-lg">Odayı Düzenle</h1>
          </div>
        </div>
      </div>
      <div className="p-4 pb-32">
        {isLoading ? (
          <div className="flex justify-center items-center h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="details" className="w-full" value={activeTab} onValueChange={setActiveTab}>
                {/* ...details, features tabları buraya... */}
                <TabsContent value="pricing" className="space-y-8">
                  {/* TAKVİM ve FİYAT BÖLÜMÜ */}
                  <div className="rounded-2xl shadow-lg p-4 bg-white/95 space-y-4">
                    <div className="font-semibold text-lg text-center mb-1">Tarihlere Fiyat Ekle</div>
                    <div className="text-xs text-gray-500 text-center mb-3">Takvimden bir tarih aralığı seçin ve fiyatı girin. <br/>Hafta günleri için özel fiyat aşağıda.</div>
                    {/* Takvim */}
                    <Popover open={true}>
                      <PopoverContent className="w-auto p-0 rounded-2xl shadow-lg mx-auto" align="center">
                        <Calendar
                          mode="range"
                          selected={selectedRange}
                          onSelect={(range: { from?: Date, to?: Date } | undefined) => {
                            setSelectedRange({ from: range?.from ?? null, to: range?.to ?? null });
                          }}
                          onDayClick={date => setCalendarSelectedDay(date)}
                          components={{
                            DayContent: (props: { date: Date }) => {
                              const price = getPriceForDate(props.date);
                              return (
                                <div className="relative h-9 w-9 flex flex-col items-center justify-center">
                                  <span>{props.date.getDate()}</span>
                                  {price && (
                                    <span className="absolute bottom-0 left-0 right-0 text-[9px] text-[#2094f3] font-semibold">{price}₺</span>
                                  )}
                                </div>
                              );
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    {/* Seçili günün fiyatı */}
                    {calendarSelectedDay && (
                      <div className="rounded-xl bg-blue-50 text-[#2094f3] text-center text-base font-bold py-1 shadow">
                        {calendarSelectedDay.toLocaleDateString("tr-TR")} :&nbsp;
                        {getPriceForDate(calendarSelectedDay) ? `${getPriceForDate(calendarSelectedDay)}₺` : "Fiyat Yok"}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Fiyat (₺)"
                        value={rangePrice}
                        onChange={e => setRangePrice(Number(e.target.value))}
                        className="rounded-xl shadow w-full"
                      />
                      <Button
                        type="button"
                        onClick={handleAddRangePrice}
                        className="rounded-xl px-4 py-2 font-bold bg-gradient-to-r from-[#2094f3] to-[#38b6ff] text-white shadow hover:scale-105 transition"
                        disabled={!selectedRange.from || !selectedRange.to || rangePrice <= 0}
                      >Tüm Aralığa Ata</Button>
                    </div>
                  </div>
                  {/* Haftanın günlerine fiyat ekleme */}
                  <div className="rounded-2xl shadow-lg p-4 bg-white/90 space-y-2">
                    <div className="font-semibold text-base text-center">Haftanın Günleri İçin Fiyat</div>
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                      {weekdays.map(day => (
                        <div key={day.index} className="flex flex-col items-center">
                          <span className="text-xs font-medium text-gray-700">{day.name}</span>
                          <Input
                            type="number"
                            min="0"
                            placeholder="₺"
                            value={weekdayPrices.find(w => w.dayIndex === day.index)?.price ?? ""}
                            onChange={e => handleAddWeekdayPrice(day.index, Number(e.target.value))}
                            className="w-20 h-9 rounded-xl text-center shadow"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              {/* ...Altta sabit Kaydet/İptal butonları... */}
              <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-neutral-800 p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.07)] flex gap-2 z-20 rounded-t-2xl">
                <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => navigate("/admin/rooms")}>İptal</Button>
                <Button type="submit" className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#2094f3] to-[#38b6ff] text-white font-bold shadow-lg">
                  {updateRoomMutation.isPending ? (<Loader2 className="mr-2 h-5 w-5 animate-spin" />) : (<Save className="mr-2 h-5 w-5" />)}
                  Kaydet
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
