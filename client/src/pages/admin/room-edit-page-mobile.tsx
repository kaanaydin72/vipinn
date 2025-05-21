import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Room, Hotel, insertRoomSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Image, UploadCloud, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ArrowLeft, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format, addDays, isWithinInterval, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";

const Calendar = (props: any) => <CalendarComponent {...props} />;

const roomTypes = [
  { id: 1, label: "Standart" },
  { id: 2, label: "Deluxe" },
  { id: 3, label: "Suite" },
  { id: 4, label: "Aile Odası" },
  { id: 5, label: "Ekonomik" },
];

const availableFeatures = [
  { id: 1, label: "Klima" },
  { id: 2, label: "Wi-Fi" },
  { id: 3, label: "Minibar" },
  { id: 4, label: "TV" },
  { id: 5, label: "Jakuzi" },
  { id: 6, label: "Balkon" },
  { id: 7, label: "Deniz Manzarası" },
  { id: 8, label: "Kahvaltı Dahil" },
  { id: 9, label: "Özel Banyo" },
  { id: 10, label: "Çalışma Masası" },
];

const weekDayNames = [
  "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"
]; // Pazartesi ilk

type DailyPrice = { date: string; price: number };
type RoomFormValues = z.infer<typeof insertRoomSchema> & {
  hotelId: number;
  capacity: number;
  features: string[];
  images?: any[];
  dailyPrices?: DailyPrice[];
};

export default function RoomEditMobile() {
  const { toast } = useToast();
  const params = useParams();
  const roomId = Number(params.id);

  // API'den oda ve otelleri getir
  const { data: hotels = [] } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
    staleTime: 10 * 60 * 1000,
  });

  const { data: roomData, isLoading: isRoomLoading } = useQuery<Room>({
    queryKey: ["/api/rooms", roomId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/rooms/${roomId}`);
      return res.json();
    },
    enabled: !!roomId && !isNaN(roomId),
  });

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(insertRoomSchema.extend({
      hotelId: z.number(),
      capacity: z.number(),
      features: z.array(z.string()),
      images: z.any().optional(),
      dailyPrices: z.any().optional(),
    })),
    mode: "onChange",
    defaultValues: {
      hotelId: undefined,
      name: "",
      description: "",
      capacity: 1,
      imageUrl: "",
      features: [],
      type: "",
      dailyPrices: [],
    }
  });

  // Görseller ve fiyatlar
  const [images, setImages] = useState<{ url: string, filename: string, isMain: boolean }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fiyat takvimi
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [range, setRange] = useState<{ from: Date | null, to: Date | null }>({ from: null, to: null });
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [selectedDatePrice, setSelectedDatePrice] = useState<number>(0);
  const [dailyPrices, setDailyPrices] = useState<DailyPrice[]>([]);

  useEffect(() => {
    if (!roomData) return;
    let imagesList = [];
    if (roomData.images && typeof roomData.images === "string") {
      try { imagesList = JSON.parse(roomData.images); } catch { imagesList = []; }
    }
    setImages(imagesList);
    let dayPrices: DailyPrice[] = [];
    if (roomData.dailyPrices && typeof roomData.dailyPrices === "string") {
      try { dayPrices = JSON.parse(roomData.dailyPrices); } catch { dayPrices = []; }
    }
    setDailyPrices(dayPrices);
    form.reset({
      ...roomData,
      hotelId: roomData.hotelId,
      name: roomData.name,
      description: roomData.description,
      type: roomData.type,
      capacity: roomData.capacity,
      features: roomData.features || [],
      imageUrl: roomData.imageUrl,
      dailyPrices: dayPrices,
    });
  // eslint-disable-next-line
  }, [roomData]);

  // Haftanın günü kutuları
  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };
  const selectAllDays = () => setSelectedDays([0,1,2,3,4,5,6]);
  const unSelectAllDays = () => setSelectedDays([]);

  // Takvimde fiyatı direkt günün üstünde göster
  const renderDayContent = (day: Date) => {
    const price = dailyPrices.find((p) => isSameDay(new Date(p.date), day))?.price;
    return (
      <div className="flex flex-col items-center cursor-pointer">
        <span className="font-semibold">{day.getDate()}</span>
        {typeof price === "number" && !isNaN(price) &&
          <span className="text-[11px] font-bold text-white px-2 mt-1 rounded-full bg-[#2094f3]">{price}₺</span>
        }
      </div>
    );
  };

  // Takvimde gün tıklama (direkt fiyat değiştir)
  const handleDayClick = (date: Date) => {
    let dt = format(date, "yyyy-MM-dd");
    let old = dailyPrices.find(p=>p.date===dt)?.price || 0;
    let fiyat = prompt("Bu günün fiyatı (₺):", old.toString());
    if (!fiyat) return;
    let price = parseInt(fiyat);
    if (isNaN(price) || price < 0) return;
    let updated = dailyPrices.filter(p=>p.date!==dt);
    updated.push({ date: dt, price });
    setDailyPrices(updated);
  };

  // Tarih aralığına, haftanın günlerine ve fiyat ile fiyat ata
  const addRangePrices = () => {
    if (!range.from || !range.to) {
      toast({ title: "Tarih seç!", description: "Başlangıç ve bitiş tarihini seçin.", variant: "destructive" });
      return;
    }
    if (selectedDays.length === 0) {
      toast({ title: "Gün seç!", description: "En az bir gün seçmelisin.", variant: "destructive" });
      return;
    }
    if (!selectedDatePrice || selectedDatePrice <= 0) {
      toast({ title: "Fiyat gir!", description: "Fiyat girin.", variant: "destructive" });
      return;
    }
    const days: Date[] = [];
    for (let d = new Date(range.from); d <= range.to; d = addDays(d, 1)) {
      let weekIndex = d.getDay() === 0 ? 6 : d.getDay()-1;
      if (selectedDays.includes(weekIndex)) days.push(new Date(d));
    }
    // Günleri ekle/güncelle
    let updated = [...dailyPrices];
    days.forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const idx = updated.findIndex(p => p.date === dateStr);
      if (idx > -1) updated[idx] = { date: dateStr, price: selectedDatePrice };
      else updated.push({ date: dateStr, price: selectedDatePrice });
    });
    setDailyPrices(updated);
    setRange({ from: null, to: null });
    setSelectedDatePrice(0);
    setSelectedDays([]);
    setIsCalendarOpen(false);
  };

  // Görsel işlemleri
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
        isMain: index === 0 && images.length === 0
      }));
      setImages(prev => {
        const updated = [...prev, ...newImages];
        if (!updated.some(img => img.isMain)) updated[0].isMain = true;
        return updated;
      });
      form.setValue('imageUrl', newImages[0].url);
      toast({ title: "Resimler yüklendi", description: `${result.files.length} resim başarıyla yüklendi` });
    } catch (error) {
      toast({ title: "Resim yükleme hatası", description: error instanceof Error ? error.message : 'Bilinmeyen hata', variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  const setMainImage = (index: number) => {
    const updated = images.map((img, i) => ({ ...img, isMain: i === index }));
    setImages(updated);
    form.setValue('imageUrl', updated[index].url);
  };
  const removeImage = (index: number) => {
    const wasMain = images[index].isMain;
    const updated = images.filter((_, i) => i !== index);
    if (wasMain && updated.length > 0) form.setValue('imageUrl', updated[0].url);
    else if (updated.length === 0) form.setValue('imageUrl', '');
    setImages(updated);
  };

  // Kaydet
  const updateRoomMutation = useMutation({
    mutationFn: async (data: RoomFormValues) => {
      const numericPrice = 0;
      const imagesData = images.map(img => ({
        url: img.url,
        filename: img.filename,
        isMain: img.isMain
      }));
      let updatedData = {
        ...data,
        price: numericPrice,
        dailyPrices: JSON.stringify(dailyPrices),
        images: JSON.stringify(imagesData)
      };
      const res = await apiRequest("PUT", `/api/rooms/${roomId}`, updatedData);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Başarılı", description: "Oda başarıyla güncellendi" });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      window.location.href = "/admin/rooms";
    },
    onError: (error: Error) => {
      toast({ title: "Hata", description: `Oda güncellenemedi: ${error.message}`, variant: "destructive" });
    },
  });

  const handleSubmit = (data: RoomFormValues) => {
    if (!data.hotelId) return toast({ title: "Otel Seçin!", description: "Lütfen otel seçin.", variant: "destructive" });
    if (!data.name) return toast({ title: "Oda adı girin!", description: "Lütfen oda adını yazın.", variant: "destructive" });
    if (!images.length) return toast({ title: "Resim gerekli", description: "Lütfen en az bir resim ekleyin.", variant: "destructive" });
    if (!data.imageUrl) form.setValue('imageUrl', images[0]?.url || "");
    updateRoomMutation.mutate(form.getValues());
  };

  if (isRoomLoading) return <div className="p-8 text-center">Yükleniyor...</div>;
  if (!roomData) return <div className="p-8 text-center text-red-600">Oda bulunamadı!</div>;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* HEADER */}
      <div className="sticky top-0 z-10">
        <div className="bg-gradient-to-r from-[#2094f3] to-[#38b6ff] text-white shadow-md">
          <div className="flex items-center px-4 h-14">
            <Button variant="ghost" size="icon" className="text-white" asChild>
              <Link href="/admin/rooms">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="flex-1 text-center font-semibold text-lg">Oda Düzenle</h1>
            <div className="w-8"></div>
          </div>
        </div>
      </div>

      {/* FORM */}
      <div className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

            {/* OTEL SEÇİMİ */}
            <FormField
              control={form.control}
              name="hotelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Otel</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12 bg-white shadow-sm border-[#2094f3]/20">
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

            {/* ODA ADI */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Oda Adı</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Oda Adı"
                      className="h-12 bg-white shadow-sm border-[#2094f3]/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* KONTEJAN */}
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Kontejan
                    <span className="ml-2 text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-600 font-semibold">
                      Son {field.value} oda
                    </span>
                  </FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12 bg-white shadow-sm border-[#2094f3]/20">
                        <SelectValue placeholder="Kapasite" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1,2,3,4,5,6].map((k) =>
                        <SelectItem value={k.toString()} key={k}>{k} Kişilik</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ODA TİPİ */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Oda Tipi</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12 bg-white shadow-sm border-[#2094f3]/20">
                        <SelectValue placeholder="Oda tipi seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roomTypes.map((type) => (
                        <SelectItem key={type.id} value={type.label}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* GÖRSELLER */}
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div>
              <div className="flex justify-between items-center mb-2">
                <FormLabel className="font-medium">Oda Resimleri</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="border-[#2094f3] text-[#2094f3]"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UploadCloud className="h-4 w-4 mr-2" />
                  )}
                  Resim Yükle
                </Button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*"
                multiple
              />
              {/* Resim galerisi */}
              {images.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {images.map((image, index) => (
                    <div key={index} className="relative rounded-lg overflow-hidden border border-[#2094f3]/20 aspect-video">
                      <img src={image.url} alt="" className="w-full h-full object-cover" />
                      {image.isMain && (
                        <div className="absolute top-1 left-1 bg-[#2094f3] text-white text-xs px-2 py-1 rounded-full flex items-center">
                          <Check className="h-3 w-3 mr-1" />
                          Ana Resim
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 flex space-x-1">
                        {!image.isMain && (
                          <Button type="button" variant="outline" size="icon"
                            className="h-7 w-7 rounded-full bg-white/90 border-none hover:bg-white"
                            onClick={() => setMainImage(index)}
                          >
                            <Image className="h-4 w-4 text-[#2094f3]" />
                          </Button>
                        )}
                        <Button type="button" variant="outline" size="icon"
                          className="h-7 w-7 rounded-full bg-white/90 border-none hover:bg-white"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-[#2094f3]/40 p-8 text-center">
                  <div className="mx-auto flex flex-col items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2094f3]/10">
                      <Image className="h-5 w-5 text-[#2094f3]" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-neutral-900">Resim yükleyin</h3>
                    <p className="mt-2 text-sm text-neutral-500">İlk yüklenen ana resim olur.</p>
                  </div>
                </div>
              )}
            </div>

            {/* AÇIKLAMA */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Oda hakkında bilgi..."
                      rows={3}
                      className="bg-white shadow-sm border-[#2094f3]/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* FİYAT TAKVİMİ ve HAFTALIK GÜN SEÇİMİ */}
            <FormItem>
              <FormLabel>Fiyat Takvimi</FormLabel>
              <div className="space-y-2">
                <Sheet open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <SheetTrigger asChild>
                    <Button type="button" variant="outline" className="h-12 bg-white border-[#2094f3] w-full text-[#2094f3] flex items-center justify-center">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span>Tarih Aralığı ve Günlere Fiyat Ekle</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-md">
                    <SheetHeader className="text-left">
                      <SheetTitle>Aralık + Gün + Fiyat</SheetTitle>
                    </SheetHeader>
                    {/* Tarih aralığı seç */}
                    <div className="mt-4 mb-2">
                      <Calendar
                        mode="range"
                        locale={tr}
                        selected={range}
                        onSelect={setRange}
                        numberOfMonths={1}
                        className="mx-auto"
                        disabled={(date) => false}
                      />
                      <div className="text-sm mt-2 font-medium">
                        {range.from ? format(range.from, "dd MMM yyyy") : "Başlangıç"} - {range.to ? format(range.to, "dd MMM yyyy") : "Bitiş"}
                      </div>
                    </div>
                    {/* Haftanın günleri */}
                    <div className="grid grid-cols-2 gap-2 mt-4 mb-4">
                      {weekDayNames.map((day, idx) => (
                        <label key={idx} className={`flex items-center px-3 py-2 border rounded-xl cursor-pointer transition-all
                          ${selectedDays.includes(idx)
                            ? 'bg-[#2094f3] text-white border-[#2094f3]'
                            : 'bg-white text-neutral-800 border-[#2094f3]/30'}`}>
                          <input
                            type="checkbox"
                            checked={selectedDays.includes(idx)}
                            onChange={() => toggleDay(idx)}
                            className="accent-[#2094f3] mr-2"
                          />
                          {day}
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Button type="button" size="sm" variant="outline"
                        className="border-[#2094f3] text-[#2094f3]"
                        onClick={selectAllDays}>Hepsini Seç</Button>
                      <Button type="button" size="sm" variant="ghost"
                        onClick={unSelectAllDays}>Temizle</Button>
                    </div>
                    {/* Fiyat alanı */}
                    <div className="mb-4">
                      <FormLabel>Fiyat (₺)</FormLabel>
                      <Input
                        type="number"
                        value={selectedDatePrice}
                        onChange={e => setSelectedDatePrice(Number(e.target.value))}
                        min={0}
                        placeholder="Fiyat"
                        className="h-12 mt-1"
                      />
                    </div>
                    <Button type="button" className="w-full bg-[#2094f3] text-white font-semibold"
                      onClick={addRangePrices}
                      disabled={selectedDays.length === 0 || selectedDatePrice <= 0 || !range.from || !range.to}>
                      Onayla ve Ata
                    </Button>
                  </SheetContent>
                </Sheet>
                {/* TAKVİM */}
                <div className="bg-white rounded-lg border border-[#2094f3]/20 shadow-sm p-3 mt-3">
                  <Calendar
                    mode="single"
                    locale={tr}
                    numberOfMonths={1}
                    className="mx-auto"
                    disabled={() => false}
                    renderDay={renderDayContent}
                    onDayClick={handleDayClick}
                  />
                  <div className="text-xs text-neutral-500 mt-1">
                    Takvimde güne dokunarak o günün fiyatını tekil değiştirebilirsin.
                  </div>
                </div>
              </div>
            </FormItem>

            {/* ODA ÖZELLİKLERİ */}
            <FormField
              control={form.control}
              name="features"
              render={() => (
                <FormItem>
                  <FormLabel>Özellikler</FormLabel>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {availableFeatures.map((feature) => (
                      <FormField
                        key={feature.id}
                        control={form.control}
                        name="features"
                        render={({ field }) => (
                          <FormItem key={feature.id}
                            className="flex flex-row items-center space-x-2 bg-white shadow-sm p-3 rounded-md border border-[#2094f3]/20">
                            <FormControl>
                              <Checkbox
                                className="h-5 w-5 text-[#2094f3] border-[#2094f3]"
                                checked={field.value?.includes(feature.label)}
                                onCheckedChange={(checked) => {
                                  checked
                                    ? field.onChange([...field.value, feature.label])
                                    : field.onChange(field.value?.filter((val) => val !== feature.label));
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm cursor-pointer font-normal">{feature.label}</FormLabel>
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
              type="submit"
              className="w-full h-12 bg-[#2094f3] text-white mt-6 font-bold"
              disabled={updateRoomMutation.isPending}
            >
              {updateRoomMutation.isPending && (<Loader2 className="mr-2 h-4 w-4 animate-spin" />)}
              Odayı Kaydet
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
