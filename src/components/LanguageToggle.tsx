import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    
    // Immediately update direction with style injection
    const dir = lng === 'ar' ? 'rtl' : 'ltr';
    
    // Create or update style element
    let styleEl = document.getElementById('direction-style') as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'direction-style';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      html { direction: ${dir} !important; }
      body { direction: ${dir} !important; }
      html[dir="${dir}"] { direction: ${dir} !important; }
      body[dir="${dir}"] { direction: ${dir} !important; }
      html.${dir} { direction: ${dir} !important; }
      body.${dir} { direction: ${dir} !important; }
    `;
    
    // Force update html element
    document.documentElement.dir = dir;
    document.documentElement.setAttribute('dir', dir);
    
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
