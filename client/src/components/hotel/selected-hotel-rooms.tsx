import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Room, Hotel } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import RoomCard from "./room-card";
import { X, Calendar as CalendarIcon, Check, Users } from "lucide-react";
import { addDays, format, isAfter, isBefore, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";

interface SelectedHotelRoomsProps {
  hotel: Hotel;
  onClose: () => void;
}

export default function SelectedHotelRooms({ hotel, onClose }: SelectedHotelRoomsProps) {
  const [selectedDates, setSelectedDates] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [guests, setGuests] = useState(2);
  const [nightCount, setNightCount] = useState(0);

  // Fetch rooms for the selected hotel
  const { data: rooms = [], isLoading } = useQuery<Room[]>({
    queryKey: [`/api/hotels/${hotel.id}/rooms`],
    enabled: !!hotel?.id,
  });

  // Update night count when dates change
  useEffect(() => {
    if (selectedDates.from && selectedDates.to) {
      const fromDate = new Date(selectedDates.from);
      const toDate = new Date(selectedDates.to);
      const diffTime = toDate.getTime() - fromDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setNightCount(diffDays);
    } else {
      setNightCount(0);
    }
  }, [selectedDates]);

  // Add night count to rooms for display
  const roomsWithNightCount = rooms.map(room => ({
    ...room,
    nightCount
  }));
  
  // Disable past dates and today for calendar
  const disabledDays = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(date, today);
  };

  return (
    <Card className="overflow-hidden border border-[#2094f3]/20 shadow-lg">
      <div className="bg-[#2094f3] text-white px-6 py-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{hotel.name}</h2>
        <Button variant="ghost" size="icon" className="text-white hover:bg-[#2094f3]/80" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <CardContent className="p-6">
        <Tabs defaultValue="rooms" className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="rooms" className="w-1/2">Odalar ve Fiyatlar</TabsTrigger>
            <TabsTrigger value="info" className="w-1/2">Otel Bilgisi</TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-6">
            {/* Date selection and guest count */}
            <div className="bg-[#2094f3]/5 border border-[#2094f3]/20 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm font-medium text-neutral-700">
                    <CalendarIcon className="h-4 w-4 mr-2 text-[#2094f3]" />
                    Giriş Tarihi
                  </div>
                  <div className="bg-white border border-[#2094f3]/20 rounded-md px-3 py-2 text-sm">
                    {selectedDates.from ? (
                      format(selectedDates.from, "d MMMM yyyy", { locale: tr })
                    ) : (
                      "Tarih seçiniz"
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm font-medium text-neutral-700">
                    <CalendarIcon className="h-4 w-4 mr-2 text-[#2094f3]" />
                    Çıkış Tarihi
                  </div>
                  <div className="bg-white border border-[#2094f3]/20 rounded-md px-3 py-2 text-sm">
                    {selectedDates.to ? (
                      format(selectedDates.to, "d MMMM yyyy", { locale: tr })
                    ) : (
                      "Tarih seçiniz"
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm font-medium text-neutral-700">
                    <Users className="h-4 w-4 mr-2 text-[#2094f3]" />
                    Misafir Sayısı
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 border-[#2094f3]/20"
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      disabled={guests <= 1}
                    >
                      -
                    </Button>
                    <div className="bg-white border border-[#2094f3]/20 rounded-md px-4 py-1 min-w-[40px] text-center">
                      {guests}
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 border-[#2094f3]/20"
                      onClick={() => setGuests(Math.min(10, guests + 1))}
                      disabled={guests >= 10}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              {/* Calendar */}
              <div className="mt-4">
                <Calendar
                  mode="range"
                  selected={selectedDates}
                  onSelect={setSelectedDates as any}
                  disabled={disabledDays}
                  className="border rounded-md bg-white shadow-sm p-3"
                />
              </div>

              {/* Selected dates summary */}
              {selectedDates.from && selectedDates.to && (
                <div className="mt-4 bg-white border border-[#2094f3]/20 rounded-md p-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-green-600" />
                    <span>
                      <span className="font-medium">{nightCount} gece</span> konaklama, {" "}
                      <span className="font-medium">{guests} misafir</span> için
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-[#2094f3]/20 text-[#2094f3]"
                    onClick={() => setSelectedDates({ from: undefined, to: undefined })}
                  >
                    Temizle
                  </Button>
                </div>
              )}
            </div>

            {/* Room list */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Müsait Odalar</h3>
              
              {isLoading ? (
                // Loading skeletons
                Array(3).fill(0).map((_, index) => (
                  <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm border border-neutral-200 p-3">
                    <div className="flex flex-row">
                      <Skeleton className="w-1/3 h-32" />
                      <div className="w-2/3 pl-3 space-y-3">
                        <Skeleton className="h-6 w-2/3" />
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-24" />
                          <Skeleton className="h-8 w-24" />
                        </div>
                        <div className="flex justify-between">
                          <Skeleton className="h-6 w-24" />
                          <Skeleton className="h-10 w-32" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : roomsWithNightCount.length > 0 ? (
                roomsWithNightCount.map(room => (
                  <RoomCard 
                    key={room.id} 
                    room={room}
                  />
                ))
              ) : (
                <div className="text-center py-10 bg-neutral-50 rounded-lg border border-neutral-200">
                  <p className="text-neutral-600">Bu otel için müsait oda bulunamadı.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="info">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-lg mb-2">Otel Hakkında</h3>
                <p className="text-neutral-700">{hotel.description}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">Özellikler</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {hotel.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-[#2094f3]" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-lg mb-2">Konum</h3>
                <p className="text-neutral-700">{hotel.location}</p>
                <div className="mt-2 bg-neutral-100 rounded-lg h-40 flex items-center justify-center">
                  <span className="text-neutral-500">Harita görseli burada yer alacak</span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}