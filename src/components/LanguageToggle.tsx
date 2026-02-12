import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { setLanguage } from '@/i18n';

export const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const changeLanguage = async (lng: 'ar' | 'en') => {
    // Use the centralized setLanguage function to ensure consistency
    setLanguage(lng);
    
    // Wait for language change to complete
    await i18n.changeLanguage(lng);
    
    // Trigger custom event to force all components to re-render
    window.dispatchEvent(new Event('languagechange'));
    
    // Force React to re-render by triggering a state update
    // This ensures all components using useTranslation() will update
    const event = new CustomEvent('i18n:languageChanged', { detail: { language: lng } });
    window.dispatchEvent(event);
    
    // Additional immediate direction update for instant visual feedback
    const dir = lng === 'ar' ? 'rtl' : 'ltr';
    
    // Force update html element
    document.documentElement.dir = dir;
    document.documentElement.lang = lng;
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lng);
    
    // Force update body element
    if (document.body) {
      document.body.dir = dir;
      document.body.setAttribute('dir', dir);
      document.body.style.setProperty('direction', dir, 'important');
      document.body.style.direction = dir;
    }
    
    // Update classes
    if (dir === 'rtl') {
      document.documentElement.classList.add('rtl');
      document.documentElement.classList.remove('ltr');
      if (document.body) {
        document.body.classList.add('rtl');
        document.body.classList.remove('ltr');
      }
    } else {
      document.documentElement.classList.add('ltr');
      document.documentElement.classList.remove('rtl');
      if (document.body) {
        document.body.classList.add('ltr');
        document.body.classList.remove('rtl');
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change language">
          <Languages className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage('ar')}>
          العربية
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('en')}>
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
