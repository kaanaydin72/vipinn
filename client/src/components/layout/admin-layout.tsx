import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Calendar,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  X,
  Settings,
  BedDouble,
  Receipt,
  Users,
  ArrowLeft,
  FileText,
  Moon,
  Sun,
  Globe
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useDeviceType } from "@/hooks/use-mobile";


interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { t } = useTranslation();
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const [menuOpen, setMenuOpen] = useState(false);

  const sidebarItems = [
    {
      title: t('dashboard', 'Dashboard'),
      icon: <Home className="h-5 w-5" />,
      link: '/admin'
    },
    {
      title: t('hotels', 'Oteller'),
      icon: <Building2 className="h-5 w-5" />,
      link: '/admin/hotels'
    },
    {
      title: t('rooms', 'Odalar'),
      icon: <BedDouble className="h-5 w-5" />,
      link: '/admin/rooms'
    },
    {
      title: t('reservations', 'Rezervasyonlar'),
      icon: <Calendar className="h-5 w-5" />,
      link: '/admin/reservations'
    },
    {
      title: t('pricing', 'Fiyatlandırma'),
      icon: <Receipt className="h-5 w-5" />,
      link: '/admin/pricing'
    },
    {
      title: t('users', 'Kullanıcılar'),
      icon: <Users className="h-5 w-5" />,
      link: '/admin/users'
    },
    {
      title: t('content', 'İçerik Yönetimi'),
      icon: <FileText className="h-5 w-5" />,
      link: '/admin/content'
    },
    {
      title: t('settings', 'Ayarlar'),
      icon: <Settings className="h-5 w-5" />,
      link: '/admin/settings'
    }
  ];

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate('/');
  };

  // İsim ve soyisim için kısaltma oluştur
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Mobil için sidebar
  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen">
        {/* Mobil Header */}
        <header className="bg-white border-b border-[#2094f3]/20 shadow-sm px-4 py-2 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 max-w-[280px]">
                <div className="flex flex-col h-full">
                  <div className="p-4 bg-[#2094f3] text-white">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-xl">Admin Panel</h2>
                      <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)} className="text-white h-8 w-8">
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-white">
                        <AvatarFallback className="bg-[#1a75c0] text-white">
                          {getInitials(user?.username || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user?.username}</div>
                        <div className="text-xs opacity-80">{user?.email}</div>
                      </div>
                    </div>
                  </div>
                  
                  <nav className="flex-1 p-2">
                    {sidebarItems.map((item, i) => (
                      <Link
                        key={i}
                        href={item.link}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Button
                          variant={location === item.link ? "default" : "ghost"}
                          className={`w-full justify-start mb-1 ${
                            location === item.link
                              ? "bg-[#2094f3] hover:bg-[#1a75c0] text-white"
                              : ""
                          }`}
                        >
                          {item.icon}
                          <span className="ml-2">{item.title}</span>
                        </Button>
                      </Link>
                    ))}
                  </nav>
                  
                  <div className="p-4 border-t">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      {t('logout', 'Çıkış Yap')}
                    </Button>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <Button variant="outline" size="icon" onClick={() => {}}>
                        <Sun className="h-5 w-5" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => {}}>
                        <Globe className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => navigate('/')}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      {t('back_to_site', 'Siteye Dön')}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <span className="font-bold text-[#2094f3]">Vipinn Admin</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#2094f3] text-white text-xs">
                {getInitials(user?.username || '')}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        
        {/* Ana içerik */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }

  // Masaüstü görünümü
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#2094f3]/20 bg-white shadow-sm min-h-screen fixed">
        <div className="p-4 border-b border-[#2094f3]/20">
          <h1 className="text-xl font-bold text-[#2094f3]">Vipinn Admin</h1>
        </div>
        
        <div className="p-4 flex items-center space-x-3 border-b border-[#2094f3]/20">
          <Avatar>
            <AvatarFallback className="bg-[#2094f3] text-white">
              {getInitials(user?.username || '')}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user?.username}</div>
            <div className="text-xs text-muted-foreground">{user?.email}</div>
          </div>
        </div>
        
        <nav className="p-4">
          {sidebarItems.map((item, i) => (
            <Link key={i} href={item.link}>
              <Button
                variant={location === item.link ? "default" : "ghost"}
                className={`w-full justify-start mb-2 ${
                  location === item.link
                    ? "bg-[#2094f3] hover:bg-[#1a75c0] text-white"
                    : ""
                }`}
              >
                {item.icon}
                <span className="ml-2">{item.title}</span>
              </Button>
            </Link>
          ))}
        </nav>
        
        <div className="p-4 absolute bottom-0 left-0 right-0 border-t border-[#2094f3]/20">
          <Button
            variant="ghost"
            className="w-full justify-start mb-2 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-2" />
            {t('logout', 'Çıkış Yap')}
          </Button>
          
          <div className="flex items-center justify-between mt-4">
            <Button variant="outline" size="icon" onClick={() => {}}>
              <Sun className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => {}}>
              <Globe className="h-5 w-5" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('back_to_site', 'Siteye Dön')}
          </Button>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="ml-64 flex-1">
        {children}
      </main>
    </div>
  );
}