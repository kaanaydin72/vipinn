import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Hotel } from "@shared/schema";
import { Link } from "wouter";
import { useDeviceType } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Sheet,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, ArrowLeft, MapPin, Star, BedDouble, Search, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";

export default function HotelManagementMobile() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [hotelToDelete, setHotelToDelete] = useState<Hotel | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch hotels
  const { data: hotels = [], isLoading, isError } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
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

  const handleDelete = () => {
    if (hotelToDelete) {
      deleteHotelMutation.mutate(hotelToDelete.id);
    }
  };

  const filteredHotels = hotels.filter(hotel => 
    hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hotel.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hotel.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Animation variants
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

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* iOS/Android tarzı başlık */}
      <div className="sticky top-0 z-10">
        <div className="bg-gradient-to-r from-[#2094f3] to-[#38b6ff] text-white shadow-md">
          <div className="flex items-center px-4 h-14">
            <Button variant="ghost" size="icon" className="text-white" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="flex-1 text-center font-semibold text-lg">Otel Yönetimi</h1>
            <Link href="/admin/hotels/add">
              <Button variant="ghost" size="icon" className="text-white">
                <Plus className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Arama */}
        <div className="px-4 py-3 bg-white shadow-sm border-b flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Otel ara..."
              className="pl-9 h-10 bg-neutral-50 border-[#2094f3]/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10 border-[#2094f3]/20">
            <SlidersHorizontal className="h-4 w-4 text-neutral-500" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#2094f3]" />
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-neutral-600">
            <p>Oteller yüklenirken bir hata oluştu. Lütfen tekrar deneyin.</p>
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="text-center py-8 text-neutral-600">
            <p>Otel bulunamadı.</p>
            <Button asChild className="mt-4 bg-[#2094f3]">
              <Link href="/admin/hotels/add">Yeni Otel Ekle</Link>
            </Button>
          </div>
        ) : (
          <motion.div 
            className="space-y-4 pb-16"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {filteredHotels.map((hotel) => (
              <motion.div 
                key={hotel.id}
                variants={itemVariants}
              >
                <Card className="overflow-hidden border-[#2094f3]/20 bg-white rounded-xl shadow-sm relative">
                  <div className="flex flex-col">
                    {/* Otel Resmi */}
                    <div className="relative h-48 w-full">
                      <img
                        src={hotel.imageUrl || "https://via.placeholder.com/400x200?text=Otel+Görseli"}
                        alt={hotel.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <h3 className="font-semibold text-white text-lg line-clamp-1">{hotel.name}</h3>
                        <div className="flex items-center text-white/90 text-sm">
                          <MapPin className="h-3.5 w-3.5 mr-1" />
                          <span className="line-clamp-1">{hotel.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Otel Bilgileri */}
                    <CardContent className="p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            {hotel.rating || "5.0"}
                          </Badge>
                          <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                            <BedDouble className="h-3 w-3 mr-1" />
                            {hotel.stars || 0} Oda
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-blue-600"
                            asChild
                          >
                            <Link href={`/admin/hotels/edit/${hotel.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-red-600"
                            onClick={() => {
                              setHotelToDelete(hotel);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-neutral-600 line-clamp-2">{hotel.description}</p>
                      
                      <div className="pt-1">
                        <Button 
                          size="sm" 
                          className="w-full h-9 bg-[#2094f3]"
                          asChild
                        >
                          <Link href={`/admin/hotels/${hotel.id}`}>
                            Detayları Görüntüle
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
      
      {/* Otel Silme Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Oteli Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu oteli silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve
              bu otele ait tüm odalar ve rezervasyonlar da silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0">İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={deleteHotelMutation.isPending}
            >
              {deleteHotelMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Oteli Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}