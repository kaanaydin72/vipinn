import { ReactNode } from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import MobileNavBar from "@/components/layout/mobile-nav-bar";
import MobileHeader from "@/components/mobile/mobile-header";
import { useDeviceType } from "@/hooks/use-mobile";
import { useLocation } from "wouter";

interface MainLayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
  pageTitle?: string;
}

export default function MainLayout({ children, hideFooter = false, pageTitle = "" }: MainLayoutProps) {
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const [location] = useLocation();
  
  // Lokasyon kontrolleri yaparak header ve footer'ı sayfaya göre koşullu olarak göster
  const isAuthPage = location === "/auth";
  const isAdminPage = location.startsWith("/admin");
  
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950">
      {/* Mobil için üst başlık - Sadece mobile cihazlarda göster ve admin sayfasında olup olmadığını kontrol et */}
      {isMobile && !isAdminPage && <MobileHeader title={pageTitle} />}
      
      {/* Desktop için üst navigasyon - Sadece desktop cihazlarda ve admin sayfasında değilse göster */}
      {!isMobile && !isAdminPage && <Navbar />}
      
      {/* Ana içerik */}
      <div className={`flex-1 ${isMobile && !isAdminPage ? 'pb-16 pt-16' : ''}`}>
        {children}
      </div>
      
      {/* Mobil alt navigasyon çubuğu - Sadece mobile cihazlarda göster */}
      {isMobile && <MobileNavBar />}
      
      {/* Alt bilgi (footer) - istenirse gizlenebilir ve admin sayfası değilse göster */}
      {!hideFooter && !isMobile && !isAdminPage && <Footer />}
    </div>
  );
}