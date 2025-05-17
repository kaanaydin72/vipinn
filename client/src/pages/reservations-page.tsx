import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Reservation, Room, Hotel, HotelPolicy } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import MainLayout from "@/components/layout/main-layout";
import { useState, useMemo, useEffect } from "react";
import { 
  Calendar, 
  Users, 
  Eye, 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Loader2, 
  Info, 
  AlertTriangle 
} from "lucide-react";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Badge 
} from "@/components/ui/badge";
import { 
  useToast 
} from "@/hooks/use-toast";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function ReservationsPage() {
  const [_, navigate] = useLocation();
  const { user, isLoading: isLoadingUser } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // URL parametrelerini analiz et
  const searchParams = new URLSearchParams(window.location.search);
  const paymentSuccess = searchParams.get('success');
  const reservationId = searchParams.get('id');
  
  // Ödeme sonucu bildirimi göster
  useEffect(() => {
    if (paymentSuccess !== null && reservationId) {
      if (paymentSuccess === 'true') {
        toast({
          title: "Ödeme başarılı",
          description: "Rezervasyonunuz başarıyla tamamlandı.",
          variant: "default",
          duration: 5000,
        });
      } else {
        toast({
          title: "Ödeme başarısız",
          description: "Ödeme işleminiz tamamlanamadı. Lütfen tekrar deneyin.",
          variant: "destructive",
          duration: 5000,
        });
      }
      
      // URL'deki parametreleri temizle
      window.history.replaceState({}, document.title, "/reservations");
      
      // Rezervasyon verilerini yenile
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
    }
  }, [paymentSuccess, reservationId, toast, queryClient]);
  
  // Fetch user reservations
  const { data: reservations = [], isLoading: isLoadingReservations } = useQuery<Reservation[]>({
    queryKey: ['/api/reservations'],
    enabled: !!user,
  });
  
  // Fetch all rooms to match with reservations
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
    enabled: reservations.length > 0,
  });
  
  // Fetch all hotels to match with rooms
  const { data: hotels = [], isLoading: isLoadingHotels } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
    enabled: rooms.length > 0,
  });
  
  const isLoading = isLoadingUser || isLoadingReservations || isLoadingRooms || isLoadingHotels;
  
  // Group reservations by status
  const upcomingReservations = reservations.filter(res => 
    res.status === "confirmed" && new Date(res.checkIn) > new Date()
  );
  
  const activeReservations = reservations.filter(res => 
    res.status === "confirmed" && 
    new Date(res.checkIn) <= new Date() && 
    new Date(res.checkOut) >= new Date()
  );
  
  const pastReservations = reservations.filter(res => 
    res.status === "completed" || 
    (res.status === "confirmed" && new Date(res.checkOut) < new Date())
  );
  
  const cancelledReservations = reservations.filter(res => 
    res.status === "cancelled"
  );
  
  // Helper function to get room and hotel information
  const getReservationDetails = (reservation: Reservation) => {
    const room = rooms.find(r => r.id === reservation.roomId);
    const hotel = room ? hotels.find(h => h.id === room.hotelId) : null;
    return { room, hotel };
  };
  
  // Format date range
  const formatDateRange = (checkIn: string, checkOut: string) => {
    return `${format(new Date(checkIn), "d MMMM", { locale: tr })} - ${format(new Date(checkOut), "d MMMM yyyy", { locale: tr })}`;
  };
  
  // Calculate total price
  const calculateTotalPrice = (reservation: Reservation) => {
    // Rezervasyon fiyatı artık doğrudan rezervasyon üzerinde saklanıyor
    return reservation.totalPrice || 0;
  };
  
  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-blue-500">Onaylandı</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Tamamlandı</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">İptal Edildi</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  // Fonksiyon olarak düzenle
  const handleViewDetails = (reservationId: number) => {
    navigate(`/reservations/${reservationId}`);
  };
  
  // Fonksiyon olarak düzenle
  const handleNewReservation = () => {
    navigate("/hotels");
  };
  
  return (
    <MainLayout>
      <main className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">Rezervasyonlarım</h1>
            <Button onClick={handleNewReservation}>
              Yeni Rezervasyon
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="all">
                Tümü ({reservations.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Yaklaşan ({upcomingReservations.length})
              </TabsTrigger>
              <TabsTrigger value="active">
                Aktif ({activeReservations.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Geçmiş ({pastReservations.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-6">
              {reservations.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                      Henüz bir rezervasyonunuz bulunmuyor.
                    </p>
                    <Button onClick={handleNewReservation}>
                      Otel Ara
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                reservations.map((reservation) => {
                  const { room, hotel } = getReservationDetails(reservation);
                  if (!room || !hotel) return null;
                  
                  return (
                    <ReservationCard
                      key={reservation.id}
                      reservation={reservation}
                      room={room}
                      hotel={hotel}
                      formatDateRange={formatDateRange}
                      calculateTotalPrice={calculateTotalPrice}
                      getStatusBadge={getStatusBadge}
                      onViewDetails={handleViewDetails}
                    />
                  );
                })
              )}
            </TabsContent>
            
            <TabsContent value="upcoming" className="space-y-6">
              {upcomingReservations.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                      Yaklaşan rezervasyonunuz bulunmuyor.
                    </p>
                    <Button onClick={handleNewReservation}>
                      Otel Ara
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                upcomingReservations.map((reservation) => {
                  const { room, hotel } = getReservationDetails(reservation);
                  if (!room || !hotel) return null;
                  
                  return (
                    <ReservationCard
                      key={reservation.id}
                      reservation={reservation}
                      room={room}
                      hotel={hotel}
                      formatDateRange={formatDateRange}
                      calculateTotalPrice={calculateTotalPrice}
                      getStatusBadge={getStatusBadge}
                      onViewDetails={handleViewDetails}
                    />
                  );
                })
              )}
            </TabsContent>
            
            <TabsContent value="active" className="space-y-6">
              {activeReservations.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Şu anda aktif bir konaklamanız bulunmuyor.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                activeReservations.map((reservation) => {
                  const { room, hotel } = getReservationDetails(reservation);
                  if (!room || !hotel) return null;
                  
                  return (
                    <ReservationCard
                      key={reservation.id}
                      reservation={reservation}
                      room={room}
                      hotel={hotel}
                      formatDateRange={formatDateRange}
                      calculateTotalPrice={calculateTotalPrice}
                      getStatusBadge={getStatusBadge}
                      isActive
                      onViewDetails={handleViewDetails}
                    />
                  );
                })
              )}
            </TabsContent>
            
            <TabsContent value="past" className="space-y-6">
              {pastReservations.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Geçmiş rezervasyonunuz bulunmuyor.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pastReservations.map((reservation) => {
                  const { room, hotel } = getReservationDetails(reservation);
                  if (!room || !hotel) return null;
                  
                  return (
                    <ReservationCard
                      key={reservation.id}
                      reservation={reservation}
                      room={room}
                      hotel={hotel}
                      formatDateRange={formatDateRange}
                      calculateTotalPrice={calculateTotalPrice}
                      getStatusBadge={getStatusBadge}
                      onViewDetails={handleViewDetails}
                    />
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </MainLayout>
  );
}

interface ReservationCardProps {
  reservation: Reservation;
  room: Room;
  hotel: Hotel;
  formatDateRange: (checkIn: string, checkOut: string) => string;
  calculateTotalPrice: (reservation: Reservation) => number;
  getStatusBadge: (status: string) => React.ReactNode;
  isActive?: boolean;
  onViewDetails: (reservationId: number) => void;
}

function ReservationCard({
  reservation,
  room,
  hotel,
  formatDateRange,
  calculateTotalPrice,
  getStatusBadge,
  isActive = false,
  onViewDetails
}: ReservationCardProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Rezervasyon iptali için mutation
  const cancelReservationMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/reservations/${id}/cancel`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Rezervasyon iptal edildi",
        description: "Rezervasyonunuz başarıyla iptal edildi.",
        variant: "default",
      });
      // Rezervasyonları yenile
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      setCancelDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "İptal işlemi başarısız",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Yaklaşan rezervasyon mu kontrol et
  const isUpcoming = useMemo(() => {
    const now = new Date();
    const checkInDate = new Date(reservation.checkIn);
    // pending ve confirmed durumundaki rezervasyonlar yaklaşan olarak kabul edilir
    return (reservation.status === "confirmed" || reservation.status === "pending") && checkInDate > now;
  }, [reservation]);
  
  // Otel politikasını al
  const { data: hotelPolicy } = useQuery({
    queryKey: ['/api/hotels', hotel.id, 'policy'],
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/hotels/${hotel.id}/policy`, { signal });
      if (res.status === 404 || !res.ok) return null;
      return res.json();
    },
    enabled: !!hotel?.id,
  });
  
  // İptal edilebilir mi?
  const canBeCancelled = useMemo(() => {
    if (reservation.status === "cancelled" || reservation.status === "completed") {
      return false;
    }
    
    const checkInDate = new Date(reservation.checkIn);
    const now = new Date();
    const hoursDifference = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const daysDifference = hoursDifference / 24;
    
    // Otel politikası varsa onu kullan
    if (hotelPolicy) {
      return daysDifference >= (hotelPolicy.cancellationDays || 1);
    }
    
    // Varsayılan kural: 24 saat öncesine kadar iptal edilebilir
    return hoursDifference >= 24;
  }, [reservation, hotelPolicy]);
  
  // Rezervasyon iptal et
  const handleCancelReservation = () => {
    cancelReservationMutation.mutate(reservation.id);
  };
  
  // Rezervasyon detayları görüntüleme işleyicisi
  const handleViewDetails = () => {
    onViewDetails(reservation.id);
  };
  
  return (
    <Card className={isActive ? "border-primary" : ""}>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
          <div 
            className="h-48 md:h-full relative bg-cover bg-center"
            style={{ backgroundImage: `url(${room.imageUrl})` }}
          >
            <div className="absolute top-3 left-3 z-10">
              {getStatusBadge(reservation.status)}
            </div>
          </div>
          <div className="p-6 md:col-span-2 lg:col-span-3 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-neutral-800 dark:text-white">{hotel.name}</h2>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-neutral-600 dark:text-neutral-400 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {hotel.address}
                    </p>
                    {reservation.reservationCode && (
                      <div className="bg-blue-50 text-blue-600 text-xs font-medium px-2 py-1 rounded border border-blue-100">
                        Rezervasyon Kodu: <span className="font-bold">{reservation.reservationCode}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* İptal politikası bilgisi */}
                  {isUpcoming && hotelPolicy && (
                    <div className="mt-2 text-xs flex items-center text-blue-500">
                      <Info className="h-3 w-3 mr-1" />
                      <span>
                        {hotelPolicy.cancellationDays > 0 
                          ? `Giriş tarihinden ${hotelPolicy.cancellationDays} gün öncesine kadar ücretsiz iptal`
                          : "İade yapılmayan rezervasyon"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{calculateTotalPrice(reservation)} ₺</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {Math.ceil((new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / (1000 * 60 * 60 * 24))} gece
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center space-x-1 text-sm text-neutral-600 dark:text-neutral-400">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDateRange(String(reservation.checkIn), String(reservation.checkOut))}</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-neutral-600 dark:text-neutral-400">
                  <Users className="h-4 w-4" />
                  <span>{reservation.numberOfGuests} Misafir</span>
                </div>
              </div>
              
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <p className="font-medium text-neutral-800 dark:text-white mb-1">
                  {room.name} - {room.type}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                  {room.description}
                </p>
                
                {/* İptal politikası bilgisi */}
                {isUpcoming && hotelPolicy && (
                  <div className="mt-3 text-xs p-2 rounded bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <p className="font-medium text-neutral-800 dark:text-white flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      İptal Politikası
                    </p>
                    <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                      {hotelPolicy.cancellationPolicy === "FIRST_NIGHT" && 
                        `Giriş tarihinden ${hotelPolicy.cancellationDays} gün öncesine kadar ücretsiz iptal.`
                      }
                      {hotelPolicy.cancellationPolicy === "FIFTY_PERCENT" && 
                        `Giriş tarihinden ${hotelPolicy.cancellationDays} gün öncesine kadar ücretsiz iptal.`
                      }
                      {hotelPolicy.cancellationPolicy === "FULL_AMOUNT" && 
                        `Giriş tarihinden ${hotelPolicy.cancellationDays} gün öncesine kadar ücretsiz iptal.`
                      }
                      {hotelPolicy.cancellationPolicy === "NO_REFUND" && 
                        "İade edilemez rezervasyon."
                      }
                    </p>
                  </div>
                )}
              </div>
              
              {/* Aksiyon butonları */}
              <div className="mt-4 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-[#2094f3] text-[#2094f3] hover:bg-[#2094f3]/10"
                  onClick={handleViewDetails}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Detaylar
                </Button>
                
                {isUpcoming && (
                  <>
                    {canBeCancelled ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setCancelDialogOpen(true)}
                          disabled={cancelReservationMutation.isPending}
                          className="border-[#2094f3] text-[#2094f3] hover:bg-[#2094f3]/10"
                        >
                          {cancelReservationMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          <X className="h-4 w-4 mr-1" />
                          İptal Et
                        </Button>
                      </>
                    ) : (
                      <>
                        {isUpcoming && (
                          <Button
                            variant="default"
                            size="sm"
                            className={canBeCancelled ? "bg-[#2094f3] hover:bg-[#1a75c0]" : "bg-gray-400 hover:bg-gray-500"}
                            onClick={() => setCancelDialogOpen(true)}
                            disabled={!canBeCancelled}
                          >
                            <X className="h-4 w-4 mr-1" />
                            İptal Et
                          </Button>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {isActive && (
              <div className="bg-neutral-50 dark:bg-neutral-800 mt-4 p-4 rounded-md">
                <h3 className="font-medium text-neutral-800 dark:text-white mb-2">Otel İletişim Bilgileri</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400">
                    <Phone className="h-4 w-4" />
                    <span>+90 212 123 4567</span>
                  </div>
                  <div className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400">
                    <Mail className="h-4 w-4" />
                    <span>info@elitehotels.com</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      {/* İptal Onay Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rezervasyonu İptal Et</DialogTitle>
            <DialogDescription>
              Bu rezervasyonu iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          
          {hotelPolicy ? (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-4 rounded-md my-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm text-amber-800 dark:text-amber-400 font-medium">
                    {hotel.name} İptal Politikası
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-400">
                    {hotelPolicy.cancellationPolicy === "FIRST_NIGHT" && 
                      `Giriş tarihine ${hotelPolicy.cancellationDays} gün kalana kadar ücretsiz iptal yapabilirsiniz. Daha sonra yapılan iptallerde ilk gece konaklama bedeli tahsil edilir.`
                    }
                    {hotelPolicy.cancellationPolicy === "FIFTY_PERCENT" && 
                      `Giriş tarihine ${hotelPolicy.cancellationDays} gün kalana kadar ücretsiz iptal yapabilirsiniz. Daha sonra yapılan iptallerde toplam tutarın %50'si kadar ceza uygulanır.`
                    }
                    {hotelPolicy.cancellationPolicy === "FULL_AMOUNT" && 
                      `Giriş tarihine ${hotelPolicy.cancellationDays} gün kalana kadar ücretsiz iptal yapabilirsiniz. Daha sonra yapılan iptallerde toplam tutar tahsil edilir.`
                    }
                    {hotelPolicy.cancellationPolicy === "NO_REFUND" && 
                      "Bu rezervasyon iade edilemez. İptal durumunda herhangi bir geri ödeme yapılmaz."
                    }
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-400">
                    İptal işlemi sonrası iade işlemleri için otelle iletişime geçebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-4 rounded-md my-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-400">
                  Rezervasyonunuz iptal edilirse, ödemeniz iade politikasına göre işleme alınacaktır. İptal işlemi sonrası otelle iletişime geçebilirsiniz.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Vazgeç
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelReservation}
              disabled={cancelReservationMutation.isPending}
            >
              {cancelReservationMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Rezervasyonu İptal Et
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}