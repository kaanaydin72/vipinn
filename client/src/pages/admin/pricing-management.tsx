import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Room, Hotel } from "@shared/schema";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DateRange } from "react-day-picker";
import { addDays, format, isWithinInterval, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, RefreshCw, Plus, Pencil, Trash2, Tag, PlusCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Fiyat kuralı tipleri
type PriceRule = {
  id: number;
  roomId: number;
  startDate: string;
  endDate: string;
  priceModifier: number;
  ruleName: string;
  ruleType: 'seasonal' | 'weekend' | 'holiday' | 'special';
  isActive: boolean;
};

// Form şemaları
const priceRuleSchema = z.object({
  roomId: z.coerce.number({
    required_error: "Lütfen bir oda seçin",
  }),
  startDate: z.date({
    required_error: "Başlangıç tarihi seçmelisiniz",
  }),
  endDate: z.date({
    required_error: "Bitiş tarihi seçmelisiniz",
  }),
  priceModifier: z.coerce.number()
    .min(-99, "Fiyat değişimi en az -99% olabilir")
    .max(300, "Fiyat değişimi en fazla 300% olabilir"),
  ruleName: z.string().min(2, "Kural adı en az 2 karakter olmalıdır"),
  ruleType: z.enum(['seasonal', 'weekend', 'holiday', 'special'], {
    required_error: "Lütfen bir kural tipi seçin",
  }),
  isActive: z.boolean().default(true),
});

// Form tipi
type PriceRuleFormValues = z.infer<typeof priceRuleSchema>;

// Holiday tarihleri (örnek)
const holidays2025 = [
  { name: "Yılbaşı", date: new Date(2025, 0, 1) },
  { name: "Ulusal Egemenlik ve Çocuk Bayramı", date: new Date(2025, 3, 23) },
  { name: "Emek ve Dayanışma Günü", date: new Date(2025, 4, 1) },
  { name: "Atatürk'ü Anma, Gençlik ve Spor Bayramı", date: new Date(2025, 4, 19) },
  { name: "Ramazan Bayramı", date: new Date(2025, 3, 3) },
  { name: "Kurban Bayramı", date: new Date(2025, 6, 10) },
  { name: "Zafer Bayramı", date: new Date(2025, 7, 30) },
  { name: "Cumhuriyet Bayramı", date: new Date(2025, 9, 29) },
];

// Ana bileşen
export default function PricingManagement() {
  const { toast } = useToast();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPriceRule, setSelectedPriceRule] = useState<PriceRule | null>(null);
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });

  // Veri çekme işlemleri
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
  });

  const { data: hotels = [], isLoading: isLoadingHotels } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
  });

  const { data: priceRules = [], isLoading: isLoadingPriceRules } = useQuery<PriceRule[]>({
    queryKey: ['/api/price-rules'],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/price-rules");
        return await res.json();
      } catch (err) {
        // API henüz oluşturulmadıysa örnek veri göster
        console.error("Price rules API not available yet:", err);
        return [];
      }
    }
  });

  const isLoading = isLoadingRooms || isLoadingHotels || isLoadingPriceRules;

  // Form tanımlamaları
  const addForm = useForm<PriceRuleFormValues>({
    resolver: zodResolver(priceRuleSchema),
    defaultValues: {
      roomId: 0,
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
      priceModifier: 10,
      ruleName: "",
      ruleType: "seasonal",
      isActive: true,
    },
  });

  const editForm = useForm<PriceRuleFormValues>({
    resolver: zodResolver(priceRuleSchema),
    defaultValues: {
      roomId: 0,
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
      priceModifier: 10,
      ruleName: "",
      ruleType: "seasonal",
      isActive: true,
    },
  });

  // API istekleri
  const createPriceRuleMutation = useMutation({
    mutationFn: async (data: PriceRuleFormValues) => {
      const formattedData = {
        ...data,
        startDate: format(data.startDate, "yyyy-MM-dd"),
        endDate: format(data.endDate, "yyyy-MM-dd"),
      };
      const res = await apiRequest("POST", "/api/price-rules", formattedData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Fiyat kuralı eklendi",
        description: "Yeni fiyat kuralı başarıyla eklendi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/price-rules'] });
      setIsAddDialogOpen(false);
      addForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Fiyat kuralı eklenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updatePriceRuleMutation = useMutation({
    mutationFn: async (data: PriceRuleFormValues & { id: number }) => {
      const { id, ...ruleData } = data;
      const formattedData = {
        ...ruleData,
        startDate: format(ruleData.startDate, "yyyy-MM-dd"),
        endDate: format(ruleData.endDate, "yyyy-MM-dd"),
      };
      const res = await apiRequest("PUT", `/api/price-rules/${id}`, formattedData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Fiyat kuralı güncellendi",
        description: "Fiyat kuralı başarıyla güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/price-rules'] });
      setIsEditDialogOpen(false);
      setSelectedPriceRule(null);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Fiyat kuralı güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deletePriceRuleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/price-rules/${id}`);
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Fiyat kuralı silindi",
        description: "Fiyat kuralı başarıyla silindi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/price-rules'] });
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Fiyat kuralı silinirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form işlemleri
  const handleAddSubmit = (data: PriceRuleFormValues) => {
    createPriceRuleMutation.mutate(data);
  };

  const handleEditSubmit = (data: PriceRuleFormValues) => {
    if (selectedPriceRule) {
      updatePriceRuleMutation.mutate({ ...data, id: selectedPriceRule.id });
    }
  };

  const handleDelete = (id: number) => {
    deletePriceRuleMutation.mutate(id);
  };

  const openEditDialog = (rule: PriceRule) => {
    setSelectedPriceRule(rule);
    editForm.reset({
      roomId: rule.roomId,
      startDate: new Date(rule.startDate),
      endDate: new Date(rule.endDate),
      priceModifier: rule.priceModifier,
      ruleName: rule.ruleName,
      ruleType: rule.ruleType,
      isActive: rule.isActive,
    });
    setIsEditDialogOpen(true);
  };

  // Helper fonksiyonlar
  const getHotelNameById = (roomId: number) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return "Bilinmeyen";
    
    const hotel = hotels.find(h => h.id === room.hotelId);
    return hotel ? hotel.name : "Bilinmeyen Otel";
  };

  const getRoomNameById = (roomId: number) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : "Bilinmeyen Oda";
  };

  const getRuleTypeName = (type: string) => {
    switch (type) {
      case 'seasonal': return 'Sezonluk';
      case 'weekend': return 'Hafta Sonu';
      case 'holiday': return 'Tatil';
      case 'special': return 'Özel';
      default: return type;
    }
  };

  // Takvimde günlere fiyat etiketi ekleme
  const getPriceDayClassName = (day: Date) => {
    const rule = priceRules.find(r => {
      const startDate = new Date(r.startDate);
      const endDate = new Date(r.endDate);
      return isWithinInterval(day, { start: startDate, end: endDate }) && r.isActive;
    });

    if (rule) {
      if (rule.priceModifier > 0) {
        return 'bg-red-100 text-red-800';
      } else if (rule.priceModifier < 0) {
        return 'bg-green-100 text-green-800';
      }
    }

    // Tatil günlerini işaretle
    const isHoliday = holidays2025.some(holiday => isSameDay(holiday.date, day));
    if (isHoliday) {
      return 'bg-orange-100 text-orange-800';
    }

    return '';
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex">
      <AdminSidebar />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold font-heading text-neutral-800 dark:text-white">Fiyatlandırma Yönetimi</h1>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Fiyat Kuralı Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Yeni Fiyat Kuralı Ekle</DialogTitle>
                  <DialogDescription>
                    Belirli tarih aralığında oda fiyatını değiştirmek için bir kural oluşturun.
                  </DialogDescription>
                </DialogHeader>
                <Form {...addForm}>
                  <form onSubmit={addForm.handleSubmit(handleAddSubmit)} className="space-y-4">
                    <FormField
                      control={addForm.control}
                      name="roomId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Oda</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value ? field.value.toString() : undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Oda seçin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {rooms.map((room) => (
                                <SelectItem key={room.id} value={room.id.toString()}>
                                  {getHotelNameById(room.hotelId)} - {room.name}
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
                        control={addForm.control}
                        name="ruleName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kural Adı</FormLabel>
                            <FormControl>
                              <Input placeholder="Yaz Sezonu" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addForm.control}
                        name="ruleType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kural Tipi</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Kural tipi seçin" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="seasonal">Sezonluk</SelectItem>
                                <SelectItem value="weekend">Hafta Sonu</SelectItem>
                                <SelectItem value="holiday">Tatil</SelectItem>
                                <SelectItem value="special">Özel</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={addForm.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Başlangıç Tarihi</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: tr })
                                    ) : (
                                      <span>Tarih seçin</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => date && field.onChange(date)}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={addForm.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Bitiş Tarihi</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: tr })
                                    ) : (
                                      <span>Tarih seçin</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => date && field.onChange(date)}
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
                      control={addForm.control}
                      name="priceModifier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fiyat Değişimi (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="-99"
                              max="300"
                              placeholder="25"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Pozitif değer artış, negatif değer indirim anlamına gelir. Örn: 25 = %25 artış, -10 = %10 indirim
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="submit" disabled={createPriceRuleMutation.isPending}>
                        {createPriceRuleMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Ekle
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="rules" className="mb-8">
            <TabsList className="mb-4">
              <TabsTrigger value="rules">Fiyat Kuralları</TabsTrigger>
              <TabsTrigger value="calendar">Takvim Görünümü</TabsTrigger>
            </TabsList>
            <TabsContent value="rules">
              <Card>
                <CardHeader>
                  <CardTitle>Fiyat Kuralları</CardTitle>
                  <CardDescription>
                    Otellerin ve odaların belirli tarih aralığındaki fiyat kurallarını yönetin.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : priceRules.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-lg text-muted-foreground">Henüz fiyat kuralı eklenmemiş.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setIsAddDialogOpen(true)}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        İlk Fiyat Kuralını Ekle
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kural Adı</TableHead>
                          <TableHead>Otel - Oda</TableHead>
                          <TableHead>Tarih Aralığı</TableHead>
                          <TableHead>Fiyat Değişimi</TableHead>
                          <TableHead>Tip</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {priceRules.map((rule) => (
                          <TableRow key={rule.id}>
                            <TableCell className="font-medium">{rule.ruleName}</TableCell>
                            <TableCell>{getHotelNameById(rule.roomId)} - {getRoomNameById(rule.roomId)}</TableCell>
                            <TableCell>
                              {format(new Date(rule.startDate), "dd MMM yyyy", { locale: tr })} - {format(new Date(rule.endDate), "dd MMM yyyy", { locale: tr })}
                            </TableCell>
                            <TableCell>
                              <span className={rule.priceModifier >= 0 ? "text-red-600" : "text-green-600"}>
                                {rule.priceModifier >= 0 ? `+${rule.priceModifier}%` : `${rule.priceModifier}%`}
                              </span>
                            </TableCell>
                            <TableCell>{getRuleTypeName(rule.ruleType)}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${rule.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                                {rule.isActive ? "Aktif" : "Pasif"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => openEditDialog(rule)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDelete(rule.id)}
                                disabled={deletePriceRuleMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="calendar">
              <Card>
                <CardHeader>
                  <CardTitle>Takvim Görünümü</CardTitle>
                  <CardDescription>
                    Fiyat kurallarının uygulandığı günleri takvimde görüntüleyin.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-4">
                    <div>
                      <FormLabel>Oda Seçin</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          const room = rooms.find(r => r.id === parseInt(value));
                          setSelectedRoom(room || null);
                        }}
                        value={selectedRoom?.id.toString()}
                      >
                        <SelectTrigger className="w-full sm:w-[300px]">
                          <SelectValue placeholder="Oda seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms.map((room) => (
                            <SelectItem key={room.id} value={room.id.toString()}>
                              {getHotelNameById(room.hotelId)} - {room.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-100 rounded-full mr-1"></div>
                          <span className="text-xs">Fiyat Artışı</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-100 rounded-full mr-1"></div>
                          <span className="text-xs">İndirim</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-orange-100 rounded-full mr-1"></div>
                          <span className="text-xs">Resmi Tatil</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Calendar
                          mode="range"
                          selected={date}
                          onSelect={setDate}
                          className="rounded-md border"
                          numberOfMonths={1}
                          modifiers={{
                            priceDay: (day) => getPriceDayClassName(day) !== '',
                          }}
                          modifiersClassNames={{
                            priceDay: "price-day bg-opacity-30",
                          }}
                        />
                        <Calendar
                          mode="range"
                          selected={date}
                          onSelect={setDate}
                          className="rounded-md border"
                          numberOfMonths={1}
                          month={addDays(new Date(), 30)}
                          modifiers={{
                            priceDay: (day) => getPriceDayClassName(day) !== '',
                          }}
                          modifiersClassNames={{
                            priceDay: "price-day bg-opacity-30",
                          }}
                        />
                      </div>
                    </div>
                    
                    {selectedRoom && (
                      <Card className="mt-4">
                        <CardHeader className="py-4">
                          <CardTitle className="text-lg">Seçili Oda Fiyat Bilgisi</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span>Baz Fiyat:</span>
                              <span className="font-medium">{selectedRoom.price.toLocaleString()} TL / gece</span>
                            </div>
                            
                            {date?.from && (
                              <div className="flex justify-between items-center">
                                <span>Seçili Tarih Aralığı:</span>
                                <span className="font-medium">
                                  {format(date.from, "dd MMM yyyy", { locale: tr })}
                                  {date.to && ` - ${format(date.to, "dd MMM yyyy", { locale: tr })}`}
                                </span>
                              </div>
                            )}
                            
                            {/* Uygulanan kuralları göster */}
                            {date?.from && (
                              <div>
                                <h4 className="font-medium mb-2">Uygulanan Fiyat Kuralları:</h4>
                                {priceRules
                                  .filter(rule => 
                                    rule.roomId === selectedRoom.id && 
                                    rule.isActive &&
                                    date.from && 
                                    isWithinInterval(date.from, { 
                                      start: new Date(rule.startDate), 
                                      end: new Date(rule.endDate) 
                                    })
                                  )
                                  .map(rule => (
                                    <div key={rule.id} className="flex justify-between items-center text-sm py-1 border-b">
                                      <span>{rule.ruleName} ({getRuleTypeName(rule.ruleType)}):</span>
                                      <span className={rule.priceModifier >= 0 ? "text-red-600" : "text-green-600"}>
                                        {rule.priceModifier >= 0 ? `+${rule.priceModifier}%` : `${rule.priceModifier}%`}
                                      </span>
                                    </div>
                                  ))}
                                {priceRules.filter(rule => 
                                  rule.roomId === selectedRoom.id && 
                                  rule.isActive &&
                                  date.from && 
                                  isWithinInterval(date.from, { 
                                    start: new Date(rule.startDate), 
                                    end: new Date(rule.endDate) 
                                  })
                                ).length === 0 && (
                                  <div className="text-sm text-muted-foreground py-2">
                                    Seçili tarihte herhangi bir fiyat kuralı uygulanmıyor.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fiyat Kuralını Düzenle</DialogTitle>
            <DialogDescription>
              Fiyat kuralı bilgilerini güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="roomId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Oda</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Oda seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            {getHotelNameById(room.hotelId)} - {room.name}
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
                  control={editForm.control}
                  name="ruleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kural Adı</FormLabel>
                      <FormControl>
                        <Input placeholder="Yaz Sezonu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="ruleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kural Tipi</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kural tipi seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="seasonal">Sezonluk</SelectItem>
                          <SelectItem value="weekend">Hafta Sonu</SelectItem>
                          <SelectItem value="holiday">Tatil</SelectItem>
                          <SelectItem value="special">Özel</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Başlangıç Tarihi</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: tr })
                              ) : (
                                <span>Tarih seçin</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => date && field.onChange(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Bitiş Tarihi</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: tr })
                              ) : (
                                <span>Tarih seçin</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => date && field.onChange(date)}
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
                control={editForm.control}
                name="priceModifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiyat Değişimi (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="-99"
                        max="300"
                        placeholder="25"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Pozitif değer artış, negatif değer indirim anlamına gelir. Örn: 25 = %25 artış, -10 = %10 indirim
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium leading-none">
                          Aktif
                        </label>
                      </div>
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormDescription>
                        Bu kuralın aktif olup olmadığını belirler.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={updatePriceRuleMutation.isPending}>
                  {updatePriceRuleMutation.isPending && (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Güncelle
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}