import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-neutral-100 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
      <div className="container px-4 py-8 md:px-6 mx-auto">
        <div className="text-center text-sm text-neutral-600 dark:text-neutral-400">
          <p>© {currentYear} Vipinn Hotels. {t('all_rights_reserved', 'Tüm hakları saklıdır.')}</p>
        </div>
      </div>
    </footer>
  );
}