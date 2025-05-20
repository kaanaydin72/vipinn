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
import { 
  Loader2, 
  ArrowLeft, 
  CalendarDays, 
  Hash, 
  Calendar as CalendarIcon, 
  Clock,
  Save,
  Upload,
  Star,
  Trash
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
  { id: "standart", label: "Standart Oda" },
  { id: "deluxe", label: "Deluxe Oda" },
  { id: "suit", label: "Suit Oda" },
  { id: "aile", label: "Aile Odası" },
];

// Weekday names
const weekdays = [
  { index: 0, name: "Pazar" },
  { index: 1, name: "Pazartesi" },
  { index: 2, name: "Salı" },
  { index: 3, name: "Çarşamba" },
  { index: 4, name: "Perşembe" },
  { index: 5, name: "Cuma" },
  { index: 6, name: "Cumartesi" },
];

// Extended schema for form validation
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
  
  // Popover states
  const [openSingleDatePicker, setOpenSingleDatePicker] = useState(false);
  const [openRangeDatePicker, setOpenRangeDatePicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Resim yönetimi için state'ler
  const [images, setImages] = useState<Array<{url: string, filename: string, isMain: boolean}>>([]);
  
  type CalendarMode = 'single' | 'range' | 'weekday';
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('single');
  const [rangePriceValue, setRangePriceValue] = useState<number>(0);
  
  // Fetch the room data
  const roomId = params?.id ? parseInt(params.id) : 0;
  
  const { data: room, isLoading: isLoadingRoom } = useQuery<Room>({
  queryKey: ['/api/rooms', roomId],
  queryFn: async () => {
    const response = await apiRequest("GET", `/api/rooms/${roomId}`);
    const json = await response.json();
    console.log("API /api/rooms/:id cevabı:", json); // <-- LOG EKLENDİ!
    // Eğer veri boşsa null döndür
    if (!json || Object.keys(json).length === 0) return null;
    if (json.data) return json.data;
    return json;
  },
  enabled: !!roomId,
});

  
  // Fetch hotels
  const { data: hotels = [], isLoading: isLoadingHotels } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
  });
  
  const isLoading = isLoadingRoom || isLoadingHotels;
  
  // Load saved pricing data and images
  useEffect(() => {
    if (room && room.dailyPrices) {
      try {
        const parsedDailyPrices = JSON.parse(room.dailyPrices);
        setDailyPrices(parsedDailyPrices.map((item: any) => ({ 
          date: new Date(item.date), 
          price: item.price 
        })));
      } catch (e) {
        console.error("Error parsing dailyPrices:", e);
      }
    }
    
    if (room && room.weekdayPrices) {
      try {
        const parsedWeekdayPrices = JSON.parse(room.weekdayPrices);
        setWeekdayPrices(parsedWeekdayPrices);
      } catch (e) {
        console.error("Error parsing weekdayPrices:", e);
      }
    }
    
    // Yüklenen resimleri kontrol et ve ayarla
    if (room && room.images) {
      try {
        const parsedImages = JSON.parse(room.images);
        
        // Eğer ana görsel yoksa, ana görseli ana görsel olarak işaretle
        if (parsedImages.length > 0 && !parsedImages.some((img: any) => img.isMain)) {
          parsedImages[0].isMain = true;
        }
        
        setImages(parsedImages);
      } catch (e) {
        console.error("Error parsing images:", e);
        // Eğer images dizisi parse edilemezse, en azından ana resmi ekle
        if (room.imageUrl) {
          setImages([{
            url: room.imageUrl,
            filename: 'main_image.jpg',
            isMain: true
          }]);
        }
      }
    } else if (room && room.imageUrl) {
      // Eski sistemden geçişte, sadece imageUrl varsa onu ana resim olarak ekle
      setImages([{
        url: room.imageUrl,
        filename: 'main_image.jpg',
        isMain: true
      }]);
    }
  }, [room]);
  
  // Setup form with room data
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
  
  // Update form values when room data is loaded
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
  
  // Update room mutation
  const updateRoomMutation = useMutation({
    mutationFn: async (roomData: any) => {
      // Talepte bulunmadan önce verileri kontrol et
      console.log("Sunucuya gönderilen veriler:", roomData);

      // JSON formatındaki dailyPrices ve weekdayPrices string olmadığında, 
      // düzgün bir şekilde JSON'a çevrildiğinden emin ol
      if (typeof roomData.dailyPrices === 'object') {
        roomData.dailyPrices = JSON.stringify(roomData.dailyPrices);
      }
      
      if (typeof roomData.weekdayPrices === 'object') {
        roomData.weekdayPrices = JSON.stringify(roomData.weekdayPrices);
      }
      
      // Oda ID'sini kontrol edelim
      if (!roomId) {
        throw new Error("Oda ID bulunamadı");
      }
      
      try {
        // Yükleme göstergesini aktifleştir
        toast({
          title: "İşlem devam ediyor",
          description: "Oda bilgileri güncelleniyor, lütfen bekleyin..."
        });
        
        // PUT kullanıyoruz çünkü sunucuda bu endpoint ile tanımlanmış
        console.log("PUT isteği yapılıyor:", `/api/rooms/${roomId}`, roomData);
        const response = await apiRequest(
          "PUT",
          `/api/rooms/${roomId}`,
          roomData
        );
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Sunucu hata yanıtı:", errorText);
          throw new Error(`Sunucu hatası (${response.status}): ${errorText}`);
        }
        
        return await response.json();
      } catch (error: any) {
        console.error("API hatası:", error);
        throw new Error(error.message || "Bilinmeyen bir hata oluştu");
      }
    },
    onSuccess: (data) => {
      console.log("Güncelleme başarılı:", data);
      toast({
        title: "Oda güncellendi",
        description: "Oda bilgileri başarıyla güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms', roomId] });
      navigate("/admin/rooms");
    },
    onError: (error: Error) => {
      console.error("Güncelleme hatası:", error);
      toast({
        title: "Hata",
        description: `Oda güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Form submit handler
  const onSubmit = (formData: RoomFormValues) => {
    // Form doğrulama kontrolleri
    if (!formData.hotelId) {
      toast({
        title: "Validasyon Hatası",
        description: "Lütfen bir otel seçin",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.name) {
      toast({
        title: "Validasyon Hatası",
        description: "Lütfen oda adını girin",
        variant: "destructive",
      });
      return;
    }
    
    // Takvim bazlı fiyatlandırma yoksa uyarı göster
    if (dailyPrices.length === 0 && weekdayPrices.length === 0) {
      toast({
        title: "Fiyatlandırma Uyarısı",
        description: "Takvim bazlı fiyatlandırma yapmadınız. Bu odaya ait rezervasyon yapılabilmesi için fiyat belirtmelisiniz.",
        variant: "warning",
      });
      // Devam edelim ama uyaralım
    }

    // Resim URL'ini kontrol edelim
    if (!formData.imageUrl) {
      toast({
        title: "Uyarı",
        description: "Resim yüklenmedi, mevcut resim kullanılacak",
      });
    }
    
    // Artık hep takvim bazlı fiyatlandırma kullanılacak, temel fiyat 0 olacak
    let numericPrice = 0; // Fiyat her zaman 0 olacak
    
    // Diğer alanların sayi olduğundan emin olalım 
    const capacity = typeof formData.capacity === 'string' ? parseInt(formData.capacity) : formData.capacity;
    
    // Tüm resimleri hazırla
    const imagesData = images.map(img => ({
      url: img.url,
      filename: img.filename,
      isMain: img.isMain
    }));
    
    // Ana resmi form verilerine ayarla
    const mainImage = images.find(img => img.isMain);
    if (mainImage) {
      formData.imageUrl = mainImage.url;
    }
    
    // Tüm verileri birleştir
    const updatedData = {
      ...formData,
      price: numericPrice,
      capacity: capacity,
      dailyPrices: JSON.stringify(dailyPrices),
      weekdayPrices: JSON.stringify(weekdayPrices),
      images: JSON.stringify(imagesData) // Çoklu resim verilerini ekle
    };
    
    console.log("Oda güncelleme verileri:", updatedData);
    updateRoomMutation.mutate(updatedData);
  };

  // Handle single date price
  const handleAddDailyPrice = () => {
    if (!selectedDate || selectedDatePrice <= 0) return;
    
    // Check if this date already exists in the array
    const existingIndex = dailyPrices.findIndex(p => 
      p.date.toDateString() === selectedDate.toDateString()
    );
    
    if (existingIndex >= 0) {
      // Update existing price
      const updatedPrices = [...dailyPrices];
      updatedPrices[existingIndex] = { date: selectedDate, price: selectedDatePrice };
      setDailyPrices(updatedPrices);
    } else {
      // Add new price
      setDailyPrices([...dailyPrices, { date: selectedDate, price: selectedDatePrice }]);
    }
    
    toast({
      title: "Fiyat eklendi",
      description: `${selectedDate.toLocaleDateString('tr-TR')} tarihi için fiyat: ${selectedDatePrice} ₺`,
    });
    
    // Close the popover
    setOpenSingleDatePicker(false);
  };
  
  // Handle range date price
  const handleAddRangePrice = () => {
    if (!dateRange.startDate || !dateRange.endDate || rangePriceValue <= 0) return;
    
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    const newPrices: Array<{date: Date, price: number}> = [];
    
    // Loop through all days in the range
    const currentDate = new Date(start);
    while (currentDate <= end) {
      newPrices.push({
        date: new Date(currentDate),
        price: rangePriceValue
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Merge with existing prices, replacing any dates that already exist
    const updatedPrices = [...dailyPrices];
    
    newPrices.forEach(newPrice => {
      const existingIndex = updatedPrices.findIndex(p => 
        p.date.toDateString() === newPrice.date.toDateString()
      );
      
      if (existingIndex >= 0) {
        updatedPrices[existingIndex] = newPrice;
      } else {
        updatedPrices.push(newPrice);
      }
    });
    
    setDailyPrices(updatedPrices);
    
    toast({
      title: "Fiyatlar eklendi",
      description: `${start.toLocaleDateString('tr-TR')} - ${end.toLocaleDateString('tr-TR')} tarihleri için fiyat: ${rangePriceValue} ₺`,
    });
    
    // Close the popover
    setOpenRangeDatePicker(false);
  };
  
  // Handle weekday price
  const handleAddWeekdayPrice = () => {
    if (selectedWeekdayPrice <= 0) return;
    
    // Check if this weekday already exists
    const existingIndex = weekdayPrices.findIndex(p => p.dayIndex === selectedWeekday);
    
    if (existingIndex >= 0) {
      // Update existing weekday price
      const updatedPrices = [...weekdayPrices];
      updatedPrices[existingIndex] = { dayIndex: selectedWeekday, price: selectedWeekdayPrice };
      setWeekdayPrices(updatedPrices);
    } else {
      // Add new weekday price
      setWeekdayPrices([...weekdayPrices, { dayIndex: selectedWeekday, price: selectedWeekdayPrice }]);
    }
    
    toast({
      title: "Gün fiyatı eklendi",
      description: `${weekdays.find(w => w.index === selectedWeekday)?.name} günleri için fiyat: ${selectedWeekdayPrice} ₺`,
    });
  };
  
  // Handle calendar date highlighting
  const isDayHighlighted = (date: Date) => {
    return dailyPrices.some(p => p.date.toDateString() === date.toDateString());
  };
  
  // Get price for a specific date
  const getPriceForDate = (date: Date) => {
    const priceObj = dailyPrices.find(p => p.date.toDateString() === date.toDateString());
    return priceObj ? priceObj.price : null;
  };
  
  // Delete price for a specific date
  const handleDeleteDailyPrice = (dateToDelete: Date) => {
    setDailyPrices(dailyPrices.filter(p => p.date.toDateString() !== dateToDelete.toDateString()));
    toast({
      title: "Fiyat silindi",
      description: `${dateToDelete.toLocaleDateString('tr-TR')} tarihi için fiyat kaldırıldı.`,
    });
  };
  
  // Delete price for a specific weekday
  const handleDeleteWeekdayPrice = (dayIndex: number) => {
    setWeekdayPrices(weekdayPrices.filter(p => p.dayIndex !== dayIndex));
    toast({
      title: "Gün fiyatı silindi",
      description: `${weekdays.find(w => w.index === dayIndex)?.name} günü için fiyat kaldırıldı.`,
    });
  };

  // If room not found
  if (!isLoading && !room) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <div className="bg-gradient-to-r from-[#2094f3] to-[#38b6ff] text-white shadow-md">
          <div className="flex items-center px-4 h-14">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white" 
              onClick={() => navigate("/admin/rooms")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="flex-1 text-center font-semibold text-lg">Oda Bulunamadı</h1>
          </div>
        </div>
        <div className="p-4 flex flex-col items-center justify-center h-[80vh]">
          <p className="text-center text-neutral-500 mb-4">
            Düzenlemek istediğiniz oda bulunamadı.
          </p>
          <Button onClick={() => navigate("/admin/rooms")}>
            Oda Listesine Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="sticky top-0 z-10">
        <div className="bg-gradient-to-r from-[#2094f3] to-[#38b6ff] text-white shadow-md">
          <div className="flex items-center px-4 h-14">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white" 
              onClick={() => navigate("/admin/rooms")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="flex-1 text-center font-semibold text-lg">Odayı Düzenle</h1>
          </div>
        </div>
      </div>

      <div className="p-4 pb-32">
        {isLoading ? (
          <div className="flex justify-center items-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="details" className="w-full" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger value="details">Detaylar</TabsTrigger>
                  <TabsTrigger value="features">Özellikler</TabsTrigger>
                  <TabsTrigger value="pricing">Fiyatlandırma</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
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
                            <SelectTrigger className="h-12 bg-white/5">
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
                          <Input className="h-12 bg-white/5" {...field} />
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
                            defaultValue={field.value.toString()}
                            value={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger className="h-12 bg-white/5">
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
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 bg-white/5">
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
                        <div className="space-y-3">
                          <FormControl>
                            <Input className="h-12 bg-white/5" {...field} />
                          </FormControl>
                          
                          <div className="grid grid-cols-1 gap-2">
                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 h-32 cursor-pointer hover:bg-gray-50 transition-colors dark:hover:bg-gray-800/30">
                              <div className="flex flex-col items-center justify-center gap-1">
                                <Upload className="h-6 w-6 text-gray-400" />
                                <span className="text-sm text-gray-500">Resim Yüklemek İçin Tıklayın</span>
                              </div>
                              <input 
                                type="file" 
                                accept="image/*" 
                                multiple
                                className="hidden" 
                                onChange={async (e) => {
                                  const files = e.target.files;
                                  if (!files || files.length === 0) return;
                                  
                                  // Resim yüklenirken butonun devre dışı kalmaması için state'i güncelleyelim
                                  setIsUploading(true);
                                  
                                  console.log("Dosyalar yükleniyor:", {
                                    fileCount: files.length,
                                    fileTypes: Array.from(files).map(f => f.type).join(', ')
                                  });
                                  
                                  // Tek dosya yükleme endpoint'ini kullan, bu daha güvenilir
                                  // Ardından manuel olarak her dosyayı işle
                                  const uploadedImages: Array<{url: string, filename: string, isMain: boolean}> = [];
                                  
                                  for (let i = 0; i < files.length; i++) {
                                    // Her dosya için yeni bir form verisi oluştur
                                    const singleFileForm = new FormData();
                                    singleFileForm.append('image', files[i]);
                                    
                                    try {
                                      // Tek dosya yükleme endpoint'ini kullan
                                      const response = await fetch('/api/upload', {
                                        method: 'POST',
                                        body: singleFileForm,
                                        credentials: 'include'
                                      });
                                      
                                      if (!response.ok) {
                                        console.error(`${i+1}. dosya yüklenemedi:`, await response.text());
                                        continue;
                                      }
                                      
                                      const result = await response.json();
                                      console.log(`${i+1}. dosya başarıyla yüklendi:`, result);
                                      
                                      // Yeni yüklenen resmi ekle
                                      if (result && result.file && result.file.url) {
                                        uploadedImages.push({
                                          url: result.file.url,
                                          filename: result.file.filename,
                                          isMain: false // Yeni eklenen resimler ana resim olarak işaretlenmez
                                        });
                                      }
                                    } catch (fileError) {
                                      console.error(`${i+1}. dosya yüklenirken hata:`, fileError);
                                      // Bir dosya yüklenemese bile diğerlerine devam et
                                    }
                                  }
                                  
                                  if (uploadedImages.length > 0) {
                                    // İlk kez resim yükleniyorsa, ilk resmi ana resim yap
                                    if (images.length === 0 && uploadedImages.length > 0) {
                                      uploadedImages[0].isMain = true;
                                      // Ana resmi form değerine ayarla
                                      field.onChange(uploadedImages[0].url);
                                      form.setValue('imageUrl', uploadedImages[0].url);
                                    }
                                    
                                    // Başarıyla yüklenen tüm resimleri ekle
                                    setImages(prev => [...prev, ...uploadedImages]);
                                    
                                    toast({
                                      title: "Resimler yüklendi",
                                      description: `${uploadedImages.length} resim başarıyla yüklendi`,
                                    });
                                  } else {
                                    toast({
                                      title: "Hata",
                                      description: "Hiçbir resim yüklenemedi",
                                      variant: "destructive"
                                    });
                                  }
                                  
                                  setIsUploading(false);
                                }}  
                              />
                            </label>
                          </div>
                          
                          {/* Tüm yüklenen resimleri göster */}
                          {images.length > 0 && (
                            <div className="mt-4 space-y-4">
                              <div className="font-medium">Yüklenen Resimler ({images.length})</div>
                              <div className="grid grid-cols-2 gap-2">
                                {images.map((image, idx) => (
                                  <div 
                                    key={idx} 
                                    className={`relative rounded-lg overflow-hidden border-2 ${image.isMain ? 'border-blue-500' : 'border-gray-300'}`}
                                  >
                                    <img 
                                      src={image.url} 
                                      alt={`Oda görseli ${idx + 1}`} 
                                      className="w-full h-32 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                      {!image.isMain && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-8 w-8 p-0 bg-white/30 backdrop-blur-sm border-white text-white hover:text-white hover:bg-white/50"
                                          onClick={() => {
                                            // Ana resim olarak işaretle
                                            const updatedImages = images.map((img, i) => ({
                                              ...img,
                                              isMain: i === idx
                                            }));
                                            setImages(updatedImages);
                                            // Form değerini güncelle
                                            field.onChange(image.url);
                                            form.setValue('imageUrl', image.url);
                                            
                                            toast({
                                              title: "Ana resim güncellendi",
                                              description: "Seçilen resim ana resim olarak ayarlandı"
                                            });
                                          }}
                                        >
                                          <Star className="h-4 w-4" />
                                        </Button>
                                      )}
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0 bg-white/30 backdrop-blur-sm border-white text-white hover:text-white hover:bg-red-500/50"
                                        onClick={() => {
                                          // Resmi sil
                                          const wasMain = image.isMain;
                                          const updatedImages = images.filter((_, i) => i !== idx);
                                          
                                          // Eğer ana resim silindiyse ve başka resimler varsa, ilk resmi ana resim yap
                                          if (wasMain && updatedImages.length > 0) {
                                            updatedImages[0].isMain = true;
                                            field.onChange(updatedImages[0].url);
                                            form.setValue('imageUrl', updatedImages[0].url);
                                          } else if (updatedImages.length === 0) {
                                            // Tüm resimler silindi
                                            field.onChange('');
                                            form.setValue('imageUrl', '');
                                          }
                                          
                                          setImages(updatedImages);
                                          
                                          toast({
                                            title: "Resim silindi",
                                            description: "Seçilen resim silindi"
                                          });
                                        }}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    {image.isMain && (
                                      <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                        Ana
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
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
                            className="bg-white/5"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="features" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="features"
                    render={() => (
                      <FormItem>
                        <FormLabel>Oda Özellikleri</FormLabel>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          {availableFeatures.map((feature) => (
                            <FormField
                              key={feature.id}
                              control={form.control}
                              name="features"
                              render={({ field }) => (
                                <FormItem
                                  key={feature.id}
                                  className="flex flex-row items-center space-x-3 space-y-0 bg-white/5 p-4 rounded-lg"
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
                                  <FormLabel className="cursor-pointer">
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
                </TabsContent>
                
                <TabsContent value="pricing" className="space-y-6">
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <Button
                      type="button"
                      variant={calendarMode === 'single' ? 'default' : 'outline'}
                      onClick={() => setCalendarMode('single')}
                      className="h-12"
                    >
                      <CalendarDays className="h-4 w-4 mr-2" />
                      Tek Gün
                    </Button>
                    <Button
                      type="button"
                      variant={calendarMode === 'range' ? 'default' : 'outline'}
                      onClick={() => setCalendarMode('range')}
                      className="h-12"
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Tarih Aralığı
                    </Button>
                    <Button
                      type="button"
                      variant={calendarMode === 'weekday' ? 'default' : 'outline'}
                      onClick={() => setCalendarMode('weekday')}
                      className="h-12"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Hafta Günü
                    </Button>
                  </div>
                  
                  {calendarMode === 'single' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <FormLabel>Tarih Seçin</FormLabel>
                          <Popover open={openSingleDatePicker} onOpenChange={setOpenSingleDatePicker}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal h-12 mt-1"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? (
                                  selectedDate.toLocaleDateString('tr-TR')
                                ) : (
                                  <span className="text-neutral-500">Tarih seçin</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date: Date | undefined) => {
                                  if (date) {
                                    setSelectedDate(date);
                                    // Takvim seçiminden sonra popover'ı otomatik kapat
                                    setOpenSingleDatePicker(false);
                                  }
                                }}
                                modifiers={{
                                  highlighted: isDayHighlighted
                                }}
                                modifiersStyles={{
                                  highlighted: {
                                    backgroundColor: "rgba(32, 148, 243, 0.1)",
                                    borderRadius: "0"
                                  }
                                }}
                                components={{
                                  DayContent: (props: {date: Date}) => {
                                    const price = getPriceForDate(props.date);
                                    return (
                                      <div className="relative h-9 w-9 flex items-center justify-center">
                                        <div>{props.date.getDate()}</div>
                                        {price && (
                                          <div className="absolute bottom-0 left-0 right-0 text-[9px] leading-tight text-primary font-medium">
                                            {price} ₺
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <FormLabel>Fiyat (₺)</FormLabel>
                          <Input 
                            type="number"
                            min="0"
                            value={selectedDatePrice} 
                            onChange={(e) => setSelectedDatePrice(Number(e.target.value))}
                            className="h-12 mt-1"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        type="button" 
                        onClick={handleAddDailyPrice}
                        disabled={!selectedDate || selectedDatePrice <= 0}
                        className="h-12 w-full"
                      >
                        Fiyat Ekle
                      </Button>
                      
                      {dailyPrices.length > 0 && (
                        <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg space-y-2 mt-4">
                          <h3 className="font-medium text-sm mb-3">Özel Günlük Fiyatlar</h3>
                          {dailyPrices.map((priceObj, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-700 last:border-0">
                              <div>
                                <span className="text-sm font-medium">{priceObj.date.toLocaleDateString('tr-TR')}</span>
                                <span className="block text-xs text-neutral-500">{priceObj.price} ₺</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteDailyPrice(priceObj.date)}
                                className="h-8 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                              >
                                Sil
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {calendarMode === 'range' && (
                    <div className="space-y-4">
                      <div>
                        <FormLabel>Tarih Aralığı</FormLabel>
                        <Popover open={openRangeDatePicker} onOpenChange={setOpenRangeDatePicker}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal h-12 mt-1"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRange.startDate && dateRange.endDate ? (
                                `${dateRange.startDate.toLocaleDateString('tr-TR')} - ${dateRange.endDate.toLocaleDateString('tr-TR')}`
                              ) : (
                                <span className="text-neutral-500">Tarih aralığı seçin</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="range"
                              selected={{
                                from: dateRange.startDate,
                                to: dateRange.endDate
                              }}
                              onSelect={(range: {from: Date, to: Date} | undefined) => {
                                if (range?.from && range?.to) {
                                  setDateRange({
                                    startDate: range.from,
                                    endDate: range.to
                                  });
                                  // Tarih aralığı seçildikten sonra popover'ı otomatik olarak kapat
                                  setOpenRangeDatePicker(false);
                                }
                              }}
                              modifiers={{
                                highlighted: isDayHighlighted
                              }}
                              modifiersStyles={{
                                highlighted: {
                                  backgroundColor: "rgba(32, 148, 243, 0.1)",
                                  borderRadius: "0"
                                }
                              }}
                              components={{
                                DayContent: (props: {date: Date}) => {
                                  const price = getPriceForDate(props.date);
                                  return (
                                    <div className="relative h-9 w-9 flex items-center justify-center">
                                      <div>{props.date.getDate()}</div>
                                      {price && (
                                        <div className="absolute bottom-0 left-0 right-0 text-[9px] leading-tight text-primary font-medium">
                                          {price} ₺
                                        </div>
                                      )}
                                    </div>
                                  );
                                }
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div>
                        <FormLabel>Günlük Fiyat (₺)</FormLabel>
                        <Input 
                          type="number" 
                          min="0"
                          value={rangePriceValue} 
                          onChange={(e) => setRangePriceValue(Number(e.target.value))}
                          className="h-12 mt-1"
                        />
                      </div>
                      
                      <Button 
                        type="button" 
                        onClick={handleAddRangePrice} 
                        disabled={!dateRange.startDate || !dateRange.endDate || rangePriceValue <= 0}
                        className="h-12 w-full"
                      >
                        Fiyat Ekle
                      </Button>
                    </div>
                  )}
                  
                  {calendarMode === 'weekday' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <FormLabel>Gün</FormLabel>
                          <Select 
                            value={selectedWeekday.toString()} 
                            onValueChange={(value) => setSelectedWeekday(Number(value))}
                          >
                            <SelectTrigger className="h-12 mt-1">
                              <SelectValue placeholder="Gün seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {weekdays.map((day) => (
                                <SelectItem key={day.index} value={day.index.toString()}>
                                  {day.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <FormLabel>Fiyat (₺)</FormLabel>
                          <Input 
                            type="number" 
                            min="0"
                            value={selectedWeekdayPrice} 
                            onChange={(e) => setSelectedWeekdayPrice(Number(e.target.value))}
                            className="h-12 mt-1"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        type="button" 
                        onClick={handleAddWeekdayPrice} 
                        disabled={selectedWeekdayPrice <= 0}
                        className="w-full h-12"
                      >
                        Hafta Günü Fiyatı Ekle
                      </Button>
                      
                      {weekdayPrices.length > 0 && (
                        <div className="p-4 bg-white dark:bg-neutral-800 rounded-lg space-y-2">
                          <h3 className="font-medium text-sm mb-3">Hafta Günleri Fiyatları</h3>
                          {weekdayPrices.map((priceObj, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-700 last:border-0">
                              <div>
                                <span className="text-sm font-medium">
                                  {weekdays.find(w => w.index === priceObj.dayIndex)?.name}
                                </span>
                                <span className="block text-xs text-neutral-500">{priceObj.price} ₺</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteWeekdayPrice(priceObj.dayIndex)}
                                className="h-8 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                              >
                                Sil
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] flex gap-2 z-20">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 h-12"
                  onClick={() => navigate("/admin/rooms")}
                >
                  İptal
                </Button>
                <Button 
                  type="button"
                  className="flex-1 h-12 bg-gradient-to-r from-[#2094f3] to-[#38b6ff] hover:from-[#1084e3] hover:to-[#28a6ef]"
                  disabled={updateRoomMutation.isPending || isUploading}
                  onClick={() => {
                    console.log("Kaydet butonuna tıklandı");
                    console.log("Form verileri:", form.getValues());
                    form.handleSubmit(onSubmit)();
                  }}
                >
                  {updateRoomMutation.isPending ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-5 w-5" />
                  )}
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
