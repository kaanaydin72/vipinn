import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Shield, Globe, Bell, Mail } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");

  const handleSaveSettings = () => {
    toast({
      title: "Ayarlar kaydedildi",
      description: "Sistem ayarlarınız başarıyla güncellendi.",
    });
  };

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <AdminSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 dark:text-white">
            Sistem Ayarları
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Elite Hotels sistem ayarlarını yönetin
          </p>
        </div>

        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden md:inline">Genel</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden md:inline">Güvenlik</span>
            </TabsTrigger>
            <TabsTrigger value="localization" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden md:inline">Yerelleştirme</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden md:inline">Bildirimler</span>
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Genel Ayarlar</CardTitle>
                  <CardDescription>
                    Sistem için genel ayarları yönetin.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="site-name">Site Adı</Label>
                    <Input id="site-name" defaultValue="Elite Hotels" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Admin E-posta</Label>
                    <Input id="admin-email" defaultValue={user?.email} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">İletişim Telefon</Label>
                    <Input id="contact-phone" defaultValue="+90 212 123 4567" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reservation-email">Rezervasyon E-posta</Label>
                    <Input id="reservation-email" defaultValue="reservations@elitehotels.com" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="maintenance" />
                    <Label htmlFor="maintenance">Bakım Modu</Label>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings}>
                    Ayarları Kaydet
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Güvenlik Ayarları</CardTitle>
                  <CardDescription>
                    Sistem güvenlik ayarlarını düzenleyin.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Oturum Zaman Aşımı (dakika)</Label>
                    <Input id="session-timeout" type="number" defaultValue="60" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-login-attempts">Maksimum Giriş Denemesi</Label>
                    <Input id="max-login-attempts" type="number" defaultValue="5" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="force-ssl" defaultChecked />
                    <Label htmlFor="force-ssl">SSL Zorla</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="two-factor" />
                    <Label htmlFor="two-factor">İki Faktörlü Kimlik Doğrulama</Label>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings}>
                    Ayarları Kaydet
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* Localization Settings */}
          <TabsContent value="localization">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Yerelleştirme Ayarları</CardTitle>
                  <CardDescription>
                    Dil ve bölge ayarlarını düzenleyin.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="default-language">Varsayılan Dil</Label>
                    <select 
                      id="default-language"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue="tr"
                    >
                      <option value="tr">Türkçe</option>
                      <option value="en">English</option>
                      <option value="de">Deutsch</option>
                      <option value="ru">Русский</option>
                      <option value="ar">العربية</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Zaman Dilimi</Label>
                    <select 
                      id="timezone"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue="Europe/Istanbul"
                    >
                      <option value="Europe/Istanbul">Europe/Istanbul (GMT+3)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                      <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                      <option value="America/New_York">America/New_York (GMT-5)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-format">Tarih Formatı</Label>
                    <select 
                      id="date-format"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue="DD.MM.YYYY"
                    >
                      <option value="DD.MM.YYYY">DD.MM.YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Para Birimi</Label>
                    <select 
                      id="currency"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue="TRY"
                    >
                      <option value="TRY">Türk Lirası (₺)</option>
                      <option value="USD">US Dollar ($)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="GBP">British Pound (£)</option>
                    </select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings}>
                    Ayarları Kaydet
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bildirim Ayarları</CardTitle>
                  <CardDescription>
                    E-posta ve bildirim ayarlarını düzenleyin.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">SMTP Sunucu</Label>
                    <Input id="smtp-host" defaultValue="smtp.elitehotels.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">SMTP Port</Label>
                    <Input id="smtp-port" defaultValue="587" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-user">SMTP Kullanıcı</Label>
                    <Input id="smtp-user" defaultValue="notifications@elitehotels.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-password">SMTP Şifre</Label>
                    <Input id="smtp-password" type="password" defaultValue="********" />
                  </div>
                  <div className="space-y-4">
                    <Label>Bildirim Olayları</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="notify-reservation" defaultChecked />
                        <Label htmlFor="notify-reservation">Yeni Rezervasyon</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="notify-cancellation" defaultChecked />
                        <Label htmlFor="notify-cancellation">Rezervasyon İptali</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="notify-user-register" defaultChecked />
                        <Label htmlFor="notify-user-register">Yeni Kullanıcı Kaydı</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="notify-payment" defaultChecked />
                        <Label htmlFor="notify-payment">Ödeme Alındı</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveSettings}>
                    Ayarları Kaydet
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}