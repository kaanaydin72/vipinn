import { Link, useLocation } from "wouter";
import { XIcon, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface NavLink {
  name: string;
  href: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: NavLink[];
}

export default function MobileMenu({ isOpen, onClose, navLinks }: MobileMenuProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:hidden p-0 gap-0 max-w-full h-full">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="text-2xl font-heading font-bold text-primary">
            Vipinn<span className="text-secondary">Hotels</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XIcon className="h-6 w-6" />
            <span className="sr-only">Kapat</span>
          </Button>
        </div>
        
        <div className="py-2 flex flex-col h-full">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`${
                  location === link.href
                    ? "bg-primary-light text-white border-l-4 border-primary"
                    : "border-transparent text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-800 border-l-4"
                } block pl-3 pr-4 py-2 text-base font-medium`}
              >
                {link.name}
              </Link>
            ))}
            {user?.isAdmin && (
              <Link
                href="/admin"
                onClick={onClose}
                className={`${
                  location.startsWith("/admin")
                    ? "bg-primary-light text-white border-l-4 border-primary"
                    : "border-transparent text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-800 border-l-4"
                } block pl-3 pr-4 py-2 text-base font-medium`}
              >
                Admin Panel
              </Link>
            )}
          </div>
          
          <Separator />
          
          <div className="pt-4 pb-3">
            {user ? (
              <div className="space-y-1">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <User className="h-8 w-8 text-neutral-500" />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-neutral-800">{user.fullName}</div>
                    <div className="text-sm font-medium text-neutral-500">{user.email}</div>
                  </div>
                </div>
                <Link
                  href="/profile"
                  onClick={onClose}
                  className="block px-4 py-2 text-base font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800"
                >
                  Profilim
                </Link>
                <Link
                  href="/reservations"
                  onClick={onClose}
                  className="block px-4 py-2 text-base font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800"
                >
                  Rezervasyonlarım
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800"
                >
                  Çıkış Yap
                </button>
              </div>
            ) : (
              <div className="space-y-1 px-4">
                <Button asChild className="w-full" onClick={onClose}>
                  <Link href="/auth">Giriş Yap</Link>
                </Button>
              </div>
            )}
          </div>
          
          <div className="px-4 mt-2">
            <Button asChild className="w-full" onClick={onClose}>
              <Link href={user ? "/reservations/new" : "/auth"}>
                Rezervasyon Yap
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
