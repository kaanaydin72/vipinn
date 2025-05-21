import { Room } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useDeviceType } from "@/hooks/use-mobile";
import { Wifi, Bed, Coffee, Bath, Check, Snowflake, Tv, Moon, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { eachDayOfInterval, format } from "date-fns";

interface RoomCardProps {
  room: Room & {
    nightCount?: number;
    totalPriceCalculated?: number;
  };
  selected?: boolean;
  onSelect?: () => void;
  onBook?: (roomId: number) => void;
  showBookButton?: boolean;
  showDetailButton?: boolean;
  bookingInfo?: {
    dateRange?: { from: Date; to: Date };
    nightCount?: number;
    adultCount?: number;
    childCount?: number;
    totalPriceCalculated?: number;
  };
}

export default function RoomCard({
  room,
  selected = false,
  onSelect,
  onBook,
  showBookButton = true,
  showDetailButton = false,
  bookingInfo,
}: RoomCardProps) {
  const deviceType = useDeviceType();
  const isMobile = deviceType === "mobile";

  let dailyPricesArray: any[] = [];
  let weekdayPricesArray: any[] = [];

  try {
    if (room.dailyPrices) {
      dailyPricesArray = JSON.parse(room.dailyPrices);
    }
    if (room.weekdayPrices) {
      weekdayPricesArray = JSON.parse(room.weekdayPrices);
    }
  } catch (e) {
    dailyPricesArray = [];
    weekdayPricesArray = [];
  }

  // Giriş ve çıkış tarihi aralığını ve gece sayısını ana sayfadan al
  const dateRange = bookingInfo?.dateRange;
  const nightCount = bookingInfo?.nightCount || 1;

  // Takvimde seçilen tüm günler için fiyat olup olmadığını kontrol et
  let priceForAllDays = true;
  let totalPrice = 0;

  if (dateRange?.from && dateRange?.to) {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    // Gece sayısı kadar (giriş-çıkış arası, çıkış hariç) iterate et
    for (let i = 0; i < days.length - 1; i++) {
      const date = days[i];
      const dateStr = format(date, "yyyy-MM-dd");
      const found = dailyPricesArray.find((p) => p.date === dateStr);
      if (found) {
        totalPrice += found.price;
      } else {
        // Eğer o günün fiyatı yoksa haftalık fiyatı bul
        const dayOfWeek = date.getDay();
        const weekly = weekdayPricesArray.find((p) => p.day === dayOfWeek);
        if (weekly) {
          totalPrice += weekly.price;
        } else {
          priceForAllDays = false;
          break;
        }
      }
    }
  } else {
    // Eğer tarih seçili değilse eski hesaplama
    if (dailyPricesArray.length > 0) {
      totalPrice = dailyPricesArray[dailyPricesArray.length - 1].price * nightCount;
    } else if (weekdayPricesArray.length > 0) {
      const today = new Date().getDay();
      const weekdayPrice = weekdayPricesArray.find((wp) => wp.day === today)?.price || 0;
      totalPrice = weekdayPrice * nightCount;
    } else {
      priceForAllDays = false;
    }
  }

  const displayOldPrice = priceForAllDays ? Math.round(totalPrice * 1.15) : 0;

  const { data: hotel } = useQuery({
    queryKey: [`/api/hotels/${room.hotelId}`],
    enabled: !!room.hotelId,
  });

  const hotelName = hotel?.name || "";

  const getFeatureIcon = (feature: string) => {
    switch (feature.toLowerCase()) {
      case "king yatak":
      case "yatak":
        return <Bed className="h-4 w-4 mr-1" />;
      case "ücretsiz wi-fi":
      case "wifi":
        return <Wifi className="h-4 w-4 mr-1" />;
      case "akıllı tv":
      case "tv":
        return <Tv className="h-4 w-4 mr-1" />;
      case "klima":
        return <Snowflake className="h-4 w-4 mr-1" />;
      case "özel banyo":
      case "banyo":
        return <Bath className="h-4 w-4 mr-1" />;
      case "mini bar":
      case "bar":
        return <Coffee className="h-4 w-4 mr-1" />;
      default:
        return <Check className="h-4 w-4 mr-1" />;
    }
  };

  // Oda tükendi gösterimi:
  const roomSoldOut = room.roomCount === 0 || !priceForAllDays;

  return (
    <Card
      className={`overflow-hidden border border-[#2094f3]/20 shadow-md ${
        selected ? "ring-2 ring-[#2094f3]" : ""
      } ${
        isMobile ? "rounded-xl" : "rounded-lg hover:shadow-lg"
      } transition duration-300`}
    >
      <div className="flex flex-row">
        {/* Sol taraf - Görsel */}
        <div className="relative w-1/3 min-w-[120px]">
          <img
            src={room.imageUrl}
            alt={room.name}
            className="w-full h-[180px] object-cover"
          />
          <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 text-[#2094f3] text-xs font-bold rounded-md shadow-sm border border-[#2094f3]/20">
            {room.type}
          </div>
        </div>

        {/* Sağ taraf - İçerik */}
        <CardContent className="p-3 w-2/3 flex flex-col justify-between">
          <div>
            {hotelName && (
              <div className="flex items-center text-xs text-[#2094f3] font-medium mb-1">
                <Building2 className="h-3 w-3 mr-1" />
                <span className="truncate">{hotelName}</span>
              </div>
            )}
            <h3 className="text-base font-bold text-neutral-800 mb-1 line-clamp-1">
              {room.name}
            </h3>
            <div className="flex flex-wrap gap-1 mb-3">
              {room.features.slice(0, 3).map((feature, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="flex items-center bg-[#2094f3]/5 text-[#2094f3] text-xs px-2 py-0.5 border border-[#2094f3]/20"
                >
                  {getFeatureIcon(feature)}
                  {feature}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            {/* Fiyat kısmı */}
            <div className="flex justify-end mt-2 mb-1">
              <div className="flex flex-col items-end">
                {!roomSoldOut ? (
                  <>
                    <div className="flex items-center">
                      <div className="flex items-center mr-2">
                        <span className="line-through text-neutral-400 text-xs mr-1">
                          {displayOldPrice.toLocaleString()} TL
                        </span>
                        <span className="bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded-full">
                          %15 İndirim
                        </span>
                      </div>
                      <span className="font-bold text-lg text-[#2094f3]">
                        {totalPrice.toLocaleString()} TL
                        {nightCount > 1 && " (Toplam)"}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-600 font-medium mb-2">
                      {room.roomCount > 0 && room.roomCount <= 5 ? (
                        <span className="text-red-500 font-semibold animate-pulse">
                          Son {room.roomCount} oda!
                        </span>
                      ) : (
                        <>Oda Kontenjanı: <span className="font-bold">{room.roomCount}</span> adet</>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 flex items-center mt-1">
                      {nightCount > 0 ? (
                        <>
                          <Moon className="h-3 w-3 mr-0.5 text-[#2094f3]" /> {nightCount} gece için toplam fiyat
                        </>
                      ) : (
                        "Gecelik fiyat"
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center">
                    <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">
                      Oda tükendi
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex justify-end gap-2">
              {showDetailButton && (
                <Button
                  asChild
                  variant="outline"
                  size={isMobile ? "sm" : "default"}
                  className={`${
                    isMobile
                      ? "text-xs py-1 px-2"
                      : "text-sm py-1.5 px-4"
                  } border-[#2094f3] text-[#2094f3] hover:bg-[#2094f3]/10`}
                >
                  <Link href={`/hotels/${room.hotelId}?roomId=${room.id}`}>
                    {isMobile ? "Detay" : "Otel Detayı"}
                  </Link>
                </Button>
              )}

              {roomSoldOut ? (
                <Button
                  variant="default"
                  size={isMobile ? "sm" : "default"}
                  className="bg-neutral-300 cursor-not-allowed text-neutral-400 shadow-md"
                  disabled
                >
                  Oda Tükendi
                </Button>
              ) : showBookButton ? (
                <Button
                  onClick={() => onBook && onBook(room.id)}
                  variant="default"
                  size={isMobile ? "sm" : "default"}
                  className={`${
                    isMobile
                      ? "text-xs py-1 px-2"
                      : "text-sm py-1.5 px-4"
                  } bg-[#2094f3] hover:bg-[#1a75c0] shadow-md`}
                >
                  {isMobile ? "Rezerve Et" : "Rezervasyon Yap"}
                </Button>
              ) : (
                <Button
                  onClick={onSelect}
                  variant="default"
                  size={isMobile ? "sm" : "default"}
                  className={`${
                    isMobile
                      ? "text-xs py-1 px-2"
                      : "text-sm py-1.5 px-4"
                  } bg-[#2094f3] hover:bg-[#1a75c0] shadow-md`}
                >
                  {selected ? "Seçildi" : "Seç"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
