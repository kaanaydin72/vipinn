import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Reservation } from "@shared/schema";
import AdminLayout from "@/components/admin/admin-layout";

export default function ReservationStatusPage() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [newStatus, setNewStatus] = useState<string>("pending");
  const [reservationId, setReservationId] = useState<number | null>(null);
  
  // Parse reservation ID from URL
  useEffect(() => {
    const pathParts = location.split("/");
    const id = parseInt(pathParts[pathParts.length - 1]);
    if (!isNaN(id)) {
      setReservationId(id);
    } else {
      toast({
        title: "Hata",
        description: "Geçersiz rezervasyon ID'si",
        variant: "destructive",
      });
      navigate("/admin/reservations");
    }
  }, [location, navigate, toast]);

  // Fetch specific reservation
  const { data: reservation, isLoading } = useQuery<Reservation>({
    queryKey: ['/api/reservations', reservationId],
    queryFn: async () => {
      if (!reservationId) throw new Error("Rezervasyon ID'si bulunamadı");
      const res = await apiRequest("GET", `/api/reservations/${reservationId}`);
      if (!res.ok) throw new Error("Rezervasyon bilgileri alınamadı");
      return res.json();
    },
    enabled: !!reservationId,
    onSuccess: (data) => {
      if (data && data.status) {
        setNewStatus(data.status);
      }
    },
    onError: (error) => {
      console.error("Rezervasyon bilgileri alınamadı:", error);
      toast({
        title: "Hata",
        description: "Rezervasyon bilgileri alınamadı",
        variant: "destructive",
      });
      navigate("/admin/reservations");
    }
  });

  // Update reservation status
  const updateReservationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      console.log("Güncelleniyor:", id, status);
      
      if (!id || isNaN(Number(id))) {
        throw new Error("Geçersiz rezervasyon ID'si");
      }
      
      const res = await apiRequest("PATCH", `/api/reservations/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      toast({
        title: "Başarılı",
        description: "Rezervasyon durumu güncellendi.",
      });
      navigate("/admin/reservations");
    },
    onError: (error: Error) => {
      console.error("Durum güncelleme hatası:", error);
      toast({
        title: "Hata",
        description: `Rezervasyon durumu güncellenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!reservationId) {
      toast({
        title: "Hata",
        description: "Rezervasyon ID'si bulunamadı",
        variant: "destructive",
      });
      return;
    }
    
    updateReservationMutation.mutate({ id: reservationId, status: newStatus });
  };

  if (isLoading || !reservation) {
    return (
      <AdminLayout activeMenuItem="reservations">
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activeMenuItem="reservations">
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/admin/reservations")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Rezervasyon Durumu Güncelle</h1>
            <p className="text-muted-foreground">
              Rezervasyon #{reservationId} için durumu değiştirin
            </p>
          </div>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Durum Güncelleme</CardTitle>
            <CardDescription>
              Bu rezervasyonun yeni durumunu seçin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mevcut Durum</label>
              <div className="p-2 bg-muted rounded-md text-muted-foreground">
                {reservation.status === "confirmed" && "Onaylandı"}
                {reservation.status === "pending" && "Beklemede"}
                {reservation.status === "cancelled" && "İptal Edildi"}
                {reservation.status === "completed" && "Tamamlandı"}
                {!["confirmed", "pending", "cancelled", "completed"].includes(reservation.status || "") && 
                  reservation.status
                }
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Yeni Durum</label>
              <Select 
                value={newStatus} 
                onValueChange={setNewStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Onaylandı</SelectItem>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="cancelled">İptal Edildi</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => navigate("/admin/reservations")}
              >
                İptal
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updateReservationMutation.isPending || newStatus === reservation.status}
              >
                {updateReservationMutation.isPending && 
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                }
                Kaydet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}