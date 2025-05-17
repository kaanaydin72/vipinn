import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  LayoutDashboard, 
  Hotel, 
  Settings, 
  Users, 
  CalendarClock, 
  LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AdminSidebar from "./admin-sidebar";

interface AdminLayoutProps {
  children: ReactNode;
  activeMenuItem?: string;
}

export default function AdminLayout({ children, activeMenuItem }: AdminLayoutProps) {
  const { logoutMutation } = useAuth();
  const isMobile = useIsMobile();
  const [location, setLocation] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation('/auth');
  };
  
  // Mobile bottom navigation items for admin
  const navItems = [
    { 
      label: "Dashboard", 
      icon: <LayoutDashboard className="h-5 w-5" />, 
      path: "/admin",
      active: location === "/admin" 
    },
    { 
      label: "Oteller", 
      icon: <Hotel className="h-5 w-5" />, 
      path: "/admin/hotels",
      active: location === "/admin/hotels" 
    },
    { 
      label: "Rezervasyonlar", 
      icon: <CalendarClock className="h-5 w-5" />, 
      path: "/admin/reservations",
      active: location === "/admin/reservations" 
    },
    { 
      label: "Kullanıcılar", 
      icon: <Users className="h-5 w-5" />, 
      path: "/admin/users",
      active: location === "/admin/users" 
    },
    { 
      label: "Ayarlar", 
      icon: <Settings className="h-5 w-5" />, 
      path: "/admin/settings",
      active: location === "/admin/settings" 
    }
  ];
  
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col">
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 py-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary">Elite Hotels</h1>
            <span className="ml-2 px-2 py-1 text-xs rounded-md bg-primary/10 text-primary font-medium">
              Yönetici Paneli
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        {!isMobile && (
          <aside className="w-64 border-r border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 overflow-y-auto hidden md:block">
            <AdminSidebar activeMenuItem={activeMenuItem} />
          </aside>
        )}
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container">
            {children}
          </div>
        </main>
      </div>
      
      {isMobile && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 py-2">
          <div className="grid grid-cols-5 gap-1">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className={`flex flex-col items-center justify-center h-auto py-2 px-1 rounded-lg ${
                  item.active 
                    ? "bg-primary/10 text-primary" 
                    : "text-neutral-600 dark:text-neutral-400"
                }`}
                onClick={() => setLocation(item.path)}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </Button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}