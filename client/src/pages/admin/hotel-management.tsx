import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Hotel, insertHotelSchema } from "@shared/schema";
import AdminSidebar from "@/components/admin/admin-sidebar";
import ApiDocumentation from "@/components/admin/api-documentation";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      setIsAddDialogOpen(false);
      addForm.reset();
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
      setIsEditDialogOpen(false);
      setSelectedHotel(null);
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
      setDeleteDialogOpen(false);
      setHotelToDelete(null);
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex">
      <AdminSidebar />

      <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
        {/* Mobile top padding to avoid sidebar button overlap */}
        <div className="h-16 md:hidden"></div>
        
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold font-heading text-neutral-800 dark:text-white">Otel Yönetimi</h1>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Otel Ekle
                </Button>
              </DialogTrigger>
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
                        disabled={createHotelMutation.isPending}
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
                Tüm otellerin listesi ve yönetimi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Desktop tablo görünümü */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Otel Adı</TableHead>
                          <TableHead>Lokasyon</TableHead>
                          <TableHead>Yıldız</TableHead>
                          <TableHead>Puan</TableHead>
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {hotels.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              Henüz otel bulunmamaktadır. Yeni bir otel ekleyin.
                            </TableCell>
                          </TableRow>
                        ) : (
                          hotels.map((hotel) => (
                            <TableRow key={hotel.id}>
                              <TableCell className="font-medium">{hotel.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1 text-neutral-500" />
                                  {hotel.location}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex">
                                  {Array.from({ length: hotel.stars }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className="h-4 w-4 fill-secondary text-secondary"
                                    />
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>{hotel.rating ? hotel.rating.toFixed(1) : 'N/A'}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditDialog(hotel)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => openDeleteDialog(hotel)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Mobil kart görünümü */}
                  <div className="grid grid-cols-1 gap-4 md:hidden">
                    {hotels.length === 0 ? (
                      <div className="text-center py-8 text-neutral-500">
                        Henüz otel bulunmamaktadır. Yeni bir otel ekleyin.
                      </div>
                    ) : (
                      hotels.map((hotel) => (
                        <Card key={hotel.id} className="overflow-hidden border">
                          <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{hotel.name}</CardTitle>
                              <CardDescription className="flex items-center mt-1">
                                <MapPin className="h-3.5 w-3.5 mr-1" />
                                {hotel.location}
                              </CardDescription>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="flex mb-1">
                                {Array.from({ length: hotel.stars }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className="h-3.5 w-3.5 fill-secondary text-secondary"
                                  />
                                ))}
                              </div>
                              <span className="text-sm font-medium">
                                {hotel.rating ? hotel.rating.toFixed(1) : 'N/A'} Puan
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
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
                          <CardFooter className="p-2 flex justify-end gap-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(hotel)}
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" />
                              Düzenle
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openDeleteDialog(hotel)}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Sil
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    )}
                  </div>
                </>
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
                          <Textarea rows={4} {...field} />
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
                        <FormLabel>Puan</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="5"
                            step="0.1"
                            {...field}
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
                      disabled={updateHotelMutation.isPending}
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
                <AlertDialogTitle>Oteli Silmek İstediğinize Emin Misiniz?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu işlem geri alınamaz. Bu, otele ait tüm odaları ve verileri silecektir.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteHotelMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Evet, Sil
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* API Dokümantasyonu Bölümü */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-neutral-800 dark:text-white">Otel Yönetimi API</h2>
            <ApiDocumentation />
          </div>
        </div>
      </main>
    </div>
  );
}
