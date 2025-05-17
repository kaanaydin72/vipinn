import { useTranslation } from "react-i18next";
import { Redirect, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Calendar, Users, BedDouble, Receipt, Settings, Gauge } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // Admin kontrolü
  if (!user?.isAdmin) {
    toast({
      title: t('admin_only', 'Sadece Yöneticiler Erişebilir'),
      description: t('admin_only_description', 'Bu sayfaya erişim yetkiniz bulunmamaktadır.'),
      variant: "destructive",
    });
    return <Redirect to="/" />;
  }

  // İstatistik verilerini çekme
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    refetchOnWindowFocus: false,
  });

  // Menu kartları
  const menuItems = [
    {
      title: t('hotels', 'Oteller'),
      description: t('hotels_description', 'Otel ekle, düzenle ve yönet'),
      icon: <Building2 className="h-8 w-8 text-[#2094f3]" />,
      link: '/admin/hotels',
      count: stats?.hotelCount || 0
    },
    {
      title: t('rooms', 'Odalar'),
      description: t('rooms_description', 'Oda ekle, düzenle ve yönet'),
      icon: <BedDouble className="h-8 w-8 text-[#2094f3]" />,
      link: '/admin/rooms',
      count: stats?.roomCount || 0
    },
    {
      title: t('reservations', 'Rezervasyonlar'),
      description: t('reservations_description', 'Rezervasyonları görüntüle ve yönet'),
      icon: <Calendar className="h-8 w-8 text-[#2094f3]" />,
      link: '/admin/reservations',
      count: stats?.reservationCount || 0
    },
    {
      title: t('pricing', 'Fiyatlandırma'),
      description: t('pricing_description', 'Fiyat kuralları ve özel fiyatlar'),
      icon: <Receipt className="h-8 w-8 text-[#2094f3]" />,
      link: '/admin/pricing',
      count: null
    },
    {
      title: t('users', 'Kullanıcılar'),
      description: t('users_description', 'Kullanıcıları yönet'),
      icon: <Users className="h-8 w-8 text-[#2094f3]" />,
      link: '/admin/users',
      count: stats?.userCount || 0
    },
    {
      title: t('settings', 'Ayarlar'),
      description: t('settings_description', 'Sistem ayarlarını düzenle'),
      icon: <Settings className="h-8 w-8 text-[#2094f3]" />,
      link: '/admin/settings',
      count: null
    }
  ];

  return (
    <AdminLayout>
      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{t('admin_dashboard', 'Yönetici Paneli')}</h1>
          <p className="text-muted-foreground">
            {t('welcome_admin', 'Hoş geldiniz! Vipinn Hotels yönetim panelindesiniz.')}
          </p>
        </div>

        {/* İstatistik kartları */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('total_reservations', 'Toplam Rezervasyon')}
              </CardTitle>
              <Calendar className="h-4 w-4 text-[#2094f3]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? '...' : stats?.reservationCount || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('total_revenue', 'Toplam Gelir')}
              </CardTitle>
              <Gauge className="h-4 w-4 text-[#2094f3]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? '...' : `${stats?.totalRevenue.toLocaleString() || 0} TL`}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('active_users', 'Aktif Kullanıcılar')}
              </CardTitle>
              <Users className="h-4 w-4 text-[#2094f3]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? '...' : stats?.userCount || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Menu kartları */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.link}>
              <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-bold">{item.title}</CardTitle>
                  {item.icon}
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-muted-foreground mb-4">{item.description}</CardDescription>
                  {item.count !== null && (
                    <div className="text-sm font-medium">
                      {t('total_count', 'Toplam')}: <span className="font-bold text-[#2094f3]">{item.count}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}