import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Hotel, Room } from "@shared/schema";
import MainLayout from "@/components/layout/main-layout";
import RoomCard from "@/components/hotel/room-card";
import BookingPanel from "@/components/hotel/booking-panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselItem } from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { format, addDays, differenceInDays } from "date-fns";
import { tr } from 'date-fns/locale';
import { 
  MapPin, 
  Star, 
  Phone, 
  Mail, 
  Info, 
  Bed, 
  Utensils, 
  WifiIcon, 
  CarFront,
  Loader2,
  Clock,
  CreditCard,
  Users,
  FileWarning,
  ShowerHead,
  Tv,
  ShieldCheck,
  Coffee,
  Camera,
  Image,
  ChevronLeft,
  ChevronRight,
  CalendarIcon
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function HotelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const roomsSectionRef = useRef<HTMLDivElement>(null);
  
  // Oda için varsayılan fiyatı hesapla - tamamen takvim bazlı
  const calculateDefaultPrice = (room: Room, nights: number): number => {
    if (!room || !room.dailyPrices) return 0;
    
    try {
      const dailyPrices = JSON.parse(room.dailyPrices || '[]');
      if (dailyPrices.length === 0) return 0;
      
      // En son fiyatı varsayılan olarak kullan
      const defaultPrice = dailyPrices[dailyPrices.length - 1].price;
      return defaultPrice * nights;
    } catch (e) {
      console.error("Fiyat hesaplama hatası:", e);
      return 0;
    }
  };
  
  // Rezervasyon tarihleri için state'ler - Bugün ve yarın için güvenli tarih oluştur
  const today = new Date();
  const tomorrow = addDays(today, 1);
  
  // Tarih state'i
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({ from: today, to: tomorrow });
  
  // DateRange tipini işlemek için yardımcı fonksiyon
  const handleDateRangeSelect = (range: { from: Date | undefined; to?: Date | undefined } | undefined) => {
    if (range && range.from) {
      const from = range.from;
      // Eğer başlangıç tarihi seçilmiş ve bitiş tarihi seçilmemişse, bitiş tarihini otomatik olarak 1 gün sonraya ayarla
      const to = range.to || addDays(from, 1);
      setDateRange({ from, to });
    } else {
      // Eğer geçersiz seçim yapılırsa bugün ve yarını kullan
      setDateRange({ from: today, to: tomorrow });
    }
  };
  
  // Misafir sayısı için state'ler
  const [adultCount, setAdultCount] = useState<number>(2);
  const [childCount, setChildCount] = useState<number>(0);
  const [roomCount, setRoomCount] = useState<number>(1);
  
  // Fiyat hesaplama için değişkenler
  // Temel fiyat kullanılmayacak, sadece takvim bazlı fiyatlandırma kullanılacak
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [nightCount, setNightCount] = useState<number>(0);
  
  // Veri çekme 
  const { data: hotel, isLoading: isLoadingHotel } = useQuery<Hotel>({
    queryKey: [`/api/hotels/${id}`],
  });
  
  // Fetch rooms for this hotel
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery<Room[]>({
    queryKey: [`/api/hotels/${id}/rooms`],
    enabled: !!id,
  });
  
  // Tarih değiştiğinde fiyat güncelleme fonksiyonu
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      try {
        // Tarihler arasındaki farkı hesapla - gün başına
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        
        // Tarih objesinden saat bilgisini kaldır, sadece gün-ay-yıl kalsın
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);
        
        // Geceleme sayısını hesapla (gün farkı)
        // Math.max ile minimum 1 olduğunu garanti edelim - aynı gün seçildiğinde bile 1 gece olmalı
        const nights = Math.max(1, differenceInDays(toDate, fromDate));
        
        // Detaylı güncel tarih bilgisi
        console.log("Tarih hesaplama:", {
          from: fromDate.toISOString().split('T')[0],
          to: toDate.toISOString().split('T')[0],
          nights
        });
        
        // Geceleme sayısını güncelle
        setNightCount(nights);
        
        // Tüm odalar artık tamamen takvim bazlı fiyatlandırmaya geçti, temel fiyat kullanılmıyor
        const selectedRoomPrice = 0; // Takvim bazlı fiyat sistemi
        
        // Tarih bazlı dinamik fiyatlandırma (hafta sonu fiyatları daha yüksek)
        let dynamicTotal = 0;
        const currentDate = new Date(fromDate);
        
        // Seçilen tarih aralığı için her gün için fiyat hesapla
        for (let i = 0; i < nights; i++) {
          // O gün için kullanılacak baz fiyat
          let dayPrice = selectedRoomPrice;
          
          // Eğer bir odaya ait takvim bazlı fiyat varsa, onu kullan
          if (selectedRoomId) {
            const room = rooms.find(r => r.id === selectedRoomId);
            if (room) {
              try {
                // Günlük fiyatları kontrol et
                if (room.dailyPrices) {
                  const dailyPrices = JSON.parse(room.dailyPrices || '[]');
                  // Eğer bu tarih için özel fiyat varsa, onu kullan
                  // Biz sadece tarih kısmını alıp karşılaştırmamız gerekiyor
                  // Ancak dikkat etmemiz gereken bir şey var:
                  // Backend'den gelen tarihler UTC 'dir ve "T21:00:00.000Z" gibi bir zaman damgası içerir
                  // Bu nedenle, tarihleri düzgün karşılaştırmak için tarih karşılaştırma işlevini güncellemeliyiz
                  
                  const dateStr = format(currentDate, 'yyyy-MM-dd');
                  console.log("Aranan tarih:", dateStr);
                  
                  // Gelen fiyatları debug etmek için logla
                  if (dailyPrices.length > 0) {
                    console.log("dailyPrices içeriği:", JSON.stringify(dailyPrices));
                    console.log("Düzenlenmiş fiyatlar:", dailyPrices.map((dp: any) => {
                      const dateString = typeof dp.date === 'string' ? dp.date : JSON.stringify(dp.date);
                      return {
                        fullDate: dateString,
                        dateOnly: dateString.substring(0, 10),
                        price: dp.price
                      };
                    }));
                  }
                  
                  // Gelen tarihleri düzgün ayıklayabilmek için daha sağlam bir yaklaşım kullan
                  const specificDayPrice = dailyPrices.find((dp: any) => {
                    // dp.date bir string olabilir veya bir obje olabilir
                    const dateString = typeof dp.date === 'string' ? dp.date : JSON.stringify(dp.date);
                    // Sadece tarihin ilk 10 karakteri (yyyy-MM-dd kısmı) ile karşılaştırma yap
                    return dateString.substring(0, 10) === dateStr;
                  });
                  
                  if (specificDayPrice) {
                    dayPrice = specificDayPrice.price;
                  } else {
                    // Haftalık fiyatları kontrol et
                    if (room.weekdayPrices) {
                      const weekdayPrices = JSON.parse(room.weekdayPrices || '[]');
                      const dayOfWeek = currentDate.getDay();
                      const weekdayPrice = weekdayPrices.find((wp: any) => wp.dayIndex === dayOfWeek);
                      
                      if (weekdayPrice) {
                        dayPrice = weekdayPrice.price;
                      }
                    }
                  }
                }
              } catch (e) {
                console.error("Fiyat parse hatası:", e);
              }
            }
          } else {
            // Oda seçilmemişse genel fiyatlandırmayı kullan
            const dayOfWeek = currentDate.getDay();
            const month = currentDate.getMonth();
            
            // Hafta sonu (Cuma, Cumartesi) için %20 zamlı
            const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
            // Yaz ayları (Haziran-Ağustos) için %30 zamlı
            const isSummer = month >= 5 && month <= 7;
            // Yılbaşı ve özel günler (örnek olarak)
            const isHoliday = month === 11 && currentDate.getDate() >= 27; // Yılbaşı dönemi
            
            if (isWeekend) dayPrice *= 1.2; // %20 zamlı
            if (isSummer) dayPrice *= 1.3; // %30 zamlı
            if (isHoliday) dayPrice *= 1.5; // %50 zamlı
          }
          
          // Günün fiyatını toplam fiyata ekle
          dynamicTotal += dayPrice;
          // Sonraki güne geç
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Eğer hesaplanan fiyat 0 ise ve takvim bazlı fiyat yoksa varsayılan bir fiyat gösterelim
        console.log(`dynamicTotal: ${dynamicTotal}, selectedRoomPrice: ${selectedRoomPrice}, nights: ${nights}`);
        
        if (dynamicTotal <= 0) {
          // Odanın seçili olup olmadığını kontrol et
          const selectedRoom = selectedRoomId ? rooms.find(r => r.id === selectedRoomId) : null;
          
          // Eğer oda seçili ise ve odanın dailyPrices/weekdayPrices alanları varsa ama boşsa
          if (selectedRoom) {
            console.log("Seçili oda fiyat bilgileri:", {
              dailyPrices: selectedRoom.dailyPrices ? `Length: ${JSON.parse(selectedRoom.dailyPrices || '[]').length}` : 'NULL',
              weekdayPrices: selectedRoom.weekdayPrices ? `Length: ${JSON.parse(selectedRoom.weekdayPrices || '[]').length}` : 'NULL'
            });
            
            // Eğer dailyPrices ve weekdayPrices tamamıyla boş diziler ise veya null ise
            const noDailyPrices = !selectedRoom.dailyPrices || JSON.parse(selectedRoom.dailyPrices).length === 0;
            const noWeekdayPrices = !selectedRoom.weekdayPrices || JSON.parse(selectedRoom.weekdayPrices).length === 0;
            
            if (noDailyPrices && noWeekdayPrices) {
              console.log("Hiç takvim bazlı fiyat bulunamadı, odanın güncel fiyatını alıyoruz");
              // Get price from first entry in dailyPrices if it exists, or use the first entry from room data
              const roomDailyPrices = selectedRoom.dailyPrices ? JSON.parse(selectedRoom.dailyPrices) : [];
              const firstAvailablePrice = roomDailyPrices.length > 0 ? roomDailyPrices[0].price : 0;
              dynamicTotal = (selectedRoomPrice > 0 ? selectedRoomPrice : firstAvailablePrice) * nights;
            } else {
              console.log("Takvim bazlı fiyatlar mevcut ama seçili tarihler için fiyat bulunamadı");
              // Get the most recent price from the dailyPrices
              const roomDailyPrices = selectedRoom.dailyPrices ? JSON.parse(selectedRoom.dailyPrices) : [];
              const latestPrice = roomDailyPrices.length > 0 ? roomDailyPrices[roomDailyPrices.length - 1].price : 0;
              dynamicTotal = (selectedRoomPrice > 0 ? selectedRoomPrice : latestPrice) * nights;
            }
          } else {
            // Oda seçili değilse seçili odalar arasından en uygun fiyatlı odayı göster
            // Get the cheapest price from available rooms
            let bestPrice = 0;
            
            // Try to find dynamic pricing for each room
            if (rooms && rooms.length > 0) {
              rooms.forEach((room) => {
                if (room.dailyPrices) {
                  try {
                    const roomDailyPrices = JSON.parse(room.dailyPrices);
                    if (roomDailyPrices.length > 0) {
                      const latestPrice = roomDailyPrices[roomDailyPrices.length - 1].price;
                      if (latestPrice > 0 && (bestPrice === 0 || latestPrice < bestPrice)) {
                        bestPrice = latestPrice;
                      }
                    }
                  } catch (e) {
                    console.error("Failed to parse daily prices", e);
                  }
                }
              });
            }
            
            dynamicTotal = (selectedRoomPrice > 0 ? selectedRoomPrice : bestPrice) * nights;
          }
        }
        
        setTotalPrice(dynamicTotal);
        
        // Konsola güncel geceleme sayısını yazdır
        console.log("Güncel geceleme sayısı:", nights);
        console.log("Hesaplanan toplam fiyat:", dynamicTotal);
      } catch (error) {
        console.error("Tarih hesaplama hatası:", error);
        setNightCount(1); // Varsayılan olarak 1 gece
        
        // Find the best available price from rooms
        let defaultPrice = 0;
        if (rooms && rooms.length > 0) {
          rooms.forEach((room) => {
            if (room.dailyPrices) {
              try {
                const roomDailyPrices = JSON.parse(room.dailyPrices);
                if (roomDailyPrices.length > 0) {
                  const latestPrice = roomDailyPrices[roomDailyPrices.length - 1].price;
                  if (latestPrice > 0 && (defaultPrice === 0 || latestPrice < defaultPrice)) {
                    defaultPrice = latestPrice;
                  }
                }
              } catch (e) {
                console.error("Failed to parse daily prices", e);
              }
            }
          });
        }
        
        setTotalPrice(defaultPrice || 0);
      }
    } else {
      // Tarih seçilmemişse veya geçersizse
      setNightCount(1); // Varsayılan olarak 1 gece
      
      // Find the best available price from rooms
      let defaultPrice = 0;
      if (rooms && rooms.length > 0) {
        rooms.forEach((room) => {
          if (room.dailyPrices) {
            try {
              const roomDailyPrices = JSON.parse(room.dailyPrices);
              if (roomDailyPrices.length > 0) {
                const latestPrice = roomDailyPrices[roomDailyPrices.length - 1].price;
                if (latestPrice > 0 && (defaultPrice === 0 || latestPrice < defaultPrice)) {
                  defaultPrice = latestPrice;
                }
              }
            } catch (e) {
              console.error("Failed to parse daily prices", e);
            }
          }
        });
      }
      
      setTotalPrice(defaultPrice || 0);
    }
  }, [dateRange, selectedRoomId, rooms]);
  
  // Otel ve oda resimlerini birleştir ve görüntüle
  const getHotelImages = () => {
    // Otel resimleri
    const mainHotelImage = hotel?.imageUrl ? [hotel.imageUrl] : [];
    
    // Oda resimleri
    const roomImages = rooms && rooms.length > 0 
      ? rooms.map(room => room.imageUrl).filter(url => url)
      : [];
    
    // Eğer hiç resim yoksa varsayılan resimler göster
    if (mainHotelImage.length === 0 && roomImages.length === 0) {
      return [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3", // Otel Odası
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3", // Otel Lobisi
        "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?ixlib=rb-4.0.3", // Otel Havuzu
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3", // Otel Manzarası
      ];
    }
    
    return [...mainHotelImage, ...roomImages];
  };
  
  const hotelImages = getHotelImages();
  
  // Slayt değiştirme fonksiyonları
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? hotelImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === hotelImages.length - 1 ? 0 : prev + 1));
  };
  
  const handleThumbnailClick = (index: number) => {
    setCurrentImageIndex(index);
  };
  
  // Oda seçme fonksiyonu
  const handleRoomSelect = (roomId: number) => {
    setSelectedRoomId(prevSelectedId => prevSelectedId === roomId ? null : roomId);
  };
  
  // Oda görünümüne smooth scroll
  const scrollToRooms = () => {
    roomsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Rezervasyon oluşturma fonksiyonu
  const handleBookRoom = (roomId: number) => {
    if (!dateRange.from || !dateRange.to) {
      return;
    }
    
    const checkIn = format(dateRange.from, 'yyyy-MM-dd');
    const checkOut = format(dateRange.to, 'yyyy-MM-dd');
    
    window.location.href = `/reservations/new?roomId=${roomId}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adultCount}&children=${childCount}`;
  };
  
  if (isLoadingHotel) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  if (!hotel) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Otel Bulunamadı</h1>
          <p className="mb-6">İstediğiniz otel bilgilerine ulaşılamadı.</p>
          <Button onClick={() => setLocation("/hotels")}>
            Otellere Dön
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      {/* Otel Adı ve Yıldızlar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-1">
        <div className="flex items-center gap-1 mb-1">
          {Array.from({ length: hotel.stars }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
          ))}
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-neutral-800 dark:text-white font-heading">{hotel.name}</h1>
      </div>
      
      {/* Gelişmiş Görsel Galerisi */}
      <section className="py-2">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-12 gap-2">
            {/* Büyük Ana Görsel - Sol Taraf (Slayt Gösterisi) */}
            <div className="col-span-12 sm:col-span-7 md:col-span-8 bg-white dark:bg-neutral-800 rounded-lg shadow-sm overflow-hidden">
              <div className="relative w-full h-[300px] sm:h-[300px]">
                {/* Ana Görsel */}
                <img 
                  src={hotelImages[currentImageIndex]} 
                  alt={`${hotel.name} - Görsel ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
                
                {/* Slayt kontrolü sol/sağ oklar */}
                <div className="absolute inset-0 flex items-center justify-between">
                  <button 
                    onClick={handlePrevImage}
                    className="ml-2 bg-white/70 dark:bg-neutral-800/70 rounded-full p-1.5 hover:bg-white dark:hover:bg-neutral-700 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-neutral-800 dark:text-white" />
                  </button>
                  <button 
                    onClick={handleNextImage}
                    className="mr-2 bg-white/70 dark:bg-neutral-800/70 rounded-full p-1.5 hover:bg-white dark:hover:bg-neutral-700 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-neutral-800 dark:text-white" />
                  </button>
                </div>
                
                {/* Görsel indikatörü */}
                <div className="absolute bottom-3 right-3 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-white bg-opacity-70 dark:bg-opacity-70 py-1 px-3 rounded-full text-xs font-medium">
                  <Camera className="h-3 w-3 inline-block mr-1.5" />
                  {currentImageIndex + 1} / {hotelImages.length}
                </div>
              </div>
            </div>
            
            {/* Yatay Kaydırmalı Tek Sıra Galeri */}
            <div className="col-span-12 sm:col-span-5 md:col-span-4 mt-0">
              <div className="overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0">
                <div className="flex space-x-2 min-w-max">
                  {/* Görüntü için tıklanabilir thumbnails */}
                  {hotelImages.map((image, index) => (
                    <div 
                      key={index}
                      className={`flex-shrink-0 bg-white dark:bg-neutral-800 rounded-lg shadow-sm overflow-hidden cursor-pointer transition-all hover:opacity-90 hover:scale-[1.03] hover:shadow-md ${
                        currentImageIndex === index ? 'ring-2 ring-primary scale-[1.02]' : ''
                      }`}
                      onClick={() => handleThumbnailClick(index)}
                    >
                      <div className="relative w-20 h-20 sm:w-28 sm:h-28">
                        <img 
                          src={image} 
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Otel Bilgileri - Özet Kart */}
      <section className="py-2">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-3">
            {/* Özellikler ve kurallar */}
            <div className="flex flex-wrap gap-2 mb-3">
              <div className="flex items-center px-2 py-1 bg-neutral-100 dark:bg-neutral-900 rounded-full">
                <Star className="h-3.5 w-3.5 text-primary mr-1" />
                <span className="text-xs">{hotel.rating} Puan</span>
              </div>
              
              <div className="flex items-center px-2 py-1 bg-neutral-100 dark:bg-neutral-900 rounded-full">
                <MapPin className="h-3.5 w-3.5 text-primary mr-1" />
                <span className="text-xs">{hotel.address}</span>
              </div>
              
              <div className="flex items-center px-2 py-1 bg-neutral-100 dark:bg-neutral-900 rounded-full">
                <Clock className="h-3.5 w-3.5 text-primary mr-1" />
                <span className="text-xs">14:00 / 12:00</span>
              </div>
              
              <div className="flex items-center px-2 py-1 bg-neutral-100 dark:bg-neutral-900 rounded-full">
                <Users className="h-3.5 w-3.5 text-primary mr-1" />
                <span className="text-xs">0-6 yaş ücretsiz</span>
              </div>
              
              <div className="flex items-center px-2 py-1 bg-neutral-100 dark:bg-neutral-900 rounded-full">
                <CreditCard className="h-3.5 w-3.5 text-primary mr-1" />
                <span className="text-xs">Nakit / Kart</span>
              </div>
              
              <div className="flex items-center px-2 py-1 bg-neutral-100 dark:bg-neutral-900 rounded-full">
                <FileWarning className="h-3.5 w-3.5 text-primary mr-1" />
                <span className="text-xs">24s iptal ücretsiz</span>
              </div>
              
              <div className="flex items-center px-2 py-1 bg-neutral-100 dark:bg-neutral-900 rounded-full">
                <WifiIcon className="h-3.5 w-3.5 text-primary mr-1" />
                <span className="text-xs">Wi-Fi</span>
              </div>
              
              <div className="flex items-center px-2 py-1 bg-neutral-100 dark:bg-neutral-900 rounded-full">
                <Coffee className="h-3.5 w-3.5 text-primary mr-1" />
                <span className="text-xs">Kahvaltı</span>
              </div>
            </div>
            
            {/* İletişim Bilgisi - Masaüstü görünümü */}
            <div className="hidden md:flex items-center justify-center mt-2">
              <a 
                href={`tel:${hotel.phone || '+902125554433'}`}
                className="flex items-center bg-primary/10 hover:bg-primary/15 px-4 py-2.5 rounded-lg transition-colors"
              >
                <Phone className="h-5 w-5 text-primary mr-2" />
                <span className="text-base font-semibold text-primary">{hotel.phone || "+90 (212) 555 44 33"}</span>
              </a>
            </div>
            
            {/* İletişim Bilgisi - Mobil görünümü (iOS/Android buton stili) */}
            <div className="flex md:hidden items-center justify-center mt-3 mb-1">
              <a 
                href={`tel:${hotel.phone || '+902125554433'}`}
                className="flex items-center justify-center w-4/5 mx-auto bg-primary text-white py-2 px-3 rounded-xl shadow-md active:scale-95 transition-transform scale-80"
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  WebkitAppearance: 'none',
                  WebkitBoxShadow: '0 4px 8px rgba(0, 0, 0, 0.12)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRight: '1px solid rgba(255, 255, 255, 0.2)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.5)',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.5)',
                }}
              >
                <Phone className="h-4 w-4 mr-2" />
                <span className="font-medium">Hemen Ara</span>
              </a>
            </div>
          </div>
        </div>
      </section>
      
      {/* Rezervasyon Bilgileri ve Fiyatlandırma */}
      <section className="py-3" id="booking">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold">Oda ve Fiyat Bilgisi</h2>
            <p className="text-sm text-neutral-500 mt-1">Lütfen tarih ve kişi sayısı seçerek uygun odaları görüntüleyiniz.</p>
          </div>
          
          {/* Rezervasyon Filtreleme Paneli */}
          <BookingPanel 
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeSelect}
            adultCount={adultCount}
            onAdultCountChange={setAdultCount}
            childCount={childCount}
            onChildCountChange={setChildCount}
            roomCount={roomCount}
            onRoomCountChange={setRoomCount}
            nightCount={nightCount}
            totalPrice={totalPrice}
            onSearch={scrollToRooms}
          />
        </div>
      </section>
      
      {/* Otel Detayları Tabları */}
      <section className="py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="about" className="w-full">
            <TabsList className="grid grid-cols-4 mb-2">
              <TabsTrigger value="about">Hakkında</TabsTrigger>
              <TabsTrigger value="amenities">Olanaklar</TabsTrigger>
              <TabsTrigger value="rules">Kurallar</TabsTrigger>
              <TabsTrigger value="location">Konum</TabsTrigger>
            </TabsList>
            
            <TabsContent value="about" className="bg-white dark:bg-neutral-800 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2">Otel Hakkında</h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">
                {hotel.description}
              </p>
              
              <div className="mt-4">
                <h4 className="font-bold text-base mb-2">Temalar ve Özellikler</h4>
                <div className="flex flex-wrap gap-2">
                  {hotel.amenities.map((amenity, index) => (
                    <Badge key={index} variant="outline" className="bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="amenities" className="bg-white dark:bg-neutral-800 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2">Otel Olanakları</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-neutral-100 dark:bg-neutral-700 rounded-full p-2 mr-3">
                    <WifiIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-base">Ücretsiz Wi-Fi</h4>
                    <p className="text-sm text-neutral-500 mt-1">Tüm odalarda ve ortak alanlarda yüksek hızlı internet.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-neutral-100 dark:bg-neutral-700 rounded-full p-2 mr-3">
                    <Utensils className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-base">Restoran</h4>
                    <p className="text-sm text-neutral-500 mt-1">Modern ve lezzetli yemek seçenekleri sunan restoran.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-neutral-100 dark:bg-neutral-700 rounded-full p-2 mr-3">
                    <Bed className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-base">Premium Yataklar</h4>
                    <p className="text-sm text-neutral-500 mt-1">Rahat ve kaliteli ortopedik yataklar.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-neutral-100 dark:bg-neutral-700 rounded-full p-2 mr-3">
                    <ShowerHead className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-base">Jakuzili Banyolar</h4>
                    <p className="text-sm text-neutral-500 mt-1">Özel odalarda jakuzi ve lüks banyo ürünleri.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-neutral-100 dark:bg-neutral-700 rounded-full p-2 mr-3">
                    <Tv className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-base">Smart TV</h4>
                    <p className="text-sm text-neutral-500 mt-1">Tüm odalarda akıllı TV ve uydu kanalları.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-neutral-100 dark:bg-neutral-700 rounded-full p-2 mr-3">
                    <CarFront className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-base">Ücretsiz Otopark</h4>
                    <p className="text-sm text-neutral-500 mt-1">Otel misafirlerine özel ücretsiz otopark.</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="rules" className="bg-white dark:bg-neutral-800 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2">Otel Kuralları</h3>
              
              <div className="mt-2 space-y-4">
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-base">Giriş ve Çıkış Saatleri</h4>
                    <p className="text-sm text-neutral-500 mt-1">Giriş saati 14:00'ten itibaren, çıkış saati en geç 12:00'dir.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <FileWarning className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-base">İptal Politikası</h4>
                    <p className="text-sm text-neutral-500 mt-1">Girişten 24 saat öncesine kadar yapılan iptaller ücretsizdir. Daha sonra yapılan iptallerde bir gecelik konaklama ücreti tahsil edilir.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Users className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-base">Çocuk Politikası</h4>
                    <p className="text-sm text-neutral-500 mt-1">0-6 yaş arası çocuklar ücretsiz konaklayabilir. 7-12 yaş arası çocuklar için %50 indirimli ücret uygulanır.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <ShieldCheck className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-base">Güvenlik</h4>
                    <p className="text-sm text-neutral-500 mt-1">Otelimizde 24 saat güvenlik personeli bulunmaktadır. Kıymetli eşyalarınız için resepsiyonda ücretsiz kasa hizmeti verilmektedir.</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="location" className="bg-white dark:bg-neutral-800 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2">Konum Bilgisi</h3>
              
              <div className="mt-2">
                <div className="aspect-video bg-neutral-100 dark:bg-neutral-900 rounded-lg mb-4 overflow-hidden">
                  <img 
                    src="https://maps.googleapis.com/maps/api/staticmap?center=41.0082,28.9784&zoom=15&size=600x400&maptype=roadmap&markers=color:red%7C41.0082,28.9784&key=YOUR_API_KEY" 
                    alt="Otel Konumu"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex items-start mb-4">
                  <MapPin className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-base">Adres</h4>
                    <p className="text-sm text-neutral-500 mt-1">{hotel.address}</p>
                  </div>
                </div>
                
                <div className="flex items-start mb-4">
                  <Mail className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-base">E-posta</h4>
                    <p className="text-sm text-neutral-500 mt-1">info@vipinnhotels.com</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-base">Telefon</h4>
                    <p className="text-sm text-neutral-500 mt-1">{hotel.phone || "Telefon bilgisi yok"}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
      
      {/* Oda Listesi */}
      <section className="py-4" ref={roomsSectionRef}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold mb-4">Odalar ve Fiyatlar</h2>
          
          <div className="space-y-4">
            {isLoadingRooms ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
                  <Bed className="h-6 w-6 text-neutral-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">Odalar Bulunamadı</h3>
                <p className="text-neutral-500">Bu otelde şu anda uygun oda bulunmamaktadır.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {rooms.map(room => (
                  <RoomCard 
                    key={room.id}
                    room={room}
                    onBook={(roomId) => {
                      if (!dateRange.from || !dateRange.to) {
                        toast({
                          title: "Tarih seçilmedi",
                          description: "Lütfen rezervasyon yapmak için tarih seçiniz.",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      const checkIn = format(dateRange.from, 'yyyy-MM-dd');
                      const checkOut = format(dateRange.to, 'yyyy-MM-dd');
                      
                      window.location.href = `/reservations/new?roomId=${roomId}&hotelId=${hotel?.id}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adultCount}&children=${childCount}`;
                    }}
                    bookingInfo={{
                      dateRange, 
                      adultCount, 
                      childCount, 
                      nightCount, 
                      totalPriceCalculated: selectedRoomId === room.id ? totalPrice : calculateDefaultPrice(room, nightCount)
                    }}
                    selected={selectedRoomId === room.id}
                    onSelect={() => handleRoomSelect(room.id)}
                    showBookButton={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}