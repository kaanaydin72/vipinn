import { useParams, Link } from "wouter";
import { useDeviceType } from "@/hooks/use-mobile";
import HotelDetailMobile from "./hotel-detail-mobile";

// Masaüstü versiyonu burada oluşturulacak
export default function HotelDetail() {
  const { id } = useParams<{ id: string }>();
  const deviceType = useDeviceType();
  
  // Mobil cihazlarda mobil versiyonu göster
  if (deviceType === 'mobile') {
    return <HotelDetailMobile />;
  }
  
  // Masaüstü versiyonu (şimdilik sadece mobil versiyon var, ileride masaüstü versiyonu eklenecek)
  return <HotelDetailMobile />;
}