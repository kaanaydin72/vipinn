import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Reservation, Room, Hotel, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  CalendarRange,
  Search,
  SlidersHorizontal,
  Users,
  Home,
  User as UserIcon,
  CreditCard,
  CalendarCheck,
  ArrowRightLeft,
  Eye,
  Filter,
  ChevronRight
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function ReservationsManagementMobile() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  // Rezervasyonları getir
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery<Reservation[]>({
    queryKey: ['/api/reservations'],
  });

  // Otelleri getir
  const { data: hotels = [], isLoading: hotelsLoading } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
  });

  // Odaları getir
  const { data: rooms = [], isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
  });

  // Kullanıcıları getir
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const isLoading = reservationsLoading || hotelsLoading || roomsLoading || usersLoading;

  // Rezervasyon ödemeleriyle ilgili statü badge'i için renk belirle
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'failed':
        return 'bg-red-50 text-red-600 border-red-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  // Rezervasyon durumuyla ilgili badge rengi belirle
  const getReservationStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'completed':
        return 'bg-green-50 text-green-600 border-green-200';
      case 'cancelled':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  // Rezervasyonu oluşturan kullanıcı bilgisini bul
  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? user.username : 'Bilinmeyen Kullanıcı';
  };

  // Rezervasyon odasının bilgisini bul
  const getRoomInfo = (roomId: number) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return { name: 'Bilinmeyen Oda', hotelId: 0 };
    
    const hotel = hotels.find(h => h.id === room.hotelId);
    return {
      name: room.name,
      hotelId: room.hotelId,
      hotelName: hotel ? hotel.name : 'Bilinmeyen Otel'
    };
  };

  // Türkçe statü metinleri
  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Onaylandı';
      case 'pending': return 'Beklemede';
      case 'cancelled': return 'İptal Edildi';
      case 'completed': return 'Tamamlandı';
      case 'paid': return 'Ödendi';
      case 'failed': return 'Başarısız';
      case 'on_site': return 'Otelde Ödeme';
      case 'credit_card': return 'Kredi Kartı';
      default: return status;
    }
  };

  // Filtreleme fonksiyonu
  const filterReservations = () => {
    if (!reservations) return [];
    
    return reservations.filter(reservation => {
      // Statü filtresi uygulanıyor
      if (statusFilter !== 'all' && reservation.status !== statusFilter) {
        return false;
      }

      // Arama filtresi, rezervasyon ID, oda adı veya kullanıcı adında arar
      if (searchTerm) {
        const roomInfo = getRoomInfo(reservation.roomId);
        const userName = getUserName(reservation.userId);
        const searchLower = searchTerm.toLowerCase();
        
        return (
          reservation.id.toString().includes(searchLower) ||
          roomInfo.name.toLowerCase().includes(searchLower) ||
          (roomInfo.hotelName ? roomInfo.hotelName.toLowerCase().includes(searchLower) : false) ||
          userName.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  };

  const filteredReservations = filterReservations();

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
            <h1 className="flex-1 text-center font-semibold text-lg">Rezervasyon Yönetimi</h1>
            <Button
              variant="ghost"
              size="icon"
              className="text-white"
              onClick={() => setShowFilterSheet(true)}
            >
              <Filter className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Arama */}
        <div className="px-4 py-3 bg-white shadow-sm border-b flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Rezervasyon ara..."
              className="pl-9 h-10 bg-neutral-50 border-[#2094f3]/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilterSheet(true)}
            className="h-10 w-10 border-[#2094f3]/20"
          >
            <SlidersHorizontal className="h-4 w-4 text-neutral-500" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="text-center py-8 flex flex-col items-center">
            <CalendarRange className="h-12 w-12 text-neutral-300 mb-2" />
            <p className="text-neutral-500 mb-1">Rezervasyon bulunamadı</p>
            <p className="text-sm text-neutral-400 mb-4">Filtrelerinizi değiştirmeyi deneyin</p>
            <Button
              onClick={() => {
                setStatusFilter("all");
                setSearchTerm("");
              }}
              variant="outline"
              className="border-[#2094f3] text-[#2094f3]"
            >
              Filtreleri Temizle
            </Button>
          </div>
        ) : (
          <motion.div 
            className="space-y-4 pb-16"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {filteredReservations.map((reservation) => {
              const roomInfo = getRoomInfo(reservation.roomId);
              return (
                <motion.div key={reservation.id} variants={itemVariants}>
                  <Card className="overflow-hidden border-[#2094f3]/20 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-0">
                      {/* Rezervasyon Başlık Alanı */}
                      <div className="bg-gradient-to-r from-[#f0f9ff] to-[#e6f7ff] p-3 border-b border-blue-100">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Badge className="mr-2 bg-blue-100 text-blue-700 border-blue-200">
                              #{reservation.id}
                            </Badge>
                            <Badge className={`${getReservationStatusColor(reservation.status)}`}>
                              {getStatusText(reservation.status)}
                            </Badge>
                          </div>
                          <Badge className={`${getPaymentStatusColor(reservation.paymentStatus)}`}>
                            {getStatusText(reservation.paymentStatus)}
                          </Badge>
                        </div>
                        <div className="mt-1 text-sm text-blue-900 font-medium">
                          {roomInfo.hotelName} - {roomInfo.name}
                        </div>
                      </div>
                      
                      {/* Rezervasyon Detayları */}
                      <div className="px-3 py-3 space-y-2.5">
                        <div className="flex items-center text-sm">
                          <CalendarRange className="h-4 w-4 mr-2 text-neutral-500" />
                          <div className="flex-1">
                            <span className="font-medium">Tarih: </span>
                            {format(new Date(reservation.checkIn), 'dd MMM yyyy', { locale: tr })} - {format(new Date(reservation.checkOut), 'dd MMM yyyy', { locale: tr })}
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 mr-2 text-neutral-500" />
                          <div>
                            <span className="font-medium">Misafir Sayısı: </span>
                            {reservation.numberOfGuests} kişi
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <UserIcon className="h-4 w-4 mr-2 text-neutral-500" />
                          <div>
                            <span className="font-medium">Rezervasyon Sahibi: </span>
                            {getUserName(reservation.userId)}
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <CreditCard className="h-4 w-4 mr-2 text-neutral-500" />
                          <div>
                            <span className="font-medium">Ödeme Yöntemi: </span>
                            {getStatusText(reservation.paymentMethod)}
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <CreditCard className="h-4 w-4 mr-2 text-neutral-500" />
                          <div>
                            <span className="font-medium">Toplam Ücret: </span>
                            {reservation.totalPrice?.toLocaleString('tr-TR')} ₺
                          </div>
                        </div>
                      </div>
                      
                      {/* Rezervasyon İşlem Butonu */}
                      <div className="px-3 pb-3">
                        <Button
                          asChild
                          className="w-full h-10 bg-[#2094f3]"
                        >
                          <Link href={`/admin/reservations/status/${reservation.id}`}>
                            Rezervasyon Detayları
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
      
      {/* Filtre Sheet */}
      <Sheet open={showFilterSheet} onOpenChange={setShowFilterSheet}>
        <SheetContent side="bottom" className="rounded-t-xl h-[350px]">
          <SheetHeader className="text-left">
            <SheetTitle>Filtreleme Seçenekleri</SheetTitle>
            <SheetDescription>
              Rezervasyonları istediğiniz şekilde filtreleyebilirsiniz.
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-5 mt-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rezervasyon Durumu</label>
              <Select 
                value={statusFilter} 
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Rezervasyon durumu seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="confirmed">Onaylandı</SelectItem>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="cancelled">İptal Edildi</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <SheetFooter className="mt-6 flex flex-col gap-3">
            <Button 
              className="w-full bg-[#2094f3]"
              onClick={() => setShowFilterSheet(false)}
            >
              Filtreleri Uygula
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setStatusFilter("all");
                setShowFilterSheet(false);
              }}
            >
              Filtreleri Temizle
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}