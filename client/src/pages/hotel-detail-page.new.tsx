import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Hotel, Room } from "@shared/schema";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import RoomList from "@/components/hotel/room-list";
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
  const [basePrice, setBasePrice] = useState<number>(1000); // TL cinsinden temel fiyat
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [nightCount, setNightCount] = useState<number>(0);
  
  // Tarih değiştiğinde fiyat güncelleme fonksiyonu
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      try {
        const nights = differenceInDays(dateRange.to, dateRange.from);
        
        if (nights > 0) {
          setNightCount(nights);
          
          // Tarih bazlı dinamik fiyatlandırma (hafta sonu fiyatları daha yüksek)
          let dynamicTotal = 0;
          const currentDate = new Date(dateRange.from);
          
          for (let i = 0; i < nights; i++) {
            // Gün ve ay bazlı fiyat çarpanları
            const dayOfWeek = currentDate.getDay();
            const month = currentDate.getMonth();
            
            // Hafta sonu (Cuma, Cumartesi) için %20 zamlı
            const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
            // Yaz ayları (Haziran-Ağustos) için %30 zamlı
            const isSummer = month >= 5 && month <= 7;
            // Yılbaşı ve özel günler (örnek olarak)
            const isHoliday = month === 11 && currentDate.getDate() >= 27; // Yılbaşı dönemi
            
            let dayPrice = basePrice;
            
            if (isWeekend) dayPrice *= 1.2; // %20 zamlı
            if (isSummer) dayPrice *= 1.3; // %30 zamlı
            if (isHoliday) dayPrice *= 1.5; // %50 zamlı
            
            dynamicTotal += dayPrice;
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          setTotalPrice(dynamicTotal);
        } else {
          setNightCount(0);
          setTotalPrice(0);
        }
      } catch (error) {
        console.error("Tarih hesaplama hatası:", error);
        setNightCount(1); // Varsayılan olarak 1 gece
        setTotalPrice(basePrice); // Varsayılan fiyat
      }
    } else {
      // Tarih seçilmemişse veya geçersizse
      setNightCount(1); // Varsayılan olarak 1 gece
      setTotalPrice(basePrice); // Varsayılan fiyat
    }
  }, [dateRange, basePrice]);
  
  // Örnek otel fotoğrafları (gerçek API entegrasyonunda bu veriler API'den gelecektir)
  const hotelImages = [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3", // Otel Odası
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3", // Otel Lobisi
    "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?ixlib=rb-4.0.3", // Otel Havuzu
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3", // Otel Manzarası
  ];
  
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
  
  // Odalar bölümüne kaydırma
  const scrollToRooms = () => {
    if (roomsSectionRef.current) {
      roomsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Fetch hotel details
  const { data: hotel, isLoading: isLoadingHotel } = useQuery<Hotel>({
    queryKey: [`/api/hotels/${id}`],
  });
  
  // Fetch rooms for this hotel
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery<Room[]>({
    queryKey: [`/api/hotels/${id}/rooms`],
    enabled: !!id,
  });
  
  // Rezervasyon seçimi
  const handleRoomSelect = (roomId: number) => {
    setSelectedRoomId(roomId);
    console.log(`Redirecting to: /reservations/new?roomId=${roomId}`);
    
    // Tarih ve misafir bilgilerini de ekleyerek yönlendirme yap
    const checkIn = format(dateRange.from, 'yyyy-MM-dd');
    const checkOut = format(dateRange.to, 'yyyy-MM-dd');
    
    window.location.href = `/reservations/new?roomId=${roomId}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adultCount}&children=${childCount}`;
  };
  
  if (isLoadingHotel) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!hotel) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Otel Bulunamadı</h1>
            <p className="mb-6">İstediğiniz otel bilgilerine ulaşılamadı.</p>
            <Button onClick={() => setLocation("/hotels")}>
              Otellere Dön
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
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
              
              {/* Küçük Görseller Grid - Sağ Taraf */}
              <div className="col-span-12 sm:col-span-5 md:col-span-4 mt-0">
                <div className="grid grid-cols-4 sm:grid-cols-2 gap-2 h-full">
                  {/* Görüntü için tıklanabilir thumbnails */}
                  {hotelImages.map((image, index) => (
                    <div 
                      key={index}
                      className={`bg-white dark:bg-neutral-800 rounded-lg shadow-sm overflow-hidden cursor-pointer transition-all hover:opacity-90 hover:scale-[1.03] hover:shadow-md ${
                        currentImageIndex === index ? 'ring-2 ring-primary scale-[1.02]' : ''
                      }`}
                      onClick={() => handleThumbnailClick(index)}
                    >
                      <div className="relative w-full h-[80px] sm:h-[146px]">
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
                  href="tel:+902125554433" 
                  className="flex items-center bg-primary/10 hover:bg-primary/15 px-4 py-2.5 rounded-lg transition-colors"
                >
                  <Phone className="h-5 w-5 text-primary mr-2" />
                  <span className="text-base font-semibold text-primary">+90 (212) 555 44 33</span>
                </a>
              </div>
              
              {/* İletişim Bilgisi - Mobil görünümü (iOS/Android buton stili) */}
              <div className="flex md:hidden items-center justify-center mt-3 mb-1">
                <a 
                  href="tel:+902125554433" 
                  className="flex items-center justify-center w-full bg-primary text-white py-3 px-4 rounded-xl shadow-md active:scale-95 transition-transform"
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
              <h2 className="text-xl font-bold text-neutral-800 dark:text-white font-heading">Rezervasyon Yap</h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                En uygun fiyatları görmek için tarihleri seçin
              </p>
            </div>

            {/* Rezervasyon Paneli Bileşeni */}
            <BookingPanel 
              dateRange={dateRange}
              onDateChange={handleDateRangeSelect}
              nightCount={nightCount}
              basePrice={basePrice}
              totalPrice={totalPrice}
              onViewRooms={scrollToRooms}
            />
            
            {/* Oda Listesi Bölümü */}
            <section className="py-6" id="rooms-section" ref={roomsSectionRef}>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-neutral-800 dark:text-white font-heading">Odalarımız</h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Seçtiğiniz tarihlerde uygun odalar ve fiyatları
                </p>
              </div>
              
              <RoomList 
                rooms={rooms}
                isLoading={isLoadingRooms}
                selectedDates={dateRange}
                nightCount={nightCount}
                onRoomSelect={handleRoomSelect}
                previewImages={hotelImages}
              />
            </section>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}