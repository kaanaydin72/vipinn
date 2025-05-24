import { useState, useRef, useEffect, ChangeEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Room, Hotel, insertRoomSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Check, X, ChevronLeft, Image, UploadCloud } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameMonth, format, isWithinInterval, isSameDay, parseISO
} from "date-fns";
import { tr } from "date-fns/locale";
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
const weekDaysTr = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

// --- Zod form şeması ---
const roomFormSchema = insertRoomSchema.extend({
  features: z.array(z.string()).min(1, { message: "En az bir özellik seçmelisiniz" }),
  hotelId: z.coerce.number(),
  images: z.any().optional(),
});
type RoomFormValues = z.infer<typeof roomFormSchema>;
type DailyPrice = { date: string; price: number; count: number };

export default function RoomsEditPage() {
  const [match, params] = useRoute("/admin/rooms/edit/:id");
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  // Masaüstü Grid Takvim için state
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [gridPrices, setGridPrices] = useState<{ [date: string]: { price: number; count: number } }>({});
  const [selectedRange, setSelectedRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [quickPrice, setQuickPrice] = useState<number>(0);
  const [quickCount, setQuickCount] = useState<number>(0);

  // Resim upload
  const [images, setImages] = useState<{ url: string, filename: string, isMain: boolean }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Otel listesi
  const { data: hotels = [] } = useQuery<Hotel[]>({ queryKey: ['/api/hotels'] });

  // Oda detayını çek
  const { data: room } = useQuery<Room>({
    queryKey: ['/api/rooms', params?.id],
    queryFn: async () => {
      if (!params?.id) throw new Error("ID yok");
      const res = await apiRequest("GET", `/api/rooms/${params.id}`);
      return await res.json();
    },
    enabled: !!params?.id,
  });

  // Form
  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      hotelId: 0,
      name: "",
      description: "",
      capacity: 2,
      imageUrl: "",
      features: [],
      type: "",
    },
  });

  // Oda detaylarını grid ve forma bas
  useEffect(() => {
    if (!room) return;
    let typeValue = roomTypes.find(rt => rt.id === room.type || rt.label === room.type)?.id || room.type || "";
    let parsedImages: any[] = [];
    try {
      parsedImages = room.images ? JSON.parse(room.images) : [];
    } catch { parsedImages = []; }
    if (parsedImages.length > 0 && !parsedImages.some(img => img.isMain)) {
      parsedImages[0].isMain = true;
    }
    setImages(parsedImages.length > 0 ? parsedImages : (room.imageUrl ? [{ url: room.imageUrl, filename: room.imageUrl.split("/").pop() || "", isMain: true }] : []));
    // Günlük fiyat/kontenjanları grid'e aktar
    let parsedDailyPrices: DailyPrice[] = [];
    try {
      parsedDailyPrices = room.dailyPrices ? JSON.parse(room.dailyPrices) : [];
    } catch { parsedDailyPrices = []; }
    let gridObj: { [date: string]: { price: number; count: number } } = {};
    parsedDailyPrices.forEach(dp => {
      gridObj[dp.date] = { price: dp.price, count: dp.count ?? 0 };
    });
    setGridPrices(gridObj);
    form.reset({
      hotelId: room.hotelId,
      name: room.name,
      description: room.description,
      capacity: room.capacity,
      imageUrl: room.imageUrl,
      features: room.features,
      type: typeValue,
    });
  }, [room]);

  // Resim işlemleri
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

  // Takvim grid helpers
  const first = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const last = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const weeks: Date[][] = [];
  let w = [];
  for (let d = first; d <= last; d = addDays(d, 1)) {
    w.push(d);
    if (w.length === 7) {
      weeks.push(w);
      w = [];
    }
  }
  const getCell = (date: Date) => gridPrices[format(date, "yyyy-MM-dd")] || { price: 0, count: 0 };
  const setCell = (date: Date, key: "price" | "count", val: number) => {
    const d = format(date, "yyyy-MM-dd");
    setGridPrices(g => ({ ...g, [d]: { ...g[d], [key]: val } }));
  };

  // Gün aralığı seçimi
  const handleCalendarCellClick = (date: Date) => {
    if (!selectedRange.from || (selectedRange.from && selectedRange.to)) {
      setSelectedRange({ from: date, to: null });
    } else if (selectedRange.from && !selectedRange.to) {
      if (date < selectedRange.from) {
        setSelectedRange({ from: date, to: selectedRange.from });
      } else if (isSameDay(date, selectedRange.from)) {
        setSelectedRange({ from: date, to: date });
      } else {
        setSelectedRange({ ...selectedRange, to: date });
      }
    }
  };

  // Toplu güncelleme
  const applyBulk = () => {
    if (!selectedRange.from || !selectedRange.to) {
      toast({ title: "Tarih aralığı seçin!", variant: "destructive" });
      return;
    }
    let cur = selectedRange.from;
    while (cur <= selectedRange.to) {
      const dStr = format(cur, "yyyy-MM-dd");
      setGridPrices(g => ({
        ...g,
        [dStr]: {
          price: quickPrice,
          count: quickCount,
        },
      }));
      cur = addDays(cur, 1);
    }
    toast({ title: "Toplu güncelleme yapıldı" });
  };

  // Oda güncelleme mutation
  const updateRoomMutation = useMutation({
    mutationFn: async (data: RoomFormValues & { dailyPrices: string }) => {
      if (!data.imageUrl) throw new Error('Lütfen en az bir resim yükleyin ve ana resim olarak işaretleyin.');
      const imagesData = images.map(img => ({ url: img.url, filename: img.filename, isMain: img.isMain }));
      const response = await apiRequest("PUT", `/api/rooms/${params?.id}`, {
        ...data,
        dailyPrices: JSON.stringify(Object.entries(gridPrices).map(([date, obj]) => ({
          date,
          price: obj.price ?? 0,
          count: obj.count ?? 0,
        }))),
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

  // Form gönder
  const handleSubmit = (data: RoomFormValues) => {
  updateRoomMutation.mutate({
    ...data,
    dailyPrices: JSON.stringify(
      Object.entries(gridPrices).map(([date, obj]) => ({
        date,
        price: obj.price ?? 0,
        count: obj.count ?? 0,
      }))
    )
  });
};

  // Seçili gün(ler)
  const isSelected = (date: Date) => {
    if (!selectedRange.from) return false;
    if (selectedRange.from && !selectedRange.to)
      return isSameDay(date, selectedRange.from);
    return isWithinInterval(date, {
      start: selectedRange.from,
      end: selectedRange.to!,
    });
  };

  return (
    <div className="container mx-auto py-4 max-w-6xl">
      <div className="mb-4 flex items-center">
        <Button onClick={() => navigate("/admin/rooms")} variant="ghost" className="mr-4 p-2">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Odayı Düzenle</h1>
      </div>
      <div className="bg-white rounded-lg shadow-sm border">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 p-6">
            {/* Diğer form alanları */}
            <FormField
              control={form.control}
              name="hotelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Otel</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
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
                        <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
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
                <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-6 text-center">
                  <Image className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Henüz resim yüklenmedi</p>
                  <p className="text-xs text-gray-400 mt-1">Oda resimleri yüklemek için "Resim Yükle" butonuna tıklayın</p>
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

            {/* Takvim Grid */}
            <div className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Button size="sm" type="button" variant="ghost" onClick={() => setMonth(subMonths(month, 1))}>{"<"}</Button>
                  <span className="font-bold text-lg">{format(month, "MMMM yyyy", { locale: tr })}</span>
                  <Button size="sm" type="button" variant="ghost" onClick={() => setMonth(addMonths(month, 1))}>{">"}</Button>
                  <Button size="sm" type="button" variant="outline" onClick={() => setMonth(startOfMonth(new Date()))}>BUGÜNE DÖN</Button>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 rounded p-2">
                  <span className="mr-2">Başlangıç:</span>
                  <Input type="date" className="h-8" value={selectedRange.from ? format(selectedRange.from, "yyyy-MM-dd") : ""} onChange={e => setSelectedRange({ from: e.target.value ? parseISO(e.target.value) : null, to: selectedRange.to })} />
                  <span className="mx-2">Bitiş:</span>
                  <Input type="date" className="h-8" value={selectedRange.to ? format(selectedRange.to, "yyyy-MM-dd") : ""} onChange={e => setSelectedRange({ ...selectedRange, to: e.target.value ? parseISO(e.target.value) : null })} />
                  <Button
                    size="sm"
                    type="button"
                    className="bg-[#2094f3] text-white px-4"
                    onClick={applyBulk}
                  >
                    Belirli gün tanımla
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" placeholder="Toplu Fiyat (TL)" className="h-8 w-32" min={0} value={quickPrice || ""} onChange={e => setQuickPrice(Number(e.target.value))} />
                  <Input type="number" placeholder="Toplu Kontejan" className="h-8 w-28" min={0} value={quickCount || ""} onChange={e => setQuickCount(Number(e.target.value))} />
                </div>
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-[900px]">
                  <thead>
                    <tr>
                      {weekDaysTr.map((d, i) => (
                        <th key={i} className="p-2 border-b border-gray-200 bg-gray-50 text-xs font-semibold text-center">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weeks.map((week, widx) => (
                      <tr key={widx}>
                        {week.map((date, idx) => {
                          const dStr = format(date, "yyyy-MM-dd");
                          const isCurrent = isSameMonth(date, month);
                          const val = getCell(date);
                          const selected = isSelected(date);
                          return (
                            <td
                              key={dStr}
                              className={`align-top p-1 border border-gray-200 transition-all duration-100 cursor-pointer
                                ${!isCurrent ? "bg-[#f7f7f7] text-gray-300" : ""}
                                ${selected ? "bg-blue-100 ring-2 ring-blue-400" : ""}
                              `}
                              style={{ minWidth: 100, verticalAlign: "top" }}
                              onClick={() => isCurrent && handleCalendarCellClick(date)}
                            >
                              <div className="font-bold text-[15px] mb-1 text-blue-900">
                                {isCurrent && <span>{date.getDate()}</span>}
                              </div>
                              <div className="text-xs text-blue-900 mb-0.5">
                                {val.count ?? 0} Toplam
                              </div>
                              <div className="flex flex-col gap-0.5 items-center">
                                <Input
                                  type="number"
                                  min={0}
                                  value={val.price ?? ""}
                                  onChange={e => setCell(date, "price", Number(e.target.value))}
                                  className="w-20 h-7 text-xs text-center bg-blue-50"
                                  placeholder="TL"
                                  disabled={!isCurrent}
                                />
                                <div className="text-[11px] text-gray-500 font-normal">TL {val.price?.toFixed(2) ?? "0.00"}</div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-gray-500 mt-2">Takvimde gün seç, aralığa toplu güncelle veya kutulardan tek tek güncelle!</div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-[#2094f3] text-white mt-6"
              disabled={updateRoomMutation.isPending}
            >
              {updateRoomMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Tüm Bilgileri Kaydet
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
