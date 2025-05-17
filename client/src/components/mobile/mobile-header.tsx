import React from "react";
import { ChevronLeft, Languages, User, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import LanguageSwitcher from "@/components/language-switcher";

interface MobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
  backUrl?: string;
  onBackClick?: () => void;
  transparent?: boolean;
}

export default function MobileHeader({
  title,
  showBackButton = false,
  backUrl = "/",
  onBackClick,
  transparent = false,
}: MobileHeaderProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [location] = useLocation();
  const isAuthPage = location === "/auth";

  // iOS/Android tarzı gradyan ve cam efektleri
  const headerClass = transparent
    ? "absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent backdrop-blur-sm"
    : "bg-gradient-to-r from-[#2094f3] to-[#30b8f3] dark:from-[#1a75c2] dark:to-[#2094f3] border-b border-[#65c0ff]/30 shadow-lg shadow-[#2094f3]/10 backdrop-blur-lg";

  // Dinamik başlık stili
  const titleClass = transparent 
    ? "text-white font-semibold" 
    : "text-white font-semibold";

  // Dinamik buton stili - iOS/Android dokunma efektleri
  const buttonClass = transparent
    ? "text-white hover:bg-white/20 active:scale-95 transition-transform"
    : "text-white hover:bg-white/20 active:bg-white/30 active:scale-95 transition-transform";

  return (
    <header className={`md:hidden py-3 px-4 ${headerClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {showBackButton ? (
            <button
              onClick={onBackClick || (() => window.history.back())}
              className={`p-2 rounded-full ${buttonClass}`}
              style={{
                WebkitTapHighlightColor: 'transparent', 
                WebkitAppearance: 'none'
              }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          ) : 
            <Link href="/">
              <div className="flex items-center cursor-pointer active:scale-95 transition-transform">
                <div className="text-xl font-bold text-white relative">
                  Vipinn Hotels
                  <div className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-white/80 via-white/50 to-transparent rounded-full"></div>
                </div>
              </div>
            </Link>
          }
          {title && <h1 className={`text-lg ${titleClass} ml-2`}>{title}</h1>}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Dil seçici - iOS/Android tarzı */}
          <div className="relative">
            <LanguageSwitcher />
          </div>
          
          {/* Giriş butonunu auth sayfasında gösterme */}
          {!isAuthPage && (user ? (
            <Link href="/profile">
              <div 
                className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white border border-white/30 hover:bg-white/30 transition-all duration-300 shadow-md active:scale-95"
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRight: '1px solid rgba(255, 255, 255, 0.2)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.5)',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.5)',
                }}
              >
                <span className="text-sm font-medium">{user.fullName?.charAt(0) || user.username.charAt(0).toUpperCase()}</span>
              </div>
            </Link>
          ) : (
            <Link href="/auth">
              <div 
                className="p-2 px-4 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 border border-white/30 text-sm font-medium active:scale-95"
                style={{
                  WebkitTapHighlightColor: 'transparent',
                  WebkitAppearance: 'none',
                  WebkitBoxShadow: '0 4px 8px rgba(0, 0, 0, 0.12)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRight: '1px solid rgba(255, 255, 255, 0.2)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.5)',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.5)',
                }}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Giriş Yap
              </div>
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}