import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Hotel, Room } from "@shared/schema";
import MainLayout from "@/components/layout/main-layout";
import RoomCard from "@/components/hotel/room-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useDeviceType } from "@/hooks/use-mobile";
import { Calendar as CalendarIcon, ArrowUp, ArrowDown, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, isValid, differenceInCalendarDays } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

// FİYAT HESAPLAMA YARDIMCI FONKSİYONU
const getRoomTotalPrice = (room, dateRange) => {
  if (!room.dailyPrices || !dateRange) return 0;
  try {
    const arr = typeof room.dailyPrices === "string" ? JSON.parse(room.dailyPrices) : room.dailyPrices;
    let total = 0;
    // Tarih aralığına göre toplam fiyatı bul
    for (
      let d = new Date(dateRange.from);
      d <= dateRange.to;
      d.setDate(d.getDate() + 1)
    ) {
      const dayStr = d.toISOString().slice(0, 10);
      const priceObj = arr.find(p => p.date === dayStr);
      if (priceObj) {
        total += priceObj.price;
      }
    }
    return total;
  } catch {
    return 0;
  }
};

export default function HomePage() {
  const { t } = useTranslation();
  const { data: hotels = [], isLoading: isLoadingHotels } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
  });
  const { data: rooms = [], isLoading: isLoadingRooms } = useQuery<Room[]>({
    queryKey: ['/api/rooms'],
  });

  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const [, setLocation] = useLocation();

  // Tarih seçim state'leri
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(addDays(new Date(), 1));

  // Filtreleme state'leri
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);

  // Sıralama state'i (fiyat azalan/artan)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Gece sayısı hesaplama
  const nightCount = (startDate && endDate && isValid(startDate) && isValid(endDate))
    ? Math.max(1, differenceInCalendarDays(endDate, startDate))
    : 1;

  // Tarih aralığı
  const dateRange = (startDate && endDate) ? { from: startDate, to: endDate } : undefined;

  // ODA FİLTRELEME ve FİYATA GÖRE SIRALAMA
  const filteredRooms = rooms
    .filter(room => {
      const matchesHotel = selectedHotelId ? room.hotelId === selectedHotelId : true;
      return matchesHotel;
    })
    .sort((a, b) => {
      const aPrice = getRoomTotalPrice(a, dateRange);
      const bPrice = getRoomTotalPrice(b, dateRange);
      return sortOrder === 'asc' ? aPrice - bPrice : bPrice - aPrice;
    });

  // Hotel adı alma
  const getHotelName = (hotelId: number) => {
    return hotels.find(h => h.id === hotelId)?.name || '';
  };

  return (
    <MainLayout>
      <main className="flex-grow bg-neutral-50">
        {/* Hero Section */}
        <section className="relative bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3')" }}>
          <div className="absolute inset-0 bg-black opacity-40"></div>
          <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white font-heading mb-4">{t('luxury_tagline')}</h1>
            <p className="text-lg md:text-xl text-white mb-8 max-w-3xl">{t('hero_description', 'Türkiye\'nin en prestijli otel zinciri ile unutulmaz bir konaklama deneyimi yaşayın. Vipinn Hotels ailesi olarak her anınızı özel kılmak için sizleri bekliyoruz.')}</p>
            <Button asChild size="lg">
              <Link href="/hotels">
                {t('discover_hotels', 'Otelleri Keşfedin')}
              </Link>
            </Button>
          </div>
        </section>

        {/* Calendar and Date Selection */}
        <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
          <Card className="shadow-xl overflow-hidden border-2 border-[#2094f3]">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Şube (Hotel) Seçici */}
                  <div className="space-y-1">
                    <Label htmlFor="hotel" className="text-sm">Şube</Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <Select
                        value={selectedHotelId?.toString() || 'all'}
                        onValueChange={(value) => setSelectedHotelId(value !== 'all' ? parseInt(value) : null)}
                      >
                        <SelectTrigger id="hotel" className="pl-10 border-2 border-[#2094f3] h-12">
                          <SelectValue placeholder="Tüm Şubeler" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tüm Şubeler</SelectItem>
                          {hotels.map(hotel => (
                            <SelectItem key={hotel.id} value={hotel.id.toString()}>
                              {hotel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Tarih seçici */}
                  <div className="space-y-1">
                    <Label htmlFor="date-range" className="text-sm">Tarih Aralığı</Label>
                    {!isMobile ? (
                      <div className="w-full">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start border-2 border-[#2094f3] h-12 text-left font-normal shadow-md hover:shadow-lg bg-white dark:bg-neutral-900 transition-all"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 text-[#2094f3]" />
                              <div className="flex items-center">
                                <span className="font-medium text-black dark:text-white">
                                  {startDate && endDate
                                    ? `${format(startDate, 'd MMM', { locale: tr })} - ${format(endDate, 'd MMM yyyy', { locale: tr })}`
                                    : "Tarih Seçin"}
                                </span>
                              </div>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-2 border-2 border-[#2094f3] rounded-xl shadow-2xl w-auto max-w-3xl" align="start">
                            <Calendar
                              mode="range"
                              selected={{ from: startDate, to: endDate }}
                              onSelect={(range) => {
                                if (range?.from) setStartDate(range.from);
                                if (range?.to) setEndDate(range.to);
                              }}
                              initialFocus
                              locale={tr}
                              className="bg-white dark:bg-neutral-900 rounded-lg"
                              disabled={[(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                return date < today;
                              }]}
                            />
                            <div className="p-2 flex justify-center">
                              <Button className="bg-[#2094f3] text-white hover:bg-[#2094f3]/90 w-full">
                                Tarihleri Onayla
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    ) : (
                      <div className="w-full">
                        <Drawer>
                          <DrawerTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-center border-2 border-[#2094f3] h-12 font-normal shadow-md hover:shadow-lg bg-white dark:bg-neutral-900 transition-all"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 text-[#2094f3]" />
                              <span className="font-medium text-black dark:text-white">
                                {startDate && endDate
                                  ? `${format(startDate, 'd MMM', { locale: tr })} - ${format(endDate, 'd MMM', { locale: tr })}`
                                  : "Tarih Seçin"}
                              </span>
                            </Button>
                          </DrawerTrigger>
                          <DrawerContent className="focus:outline-none">
                            <DrawerHeader>
                              <DrawerTitle>Tarihleri Seçin</DrawerTitle>
                            </DrawerHeader>
                            <div className="px-4">
                              <Calendar
                                mode="range"
                                selected={{ from: startDate, to: endDate }}
                                onSelect={(range) => {
                                  if (range?.from) setStartDate(range.from);
                                  if (range?.to) setEndDate(range.to);
                                }}
                                initialFocus
                                locale={tr}
                                className="w-full bg-white dark:bg-neutral-900 rounded-lg"
                                disabled={[(date) => {
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  return date < today;
                                }]}
                              />
                            </div>
                            <DrawerFooter>
                              <DrawerClose asChild>
                                <Button className="bg-[#2094f3] text-white hover:bg-[#2094f3]/90 w-full">
                                  Tarihleri Onayla
                                </Button>
                              </DrawerClose>
                            </DrawerFooter>
                          </DrawerContent>
                        </Drawer>
                      </div>
                    )}
                  </div>

                  {/* Sıralama butonları */}
                  <div className="space-y-1">
                    <Label htmlFor="sort-order" className="text-sm">Fiyat Sıralama</Label>
                    <div className="grid grid-cols-2 gap-2 h-12">
                      <Button
                        variant={sortOrder === 'asc' ? "default" : "outline"}
                        onClick={() => setSortOrder('asc')}
                        className={`border-2 ${sortOrder === 'asc' ? "bg-[#2094f3] text-white" : "border-[#2094f3] text-[#2094f3]"}`}
                      >
                        <ArrowUp className="h-4 w-4 mr-1" />
                        <span className="text-sm">En Düşük Fiyat</span>
                      </Button>
                      <Button
                        variant={sortOrder === 'desc' ? "default" : "outline"}
                        onClick={() => setSortOrder('desc')}
                        className={`border-2 ${sortOrder === 'desc' ? "bg-[#2094f3] text-white" : "border-[#2094f3] text-[#2094f3]"}`}
                      >
                        <ArrowDown className="h-4 w-4 mr-1" />
                        <span className="text-sm">En Yüksek Fiyat</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Room List */}
        <section className="py-6 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-neutral-800">
                {t('available_rooms', 'Uygun Odalar')}
                {selectedHotelId && ` - ${getHotelName(selectedHotelId)}`}
              </h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-[#2094f3]/5 border-[#2094f3]/20 text-[#2094f3]">
                  {startDate && endDate
                    ? `${format(startDate, "d MMM", { locale: tr })} - ${format(endDate, "d MMM", { locale: tr })}`
                    : t('select_dates', 'Tarih Seçin')
                  }
                </Badge>
                <Badge variant="outline" className="bg-[#2094f3]/5 border-[#2094f3]/20 text-[#2094f3]">
                  {filteredRooms.length} {t('room', 'oda')}
                </Badge>
              </div>
            </div>

            {isLoadingRooms ? (
              <div className="space-y-4 animate-pulse">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg h-40"></div>
                ))}
              </div>
            ) : filteredRooms.length > 0 ? (
              <div className="space-y-8">
                {filteredRooms.map(room => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    showDetailButton={true}
                    showBookButton={true}
                    bookingInfo={{
                      dateRange,
                      nightCount,
                    }}
                    onBook={(roomId) => {
                      const checkIn = startDate ? format(startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
                      const checkOut = endDate ? format(endDate, 'yyyy-MM-dd') : format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');
                      window.location.href = `/reservations/new?roomId=${roomId}&hotelId=${room.hotelId}&checkIn=${checkIn}&checkOut=${checkOut}&adults=2&children=0`;
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-lg shadow-sm">
                <div className="text-lg font-semibold text-gray-800">{t('no_rooms_found', 'Oda Bulunamadı')}</div>
                <p className="text-gray-600 mt-2">{t('try_different_filters', 'Lütfen farklı filtreler deneyiniz.')}</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </MainLayout>
  );
}
