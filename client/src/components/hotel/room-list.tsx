import { useState } from "react";
import { Room } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { tr } from 'date-fns/locale';
import { 
  Bed, 
  ShowerHead, 
  Tv, 
  WifiIcon, 
  Coffee, 
  Camera, 
  Users, 
  FileWarning, 
  Loader2, 
  ShieldCheck
} from "lucide-react";

interface RoomListProps {
  rooms: Room[];
  isLoading: boolean;
  selectedDates: {
    from: Date;
    to: Date;
  };
  nightCount: number;
  onRoomSelect: (roomId: number) => void;
  previewImages: string[];
}

export default function RoomList({ 
  rooms, 
  isLoading, 
  selectedDates, 
  nightCount, 
  onRoomSelect,
  previewImages
}: RoomListProps) {
  
  // Odaları tipine göre grupla
  const roomsByType: Record<string, Room[]> = rooms.reduce((acc, room) => {
    if (!acc[room.type]) {
      acc[room.type] = [];
    }
    acc[room.type].push(room);
    return acc;
  }, {} as Record<string, Room[]>);
  
  // Yaz dönemi kontrolü (Haziran-Ağustos arası)
  const isSummer = selectedDates.from.getMonth() >= 5 && selectedDates.from.getMonth() <= 7;
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  if (rooms.length === 0) {
    return (
      <div className="text-center py-10 bg-white dark:bg-neutral-800 rounded-lg shadow-sm">
        <FileWarning className="h-10 w-10 mx-auto mb-4 text-neutral-400" />
        <h3 className="text-lg font-semibold mb-2">Oda Bulunamadı</h3>
        <p className="text-neutral-500 max-w-md mx-auto">
          Seçtiğiniz tarihlerde uygun oda bulunmamaktadır. Lütfen farklı tarihler seçin veya diğer otellerimize göz atın.
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 gap-6">
      {Object.entries(roomsByType).map(([type, rooms], index) => (
        <div 
          key={index} 
          className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm overflow-hidden border border-border"
        >
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-0">
            {/* Oda Fotoğrafı */}
            <div className="col-span-1 sm:col-span-3">
              <div className="relative w-full h-full min-h-[200px] sm:min-h-[250px]">
                <img 
                  src={previewImages[index % previewImages.length]} 
                  alt={`${type} Odası`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 right-3 bg-black bg-opacity-60 text-white py-1 px-2 rounded-md text-xs">
                  <Camera className="h-3 w-3 inline-block mr-1.5" />
                  3+ Fotoğraf
                </div>
              </div>
            </div>
            
            {/* Oda Bilgileri */}
            <div className="col-span-1 sm:col-span-6 p-4">
              <h3 className="text-lg font-semibold mb-2">{type}</h3>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="outline" className="bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 text-xs rounded-full">
                  <Bed className="h-3 w-3 mr-1" />
                  {rooms[0].capacity} Kişilik
                </Badge>
                
                <Badge variant="outline" className="bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 text-xs rounded-full">
                  <ShowerHead className="h-3 w-3 mr-1" />
                  Duş
                </Badge>
                
                <Badge variant="outline" className="bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 text-xs rounded-full">
                  <Tv className="h-3 w-3 mr-1" />
                  TV
                </Badge>
                
                <Badge variant="outline" className="bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 text-xs rounded-full">
                  <WifiIcon className="h-3 w-3 mr-1" />
                  Wi-Fi
                </Badge>
                
                <Badge variant="outline" className="bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 text-xs rounded-full">
                  <Coffee className="h-3 w-3 mr-1" />
                  Minibar
                </Badge>
              </div>
              
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                {rooms[0].description}
              </p>
              
              <div className="flex items-center text-xs text-neutral-500">
                <Users className="h-3.5 w-3.5 mr-1 text-[#2094f3]" />
                <span>Maksimum {rooms[0].capacity} kişi (çocuklar dahil)</span>
              </div>
            </div>
            
            {/* Fiyat ve Rezervasyon */}
            <div className="col-span-1 sm:col-span-3 bg-neutral-50 dark:bg-neutral-900 p-4 flex flex-col">
              <div className="mt-auto mb-2">
                <div className="text-xs text-neutral-500 mb-1">Gecelik</div>
                <div className="text-2xl font-bold text-[#2094f3]">
                  {rooms[0].price.toLocaleString('tr-TR')} ₺
                </div>
                <div className="text-xs text-neutral-500 mb-4">{nightCount} gece için toplam:</div>
                <div className="text-lg font-bold">
                  {(rooms[0].price * nightCount).toLocaleString('tr-TR')} ₺
                </div>
              </div>
              
              <Button 
                className="w-full mt-4 bg-[#2094f3] hover:bg-[#2094f3]/90" 
                onClick={() => onRoomSelect(rooms[0].id)}
              >
                Rezervasyon Yap
              </Button>
              
              <div className="text-xs text-center text-neutral-500 mt-2">
                <ShieldCheck className="h-3 w-3 inline-block mr-1" />
                Ücretsiz iptal 24 saat önce
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}