import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Hotel } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar as CalendarIcon, Users, SlidersHorizontal, Store } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format, addDays } from "date-fns";
import { tr } from 'date-fns/locale';
import { DateRange } from "react-day-picker";

// Mobile cihaz tespiti için hook
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

export default function SearchBox() {
  const [, setLocation] = useLocation();
  const [selectedHotel, setSelectedHotel] = useState("");
  const [guests, setGuests] = useState("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([2500]);
  const [amenities, setAmenities] = useState<Record<string, boolean>>({
    havuz: false,
    spa: false,
    fitness: false,
    plaj: false
  });
  const [stars, setStars] = useState<string[]>([]);
  
  // Tarih aralığı için state
  const today = new Date();
  const tomorrow = addDays(today, 1);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: today,
    to: tomorrow
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isCalendarDialogOpen, setIsCalendarDialogOpen] = useState(false);
  
  // Mobil cihaz kontrolü
  const isMobile = useMediaQuery("(max-width: 640px)");

  // Fetch hotels for the dropdown
  const { data: hotels = [] } = useQuery<Hotel[]>({
    queryKey: ['/api/hotels'],
  });

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setAmenities({
      ...amenities,
      [amenity]: checked
    });
  };

  const handleStarToggle = (star: string) => {
    if (stars.includes(star)) {
      setStars(stars.filter(s => s !== star));
    } else {
      setStars([...stars, star]);
    }
  };

  const handleSearch = () => {
    // Build search query
    const params = new URLSearchParams();
    
    if (selectedHotel) {
      // If a specific hotel is selected, navigate directly to that hotel's page
      if (selectedHotel !== 'all') {
        const hotelId = selectedHotel;
        return setLocation(`/hotels/${hotelId}`);
      }
    }
    
    // Tarih aralığı ekle
    if (dateRange?.from) {
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      params.append("checkIn", fromDate);
    }
    
    if (dateRange?.to) {
      const toDate = format(dateRange.to, 'yyyy-MM-dd');
      params.append("checkOut", toDate);
    }
    
    if (guests) params.append("guests", guests);
    
    if (isAdvancedOpen) {
      // Add advanced filters
      params.append("price", priceRange[0].toString());
      
      // Add selected amenities
      Object.entries(amenities).forEach(([key, value]) => {
        if (value) params.append("amenities", key);
      });
      
      // Add selected stars
      stars.forEach(star => params.append("stars", star));
    }
    
    // Navigate to hotels page with filters
    setLocation(`/hotels?${params.toString()}`);
  };

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
      <Card className="shadow-xl overflow-hidden border-2 border-[#2094f3]">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hotel">Şube</Label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Select onValueChange={setSelectedHotel} value={selectedHotel}>
                    <SelectTrigger id="hotel" className="pl-10 border-2 border-[#2094f3]">
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
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="date-range">Tarih Aralığı</Label>
                
                {/* Desktop Tarih Seçici */}
                {!isMobile && (
                  <div className="w-full">
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start border-2 border-[#2094f3] py-6 text-left font-normal shadow-md hover:shadow-lg bg-white dark:bg-neutral-900 transition-all"
                        >
                          <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                          <div className="flex flex-col items-start">
                            <span className="text-xs text-neutral-500">Tarih Aralığı</span>
                            <span className="font-medium text-black dark:text-white">
                              {dateRange.from 
                                ? `${format(dateRange.from, 'd MMM', { locale: tr })} - ${dateRange.to ? format(dateRange.to, 'd MMM yyyy', { locale: tr }) : ''}`
                                : "Tarih Seçin"}
                            </span>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-2 border-2 border-[#2094f3] rounded-xl shadow-2xl max-w-md" align="start">
                        <Calendar
                          mode="range"
                          selected={dateRange}
                          onSelect={(range) => {
                            setDateRange(range || { from: today, to: tomorrow });
                          }}
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
                            onClick={() => setIsCalendarOpen(false)}
                            className="bg-[#2094f3] text-white hover:bg-[#2094f3]/90 w-full"
                          >
                            Tarihleri Onayla
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
                
                {/* Mobile Tarih Seçici */}
                {isMobile && (
                  <div className="w-full">
                    <Dialog open={isCalendarDialogOpen} onOpenChange={setIsCalendarDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-center border-2 border-[#2094f3] py-6 font-normal shadow-md hover:shadow-lg bg-white dark:bg-neutral-900 transition-all"
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-neutral-500">Tarih Aralığı</span>
                            <span className="font-medium text-black dark:text-white">
                              {dateRange.from 
                                ? `${format(dateRange.from, 'd MMM', { locale: tr })} - ${dateRange.to ? format(dateRange.to, 'd MMM yyyy', { locale: tr }) : ''}`
                                : "Tarih Seçin"}
                            </span>
                          </div>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="p-0 max-w-md border-2 border-[#2094f3] shadow-xl">
                        <DialogTitle className="sr-only">Tarihleri Seçin</DialogTitle>
                        <div className="p-4 border-b">
                          <h3 className="text-lg font-semibold">Tarihleri Seçin</h3>
                        </div>
                        <div className="p-4">
                          <Calendar
                            mode="range"
                            selected={dateRange}
                            onSelect={(range) => {
                              setDateRange(range || { from: today, to: tomorrow });
                            }}
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
                            onClick={() => setIsCalendarDialogOpen(false)}
                            className="bg-[#2094f3] text-white hover:bg-[#2094f3]/90 w-full"
                          >
                            Tarihleri Onayla
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="guests">Misafirler</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Select onValueChange={setGuests} value={guests}>
                    <SelectTrigger id="guests" className="pl-10 border-2 border-[#2094f3]">
                      <SelectValue placeholder="Misafir Sayısı" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Yetişkin</SelectItem>
                      <SelectItem value="2">2 Yetişkin</SelectItem>
                      <SelectItem value="2-1">2 Yetişkin, 1 Çocuk</SelectItem>
                      <SelectItem value="2-2">2 Yetişkin, 2 Çocuk</SelectItem>
                      <SelectItem value="3">3 Yetişkin</SelectItem>
                      <SelectItem value="4">4 Yetişkin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <Collapsible
                open={isAdvancedOpen}
                onOpenChange={setIsAdvancedOpen}
                className="w-full"
              >
                <CollapsibleTrigger asChild>
                  <Button variant="link" className="px-0 text-primary flex items-center">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Gelişmiş Filtreler
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="pt-4 border-t border-neutral-200 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label className="block text-sm font-medium text-neutral-700 mb-2">
                        Fiyat Aralığı: {priceRange[0]} ₺
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Slider
                          value={priceRange}
                          min={500}
                          max={5000}
                          step={100}
                          onValueChange={setPriceRange}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="block text-sm font-medium text-neutral-700 mb-2">
                        Özellikler
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="havuz" 
                            checked={amenities.havuz}
                            onCheckedChange={(checked) => 
                              handleAmenityChange("havuz", checked as boolean)
                            }
                          />
                          <label
                            htmlFor="havuz"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Havuz
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="spa" 
                            checked={amenities.spa}
                            onCheckedChange={(checked) => 
                              handleAmenityChange("spa", checked as boolean)
                            }
                          />
                          <label
                            htmlFor="spa"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Spa
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="fitness" 
                            checked={amenities.fitness}
                            onCheckedChange={(checked) => 
                              handleAmenityChange("fitness", checked as boolean)
                            }
                          />
                          <label
                            htmlFor="fitness"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Fitness
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="plaj" 
                            checked={amenities.plaj}
                            onCheckedChange={(checked) => 
                              handleAmenityChange("plaj", checked as boolean)
                            }
                          />
                          <label
                            htmlFor="plaj"
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Plaj
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="block text-sm font-medium text-neutral-700 mb-2">
                        Yıldız Sayısı
                      </Label>
                      <div className="flex space-x-1">
                        <Badge 
                          variant={stars.length === 0 ? "default" : "outline"} 
                          className="cursor-pointer"
                          onClick={() => setStars([])}
                        >
                          Tümü
                        </Badge>
                        <Badge 
                          variant={stars.includes("3") ? "default" : "outline"} 
                          className="cursor-pointer"
                          onClick={() => handleStarToggle("3")}
                        >
                          3★
                        </Badge>
                        <Badge 
                          variant={stars.includes("4") ? "default" : "outline"} 
                          className="cursor-pointer"
                          onClick={() => handleStarToggle("4")}
                        >
                          4★
                        </Badge>
                        <Badge 
                          variant={stars.includes("5") ? "default" : "outline"} 
                          className="cursor-pointer"
                          onClick={() => handleStarToggle("5")}
                        >
                          5★
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              <Button onClick={handleSearch} className="bg-[#2094f3] hover:bg-[#2094f3]/90 text-white font-medium border-2 border-[#2094f3]">
                <Search className="mr-2 h-4 w-4" />
                Ara
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
