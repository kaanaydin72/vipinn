import { useState, useRef, ChangeEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Room, Hotel, insertRoomSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDeviceType } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
import { Badge } from "@/components/ui/badge";
import { Check, Image, UploadCloud } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  ArrowLeft,
  Loader2,
  Calendar as CalendarIcon,
  Plus,
  X
} from "lucide-react";

import { format } from "date-fns";
import { tr } from "date-fns/locale";

// Type assertion için özel Calendar bileşeni
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

// Günlük fiyat tipi
type DailyPrice = {
  date: Date;
  price: number;
};

// Haftanın günleri için tanımlama
type WeekdayPrice = {
  dayIndex: number; // 0: Pazar, 1: Pazartesi, ... 6: Cumartesi
  price: number;
};

// Çoklu tarih seçimi için aralık tipi
type DateRange = {
  startDate: Date;
  endDate: Date;
};

// Form için kullanılacak schema
const roomFormSchema = insertRoomSchema.extend({
  hotelId: z.number({
    required_error: "Lütfen bir otel seçin",
  }),
  capacity: z.number({
    required_error: "Lütfen kapasite seçin",
  }),
  features: z.array(z.string()).default([]),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

export default function RoomAddMobile() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Takvim modu seçenekleri
  type CalendarMode = 'single' | 'range' | 'weekday';
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('single');
  
  // Günlük fiyat durumları
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dailyPrices, setDailyPrices] = useState<DailyPrice[]>([]);
  const [selectedDatePrice, setSelectedDatePrice] = useState<number>(0);
  
  // Yeni tarih aralığı durumları
  const [dateRange, setDateRange] = useState<DateRange>({ 
    startDate: new Date(), 
    endDate: new Date(new Date().setDate(new Date().getDate() + 7))
  });
  
  // Haftanın günleri durumları
  const [weekdayPrices, setWeekdayPrices] = useState<WeekdayPrice[]>([]);
  const [selectedWeekday, setSelectedWeekday] = useState<number>(1); // 1: Pazartesi
  const [selectedWeekdayPrice, setSelectedWeekdayPrice] = useState<number>(0);
  
  // Resim yükleme için state'ler
  const [images, setImages] = useState<{url: string, filename: string, isMain: boolean}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Otel bilgilerini getir
  const { data: hotels = [] } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
    staleTime: 10 * 60 * 1000, // 10 dakika
  });

  // Room form
  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      hotelId: undefined,
      name: "",
      description: "",
      capacity: 2,
      imageUrl: "",
      features: [],
      type: "Standart",
      dailyPrices: "",
    },
  });

  // Oda oluşturma fonksiyonu
  const createRoomMutation = useMutation({
    mutationFn: async (data: RoomFormValues) => {
      // Eğer ana resim belirlenmemişse hata göster
      if (!data.imageUrl && images.length > 0) {
        throw new Error('Lütfen bir ana resim belirleyin.');
      }
      
      // Takvim bazlı fiyatlandırma kullanıyoruz, price değeri sıfır olmalı
      const numericPrice = 0;
      
      // Tüm resim bilgilerini hazırla
      const imagesData = images.map(img => ({
        url: img.url,
        filename: img.filename,
        isMain: img.isMain
      }));
      
      // dailyPrices ve weekdayPrices'ı JSON stringine dönüştür
      let updatedData = {
        ...data,
        price: numericPrice,
        dailyPrices: JSON.stringify(dailyPrices),
        weekdayPrices: JSON.stringify(weekdayPrices),
        images: JSON.stringify(imagesData) // Tüm resim verilerini JSON olarak gönder
      };
      
      const res = await apiRequest("POST", "/api/rooms", updatedData);
      return await res.json();
    },
    onSuccess: (data: Room) => {
      toast({
        title: "Başarılı",
        description: "Oda başarıyla eklendi",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      navigate("/admin/rooms");
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Oda eklenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: RoomFormValues) => {
    // Form doğrulama kontrolleri
    if (!data.hotelId) {
      toast({
        title: "Validasyon Hatası",
        description: "Lütfen bir otel seçin",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.name) {
      toast({
        title: "Validasyon Hatası",
        description: "Lütfen oda adını girin",
        variant: "destructive",
      });
      return;
    }
    
    // Takvim bazlı fiyatlandırma kullanıldığından, price kontrolü artık gerekli değil
    // Fiyatlar sadece takvimde yönetiliyor
    
    if (images.length === 0) {
      toast({
        title: "Resim Gerekli",
        description: "Lütfen en az bir oda resmi ekleyin",
        variant: "destructive",
      });
      return;
    }
    
    if (!data.imageUrl && images.length > 0) {
      // Ana resim seçilmemiş, ancak resimler var
      // İlk resmi ana resim olarak belirle
      const updatedImages = [...images];
      updatedImages[0].isMain = true;
      setImages(updatedImages);
      
      // imageUrl'i güncelle
      form.setValue('imageUrl', updatedImages[0].url);
      
      // Güncellenmiş form verilerini al
      const updatedData = form.getValues();
      createRoomMutation.mutate(updatedData);
      return;
    }
    
    // Tüm kontroller geçildi, form gönderildi
    console.log("Oda ekleme form verileri:", data);
    createRoomMutation.mutate(data);
  };

  // Seçilen tarihe fiyat ekleme
  const addDailyPrice = () => {
    if (!selectedDate || selectedDatePrice <= 0) return;
    
    // Aynı tarih için fiyat güncellemesi veya ekleme
    const existingIndex = dailyPrices.findIndex(
      dp => format(dp.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
    );
    
    if (existingIndex !== -1) {
      // Mevcut fiyatı güncelle
      const updatedPrices = [...dailyPrices];
      updatedPrices[existingIndex] = {
        date: selectedDate,
        price: selectedDatePrice
      };
      setDailyPrices(updatedPrices);
    } else {
      // Yeni fiyat ekle
      setDailyPrices([...dailyPrices, {
        date: selectedDate,
        price: selectedDatePrice
      }]);
    }
    
    // Form temizleme
    setSelectedDatePrice(0);
    setSelectedDate(null);
    setIsCalendarOpen(false);
  };

  // Günlük fiyat silme
  const removeDailyPrice = (dateToRemove: Date) => {
    setDailyPrices(dailyPrices.filter(
      dp => format(dp.date, 'yyyy-MM-dd') !== format(dateToRemove, 'yyyy-MM-dd')
    ));
  };
  
  // Tarih aralığı için fiyat ekleme fonksiyonu
  const addDateRangePrice = (range: DateRange, price: number) => {
    if (!range.startDate || !range.endDate || price <= 0) return;
    
    const dates: DailyPrice[] = [];
    let currentDate = new Date(range.startDate);
    
    // Bitiş tarihi dahil olarak tüm günleri ekle
    while (currentDate <= range.endDate) {
      dates.push({
        date: new Date(currentDate),
        price
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Mevcut fiyatlar ile birleştir (aynı tarihler varsa güncelle)
    const updatedPrices = [...dailyPrices];
    
    dates.forEach(newDatePrice => {
      const existingIndex = updatedPrices.findIndex(
        dp => format(dp.date, 'yyyy-MM-dd') === format(newDatePrice.date, 'yyyy-MM-dd')
      );
      
      if (existingIndex !== -1) {
        updatedPrices[existingIndex] = newDatePrice;
      } else {
        updatedPrices.push(newDatePrice);
      }
    });
    
    setDailyPrices(updatedPrices);
    setIsCalendarOpen(false);
  };
  
  // Haftanın günü fiyat ekleme fonksiyonu
  const addWeekdayPrice = (dayIndex: number, price: number) => {
    if (price <= 0) return;
    
    // Mevcut haftanın günleri için fiyatları kontrol et ve güncelle
    const existingIndex = weekdayPrices.findIndex(wp => wp.dayIndex === dayIndex);
    
    if (existingIndex !== -1) {
      // Mevcut fiyatı güncelle
      const updatedPrices = [...weekdayPrices];
      updatedPrices[existingIndex] = { dayIndex, price };
      setWeekdayPrices(updatedPrices);
    } else {
      // Yeni fiyat ekle
      setWeekdayPrices([...weekdayPrices, { dayIndex, price }]);
    }
    
    // Gelecekteki tüm bu haftanın günlerini de güncelle
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Önümüzdeki 6 ay için (yaklaşık 180 gün)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 180);
    
    let currentDate = new Date(today);
    const newDailyPrices: DailyPrice[] = [];
    
    while (currentDate <= futureDate) {
      if (currentDate.getDay() === dayIndex) {
        newDailyPrices.push({
          date: new Date(currentDate),
          price
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Mevcut fiyatlar ile birleştir (aynı tarihler varsa güncelle)
    const updatedPrices = [...dailyPrices];
    
    newDailyPrices.forEach(newDatePrice => {
      const existingIndex = updatedPrices.findIndex(
        dp => format(dp.date, 'yyyy-MM-dd') === format(newDatePrice.date, 'yyyy-MM-dd')
      );
      
      if (existingIndex !== -1) {
        updatedPrices[existingIndex] = newDatePrice;
      } else {
        updatedPrices.push(newDatePrice);
      }
    });
    
    setDailyPrices(updatedPrices);
    setIsCalendarOpen(false);
  };
  
  // Haftanın günü fiyat silme fonksiyonu
  const removeWeekdayPrice = (dayIndex: number) => {
    // Haftanın günü fiyatını kaldır
    setWeekdayPrices(weekdayPrices.filter(wp => wp.dayIndex !== dayIndex));
    
    // İlgili tüm günlük fiyatları da kaldır
    setDailyPrices(dailyPrices.filter(dp => dp.date.getDay() !== dayIndex));
  };
  
  // Çoklu resim yükleme işlemleri
  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }
      
      const response = await fetch('/api/upload/multiple', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Resim yükleme başarısız oldu');
      }
      
      const result = await response.json();
      
      // İlk resmi ana resim olarak işaretle
      const newImages = result.files.map((file: any, index: number) => ({
        url: file.url,
        filename: file.filename,
        isMain: index === 0 && images.length === 0 // İlk resmi ve daha önce resim yoksa ana resim yap
      }));
      
      setImages(prev => {
        const updatedImages = [...prev, ...newImages];
        
        // Eğer hiç ana resim yoksa, ilk resmi ana resim olarak ayarla
        if (!updatedImages.some(img => img.isMain)) {
          updatedImages[0].isMain = true;
        }
        
        return updatedImages;
      });
      
      // Ana resim URL'sini form'a ayarla
      const mainImage = [...images, ...newImages].find(img => img.isMain);
      if (mainImage) {
        form.setValue('imageUrl', mainImage.url);
      }
      
      toast({
        title: "Resimler yüklendi",
        description: `${result.files.length} resim başarıyla yüklendi`,
      });
      
    } catch (error) {
      console.error('Resim yükleme hatası:', error);
      toast({
        title: "Resim yükleme hatası",
        description: error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu',
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Input değerini temizle ki aynı dosyayı tekrar seçebilsin
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Ana resmi değiştirme
  const setMainImage = (index: number) => {
    const updatedImages = images.map((img, i) => ({
      ...img,
      isMain: i === index
    }));
    
    setImages(updatedImages);
    
    // Ana resmi form'a ayarla
    const mainImage = updatedImages.find(img => img.isMain);
    if (mainImage) {
      form.setValue('imageUrl', mainImage.url);
    }
    
    toast({
      title: "Ana resim güncellendi",
      description: "Seçilen resim ana resim olarak ayarlandı"
    });
  };
  
  // Resim silme
  const removeImage = (index: number) => {
    const wasMain = images[index].isMain;
    const updatedImages = images.filter((_, i) => i !== index);
    
    // Eğer ana resim silindiyse ve başka resimler varsa, ilk resmi ana resim yap
    if (wasMain && updatedImages.length > 0) {
      updatedImages[0].isMain = true;
      form.setValue('imageUrl', updatedImages[0].url);
    } else if (updatedImages.length === 0) {
      // Tüm resimler silindi
      form.setValue('imageUrl', '');
    }
    
    setImages(updatedImages);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* iOS/Android style mobile header */}
      <div className="sticky top-0 z-10">
        <div className="bg-gradient-to-r from-[#2094f3] to-[#38b6ff] text-white shadow-md">
          <div className="flex items-center px-4 h-14">
            <Button variant="ghost" size="icon" className="text-white" asChild>
              <Link href="/admin/rooms">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="flex-1 text-center font-semibold text-lg">Yeni Oda Ekle</h1>
            <div className="w-8"></div> {/* Sağda boşluk için */}
          </div>
        </div>
      </div>
      
      {/* iOS/Android style mobile form */}
      <div className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="hotelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Otel</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value ? field.value.toString() : undefined}
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
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Oda Adı</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Standart Oda" 
                      className="h-12 bg-white shadow-sm border-[#2094f3]/20" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kapasite</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 bg-white shadow-sm border-[#2094f3]/20">
                          <SelectValue placeholder="Kapasite" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 Kişilik</SelectItem>
                        <SelectItem value="2">2 Kişilik</SelectItem>
                        <SelectItem value="3">3 Kişilik</SelectItem>
                        <SelectItem value="4">4 Kişilik</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12 bg-white shadow-sm border-[#2094f3]/20">
                        <SelectValue placeholder="Oda tipi seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roomTypes.map((type) => (
                        <SelectItem key={type.id} value={type.label}>
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
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem className="hidden">
                    {/* Asıl URL'yi saklı tut, değeri fonksiyonlarla ayarlanacak */}
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
                
                {/* Gizli dosya input'u */}
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
                        <img 
                          src={image.url} 
                          alt={`Oda resmi ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Asıl resim badge'i */}
                        {image.isMain && (
                          <div className="absolute top-1 left-1 bg-[#2094f3] text-white text-xs px-2 py-1 rounded-full flex items-center">
                            <Check className="h-3 w-3 mr-1" />
                            Ana Resim
                          </div>
                        )}
                        
                        {/* Kontrol butonları */}
                        <div className="absolute bottom-1 right-1 flex space-x-1">
                          {/* Ana resim yapma buton */}
                          {!image.isMain && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 rounded-full bg-white/90 border-none hover:bg-white"
                              onClick={() => setMainImage(index)}
                            >
                              <Image className="h-4 w-4 text-[#2094f3]" />
                            </Button>
                          )}
                          
                          {/* Silme buton */}
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
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
                    <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2094f3]/10">
                        <Image className="h-5 w-5 text-[#2094f3]" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-50">Resim yükleyin</h3>
                      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                        Lütfen odanın görsellerini ekleyin. İlk yüklediğiniz resim ana resim olarak kullanılacaktır.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Oda hakkında detaylı bilgi..."
                      rows={3}
                      className="bg-white shadow-sm border-[#2094f3]/20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Günlük Fiyat Ayarları */}
            <FormItem>
              <FormLabel>Günlük Özel Fiyatlar</FormLabel>
              <div className="space-y-2">
                <Sheet open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <SheetTrigger asChild>
                    <Button type="button" variant="outline" className="h-12 bg-white shadow-sm border-[#2094f3] border-solid w-full text-[#2094f3] flex items-center justify-center">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span>Tarih ve Fiyat Ekle</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-lg">
                    <SheetHeader className="text-left">
                      <SheetTitle>Fiyat Belirleme</SheetTitle>
                      <SheetDescription>
                        Özel fiyat belirleme yöntemini seçin
                      </SheetDescription>
                    </SheetHeader>
                    
                    <div className="pt-4 pb-2">
                      <div className="grid grid-cols-3 gap-2">
                        <Button 
                          variant={calendarMode === 'single' ? 'default' : 'outline'}
                          className={calendarMode === 'single' ? 'bg-[#2094f3]' : 'border-[#2094f3] text-[#2094f3]'}
                          onClick={() => setCalendarMode('single')}
                        >
                          Tek Gün
                        </Button>
                        <Button 
                          variant={calendarMode === 'range' ? 'default' : 'outline'}
                          className={calendarMode === 'range' ? 'bg-[#2094f3]' : 'border-[#2094f3] text-[#2094f3]'}
                          onClick={() => setCalendarMode('range')}
                        >
                          Tarih Aralığı
                        </Button>
                        <Button 
                          variant={calendarMode === 'weekday' ? 'default' : 'outline'}
                          className={calendarMode === 'weekday' ? 'bg-[#2094f3]' : 'border-[#2094f3] text-[#2094f3]'}
                          onClick={() => setCalendarMode('weekday')}
                        >
                          Haftanın Günleri
                        </Button>
                      </div>
                    </div>
                    
                    {calendarMode === 'single' && (
                      <div className="py-4">
                        <div className="mb-4">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date: Date | undefined) => setSelectedDate(date || null)}
                            locale={tr}
                            className="mx-auto"
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            modifiers={{
                              highlighted: dailyPrices.map(dp => dp.date)
                            }}
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
                            <FormLabel>Seçilen Tarih:</FormLabel>
                            <div className="text-lg font-medium">
                              {selectedDate ? format(selectedDate, 'PP', { locale: tr }) : 'Tarih seçilmedi'}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <FormLabel>Bu Gün İçin Fiyat (₺):</FormLabel>
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
                          >
                            Fiyatı Ekle
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {calendarMode === 'range' && (
                      <div className="py-4">
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
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            numberOfMonths={2}
                            modifiers={{
                              highlighted: dailyPrices.map(dp => dp.date)
                            }}
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
                            <FormLabel>Seçilen Tarih Aralığı:</FormLabel>
                            <div className="text-lg font-medium">
                              {format(dateRange.startDate, 'PP', { locale: tr })} - {format(dateRange.endDate, 'PP', { locale: tr })}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <FormLabel>Bu Aralık İçin Fiyat (₺):</FormLabel>
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
                          >
                            Tüm Aralığa Fiyat Ekle
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {calendarMode === 'weekday' && (
                      <div className="py-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <FormLabel>Haftanın Günü:</FormLabel>
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
                            <FormLabel>Bu Gün İçin Fiyat (₺):</FormLabel>
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
                          >
                            Haftanın Günlerine Fiyat Ekle
                          </Button>
                        </div>
                        
                        {weekdayPrices.length > 0 && (
                          <div className="mt-6">
                            <FormLabel>Haftanın Günleri Fiyatları:</FormLabel>
                            <div className="mt-2 space-y-2">
                              {weekdayPrices.map((wp) => (
                                <div key={wp.dayIndex} className="flex justify-between items-center bg-neutral-50 p-2 rounded">
                                  <div>
                                    <span className="font-medium">
                                      {['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][wp.dayIndex]}
                                    </span>
                                    <span className="ml-2 text-[#2094f3] font-semibold">{wp.price} ₺</span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-red-500"
                                    onClick={() => removeWeekdayPrice(wp.dayIndex)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                  </SheetContent>
                </Sheet>
                
                {/* Eklenen günlük fiyatlar listesi */}
                {dailyPrices.length > 0 && (
                  <div className="bg-white shadow-sm rounded-md p-3 border border-[#2094f3]/20 mt-3">
                    <div className="text-sm font-medium mb-2">Eklenen Özel Fiyatlar:</div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
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
              </div>
            </FormItem>
            
            {/* Oda özellikleri */}
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
                          <FormItem
                            key={feature.id}
                            className="flex flex-row items-center space-x-2 space-y-0 bg-white shadow-sm p-3 rounded-md border border-[#2094f3]/20"
                          >
                            <FormControl>
                              <Checkbox
                                className="h-5 w-5 text-[#2094f3] border-[#2094f3]"
                                checked={field.value?.includes(feature.label)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, feature.label])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== feature.label
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm cursor-pointer font-normal">
                              {feature.label}
                            </FormLabel>
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
              className="w-full h-12 bg-[#2094f3] text-white mt-6"
              disabled={createRoomMutation.isPending}
            >
              {createRoomMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Odayı Kaydet
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}