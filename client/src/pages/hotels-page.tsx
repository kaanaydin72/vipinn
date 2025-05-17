import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Hotel, Room } from "@shared/schema";
import MainLayout from "@/components/layout/main-layout";
import RoomCard from "@/components/hotel/room-card";
import SelectedHotelRooms from "@/components/hotel/selected-hotel-rooms";
import { Button } from "@/components/ui/button";
import { useDeviceType } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";
import { format } from "date-fns";

export default function HotelsPage() {
  const { t } = useTranslation();
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  
  // Otel ve oda verilerini al
  const { data: hotels = [], isLoading: isLoadingHotels } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
  });
  
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
  });
  
  // Seçili otelin odalarını filtrele
  const filteredRooms = selectedHotel 
    ? rooms.filter(room => room.hotelId === selectedHotel.id)
    : [];
  
  // Artık mobile/desktop ayrımı yapmıyoruz çünkü tek tasarım kullanıyoruz

  return (
    <MainLayout>
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3')", height: "300px" }}>
          <div className="absolute inset-0 bg-black opacity-40"></div>
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white font-heading mb-4">{t('hotels', 'Otellerimiz')}</h1>
            <p className="text-lg md:text-xl text-white">{t('premium_locations', 'Türkiye\'nin en prestijli lokasyonlarında 5 yıldızlı konaklama deneyimi')}</p>
          </div>
        </section>
        
        {/* Şubelerimiz Section */}
        <section className="py-12 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-neutral-800 font-heading">{t('branches', 'Şubelerimiz')}</h2>
              <p className="mt-2 text-neutral-600">{t('branches_description', 'Konaklama yapabileceğiniz şubelerimizi keşfedin')}</p>
            </div>
            
            {isLoadingHotels ? (
              <div className="animate-pulse grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="bg-neutral-100 rounded-lg h-40"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {hotels.map(hotel => {
                  // Yıldızları önceden hazırla
                  const starCount = hotel.stars || 0;
                  const starElements = [];
                  
                  for (let i = 0; i < starCount; i++) {
                    starElements.push(
                      <Star 
                        key={`star-${hotel.id}-${i}`} 
                        className="w-3 h-3 text-yellow-400 fill-yellow-400" 
                      />
                    );
                  }
                  
                  const isSelected = selectedHotel?.id === hotel.id;
                  
                  return (
                    <div 
                      key={hotel.id}
                      className={`relative overflow-hidden rounded-lg shadow-md transition-all duration-300 h-40
                        ${isSelected ? 'ring-2 ring-blue-500 scale-95' : 'hover:scale-95'}`}
                    >
                      <button 
                        onClick={() => setSelectedHotel(isSelected ? null : hotel)}
                        className="absolute inset-0 w-full h-full z-10"
                        aria-label={hotel.name}
                      />
                      <img 
                        src={hotel.imageUrl} 
                        alt={hotel.name} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3">
                        <h3 className="text-white text-sm font-bold line-clamp-1">{hotel.name}</h3>
                        <div className="flex items-center mt-1">
                          {starElements}
                        </div>
                        <div className="text-xs text-white/80 mt-1">{hotel.location}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
        
        {/* Selected Hotel Rooms Section */}
        {selectedHotel && (
          <section className="py-8 bg-neutral-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-800 font-heading">{selectedHotel.name} Odaları</h2>
                  <p className="mt-1 text-neutral-600">Konfor ve lüksten ödün vermeyenler için tasarlanmış odalar</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedHotel(null)}
                >
                  Tüm Otelleri Göster
                </Button>
              </div>
              
              <div className="space-y-4">
                {isLoadingRooms ? (
                  // Loading skeletons
                  Array(3).fill(0).map((_, index) => (
                    <div key={index} className="bg-white rounded-lg overflow-hidden shadow-lg">
                      <div className="flex flex-col md:flex-row">
                        <Skeleton className="h-48 w-full md:w-1/3" />
                        <div className="p-4 space-y-2 w-full md:w-2/3">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-full" />
                          <div className="flex justify-between items-center">
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-10 w-20" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : filteredRooms.length > 0 ? (
                  filteredRooms.map(room => (
                    <div key={room.id} className="bg-white rounded-lg overflow-hidden shadow transition-shadow hover:shadow-md">
                      <RoomCard 
                        room={room} 
                        onSelect={() => {}} 
                        onBook={(roomId) => {
                          // Odayı rezervasyon sayfasına yönlendir
                          const checkIn = new Date();
                          const checkOut = new Date();
                          checkOut.setDate(checkOut.getDate() + 1);
                          
                          window.location.href = `/reservations/new?roomId=${roomId}&hotelId=${room.hotelId}&checkIn=${format(checkIn, 'yyyy-MM-dd')}&checkOut=${format(checkOut, 'yyyy-MM-dd')}&adults=2&children=0`;
                        }}
                        showBookButton={true}
                      />
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center bg-white rounded-lg">
                    <h3 className="text-xl font-semibold text-neutral-800 mb-2">Oda Bulunamadı</h3>
                    <p className="text-neutral-600 mb-6">Bu otel için odalar henüz eklenmemiş.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </MainLayout>
  );
}
