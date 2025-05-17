import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Hotel, insertHotelSchema } from "@shared/schema";
import AdminLayout from "@/components/admin/admin-layout";
import { Link } from "wouter";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Pencil, Trash2, Star, MapPin } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
];

// Extended schema for form validation
const hotelFormSchema = insertHotelSchema.extend({
  amenities: z.array(z.string()).min(1, {
    message: "En az bir özellik seçmelisiniz",
  }),
  stars: z.coerce.number().min(1).max(5),
});

type HotelFormValues = z.infer<typeof hotelFormSchema>;

export default function HotelManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [hotelToDelete, setHotelToDelete] = useState<Hotel | null>(null);

  // Fetch hotels
  const { data: hotels = [], isLoading } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
  });

  // Form for adding a new hotel
  const addForm = useForm<HotelFormValues>({
    resolver: zodResolver(hotelFormSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
      imageUrl: "",
      stars: 5,
      address: "",
      amenities: [],
      rating: 0,
    },
  });

  // Form for editing a hotel
  const editForm = useForm<HotelFormValues>({
    resolver: zodResolver(hotelFormSchema),
    defaultValues: {
      name: "",
      location: "",
      description: "",
      imageUrl: "",
      stars: 5,
      address: "",
      amenities: [],
      rating: 0,
    },
  });

  // Create hotel mutation
  const createHotelMutation = useMutation({
    mutationFn: async (data: HotelFormValues) => {
      const res = await apiRequest("POST", "/api/hotels", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Otel eklendi",
        description: "Yeni otel başarıyla eklendi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/hotels'] });
      setTimeout(() => {
        // Dialog'u biraz gecikmeli kapat, bu sayede invalidateQueries tamamlansın
        setIsAddDialogOpen(false);
        addForm.reset();
      }, 300);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Otel eklenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update hotel mutation
  const updateHotelMutation = useMutation({
    mutationFn: async (data: HotelFormValues & { id: number }) => {
      const { id, ...hotelData } = data;
      const res = await apiRequest("PUT", `/api/hotels/${id}`, hotelData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Otel güncellendi",
        description: "Otel bilgileri başarıyla güncellendi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/hotels'] });
      setTimeout(() => {
        setIsEditDialogOpen(false);
        setSelectedHotel(null);
      }, 300);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Otel güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete hotel mutation
  const deleteHotelMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/hotels/${id}`);
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Otel silindi",
        description: "Otel başarıyla silindi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/hotels'] });
      setTimeout(() => {
        setDeleteDialogOpen(false);
        setHotelToDelete(null);
      }, 300);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Otel silinirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleAddSubmit = (data: HotelFormValues) => {
    createHotelMutation.mutate(data);
  };

  const handleEditSubmit = (data: HotelFormValues) => {
    if (selectedHotel) {
      updateHotelMutation.mutate({ ...data, id: selectedHotel.id });
    }
  };

  const handleDelete = () => {
    if (hotelToDelete) {
      deleteHotelMutation.mutate(hotelToDelete.id);
    }
  };

  const openEditDialog = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    editForm.reset({
      name: hotel.name,
      location: hotel.location,
      description: hotel.description,
      imageUrl: hotel.imageUrl,
      stars: hotel.stars,
      address: hotel.address,
      amenities: hotel.amenities,
      rating: hotel.rating || 0,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (hotel: Hotel) => {
    setHotelToDelete(hotel);
    setDeleteDialogOpen(true);
  };

  return (
    <AdminLayout activeMenuItem="hotels">
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 dark:text-white">Otel Yönetimi</h1>
          <Link href="/admin/hotels/add">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Otel Ekle
            </Button>
          </Link>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Yeni Otel Ekle</DialogTitle>
                <DialogDescription>
                  Yeni bir otel eklemek için aşağıdaki formu doldurun.
                </DialogDescription>
              </DialogHeader>
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(handleAddSubmit)} className="space-y-4">
                  <FormField
                    control={addForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Otel Adı</FormLabel>
                        <FormControl>
                          <Input placeholder="Elite Hotel İstanbul" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={addForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Şehir</FormLabel>
                          <FormControl>
                            <Input placeholder="İstanbul" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="stars"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Yıldız Sayısı</FormLabel>
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
                  
                  <FormField
                    control={addForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adres</FormLabel>
                        <FormControl>
                          <Input placeholder="Beşiktaş, İstanbul" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addForm.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Görsel URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/image.jpg" {...field} />
                        </FormControl>
                        <FormDescription>
                          Oteli temsil eden bir görselin URL'ini girin
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Açıklama</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Otel hakkında detaylı bilgi..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addForm.control}
                    name="amenities"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>Özellikler</FormLabel>
                          <FormDescription>
                            Otelin sunduğu özellikleri seçin
                          </FormDescription>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {availableAmenities.map((amenity) => (
                            <FormField
                              key={amenity.id}
                              control={addForm.control}
                              name="amenities"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={amenity.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addForm.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Puan (Opsiyonel)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="5"
                            step="0.1"
                            placeholder="4.5"
                            {...field}
                            value={field.value === undefined || field.value === null ? "" : field.value}
                            onChange={(e) => {
                              const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Otelin mevcut puanı (0-5 arası)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={createHotelMutation.isPending || !addForm.formState.isValid}
                    >
                      {createHotelMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Oteli Ekle
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Oteller</CardTitle>
            <CardDescription>
              Sistem genelindeki tüm otelleri yönetin
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hotels.length === 0 ? (
                  <div className="col-span-full text-center py-8 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                    <p className="text-neutral-500 dark:text-neutral-400 mb-4">Henüz otel bulunmamaktadır.</p>
                    <Link href="/admin/hotels/add">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Yeni Otel Ekle
                      </Button>
                    </Link>
                  </div>
                ) : (
                  hotels.map((hotel) => (
                    <Card key={hotel.id} className="overflow-hidden border hover:shadow-md transition-shadow duration-200">
                      {/* Otel görsel alanı */}
                      <div className="aspect-video w-full relative bg-neutral-100 dark:bg-neutral-800">
                        {hotel.imageUrl ? (
                          <img
                            src={hotel.imageUrl}
                            alt={hotel.name}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-neutral-600">
                            Görsel Yok
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-white dark:bg-neutral-800 rounded-full px-2 py-1 flex items-center shadow-sm">
                          <span className="text-sm font-medium mr-1">
                            {hotel.rating ? hotel.rating.toFixed(1) : 'N/A'}
                          </span>
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        </div>
                      </div>
                      
                      {/* Otel bilgi alanı */}
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{hotel.name}</CardTitle>
                        </div>
                        <CardDescription className="flex items-center mt-1">
                          <MapPin className="h-3.5 w-3.5 mr-1" />
                          {hotel.location}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="p-4 pt-0">
                        <div className="flex items-center mb-2">
                          {Array.from({ length: hotel.stars }).map((_, i) => (
                            <Star
                              key={i}
                              className="h-4 w-4 fill-yellow-500 text-yellow-500"
                            />
                          ))}
                          {Array.from({ length: 5 - hotel.stars }).map((_, i) => (
                            <Star
                              key={i}
                              className="h-4 w-4 text-neutral-300 dark:text-neutral-700"
                            />
                          ))}
                        </div>
                        
                        <div className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-4">
                          {hotel.description || "Açıklama bulunmuyor."}
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-2">
                          {hotel.amenities?.slice(0, 3).map((amenity, index) => (
                            <span 
                              key={index}
                              className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded"
                            >
                              {amenity}
                            </span>
                          ))}
                          {hotel.amenities && hotel.amenities.length > 3 && (
                            <span className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                              +{hotel.amenities.length - 3} daha
                            </span>
                          )}
                        </div>
                      </CardContent>
                      
                      <CardFooter className="p-3 flex justify-between gap-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(hotel)}
                          className="flex-1"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Düzenle
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog(hotel)}
                          className="flex-1"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Sil
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Hotel Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Oteli Düzenle</DialogTitle>
              <DialogDescription>
                Otel bilgilerini güncellemek için formu kullanın.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Otel Adı</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Şehir</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="stars"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yıldız Sayısı</FormLabel>
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
                
                <FormField
                  control={editForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adres</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Görsel URL</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Oteli temsil eden bir görselin URL'ini girin
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
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
                  control={editForm.control}
                  name="amenities"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Özellikler</FormLabel>
                        <FormDescription>
                          Otelin sunduğu özellikleri seçin
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {availableAmenities.map((amenity) => (
                          <FormField
                            key={amenity.id}
                            control={editForm.control}
                            name="amenities"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={amenity.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Puan (Opsiyonel)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          {...field}
                          value={field.value === undefined || field.value === null ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Otelin mevcut puanı (0-5 arası)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={updateHotelMutation.isPending || !editForm.formState.isValid}
                  >
                    {updateHotelMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Değişiklikleri Kaydet
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Oteli Sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu işlem {hotelToDelete?.name} otelini silecektir. Bu işlem geri alınamaz.
                Devam etmek istediğinize emin misiniz?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteHotelMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Evet, Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}