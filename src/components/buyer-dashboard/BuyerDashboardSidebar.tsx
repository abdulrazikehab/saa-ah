import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home,
  Package,
  ShoppingCart,
  Heart,
  Wallet,
  Headphones,
  User,
  Settings,
  FileText,
  Download,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Store,
  ShoppingBag,
  CreditCard,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { APP_VERSION, GIT_COMMIT } from '@/version';
import { coreApi } from '@/lib/api';

interface BuyerDashboardSidebarProps {
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface SiteConfig {
  storeName?: string;
  storeNameAr?: string;
  tenantName?: string;
  storeLogoUrl?: string;
  logo?: string;
  [key: string]: unknown;
}

interface NavigationSection {
  title: string;
  items: Array<{
    name: string;
    href: string;
    icon: LucideIcon;
    badge?: string | null;
  }>;
}

export const BuyerDashboardSidebar = ({ className, collapsed = false, onToggleCollapse }: BuyerDashboardSidebarProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const location = useLocation();
  const navigate = useNavigate();
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'الرئيسية': true,
    'مشترياتي': true,
    'المالية': true,
    'الدعم': false,
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await coreApi.get('/site-config', { requireAuth: true });
        setConfig(res.settings);
      } catch {
        // Silently fail
      }
    };
    fetchConfig();
  }, []);

  // Fetch user balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await coreApi.get('/buyer/wallet/balance', { requireAuth: true }) as { balance?: number };
        setBalance(res.balance || 0);
      } catch {
        setBalance(0);
      }
    };
    fetchBalance();
  }, []);

  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const navigationSections: NavigationSection[] = [
    {
      title: isRTL ? 'الرئيسية' : 'Home',
      items: [
        { name: isRTL ? 'لوحة التحكم' : 'Dashboard', href: '/buyer', icon: Home, badge: null },
        { name: isRTL ? 'تصفح المنتجات' : 'Browse Products', href: '/products', icon: Store, badge: null },
      ],
    },
    {
      title: isRTL ? 'مشترياتي' : 'My Purchases',
      items: [
        { name: isRTL ? 'منتجاتي الرقمية' : 'My Digital Products', href: '/buyer/products', icon: Package, badge: null },
        { name: t('sections.customerOrders.title'), href: '/buyer/orders', icon: ShoppingCart, badge: null },
        { name: isRTL ? 'المفضلة' : 'Favorites', href: '/buyer/favorites', icon: Heart, badge: null },
        { name: isRTL ? 'التحميلات' : 'Downloads', href: '/buyer/downloads', icon: Download, badge: null },
      ],
    },
    {
      title: isRTL ? 'المالية' : 'Finance',
      items: [
        { name: isRTL ? 'المحفظة' : 'Wallet', href: '/buyer/wallet', icon: Wallet, badge: null },
        { name: isRTL ? 'المدفوعات' : 'Payments', href: '/buyer/payments', icon: CreditCard, badge: null },
        { name: isRTL ? 'الفواتير' : 'Invoices', href: '/buyer/invoices', icon: FileText, badge: null },
      ],
    },
    {
      title: isRTL ? 'الدعم' : 'Support',
      items: [
        { name: isRTL ? 'تذاكر الدعم' : 'Support Tickets', href: '/buyer/support', icon: Headphones, badge: null },
        { name: isRTL ? 'الملف الشخصي' : 'Profile', href: '/buyer/profile', icon: User, badge: null },
        { name: isRTL ? 'الإعدادات' : 'Settings', href: '/buyer/settings', icon: Settings, badge: null },
      ],
    },
  ];

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  // Check if any item in a section is active
  const isSectionActive = (section: NavigationSection) => {
    return section.items.some(item => {
      return location.pathname === item.href || location.pathname.startsWith(item.href + '/');
    });
  };

  return (
    <div className={cn("flex flex-col h-full bg-card relative", isRTL ? "border-l" : "border-r", className)}>
      {/* Logo Section */}
      <div className={cn("flex items-center h-16 border-b transition-all", collapsed ? "justify-center px-2" : "justify-between px-6")}>
        <Link to="/buyer" className={cn("flex items-center gap-3", collapsed && "flex-col gap-1")}>
          {config?.storeLogoUrl || config?.logo ? (
            <img 
              src={config.storeLogoUrl || config.logo} 
              alt={config.storeNameAr || config.storeName || config.tenantName || 'Store Logo'} 
              className={cn("rounded-xl object-cover shadow-sm border", collapsed ? "h-8 w-8" : "h-10 w-10")}
            />
          ) : (
            <div className={cn("rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg", collapsed ? "h-8 w-8" : "h-10 w-10")}>
              <ShoppingBag className={cn("text-white", collapsed ? "h-4 w-4" : "h-6 w-6")} />
            </div>
          )}
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent truncate max-w-[140px]">
                {config?.storeNameAr || config?.storeName || config?.tenantName || "حسابي"}
              </span>
              <span className="text-xs text-muted-foreground">لوحة المشتري</span>
            </div>
          )}
        </Link>
        
        {/* Toggle Button - Only show on desktop when onToggleCollapse is provided */}
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className={cn("h-8 w-8 hidden lg:flex", collapsed && "absolute left-2 top-4")}
          >
            {collapsed ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Balance Section - Click to view wallet details */}
      <div className={cn(
        "border-b transition-all",
        collapsed ? "px-2 py-3" : "px-4 py-3"
      )}>
        <div 
          onClick={() => navigate('/buyer/wallet')}
          className={cn(
            "rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-3 cursor-pointer hover:from-emerald-500/20 hover:to-teal-500/20 transition-all",
            collapsed && "p-2"
          )}
          title="اضغط لعرض المحفظة"
        >
          <div className={cn("flex items-center gap-2", collapsed && "flex-col gap-1 justify-center")}>
            <div className="p-1.5 rounded-lg bg-emerald-500/20">
              <Wallet className={cn("text-emerald-600", collapsed ? "h-4 w-4" : "h-5 w-5")} />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">رصيدك</span>
                <span className="text-lg font-bold text-emerald-600">
                  {balance.toLocaleString('ar-SA')} ر.س
                </span>
              </div>
            )}
            {collapsed && (
              <span className="text-xs font-bold text-emerald-600">
                {balance.toLocaleString('ar-SA')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-4">
        <nav className="space-y-2">
          {navigationSections.map((section) => {
            const isExpanded = collapsed ? false : (expandedSections[section.title] ?? true);
            const sectionActive = isSectionActive(section);
            
            return (
              <div key={section.title} className="space-y-1">
                {!collapsed && (
                  <button
                    onClick={() => toggleSection(section.title)}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors rounded-md",
                      sectionActive && "text-cyan-600 dark:text-cyan-400 bg-cyan-500/5"
                    )}
                  >
                    <span>{section.title}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>
                )}
                
                {(isExpanded || collapsed) && (
                  <div className={cn("space-y-1", !collapsed && (isRTL ? "mr-2" : "ml-2"))}>
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                      
                      return (
                        <div key={item.name} className="relative">
                          <Link
                            to={item.href}
                            title={collapsed ? item.name : undefined}
                            className={cn(
                              'flex items-center gap-3 rounded-lg text-sm font-medium transition-all group',
                              collapsed ? 'justify-center px-3 py-2.5' : 'justify-between px-3 py-2.5',
                              isActive
                                ? `bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-700 dark:text-cyan-400 ${isRTL ? 'border-r-2' : 'border-l-2'} border-cyan-500 shadow-sm`
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                          >
                            <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
                              <item.icon className={cn(
                                "h-4 w-4 transition-transform group-hover:scale-110 flex-shrink-0",
                                isActive && "text-cyan-600 dark:text-cyan-400"
                              )} />
                              {!collapsed && <span className="text-xs">{item.name}</span>}
                            </div>
                            {!collapsed && item.badge && (
                              <Badge 
                                variant="secondary" 
                                className="text-white text-[10px] px-1.5 py-0 bg-cyan-500 hover:bg-cyan-600"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />
      
      {/* Version Info */}
      {!collapsed && (
        <div className="px-4 py-2 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            <div>v{APP_VERSION}</div>
            {GIT_COMMIT !== 'dev' && (
              <div className="text-[10px] opacity-70 mt-0.5">
                {GIT_COMMIT.substring(0, 7)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

