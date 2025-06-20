import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronLeft, CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { tr } from 'date-fns/locale';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Room, Hotel } from "@shared/schema";

// Define available room features
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

// Define room types
const roomTypes = [
  { id: "standard", label: "Standart Oda" },
  { id: "deluxe", label: "Deluxe Oda" },
  { id: "suite", label: "Suit" },
  { id: "executive", label: "Executive Oda" },
  { id: "family", label: "Aile Odası" },
  { id: "presidential", label: "Presidential Suit" },
];

const roomFormSchema = z.object({
  name: z.string().min(3, {
    message: "Oda adı en az 3 karakter olmalıdır",
  }),
  description: z.string().min(10, {
    message: "Açıklama en az 10 karakter olmalıdır",
  }),
  capacity: z.coerce.number().min(1, {
    message: "Kapasite en az 1 olmalıdır",
  }),
  roomCount: z.coerce.number().min(1, {
    message: "Oda sayısı en az 1 olmalıdır",
  }),
  imageUrl: z.string().url({
    message: "Geçerli bir URL girilmelidir",
  }),
  type: z.string().min(1, {
    message: "Oda tipi seçilmelidir",
  }),
  features: z.array(z.string()).min(1, {
    message: "En az bir özellik seçmelisiniz",
  }),
  hotelId: z.coerce.number(),
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

export default function RoomAddPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("details");
  
  // Fiyatlandırma ayarları için state'ler
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDatePrice, setSelectedDatePrice] = useState<number>(0);
  const [dailyPrices, setDailyPrices] = useState<Array<{date: Date, price: number}>>([]);
  const [selectedWeekday, setSelectedWeekday] = useState<number>(0);
  const [selectedWeekdayPrice, setSelectedWeekdayPrice] = useState<number>(0);
  const [weekdayPrices, setWeekdayPrices] = useState<Array<{dayIndex: number, price: number}>>([]);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [dateRange, setDateRange] = useState<{startDate: Date, endDate: Date}>({
    startDate: today,
    endDate: tomorrow,
  });
  
  type CalendarMode = 'single' | 'range' | 'weekday';
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('single');

  // Fetch hotels
  const { data: hotels = [], isLoading: isLoadingHotels } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
  });

  // Setup form
  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      hotelId: hotels.length > 0 ? hotels[0].id : 0,
      name: "",
      description: "",
      capacity: 2,
      roomCount: 1,
      imageUrl: "",
      features: [],
      type: roomTypes[0].label,
    },
  });

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: async (data: RoomFormValues) => {
      // Özel fiyatlandırma bilgilerini ekle
      const roomData = {
        ...data,
        // Takvim bazlı fiyatlandırma varsa temel fiyatı 0 olarak ayarla
        price: dailyPrices.length > 0 || weekdayPrices.length > 0 ? 0 : (data.price || 1450),
        dailyPrices: JSON.stringify(dailyPrices),
        weekdayPrices: JSON.stringify(weekdayPrices)
      };
      
      const res = await apiRequest("POST", `/api/rooms`, roomData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Oda eklendi",
        description: "Oda başarıyla eklendi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      navigate("/admin/rooms");
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Oda eklenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Function to add a special price for a specific date
  const addDailyPrice = () => {
    if (!selectedDate || selectedDatePrice <= 0) return;
    
    // Check if a price already exists for this date
    const existingIndex = dailyPrices.findIndex(
      dp => dp.date.toDateString() === selectedDate.toDateString()
    );
    
    if (existingIndex >= 0) {
      // Update existing price
      const updatedPrices = [...dailyPrices];
      updatedPrices[existingIndex] = {
        date: selectedDate,
        price: selectedDatePrice
      };
      setDailyPrices(updatedPrices);
      toast({
        title: "Fiyat güncellendi",
        description: `${format(selectedDate, 'PP', { locale: tr })} tarihi için fiyat ${selectedDatePrice}₺ olarak güncellendi.`,
      });
    } else {
      // Add new price
      setDailyPrices([...dailyPrices, { date: selectedDate, price: selectedDatePrice }]);
      toast({
        title: "Fiyat eklendi",
        description: `${format(selectedDate, 'PP', { locale: tr })} tarihi için ${selectedDatePrice}₺ fiyat eklendi.`,
      });
    }
    
    // Reset fields
    setSelectedDatePrice(0);
  };

  // Function to remove a daily price
  const removeDailyPrice = (dateToRemove: Date) => {
    setDailyPrices(dailyPrices.filter(
      dp => dp.date.toDateString() !== dateToRemove.toDateString()
    ));
    toast({
      title: "Fiyat kaldırıldı",
      description: `${format(dateToRemove, 'PP', { locale: tr })} tarihi için özel fiyat kaldırıldı.`,
    });
  };

  // Function to add a date range price
  const addDateRangePrice = (range: {startDate: Date, endDate: Date}, price: number) => {
    if (price <= 0) return;
    
    const newPrices: Array<{date: Date, price: number}> = [];
    const current = new Date(range.startDate);
    
    // Create a daily price for each day in the range
    while (current <= range.endDate) {
      newPrices.push({
        date: new Date(current),
        price: price
      });
      current.setDate(current.getDate() + 1);
    }
    
    // Merge with existing prices, replacing any that exist
    const updatedPrices = [...dailyPrices];
    
    for (const newPrice of newPrices) {
      const existingIndex = updatedPrices.findIndex(
        dp => dp.date.toDateString() === newPrice.date.toDateString()
      );
      
      if (existingIndex >= 0) {
        updatedPrices[existingIndex] = newPrice;
      } else {
        updatedPrices.push(newPrice);
      }
    }
    
    setDailyPrices(updatedPrices);
    
    toast({
      title: "Tarih aralığı fiyatları eklendi",
      description: `${format(range.startDate, 'PP', { locale: tr })} - ${format(range.endDate, 'PP', { locale: tr })} aralığı için ${price}₺ fiyat eklendi.`,
    });
    
    // Reset fields
    setSelectedDatePrice(0);
  };

  // Function to add a weekday price
  const addWeekdayPrice = (dayIndex: number, price: number) => {
    if (price <= 0) return;
    
    // Check if a price already exists for this weekday
    const existingIndex = weekdayPrices.findIndex(wp => wp.dayIndex === dayIndex);
    
    if (existingIndex >= 0) {
      // Update existing price
      const updatedPrices = [...weekdayPrices];
      updatedPrices[existingIndex] = { dayIndex, price };
      setWeekdayPrices(updatedPrices);
      toast({
        title: "Hafta günü fiyatı güncellendi",
        description: `${['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][dayIndex]} günleri için fiyat ${price}₺ olarak güncellendi.`,
      });
    } else {
      // Add new price
      setWeekdayPrices([...weekdayPrices, { dayIndex, price }]);
      toast({
        title: "Hafta günü fiyatı eklendi",
        description: `${['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][dayIndex]} günleri için ${price}₺ fiyat eklendi.`,
      });
    }
    
    // Reset fields
    setSelectedWeekdayPrice(0);
  };

  // Function to remove a weekday price
  const removeWeekdayPrice = (dayIndex: number) => {
    setWeekdayPrices(weekdayPrices.filter(wp => wp.dayIndex !== dayIndex));
    toast({
      title: "Hafta günü fiyatı kaldırıldı",
      description: `${['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][dayIndex]} günleri için özel fiyat kaldırıldı.`,
    });
  };

  const onSubmit = (data: RoomFormValues) => {
    // Eğer hiç özel fiyat tanımlanmadıysa, uyarı göster
    if (dailyPrices.length === 0 && weekdayPrices.length === 0) {
      toast({
        title: "Fiyat belirlemediniz",
        description: "En az bir tarih veya gün için fiyat belirlemelisiniz. Aksi halde oda rezerve edilemez.",
        variant: "destructive",
      });
      setActiveTab("pricing");
      return;
    }
    
    createRoomMutation.mutate(data);
  };

  // iOS/Android tarzında mobil arayüz
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-neutral-900 dark:to-neutral-950 flex flex-col">
      {/* Mobil-öncelikli üst çubuk */}
      <div className="bg-gradient-to-r from-[#08a0e9] to-[#14b8a6] shadow-md relative z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = "/admin/rooms"} 
              className="mr-2 text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> Geri
            </Button>
            <h1 className="text-xl font-medium text-white flex-1 text-center mr-8">
              Yeni Oda Ekle
            </h1>
          </div>
        </div>
      </div>
      
      <main className="flex-1 overflow-auto pb-20">
        <div className="max-w-5xl mx-auto px-4 pt-4">
          {isLoadingHotels ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="border-0 shadow-md overflow-hidden rounded-xl bg-white dark:bg-neutral-800">
                <CardHeader className="bg-blue-50 dark:bg-neutral-700/50 pb-4">
                  <CardTitle className="text-blue-800 dark:text-blue-200 text-lg">
                    Yeni Oda Oluştur
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="w-full mb-4">
                          <TabsTrigger value="details" className="flex-1">Oda Bilgileri</TabsTrigger>
                          <TabsTrigger value="pricing" className="flex-1">Fiyatlandırma</TabsTrigger>
                        </TabsList>
                        
                        {/* Oda Bilgileri Tab İçeriği */}
                        <TabsContent value="details" className="space-y-4 pb-4">
                          <FormField
                            control={form.control}
                            name="hotelId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Otel</FormLabel>
                                <Select
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  defaultValue={field.value ? field.value.toString() : undefined}
                                  value={field.value.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
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
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Oda Adı</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
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
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
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
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="capacity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Kapasite</FormLabel>
                                  <Select
                                    onValueChange={(value) => field.onChange(parseInt(value))}
                                    defaultValue={field.value.toString()}
                                    value={field.value.toString()}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Kapasite seçin" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="1">1 Kişilik</SelectItem>
                                      <SelectItem value="2">2 Kişilik</SelectItem>
                                      <SelectItem value="3">3 Kişilik</SelectItem>
                                      <SelectItem value="4">4 Kişilik</SelectItem>
                                      <SelectItem value="5">5 Kişilik</SelectItem>
                                      <SelectItem value="6">6 Kişilik</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="roomCount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Oda Sayısı</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="1"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Bu tipte kaç oda var
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="imageUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Görsel URL</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormDescription>
                                  Odayı temsil eden bir görselin URL'ini girin
                                </FormDescription>
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
                                    rows={4}
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
                                <div className="mb-4">
                                  <FormLabel>Özellikler</FormLabel>
                                  <FormDescription>
                                    Odanın sunduğu özellikleri seçin
                                  </FormDescription>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  {availableFeatures.map((feature) => (
                                    <FormField
                                      key={feature.id}
                                      control={form.control}
                                      name="features"
                                      render={({ field }) => {
                                        return (
                                          <FormItem
                                            key={feature.id}
                                            className="flex flex-row items-start space-x-3 space-y-0"
                                          >
                                            <FormControl>
                                              <Checkbox
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
                                            <FormLabel className="text-sm font-normal">
                                              {feature.label}
                                            </FormLabel>
                                          </FormItem>
                                        );
                                      }}
                                    />
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                        
                        {/* Fiyatlandırma Tab İçeriği */}
                        <TabsContent value="pricing" className="space-y-6 pb-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Mod seçimi */}
                            <div className="md:col-span-3 flex gap-2 mb-2">
                              <Button 
                                type="button"
                                variant={calendarMode === 'single' ? 'default' : 'outline'} 
                                onClick={() => setCalendarMode('single')}
                                className="flex-1"
                              >
                                Tek Gün
                              </Button>
                              <Button 
                                type="button"
                                variant={calendarMode === 'range' ? 'default' : 'outline'} 
                                onClick={() => setCalendarMode('range')}
                                className="flex-1"
                              >
                                Tarih Aralığı
                              </Button>
                              <Button 
                                type="button"
                                variant={calendarMode === 'weekday' ? 'default' : 'outline'} 
                                onClick={() => setCalendarMode('weekday')}
                                className="flex-1"
                              >
                                Haftanın Günleri
                              </Button>
                            </div>
                            
                            {/* Tek Gün Modu */}
                            {calendarMode === 'single' && (
                              <>
                                <div className="md:col-span-1">
                                  <div className="border rounded-md p-4">
                                    <h3 className="text-lg font-medium mb-2">Tarih Seçin</h3>
                                    <Calendar
                                      mode="single"
                                      selected={selectedDate as any}
                                      onSelect={(date: Date | undefined) => setSelectedDate(date || null)}
                                      locale={tr}
                                      showOutsideDays={false}
                                      className="border rounded-md p-3"
                                      modifiers={{
                                        dayPrices: dailyPrices as any,
                                      }}
                                    />
                                  </div>
                                </div>
                                
                                <div className="md:col-span-2">
                                  <div className="border rounded-md p-4 h-full flex flex-col">
                                    <h3 className="text-lg font-medium mb-4">Belirli Tarih için Fiyat</h3>
                                    
                                    {selectedDate ? (
                                      <div className="space-y-4">
                                        <div>
                                          <label className="block text-sm font-medium mb-1">
                                            {format(selectedDate, 'PPP', { locale: tr })} için fiyat
                                          </label>
                                          <div className="flex gap-2">
                                            <Input
                                              type="number"
                                              min="0"
                                              placeholder="Fiyat"
                                              value={selectedDatePrice || ''}
                                              onChange={(e) => setSelectedDatePrice(Number(e.target.value))}
                                            />
                                            <Button 
                                              type="button" 
                                              onClick={addDailyPrice}
                                              disabled={!selectedDate || selectedDatePrice <= 0}
                                            >
                                              Ekle
                                            </Button>
                                          </div>
                                        </div>
                                        
                                        <div className="mt-4">
                                          <h4 className="font-medium mb-2">Özel Fiyat Ayarlanmış Tarihler</h4>
                                          {dailyPrices.length === 0 ? (
                                            <p className="text-sm text-neutral-500">Henüz özel fiyat ayarlanmış tarih bulunmuyor.</p>
                                          ) : (
                                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                              {dailyPrices.map((dp, index) => (
                                                <div 
                                                  key={index} 
                                                  className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 rounded-md"
                                                >
                                                  <div>
                                                    <span className="font-medium">{format(dp.date, 'PP', { locale: tr })}</span>
                                                    <span className="ml-2 text-neutral-500">({format(dp.date, 'EEEE', { locale: tr })})</span>
                                                  </div>
                                                  <div className="flex items-center">
                                                    <span className="font-medium mr-3">{dp.price} ₺</span>
                                                    <Button 
                                                      type="button" 
                                                      variant="ghost" 
                                                      size="sm"
                                                      className="text-red-500 h-8 w-8 p-0"
                                                      onClick={() => removeDailyPrice(dp.date)}
                                                    >
                                                      <X className="h-4 w-4" />
                                                    </Button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                                        <CalendarIcon className="h-10 w-10 text-neutral-300 dark:text-neutral-600 mb-3" />
                                        <p className="text-neutral-500">Özel fiyat ayarlamak için sol taraftan bir tarih seçin.</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                            
                            {/* Tarih Aralığı Modu */}
                            {calendarMode === 'range' && (
                              <>
                                <div className="md:col-span-1">
                                  <div className="border rounded-md p-4">
                                    <h3 className="text-lg font-medium mb-2">Tarih Aralığı Seçin</h3>
                                    <Calendar
                                      mode="range"
                                      selected={{
                                        from: dateRange.startDate,
                                        to: dateRange.endDate
                                      }}
                                      onSelect={(range) => {
                                        if (range?.from && range?.to) {
                                          setDateRange({
                                            startDate: range.from,
                                            endDate: range.to
                                          });
                                        }
                                      }}
                                      locale={tr}
                                      showOutsideDays={false}
                                      className="border rounded-md p-3"
                                    />
                                  </div>
                                </div>
                                
                                <div className="md:col-span-2">
                                  <div className="border rounded-md p-4 h-full">
                                    <h3 className="text-lg font-medium mb-4">Tarih Aralığı için Fiyat</h3>
                                    
                                    <div className="space-y-4">
                                      <div>
                                        <label className="block text-sm font-medium mb-1">
                                          {dateRange.startDate && dateRange.endDate ? (
                                            <>
                                              {format(dateRange.startDate, 'PP', { locale: tr })} - {format(dateRange.endDate, 'PP', { locale: tr })} aralığı için fiyat
                                            </>
                                          ) : (
                                            "Seçilen aralık için fiyat"
                                          )}
                                        </label>
                                        <div className="flex gap-2">
                                          <Input
                                            type="number"
                                            min="0"
                                            placeholder="Fiyat"
                                            value={selectedDatePrice || ''}
                                            onChange={(e) => setSelectedDatePrice(Number(e.target.value))}
                                          />
                                          <Button 
                                            type="button" 
                                            onClick={() => addDateRangePrice(dateRange, selectedDatePrice)}
                                            disabled={selectedDatePrice <= 0}
                                          >
                                            Ekle
                                          </Button>
                                        </div>
                                      </div>
                                      
                                      <div className="mt-4">
                                        <h4 className="font-medium mb-2">Özel Fiyat Ayarlanmış Tarihler</h4>
                                        {dailyPrices.length === 0 ? (
                                          <p className="text-sm text-neutral-500">Henüz özel fiyat ayarlanmış tarih bulunmuyor.</p>
                                        ) : (
                                          <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {dailyPrices.map((dp, index) => (
                                              <div 
                                                key={index} 
                                                className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 rounded-md"
                                              >
                                                <div>
                                                  <span className="font-medium">{format(dp.date, 'PP', { locale: tr })}</span>
                                                  <span className="ml-2 text-neutral-500">({format(dp.date, 'EEEE', { locale: tr })})</span>
                                                </div>
                                                <div className="flex items-center">
                                                  <span className="font-medium mr-3">{dp.price} ₺</span>
                                                  <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="sm"
                                                    className="text-red-500 h-8 w-8 p-0"
                                                    onClick={() => removeDailyPrice(dp.date)}
                                                  >
                                                    <X className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                            
                            {/* Haftanın Günleri Modu */}
                            {calendarMode === 'weekday' && (
                              <div className="md:col-span-3">
                                <div className="border rounded-md p-4">
                                  <h3 className="text-lg font-medium mb-4">Haftanın Günlerine Göre Fiyatlandırma</h3>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <div className="space-y-4">
                                        <label className="block text-sm font-medium">Gün Seçin</label>
                                        <div className="flex gap-2 flex-wrap">
                                          {['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'].map((day, index) => (
                                            <Badge 
                                              key={index}
                                              className={`cursor-pointer ${selectedWeekday === index ? 'bg-primary' : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200'}`}
                                              onClick={() => setSelectedWeekday(index)}
                                            >
                                              {day}
                                            </Badge>
                                          ))}
                                        </div>
                                        
                                        <div className="mt-4">
                                          <label className="block text-sm font-medium mb-1">
                                            {['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][selectedWeekday]} günleri için fiyat
                                          </label>
                                          <div className="flex gap-2">
                                            <Input
                                              type="number"
                                              min="0"
                                              placeholder="Fiyat"
                                              value={selectedWeekdayPrice || ''}
                                              onChange={(e) => setSelectedWeekdayPrice(Number(e.target.value))}
                                            />
                                            <Button 
                                              type="button" 
                                              onClick={() => addWeekdayPrice(selectedWeekday, selectedWeekdayPrice)}
                                              disabled={selectedWeekdayPrice <= 0}
                                            >
                                              Ekle
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-medium mb-2">Özel Fiyat Ayarlanmış Günler</h4>
                                      {weekdayPrices.length === 0 ? (
                                        <p className="text-sm text-neutral-500">Henüz özel fiyat ayarlanmış hafta günü bulunmuyor.</p>
                                      ) : (
                                        <div className="space-y-2">
                                          {weekdayPrices.map((wp, index) => (
                                            <div 
                                              key={index} 
                                              className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 rounded-md"
                                            >
                                              <span className="font-medium">
                                                {['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][wp.dayIndex]}
                                              </span>
                                              <div className="flex items-center">
                                                <span className="font-medium mr-3">{wp.price} ₺</span>
                                                <Button 
                                                  type="button" 
                                                  variant="ghost" 
                                                  size="sm"
                                                  className="text-red-500 h-8 w-8 p-0"
                                                  onClick={() => removeWeekdayPrice(wp.dayIndex)}
                                                >
                                                  <X className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                      
                      <div className="flex justify-end gap-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => navigate("/admin/rooms")}
                        >
                          İptal
                        </Button>
                        <Button 
                          type="submit"
                          disabled={createRoomMutation.isPending}
                        >
                          {createRoomMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Oda Ekle
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}