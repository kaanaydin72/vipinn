import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, isWithinInterval, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Edit, Trash2, Check, X, Calendar, Users, CreditCard, Tag, Loader2, Search, User, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Hotel, Reservation, Room, User as UserType } from "@shared/schema";
import AdminLayout from "@/components/admin/admin-layout";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function ReservationsManagement() {
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchField, setSearchField] = useState<string>("any");
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });

  // Fetch reservations
  const { data: reservations = [], isLoading: isLoadingReservations } = useQuery<Reservation[]>({
    queryKey: ['/api/reservations'],
    refetchInterval: 5000, // Her 5 saniyede bir otomatik yenileme
    refetchOnWindowFocus: true, // Sayfa aktif olduğunda yenileme
    select: (data) => {
      console.log("API'den gelen rezervasyonlar:", data);
      
      // Eksik veya geçersiz verileri filtreleyelim
      const validReservations = data?.filter(res => 
        res && res.id && res.roomId && res.userId) || [];
      
      console.log("Geçerli rezervasyonlar:", validReservations);
      
      let filteredReservations = validReservations;
      
      // Status filtreleme
      if (selectedStatus) {
        filteredReservations = filteredReservations.filter(res => res.status === selectedStatus);
      }
      
      // Tarih aralığı filtreleme
      if (dateRange.from && dateRange.to) {
        filteredReservations = filteredReservations.filter(res => {
          const checkIn = parseISO(res.checkIn as unknown as string);
          const checkOut = parseISO(res.checkOut as unknown as string);
          
          // CheckIn veya CheckOut tarihleri seçilen aralıkta mı?
          return (
            isWithinInterval(checkIn, { start: dateRange.from!, end: dateRange.to! }) ||
            isWithinInterval(checkOut, { start: dateRange.from!, end: dateRange.to! })
          );
        });
      }
      
      // Arama sorgusu filtreleme
      if (searchQuery.trim() !== "") {
        filteredReservations = filteredReservations.filter(res => {
          // Her bir kullanıcıyı ve ilgili rezervasyon bilgilerini bul
          const user = users?.find(u => u.id === res.userId);
          const room = rooms?.find(r => r.id === res.roomId);
          const hotel = hotels?.find(h => h.id === room?.hotelId);
          
          const searchFields: Record<string, string | null> = {
            "any": "",  // Tüm alanlarda ara
            "reservation_code": res.reservationCode || "",
            "hotel": hotel?.name || "",
            "room": room?.name || "",
            "customer": `${user?.username || ""} ${user?.email || ""} ${user?.phone || ""}`,
          };
          
          if (searchField === "any") {
            // Tüm alanlarda ara
            return Object.values(searchFields).some(value => 
              value && value.toLowerCase().includes(searchQuery.toLowerCase())
            );
          } else {
            // Belirli alanda ara
            return searchFields[searchField]?.toLowerCase().includes(searchQuery.toLowerCase());
          }
        });
      }
      
      return filteredReservations;
    }
  });

  // Fetch hotels
  const { data: hotels, isLoading: isLoadingHotels } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
  });

  // Fetch rooms
  const { data: rooms, isLoading: isLoadingRooms } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
  });
  
  // Fetch users
  const { data: users, isLoading: isLoadingUsers } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
  });

  // Update reservation status
  const updateReservationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      console.log("Güncelleniyor:", id, status);
      
      if (!id || isNaN(Number(id))) {
        throw new Error("Geçersiz rezervasyon ID'si");
      }
      
      const res = await apiRequest("PATCH", `/api/reservations/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      toast({
        title: "Başarılı",
        description: "Rezervasyon durumu güncellendi.",
      });
      setSelectedReservation(null);
    },
    onError: (error: Error) => {
      console.error("Durum güncelleme hatası:", error);
      toast({
        title: "Hata",
        description: `Rezervasyon durumu güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Get hotel name by ID
  const getHotelName = (roomId: number) => {
    if (!rooms || !hotels) return "Yükleniyor...";
    const room = rooms.find(r => r.id === roomId);
    if (!room) return "Bilinmeyen Oda";
    const hotel = hotels.find(h => h.id === room.hotelId);
    return hotel ? hotel.name : "Bilinmeyen Otel";
  };

  // Get room name by ID
  const getRoomName = (roomId: number) => {
    if (!rooms) return "Yükleniyor...";
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : "Bilinmeyen Oda";
  };

  // Format date for display
  const formatDate = (dateString: Date | string) => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) {
        return "Geçersiz tarih";
      }
      return format(date, "d MMMM yyyy", { locale: tr });
    } catch (error) {
      console.error("Tarih dönüştürme hatası:", error, dateString);
      return "Geçersiz tarih";
    }
  };

  // Calculate total price
  const getReservationDetails = (reservation: Reservation) => {
    try {
      const room = rooms?.find(r => r.id === reservation.roomId);
      
      // Date hesaplama
      let nights = 0;
      try {
        const checkIn = new Date(reservation.checkIn);
        const checkOut = new Date(reservation.checkOut);
        if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime())) {
          nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        }
      } catch (e) {
        console.error("Gece sayısı hesaplama hatası:", e);
      }
      
      return {
        roomPrice: room?.price || 0,
        nights: nights > 0 ? nights : 1,
        totalPrice: reservation.totalPrice || 0
      };
    } catch (error) {
      console.error("Rezervasyon detayları hesaplama hatası:", error);
      return { roomPrice: 0, nights: 0, totalPrice: 0 };
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="outline" className="font-normal text-blue-600 border-blue-200 bg-blue-50">Onaylandı</Badge>;
      case "pending":
        return <Badge variant="outline" className="font-normal text-yellow-600 border-yellow-200 bg-yellow-50">Beklemede</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="font-normal text-red-600 border-red-200 bg-red-50">İptal Edildi</Badge>;
      case "completed":
        return <Badge variant="outline" className="font-normal text-green-600 border-green-200 bg-green-50">Tamamlandı</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Ödeme yöntemi badge'i
  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'credit_card':
        return <Badge variant="outline" className="font-normal text-purple-600 border-purple-200 bg-purple-50">Kredi Kartı</Badge>;
      case 'on_site':
        return <Badge variant="outline" className="font-normal text-cyan-600 border-cyan-200 bg-cyan-50">Yerinde Ödeme</Badge>;
      default:
        return <Badge>{method}</Badge>;
    }
  };

  const isLoading = isLoadingReservations || isLoadingHotels || isLoadingRooms || isLoadingUsers;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const handleStatusChange = (reservationId: number, newStatus: string) => {
    if (!reservationId || isNaN(Number(reservationId))) {
      toast({
        title: "Hata",
        description: "Geçersiz rezervasyon ID'si",
        variant: "destructive",
      });
      return;
    }
    
    console.log(`Durum değiştiriliyor: Rezervasyon #${reservationId} -> ${newStatus}`);
    updateReservationMutation.mutate({ id: reservationId, status: newStatus });
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Rezervasyon Yönetimi</h1>
          <p className="text-muted-foreground">Tüm rezervasyonları görüntüleyin ve yönetin.</p>
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setSelectedStatus(null)}>
            Tümü
          </TabsTrigger>
          <TabsTrigger value="confirmed" onClick={() => setSelectedStatus("confirmed")}>
            Onaylandı
          </TabsTrigger>
          <TabsTrigger value="pending" onClick={() => setSelectedStatus("pending")}>
            Beklemede
          </TabsTrigger>
          <TabsTrigger value="cancelled" onClick={() => setSelectedStatus("cancelled")}>
            İptal Edildi
          </TabsTrigger>
          <TabsTrigger value="completed" onClick={() => setSelectedStatus("completed")}>
            Tamamlandı
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {reservations && reservations.length === 0 ? (
            <Alert>
              <AlertTitle>Rezervasyon Bulunamadı</AlertTitle>
              <AlertDescription>
                Henüz hiç rezervasyon yapılmamış veya seçili kriterlere uygun rezervasyon bulunmuyor.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {reservations?.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  getHotelName={getHotelName}
                  getRoomName={getRoomName}
                  formatDate={formatDate}
                  getReservationDetails={getReservationDetails}
                  getStatusBadge={getStatusBadge}
                  getPaymentMethodBadge={getPaymentMethodBadge}
                  onStatusChange={handleStatusChange}
                  isUpdating={updateReservationMutation.isPending}
                  users={users}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {["confirmed", "pending", "cancelled", "completed"].map((status) => (
          <TabsContent key={status} value={status} className="mt-6">
            {reservations && reservations.length === 0 ? (
              <Alert>
                <AlertTitle>Rezervasyon Bulunamadı</AlertTitle>
                <AlertDescription>
                  Bu durumdaki rezervasyon bulunmuyor.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-4">
                {reservations?.map((reservation) => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    getHotelName={getHotelName}
                    getRoomName={getRoomName}
                    formatDate={formatDate}
                    getReservationDetails={getReservationDetails}
                    getStatusBadge={getStatusBadge}
                    getPaymentMethodBadge={getPaymentMethodBadge}
                    onStatusChange={handleStatusChange}
                    isUpdating={updateReservationMutation.isPending}
                    users={users}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </AdminLayout>
  );
}

interface ReservationCardProps {
  reservation: Reservation;
  getHotelName: (roomId: number) => string;
  getRoomName: (roomId: number) => string;
  formatDate: (date: Date | string) => string;
  getReservationDetails: (reservation: Reservation) => { roomPrice: number; nights: number; totalPrice: number };
  getStatusBadge: (status: string) => React.ReactNode;
  getPaymentMethodBadge: (method: string) => React.ReactNode;
  onStatusChange: (id: number, status: string) => void;
  isUpdating: boolean;
  users?: UserType[];
}

function ReservationCard({
  reservation,
  getHotelName,
  getRoomName,
  formatDate,
  getReservationDetails,
  getStatusBadge,
  getPaymentMethodBadge,
  onStatusChange,
  isUpdating,
  users
}: ReservationCardProps) {
  // Rezervasyon detayları güvenli şekilde alınıyor
  const reservationDetails = useMemo(() => {
    return getReservationDetails(reservation);
  }, [reservation, getReservationDetails]);
  
  const { roomPrice, nights, totalPrice } = reservationDetails;
  
  // Kullanıcı bilgisini bul
  const user = useMemo(() => {
    if (!users) return null;
    return users.find(u => u.id === reservation.userId);
  }, [users, reservation.userId]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{getHotelName(reservation.roomId)}</CardTitle>
              {reservation.reservationCode && (
                <Badge variant="outline" className="text-xs font-normal border-blue-200 text-blue-600 bg-blue-50">
                  {reservation.reservationCode}
                </Badge>
              )}
            </div>
            <CardDescription>{getRoomName(reservation.roomId)}</CardDescription>
            {user && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <User className="h-3 w-3 mr-1" />
                  <span className="font-medium">Müşteri:</span>
                  <span className="ml-1">{user.username}</span>
                </div>
                {user.email && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 mr-1" />
                    <span className="font-medium">E-posta:</span>
                    <span className="ml-1">{user.email}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Phone className="h-3 w-3 mr-1" />
                    <span className="font-medium">Telefon:</span>
                    <span className="ml-1">{user.phone}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(reservation.status)}
            {getPaymentMethodBadge(reservation.paymentMethod)}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = `/admin/reservations/status/${reservation.id}`}
              disabled={isUpdating}
            >
              <Edit className="h-4 w-4 mr-1" />
              Durum
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 opacity-70" />
              <span className="font-medium">Giriş:</span>
              <span className="ml-2">{formatDate(reservation.checkIn)}</span>
            </div>
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 opacity-70" />
              <span className="font-medium">Çıkış:</span>
              <span className="ml-2">{formatDate(reservation.checkOut)}</span>
            </div>
            <div className="flex items-center text-sm">
              <Users className="h-4 w-4 mr-2 opacity-70" />
              <span className="font-medium">Misafir Sayısı:</span>
              <span className="ml-2">{reservation.numberOfGuests}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <CreditCard className="h-4 w-4 mr-2 opacity-70" />
              <span className="font-medium">Gecelik Fiyat:</span>
              <span className="ml-2">{roomPrice} ₺</span>
            </div>
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 opacity-70" />
              <span className="font-medium">Toplam Gece:</span>
              <span className="ml-2">{nights}</span>
            </div>
            <div className="flex items-center text-sm font-bold">
              <Tag className="h-4 w-4 mr-2 opacity-70" />
              <span className="font-medium">Toplam Fiyat:</span>
              <span className="ml-2">{totalPrice} ₺</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}