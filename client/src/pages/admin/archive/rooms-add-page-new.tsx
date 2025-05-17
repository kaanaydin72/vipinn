import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Room, Hotel, insertRoomSchema } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  ArrowLeft,
  Loader2,
  Calendar as CalendarIcon,
  Plus,
  X,
  Check,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Oda özellikleri
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

// Oda tipleri
const roomTypes = [
  { id: 1, label: "Standart" },
  { id: 2, label: "Deluxe" },
  { id: 3, label: "Suite" },
  { id: 4, label: "Aile Odası" },
  { id: 5, label: "Ekonomik" },
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
  price: z.number({
    required_error: "Fiyat gereklidir",
    invalid_type_error: "Fiyat bir sayı olmalıdır",
  }).min(0, "Fiyat en az 0 olmalıdır"),
  capacity: z.number({
    required_error: "Lütfen kapasite seçin",
  }),
  features: z.array(z.string()).default([]),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

export default function RoomsAddPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Takvim modu seçenekleri
  type CalendarMode = 'single' | 'range' | 'weekday';
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('single');
  
  // Günlük fiyat durumları
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
  
  // Otel bilgilerini getir
  const { data: hotels = [] } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
    staleTime: 10 * 60 * 1000, // 10 dakika
  });

  // Room form
  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      hotelId: 0,
      name: "",
      description: "",
      price: 0,
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
      // price'ı sayıya dönüştürdüğümüzden emin olalım
      const numericPrice = typeof data.price === 'string' ? parseFloat(data.price) : data.price;
      
      // dailyPrices ve weekdayPrices'ı JSON stringine dönüştür
      let updatedData = {
        ...data,
        price: numericPrice,
        dailyPrices: JSON.stringify(dailyPrices),
        weekdayPrices: JSON.stringify(weekdayPrices)
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
    
    // Form temizleme
    setSelectedDatePrice(0);
    toast({
      title: "Fiyat eklendi",
      description: `${format(range.startDate, 'dd/MM/yyyy')} - ${format(range.endDate, 'dd/MM/yyyy')} tarihleri için ${price}₺ eklendi.`,
    });
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
    
    // Başarı mesajı
    const weekdays = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    toast({
      title: "Fiyat eklendi",
      description: `Tüm ${weekdays[dayIndex]} günleri için ${price}₺ fiyat eklendi.`,
    });
  };
  
  // Haftanın günü fiyat silme fonksiyonu
  const removeWeekdayPrice = (dayIndex: number) => {
    // Haftanın günü fiyatını kaldır
    setWeekdayPrices(weekdayPrices.filter(wp => wp.dayIndex !== dayIndex));
    
    // İlgili tüm günlük fiyatları da kaldır
    setDailyPrices(dailyPrices.filter(dp => dp.date.getDay() !== dayIndex));
    
    const weekdays = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    toast({
      title: "Fiyat kaldırıldı",
      description: `${weekdays[dayIndex]} günleri için fiyat ayarları kaldırıldı.`,
      variant: "destructive",
    });
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
      
      {/* Ana İçerik */}
      <div className="p-4">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="details">Oda Bilgileri</TabsTrigger>
            <TabsTrigger value="pricing">Fiyatlandırma</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
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
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temel Fiyat (₺)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="1450"
                            className="h-12 bg-white shadow-sm border-[#2094f3]/20"
                            value={field.value}
                            onChange={(e) => {
                              // String'i sayıya dönüştür
                              const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              field.onChange(value);
                            }}
                          />
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
                
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Görsel URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/image.jpg" 
                          className="h-12 bg-white shadow-sm border-[#2094f3]/20"
                          {...field} 
                        />
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
          </TabsContent>
          
          <TabsContent value="pricing" className="space-y-6">
            <div className="bg-white shadow rounded-md p-4">
              <div className="grid grid-cols-3 gap-2 mb-4">
                <Button 
                  type="button"
                  variant={calendarMode === 'single' ? 'default' : 'outline'}
                  className={calendarMode === 'single' ? 'bg-[#2094f3]' : 'border-[#2094f3] text-[#2094f3]'}
                  onClick={() => setCalendarMode('single')}
                >
                  Tek Gün
                </Button>
                <Button 
                  type="button"
                  variant={calendarMode === 'range' ? 'default' : 'outline'}
                  className={calendarMode === 'range' ? 'bg-[#2094f3]' : 'border-[#2094f3] text-[#2094f3]'}
                  onClick={() => setCalendarMode('range')}
                >
                  Tarih Aralığı
                </Button>
                <Button 
                  type="button"
                  variant={calendarMode === 'weekday' ? 'default' : 'outline'}
                  className={calendarMode === 'weekday' ? 'bg-[#2094f3]' : 'border-[#2094f3] text-[#2094f3]'}
                  onClick={() => setCalendarMode('weekday')}
                >
                  Haftanın Günleri
                </Button>
              </div>
              
              {calendarMode === 'single' && (
                <div>
                  <div className="mb-4">
                    <Calendar
                      mode="single"
                      selected={selectedDate || undefined}
                      onSelect={(date: Date | undefined) => setSelectedDate(date || null)}
                      locale={tr}
                      className="mx-auto"
                      disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
                      <div className="font-medium text-sm">Seçilen Tarih:</div>
                      <div className="text-lg font-medium">
                        {selectedDate ? format(selectedDate, 'PP', { locale: tr }) : 'Tarih seçilmedi'}
                      </div>
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
                    >
                      Fiyatı Ekle
                    </Button>
                  </div>
                </div>
              )}
              
              {calendarMode === 'range' && (
                <div>
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
                      <div className="font-medium text-sm">Seçilen Tarih Aralığı:</div>
                      <div className="text-lg font-medium">
                        {format(dateRange.startDate, 'PP', { locale: tr })} - {format(dateRange.endDate, 'PP', { locale: tr })}
                      </div>
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
                    >
                      Tüm Aralığa Fiyat Ekle
                    </Button>
                  </div>
                </div>
              )}
              
              {calendarMode === 'weekday' && (
                <div>
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
                    >
                      Haftanın Günlerine Fiyat Ekle
                    </Button>
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
              disabled={createRoomMutation.isPending}
            >
              {createRoomMutation.isPending ? (
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