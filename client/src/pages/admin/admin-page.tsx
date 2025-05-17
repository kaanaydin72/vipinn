import { useQuery } from "@tanstack/react-query";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hotel, Room, User, Reservation } from "@shared/schema";
import { 
  Building2, 
  Bed, 
  Users, 
  CalendarCheck2, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight, 
  Loader2,
  Star,
  Tag
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminPage() {
  // Fetch data for dashboard
  const { data: hotels = [], isLoading: isLoadingHotels } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
  });
  
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
  });
  
  const { data: reservations = [], isLoading: isLoadingReservations } = useQuery<Reservation[]>({
    queryKey: ['/api/reservations'],
  });

  const totalHotels = hotels.length;
  const totalRooms = rooms.length;
  const totalReservations = reservations.length;
  
  // Create data for charts
  const roomsPerHotel = hotels.map(hotel => {
    const hotelRooms = rooms.filter(room => room.hotelId === hotel.id);
    return {
      name: hotel.name.length > 15 ? hotel.name.substring(0, 15) + '...' : hotel.name,
      odaSayısı: hotelRooms.length
    };
  });
  
  const reservationsByStatus = {
    confirmed: reservations.filter(res => res.status === 'confirmed').length,
    completed: reservations.filter(res => res.status === 'completed').length,
    cancelled: reservations.filter(res => res.status === 'cancelled').length,
  };
  
  const reservationStatusData = [
    { name: 'Onaylandı', value: reservationsByStatus.confirmed },
    { name: 'Tamamlandı', value: reservationsByStatus.completed },
    { name: 'İptal Edildi', value: reservationsByStatus.cancelled },
  ];

  const isLoading = isLoadingHotels || isLoadingRooms || isLoadingReservations;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex">
      <AdminSidebar />
      
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold font-heading text-neutral-800 dark:text-white mb-8">Admin Dashboard</h1>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Dashboard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Toplam Otel</p>
                        <h3 className="text-2xl font-bold text-neutral-800 dark:text-white mt-2">{totalHotels}</h3>
                      </div>
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Toplam Oda</p>
                        <h3 className="text-2xl font-bold text-neutral-800 dark:text-white mt-2">{totalRooms}</h3>
                      </div>
                      <div className="bg-secondary/10 p-2 rounded-full">
                        <Bed className="h-6 w-6 text-secondary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Rezervasyonlar</p>
                        <h3 className="text-2xl font-bold text-neutral-800 dark:text-white mt-2">{totalReservations}</h3>
                      </div>
                      <div className="bg-green-100 p-2 rounded-full">
                        <CalendarCheck2 className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Doluluk Oranı</p>
                        <h3 className="text-2xl font-bold text-neutral-800 dark:text-white mt-2">
                          {totalRooms > 0 ? Math.round((reservations.length / totalRooms) * 100) : 0}%
                        </h3>
                      </div>
                      <div className="bg-purple-100 p-2 rounded-full">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Charts and Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Otellere Göre Oda Dağılımı</CardTitle>
                    <CardDescription>Otel başına oda sayısı</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={roomsPerHotel}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end"
                            height={70}
                            interval={0}
                          />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="odaSayısı" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Rezervasyon Durumları</CardTitle>
                    <CardDescription>Mevcut rezervasyonların durumu</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={reservationStatusData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="hsl(var(--chart-2))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Recent Activity and Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Son Rezervasyonlar</CardTitle>
                    <CardDescription>Son 5 rezervasyon</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reservations.slice(0, 5).map((reservation, index) => {
                        const room = rooms.find(r => r.id === reservation.roomId);
                        const hotel = room ? hotels.find(h => h.id === room.hotelId) : null;
                        
                        return (
                          <div key={index} className="border-b border-neutral-200 dark:border-neutral-700 pb-4 last:border-0 last:pb-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-neutral-800 dark:text-white">
                                  {hotel?.name} - {room?.name}
                                </p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                  {new Date(reservation.checkIn).toLocaleDateString('tr-TR')} - {new Date(reservation.checkOut).toLocaleDateString('tr-TR')}
                                </p>
                              </div>
                              <div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  reservation.status === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                  reservation.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                }`}>
                                  {reservation.status === 'confirmed' ? 'Onaylandı' :
                                   reservation.status === 'completed' ? 'Tamamlandı' :
                                   'İptal Edildi'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Popüler Oteller</CardTitle>
                      <CardDescription>En yüksek puanlı oteller</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {hotels
                          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                          .slice(0, 5)
                          .map((hotel, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="font-medium text-neutral-900 dark:text-white mr-2">
                                  {index + 1}.
                                </span>
                                <div>
                                  <p className="font-medium text-neutral-800 dark:text-white">{hotel.name}</p>
                                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{hotel.location}</p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <Star className="h-4 w-4 fill-secondary text-secondary mr-1" />
                                <span>{hotel.rating}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/20 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center">
                        <Tag className="h-5 w-5 mr-2 text-blue-600" />
                        Dinamik Fiyatlandırma
                      </CardTitle>
                      <CardDescription>
                        Takvime göre özel fiyatlar ve dönemsel fiyatlandırma
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">
                          Tatil dönemleri, sezonlar ve özel günler için farklı fiyat kuralları oluşturun ve yönetin.
                        </p>
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          variant="outline" 
                          className="bg-white dark:bg-blue-900/30"
                          onClick={() => window.location.href = '/admin/pricing'}
                        >
                          Fiyat Yönetimine Git
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
