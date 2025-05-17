import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Room, Hotel } from "@shared/schema";
import { useLocation } from "wouter";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "@/components/ui/alert-dialog";
import { 
  Loader2, Plus, Pencil, Trash2, Building, Users, CreditCard
} from "lucide-react";



export default function RoomManagement() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  // Fetch rooms and hotels
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
  });

  const { data: hotels = [], isLoading: isLoadingHotels } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
  });

  const isLoading = isLoadingRooms || isLoadingHotels;

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

  const openEditDialog = (room: Room) => {
    // Düzenleme sayfasına yönlendir
    navigate(`/admin/rooms/edit/${room.id}`);
  };

  const openDeleteDialog = (room: Room) => {
    setRoomToDelete(room);
    setDeleteDialogOpen(true);
  };

  const getHotelNameById = (hotelId: number) => {
    const hotel = hotels.find(h => h.id === hotelId);
    return hotel ? hotel.name : "Bilinmeyen Otel";
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex">
      <AdminSidebar />

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold font-heading text-neutral-800 dark:text-white">Oda Yönetimi</h1>
            <Button onClick={() => navigate("/admin/rooms/add")}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Oda Ekle
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Odalar</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
                </div>
              ) : rooms.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  Henüz oda bulunmuyor. "Yeni Oda Ekle" butonuna tıklayarak bir oda ekleyebilirsiniz.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Görsel</TableHead>
                      <TableHead>Oda Adı</TableHead>
                      <TableHead>Otel</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead className="text-center">Kapasite</TableHead>
                      <TableHead className="text-right">Fiyat</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell>
                          <div className="w-16 h-16 rounded-md overflow-hidden">
                            <img
                              src={room.imageUrl || "https://via.placeholder.com/150x150?text=Oda"}
                              alt={room.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{room.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-1.5 text-neutral-500" />
                            <span>{getHotelNameById(room.hotelId)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{room.type}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <Users className="h-4 w-4 mr-1 text-neutral-500" />
                            <span>{room.capacity}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end">
                            <CreditCard className="h-4 w-4 mr-1.5 text-neutral-500" />
                            <span className="font-medium">Takvim Bazlı</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(room)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Düzenle</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                              onClick={() => openDeleteDialog(room)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Sil</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>



          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Odayı Sil</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu işlem geri alınamaz. Bu odayı silmek istediğinizden emin misiniz?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={deleteRoomMutation.isPending}
                >
                  {deleteRoomMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sil
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </div>
  );
}