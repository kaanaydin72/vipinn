import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import * as z from "zod";
import { insertHotelSchema } from "@shared/schema";
import AdminLayout from "@/components/admin/admin-layout";
import { useTranslation } from "react-i18next";
import FileUpload from "@/components/ui/file-upload";
import { CityDistrictSelect } from "@/components/forms/city-district-select";
import { turkishCities } from "@/data/turkish-cities";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Hotel, 
  BedDouble, 
  ImageIcon, 
  Info,
  Home, 
  Save,
  Loader2
} from "lucide-react";

// Define available amenities
const availableAmenities = [
  { id: "havuz", label: "Havuz" },
  { id: "spa", label: "Spa" },
  { id: "restoran", label: "Restoran" },
  { id: "bar", label: "Bar" },
  { id: "fitness", label: "Fitness" },
  { id: "plaj", label: "Plaj" },
  { id: "bahce", label: "Bahçe" },
  { id: "wifi", label: "Ücretsiz Wi-Fi" },
  { id: "otopark", label: "Otopark" },
  { id: "klima", label: "Klima" },
  { id: "banyo", label: "Özel Banyo" },
  { id: "tv", label: "Televizyon" },
];

// Extended schema for form validation
const hotelWizardSchema = insertHotelSchema.extend({
  stars: z.coerce.number().min(1).max(5),
  city: z.string().min(1, { message: "Şehir seçmelisiniz" }),
  district: z.string().min(1, { message: "İlçe seçmelisiniz" }),
  phone: z.string().min(10, { message: "Telefon numarası en az 10 karakter olmalıdır" }).optional(),
  // Room types fields - not saved with hotel but used to prefill room creation steps
  roomTypes: z.array(z.object({
    name: z.string().min(2, { message: "Oda tipi adı en az 2 karakter olmalıdır" }),
    description: z.string().min(10, { message: "Oda tipi açıklaması en az 10 karakter olmalıdır" }),
    // basePrice kaldırıldı - artık tamamen takvim bazlı fiyatlandırma kullanılıyor
    capacity: z.coerce.number().min(1, { message: "Kapasite en az 1 olmalıdır" }),
    amenities: z.array(z.string()),
    images: z.array(z.string())
  })).optional(),
});

type HotelWizardValues = z.infer<typeof hotelWizardSchema>;

// Room type schema for the room creation step
const roomTypeSchema = z.object({
  name: z.string().min(2, { message: "Oda tipi adı en az 2 karakter olmalıdır" }),
  description: z.string().min(10, { message: "Oda tipi açıklaması en az 10 karakter olmalıdır" }),
  // basePrice kaldırıldı - artık tamamen takvim bazlı fiyatlandırma kullanılıyor
  capacity: z.coerce.number().min(1, { message: "Kapasite en az 1 olmalıdır" }),
  amenities: z.array(z.string()).min(1, { message: "En az bir özellik seçmelisiniz" }),
  images: z.array(z.string())
});

type RoomTypeValues = z.infer<typeof roomTypeSchema>;

// Room amenities for the room step
const roomAmenities = [
  { id: "tv", label: "Televizyon" },
  { id: "klima", label: "Klima" },
  { id: "minibar", label: "Minibar" },
  { id: "safebox", label: "Kasa" },
  { id: "balkon", label: "Balkon" },
  { id: "wifi", label: "Ücretsiz Wi-Fi" },
  { id: "deniz-manzara", label: "Deniz Manzarası" },
  { id: "kahvalti", label: "Kahvaltı Dahil" },
];

export default function AddHotelWizard() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [roomTypes, setRoomTypes] = useState<RoomTypeValues[]>([]);
  // basePrice kaldırıldı - artık tamamen takvim bazlı fiyatlandırma kullanılıyor
  const [currentRoomType, setCurrentRoomType] = useState<RoomTypeValues>({
    name: "",
    description: "",
    capacity: 1,
    amenities: [],
    images: []
  });
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [editingRoomIndex, setEditingRoomIndex] = useState(-1);

  // Steps for the wizard - simplified (removed redundant options available in Room Management)
  const steps = [
    { 
      id: "hotel-basics", 
      title: "Temel Bilgiler", 
      description: "Otelin adı, konumu ve yıldız sayısı",
      icon: <Home className="h-5 w-5" />
    },
    { 
      id: "hotel-details", 
      title: "Detaylar", 
      description: "Otel hakkında detaylı bilgiler",
      icon: <Info className="h-5 w-5" />
    },
    { 
      id: "review", 
      title: "İnceleme", 
      description: "Girilen bilgileri gözden geçirin",
      icon: <Check className="h-5 w-5" />
    },
  ];

  const hotelForm = useForm<HotelWizardValues>({
    resolver: zodResolver(hotelWizardSchema),
    defaultValues: {
      name: "",
      location: "",
      city: "",
      district: "",
      description: "",
      imageUrl: "", // Bu alanı tamamen kaldırmıyoruz çünkü schema'da hala var
      stars: 5,
      address: "",
      phone: "", // Otel telefon numarası
      amenities: [], // Bu alanı tamamen kaldırmıyoruz çünkü schema'da hala var
    },
  });

  const roomTypeForm = useForm<RoomTypeValues>({
    resolver: zodResolver(roomTypeSchema),
    defaultValues: currentRoomType
  });

  // Update progress bar
  const updateProgress = (step: number) => {
    const progressPercentage = Math.round(((step + 1) / steps.length) * 100);
    setProgress(progressPercentage);
  };

  // Navigate to next step - updated for simplified steps
  const nextStep = async () => {
    const fieldsToValidate: Record<number, (keyof HotelWizardValues)[]> = {
      0: ["name", "city", "district", "stars"],
      1: ["description", "address", "phone"], // Telefon alanı eklendi
      2: [], // Review step doesn't need validation
    };

    // Validate fields for current step
    const fields = fieldsToValidate[currentStep] || [];
    const isStepValid = await hotelForm.trigger(fields as any);
    
    if (!isStepValid) return;

    // Move to next step
    setCurrentStep(currentStep + 1);
    updateProgress(currentStep + 1);
  };

  // Go back to previous step - simplified version
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      updateProgress(currentStep - 1);
    }
  };

  // Mutation for creating a hotel
  const createHotelMutation = useMutation({
    mutationFn: async (data: HotelWizardValues) => {
      console.log("Creating hotel with data:", data);
      
      // Yönetici oturumunun aktif olduğunu kontrol et
      try {
        // Doğrudan apiRequest kullanarak mevcut kullanıcıyı al
        const userCheckResponse = await apiRequest("GET", "/api/user");
        const userData = await userCheckResponse.json();
        console.log("Current user:", userData);
        
        if (!userData.isAdmin) {
          throw new Error("Bu işlemi yapmak için yönetici haklarına sahip olmanız gerekiyor.");
        }
        
        const { roomTypes, ...hotelData } = data;
        
        const res = await apiRequest("POST", "/api/hotels", hotelData);
        console.log("Hotel API response:", res);
        
        return await res.json();
      } catch (error) {
        console.error("Hotel creation error:", error);
        throw error;
      }
    },
    onSuccess: async (hotel) => {
      toast({
        title: "Otel eklendi",
        description: "Yeni otel başarıyla eklendi.",
      });
      
      // If we have room types, create them
      if (roomTypes.length > 0) {
        for (const room of roomTypes) {
          try {
            await apiRequest("POST", "/api/rooms", {
              ...room,
              hotelId: hotel.id
            });
          } catch (error) {
            toast({
              title: "Oda eklenirken hata",
              description: `"${room.name}" odası eklenirken bir hata oluştu.`,
              variant: "destructive",
            });
          }
        }
        
        toast({
          title: "Odalar eklendi",
          description: `${roomTypes.length} oda tipi başarıyla eklendi.`,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/hotels'] });
      navigate("/admin/hotels");
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Otel eklenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // On submit handler
  const onSubmit = async (data: HotelWizardValues) => {
    // Add room types to data
    const finalData = {
      ...data,
      roomTypes
    };
    
    createHotelMutation.mutate(finalData);
  };

  // Add or edit a room type
  const startEditingRoom = (index: number = -1) => {
    if (index >= 0) {
      // Edit existing room
      const room = roomTypes[index];
      roomTypeForm.reset(room);
      setEditingRoomIndex(index);
    } else {
      // Add new room
      // basePrice kaldırıldı - artık tamamen takvim bazlı fiyatlandırma kullanılıyor
      roomTypeForm.reset({
        name: "",
        description: "",
        capacity: 1,
        amenities: [],
        images: []
      });
    }
    
    setIsEditingRoom(true);
  };

  // Delete a room type
  const deleteRoomType = (index: number) => {
    const updatedRoomTypes = roomTypes.filter((_, i) => i !== index);
    setRoomTypes(updatedRoomTypes);
  };

  return (
    <AdminLayout activeMenuItem="hotels">
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 dark:text-white">
            Yeni Otel Ekle
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Adım {currentStep + 1} / {steps.length}: {steps[currentStep].title}
          </p>
          <Progress value={progress} className="mt-4 h-2" />
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Steps sidebar */}
          <div className="col-span-12 md:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Adımlar</CardTitle>
                <CardDescription>
                  Tüm adımları tamamlayın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 p-0">
                <ul className="space-y-1">
                  {steps.map((step, index) => (
                    <li key={step.id}>
                      <button
                        className={`w-full flex items-center p-3 transition-colors ${
                          index === currentStep
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium"
                            : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        }`}
                        onClick={() => {
                          if (index < currentStep) {
                            setCurrentStep(index);
                            updateProgress(index);
                          }
                        }}
                        disabled={index > currentStep}
                      >
                        <div className={`p-1.5 rounded-full mr-3 ${
                          index === currentStep 
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400" 
                            : index < currentStep 
                              ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400" 
                              : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                        }`}>
                          {index < currentStep ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            step.icon
                          )}
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium">{step.title}</div>
                          <div className="text-xs opacity-70">{step.description}</div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="col-span-12 md:col-span-9">
            <Card>
              <CardHeader>
                <CardTitle>{steps[currentStep].title}</CardTitle>
                <CardDescription>
                  {steps[currentStep].description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Step 1: Basic Info */}
                {currentStep === 0 && (
                  <Form {...hotelForm}>
                    <div className="space-y-4">
                      <FormField
                        control={hotelForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Otel Adı*</FormLabel>
                            <FormControl>
                              <Input placeholder="Elite Hotel İstanbul" {...field} />
                            </FormControl>
                            <FormDescription>
                              Otelinizin tam adını girin
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 gap-4">
                        {/* City and District Selector Component */}
                        <div className="space-y-4">
                          <FormField
                            control={hotelForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <div>
                                  <CityDistrictSelect
                                    selectedCity={field.value}
                                    selectedDistrict={hotelForm.getValues().district}
                                    onCityChange={(city) => {
                                      field.onChange(city);
                                      // When city changes, also update the location field for backwards compatibility
                                      const cityObj = turkishCities.find((c) => c.id === city);
                                      if (cityObj) {
                                        hotelForm.setValue("location", cityObj.name);
                                      }
                                    }}
                                    onDistrictChange={(district) => {
                                      hotelForm.setValue("district", district);
                                    }}
                                  />
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={hotelForm.control}
                          name="stars"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Yıldız Sayısı*</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                defaultValue={field.value.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Yıldız seçin" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="3">3 Yıldız</SelectItem>
                                  <SelectItem value="4">4 Yıldız</SelectItem>
                                  <SelectItem value="5">5 Yıldız</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </Form>
                )}

                {/* Step 2: Details - Combined with Amenities and Media */}
                {currentStep === 1 && (
                  <Form {...hotelForm}>
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <FormField
                          control={hotelForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Adres*</FormLabel>
                              <FormControl>
                                <Input placeholder="Beşiktaş, İstanbul" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={hotelForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefon Numarası*</FormLabel>
                              <FormControl>
                                <Input placeholder="0212 123 45 67" {...field} />
                              </FormControl>
                              <FormDescription>
                                Otelin iletişim numarasını girin
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={hotelForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Açıklama*</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Otel hakkında detaylı bilgi..."
                                  rows={6}
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Oteliniz hakkında misafirlerin bilmesi gereken önemli bilgileri girin
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </Form>
                )}



                {/* Step 4: Room Types */}
                {currentStep === 3 && (
                  <div>
                    {isEditingRoom ? (
                      <Form {...roomTypeForm}>
                        <div className="space-y-4">
                          <FormField
                            control={roomTypeForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Oda Tipi Adı*</FormLabel>
                                <FormControl>
                                  <Input placeholder="Standart Oda" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={roomTypeForm.control}
                              name="capacity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Kapasite*</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="1" 
                                      placeholder="2"
                                      {...field}
                                      value={field.value?.toString() || "1"}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Odada kalabilecek maksimum kişi sayısı
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Temel fiyat kaldırıldı - tamamen takvim bazlı fiyatlandırma */}
                          </div>

                          <FormField
                            control={roomTypeForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Açıklama*</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Oda özellikleri ve açıklaması..."
                                    rows={4}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={roomTypeForm.control}
                            name="amenities"
                            render={() => (
                              <FormItem>
                                <div className="mb-4">
                                  <FormLabel>Oda Özellikleri*</FormLabel>
                                  <FormDescription>
                                    Bu oda tipinin sunduğu imkanları seçin
                                  </FormDescription>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {roomAmenities.map((amenity) => (
                                    <FormField
                                      key={amenity.id}
                                      control={roomTypeForm.control}
                                      name="amenities"
                                      render={({ field }) => {
                                        return (
                                          <FormItem
                                            key={amenity.id}
                                            className="flex items-start space-x-3 space-y-0 border rounded-md p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                          >
                                            <FormControl>
                                              <Checkbox
                                                checked={field.value?.includes(amenity.label)}
                                                onCheckedChange={(checked) => {
                                                  return checked
                                                    ? field.onChange([...field.value, amenity.label])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                          (value) => value !== amenity.label
                                                        )
                                                      );
                                                }}
                                              />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                              {amenity.label}
                                            </FormLabel>
                                          </FormItem>
                                        );
                                      }}
                                    />
                                  ))}
                                </div>
                                <FormMessage className="mt-4" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={roomTypeForm.control}
                            name="images"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Oda Görseli (Opsiyonel)</FormLabel>
                                <FormControl>
                                  <div className="space-y-2">
                                    <FileUpload 
                                      onFileUploaded={(url) => {
                                        const images = url ? [url] : [];
                                        field.onChange(images);
                                      }}
                                      existingImageUrl={field.value?.[0] || ""}
                                      className="max-w-full"
                                    />
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                      veya URL ile ekleyin
                                    </p>
                                    <Input 
                                      placeholder="https://example.com/room1.jpg" 
                                      value={field.value?.[0] || ""}
                                      onChange={(e) => {
                                        const images = e.target.value ? [e.target.value] : [];
                                        field.onChange(images);
                                      }}
                                      className="mt-2"
                                    />
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  Oda görseli yükleyin veya bir URL girin
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex justify-end space-x-2 mt-6">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setIsEditingRoom(false);
                                setEditingRoomIndex(-1);
                              }}
                            >
                              İptal
                            </Button>
                            <Button 
                              type="button" 
                              onClick={nextStep}
                            >
                              {editingRoomIndex >= 0 ? "Güncelle" : "Ekle"}
                            </Button>
                          </div>
                        </div>
                      </Form>
                    ) : (
                      <div>
                        <div className="mb-4">
                          <Button onClick={() => startEditingRoom()}>
                            Yeni Oda Tipi Ekle
                          </Button>
                        </div>

                        {roomTypes.length === 0 ? (
                          <div className="text-center py-8 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                            <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                              Henüz oda tipi eklenmemiş. Otelin oda tiplerini eklemek için "Yeni Oda Tipi Ekle" butonuna tıklayın.
                            </p>
                            <p className="text-neutral-400 dark:text-neutral-600 text-sm">
                              (Oda tipleri eklemeden de devam edebilirsiniz. Daha sonra Oda Yönetimi sayfasından ekleyebilirsiniz.)
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {roomTypes.map((room, index) => (
                              <Card key={index}>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-base">{room.name}</CardTitle>
                                  <CardDescription>
                                    Kapasite: {room.capacity} kişi - Takvim bazlı fiyatlandırma
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="pb-2">
                                  <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-2">
                                    {room.description}
                                  </p>
                                  
                                  <div className="flex flex-wrap gap-1">
                                    {room.amenities?.slice(0, 3).map((amenity, idx) => (
                                      <span 
                                        key={idx}
                                        className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded"
                                      >
                                        {amenity}
                                      </span>
                                    ))}
                                    {room.amenities && room.amenities.length > 3 && (
                                      <span className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                                        +{room.amenities.length - 3} daha
                                      </span>
                                    )}
                                  </div>
                                </CardContent>
                                <CardFooter>
                                  <div className="flex space-x-2 w-full">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => startEditingRoom(index)}
                                    >
                                      Düzenle
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => deleteRoomType(index)}
                                    >
                                      Sil
                                    </Button>
                                  </div>
                                </CardFooter>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 5: Media */}
                {currentStep === 4 && (
                  <Form {...hotelForm}>
                    <div className="space-y-6">
                      <FormField
                        control={hotelForm.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Otel Ana Görseli*</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <FileUpload 
                                  onFileUploaded={(url) => field.onChange(url)}
                                  existingImageUrl={field.value}
                                  className="max-w-full"
                                />
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                  veya URL ile ekleyin
                                </p>
                                <Input 
                                  placeholder="https://example.com/hotel.jpg" 
                                  value={field.value} 
                                  onChange={field.onChange} 
                                  className="mt-2"
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Otel ana görselini yükleyin veya bir URL girin
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </Form>
                )}

                {/* Step 6: Review */}
                {currentStep === 5 && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Temel Bilgiler</h3>
                      <div className="space-y-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                              Otel Adı
                            </div>
                            <div className="mt-1">{hotelForm.getValues().name}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                              Şehir
                            </div>
                            <div className="mt-1">{hotelForm.getValues().location}</div>
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                            Adres
                          </div>
                          <div className="mt-1">{hotelForm.getValues().address}</div>
                        </div>

                        <div>
                          <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                            Yıldız Sayısı
                          </div>
                          <div className="mt-1 flex">
                            {hotelForm.getValues().stars} Yıldız
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Açıklama</h3>
                      <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
                        <p>{hotelForm.getValues().description}</p>
                      </div>
                    </div>



                    {roomTypes.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-2">Oda Tipleri ({roomTypes.length})</h3>
                        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
                          <ul className="space-y-3">
                            {roomTypes.map((room, index) => (
                              <li key={index} className="pb-3 border-b last:border-b-0 last:pb-0">
                                <div className="font-medium">{room.name}</div>
                                <div className="text-sm text-neutral-500 dark:text-neutral-400">
                                  Kapasite: {room.capacity} kişi - Takvim bazlı fiyatlandırma
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}


                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t p-4">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Geri
                </Button>

                {currentStep === steps.length - 1 ? (
                  <Button 
                    onClick={hotelForm.handleSubmit(onSubmit)}
                    disabled={createHotelMutation.isPending}
                  >
                    {createHotelMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        İşleniyor...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Oteli Kaydet
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={nextStep}>
                    İleri
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}