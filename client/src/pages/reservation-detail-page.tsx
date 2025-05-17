import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Reservation, Room, Hotel, HotelPolicy } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import MainLayout from "@/components/layout/main-layout";
import { useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { 
  Calendar, 
  Users, 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Loader2, 
  Info, 
  AlertTriangle,
  Printer,
  Share2,
  ArrowLeft,
  Download,
  Clock,
  CreditCard
} from "lucide-react";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Badge 
} from "@/components/ui/badge";
import { 
  Separator
} from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { 
  useToast 
} from "@/hooks/use-toast";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function ReservationDetailPage() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const { user, isLoading: isLoadingUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Rezervasyon detaylarını getir
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
  
  // Oda bilgilerini getir
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
  
  // Otel bilgilerini getir
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
  
  // Otel politikasını getir
  const {
    data: hotelPolicy,
    isLoading: isLoadingPolicy
  } = useQuery<HotelPolicy>({
    queryKey: ['/api/hotels', hotel?.id, 'policy'],
    queryFn: async () => {
      const res = await fetch(`/api/hotels/${hotel?.id}/policy`);
      if (res.status === 404 || !res.ok) return null;
      return res.json();
    },
    enabled: !!hotel?.id,
  });
  
  const isLoading = isLoadingUser || isLoadingReservation || isLoadingRoom || isLoadingHotel || isLoadingPolicy;
  
  // Rezervasyon iptali için mutation
  const cancelReservationMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/reservations/${id}/cancel`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Rezervasyon iptal edildi",
        description: "Rezervasyonunuz başarıyla iptal edildi.",
        variant: "default",
      });
      // Rezervasyonları yenile
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations', parseInt(id as string)] });
      setCancelDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "İptal işlemi başarısız",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Rezervasyon iptal et
  const handleCancelReservation = () => {
    if (!reservation) return;
    cancelReservationMutation.mutate(reservation.id);
  };
  
  // Format date range
  const formatDateRange = (checkIn: string, checkOut: string) => {
    return `${format(new Date(checkIn), "d MMMM", { locale: tr })} - ${format(new Date(checkOut), "d MMMM yyyy", { locale: tr })}`;
  };
  
  // Calculate total price
  const calculateTotalPrice = (reservation: Reservation) => {
    return reservation.totalPrice || 0;
  };
  
  // Format date
  const formatDate = (date: string) => {
    return format(new Date(date), "d MMMM yyyy", { locale: tr });
  };
  
  // Format time
  const formatTime = (date: string) => {
    return format(new Date(date), "HH:mm", { locale: tr });
  };
  
  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-blue-500">Onaylandı</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Tamamlandı</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">İptal Edildi</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Beklemede</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // İptal edilebilir mi?
  const canBeCancelled = useMemo(() => {
    if (!reservation) return false;
    
    if (reservation.status === "cancelled" || reservation.status === "completed") {
      return false;
    }
    
    const checkInDate = new Date(reservation.checkIn);
    const now = new Date();
    const hoursDifference = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const daysDifference = hoursDifference / 24;
    
    // Otel politikası varsa onu kullan
    if (hotelPolicy) {
      return daysDifference >= (hotelPolicy.cancellationDays || 1);
    }
    
    // Varsayılan kural: 24 saat öncesine kadar iptal edilebilir
    return hoursDifference >= 24;
  }, [reservation, hotelPolicy]);
  
  // Rezervasyonu yazdır
  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Hata",
        description: "Yazdırma penceresi açılamadı. Lütfen popup engelleyiciyi kontrol edin.",
        variant: "destructive",
      });
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Rezervasyon #${reservation?.id} - ${hotel?.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 1px solid #ddd;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .reservation-id {
              font-size: 16px;
              color: #666;
              margin-bottom: 5px;
            }
            .reservation-code {
              font-size: 18px;
              color: #0066cc;
              font-weight: bold;
              margin-bottom: 20px;
            }
            .section {
              margin-bottom: 20px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
              padding-bottom: 5px;
              border-bottom: 1px solid #eee;
            }
            .info-row {
              display: flex;
              margin-bottom: 8px;
            }
            .info-label {
              width: 150px;
              font-weight: bold;
            }
            .info-value {
              flex: 1;
            }
            .price-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .price-table th, .price-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            .price-table th {
              background-color: #f5f5f5;
            }
            .total-row {
              font-weight: bold;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .status {
              display: inline-block;
              padding: 5px 10px;
              border-radius: 4px;
              font-size: 14px;
              font-weight: bold;
            }
            .status-confirmed {
              background-color: #e6f7ff;
              color: #0066cc;
            }
            .status-completed {
              background-color: #e6f7e6;
              color: #00802b;
            }
            .status-cancelled {
              background-color: #ffe6e6;
              color: #cc0000;
            }
            .status-pending {
              background-color: #fff8e6;
              color: #cc7a00;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Vipinn Hotels</div>
            <div class="reservation-id">Rezervasyon #${reservation?.id}</div>
            ${reservation?.reservationCode ? `<div class="reservation-code">Rezervasyon Kodu: ${reservation.reservationCode}</div>` : ''}
          </div>
          
          <div class="section">
            <div class="section-title">Rezervasyon Bilgileri</div>
            <div class="info-row">
              <div class="info-label">Durum:</div>
              <div class="info-value">
                <span class="status status-${reservation?.status}">
                  ${reservation?.status === "confirmed" ? "Onaylandı" : 
                    reservation?.status === "completed" ? "Tamamlandı" : 
                    reservation?.status === "cancelled" ? "İptal Edildi" : 
                    reservation?.status === "pending" ? "Beklemede" : 
                    reservation?.status}
                </span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-label">Oluşturulma Tarihi:</div>
              <div class="info-value">${reservation ? formatDate(String(reservation.createdAt)) : ''} ${reservation ? formatTime(String(reservation.createdAt)) : ''}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Ödeme Yöntemi:</div>
              <div class="info-value">${reservation?.paymentMethod === "credit_card" ? "Kredi Kartı" : "Otelde Ödeme"}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Ödeme Durumu:</div>
              <div class="info-value">${reservation?.paymentStatus === "paid" ? "Ödendi" : "Beklemede"}</div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Otel Bilgileri</div>
            <div class="info-row">
              <div class="info-label">Otel:</div>
              <div class="info-value">${hotel?.name}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Adres:</div>
              <div class="info-value">${hotel?.address}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Oda:</div>
              <div class="info-value">${room?.name} - ${room?.type}</div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Konaklama Bilgileri</div>
            <div class="info-row">
              <div class="info-label">Giriş Tarihi:</div>
              <div class="info-value">${reservation ? formatDate(String(reservation.checkIn)) : ''}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Çıkış Tarihi:</div>
              <div class="info-value">${reservation ? formatDate(String(reservation.checkOut)) : ''}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Konaklama Süresi:</div>
              <div class="info-value">${reservation ? Math.ceil((new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / (1000 * 60 * 60 * 24)) : ''} gece</div>
            </div>
            <div class="info-row">
              <div class="info-label">Misafir Sayısı:</div>
              <div class="info-value">${reservation?.numberOfGuests} kişi</div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Fiyat Detayları</div>
            <table class="price-table">
              <thead>
                <tr>
                  <th>Açıklama</th>
                  <th style="text-align: right;">Fiyat</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${room?.name} - ${reservation ? Math.ceil((new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / (1000 * 60 * 60 * 24)) : ''} gece</td>
                  <td style="text-align: right;">${reservation?.totalPrice.toFixed(2)} ₺</td>
                </tr>
                <tr class="total-row">
                  <td>Toplam:</td>
                  <td style="text-align: right;">${reservation?.totalPrice.toFixed(2)} ₺</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          ${hotelPolicy ? `
          <div class="section">
            <div class="section-title">Otel Politikası</div>
            <div class="info-row">
              <div class="info-label">Giriş Saati:</div>
              <div class="info-value">${hotelPolicy.checkInTime}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Çıkış Saati:</div>
              <div class="info-value">${hotelPolicy.checkOutTime}</div>
            </div>
            <div class="info-row">
              <div class="info-label">İptal Politikası:</div>
              <div class="info-value">
                ${hotelPolicy.cancellationPolicy === "FIRST_NIGHT" 
                  ? `Giriş tarihine ${hotelPolicy.cancellationDays} gün kalana kadar ücretsiz iptal yapabilirsiniz. Daha sonra yapılan iptallerde ilk gece konaklama bedeli tahsil edilir.`
                  : hotelPolicy.cancellationPolicy === "FIFTY_PERCENT" 
                  ? `Giriş tarihine ${hotelPolicy.cancellationDays} gün kalana kadar ücretsiz iptal yapabilirsiniz. Daha sonra yapılan iptallerde toplam tutarın %50'si kadar ceza uygulanır.`
                  : hotelPolicy.cancellationPolicy === "FULL_AMOUNT" 
                  ? `Giriş tarihine ${hotelPolicy.cancellationDays} gün kalana kadar ücretsiz iptal yapabilirsiniz. Daha sonra yapılan iptallerde toplam tutar tahsil edilir.`
                  : hotelPolicy.cancellationPolicy === "NO_REFUND" 
                  ? "Bu rezervasyon iade edilemez. İptal durumunda herhangi bir geri ödeme yapılmaz."
                  : "Standart iptal politikası geçerlidir."}
              </div>
            </div>
          </div>
          ` : ''}
          
          <div class="footer">
            <p>Bu belge, Vipinn Hotels rezervasyon sisteminden ${format(new Date(), "d MMMM yyyy HH:mm", { locale: tr })} tarihinde yazdırılmıştır.</p>
            <p>Sorularınız için otelle iletişime geçebilirsiniz.</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    // Pencereyi otomatik kapatma - kullanıcının kendi kapatması daha iyi
    // printWindow.close();
  };
  
  // Rezervasyonu paylaş
  const handleShare = async () => {
    if (!reservation || !hotel || !room) return;
    
    const shareText = `Vipinn Hotels - ${hotel.name}\nRezervasyon Kodu: ${reservation.reservationCode}\nOda: ${room.name}\nTarih: ${formatDateRange(String(reservation.checkIn), String(reservation.checkOut))}\nMisafir: ${reservation.numberOfGuests} kişi`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${hotel.name} Rezervasyonu`,
          text: shareText,
        });
      } catch (err) {
        console.error("Paylaşım hatası:", err);
        
        // Fallback: Panoya kopyala
        navigator.clipboard.writeText(shareText)
          .then(() => {
            toast({
              title: "Kopyalandı",
              description: "Rezervasyon bilgileri panoya kopyalandı.",
              variant: "default",
            });
          })
          .catch(err => {
            console.error("Panoya kopyalama hatası:", err);
            toast({
              title: "Hata",
              description: "Rezervasyon bilgileri paylaşılamadı.",
              variant: "destructive",
            });
          });
      }
    } else {
      // Paylaşım API'si yoksa, panoya kopyala
      navigator.clipboard.writeText(shareText)
        .then(() => {
          toast({
            title: "Kopyalandı",
            description: "Rezervasyon bilgileri panoya kopyalandı.",
            variant: "default",
          });
        })
        .catch(err => {
          console.error("Panoya kopyalama hatası:", err);
          toast({
            title: "Hata",
            description: "Rezervasyon bilgileri paylaşılamadı.",
            variant: "destructive",
          });
        });
    }
  };
  
  // Ödeme işlemini başlat
  const initiatePayment = async () => {
    if (!reservation || reservation.paymentStatus === "paid") return;
    
    try {
      setIsProcessingPayment(true);
      
      // API çağrısıyla ödeme token'ı alma
      const response = await apiRequest(
        "POST", 
        `/api/payments/create-payment/${reservation.id}`,
        { reservationId: reservation.id }
      );
      
      const paymentData = await response.json();
      console.log("Ödeme verileri:", paymentData);
      
      if (paymentData && paymentData.token && paymentData.paymentUrl) {
        console.log("PayTR ödeme sayfasına yönlendiriliyor...");
        console.log("Token:", paymentData.token);
        console.log("URL:", paymentData.paymentUrl);
        
        // Önce iframe yöntemi dene
        try {
          // HTML ile iframe oluştur
          const iframeForm = document.createElement('form');
          iframeForm.method = 'post';
          iframeForm.action = 'https://www.paytr.com/odeme/guvenli';
          iframeForm.target = 'paytr_iframe';
          iframeForm.id = 'paytr-payment-form';
          
          const tokenInput = document.createElement('input');
          tokenInput.type = 'hidden';
          tokenInput.name = 'token';
          tokenInput.value = paymentData.token;
          
          iframeForm.appendChild(tokenInput);
          
          // Frameler için div oluştur
          const iframeContainer = document.createElement('div');
          iframeContainer.id = 'paytr-iframe-container';
          iframeContainer.style.position = 'fixed';
          iframeContainer.style.top = '0';
          iframeContainer.style.left = '0';
          iframeContainer.style.width = '100%';
          iframeContainer.style.height = '100%';
          iframeContainer.style.zIndex = '9999';
          iframeContainer.style.backgroundColor = 'rgba(0,0,0,0.7)';
          
          const iframe = document.createElement('iframe');
          iframe.name = 'paytr_iframe';
          iframe.style.width = '90%';
          iframe.style.height = '90%';
          iframe.style.position = 'absolute';
          iframe.style.top = '5%';
          iframe.style.left = '5%';
          iframe.style.border = 'none';
          iframe.style.backgroundColor = 'white';
          
          iframeContainer.appendChild(iframe);
          document.body.appendChild(iframeContainer);
          document.body.appendChild(iframeForm);
          
          // Form submit ederek iframe içinde ödeme sayfasını aç
          iframeForm.submit();
        } catch (iframeError) {
          console.error("iframe oluşturma hatası:", iframeError);
          // Fallback: iframe başarısız olursa doğrudan yönlendir
          window.location.href = paymentData.paymentUrl;
        }
      } else if (paymentData && paymentData.paymentUrl) {
        // Sadece URL varsa direkt yönlendir
        window.location.href = paymentData.paymentUrl;
      } else {
        throw new Error("Ödeme bilgileri alınamadı");
      }
    } catch (error) {
      console.error("Ödeme başlatma hatası:", error);
      toast({
        title: "Ödeme Hatası",
        description: "Ödeme işlemi başlatılamadı. Lütfen daha sonra tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Geri dön
  const handleGoBack = () => {
    navigate("/reservations");
  };
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  if (!reservation || !room || !hotel) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center justify-center text-center py-12">
            <X className="h-16 w-16 text-neutral-400 mb-4" />
            <h1 className="text-2xl font-bold text-neutral-800 dark:text-white mb-2">Rezervasyon bulunamadı</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Aradığınız rezervasyon bilgilerine ulaşılamadı veya böyle bir rezervasyon bulunmuyor.
            </p>
            <Button onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Rezervasyonlara Dön
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      
      <main className="flex-grow py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center mb-8">
            <Button 
              variant="ghost" 
              className="mr-4" 
              onClick={handleGoBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">Rezervasyon Detayları</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                #{id} numaralı rezervasyon
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sol taraf - Rezervasyon içeriği */}
            <div className="md:col-span-3">
              <div ref={printRef}>
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{hotel.name}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {hotel.address}
                        </CardDescription>
                      </div>
                      <div>
                        {getStatusBadge(reservation.status)}
                      </div>
                    </div>
                    {reservation.reservationCode && (
                      <div className="mt-3 bg-blue-50 text-blue-600 text-sm font-medium px-3 py-2 rounded border border-blue-100 flex items-center">
                        <Info className="h-4 w-4 mr-2" />
                        Rezervasyon Kodu: <span className="font-bold ml-1">{reservation.reservationCode}</span>
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-medium text-neutral-800 dark:text-white mb-3">Konaklama Bilgileri</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Giriş Tarihi</p>
                          <p className="font-medium flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-neutral-500" />
                            {formatDate(String(reservation.checkIn))}
                          </p>
                          {hotelPolicy && (
                            <p className="text-xs text-neutral-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Giriş Saati: {hotelPolicy.checkInTime}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Çıkış Tarihi</p>
                          <p className="font-medium flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-neutral-500" />
                            {formatDate(String(reservation.checkOut))}
                          </p>
                          {hotelPolicy && (
                            <p className="text-xs text-neutral-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Çıkış Saati: {hotelPolicy.checkOutTime}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Süre</p>
                          <p className="font-medium">
                            {Math.ceil((new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / (1000 * 60 * 60 * 24))} gece
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">Misafir Sayısı</p>
                          <p className="font-medium flex items-center">
                            <Users className="h-4 w-4 mr-2 text-neutral-500" />
                            {reservation.numberOfGuests} kişi
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium text-neutral-800 dark:text-white mb-3">Oda Detayları</h3>
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-4 sm:col-span-3">
                          <div 
                            className="h-24 rounded-md bg-cover bg-center"
                            style={{ backgroundImage: `url(${room.imageUrl})` }}
                          />
                        </div>
                        <div className="col-span-8 sm:col-span-9">
                          <p className="font-medium text-neutral-800 dark:text-white">
                            {room.name} - {room.type}
                          </p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2">
                            {room.description}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {room.features.slice(0, 3).map((feature, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {room.features.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{room.features.length - 3} daha
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium text-neutral-800 dark:text-white mb-3">Ödeme Bilgileri</h3>
                      <div className="bg-neutral-50 dark:bg-neutral-800 rounded-md p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Ödeme Yöntemi</p>
                            <p className="font-medium">
                              {reservation.paymentMethod === "credit_card" ? "Kredi Kartı" : "Otelde Ödeme"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Ödeme Durumu</p>
                            <div className="font-medium">
                              {reservation.paymentStatus === "paid" ? (
                                <Badge className="bg-green-500">Ödendi</Badge>
                              ) : (
                                <Badge className="bg-yellow-500">Beklemede</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <Table className="mt-4">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Açıklama</TableHead>
                              <TableHead className="text-right">Fiyat</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>{room.name} - {Math.ceil((new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / (1000 * 60 * 60 * 24))} gece</TableCell>
                              <TableCell className="text-right">{reservation.totalPrice.toFixed(2)} ₺</TableCell>
                            </TableRow>
                          </TableBody>
                          <TableFooter>
                            <TableRow>
                              <TableCell>Toplam</TableCell>
                              <TableCell className="text-right">{reservation.totalPrice.toFixed(2)} ₺</TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                        
                        {/* Ödeme durumu beklemede ve kredi kartı ile ödeme seçilmişse ödeme butonunu göster */}
                        {reservation.paymentStatus === "pending" && reservation.paymentMethod === "credit_card" && (
                          <div className="mt-4 flex justify-end">
                            <Button 
                              variant="outline"
                              onClick={initiatePayment}
                              disabled={isProcessingPayment}
                              className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300"
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Kredi Kartı ile Öde
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {hotelPolicy && (
                      <>
                        <Separator />
                        
                        <div>
                          <h3 className="font-medium text-neutral-800 dark:text-white mb-3">Otel Politikası</h3>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Giriş Saati</p>
                                <p className="font-medium">{hotelPolicy.checkInTime}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Çıkış Saati</p>
                                <p className="font-medium">{hotelPolicy.checkOutTime}</p>
                              </div>
                            </div>
                            
                            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-4 rounded-md mt-2">
                              <div className="font-medium text-amber-800 dark:text-amber-400 flex items-center">
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                İptal Politikası
                              </div>
                              <p className="text-sm text-amber-800 dark:text-amber-400 mt-2">
                                {hotelPolicy.cancellationPolicy === "FIRST_NIGHT" && 
                                  `Giriş tarihine ${hotelPolicy.cancellationDays} gün kalana kadar ücretsiz iptal yapabilirsiniz. Daha sonra yapılan iptallerde ilk gece konaklama bedeli tahsil edilir.`
                                }
                                {hotelPolicy.cancellationPolicy === "FIFTY_PERCENT" && 
                                  `Giriş tarihine ${hotelPolicy.cancellationDays} gün kalana kadar ücretsiz iptal yapabilirsiniz. Daha sonra yapılan iptallerde toplam tutarın %50'si kadar ceza uygulanır.`
                                }
                                {hotelPolicy.cancellationPolicy === "FULL_AMOUNT" && 
                                  `Giriş tarihine ${hotelPolicy.cancellationDays} gün kalana kadar ücretsiz iptal yapabilirsiniz. Daha sonra yapılan iptallerde toplam tutar tahsil edilir.`
                                }
                                {hotelPolicy.cancellationPolicy === "NO_REFUND" && 
                                  "Bu rezervasyon iade edilemez. İptal durumunda herhangi bir geri ödeme yapılmaz."
                                }
                              </p>
                            </div>
                            
                            {hotelPolicy.description && (
                              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                <p className="font-medium text-neutral-800 dark:text-white mb-1">Diğer Kurallar</p>
                                <p>{hotelPolicy.description}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Sağ taraf - Aksiyonlar */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">İşlemler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={handlePrint}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Yazdır
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Paylaş
                  </Button>
                  
                  {reservation.status !== "cancelled" && (
                    <Button 
                      variant="destructive" 
                      className="w-full justify-start" 
                      onClick={() => setCancelDialogOpen(true)}
                      disabled={!canBeCancelled || cancelReservationMutation.isPending}
                    >
                      {cancelReservationMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      {!cancelReservationMutation.isPending && (
                        <X className="h-4 w-4 mr-2" />
                      )}
                      İptal Et
                    </Button>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4 text-xs text-neutral-500 dark:text-neutral-400">
                  <p>
                    Rezervasyon tarihi: {formatDate(String(reservation.createdAt))}
                  </p>
                </CardFooter>
              </Card>
              
              {hotel && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Otel İletişim</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-neutral-500" />
                      <span>+90 212 123 4567</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-neutral-500" />
                      <span>info@{hotel.name.toLowerCase().replace(/\s+/g, '')}hotels.com</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* İptal Onay Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rezervasyonu İptal Et</DialogTitle>
            <DialogDescription>
              Bu rezervasyonu iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          
          {hotelPolicy ? (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-4 rounded-md my-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm text-amber-800 dark:text-amber-400 font-medium">
                    {hotel.name} İptal Politikası
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-400">
                    {hotelPolicy.cancellationPolicy === "FIRST_NIGHT" && 
                      `Giriş tarihine ${hotelPolicy.cancellationDays} gün kalana kadar ücretsiz iptal yapabilirsiniz. Daha sonra yapılan iptallerde ilk gece konaklama bedeli tahsil edilir.`
                    }
                    {hotelPolicy.cancellationPolicy === "FIFTY_PERCENT" && 
                      `Giriş tarihine ${hotelPolicy.cancellationDays} gün kalana kadar ücretsiz iptal yapabilirsiniz. Daha sonra yapılan iptallerde toplam tutarın %50'si kadar ceza uygulanır.`
                    }
                    {hotelPolicy.cancellationPolicy === "FULL_AMOUNT" && 
                      `Giriş tarihine ${hotelPolicy.cancellationDays} gün kalana kadar ücretsiz iptal yapabilirsiniz. Daha sonra yapılan iptallerde toplam tutar tahsil edilir.`
                    }
                    {hotelPolicy.cancellationPolicy === "NO_REFUND" && 
                      "Bu rezervasyon iade edilemez. İptal durumunda herhangi bir geri ödeme yapılmaz."
                    }
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-400">
                    İptal işlemi sonrası iade işlemleri için otelle iletişime geçebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-4 rounded-md my-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-400">
                  Rezervasyonunuz iptal edilirse, ödemeniz iade politikasına göre işleme alınacaktır. İptal işlemi sonrası otelle iletişime geçebilirsiniz.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Vazgeç
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelReservation}
              disabled={cancelReservationMutation.isPending}
            >
              {cancelReservationMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Rezervasyonu İptal Et
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </MainLayout>
  );
}