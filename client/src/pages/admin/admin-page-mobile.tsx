import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Hotel,
  BedDouble,
  UserCog,
  CalendarCheck,
  FileText,
  Settings,
  CreditCard,
  PaintBucket,
  BarChart,
  LogOut,
  ChevronRight,
  Settings2,
  Shield
} from "lucide-react";

export default function AdminPageMobile() {
  const { user, logoutMutation } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutMutation.mutateAsync();
    setIsLoggingOut(false);
  };

  const adminMenuItems = [
    {
      title: "Otel Yönetimi",
      description: "Otelleri görüntüle, ekle ve düzenle",
      icon: <Hotel className="h-5 w-5 text-[#2094f3]" />,
      link: "/admin/hotels",
      color: "bg-blue-50"
    },
    {
      title: "Oda Yönetimi",
      description: "Odaları yönet, özellik ve fiyatlandırma ayarları",
      icon: <BedDouble className="h-5 w-5 text-[#2094f3]" />,
      link: "/admin/rooms",
      color: "bg-blue-50"
    },
    {
      title: "Kullanıcılar",
      description: "Kullanıcı hesaplarını yönet",
      icon: <UserCog className="h-5 w-5 text-[#2094f3]" />,
      link: "/admin/users",
      color: "bg-blue-50"
    },
    {
      title: "Rezervasyonlar",
      description: "Tüm rezervasyonları görüntüle ve yönet",
      icon: <CalendarCheck className="h-5 w-5 text-[#2094f3]" />,
      link: "/admin/reservations",
      color: "bg-blue-50"
    },
    {
      title: "Otel Politikaları",
      description: "Konaklama ve iptal politikalarını düzenle",
      icon: <FileText className="h-5 w-5 text-[#2094f3]" />,
      link: "/admin/hotel-policies",
      color: "bg-blue-50"
    },
    {
      title: "Ödeme Ayarları",
      description: "Ödeme sistemini yapılandır",
      icon: <CreditCard className="h-5 w-5 text-[#2094f3]" />,
      link: "/admin/payment-settings",
      color: "bg-blue-50"
    },
    {
      title: "Tema Yönetimi",
      description: "Site görünümünü ve temalarını düzenle",
      icon: <PaintBucket className="h-5 w-5 text-[#2094f3]" />,
      link: "/admin/theme-management",
      color: "bg-blue-50"
    },
    {
      title: "Fiyatlandırma",
      description: "Fiyat kurallarını ve özel indirimleri ayarla",
      icon: <BarChart className="h-5 w-5 text-[#2094f3]" />,
      link: "/admin/pricing",
      color: "bg-blue-50"
    },
    {
      title: "Sistem Ayarları",
      description: "Genel sistem yapılandırmasını düzenle",
      icon: <Settings2 className="h-5 w-5 text-[#2094f3]" />,
      link: "/admin/settings",
      color: "bg-blue-50"
    }
  ];

  const containerAnimation = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07
      }
    }
  };

  const itemAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const userRole = user?.isAdmin ? "Yönetici" : "Kullanıcı";

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* iOS/Android tarzı başlık */}
      <div className="sticky top-0 z-10">
        <div className="bg-gradient-to-r from-[#2094f3] to-[#38b6ff] text-white shadow-md">
          <div className="flex items-center justify-between px-4 h-14">
            <Button variant="ghost" size="icon" className="text-white" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="font-semibold text-lg">Yönetim Paneli</h1>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white" 
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Profil kartı */}
        <Card className="bg-white border border-[#2094f3]/10 shadow-sm rounded-xl mb-6">
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-semibold">
                {user?.username?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-semibold">{user?.username || "Admin"}</h2>
                <div className="flex items-center mt-0.5">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Shield className="h-3 w-3 mr-1" />
                    {userRole}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="font-semibold text-lg mb-3 px-1">Yönetim Araçları</h2>

        <ScrollArea className="h-[calc(100vh-220px)]">
          <motion.div 
            className="space-y-3 pb-16"
            initial="hidden"
            animate="visible"
            variants={containerAnimation}
          >
            {adminMenuItems.map((item, index) => (
              <motion.div 
                key={index} 
                variants={itemAnimation}
                whileTap={{ scale: 0.98 }}
              >
                <Link href={item.link}>
                  <Card className="border border-[#2094f3]/10 bg-white rounded-xl overflow-hidden transition-all duration-150 active:bg-blue-50">
                    <CardContent className="p-0">
                      <div className="flex items-center p-3">
                        <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center mr-3`}>
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-base">{item.title}</h3>
                          <p className="text-xs text-neutral-500">{item.description}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-neutral-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </ScrollArea>
      </div>
    </div>
  );
}