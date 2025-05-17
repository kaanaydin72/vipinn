import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Hotel, Room } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Hotel as HotelIcon,
  MapPin,
  Star,
  Info,
  BedDouble,
  Users,
  CheckCircle,
  X,
  Wifi,
  Coffee,
  Tv,
  Utensils,
  Loader2,
  Save,
  MoveLeft,
  BadgePlus
} from "lucide-react";

export default function HotelDetailMobile() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tab, setTab] = useState("rooms");
  // Odalar için state değişkenleri
  const [showRoomSheet, setShowRoomSheet] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Otel düzenleme formu için state
  const [editForm, setEditForm] = useState<Partial<Hotel>>({
    name: "",
    location: "",
    address: "",
    description: "",
    imageUrl: "",
    stars: 0,
    amenities: []
  });

  // Otel detayını getir
  const { 
    data: hotel,
    isLoading: isHotelLoading,
    isError: isHotelError 
  } = useQuery<Hotel>({
    queryKey: [`/api/hotels/${id}`],
  });

  // Otel verisi geldiğinde form bilgilerini doldur
  useEffect(() => {
    if (hotel) {
      setEditForm({
        name: hotel.name,
        location: hotel.location,
        address: hotel.address,
        description: hotel.description,
        imageUrl: hotel.imageUrl,
        stars: hotel.stars,
        amenities: hotel.amenities || []
      });
    }
  }, [hotel]);

  // Odaları getir
  const { 
    data: rooms = [],
    isLoading: isRoomsLoading,
    isError: isRoomsError 
  } = useQuery<Room[]>({
    queryKey: [`/api/rooms/hotel/${id}`],
    enabled: !!id
  });

  // Eski düzenleme fonksiyonlarını ve state'lerini kaldırdım

  // Oda silme mutasyonu
  const deleteRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      await apiRequest("DELETE", `/api/rooms/${roomId}`);
      return roomId;
    },
    onSuccess: () => {
      toast({
        title: "Oda silindi",
        description: "Oda başarıyla silindi.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/rooms/hotel/${id}`] });
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Oda silinirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Tüm düzenleme fonksiyonlarını kaldırdım

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Hata durumlarını kontrol et
  if (isHotelError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
        <X className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-xl font-semibold mb-2">Otel bulunamadı</h1>
        <p className="text-neutral-500 mb-6 text-center">
          Aradığınız otel bulunamadı veya bir hata oluştu.
        </p>
        <Button asChild variant="outline">
          <Link href="/admin/hotels">
            <MoveLeft className="h-4 w-4 mr-2" />
            Otellere Dön
          </Link>
        </Button>
      </div>
    );
  }

  if (isHotelLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#2094f3] mb-4" />
          <p className="text-neutral-500">Otel bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* iOS/Android tarzı başlık */}
      <div className="sticky top-0 z-10">
        <div className="bg-gradient-to-r from-[#2094f3] to-[#38b6ff] text-white shadow-md">
          <div className="flex items-center px-4 h-14">
            <Button variant="ghost" size="icon" className="text-white" asChild>
              <Link href="/admin/hotels">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="flex-1 text-center font-semibold text-lg">{hotel?.name || "Otel Detayı"}</h1>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white"
              asChild
            >
              <Link href={`/admin/hotels/edit/${id}`}>
                <Pencil className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-0 pb-20">
        {/* Otel Bilgisi Alanı */}
        <div className="mb-4">
          <div>
            <div className="relative w-full h-48 overflow-hidden">
              <img 
                src={hotel?.imageUrl || "https://via.placeholder.com/800x400?text=Otel+Görseli"} 
                alt={hotel?.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <div className="flex items-center">
                  {Array.from({ length: hotel?.stars || 0 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-1">{hotel?.name}</h2>
              <div className="flex items-center text-neutral-600 mb-3">
                <MapPin className="h-4 w-4 mr-1" />
                <span className="text-sm">{hotel?.location}</span>
              </div>
              <p className="text-neutral-700 mb-4">{hotel?.description}</p>
              
              <div className="mb-4">
                <h3 className="font-medium mb-2">Adres</h3>
                <p className="text-sm text-neutral-600">{hotel?.address}</p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Özellikler</h3>
                <div className="flex flex-wrap gap-2">
                  {hotel?.amenities?.map((amenity: string, index: number) => (
                    <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4">
            <Tabs defaultValue="rooms" className="w-full" value={tab} onValueChange={setTab}>
              <TabsList className="grid grid-cols-2 w-full mb-4 rounded-lg overflow-hidden border">
                <TabsTrigger value="rooms" className="text-sm py-3">Odalar</TabsTrigger>
                <TabsTrigger value="info" className="text-sm py-3">Otel Bilgileri</TabsTrigger>
              </TabsList>
              
              <TabsContent value="rooms" className="mt-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Otel Odaları</h3>
                  <Button
                    size="sm"
                    className="h-9 bg-[#2094f3]"
                    onClick={() => navigate(`/admin/rooms/add?hotelId=${id}`)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Oda Ekle
                  </Button>
                </div>
                
                {isRoomsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                  </div>
                ) : isRoomsError ? (
                  <div className="text-center py-8">
                    <p className="text-neutral-500">Odalar yüklenirken bir hata oluştu.</p>
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="text-center py-8 bg-neutral-50 rounded-lg border border-dashed border-neutral-300">
                    <BedDouble className="h-12 w-12 mx-auto text-neutral-300 mb-2" />
                    <p className="text-neutral-600 mb-2">Henüz oda eklenmemiş</p>
                    <Button
                      size="sm"
                      className="bg-[#2094f3]"
                      onClick={() => navigate(`/admin/rooms/add?hotelId=${id}`)}
                    >
                      <BadgePlus className="h-4 w-4 mr-1" />
                      İlk Odayı Ekle
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-350px)]">
                    <motion.div 
                      className="space-y-4 pb-10"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {rooms.map((room) => (
                        <motion.div 
                          key={room.id}
                          variants={itemVariants}
                        >
                          <Card className="overflow-hidden border-[#2094f3]/10 bg-white">
                            <CardContent className="p-0">
                              <div className="relative">
                                <img 
                                  src={room.imageUrl || "https://via.placeholder.com/400x200?text=Oda+Görseli"} 
                                  alt={room.name} 
                                  className="w-full h-32 object-cover"
                                />
                                <div className="absolute top-2 right-2 flex space-x-1">
                                  <Button 
                                    size="icon" 
                                    variant="secondary" 
                                    className="h-8 w-8 bg-white/70 backdrop-blur-sm hover:bg-white"
                                    asChild
                                  >
                                    <Link href={`/admin/rooms/edit/${room.id}`}>
                                      <Pencil className="h-4 w-4 text-neutral-700" />
                                    </Link>
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="secondary" 
                                    className="h-8 w-8 bg-white/70 backdrop-blur-sm hover:bg-white"
                                    onClick={() => {
                                      setRoomToDelete(room);
                                      setDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="p-3">
                                <h4 className="font-medium text-base mb-1">{room.name}</h4>
                                <div className="flex items-center space-x-3 text-xs text-neutral-500 mb-2">
                                  <div className="flex items-center">
                                    <Users className="h-3.5 w-3.5 mr-1" />
                                    {room.capacity} Kişilik
                                  </div>
                                  <div className="flex items-center">
                                    <BedDouble className="h-3.5 w-3.5 mr-1" />
                                    {room.type}
                                  </div>
                                </div>
                                
                                <p className="text-sm text-neutral-600 line-clamp-2 mb-2">
                                  {room.description}
                                </p>
                                
                                <div className="flex justify-between items-center mt-2">
                                  <div className="flex items-baseline">
                                    <span className="text-lg font-bold text-[#2094f3]">
                                      {room.dailyPrices && JSON.parse(room.dailyPrices || '[]').length > 0
                                        ? JSON.parse(room.dailyPrices)[0].price.toLocaleString('tr-TR')
                                        : "Fiyat bilgisi için takvimi kontrol ediniz"} 
                                      {JSON.parse(room.dailyPrices || '[]').length > 0 ? "₺" : ""}
                                    </span>
                                    {JSON.parse(room.dailyPrices || '[]').length > 0 && (
                                      <span className="text-xs text-neutral-500 ml-1">/ gece</span>
                                    )}
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-[#2094f3]"
                                    asChild
                                  >
                                    <Link href={`/admin/rooms/${room.id}`}>
                                      Görüntüle
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  </ScrollArea>
                )}
              </TabsContent>
              
              <TabsContent value="info" className="mt-0">
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium flex items-center mb-2">
                        <HotelIcon className="h-4 w-4 mr-2 text-[#2094f3]" />
                        Otel Bilgileri
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex">
                          <span className="font-medium w-24">Ad:</span>
                          <span>{hotel?.name}</span>
                        </div>
                        <div className="flex">
                          <span className="font-medium w-24">Konum:</span>
                          <span>{hotel?.location}</span>
                        </div>
                        <div className="flex">
                          <span className="font-medium w-24">Yıldız:</span>
                          <div className="flex">
                            {Array.from({ length: hotel?.stars || 0 }).map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium flex items-center mb-2">
                        <MapPin className="h-4 w-4 mr-2 text-[#2094f3]" />
                        Adres Bilgileri
                      </h3>
                      <p className="text-sm">{hotel?.address}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium flex items-center mb-2">
                        <Info className="h-4 w-4 mr-2 text-[#2094f3]" />
                        Otel Detayları
                      </h3>
                      <p className="text-sm">{hotel?.description}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-medium flex items-center mb-2">
                        <CheckCircle className="h-4 w-4 mr-2 text-[#2094f3]" />
                        Sunulan Özellikler
                      </h3>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {hotel?.amenities?.map((amenity: string, index: number) => (
                          <div key={index} className="flex items-center text-sm">
                            {amenity === "Wi-Fi" ? (
                              <Wifi className="h-4 w-4 mr-2 text-[#2094f3]" />
                            ) : amenity === "Kahvaltı" ? (
                              <Coffee className="h-4 w-4 mr-2 text-[#2094f3]" />
                            ) : amenity === "TV" ? (
                              <Tv className="h-4 w-4 mr-2 text-[#2094f3]" />
                            ) : amenity === "Restoran" ? (
                              <Utensils className="h-4 w-4 mr-2 text-[#2094f3]" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2 text-[#2094f3]" />
                            )}
                            {amenity}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
      </div>
      
      {/* Oda Silme Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Odayı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">{roomToDelete?.name}</span> odasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve
              bu odaya ait tüm rezervasyonlar etkilenebilir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0">İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => roomToDelete && deleteRoomMutation.mutate(roomToDelete.id)}
              disabled={deleteRoomMutation.isPending}
            >
              {deleteRoomMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Odayı Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}