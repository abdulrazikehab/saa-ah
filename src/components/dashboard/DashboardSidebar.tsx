import { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Wallet,
  X,
  Building2,
  DollarSign,
  Plug,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { coreApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useTabUpdatesContext } from '@/contexts/TabUpdatesContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTranslation } from 'react-i18next';
import { APP_VERSION, GIT_COMMIT } from '@/version';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency-utils';

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

interface NavigationSection {
  title: string;
  items: Array<{
    name: string;
    href: string;
    icon: LucideIcon;
    badge?: string | null;
  }>;
}

export const DashboardSidebar = ({ className, collapsed = false, onToggleCollapse }: DashboardSidebarProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const location = useLocation();
  const navigate = useNavigate();
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus>({});
  const [balance, setBalance] = useState<number>(0);
  const [defaultCurrency, setDefaultCurrency] = useState<string>('SAR');
  const { hasUnreadUpdates, getUnreadUpdates, markAsWatched } = useTabUpdatesContext();
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    [t('dashboard.sidebar.home')]: true,
    [t('dashboard.sidebar.salesAndOrders')]: true,
    [t('dashboard.sidebar.contentAndDesign')]: true,
    [t('dashboard.sidebar.marketing')]: true,
    [t('dashboard.sidebar.storeSettings')]: false,
    [t('dashboard.sidebar.advanced')]: false,
  });

  // Auto-mark as watched when user navigates to a tab with updates
  useEffect(() => {
    // Dynamically find all navigation items with badges
    const tabsWithBadges = navigationSections
      .flatMap(section => section.items)
      .filter(item => item.badge === t('dashboard.sidebar.new'))
      .map(item => item.href);

    tabsWithBadges.forEach(href => {
      const isActive = href === '/dashboard/settings' 
        ? (location.pathname === '/dashboard/settings' || location.pathname.startsWith('/dashboard/settings/'))
        : (location.pathname === href || location.pathname.startsWith(href + '/'));
      
      // Always mark as watched when navigating to the tab to hide the badge
      if (isActive) {
        markAsWatched(href);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await coreApi.get('/site-config', { requireAuth: true });
        setConfig(res.settings);
        // Extract default currency from settings
        if (res.settings?.currency) {
          setDefaultCurrency(res.settings.currency);
        }
      } catch {
        // Silently fail
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const fetchPartnerStatus = async () => {
      try {
        const res = await coreApi.get('/partner/status', { requireAuth: true });
        setPartnerStatus(res);
      } catch {
        // Silently fail
      }
    };
    fetchPartnerStatus();
  }, []);

  // Fetch user balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await coreApi.get('/transactions/balance', { requireAuth: true }) as { 
          availableBalance?: number; 
          balance?: number;
          currency?: string;
        };
        // Support both old and new API response formats
        setBalance(res.availableBalance || res.balance || 0);
        // Store currency in state if needed
        if (res.currency) {
          // Currency is available in the response
        }
      } catch {
        setBalance(0);
      }
    };
    fetchBalance();
  }, []);

  const navigationSections: NavigationSection[] = [
    {
      title: t('dashboard.sidebar.home'),
      items: [
        { name: t('dashboard.sidebar.dashboard'), href: '/dashboard', icon: Home, badge: null },
      ],
    },
    {
      title: t('dashboard.sidebar.salesAndOrders'),
      items: [
        { name: t('dashboard.sidebar.products'), href: '/dashboard/products', icon: Package, badge: null },
        { name: t('dashboard.sidebar.hierarchical', 'المستكشف الهرمي'), href: '/dashboard/hierarchical', icon: FolderOpen, badge: null },
        { name: t('dashboard.sidebar.priceManagement'), href: '/dashboard/prices', icon: DollarSign, badge: null },
        { name: t('dashboard.sidebar.orders'), href: '/dashboard/orders', icon: ShoppingCart, badge: null },
        { name: t('dashboard.sidebar.customers'), href: '/dashboard/customers', icon: Users, badge: null },
        { name: t('dashboard.sidebar.reports'), href: '/dashboard/reports', icon: BarChart3, badge: null },
      ],
    },
    {
      title: t('dashboard.sidebar.contentAndDesign'),
      items: [
        { name: t('dashboard.sidebar.categories'), href: '/dashboard/categories', icon: FolderOpen, badge: null },
        { name: t('dashboard.sidebar.pages'), href: '/dashboard/pages', icon: FileText, badge: null },
        { name: t('dashboard.sidebar.storefront'), href: '/dashboard/storefront', icon: Store, badge: null },
        { name: t('dashboard.sidebar.storeDesign'), href: '/dashboard/design', icon: Palette, badge: null },
        { name: t('dashboard.sidebar.templates'), href: '/dashboard/templates', icon: LayoutDashboard, badge: null },
      ],
    },
    {
      title: t('dashboard.sidebar.marketing'),
      items: [
        { name: t('dashboard.sidebar.potentialAndMarketing'), href: '/dashboard/marketing', icon: Tag, badge: null },
        { name: t('dashboard.sidebar.smartLine'), href: '/dashboard/smart-line', icon: Rocket, badge: null },
      ],
    },
    {
      title: t('dashboard.sidebar.storeSettings'),
      items: [
        { name: t('dashboard.sidebar.generalSettings'), href: '/dashboard/settings', icon: Settings, badge: null },
        { name: t('dashboard.sidebar.notifications'), href: '/dashboard/settings/notifications', icon: Bell, badge: null },
        { name: t('dashboard.sidebar.payment'), href: '/dashboard/settings/payment', icon: CreditCard, badge: null },
        { name: t('dashboard.sidebar.checkoutSettings'), href: '/dashboard/settings/checkout', icon: ShoppingCart, badge: null },
        { name: t('dashboard.sidebar.domains'), href: '/dashboard/settings/domains', icon: Globe, badge: null },
        { name: t('dashboard.sidebar.suppliers'), href: '/dashboard/settings/suppliers', icon: Building2, badge: null },
        { name: t('dashboard.sidebar.brands'), href: '/dashboard/settings/brands', icon: Package, badge: null },
        { name: t('dashboard.sidebar.units'), href: '/dashboard/settings/units', icon: Package, badge: null },
        { name: t('dashboard.sidebar.currencies'), href: '/dashboard/settings/currencies', icon: DollarSign, badge: null },
      ],
    },
    {
      title: t('dashboard.sidebar.advanced'),
      items: [
        { name: t('dashboard.sidebar.usersAndPermissions'), href: '/dashboard/settings/users', icon: Users, badge: null },
        { name: t('dashboard.sidebar.integrations'), href: '/dashboard/settings/integrations', icon: Plug, badge: null },
        { name: t('dashboard.sidebar.identityVerification'), href: '/dashboard/settings/kyc', icon: ShieldCheck, badge: null },
        { name: t('dashboard.sidebar.appStore'), href: '/dashboard/apps', icon: Smartphone, badge: null },
        { name: t('dashboard.sidebar.storeManagement'), href: '/dashboard/management', icon: Settings, badge: null },
        { name: t('dashboard.sidebar.chat'), href: '/dashboard/chat', icon: MessageSquare, badge: null },
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
      if (item.href === '/dashboard/settings') {
        return location.pathname === '/dashboard/settings' || location.pathname.startsWith('/dashboard/settings/');
      }
      return location.pathname === item.href || location.pathname.startsWith(item.href + '/');
    });
  };

  return (
    <div className={cn("flex flex-col h-full bg-card relative", isRTL ? "border-l" : "border-r", className)}>
      {/* Logo Section */}
      <div className={cn("flex items-center h-16 border-b transition-all", collapsed ? "justify-center px-2" : "justify-between px-6")}>
        <Link to="/dashboard" className={cn("flex items-center gap-3", collapsed && "flex-col gap-1")}>
          {config?.storeLogoUrl || config?.logo ? (
            <img 
              src={config.storeLogoUrl || config.logo} 
              alt={config.storeNameAr || config.storeName || config.tenantName || 'Store Logo'} 
              className={cn("rounded-xl object-cover shadow-sm border", collapsed ? "h-8 w-8" : "h-12 w-12")}
            />
          ) : (
            <div className={cn("rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg", collapsed ? "h-8 w-8" : "h-12 w-12")}>
              <Store className={cn("text-white", collapsed ? "h-4 w-4" : "h-6 w-6")} />
            </div>
          )}
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold gradient-text truncate max-w-[140px]">
                {config?.storeNameAr || config?.storeName || config?.tenantName || "Saeaa"}
              </span>
              <span className="text-xs text-muted-foreground">{t('dashboard.sidebar.controlPanel')}</span>
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
          onClick={() => navigate('/dashboard/wallet')}
          className={cn(
            "rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 p-3 cursor-pointer hover:from-green-500/20 hover:to-emerald-500/20 transition-all",
            collapsed && "p-2"
          )}
          title={t('dashboard.sidebar.clickToViewWallet')}
        >
          <div className={cn("flex items-center gap-2", collapsed && "flex-col gap-1 justify-center")}>
            <div className="p-1.5 rounded-lg bg-green-500/20">
              <Wallet className={cn("text-green-600", collapsed ? "h-4 w-4" : "h-5 w-5")} />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">{t('dashboard.sidebar.yourBalance')}</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(balance, defaultCurrency)}
                </span>
              </div>
            )}
            {collapsed && (
              <span className="text-xs font-bold text-green-600">
                {formatCurrency(balance, defaultCurrency)}
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
                      sectionActive && "text-primary bg-primary/5"
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
                      const isActive = item.href === '/dashboard/settings' 
                        ? (location.pathname === '/dashboard/settings' || location.pathname.startsWith('/dashboard/settings/'))
                        : (location.pathname === item.href || location.pathname.startsWith(item.href + '/'));
                      const hasUnread = item.badge === t('dashboard.sidebar.new') && hasUnreadUpdates(item.href);
                      const unreadUpdates = hasUnread ? getUnreadUpdates(item.href) : [];
                      const unreadCount = unreadUpdates.length;
                      
                      return (
                        <div key={item.name} className="relative">
                          <Link
                            to={item.href}
                            title={collapsed ? item.name : undefined}
                            className={cn(
                              'flex items-center gap-3 rounded-lg text-sm font-medium transition-all group',
                              collapsed ? 'justify-center px-3 py-2.5' : 'justify-between px-3 py-2.5',
                              isActive
                                ? `bg-primary/10 text-primary ${isRTL ? 'border-r-2' : 'border-l-2'} border-primary shadow-sm`
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                            onClick={() => {
                              // Mark as watched when clicking on the link
                              if (item.badge === t('dashboard.sidebar.new') && hasUnreadUpdates(item.href)) {
                                markAsWatched(item.href);
                              }
                            }}
                          >
                            <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
                              <item.icon className={cn(
                                "h-4 w-4 transition-transform group-hover:scale-110 flex-shrink-0",
                                isActive && "text-primary"
                              )} />
                              {!collapsed && <span className="text-xs">{item.name}</span>}
                            </div>
                            {!collapsed && item.badge && (
                              <Popover 
                                open={openPopover === item.href} 
                                onOpenChange={(open) => setOpenPopover(open ? item.href : null)}
                              >
                                <PopoverTrigger asChild>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setOpenPopover(openPopover === item.href ? null : item.href);
                                    }}
                                    className="relative"
                                  >
                                    <Badge 
                                      variant="secondary" 
                                      className={cn(
                                        "text-white text-[10px] px-1.5 py-0 cursor-pointer",
                                        hasUnread 
                                          ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                                          : "bg-gray-500 hover:bg-gray-600"
                                      )}
                                    >
                                      {item.badge}
                                      {hasUnread && unreadCount > 0 && (
                                        <span className={`${isRTL ? 'ml-1' : 'mr-1'} bg-white text-red-500 rounded-full px-1 text-[9px] font-bold`}>
                                          {unreadCount}
                                        </span>
                                      )}
                                    </Badge>
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent 
                                  className="w-80 p-0" 
                                  align="end"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-center justify-between p-4 border-b">
                                    <h3 className="font-semibold">{t('dashboard.header.notifications')}</h3>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => {
                                        markAsWatched(item.href);
                                        setOpenPopover(null);
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <ScrollArea className="h-[300px]">
                                    {unreadUpdates.length > 0 ? (
                                      <div className="p-2 space-y-2">
                                        {unreadUpdates.map((update) => (
                                          <div
                                            key={update.id}
                                            className="p-3 rounded-lg border bg-card hover:bg-muted transition-colors"
                                          >
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                  <Badge 
                                                    variant={update.type === 'added' ? 'default' : 'secondary'}
                                                    className="text-xs"
                                                  >
                                                    {update.type === 'added' ? t('dashboard.sidebar.new') : t('dashboard.header.status')}
                                                  </Badge>
                                                  <span className="text-xs text-muted-foreground">
                                                    {new Date(update.timestamp).toLocaleTimeString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
                                                      hour: '2-digit',
                                                      minute: '2-digit'
                                                    })}
                                                  </span>
                                                </div>
                                                <p className="text-sm">{String(update.message || '')}</p>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="p-8 text-center text-muted-foreground">
                                        <p>{t('dashboard.header.noNotifications')}</p>
                                      </div>
                                    )}
                                  </ScrollArea>
                                  {unreadUpdates.length > 0 && (
                                    <div className="p-3 border-t">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => {
                                          markAsWatched(item.href);
                                          setOpenPopover(null);
                                        }}
                                      >
                                        {t('common.confirm')}
                                      </Button>
                                    </div>
                                  )}
                                </PopoverContent>
                              </Popover>
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
                        ? `bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-700 dark:text-purple-400 ${isRTL ? 'border-r-4' : 'border-l-4'} border-purple-500 shadow-sm`
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
                            className={`absolute -top-1 w-3 h-3 rounded-full bg-white ${isRTL ? '-right-1' : '-left-1'}`}
                          />
                        )}
                      </div>
                      {!collapsed && <span>{t('dashboard.sidebar.support')} ASUS</span>}
                    </div>
                  </Link>
                )}

                {partnerStatus.smartLinePartnerCompleted && (
                  <Link
                    to="/dashboard/support"
                    title={collapsed ? t('dashboard.sidebar.support') + ' Smart Line' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg text-sm font-medium transition-all group',
                      collapsed ? 'justify-center px-3 py-3' : 'justify-between px-4 py-3',
                      location.pathname === '/dashboard/support'
                        ? `bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-700 dark:text-cyan-400 ${isRTL ? 'border-r-4' : 'border-l-4'} border-cyan-500 shadow-sm`
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
                            className={`absolute -top-1 w-3 h-3 rounded-full bg-white ${isRTL ? '-right-1' : '-left-1'}`}
                          />
                        )}
                      </div>
                      {!collapsed && <span>{t('dashboard.sidebar.support')} Smart Line</span>}
                    </div>
                  </Link>
                )}
              </div>
            </>
          )}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Footer Section - App Store Badges Only */}
      {!collapsed && (config?.googlePlayUrl || config?.appStoreUrl) && (
        <div className={cn("p-4", collapsed && "p-2")}>
          <div className="flex gap-2">
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
        </div>
      )}
      
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
