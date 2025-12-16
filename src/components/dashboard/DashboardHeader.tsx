import { useEffect, useState } from 'react';
import { 
  Search, 
  Bell, 
  User, 
  Calendar,
  Download,
  Filter,
  ChevronDown,
  Settings,
  LogOut,
  HelpCircle,
  Menu,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { StoreSwitcher } from '@/components/dashboard/StoreSwitcher';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { getLogoUrl } from '@/config/logo.config';

interface DashboardHeaderProps {
  onMenuClick?: () => void;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

interface Notification {
  id: string;
  type: 'order' | 'payment' | 'stock' | 'review';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export const DashboardHeader = ({ 
  onMenuClick, 
  userName = "User",
  userEmail = "admin@example.com",
  userAvatar 
}: DashboardHeaderProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [dateRange, setDateRange] = useState('month');
  const navigate = useNavigate();
  const { logout, user, refreshUser } = useAuth();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currency, setCurrency] = useState<string>('SAR');
  const [currencySymbol, setCurrencySymbol] = useState<string>('ر.س');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        interface OrderItem {
          id: string;
          status: string;
          orderNumber: string;
          totalAmount: number;
          createdAt: string;
        }
        interface ProductVariant {
          inventoryQuantity: number;
          trackInventory: boolean;
        }
        interface ProductItem {
          id: string;
          name: string;
          variants?: ProductVariant[];
        }
        
        let ordersRes: { orders?: OrderItem[] } = { orders: [] };
        let productsRes: { products?: ProductItem[] } = { products: [] };
        
        try {
          const [ordersResponse, productsResponse] = await Promise.all([
            coreApi.get('/orders', { requireAuth: true }),
            coreApi.get('/products', { requireAuth: true })
          ]);
          
          // Validate orders response
          if (ordersResponse && typeof ordersResponse === 'object' && !('error' in ordersResponse)) {
            if (Array.isArray(ordersResponse)) {
              ordersRes = { orders: ordersResponse };
            } else if (ordersResponse.orders && Array.isArray(ordersResponse.orders)) {
              ordersRes = ordersResponse;
            }
          }
          
          // Validate products response
          if (productsResponse && typeof productsResponse === 'object' && !('error' in productsResponse)) {
            if (Array.isArray(productsResponse)) {
              productsRes = { products: productsResponse };
            } else if (productsResponse.products && Array.isArray(productsResponse.products)) {
              productsRes = productsResponse;
            }
          }
        } catch (apiError) {
          console.error('Failed to fetch orders/products for notifications', apiError);
        }

        const newNotifications: Notification[] = [];

        // Check for pending orders
        const orders = ordersRes.orders || [];
        const pendingOrders = orders.filter((o) => o && o.status === 'PENDING');
        pendingOrders.forEach((order) => {
          if (order && order.id) {
            const title = t('dashboard.header.newOrder') || 'New Order';
            const message = t('dashboard.header.newOrderMessage', { 
              orderNumber: String(order.orderNumber || order.id), 
              amount: Number(order.totalAmount) || 0 
            }) || `Order ${order.orderNumber || order.id}`;
            const time = order.createdAt 
              ? new Date(order.createdAt).toLocaleTimeString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })
              : 'Now';
            
            newNotifications.push({
              id: `order-${order.id}`,
              type: 'order',
              title: typeof title === 'string' ? title : String(title),
              message: typeof message === 'string' ? message : String(message),
              time: typeof time === 'string' ? time : String(time),
              read: false
            });
          }
        });

        // Check for low stock
        const products = productsRes.products || [];
        const lowStockProducts = products.filter((p) => 
            p && p.variants?.some((v) => v.inventoryQuantity < 5 && v.trackInventory)
        );
        
        lowStockProducts.forEach((product) => {
          if (product && product.id) {
            const title = t('dashboard.header.lowStockAlert') || 'Low Stock Alert';
            const message = t('dashboard.header.lowStockMessage', { productName: String(product.name || '') }) || `Low stock: ${product.name}`;
            const time = t('dashboard.header.now') || 'Now';
            
            newNotifications.push({
              id: `stock-${product.id}`,
              type: 'stock',
              title: typeof title === 'string' ? title : String(title),
              message: typeof message === 'string' ? message : String(message),
              time: typeof time === 'string' ? time : String(time),
              read: false
            });
          }
        });

        setNotifications(newNotifications);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
        setNotifications([]);
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [t, i18n.language]);

  // Load currency from settings
  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const config = await coreApi.get('/site-config', { requireAuth: true });
        if (config && typeof config === 'object' && config.settings?.currency) {
          const currencyCode = String(config.settings.currency);
          if (currencyCode && currencyCode.length <= 10) { // Basic validation
            setCurrency(currencyCode);
            
            // Try to get currency symbol from currencies API
            try {
              const currencies = await coreApi.get('/currencies', { requireAuth: true });
              if (Array.isArray(currencies)) {
                const currencyData = currencies.find((c: any) => c?.code === currencyCode);
                if (currencyData?.symbol && typeof currencyData.symbol === 'string') {
                  setCurrencySymbol(currencyData.symbol);
                } else {
                  // Fallback symbols
                  const fallbackSymbols: Record<string, string> = {
                    'SAR': 'ر.س',
                    'AED': 'د.إ',
                    'USD': '$',
                    'EUR': '€',
                    'GBP': '£',
                  };
                  setCurrencySymbol(fallbackSymbols[currencyCode] || currencyCode);
                }
              } else {
                // Fallback symbols if response is not an array
                const fallbackSymbols: Record<string, string> = {
                  'SAR': 'ر.س',
                  'AED': 'د.إ',
                  'USD': '$',
                  'EUR': '€',
                  'GBP': '£',
                };
                setCurrencySymbol(fallbackSymbols[currencyCode] || currencyCode);
              }
            } catch (err) {
              // Fallback symbols if currencies API fails
              const fallbackSymbols: Record<string, string> = {
                'SAR': 'ر.س',
                'AED': 'د.إ',
                'USD': '$',
                'EUR': '€',
                'GBP': '£',
              };
              setCurrencySymbol(fallbackSymbols[currencyCode] || currencyCode);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load currency:', error);
        // Set defaults on error
        setCurrency('SAR');
        setCurrencySymbol('ر.س');
      }
    };
    loadCurrency();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const handleDownload = () => {
    toast({
      title: t('dashboard.header.download'),
      description: t('dashboard.header.download', 'Report will be downloaded soon'),
    });
  };

  const handleFilter = () => {
    toast({
      title: t('dashboard.header.filter'),
      description: t('dashboard.header.filter', 'Default filter applied'),
    });
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-6 lg:px-8 gap-2 sm:gap-4">
        {/* Left Section - Mobile Menu + Search */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
            onClick={onMenuClick}
            aria-label="فتح القائمة"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Saeaa Logo */}
          <div className={`hidden sm:flex items-center flex-shrink-0 ${isRTL ? 'mr-2 md:mr-6' : 'ml-2 md:ml-6'}`}>
            <img src={getLogoUrl()} alt="Saeaa - سِعَة" className="h-7 sm:h-8 object-contain bg-transparent" />
          </div>

        </div>

        {/* Center Section - Date Range Selector */}
        <div className="hidden xl:flex items-center gap-2 flex-shrink-0">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[240px] xl:w-[280px] bg-muted/50 border-0 h-9">
              <Calendar className={`h-4 w-4 text-muted-foreground ${isRTL ? 'ml-2' : 'mr-2'}`} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">
                {(() => {
                  const now = new Date();
                  const start = new Date(now);
                  start.setDate(start.getDate() - 7);
                  const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
                  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
                  return `${start.toLocaleDateString(locale, options)} - ${now.toLocaleDateString(locale, options)}`;
                })()}
              </SelectItem>
              <SelectItem value="month">
                {(() => {
                  const now = new Date();
                  const start = new Date(now.getFullYear(), now.getMonth(), 1);
                  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                  const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
                  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
                  return `${start.toLocaleDateString(locale, options)} - ${end.toLocaleDateString(locale, options)}`;
                })()}
              </SelectItem>
              <SelectItem value="year">
                {(() => {
                  const now = new Date();
                  const start = new Date(now.getFullYear(), 0, 1);
                  const end = new Date(now.getFullYear(), 11, 31);
                  const locale = i18n.language === 'ar' ? 'ar-SA' : 'en-US';
                  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
                  return `${start.toLocaleDateString(locale, options)} - ${end.toLocaleDateString(locale, options)}`;
                })()}
              </SelectItem>
              <SelectItem value="custom">{t('dashboard.header.customDate')}</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleDownload} title={t('dashboard.header.download')}>
            <Download className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleFilter} title={t('dashboard.header.filter')}>
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Currency Display */}
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-muted/50 border border-border">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">{currencySymbol}</span>
            <span className="text-xs text-muted-foreground">{currency}</span>
          </div>
          
          {/* Store Switcher */}
          <StoreSwitcher />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Language Toggle */}
          <LanguageToggle />

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-0.5 -right-0.5 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center p-0 text-[10px] sm:text-xs"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 max-w-sm p-0" align="end">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">{t('dashboard.header.notifications')}</h3>
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  {t('dashboard.header.clearAll')}
                </Button>
              </div>
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-cyan-50/30 dark:bg-cyan-900/10' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          notification.type === 'order' ? 'bg-green-100 dark:bg-green-900/30' :
                          notification.type === 'payment' ? 'bg-blue-100 dark:bg-blue-900/30' :
                          notification.type === 'stock' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                          'bg-purple-100 dark:bg-purple-900/30'
                        }`}>
                          <Bell className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{String(notification.title || '')}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {String(notification.message || '')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">{String(notification.time || '')}</p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-1.5 sm:gap-2 px-1.5 sm:px-2 h-9 sm:h-10">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-xs sm:text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-xs sm:text-sm font-medium truncate max-w-[120px]">{userName}</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[120px]">{userEmail}</span>
                </div>
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 sm:w-64">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{userName}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {userEmail}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
                <User className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span>{t('dashboard.header.profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                <Settings className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span>{t('dashboard.header.settings')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/help')}>
                <HelpCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span>{t('dashboard.header.helpAndSupport')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleLogout}>
                <LogOut className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span>{t('dashboard.header.logout')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="lg:hidden px-3 sm:px-4 pb-2 sm:pb-3 border-t">
        <div className="relative">
          <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
          <Input
            type="search"
            placeholder={t('dashboard.header.searchPlaceholder')}
            className={`bg-muted/50 border-0 h-9 text-sm ${isRTL ? 'pr-10' : 'pl-10'}`}
          />
        </div>
      </div>
    </header>
  );
};
