import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import MobileMenu from "./mobile-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, User, Menu } from "lucide-react";

export default function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Ana Sayfa", href: "/" },
    { name: "Otellerimiz", href: "/hotels" },
    { name: "Odalar & Süitler", href: "/rooms" },
    { name: "Özel Fırsatlar", href: "/offers" },
    { name: "İletişim", href: "/contact" },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-neutral-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-2xl font-heading font-bold text-primary">
                  Vipinn<span className="text-secondary">Hotels</span>
                </span>
              </Link>
            </div>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8" aria-label="Main Navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${
                    location === link.href
                      ? "border-b-2 border-primary text-neutral-900 dark:text-white"
                      : "border-transparent border-b-2 hover:border-neutral-300 text-neutral-600 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-white"
                  } inline-flex items-center px-1 pt-1 text-sm font-medium`}
                >
                  {link.name}
                </Link>
              ))}
              {user?.isAdmin && (
                <Link
                  href="/admin"
                  className={`${
                    location.startsWith("/admin")
                      ? "border-b-2 border-primary text-neutral-900 dark:text-white"
                      : "border-transparent border-b-2 hover:border-neutral-300 text-neutral-600 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-white"
                  } inline-flex items-center px-1 pt-1 text-sm font-medium`}
                >
                  Admin Panel
                </Link>
              )}
            </nav>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" aria-label="Dil Seçimi">
                <Globe className="h-5 w-5" />
              </Button>
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span className="hidden md:inline-block">{user.fullName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profilim</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/reservations">Rezervasyonlarım</Link>
                    </DropdownMenuItem>
                    {user.isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin">Admin Panel</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      Çıkış Yap
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="ghost" asChild>
                  <Link href="/auth">
                    <User className="mr-2 h-4 w-4" />
                    <span>Giriş Yap</span>
                  </Link>
                </Button>
              )}
              
              <Button asChild className="hidden lg:inline-flex">
                <Link href={user ? "/reservations/new" : "/auth"}>
                  Rezervasyon Yap
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Ana menüyü aç"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
        navLinks={navLinks}
      />
    </header>
  );
}
