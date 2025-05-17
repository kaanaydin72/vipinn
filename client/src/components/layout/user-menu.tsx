import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { User, LogOut, Hotel, CalendarClock, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function UserMenu() {
  const { user, logoutMutation, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full">
          {user ? (
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {user.name ? getInitials(user.name) : user.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <User className="h-6 w-6 text-muted-foreground" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="end">
        {user ? (
          <>
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-foreground">{user.name || user.username}</p>
              <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
            </div>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <a className="flex cursor-pointer items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profilim</span>
                </a>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <Link href="/reservations">
                <a className="flex cursor-pointer items-center">
                  <CalendarClock className="mr-2 h-4 w-4" />
                  <span>Rezervasyonlarım</span>
                </a>
              </Link>
            </DropdownMenuItem>
            
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <a className="flex cursor-pointer items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </a>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Çıkış Yap</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href="/auth">
                <a className="flex cursor-pointer items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Giriş Yap</span>
                </a>
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <Link href="/auth">
                <a className="flex cursor-pointer items-center">
                  <Hotel className="mr-2 h-4 w-4" />
                  <span>Üye Ol</span>
                </a>
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
