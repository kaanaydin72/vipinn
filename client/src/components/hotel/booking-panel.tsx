import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { 
  CalendarIcon, 
  Users, 
  BedDouble, 
  Plus, 
  Minus, 
  MoveRight, 
  Search,
  CheckCheck
} from "lucide-react";
import { format, addDays } from "date-fns";
import { tr } from 'date-fns/locale';
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

// custom useMediaQuery hook
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [matches, query]);

  return matches;
}

interface BookingPanelProps {
  dateRange: {
    from: Date;
    to: Date;
  };
  onDateRangeChange: (range: { from: Date | undefined; to?: Date | undefined } | undefined) => void;
  adultCount: number;
  onAdultCountChange: Dispatch<SetStateAction<number>>;
  childCount: number;
  onChildCountChange: Dispatch<SetStateAction<number>>;
  roomCount: number;
  onRoomCountChange: Dispatch<SetStateAction<number>>;
  nightCount: number;
  totalPrice?: number;
  onSearch: () => void;
}

export default function BookingPanel({
  dateRange,
  onDateRangeChange,
  adultCount,
  onAdultCountChange,
  childCount,
  onChildCountChange,
  roomCount,
  onRoomCountChange,
  nightCount,
  totalPrice,
  onSearch
}: BookingPanelProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [guestsDialogOpen, setGuestsDialogOpen] = useState(false);
  
  // Mobil görünüm kontrolü
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // Aralık seçme işleyicisi
  // Aralık seçimi - Callback'leri doğru isimlerle çağır
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from) {
      const cleanFrom = new Date(range.from);
      cleanFrom.setHours(0, 0, 0, 0);
      
      let cleanTo;
      if (range.to) {
        cleanTo = new Date(range.to);
        cleanTo.setHours(0, 0, 0, 0);
      } else {
        // Eğer bitiş tarihi seçilmediyse varsayılan olarak bir gün sonra
        cleanTo = addDays(cleanFrom, 1);
      }
      
      // Yeni tarih değerlerini üst bileşene gönder
      onDateRangeChange({ from: cleanFrom, to: cleanTo });
      
      // Konsola yazdır
      console.log("Tarih aralığı seçildi:", {
        from: cleanFrom.toISOString().split('T')[0],
        to: cleanTo.toISOString().split('T')[0]
      });
      
      // Otomatik olarak odaları göster
      setTimeout(() => {
        onSearch();
      }, 100);
    }
  };
  
  // Misafir sayısı değiştirme işleyicileri
  const incrementAdult = () => {
    if (adultCount < 10) {
      onAdultCountChange(adultCount + 1);
    }
  };
  
  const decrementAdult = () => {
    if (adultCount > 1) {
      onAdultCountChange(adultCount - 1);
    }
  };
  
  const incrementChild = () => {
    if (childCount < 5) {
      onChildCountChange(childCount + 1);
    }
  };
  
  const decrementChild = () => {
    if (childCount > 0) {
      onChildCountChange(childCount - 1);
    }
  };
  
  const incrementRoom = () => {
    if (roomCount < 5) {
      onRoomCountChange(roomCount + 1);
    }
  };
  
  const decrementRoom = () => {
    if (roomCount > 1) {
      onRoomCountChange(roomCount - 1);
    }
  };
  
  return (
    <div className="mt-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md border border-[#2094f3]/30 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-4">
          {/* Tarih Seçici */}
          <div className="md:col-span-1">
            {!isMobile ? (
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-2 border-[#2094f3] py-6 text-left font-normal shadow-md hover:shadow-lg bg-white dark:bg-neutral-900 transition-all"
                  >
                    <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                    <div className="flex flex-col items-start">
                      <span className="text-xs text-neutral-500">Tarih Aralığı</span>
                      <span className="font-medium text-black dark:text-white">
                        {format(dateRange.from, 'd MMM', { locale: tr })} - {format(dateRange.to, 'd MMM yyyy', { locale: tr })}
                      </span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-2 border-2 border-[#2094f3] rounded-xl shadow-2xl w-auto" align="start">
                  <Calendar
                    mode="range"
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to
                    }}
                    onSelect={handleDateRangeChange}
                    initialFocus
                    locale={tr}
                    className="bg-white dark:bg-neutral-900 rounded-lg"
                    disabled={[(date) => {
                      // Sadece geçmiş tarihleri devre dışı bırak
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }]}
                  />
                  <div className="p-2 flex justify-center">
                    <Button
                      onClick={() => setCalendarOpen(false)}
                      className="bg-[#2094f3] text-white hover:bg-[#2094f3]/90 w-full"
                    >
                      <CheckCheck className="mr-2 h-4 w-4" />
                      Tarihleri Onayla
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Dialog open={calendarDialogOpen} onOpenChange={setCalendarDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="w-full h-[72px] justify-center border-2 border-[#2094f3] py-2 font-normal shadow-md hover:shadow-lg bg-white dark:bg-neutral-900 transition-all rounded-lg flex flex-col items-center"
                    style={{
                      WebkitTapHighlightColor: 'transparent',
                      WebkitAppearance: 'none'
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <CalendarIcon className="h-5 w-5 mb-1 text-[#2094f3]" />
                      <span className="text-xs text-neutral-500">Tarih Aralığı</span>
                      <span className="font-medium text-black dark:text-white text-sm mt-0.5">
                        {format(dateRange.from, 'd MMM', { locale: tr })} - {format(dateRange.to, 'd MMM yyyy', { locale: tr })}
                      </span>
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="p-0 max-w-md border-2 border-[#2094f3] rounded-xl">
                  <DialogTitle className="text-lg font-semibold p-4 border-b flex items-center justify-between">
                    Tarihleri Seçin
                    <span className="text-sm text-neutral-500">{nightCount} gece</span>
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Konaklama tarihlerinizi seçin. Giriş ve çıkış tarihleri arasında seçim yapın.
                  </DialogDescription>
                  <div className="p-4">
                    <Calendar
                      mode="range"
                      selected={{
                        from: dateRange.from,
                        to: dateRange.to
                      }}
                      onSelect={handleDateRangeChange}
                      initialFocus
                      locale={tr}
                      className="w-full bg-white dark:bg-neutral-900 rounded-lg"
                      disabled={[(date) => {
                        // Sadece geçmiş tarihleri devre dışı bırak
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }]}
                    />
                  </div>
                  <div className="p-4 pt-0 flex justify-center">
                    <Button
                      onClick={() => setCalendarDialogOpen(false)}
                      className="bg-[#2094f3] text-white hover:bg-[#2094f3]/90 w-full"
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                        WebkitAppearance: 'none'
                      }}
                    >
                      <CheckCheck className="mr-2 h-4 w-4" />
                      Tarihleri Onayla
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {/* Misafir Seçici */}
          <div className="md:col-span-1">
            {!isMobile ? (
              <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-2 border-[#2094f3] py-6 text-left font-normal shadow-md hover:shadow-lg bg-white dark:bg-neutral-900 transition-all"
                  >
                    <Users className="mr-2 h-5 w-5 text-primary" />
                    <div className="flex flex-col items-start">
                      <span className="text-xs text-neutral-500">Misafirler</span>
                      <span className="font-medium text-black dark:text-white">
                        {adultCount} Yetişkin, {childCount} Çocuk
                      </span>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-4 border-2 border-[#2094f3] rounded-xl shadow-2xl w-auto" align="start">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Yetişkinler</p>
                        <p className="text-xs text-neutral-500">13 yaş ve üzeri</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-full"
                          onClick={decrementAdult}
                          disabled={adultCount <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{adultCount}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-full"
                          onClick={incrementAdult}
                          disabled={adultCount >= 10}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Çocuklar</p>
                        <p className="text-xs text-neutral-500">0-12 yaş arası</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-full"
                          onClick={decrementChild}
                          disabled={childCount <= 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{childCount}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-full"
                          onClick={incrementChild}
                          disabled={childCount >= 5}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Odalar</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-full"
                          onClick={decrementRoom}
                          disabled={roomCount <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{roomCount}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-full"
                          onClick={incrementRoom}
                          disabled={roomCount >= 5}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => setGuestsOpen(false)}
                      className="bg-[#2094f3] text-white hover:bg-[#2094f3]/90 w-full mt-2"
                    >
                      <CheckCheck className="mr-2 h-4 w-4" />
                      Misafir Sayısını Onayla
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Dialog open={guestsDialogOpen} onOpenChange={setGuestsDialogOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="w-full h-[72px] justify-center border-2 border-[#2094f3] py-2 font-normal shadow-md hover:shadow-lg bg-white dark:bg-neutral-900 transition-all rounded-lg flex flex-col items-center"
                    style={{
                      WebkitTapHighlightColor: 'transparent',
                      WebkitAppearance: 'none'
                    }}
                  >
                    <div className="flex flex-col items-center">
                      <Users className="h-5 w-5 mb-1 text-[#2094f3]" />
                      <span className="text-xs text-neutral-500">Misafirler</span>
                      <span className="font-medium text-black dark:text-white text-sm mt-0.5">
                        {adultCount} Yetişkin, {childCount} Çocuk
                      </span>
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="p-0 max-w-md border-2 border-[#2094f3] rounded-xl">
                  <DialogTitle className="text-lg font-semibold p-4 border-b">
                    Misafir Sayısı
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Konaklamanız için misafir sayısını ve oda sayısını belirleyin
                  </DialogDescription>
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Yetişkinler</p>
                        <p className="text-xs text-neutral-500">13 yaş ve üzeri</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-full"
                          onClick={decrementAdult}
                          disabled={adultCount <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{adultCount}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-full"
                          onClick={incrementAdult}
                          disabled={adultCount >= 10}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Çocuklar</p>
                        <p className="text-xs text-neutral-500">0-12 yaş arası</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-full"
                          onClick={decrementChild}
                          disabled={childCount <= 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{childCount}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-full"
                          onClick={incrementChild}
                          disabled={childCount >= 5}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Odalar</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-full"
                          onClick={decrementRoom}
                          disabled={roomCount <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{roomCount}</span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-full"
                          onClick={incrementRoom}
                          disabled={roomCount >= 5}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 pt-0 flex justify-center">
                    <Button
                      onClick={() => setGuestsDialogOpen(false)}
                      className="bg-[#2094f3] text-white hover:bg-[#2094f3]/90 w-full"
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                        WebkitAppearance: 'none'
                      }}
                    >
                      <CheckCheck className="mr-2 h-4 w-4" />
                      Misafir Sayısını Onayla
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {/* Oda Ara Butonu */}
          <div className="md:col-span-1">
            <Button
              onClick={onSearch}
              className="w-full h-full min-h-[60px] bg-[#2094f3] text-white hover:bg-[#1a75c0] shadow-lg hover:shadow-xl transition-all"
              style={{
                WebkitTapHighlightColor: 'transparent',
                WebkitAppearance: 'none'
              }}
            >
              {isMobile ? (
                <div className="flex flex-col items-center py-1">
                  <Search className="h-5 w-5 mb-1" />
                  <span className="font-medium">Odaları Gör</span>
                  <span className="text-xs opacity-80 mt-0.5">{nightCount} Gece • Toplam: {totalPrice?.toLocaleString() || '-'} TL</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="flex flex-col items-start mr-2">
                    <span className="font-medium">Odaları Gör</span>
                    <span className="text-xs">{nightCount} Gece • Toplam: {totalPrice?.toLocaleString() || '-'} TL</span>
                  </div>
                  <Search className="h-5 w-5 ml-2" />
                </div>
              )}
            </Button>
          </div>
        </div>
        
        {/* Alt Bilgi */}
        <div className={cn(
          "py-2 px-4 border-t border-[#2094f3]/20 bg-[#2094f3]/5",
          "flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400"
        )}>
          <div className="flex items-center">
            <CalendarIcon className="h-3.5 w-3.5 mr-1 text-[#2094f3]" />
            <span>{format(dateRange.from, 'PPP', { locale: tr })}</span>
            <MoveRight className="h-3 w-3 mx-1" />
            <span>{format(dateRange.to, 'PPP', { locale: tr })}</span>
          </div>
          <div className="flex items-center">
            <BedDouble className="h-3.5 w-3.5 mr-1 text-[#2094f3]" />
            <span>{roomCount} Oda</span>
            <span className="mx-1">•</span>
            <Users className="h-3.5 w-3.5 mr-1 text-[#2094f3]" />
            <span>{adultCount + childCount} Misafir</span>
          </div>
        </div>
      </div>
    </div>
  );
}