import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  Settings,
  Bell,
  Globe,
  Moon,
  Sun,
  Shield,
  Lock,
  LogOut,
  ChevronRight,
  Smartphone,
  CreditCard,
  HelpCircle,
  FileText,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { coreApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SettingItem {
  id: string;
  icon: React.ElementType;
  label: string;
  labelAr: string;
  description?: string;
  descriptionAr?: string;
  type: 'toggle' | 'link' | 'action';
  value?: boolean;
  route?: string;
  action?: () => void;
}

export default function MobileSettings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';

  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [_config, setConfig] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    // Check current theme
    const isDark = document.documentElement.classList.contains('dark') || 
                   localStorage.getItem('theme') === 'dark';
    setDarkMode(isDark);

    // Load app config
    coreApi.get('/app-builder/config')
      .then(res => setConfig(res?.config || res))
      .catch(() => {});
  }, []);

  const toggleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    toast({
      title: newLang === 'ar' ? 'تم تغيير اللغة' : 'Language Changed',
      description: newLang === 'ar' ? 'تم التبديل إلى العربية' : 'Switched to English',
    });
  };

  const handleLogout = () => {
    if (confirm(isRTL ? 'هل تريد تسجيل الخروج؟' : 'Are you sure you want to log out?')) {
      logout();
      navigate('/login');
    }
  };

  const settingSections = [
    {
      title: isRTL ? 'الحساب' : 'Account',
      items: [
        {
          id: 'edit-profile',
          icon: Settings,
          label: 'Edit Profile',
          labelAr: 'تعديل الملف الشخصي',
          type: 'link' as const,
          route: '/account/edit-profile',
        },
        {
          id: 'change-password',
          icon: Lock,
          label: 'Change Password',
          labelAr: 'تغيير كلمة المرور',
          type: 'link' as const,
          route: '/account/change-password',
        },
        {
          id: 'addresses',
          icon: Smartphone,
          label: 'Addresses',
          labelAr: 'العناوين',
          type: 'link' as const,
          route: '/account/addresses',
        },
        {
          id: 'payment-methods',
          icon: CreditCard,
          label: 'Payment Methods',
          labelAr: 'طرق الدفع',
          type: 'link' as const,
          route: '/account/payment-methods',
        },
      ],
    },
    {
      title: isRTL ? 'التفضيلات' : 'Preferences',
      items: [
        {
          id: 'notifications',
          icon: Bell,
          label: 'Notifications',
          labelAr: 'الإشعارات',
          description: 'Receive push notifications',
          descriptionAr: 'استلام الإشعارات',
          type: 'toggle' as const,
          value: notifications,
        },
        {
          id: 'dark-mode',
          icon: darkMode ? Moon : Sun,
          label: 'Dark Mode',
          labelAr: 'الوضع الداكن',
          description: darkMode ? 'Dark theme enabled' : 'Light theme enabled',
          descriptionAr: darkMode ? 'الوضع الداكن مفعل' : 'الوضع الفاتح مفعل',
          type: 'toggle' as const,
          value: darkMode,
        },
        {
          id: 'language',
          icon: Globe,
          label: isRTL ? 'English' : 'العربية',
          labelAr: isRTL ? 'English' : 'العربية',
          description: isRTL ? 'Switch to English' : 'التبديل إلى العربية',
          descriptionAr: isRTL ? 'Switch to English' : 'التبديل إلى العربية',
          type: 'action' as const,
          action: toggleLanguage,
        },
      ],
    },
    {
      title: isRTL ? 'الدعم' : 'Support',
      items: [
        {
          id: 'support',
          icon: MessageCircle,
          label: 'Contact Support',
          labelAr: 'تواصل مع الدعم',
          type: 'link' as const,
          route: '/account/support',
        },
        {
          id: 'help',
          icon: HelpCircle,
          label: 'Help Center',
          labelAr: 'مركز المساعدة',
          type: 'link' as const,
          route: '/help',
        },
        {
          id: 'terms',
          icon: FileText,
          label: 'Terms & Privacy',
          labelAr: 'الشروط والخصوصية',
          type: 'link' as const,
          route: '/terms',
        },
      ],
    },
  ];

  return (
    <div className="pb-24 bg-background min-h-screen">
      {/* Header */}
      <div className="bg-card p-4 shadow-sm sticky top-0 z-10 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-muted text-foreground">
          <ArrowLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
        </button>
        <h1 className="text-lg font-bold text-foreground">{t('settings.title', 'Settings')}</h1>
      </div>

      {/* Settings Sections */}
      <div className="p-4 space-y-6">
        {settingSections.map((section) => (
          <div key={section.title} className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
              {section.title}
            </h3>
            <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
              {section.items.map((item) => (
                <div 
                  key={item.id}
                  className={cn(
                    "flex items-center gap-4 p-4",
                    (item.type === 'link' || item.type === 'action') && "cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
                  )}
                  onClick={() => {
                    if (item.type === 'link' && item.route) navigate(item.route);
                    if (item.type === 'action' && item.action) item.action();
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">
                      {isRTL ? item.labelAr : item.label}
                    </p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">
                        {isRTL ? item.descriptionAr : item.description}
                      </p>
                    )}
                  </div>
                  {item.type === 'toggle' && (
                    <Switch 
                      checked={item.value}
                      onCheckedChange={(checked) => {
                        if (item.id === 'notifications') setNotifications(checked);
                        if (item.id === 'dark-mode') toggleDarkMode(checked);
                      }}
                    />
                  )}
                  {(item.type === 'link' || item.type === 'action') && (
                    <ChevronRight className={cn("w-5 h-5 text-muted-foreground", isRTL && "rotate-180")} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        {user && (
          <Button 
            variant="outline" 
            className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10 gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            {t('auth.logout', 'Log Out')}
          </Button>
        )}

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground py-4">
          {t('settings.version', 'Version')} 1.0.0
        </p>
      </div>
    </div>
  );
}
