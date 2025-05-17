import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Settings, LogOut, Home, Hotel, CalendarDays, CreditCard, Moon, Sun, Languages } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/hooks/use-theme";
import LanguageSwitcher from "@/components/language-switcher";

interface SlidingMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

// Bu bileşen artık kullanılmıyor ancak gelecekte gerekebilir
export default function SlidingMenu({ isOpen, onClose }: SlidingMenuProps) {
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();
  const { currentTheme, setTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  // iOS safari overscroll engelleme
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [isOpen]);

  // Dışarı tıklama ile kapatma
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Logout işlemi
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        onClose();
        setLocation("/auth");
      },
    });
  };

  // Tema değişimi - dark/light için
  const isDarkTheme = currentTheme === "luxury" || currentTheme === "boutique";
  const toggleTheme = () => {
    setTheme(isDarkTheme ? "classic" : "luxury");
  };

  // Menu item render
  const renderMenuItem = (
    icon: React.ReactNode,
    text: string,
    onClick?: () => void,
    to?: string,
    isActive?: boolean
  ) => {
    const content = (
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          isActive
            ? "bg-blue-50 text-blue-500 dark:bg-blue-950 dark:text-blue-400"
            : "hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
      >
        {icon}
        <span className="text-base font-medium">{text}</span>
      </div>
    );

    if (to) {
      return (
        <Link
          to={to}
          onClick={(e) => {
            onClose();
            onClick?.();
          }}
        >
          {content}
        </Link>
      );
    }

    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black z-40"
            aria-hidden="true"
          />

          {/* Menü */}
          <motion.div
            ref={menuRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-[85%] max-w-xs bg-white dark:bg-gray-900 z-50 shadow-xl overflow-auto"
          >
            {/* Menü başlığı */}
            <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                  {user?.username ? user.username.charAt(0).toUpperCase() : "G"}
                </div>
                <div className="ml-3">
                  <div className="font-semibold text-lg">
                    {user?.username || t("common.guest")}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.isAdmin ? t("common.adminAccount") : t("common.userAccount")}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menü içeriği */}
            <div className="p-4 space-y-4">
              {/* Ana Navigasyon - Her zaman görünecek */}
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-4 py-1">
                  {t("common.main")}
                </h3>
                {renderMenuItem(<Home className="w-5 h-5" />, t("common.home"), undefined, "/")}
                {renderMenuItem(
                  <Hotel className="w-5 h-5" />,
                  t("common.hotels"),
                  undefined,
                  "/hotels"
                )}
              </div>
              
              {/* Kullanıcı bölümü - Oturum durumuna göre değişir */}
              {user ? (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-4 py-1">
                    {t("common.profile")}
                  </h3>
                  {renderMenuItem(
                    <User className="w-5 h-5" />,
                    t("common.profile"),
                    undefined,
                    "/profile"
                  )}
                  {renderMenuItem(
                    <CalendarDays className="w-5 h-5" />,
                    t("common.reservations"),
                    undefined,
                    "/reservations"
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-4 py-1">
                    {t("common.account")}
                  </h3>
                  <Link to="/auth" className="block mb-2">
                    <div className="mx-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-center transition-colors">
                      {t("common.login")}
                    </div>
                  </Link>
                  <Link to="/auth?register=true" className="block">
                    <div className="mx-4 px-4 py-2 border border-blue-500 text-blue-500 hover:bg-blue-50 rounded-lg text-center transition-colors">
                      {t("common.register")}
                    </div>
                  </Link>
                </div>
              )}

              {user?.isAdmin && (
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-4 py-1">
                    {t("common.adminPanel")}
                  </h3>
                  {renderMenuItem(
                    <Hotel className="w-5 h-5" />,
                    t("common.manageHotels"),
                    undefined,
                    "/admin/hotels"
                  )}
                  {renderMenuItem(
                    <CalendarDays className="w-5 h-5" />,
                    t("common.manageReservations"),
                    undefined,
                    "/admin/reservations"
                  )}
                  {renderMenuItem(
                    <CreditCard className="w-5 h-5" />,
                    t("common.managePricing"),
                    undefined,
                    "/admin/pricing"
                  )}
                  {renderMenuItem(
                    <Settings className="w-5 h-5" />,
                    t("common.settings"),
                    undefined,
                    "/admin/settings"
                  )}
                </div>
              )}

              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-4 py-1">
                  {t("common.preferences")}
                </h3>
                {renderMenuItem(
                  isDarkTheme ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  ),
                  isDarkTheme ? t("common.lightMode") : t("common.darkMode"),
                  toggleTheme
                )}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Languages className="w-5 h-5" />
                    <span className="text-base font-medium">{t("common.language")}</span>
                  </div>
                  <div className="mt-2 pl-8">
                    <LanguageSwitcher />
                  </div>
                </div>
              </div>

              {user && (
                <div className="pt-4 border-t dark:border-gray-800">
                  {renderMenuItem(
                    <LogOut className="w-5 h-5" />,
                    t("common.logout"),
                    handleLogout
                  )}
                </div>
              )}
            </div>

            {/* Menü altı */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-xs text-center text-gray-500 dark:text-gray-400 border-t dark:border-gray-800">
              Vipinn Hotels &copy; {new Date().getFullYear()}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}