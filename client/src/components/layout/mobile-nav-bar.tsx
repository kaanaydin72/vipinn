import { useLocation } from "wouter";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useDeviceType } from "@/hooks/use-mobile";
import {
  Home,
  Building2,
  CalendarCheck2,
  User,
  LogOut,
  Menu,
  X,
  Settings,
  Hotel,
  BedDouble,
  Info,
  Mail,
  CreditCard,
  FileText,
  Layers
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/language-switcher";

export default function MobileNavBar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const deviceType = useDeviceType();
  const { t } = useTranslation();

  // Menüyü konum değiştiğinde otomatik kapat
  useEffect(() => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [location]);

  // Sadece mobil cihazlarda göster
  if (deviceType !== 'mobile') {
    return null;
  }

  // Giriş yapmış kullanıcılar için temel menü öğeleri - sadece 3 sayfa (Ana Sayfa, Oteller, Rezervasyonlar)
  const loggedInItems = [
    {
      name: t('home'),
      href: "/",
      icon: Home,
    },
    {
      name: t('hotels'),
      href: "/hotels",
      icon: Hotel,
    },
    {
      name: t('booking_details'),
      href: "/reservations",
      icon: CalendarCheck2,
    }
  ];
  
  // Giriş yapmamış kullanıcılar için menü
  const guestItems = [
    {
      name: t('home'),
      href: "/",
      icon: Home,
    },
    {
      name: t('hotels'),
      href: "/hotels",
      icon: Hotel,
    },
    {
      name: t('about_us'),
      href: "/about",
      icon: Info,
    },
    {
      name: t('login'),
      href: "/auth",
      icon: User,
    }
  ];
  
  // Kullanıcı durumuna göre menüyü belirle
  const menuItems = user ? loggedInItems : guestItems;

  // Admin için özel durum - admin sayfaları
  if (user?.isAdmin) {
    menuItems.push({
      name: "Admin",
      href: "/admin",
      icon: Settings,
    });
  }

  // İlk 4 öğe alt navigasyonda görünecek
  const bottomNavItems = menuItems.slice(0, 4);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <>
      {/* Mobil alt gezinme çubuğu - iOS/Android tarzında */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg border-t border-[#2094f3]/30 shadow-[0_-4px_20px_rgba(32,148,243,0.15)] z-30 md:hidden rounded-t-xl"
        style={{
          WebkitBoxShadow: '0 -4px 20px rgba(32,148,243,0.15)'
        }}
      >
        <div className="flex justify-around px-1 py-1">
          {bottomNavItems.map((item, index) => {
            const isActive = location.startsWith(item.href);
            const IconComponent = item.icon;
            
            return (
              <Link key={item.href} href={item.href} className="flex-1 relative">
                {/* iOS/Android tarzı aktif göstergesi - üst kısımda parlak glow efekti */}
                {isActive && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-12 h-1 rounded-full bg-[#2094f3]/30 blur-sm"></div>
                )}
                
                <div
                  className={cn(
                    "flex flex-col items-center py-2 px-2 relative transition-all duration-300",
                    isActive
                      ? "text-[#2094f3] font-medium"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-[#2094f3]/70"
                  )}
                >
                  <div 
                    className={cn(
                      "p-2.5 rounded-xl transition-all duration-300 mb-0.5 active:scale-90",
                      isActive 
                        ? "bg-[#2094f3]/15 shadow-[inset_0_1px_4px_rgba(32,148,243,0.4)] border border-[#2094f3]/20"
                        : "hover:bg-[#2094f3]/5"
                    )}
                    style={{
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    <IconComponent className={cn(
                      "h-5 w-5 transition-all duration-300", 
                      isActive ? "text-[#2094f3]" : ""
                    )} />
                  </div>
                  <span className={cn(
                    "text-xs mt-1",
                    isActive ? "font-semibold" : "font-normal"
                  )}>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Admin için gelişmiş koşullu alt gezinme çubuğu - sadece admin sayfalarında görünür */}
      {user?.isAdmin && location.startsWith('/admin') && (
        <div 
          className="fixed bottom-[70px] left-0 right-0 bg-[#2094f3]/90 backdrop-blur-lg border-t border-white/20 shadow-[0_-2px_10px_rgba(32,148,243,0.3)] z-20 md:hidden rounded-t-xl"
          style={{
            WebkitBoxShadow: '0 -2px 10px rgba(32,148,243,0.3)'
          }}
        >
          <div className="flex justify-around px-1 py-1">
            {[
              { name: "Oteller", href: "/admin/hotels", icon: Hotel },
              { name: "Odalar", href: "/admin/rooms", icon: BedDouble },
              { name: "Rezerv.", href: "/admin/reservations", icon: CalendarCheck2 },
              { name: "İçerik", href: "/admin/content", icon: FileText },
              { name: "Ödeme", href: "/admin/payment-settings", icon: CreditCard },
            ].map((item) => {
              const isActive = location.startsWith(item.href);
              const IconComponent = item.icon;
              
              return (
                <Link key={item.href} href={item.href} className="flex-1">
                  <div
                    className={cn(
                      "flex flex-col items-center py-1 px-1 transition-all duration-300",
                      isActive
                        ? "text-white font-medium"
                        : "text-white/80 hover:text-white"
                    )}
                  >
                    <div 
                      className={cn(
                        "p-1.5 rounded-lg transition-all duration-300 mb-0.5 active:scale-90",
                        isActive 
                          ? "bg-white/20 shadow-inner border border-white/20"
                          : "hover:bg-white/10"
                      )}
                      style={{
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <span className="text-[10px]">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Sayfaların üst ve alt kenarlardan yeterli uzaklıkta olması için padding eklenen wrapper */}
      <div className={cn(
        "md:pt-0", 
        user?.isAdmin && location.startsWith('/admin') ? "pb-32" : "pb-20"
      )}>
        {/* Burada children olacak */}
      </div>
    </>
  );
}