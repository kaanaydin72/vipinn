import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Room, Hotel } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Plus, Pencil, Trash2, Building, Users, Home,
  Search, Filter, ArrowLeft, BedDouble, ChevronDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

export default function RoomManagementMobile() {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHotelId, setFilterHotelId] = useState<number | null>(null);

  // Fetch rooms and hotels
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
  });

  const { data: hotels = [], isLoading: isLoadingHotels } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
  });

  const isLoading = isLoadingRooms || isLoadingHotels;

  // Gruplandırma işlemi - odaları otellerine göre grupla
  const groupedRooms = rooms.reduce((acc, room) => {
    const hotelId = room.hotelId;
    if (!acc[hotelId]) {
      acc[hotelId] = [];
    }
    acc[hotelId].push(room);
    return acc;
  }, {} as Record<number, Room[]>);

  // Filtreleme işlemi
  const filteredHotelIds = Object.keys(groupedRooms)
    .map(Number)
    .filter(hotelId => {
      // Otel filtresi varsa sadece o oteli göster
      if (filterHotelId !== null) {
        return hotelId === filterHotelId;
      }
      
      // Arama filtresi varsa, otelin odalarından herhangi biri eşleşiyorsa oteli göster
      if (searchQuery) {
        return groupedRooms[hotelId].some(room => 
          room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          room.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          room.type.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Filtre yoksa tüm otelleri göster
      return true;
    });

  // Delete room mutation
  const deleteRoomMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/rooms/${id}`);
      return id;
    },
    onSuccess: () => {
      toast({
        title: "Oda silindi",
        description: "Oda başarıyla silindi.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Hata",
        description: `Oda silinirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (roomToDelete) {
      deleteRoomMutation.mutate(roomToDelete.id);
    }
  };

  const openDeleteDialog = (room: Room) => {
    setRoomToDelete(room);
    setDeleteDialogOpen(true);
  };

  const getHotelNameById = (hotelId: number) => {
    const hotel = hotels.find(h => h.id === hotelId);
    return hotel ? hotel.name : "Bilinmeyen Otel";
  };

  // Aynı tipteki odaları bir araya getir
  const groupRoomsByType = (rooms: Room[]) => {
    return rooms.reduce((acc, room) => {
      const type = room.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(room);
      return acc;
    }, {} as Record<string, Room[]>);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* iOS/Android style mobile header and content */}
      <div className="sticky top-0 z-10">
        <div className="bg-gradient-to-r from-[#2094f3] to-[#38b6ff] text-white shadow-md">
          <div className="flex items-center px-4 h-14">
            <Button variant="ghost" size="icon" className="text-white" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="flex-1 text-center font-semibold text-lg">Oda Yönetimi</h1>
            <Button variant="ghost" size="icon" className="text-white" asChild>
              <Link href="/admin/rooms/add">
                <Plus className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Arama ve Filtreleme */}
        <div className="bg-white dark:bg-neutral-800 shadow-sm px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Oda adı, tipi ara..."
                className="pl-8 h-10 bg-neutral-100 dark:bg-neutral-700 border-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500">
                <Search className="h-4 w-4" />
              </div>
            </div>
            <Select
              value={filterHotelId ? filterHotelId.toString() : "all"}
              onValueChange={(value) => 
                setFilterHotelId(value === "all" ? null : parseInt(value))
              }
            >
              <SelectTrigger className="w-[130px] h-10 bg-neutral-100 dark:bg-neutral-700 border-none">
                <SelectValue placeholder="Tüm Oteller" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Oteller</SelectItem>
                {hotels.map((hotel) => (
                  <SelectItem key={hotel.id} value={hotel.id.toString()}>
                    {hotel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="p-4 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredHotelIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-full mb-3">
              <BedDouble className="h-6 w-6 text-neutral-500" />
            </div>
            <p className="text-neutral-500 mx-4">
              {searchQuery || filterHotelId 
                ? "Aramanızla eşleşen sonuç bulunamadı."
                : "Henüz oda bulunmuyor."}
            </p>
            <div className="flex gap-2 mt-4">
              {(searchQuery || filterHotelId) && (
                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  setFilterHotelId(null);
                }}>
                  Filtreleri Temizle
                </Button>
              )}
              <Button 
                onClick={() => window.location.href = "/admin/rooms/add"}
              >
                <Plus className="h-4 w-4 mr-1" />
                Yeni Oda Ekle
              </Button>
            </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {filteredHotelIds.map(hotelId => {
              const hotelRooms = groupedRooms[hotelId];
              // Oda tipine göre grupla
              const roomsByType = groupRoomsByType(hotelRooms);
              
              return (
                <Card key={hotelId} className="overflow-hidden border-[#2094f3]/40">
                  <CardHeader className="py-3 px-4 bg-gradient-to-r from-[#2094f3]/10 to-transparent">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-[#2094f3]" />
                      <CardTitle className="text-base">{getHotelNameById(hotelId)}</CardTitle>
                    </div>
                    <CardDescription className="text-xs mt-1">
                      Toplam {hotelRooms.length} oda - {Object.keys(roomsByType).length} farklı oda tipi
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    <Accordion type="multiple" defaultValue={Object.keys(roomsByType)}>
                      {Object.entries(roomsByType).map(([type, rooms]) => (
                        <AccordionItem key={type} value={type} className="border-b last:border-b-0">
                          <AccordionTrigger className="py-2 px-4">
                            <div className="flex items-center text-left">
                              <BedDouble className="h-4 w-4 mr-2 text-neutral-500" />
                              <span>{type}</span>
                              <Badge variant="outline" className="ml-2">
                                {rooms.length}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="px-4 pb-3 space-y-3">
                              {rooms.map(room => (
                                <div key={room.id} className="border rounded-md overflow-hidden bg-white dark:bg-neutral-950">
                                  <div className="flex items-start">
                                    <div className="w-20 h-20 shrink-0">
                                      <img
                                        src={room.imageUrl || "https://via.placeholder.com/150x150?text=Oda"}
                                        alt={room.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="flex-1 p-3 min-w-0">
                                      <h3 className="font-medium text-sm">{room.name}</h3>
                                      <div className="flex items-center text-xs text-neutral-500 mt-1">
                                        <Users className="h-3 w-3 mr-1" />
                                        <span>{room.capacity} Kişilik</span>
                                      </div>
                                      <div className="flex flex-wrap justify-end mt-2 gap-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 px-2 text-xs text-[#2094f3] border-[#2094f3] hover:bg-[#2094f3]/10"
                                          onClick={() => window.location.href = `/admin/rooms/edit/${room.id}`}
                                        >
                                          <Pencil className="h-3 w-3 mr-1" />
                                          Düzenle
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-7 px-2 text-xs text-red-500 border-red-200 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                                          onClick={() => openDeleteDialog(room)}
                                        >
                                          <Trash2 className="h-3 w-3 mr-1" />
                                          Sil
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Odayı Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu odayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0">İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
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