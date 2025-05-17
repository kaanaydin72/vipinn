import { Link, useLocation } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import {
  LayoutDashboard,
  Hotel,
  Bed,
  CalendarClock,
  Settings,
  LogOut,
  Users,
  CreditCard,
  PieChart,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  
  const isActive = (path: string) => {
    if (path === "/admin" && location === "/admin") {
      return true;
    }
    return path !== "/admin" && location.startsWith(path);
  };
  
  return (
    <div className={cn("pb-12 h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border", className)}>
      <div className="py-4 px-5 flex items-center border-b border-sidebar-border">
        <Link href="/">
          <a className="flex items-center">
            <span className="text-2xl font-heading font-bold text-sidebar-primary">Elite<span className="text-secondary">Hotels</span></span>
          </a>
        </Link>
      </div>
      
      <ScrollArea className="h-[calc(100vh-65px)] py-6">
        <div className="px-3 py-2">
          <div className="space-y-1">
            <h2 className="mb-2 px-4 text-sm font-semibold text-sidebar-foreground/60">
              Admin Paneli
            </h2>
            <Link href="/admin">
              <Button 
                variant={isActive("/admin") ? "secondary" : "ghost"} 
                className={cn(
                  "w-full justify-start",
                  isActive("/admin") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Ana Panel
              </Button>
            </Link>
            <Link href="/admin/hotels">
              <Button 
                variant={isActive("/admin/hotels") ? "secondary" : "ghost"} 
                className={cn(
                  "w-full justify-start",
                  isActive("/admin/hotels") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <Hotel className="mr-2 h-4 w-4" />
                Oteller
              </Button>
            </Link>
            <Link href="/admin/rooms">
              <Button 
                variant={isActive("/admin/rooms") ? "secondary" : "ghost"} 
                className={cn(
                  "w-full justify-start",
                  isActive("/admin/rooms") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <Bed className="mr-2 h-4 w-4" />
                Odalar
              </Button>
            </Link>
            <Link href="/admin/reservations">
              <Button 
                variant={isActive("/admin/reservations") ? "secondary" : "ghost"} 
                className={cn(
                  "w-full justify-start",
                  isActive("/admin/reservations") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <CalendarClock className="mr-2 h-4 w-4" />
                Rezervasyonlar
              </Button>
            </Link>
          </div>
          
          <div className="space-y-1 pt-6">
            <h2 className="mb-2 px-4 text-sm font-semibold text-sidebar-foreground/60">
              Analiz
            </h2>
            <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground">
              <Users className="mr-2 h-4 w-4" />
              Kullanıcılar
            </Button>
            <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground">
              <PieChart className="mr-2 h-4 w-4" />
              Raporlar
            </Button>
            <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground">
              <CreditCard className="mr-2 h-4 w-4" />
              Ödemeler
            </Button>
          </div>
          
          <div className="space-y-1 pt-6">
            <h2 className="mb-2 px-4 text-sm font-semibold text-sidebar-foreground/60">
              Ayarlar
            </h2>
            <Link href="/admin/settings">
              <Button 
                variant={isActive("/admin/settings") ? "secondary" : "ghost"} 
                className={cn(
                  "w-full justify-start",
                  isActive("/admin/settings") ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <Settings className="mr-2 h-4 w-4" />
                Genel Ayarlar
              </Button>
            </Link>
            <Link href="/admin/settings?tab=theme">
              <Button 
                variant={location === "/admin/settings?tab=theme" ? "secondary" : "ghost"} 
                className={cn(
                  "w-full justify-start",
                  location === "/admin/settings?tab=theme" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <Palette className="mr-2 h-4 w-4" />
                Tema Yönetimi
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="px-3 py-2 mt-12">
          <Button 
            variant="ghost" 
            className="w-full justify-start hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Çıkış Yap
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
