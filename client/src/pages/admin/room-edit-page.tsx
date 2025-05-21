import { useState, useRef, useEffect, ChangeEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Room, Hotel, insertRoomSchema } from "@shared/schema";
import { useDeviceType } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent,
} from "@/components/ui/card";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, Check, X, ChevronLeft, Image, UploadCloud } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { tr } from 'date-fns/locale';
import * as z from "zod";
import { useRoute, useLocation } from "wouter";

// --- Oda özellikleri ve tipleri ---
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

// --- Zod form şeması ---
const roomFormSchema = insertRoomSchema.extend({
  features: z.array(z.string()).min(1, { message: "En az bir özellik seçmelisiniz" }),
  hotelId: z.coerce.number(),
});
type RoomFormValues = z.infer<typeof roomFormSchema>;
type DailyPrice = { date: Date; price: number };
type WeekdayPrice = { dayIndex: number; price: number };
type DateRange = { startDate: Date; endDate: Date };

// --- Oda sayısı uyarısı animasyonu ---
function RoomCountWarning({ count }: { count: number }) {
  if (count === 0) {
    return <span className="ml-3 text-red-600 font-semibold animate-pulse">Oda Tükendi!</span>;
  }
  if (count > 0 && count <= 5) {
    return <span className="ml-3 text-red-600 font-semibold animate-bounce">Son {count} Oda!</span>;
  }
  return null;
}

export default function RoomsEditPage() {
  const [match, params] = useRoute("/admin/rooms/edit/:id");
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  // --- Takvim ve fiyatlar state ---
  const [activeTab, setActiveTab] = useState("details");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDatePrice, setSelectedDatePrice] = useState<number>(0);
  const [dailyPrices, setDailyPrices] = useState<DailyPrice[]>([]);
  const [selectedWeekday, setSelectedWeekday] = useState<number>(0);
  const [selectedWeekdayPrice, setSelectedWeekdayPrice] = useState<number>(0);
  const [weekdayPrices, setWeekdayPrices] = useState<WeekdayPrice[]>([]);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: today, endDate: tomorrow });

  // --- Resim yükleme state ---
  const [images, setImages] = useState<{ url: string, filename: string, isMain: boolean }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  type CalendarMode = 'single' | 'range' | 'weekday';
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('single');

  // --- Otel listesi çek ---
  const { data: hotels = [], isLoading: isLoadingHotels } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
  });

  // --- Oda detayını çek ---
  const { data: room, isLoading: isLoadingRoom } = useQuery<Room>({
    queryKey: ['/api/rooms', params?.id],
    queryFn: async () => {
      if (!params?.id) throw new Error("ID yok");
      const res = await apiRequest("GET", `/api/rooms/${params.id}`);
      return await res.json();
    },
    enabled: !!params?.id,
  });

  // --- Form ayarla ---
  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      hotelId: 0,
      name: "",
      description: "",
      capacity: 2,
      roomCount: 1,
      imageUrl: "",
      features: [],
      type: "",
    },
  });

  // --- Oda detaylarını forma bas ---
  useEffect(() => {
    if (!room) return;
    // Oda tipi JSON'dan hem label hem id ile eşleşir
    let typeValue = roomTypes.find(rt => rt.id === room.type || rt.label === room.type)?.id || room.type || "";
    let parsedImages: any[] = [];
    try {
      parsedImages = room.images ? JSON.parse(room.images) : [];
    } catch { parsedImages = []; }
    if (parsedImages.length > 0 && !parsedImages.some(img => img.isMain)) {
      parsedImages[0].isMain = true;
    }
    setImages(parsedImages.length > 0 ? parsedImages : (room.imageUrl ? [{ url: room.imageUrl, filename: room.imageUrl.split("/").pop() || "", isMain: true }] : []));
    // Günlük fiyatlar
    let parsedDailyPrices: DailyPrice[] = [];
    try {
      parsedDailyPrices = room.dailyPrices ? JSON.parse(room.dailyPrices).map((d: any) => ({ date: new Date(d.date), price: d.price })) : [];
    } catch { parsedDailyPrices = []; }
    setDailyPrices(parsedDailyPrices);
    // Haftalık fiyatlar
    let parsedWeekdayPrices: WeekdayPrice[] = [];
    try {
      parsedWeekdayPrices = room.weekdayPrices ? JSON.parse(room.weekdayPrices) : [];
    } catch { parsedWeekdayPrices = []; }
    setWeekdayPrices(parsedWeekdayPrices);
    // Formu doldur
    form.reset({
      hotelId: room.hotelId,
      name: room.name,
      description: room.description,
      capacity: room.capacity,
      roomCount: room.roomCount,
      imageUrl: room.imageUrl,
      features: room.features,
      type: typeValue,
    });
  }, [room]);

  // --- Resim işlemleri ---
  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) formData.append('images', files[i]);
      const response = await fetch('/api/upload/multiple', { method: 'POST', body: formData, credentials: 'include' });
      if (!response.ok) throw new Error('Resim yükleme başarısız oldu');
      const result = await response.json();
      const newImages = result.files.map((file: any, index: number) => ({
        url: file.url,
        filename: file.filename,
        isMain: images.length === 0 && index === 0,
      }));
      setImages(prev => {
        const updatedImages = [...prev, ...newImages];
        if (!updatedImages.some(img => img.isMain) && updatedImages.length > 0) {
          updatedImages[0].isMain = true;
        }
        return updatedImages;
      });
      // Ana resmi forma ayarla
      const mainImage = [...images, ...newImages].find(img => img.isMain);
      if (mainImage) form.setValue('imageUrl', mainImage.url);
      toast({ title: "Resimler yüklendi", description: `${result.files.length} resim başarıyla yüklendi` });
    } catch (error) {
      toast({ title: "Resim yükleme hatası", description: error instanceof Error ? error.message : '', variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const setMainImage = (index: number) => {
    const updatedImages = images.map((img, i) => ({ ...img, isMain: i === index }));
    setImages(updatedImages);
    const mainImage = updatedImages.find(img => img.isMain);
    if (mainImage) form.setValue('imageUrl', mainImage.url);
    toast({ title: "Ana resim güncellendi" });
  };

  const removeImage = (index: number) => {
    const wasMain = images[index].isMain;
    const updatedImages = images.filter((_, i) => i !== index);
    if (wasMain && updatedImages.length > 0) {
      updatedImages[0].isMain = true;
      form.setValue('imageUrl', updatedImages[0].url);
    } else if (updatedImages.length === 0) {
      form.setValue('imageUrl', '');
    }
    setImages(updatedImages);
  };

  // --- Takvim fiyat fonksiyonları ---
  const addDailyPrice = () => {
    if (!selectedDate || selectedDatePrice <= 0) return;
    const existingIndex = dailyPrices.findIndex(
      dp => dp.date.toDateString() === selectedDate.toDateString()
    );
    if (existingIndex >= 0) {
      const updatedPrices = [...dailyPrices];
      updatedPrices[existingIndex] = { date: selectedDate, price: selectedDatePrice };
      setDailyPrices(updatedPrices);
      toast({ title: "Fiyat güncellendi" });
    } else {
      setDailyPrices([...dailyPrices, { date: selectedDate, price: selectedDatePrice }]);
      toast({ title: "Fiyat eklendi" });
    }
    setSelectedDatePrice(0);
  };
  const removeDailyPrice = (dateToRemove: Date) => {
    setDailyPrices(dailyPrices.filter(dp => dp.date.toDateString() !== dateToRemove.toDateString()));
  };
  const addDateRangePrice = (range: DateRange, price: number) => {
    if (price <= 0) return;
    const newPrices: DailyPrice[] = [];
    const current = new Date(range.startDate);
    while (current <= range.endDate) {
      newPrices.push({ date: new Date(current), price: price });
      current.setDate(current.getDate() + 1);
    }
    const updatedPrices = [...dailyPrices];
    for (const newPrice of newPrices) {
      const existingIndex = updatedPrices.findIndex(
        dp => dp.date.toDateString() === newPrice.date.toDateString()
      );
      if (existingIndex >= 0) updatedPrices[existingIndex] = newPrice;
      else updatedPrices.push(newPrice);
    }
    setDailyPrices(updatedPrices);
    setSelectedDatePrice(0);
    toast({ title: "Tarih aralığı fiyatları eklendi" });
  };
  const addWeekdayPrice = (dayIndex: number, price: number) => {
    if (price <= 0) return;
    const existingIndex = weekdayPrices.findIndex(wp => wp.dayIndex === dayIndex);
    if (existingIndex >= 0) {
      const updatedPrices = [...weekdayPrices];
      updatedPrices[existingIndex] = { dayIndex, price };
      setWeekdayPrices(updatedPrices);
      toast({ title: "Hafta günü fiyatı güncellendi" });
    } else {
      setWeekdayPrices([...weekdayPrices, { dayIndex, price }]);
      toast({ title: "Hafta günü fiyatı eklendi" });
    }
    setSelectedWeekdayPrice(0);
  };
  const removeWeekdayPrice = (dayIndex: number) => {
    setWeekdayPrices(weekdayPrices.filter(wp => wp.dayIndex !== dayIndex));
  };

  // --- Oda güncelleme mutation ---
  const updateRoomMutation = useMutation({
    mutationFn: async (data: RoomFormValues) => {
      if (!data.imageUrl) throw new Error('Lütfen en az bir resim yükleyin ve ana resim olarak işaretleyin.');
      const imagesData = images.map(img => ({ url: img.url, filename: img.filename, isMain: img.isMain }));
      const response = await apiRequest("PUT", `/api/rooms/${params?.id}`, {
        ...data,
        dailyPrices: JSON.stringify(dailyPrices.map(d => ({ date: d.date, price: d.price }))),
        weekdayPrices: JSON.stringify(weekdayPrices),
        images: JSON.stringify(imagesData),
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      toast({ title: "Oda güncellendi", description: "Oda başarıyla güncellendi." });
      navigate("/admin/rooms");
    },
    onError: (error: any) => {
      toast({ title: "Hata", description: error?.message, variant: "destructive" });
    },
  });

  // --- Form gönder ---
  const handleSubmit = (data: RoomFormValues) => {
    updateRoomMutation.mutate(data);
  };

  // --- Mobil/masaüstü genişliği ayarı ---
  const deviceType = useDeviceType();
  const maxWidthClass = deviceType === 'mobile' ? 'max-w-3xl' : 'max-w-5xl';

  return (
    <div className={`container mx-auto py-4 ${maxWidthClass}`}>
      <div className="mb-4 flex items-center">
        <Button onClick={() => navigate("/admin/rooms")} variant="ghost" className="mr-4 p-2">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Odayı Düzenle</h1>
      </div>
      <div className="bg-white rounded-lg shadow-sm border">
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 p-0 bg-gray-50 rounded-t-lg">
            <TabsTrigger value="details" className="py-3 rounded-none rounded-tl-lg">
              Oda Bilgileri
            </TabsTrigger>
            <TabsTrigger value="pricing" className="py-3 rounded-none rounded-tr-lg">
              Fiyatlandırma
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="p-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="hotelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Otel</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Otel seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {hotels.map((hotel) => (
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Oda Adı</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-12" />
                      </FormControl>
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
                        <Textarea className="resize-none h-24" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kapasite</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} className="h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="roomCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Oda Kontenjanı</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Input type="number" min="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} className="h-12" />
                            <RoomCountWarning count={field.value} />
                          </div>
                        </FormControl>
                        <div className="text-xs text-muted-foreground mt-1">Bu tipten otelde kaç oda var</div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Oda Tipi</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Oda tipi seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roomTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Çoklu Resim Yükleme Alanı */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Oda Resimleri</h3>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <UploadCloud className="h-4 w-4 mr-2" />
                        )}
                        Resim Yükle
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*"
                        multiple
                      />
                    </div>
                  </div>
                  {images.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {images.map((image, index) => (
                        <div key={index} className={`relative rounded-lg overflow-hidden border-2 ${image.isMain ? 'border-blue-500' : 'border-gray-200'}`}>
                          <img src={image.url} alt={`Oda resmi ${index + 1}`} className="w-full h-36 object-cover" />
                          <div className="absolute top-2 right-2 flex gap-1">
                            <Button type="button" size="icon" variant="destructive" className="h-6 w-6 rounded-full" onClick={() => removeImage(index)}>
                              <X className="h-3 w-3" />
                            </Button>
                            {!image.isMain && (
                              <Button type="button" size="icon" variant="outline" className="h-6 w-6 rounded-full bg-white" onClick={() => setMainImage(index)}>
                                <Image className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          {image.isMain && (
                            <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-xs font-medium p-1 text-center">
                              Ana Resim
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center">
                      <Image className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Henüz resim yüklenmedi</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Oda resimleri yüklemek için "Resim Yükle" butonuna tıklayın</p>
                    </div>
                  )}
                </div>
                {/* Gizli ana resim */}
                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField
                  control={form.control}
                  name="features"
                  render={() => (
                    <FormItem>
                      <div className="mb-2">
                        <FormLabel className="text-base">Özellikler</FormLabel>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {availableFeatures.map((feature) => (
                          <FormField
                            key={feature.id}
                            control={form.control}
                            name="features"
                            render={({ field }) => (
                              <FormItem
                                key={feature.id}
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(feature.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, feature.id])
                                        : field.onChange(
                                          field.value?.filter((value) => value !== feature.id)
                                        );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">{feature.label}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  className="w-full h-12 bg-[#2094f3]"
                  onClick={() => setActiveTab("pricing")}
                >
                  İleri: Fiyatlandırma
                </Button>
              </form>
            </Form>
          </TabsContent>
          {/* -- Fiyatlandırma TAB -- */}
          <TabsContent value="pricing" className="space-y-6">
            <div className="bg-white shadow rounded-md p-4">
              <div className="grid grid-cols-3 gap-2 mb-4">
                <Button type="button" variant={calendarMode === 'single' ? 'default' : 'outline'} className={calendarMode === 'single' ? 'bg-[#2094f3]' : 'border-[#2094f3] text-[#2094f3]'} onClick={() => setCalendarMode('single')}>Tek Gün</Button>
                <Button type="button" variant={calendarMode === 'range' ? 'default' : 'outline'} className={calendarMode === 'range' ? 'bg-[#2094f3]' : 'border-[#2094f3] text-[#2094f3]'} onClick={() => setCalendarMode('range')}>Tarih Aralığı</Button>
                <Button type="button" variant={calendarMode === 'weekday' ? 'default' : 'outline'} className={calendarMode === 'weekday' ? 'bg-[#2094f3]' : 'border-[#2094f3] text-[#2094f3]'} onClick={() => setCalendarMode('weekday')}>Haftanın Günleri</Button>
              </div>
              {calendarMode === 'single' && (
                <div className={deviceType === 'mobile' ? '' : 'grid grid-cols-2 gap-6'}>
                  <div className="mb-4">
                    <Calendar
                      mode="single"
                      selected={selectedDate || undefined}
                      onSelect={(date: Date | undefined) => setSelectedDate(date || null)}
                      locale={tr}
                      className="mx-auto"
                      disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      modifiers={{ highlighted: dailyPrices.map(dp => dp.date) }}
                      modifiersStyles={{
                        highlighted: {
                          fontWeight: "bold",
                          backgroundColor: "rgba(32, 148, 243, 0.1)",
                          color: "#2094f3",
                          borderColor: "#2094f3"
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="font-medium text-sm">Seçilen Tarih:</div>
                      <div className="text-lg font-medium">{selectedDate ? format(selectedDate, 'PP', { locale: tr }) : 'Tarih seçilmedi'}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-sm">Bu Gün İçin Fiyat (₺):</div>
                      <Input
                        type="number"
                        value={selectedDatePrice}
                        onChange={(e) => setSelectedDatePrice(parseFloat(e.target.value) || 0)}
                        min="0"
                        placeholder="1450"
                        className="h-12"
                      />
                    </div>
                    <Button
                      type="button"
                      className="w-full bg-[#2094f3]"
                      onClick={addDailyPrice}
                      disabled={!selectedDate || selectedDatePrice <= 0}
                    >Fiyatı Ekle</Button>
                  </div>
                </div>
              )}
              {calendarMode === 'range' && (
                <div className={deviceType === 'mobile' ? '' : 'grid grid-cols-2 gap-6'}>
                  <div className="mb-4">
                    <Calendar
                      mode="range"
                      selected={{
                        from: dateRange.startDate,
                        to: dateRange.endDate
                      }}
                      onSelect={(range) => {
                        if (range?.from) {
                          setDateRange({
                            startDate: range.from,
                            endDate: range.to || range.from
                          });
                        }
                      }}
                      locale={tr}
                      className="mx-auto"
                      disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      numberOfMonths={1}
                      modifiers={{ highlighted: dailyPrices.map(dp => dp.date) }}
                      modifiersStyles={{
                        highlighted: {
                          fontWeight: "bold",
                          backgroundColor: "rgba(32, 148, 243, 0.1)",
                          color: "#2094f3",
                          borderColor: "#2094f3"
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="font-medium text-sm">Seçilen Tarih Aralığı:</div>
                      <div className="text-lg font-medium">{format(dateRange.startDate, 'PP', { locale: tr })} - {format(dateRange.endDate, 'PP', { locale: tr })}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-sm">Bu Aralık İçin Fiyat (₺):</div>
                      <Input
                        type="number"
                        value={selectedDatePrice}
                        onChange={(e) => setSelectedDatePrice(parseFloat(e.target.value) || 0)}
                        min="0"
                        placeholder="1450"
                        className="h-12"
                      />
                    </div>
                    <Button
                      type="button"
                      className="w-full bg-[#2094f3]"
                      onClick={() => addDateRangePrice(dateRange, selectedDatePrice)}
                      disabled={selectedDatePrice <= 0}
                    >Tüm Aralığa Fiyat Ekle</Button>
                  </div>
                </div>
              )}
              {calendarMode === 'weekday' && (
                <div className={deviceType === 'mobile' ? '' : 'grid grid-cols-2 gap-6'}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="font-medium text-sm">Haftanın Günü:</div>
                      <Select
                        value={selectedWeekday.toString()}
                        onValueChange={(value) => setSelectedWeekday(parseInt(value))}
                      >
                        <SelectTrigger className="h-12 bg-white">
                          <SelectValue placeholder="Gün seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Pazar</SelectItem>
                          <SelectItem value="1">Pazartesi</SelectItem>
                          <SelectItem value="2">Salı</SelectItem>
                          <SelectItem value="3">Çarşamba</SelectItem>
                          <SelectItem value="4">Perşembe</SelectItem>
                          <SelectItem value="5">Cuma</SelectItem>
                          <SelectItem value="6">Cumartesi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-sm">Bu Gün İçin Fiyat (₺):</div>
                      <Input
                        type="number"
                        value={selectedWeekdayPrice}
                        onChange={(e) => setSelectedWeekdayPrice(parseFloat(e.target.value) || 0)}
                        min="0"
                        placeholder="1450"
                        className="h-12"
                      />
                    </div>
                    <Button
                      type="button"
                      className="w-full bg-[#2094f3]"
                      onClick={() => addWeekdayPrice(selectedWeekday, selectedWeekdayPrice)}
                      disabled={selectedWeekdayPrice <= 0}
                    >Haftanın Günlerine Fiyat Ekle</Button>
                  </div>
                  {weekdayPrices.length > 0 && (
                    <div className="mt-6">
                      <div className="font-medium text-sm">Haftanın Günleri Fiyatları:</div>
                      <div className="mt-2 space-y-2">
                        {weekdayPrices.map((wp) => (
                          <div key={wp.dayIndex} className="flex justify-between items-center bg-neutral-50 p-2 rounded">
                            <div>
                              <span className="font-medium">
                                {['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][wp.dayIndex]}
                              </span>
                              <span className="ml-2 text-[#2094f3] font-semibold">{wp.price} ₺</span>
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => removeWeekdayPrice(wp.dayIndex)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Eklenen günlük fiyatlar listesi */}
            {dailyPrices.length > 0 && (
              <div className="bg-white shadow-sm rounded-md p-3 border border-[#2094f3]/20 mt-3">
                <div className="text-sm font-medium mb-2">Eklenen Özel Fiyatlar:</div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {dailyPrices
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .map((dp, index) => (
                      <div key={index} className="flex items-center justify-between bg-neutral-50 p-2 rounded">
                        <div className="text-sm">
                          <span className="font-medium">{format(dp.date, 'PP', { locale: tr })}</span>
                          <span className="ml-2 text-[#2094f3] font-semibold">{dp.price} ₺</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500"
                          onClick={() => removeDailyPrice(dp.date)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            )}
            <Button
              type="button"
              className="w-full h-12 bg-[#2094f3] text-white mt-6"
              onClick={form.handleSubmit(handleSubmit)}
              disabled={updateRoomMutation.isPending}
            >
              {updateRoomMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Tüm Bilgileri Kaydet
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
