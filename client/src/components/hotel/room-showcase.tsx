import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Room } from "@shared/schema";
import RoomCard from "./room-card";
import ReservationForm from "./reservation-form";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface RoomShowcaseProps {
  hotelId: number;
}

export default function RoomShowcase({ hotelId }: RoomShowcaseProps) {
  const [activeTab, setActiveTab] = useState("standart");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  
  const { data: rooms, isLoading } = useQuery<Room[]>({
    queryKey: ["/api/rooms", hotelId],
    queryFn: async () => {
      const res = await fetch(`/api/rooms?hotelId=${hotelId}`);
      if (!res.ok) throw new Error("Oda bilgileri yüklenemedi");
      return res.json();
    }
  });
  
  const roomTypes = [
    { id: "standart", label: "Standart Oda" },
    { id: "deluxe", label: "Deluxe Oda" },
    { id: "suit", label: "Suit Oda" },
    { id: "aile", label: "Aile Odası" }
  ];
  
  // Filter rooms based on active tab
  const filteredRooms = rooms?.filter(room => {
    if (activeTab === "standart") return room.type === "Standart Oda";
    if (activeTab === "deluxe") return room.type === "Deluxe Oda";
    if (activeTab === "suit") return room.type === "Suit Oda";
    if (activeTab === "aile") return room.type === "Aile Odası";
    return true;
  });
  
  const handleReserveClick = (room: Room) => {
    setSelectedRoom(room);
    setIsReservationOpen(true);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground font-heading">Oda Seçenekleri</h2>
          <p className="mt-2 text-muted-foreground">Konfor ve lüksten ödün vermeyenler için tasarlanmış özel odalar</p>
        </div>
        
        <div className="mt-12">
          {/* Room type tabs - Mobile */}
          <div className="sm:hidden mb-8">
            <Select 
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <SelectTrigger>
                <SelectValue placeholder="Oda tipi seçin" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Room type tabs - Desktop */}
          <div className="hidden sm:block">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-border">
                <TabsList className="bg-transparent h-auto -mb-px">
                  {roomTypes.map(type => (
                    <TabsTrigger 
                      key={type.id} 
                      value={type.id}
                      className="px-4 py-3 border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
                    >
                      {type.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              
              {roomTypes.map(type => (
                <TabsContent key={type.id} value={type.id} className="mt-8">
                  {filteredRooms && filteredRooms.length > 0 ? (
                    <div className="space-y-8">
                      {filteredRooms.map(room => (
                        <RoomCard 
                          key={room.id}
                          room={room}
                          onReserveClick={handleReserveClick}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Bu kategoride oda bulunamadı.</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
        
        {/* Reservation Dialog */}
        <Dialog open={isReservationOpen} onOpenChange={setIsReservationOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Rezervasyon</DialogTitle>
              <DialogDescription>
                {selectedRoom?.name} için rezervasyon detaylarını doldurun.
              </DialogDescription>
            </DialogHeader>
            
            {selectedRoom && (
              <ReservationForm 
                hotelId={hotelId} 
                room={selectedRoom} 
                onSuccess={() => setIsReservationOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
