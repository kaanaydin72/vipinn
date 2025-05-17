import { Link } from "wouter";
import { Hotel } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDeviceType } from "@/hooks/use-mobile";
import { MapPin, Star, Heart, Share, Check, DollarSign, Coffee, Wifi, Car, Waves } from "lucide-react";

interface HotelCardProps {
  hotel: Hotel;
}

export default function HotelCard({ hotel }: HotelCardProps) {
  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'havuz':
        return <Waves className="h-4 w-4 mr-1" />;
      case 'spa':
        return <Coffee className="h-4 w-4 mr-1" />;
      case 'restoran':
        return <DollarSign className="h-4 w-4 mr-1" />;
      case 'plaj':
        return <Waves className="h-4 w-4 mr-1" />;
      case 'bar':
        return <Coffee className="h-4 w-4 mr-1" />;
      case 'wifi':
        return <Wifi className="h-4 w-4 mr-1" />;
      case 'otopark':
        return <Car className="h-4 w-4 mr-1" />;
      default:
        return <Check className="h-4 w-4 mr-1" />;
    }
  };

  const truncateDescription = (desc: string, maxLength = 60) => {
    if (desc.length <= maxLength) return desc;
    return `${desc.substring(0, maxLength)}...`;
  };

  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';

  // Calculating a display price based on stars (just for UI display)
  const displayPrice = hotel.stars * 750;
  const displayOldPrice = displayPrice * 1.2;

  return (
    <Card className={`overflow-hidden border border-[#2094f3]/20 shadow-md ${isMobile ? 'rounded-xl' : 'rounded-lg hover:shadow-lg'} transition duration-300`}>
      <div className="flex flex-col">
        {/* Top - Image */}
        <div className="relative w-full">
          <img 
            src={hotel.imageUrl} 
            alt={hotel.name} 
            className="h-48 w-full object-cover"
          />
          <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 text-[#2094f3] text-xs font-bold rounded-md shadow-sm border border-[#2094f3]/20">
            {hotel.stars} Yıldız
          </div>
          
          <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm border border-[#2094f3]/20">
            <div className="flex items-center justify-center bg-[#2094f3]/10 text-[#2094f3] font-bold rounded-full w-7 h-7 text-xs">
              {hotel.rating}
            </div>
          </div>
        </div>
        
        {/* Bottom - Content */}
        <CardContent className="p-4 w-full flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-800 mb-2 line-clamp-1">{hotel.name}</h3>
            
            <div className="flex items-center text-sm text-neutral-600 mb-3">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0 text-[#2094f3]" />
              <span className="truncate">{hotel.location}</span>
              <span className="mx-1">•</span>
              <span className="text-[#2094f3] font-medium">Harita</span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {hotel.amenities.slice(0, 3).map((amenity, index) => (
                <Badge key={index} variant="outline" className="flex items-center bg-[#2094f3]/5 text-[#2094f3] text-xs px-2 py-1 border border-[#2094f3]/20">
                  {getAmenityIcon(amenity)}
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
            <div>
              <div className="flex items-center space-x-2">
                <span className="line-through text-neutral-400 text-sm">{displayOldPrice.toLocaleString()} TL</span>
                <span className="bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded-full">%20 İndirim</span>
              </div>
              <div className="font-bold text-lg text-[#2094f3]">{displayPrice.toLocaleString()} TL</div>
              <div className="text-xs text-neutral-500">Vergiler ve KDV dahil</div>
            </div>
            <Button 
              asChild 
              variant="default" 
              size="sm"
              className="text-sm py-1 px-3 bg-[#2094f3] hover:bg-[#1a75c0] h-9 shadow-md"
            >
              <Link href={`/hotels/${hotel.id}`}>Detayları Gör</Link>
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
