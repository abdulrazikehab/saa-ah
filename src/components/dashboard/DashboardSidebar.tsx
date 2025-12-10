import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Settings, 
  Home,
  Users,
  FileText,
  BarChart3,
  Palette,
  Globe,
  FolderOpen,
  MessageSquare,
  Bell,
  CreditCard,
  Truck,
  Tag,
  Image,
  Menu as MenuIcon,
  Store,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  Headphones,
  Rocket,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { coreApi } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface DashboardSidebarProps {
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
  googlePlayUrl?: string;
  appStoreUrl?: string;
  [key: string]: unknown;
}

interface PartnerStatus {
  asusPartnerCompleted?: boolean;
  smartLinePartnerCompleted?: boolean;
}

export const DashboardSidebar = ({ className, collapsed = false, onToggleCollapse }: DashboardSidebarProps) => {
  const location = useLocation();
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus>({});
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await coreApi.get('/site-config', { requireAuth: true });
        setConfig(res.settings);
      } catch (error) {
        console.error('Failed to fetch site config:', error);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const fetchPartnerStatus = async () => {
      try {
        const res = await coreApi.get('/partner/status', { requireAuth: true });
        setPartnerStatus(res);
      } catch (error) {
        console.error('Failed to fetch partner status:', error);
      }
    };
    fetchPartnerStatus();
  }, []);

  // Fetch user balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await coreApi.get('/transactions/balance', { requireAuth: true }) as { balance?: number };
        setBalance(res.balance || 0);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        setBalance(0);
      }
    };
    fetchBalance();
  }, []);

  const navigation = [
    { 
      name: 'الرئيسية', 
      href: '/dashboard', 
      icon: Home,
      badge: null
    },
    { 
      name: 'المنتجات', 
      href: '/dashboard/products', 
      icon: Package,
      badge: null
    },
    { 
      name: 'الطلبات', 
      href: '/dashboard/orders', 
      icon: ShoppingCart,
      badge: 'جديد'
    },
    { 
      name: 'العملاء', 
      href: '/dashboard/customers', 
      icon: Users,
      badge: null
    },
    { 
      name: 'التقارير', 
      href: '/dashboard/reports', 
      icon: BarChart3,
      badge: null
    },
    { 
      name: 'الصفحات', 
      href: '/dashboard/pages', 
      icon: FileText,
      badge: null
    },
    { 
      name: 'الفئات', 
      href: '/dashboard/categories', 
      icon: FolderOpen,
      badge: 'جديد'  // New customer tiers & offers feature
    },
    { 
      name: 'المحادثات', 
      href: '/dashboard/chat', 
      icon: MessageSquare,
      badge: null
    },
    { 
      name: 'نافذة المتجر', 
      href: '/dashboard/storefront', 
      icon: Store,
      badge: null
    },
    { 
      name: 'إعدادات المتجر', 
      href: '/dashboard/store-settings', 
      icon: Settings,
      badge: null
    },
    { 
      name: 'المحتملة والتسويق', 
      href: '/dashboard/marketing', 
      icon: Tag,
      badge: 'جديد'  // New marketing features
    },
    { 
      name: 'Smart Line', 
      href: '/dashboard/smart-line', 
      icon: Rocket,
      badge: 'جديد'
    },
    { 
      name: 'تصميم المتجر', 
      href: '/dashboard/design', 
      icon: Palette,
      badge: null
    },
    { 
      name: 'متجر التطبيقات', 
      href: '/dashboard/apps', 
      icon: Smartphone,
      badge: null
    },
    { 
      name: 'إدارة المتجر', 
      href: '/dashboard/management', 
      icon: Settings,
      badge: null
    },
    { 
      name: 'النطاق', 
      href: '/dashboard/domain', 
      icon: Globe,
      badge: null
    },
    { 
      name: 'القوالب', 
      href: '/dashboard/templates', 
      icon: LayoutDashboard,
      badge: null
    },
  ];

  return (
    <div className={cn("flex flex-col h-full bg-card border-l relative", className)}>
      {/* Logo Section */}
      <div className={cn("flex items-center h-16 border-b transition-all", collapsed ? "justify-center px-2" : "justify-between px-6")}>
        <Link to="/dashboard" className={cn("flex items-center gap-3", collapsed && "flex-col gap-1")}>
          {config?.storeLogoUrl || config?.logo ? (
            <img 
              src={config.storeLogoUrl || config.logo} 
              alt={config.storeNameAr || config.storeName || config.tenantName || 'Store Logo'} 
              className={cn("rounded-xl object-cover shadow-sm border", collapsed ? "h-8 w-8" : "h-10 w-10")}
            />
          ) : (
            <div className={cn("rounded-xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg", collapsed ? "h-8 w-8" : "h-10 w-10")}>
              <Store className={cn("text-white", collapsed ? "h-4 w-4" : "h-6 w-6")} />
            </div>
          )}
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent truncate max-w-[140px]">
                {config?.storeNameAr || config?.storeName || config?.tenantName || "Saa'ah"}
              </span>
              <span className="text-xs text-muted-foreground">لوحة التحكم</span>
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

      {/* Balance Section */}
      <div className={cn(
        "border-b transition-all",
        collapsed ? "px-2 py-3" : "px-4 py-3"
      )}>
        <div className={cn(
          "rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 p-3",
          collapsed && "p-2"
        )}>
          <div className={cn("flex items-center gap-2", collapsed && "flex-col gap-1 justify-center")}>
            <div className="p-1.5 rounded-lg bg-green-500/20">
              <Wallet className={cn("text-green-600", collapsed ? "h-4 w-4" : "h-5 w-5")} />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">رصيدك</span>
                <span className="text-lg font-bold text-green-600">
                  {balance.toLocaleString('ar-SA')} ر.س
                </span>
              </div>
            )}
            {collapsed && (
              <span className="text-xs font-bold text-green-600">
                {balance.toLocaleString('ar-SA')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                title={collapsed ? item.name : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg text-sm font-medium transition-all group',
                  collapsed ? 'justify-center px-3 py-3' : 'justify-between px-4 py-3',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-700 dark:text-cyan-400 border-r-4 border-cyan-500 shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform group-hover:scale-110 flex-shrink-0",
                    isActive && "text-cyan-600 dark:text-cyan-400"
                  )} />
                  {!collapsed && <span>{item.name}</span>}
                </div>
                {!collapsed && item.badge && (
                  <Badge 
                    variant="secondary" 
                    className="bg-red-500 text-white text-xs px-2 py-0.5"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}

          {/* Partner Support Buttons */}
          {(partnerStatus.asusPartnerCompleted || partnerStatus.smartLinePartnerCompleted) && (
            <>
              <Separator className="my-4" />
              <div className={cn("space-y-1", collapsed && "space-y-2")}>
                {partnerStatus.asusPartnerCompleted && (
                  <Link
                    to="/dashboard/support"
                    title={collapsed ? 'دعم ASUS' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg text-sm font-medium transition-all group',
                      collapsed ? 'justify-center px-3 py-3' : 'justify-between px-4 py-3',
                      location.pathname === '/dashboard/support'
                        ? 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-700 dark:text-purple-400 border-r-4 border-purple-500 shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
                      <div className="relative">
                        <Headphones className={cn(
                          "h-5 w-5 transition-transform group-hover:scale-110 flex-shrink-0",
                          location.pathname === '/dashboard/support' && "text-purple-600 dark:text-purple-400"
                        )} />
                        {!collapsed && (
                          <img 
                            src="/partners/asus-logo.png" 
                            alt="ASUS" 
                            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white"
                          />
                        )}
                      </div>
                      {!collapsed && <span>دعم ASUS</span>}
                    </div>
                  </Link>
                )}

                {partnerStatus.smartLinePartnerCompleted && (
                  <Link
                    to="/dashboard/support"
                    title={collapsed ? 'دعم Smart Line' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg text-sm font-medium transition-all group',
                      collapsed ? 'justify-center px-3 py-3' : 'justify-between px-4 py-3',
                      location.pathname === '/dashboard/support'
                        ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-700 dark:text-cyan-400 border-r-4 border-cyan-500 shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
                      <div className="relative">
                        <Headphones className={cn(
                          "h-5 w-5 transition-transform group-hover:scale-110 flex-shrink-0",
                          location.pathname === '/dashboard/support' && "text-cyan-600 dark:text-cyan-400"
                        )} />
                        {!collapsed && (
                          <img 
                            src="/partners/smartline-logo.png" 
                            alt="Smart Line" 
                            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white"
                          />
                        )}
                      </div>
                      {!collapsed && <span>دعم Smart Line</span>}
                    </div>
                  </Link>
                )}
              </div>
            </>
          )}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Footer Section */}
      <div className={cn("p-4 space-y-2", collapsed && "p-2")}>
        <Link to="/">
          <button className={cn(
            "w-full flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg",
            collapsed ? "justify-center px-3 py-3" : "justify-center px-4 py-3"
          )}>
            <Home className="h-4 w-4" />
            {!collapsed && (config?.storeNameAr || config?.storeName || config?.tenantName || "العودة للمتجر")}
          </button>
        </Link>
        
        {/* App Store Badges - Only show when not collapsed */}
        {!collapsed && (config?.googlePlayUrl || config?.appStoreUrl) && (
          <div className="flex gap-2 pt-2">
            {config?.googlePlayUrl && (
              <a 
                href={config.googlePlayUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 bg-black rounded-lg p-2 flex items-center justify-center gap-1 cursor-pointer hover:bg-gray-800 transition-colors"
              >
                <Smartphone className="h-4 w-4 text-white" />
                <div className="text-xs text-white font-medium">Google Play</div>
              </a>
            )}
            {config?.appStoreUrl && (
              <a 
                href={config.appStoreUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 bg-black rounded-lg p-2 flex items-center justify-center gap-1 cursor-pointer hover:bg-gray-800 transition-colors"
              >
                <Smartphone className="h-4 w-4 text-white" />
                <div className="text-xs text-white font-medium">App Store</div>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
