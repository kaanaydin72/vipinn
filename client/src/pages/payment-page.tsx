import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { Reservation, Room, Hotel } from "@shared/schema";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { useState, useEffect } from "react";
import { Loader2, Check, AlertTriangle, ArrowLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function PaymentPage() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const { user, isLoading: isLoadingUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Rezervasyon detayını getir
  const { 
    data: reservation, 
    isLoading: isLoadingReservation 
  } = useQuery<Reservation>({
    queryKey: ['/api/reservations', parseInt(id as string)],
    queryFn: async () => {
      const res = await fetch(`/api/reservations/${id}`);
      if (!res.ok) throw new Error("Rezervasyon bulunamadı");
      return res.json();
    },
    enabled: !!id && !!user,
  });
  
  // Oda bilgisini getir
  const {
    data: room,
    isLoading: isLoadingRoom
  } = useQuery<Room>({
    queryKey: ['/api/rooms', reservation?.roomId],
    queryFn: async () => {
      const res = await fetch(`/api/rooms/${reservation?.roomId}`);
      if (!res.ok) throw new Error("Oda bilgileri bulunamadı");
      return res.json();
    },
    enabled: !!reservation?.roomId,
  });
  
  // Otel bilgisini getir
  const {
    data: hotel,
    isLoading: isLoadingHotel
  } = useQuery<Hotel>({
    queryKey: ['/api/hotels', room?.hotelId],
    queryFn: async () => {
      const res = await fetch(`/api/hotels/${room?.hotelId}`);
      if (!res.ok) throw new Error("Otel bilgileri bulunamadı");
      return res.json();
    },
    enabled: !!room?.hotelId,
  });
  
  // Kredi kartı ödeme işlemini başlat
  useEffect(() => {
    if (reservation && reservation.id && reservation.paymentMethod === "credit_card" && reservation.paymentStatus === "pending") {
      setIsLoading(true);
      
      // PayTR ödeme başlatma isteği
      fetch(`/api/payments/create-payment/${reservation.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
          toast({
            title: "Ödeme Hatası",
            description: data.error,
            variant: "destructive",
          });
        } else if (data.paymentUrl) {
          setPaymentUrl(data.paymentUrl);
          
          // Kullanıcıyı PayTR ödeme sayfasına yönlendir
          // Yönlendirme yapıldığında sorun olursa, kullanıcı butona tıklayarak manuel olarak yapabilsin
          console.log("PayTR ödeme sayfasına yönlendiriliyor:", data.paymentUrl);
          
          // İframe veya popup yönlendirmede sorun olabileceği için, tam sayfa yönlendirme yapıyoruz
          window.location.href = data.paymentUrl;
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Ödeme başlatma hatası:", err);
        setError("Ödeme işlemi başlatılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
        toast({
          title: "Ödeme Hatası",
          description: "Ödeme işlemi başlatılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
          variant: "destructive",
        });
        setIsLoading(false);
      });
    } else if (reservation && reservation.paymentMethod !== "credit_card") {
      setError("Bu rezervasyon kredi kartı ile ödeme seçeneği ile oluşturulmamış.");
      setIsLoading(false);
    } else if (reservation && reservation.paymentStatus !== "pending") {
      setError("Bu rezervasyon için ödeme işlemi zaten tamamlanmış veya iptal edilmiş.");
      setIsLoading(false);
    } else if (!isLoadingReservation && !isLoadingRoom && !isLoadingHotel && !isLoadingUser) {
      setIsLoading(false);
    }
  }, [reservation, isLoadingReservation, isLoadingRoom, isLoadingHotel, isLoadingUser, toast]);
  
  // Format date
  const formatDate = (date: string) => {
    return format(new Date(date), "d MMMM yyyy", { locale: tr });
  };
  
  // Yükleniyor gösterimini yap
  if (isLoading || isLoadingReservation || isLoadingRoom || isLoadingHotel || isLoadingUser) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <CardTitle>Ödeme İşlemi Başlatılıyor</CardTitle>
              <CardDescription>Lütfen bekleyin, ödeme sayfasına yönlendiriliyorsunuz</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </CardContent>
            <CardFooter className="text-center text-sm text-muted-foreground">
              Güvenli ödeme sayfasına yönlendiriliyorsunuz. Bu işlem birkaç saniye sürebilir.
            </CardFooter>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }
  
  // Hata durumunda göster
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <AlertTriangle className="h-10 w-10" />
                </div>
              </div>
              <CardTitle>Ödeme İşlemi Başlatılamadı</CardTitle>
              <CardDescription className="mt-2 text-red-500">{error}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4">
                Ödeme işlemi sırasında bir sorun oluştu. Lütfen daha sonra tekrar deneyin veya farklı bir ödeme yöntemi seçin.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button 
                variant="outline" 
                className="mr-2"
                onClick={() => navigate(`/reservations/${id}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Rezervasyona Dön
              </Button>
              <Button onClick={() => navigate("/reservations")}>
                Tüm Rezervasyonlarım
              </Button>
            </CardFooter>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }
  
  // PayTR ödeme sayfasına yönlendirirken göster
  if (paymentUrl) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <CreditCard className="h-10 w-10" />
                </div>
              </div>
              <CardTitle>Ödeme Sayfasına Yönlendiriliyorsunuz</CardTitle>
              <CardDescription className="mt-2">
                PayTR güvenli ödeme sayfasına yönlendiriliyorsunuz. Lütfen bekleyin.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Yönlendirme otomatik olarak gerçekleşmezse aşağıdaki butona tıklayın.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={() => window.location.href = paymentUrl}>
                Ödeme Sayfasına Git
              </Button>
            </CardFooter>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }
  
  // Eğer hiçbir koşula uymazsa varsayılan olarak yükleniyor gösterimini kullan
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle>Ödeme Sayfası</CardTitle>
            <CardDescription>Ödeme bilgileri yükleniyor...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}