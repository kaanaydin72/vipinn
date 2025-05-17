import { useLocation } from "wouter";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Bed,
  Users,
  CalendarCheck2,
  Settings,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Home,
  CreditCard,
  FileText,
  Palette,
  Tag
} from "lucide-react";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdminSidebarProps {
  activeMenuItem?: string;
}

export default function AdminSidebar({ activeMenuItem }: AdminSidebarProps = {}) {
  const [location] = useLocation();
  const { logoutMutation, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // Close mobile menu when changing routes
  useEffect(() => {
    if (isMobile && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [location, isMobile]);

  // Menu items
  const menuItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      name: "Otel Yönetimi",
      href: "/admin/hotels",
      icon: Building2,
    },
    {
      name: "Oda Yönetimi",
      href: "/admin/rooms",
      icon: Bed,
    },
    {
      name: "Kullanıcılar",
      href: "/admin/users",
      icon: Users,
    },
    {
      name: "Rezervasyonlar",
      href: "/admin/reservations",
      icon: CalendarCheck2,
    },
    {
      name: "Otel Koşulları",
      href: "/admin/hotel-policies",
      icon: FileText,
    },
    {
      name: "Tema Yönetimi",
      href: "/admin/theme-management",
      icon: Palette,
    },
    {
      name: "Fiyat Yönetimi",
      href: "/admin/pricing",
      icon: Tag,
    },
    {
      name: "Ödeme Ayarları",
      href: "/admin/payment-settings",
      icon: CreditCard,
    },
    {
      name: "Ayarlar",
      href: "/admin/settings",
      icon: Settings,
    },
    {
      name: "Ana Sayfa",
      href: "/",
      icon: Home,
      divider: true,
    },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Mobile bottom navigation items (sadece en önemli 4 öğe)
  const mobileNavItems = menuItems.slice(0, 4);

  return (
    <>
      {/* Mobile menu button - left top corner */}
      <div className="fixed top-4 left-4 z-40 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMobileMenu}
          className="rounded-full bg-white dark:bg-neutral-900 shadow-md"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile header - shows only when sidebar is closed */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center px-16 z-30 md:hidden">
        {!isMobileMenuOpen && (
          <div className="text-lg font-semibold truncate">
            Elite Hotels Admin
          </div>
        )}
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile bottom navigation bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 z-30">
        <div className="flex justify-around">
          {mobileNavItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex flex-col items-center py-3 px-2",
                    isActive
                      ? "text-primary"
                      : "text-neutral-600 dark:text-neutral-400"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs mt-1">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-neutral-950 shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-8 border-b border-neutral-200 dark:border-neutral-800">
            <h1 className="text-xl font-bold text-neutral-800 dark:text-white">
              Elite Hotels
            </h1>
            <div className="flex items-center mt-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-2">
                {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'A'}
              </div>
              <div>
                <p className="text-sm font-medium">{user?.fullName || user?.username}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {user?.isAdmin ? 'Yönetici' : 'Kullanıcı'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 flex-1 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item, index) => {
                const isActive = location === item.href || 
                                  (activeMenuItem === 'policies' && item.href === '/admin/hotel-policies') ||
                                  (activeMenuItem === 'hotels' && item.href === '/admin/hotels') ||
                                  (activeMenuItem === 'rooms' && item.href === '/admin/rooms') ||
                                  (activeMenuItem === 'reservations' && item.href === '/admin/reservations') ||
                                  (activeMenuItem === 'users' && item.href === '/admin/users') ||
                                  (activeMenuItem === 'payment' && item.href === '/admin/payment-settings') ||
                                  (activeMenuItem === 'settings' && item.href === '/admin/settings') ||
                                  (activeMenuItem === 'themes' && item.href === '/admin/theme-management') ||
                                  (activeMenuItem === 'dashboard' && item.href === '/admin');
                return (
                  <li key={item.href}>
                    {item.divider && (
                      <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-2" />
                    )}
                    <Link href={item.href}>
                      <div
                        className={cn(
                          "flex items-center px-4 py-3 text-sm rounded-md transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-neutral-800 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        )}
                      >
                        <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span>{item.name}</span>
                        {isActive && (
                          <ChevronRight className="h-4 w-4 ml-auto" />
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Çıkış Yap
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}