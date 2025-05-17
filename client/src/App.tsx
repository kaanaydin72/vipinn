import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/contexts/theme-provider";
import { ProtectedRoute, AdminRoute } from "@/lib/protected-route";
import { useEffect, useState } from "react";
import SplashScreen from "@/components/splash-screen";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useDeviceType } from "@/hooks/use-mobile";
import { AnimatePresence, motion } from "framer-motion";
import '@/styles/page-transition.css';

import HomePage from "@/pages/home-page";
import HotelsPage from "@/pages/hotels-page";
import HotelDetailPage from "@/pages/hotel-detail-page";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
import ReservationsPage from "@/pages/reservations-page";
import ReservationPage from "@/pages/reservation-page";
import ReservationDetailPage from "@/pages/reservation-detail-page";
import EditReservationPage from "@/pages/edit-reservation-page";
import PaymentPage from "@/pages/payment-page";
import PaymentSimulationPage from "@/pages/payment-simulation-page";
import AboutPage from "@/pages/about-page";
import ContactPage from "@/pages/contact-page";
import AdminPage from "@/pages/admin/admin-page";
import AdminPageMobile from "@/pages/admin/admin-page-mobile";
import HotelManagement from "@/pages/admin/hotel-management-card";
import HotelManagementMobile from "@/pages/admin/hotel-management-mobile";
import HotelDetail from "@/pages/admin/hotel-detail";
import HotelEditPage from "@/pages/admin/hotel-edit-page";
import AddHotelWizard from "@/pages/admin/add-hotel-wizard";
import RoomManagement from "@/pages/admin/room-management-fixed";
import RoomManagementMobile from "@/pages/admin/room-management-mobile";
import RoomAddMobile from "@/pages/admin/room-add-mobile";
// Arşivlenmiş eski oda ekleme sayfaları kaldırıldı
import RoomsAddPageFixed from "@/pages/admin/rooms-add-page-fixed";
import RoomEditPage from "@/pages/admin/room-edit-page";
import RoomEditPageMobile from "@/pages/admin/room-edit-page-mobile";
import UserManagement from "@/pages/admin/user-management";
import UserManagementMobile from "@/pages/admin/user-management-mobile";
import ReservationsManagement from "@/pages/admin/reservations-management";
import ReservationsManagementMobile from "@/pages/admin/reservations-management-mobile";
import SettingsPage from "@/pages/admin/settings-page";
import PaymentSettings from "@/pages/admin/payment-settings";
import HotelPolicies from "@/pages/admin/hotel-policies-fullpage";
import PricingManagement from "@/pages/admin/pricing-management";
import ReservationStatusPage from "@/pages/admin/reservation-status-page";
import HotelPolicyCreatePage from "@/pages/admin/hotel-policy-create-page";
import HotelPolicyEditPage from "@/pages/admin/hotel-policy-edit-page";
import ThemeManagement from "@/pages/admin/theme-management";
import ThemeManagementMobile from "@/pages/admin/theme-management-mobile";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
        className="w-full h-full"
      >
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/hotels" component={HotelsPage} />
          <Route path="/hotels/:id" component={HotelDetailPage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/auth" component={AuthPage} />
          <ProtectedRoute path="/profile" component={ProfilePage} />
          <ProtectedRoute path="/reservations" component={ReservationsPage} />
          <ProtectedRoute path="/reservations/new" component={ReservationPage} />
          <ProtectedRoute path="/reservations/edit/:id" component={EditReservationPage} />
          <ProtectedRoute path="/reservations/:id" component={ReservationDetailPage} />
          <ProtectedRoute path="/payment/:id" component={PaymentPage} />
          <ProtectedRoute path="/payment-simulation/:id" component={PaymentSimulationPage} />
          <AdminRoute 
            path="/admin" 
            component={() => {
              const deviceType = useDeviceType();
              return deviceType === 'mobile' ? <AdminPageMobile key="mobile-admin"/> : <AdminPage key="desktop-admin"/>;
            }} 
          />
          <AdminRoute 
            path="/admin/hotels" 
            component={() => {
              const deviceType = useDeviceType();
              return deviceType === 'mobile' ? <HotelManagementMobile key="mobile-hotels"/> : <HotelManagement key="desktop-hotels"/>;
            }} 
          />
          <AdminRoute path="/admin/hotels/add" component={AddHotelWizard} />
          <AdminRoute 
            path="/admin/rooms" 
            component={() => {
              const deviceType = useDeviceType();
              return deviceType === 'mobile' ? <RoomManagementMobile key="mobile-rooms"/> : <RoomManagement key="desktop-rooms"/>;
            }} 
          />
          <AdminRoute 
            path="/admin/rooms/add" 
            component={() => {
              const deviceType = useDeviceType();
              // key özelliği ekliyoruz - bileşenleri yeniden yüklemeye zorlamak için
              return deviceType === 'mobile' ? <RoomAddMobile key="mobile-add"/> : <RoomsAddPageFixed key="desktop-add"/>;
            }} 
          />
          <AdminRoute path="/admin/settings" component={SettingsPage} />
          <AdminRoute path="/admin/payment-settings" component={PaymentSettings} />
          <AdminRoute 
            path="/admin/users" 
            component={() => {
              const deviceType = useDeviceType();
              return deviceType === 'mobile' ? <UserManagementMobile key="mobile-users"/> : <UserManagement key="desktop-users"/>;
            }} 
          />
          <AdminRoute 
            path="/admin/reservations" 
            component={() => {
              const deviceType = useDeviceType();
              return deviceType === 'mobile' ? <ReservationsManagementMobile key="mobile-reservations"/> : <ReservationsManagement key="desktop-reservations"/>;
            }} 
          />
          <AdminRoute path="/admin/hotel-policies" component={HotelPolicies} />
          <AdminRoute path="/admin/hotel-policies/create" component={HotelPolicyCreatePage} />
          <AdminRoute path="/admin/hotel-policies/edit/:id" component={HotelPolicyEditPage} />
          <AdminRoute path="/admin/reservations/status/:id" component={ReservationStatusPage} />
          <AdminRoute 
            path="/admin/theme-management" 
            component={() => {
              const deviceType = useDeviceType();
              return deviceType === 'mobile' ? <ThemeManagementMobile key="mobile-themes"/> : <ThemeManagement key="desktop-themes"/>;
            }} 
          />
          <AdminRoute path="/admin/pricing" component={PricingManagement} />
          <AdminRoute path="/admin/hotels/edit/:id" component={HotelEditPage} />
          <AdminRoute path="/admin/hotels/:id" component={HotelDetail} />
          <AdminRoute 
            path="/admin/rooms/edit/:id" 
            component={() => {
              const deviceType = useDeviceType();
              // Aynı bileşenleri kullanıyoruz, ancak bileşenleri yeniden yüklemeye zorlamak için
              // key ekleyerek React'in bileşeni yeniden oluşturmasını sağlıyoruz
              return deviceType === 'mobile' ? <RoomEditPageMobile key="mobile-edit"/> : <RoomEditPage key="desktop-edit"/>;
            }}
          />
          <Route component={NotFound} />
        </Switch>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const [showSplashComplete, setShowSplashComplete] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [currentTheme, setCurrentTheme] = useState("classic");
  // Başlangıçta her zaman splash'i göster
  const [shouldShowSplash, setShouldShowSplash] = useState(true);

  // Uygulamanın ilk yüklenmesinde splash screen kontrolü
  useEffect(() => {
    // Tema bilgisini al
    fetch('/api/site-settings/theme')
      .then(res => res.json())
      .then(data => {
        setCurrentTheme(data.theme);
      })
      .catch(err => {
        console.error("Tema bilgisi alınamadı:", err);
      });
    
    // Session ID kontrolü - sadece oturum başına bir kez göster
    const sessionKey = 'splashShownSession';
    const currentSessionId = sessionStorage.getItem(sessionKey);
    
    // Eğer bu oturumda daha önce gösterilmişse splash screen'i atla
    if (currentSessionId) {
      setShowSplashComplete(true);
      setShouldShowSplash(false);
    } else {
      // Yeni oturumda splash screen göster
      // Session ID'yi kaydet
      const sessionId = Date.now().toString();
      sessionStorage.setItem(sessionKey, sessionId);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplashComplete(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            {shouldShowSplash && !showSplashComplete ? (
              <SplashScreen 
                onAnimationComplete={handleSplashComplete} 
                theme={currentTheme}
              />
            ) : (
              <Router />
            )}
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
