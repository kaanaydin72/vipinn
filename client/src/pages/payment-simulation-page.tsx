import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/main-layout";
import { Loader2, CreditCard, CheckCircle, XCircle, ArrowLeft, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function PaymentSimulationPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<any>(null);
  const [cardInfo, setCardInfo] = useState({
    cardNumber: "4242 4242 4242 4242",
    expiryDate: "12/25",
    cvv: "123",
    nameOnCard: "Test User"
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Simulate delay for API call
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    // Fetch reservation data if needed
    if (id) {
      apiRequest("GET", `/api/reservations/${id}`)
        .then(res => res.json())
        .then(data => {
          setReservation(data);
        })
        .catch(error => {
          console.error("Rezervasyon bilgisi alınamadı:", error);
          toast({
            title: "Hata",
            description: "Rezervasyon bilgisi alınamadı.",
            variant: "destructive"
          });
        });
    }

    return () => clearTimeout(timer);
  }, [id, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentSuccess = async () => {
    setProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update reservation payment status in database
      const response = await apiRequest("POST", `/api/reservations/${id}/payment-status`, {
        status: "completed",
        method: "credit_card",
        paymentId: `sim_${Date.now()}`
      });
      
      if (!response.ok) {
        throw new Error("Ödeme durumu güncellenirken bir hata oluştu");
      }
      
      setProcessing(false);
      
      toast({
        title: "Ödeme Başarılı",
        description: "Ödemeniz başarıyla gerçekleştirildi.",
        variant: "default"
      });
      
      // Redirect to success page
      setTimeout(() => {
        setLocation(`/reservations/${id}?payment=success`);
      }, 1500);
    } catch (error) {
      console.error("Ödeme işlemi sırasında hata:", error);
      setProcessing(false);
      
      toast({
        title: "İşlem Hatası",
        description: "Ödeme işlenirken bir hata oluştu, lütfen tekrar deneyin.",
        variant: "destructive"
      });
    }
  };

  const handlePaymentFail = async () => {
    setProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update reservation payment status in database
      const response = await apiRequest("POST", `/api/reservations/${id}/payment-status`, {
        status: "failed",
        method: "credit_card",
        paymentId: null
      });
      
      if (!response.ok) {
        throw new Error("Ödeme durumu güncellenirken bir hata oluştu");
      }
      
      setProcessing(false);
      
      toast({
        title: "Ödeme Başarısız",
        description: "Ödeme işleminiz gerçekleştirilemedi.",
        variant: "destructive"
      });
      
      // Redirect to fail page
      setTimeout(() => {
        setLocation(`/reservations/${id}?payment=failed`);
      }, 1500);
    } catch (error) {
      console.error("Ödeme işlemi sırasında hata:", error);
      setProcessing(false);
      
      toast({
        title: "İşlem Hatası",
        description: "Ödeme durumu güncellenirken bir hata oluştu.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1" 
            onClick={() => setLocation("/reservations")}
          >
            <ArrowLeft className="h-4 w-4" />
            Rezervasyonlara Dön
          </Button>
        </div>
      
        <Alert className="mb-4 border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/50">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertTitle>Simülasyon Modu</AlertTitle>
          <AlertDescription>
            Bu sayfa, gerçek PayTR ödeme sayfasını simüle etmektedir ve yalnızca test amaçlıdır. 
            Üretim ortamında PayTR'nin gerçek ödeme sayfası kullanılacaktır.
          </AlertDescription>
        </Alert>
      
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4">
            <CreditCard className="h-6 w-6 text-blue-500 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">PayTR Ödeme Sayfası</h1>
          <div className="flex justify-center">
            <Badge variant="secondary" className="mb-3">Simülasyon</Badge>
          </div>
          <p className="text-muted-foreground">
            Lütfen ödeme bilgilerinizi girin ve işlemi tamamlayın.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Ödeme Bilgileri</CardTitle>
                <CardDescription>
                  Test amaçlı kart bilgilerini girin veya önerilen değerleri kullanın.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Kart Numarası</Label>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    placeholder="0000 0000 0000 0000"
                    value={cardInfo.cardNumber}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Son Kullanma Tarihi</Label>
                    <Input
                      id="expiryDate"
                      name="expiryDate"
                      placeholder="AA/YY"
                      value={cardInfo.expiryDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV/CVC</Label>
                    <Input
                      id="cvv"
                      name="cvv"
                      placeholder="123"
                      value={cardInfo.cvv}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nameOnCard">Kart Üzerindeki İsim</Label>
                  <Input
                    id="nameOnCard"
                    name="nameOnCard"
                    placeholder="Ad Soyad"
                    value={cardInfo.nameOnCard}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col gap-4">
                <Button
                  onClick={handlePaymentSuccess}
                  className="w-full"
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Ödemeyi Tamamla
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handlePaymentFail}
                  variant="outline"
                  className="w-full"
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Ödemeyi Reddet (Test)
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Sipariş Özeti</CardTitle>
                <CardDescription>
                  Rezervasyon detaylarınız
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {reservation ? (
                  <>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 mb-2">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Rezervasyon Kodu</p>
                      <p className="text-xl font-bold tracking-wider text-blue-900 dark:text-blue-50">
                        {reservation.reservationCode || `VIPINN${reservation.id}`}
                      </p>
                    </div>
                    
                    <div className="border-b pb-3">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium">Ödeme Durumu</p>
                        <Badge 
                          variant={reservation.paymentStatus === 'completed' ? 'success' : 
                                 reservation.paymentStatus === 'failed' ? 'destructive' : 'outline'}
                        >
                          {reservation.paymentStatus === 'completed' ? 'Ödendi' : 
                           reservation.paymentStatus === 'failed' ? 'Başarısız' : 'Bekliyor'}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">Rezervasyon Durumu</p>
                        <Badge variant={reservation.status === 'confirmed' ? 'default' : 
                                      reservation.status === 'cancelled' ? 'destructive' : 'outline'}>
                          {reservation.status === 'confirmed' ? 'Onaylandı' :
                           reservation.status === 'cancelled' ? 'İptal Edildi' : reservation.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="border-b pb-3">
                      <p className="text-sm font-medium mb-1">Giriş - Çıkış Tarihi</p>
                      <p className="font-medium">
                        {new Date(reservation.checkIn).toLocaleDateString('tr-TR')} - {' '}
                        {new Date(reservation.checkOut).toLocaleDateString('tr-TR')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.ceil((new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / (1000 * 60 * 60 * 24))} gece konaklama
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Toplam Ödeme Tutarı</p>
                      <p className="text-2xl font-bold text-primary">
                        {reservation.totalPrice.toLocaleString('tr-TR')} TL
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Rezervasyon #{reservation.id} | Oda #{reservation.roomId}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <p>Rezervasyon detayları yükleniyor...</p>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-center border-t pt-4">
                <p className="text-xs text-muted-foreground text-center">
                  Bu ödeme simüle edilmektedir. <br />
                  Gerçek kart bilgileriniz kullanılmayacak ve saklanmayacaktır.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}