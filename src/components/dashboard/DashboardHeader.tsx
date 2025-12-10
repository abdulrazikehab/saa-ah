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
  Menu
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { coreApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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
  userName = "سيل كلاود",
  userEmail = "admin@example.com",
  userAvatar 
}: DashboardHeaderProps) => {
  const [dateRange, setDateRange] = useState('month');
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          coreApi.get('/orders', { requireAuth: true }),
          coreApi.get('/products', { requireAuth: true })
        ]);

        const newNotifications: Notification[] = [];

        // Check for pending orders
        const pendingOrders = (ordersRes.orders || []).filter((o: any) => o.status === 'PENDING');
        pendingOrders.forEach((order: any) => {
          newNotifications.push({
            id: `order-${order.id}`,
            type: 'order',
            title: 'طلب جديد',
            message: `طلب جديد #${order.orderNumber} بقيمة ${order.totalAmount}`,
            time: new Date(order.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
            read: false
          });
        });

        // Check for low stock
        const lowStockProducts = (productsRes.products || []).filter((p: any) => 
            p.variants?.some((v: any) => v.inventoryQuantity < 5 && v.trackInventory)
        );
        
        lowStockProducts.forEach((product: any) => {
             newNotifications.push({
                id: `stock-${product.id}`,
                type: 'stock',
                title: 'تنبيه مخزون',
                message: `المنتج "${product.name}" أوشك على النفاد`,
                time: 'الآن',
                read: false
             });
        });

        setNotifications(newNotifications);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const handleDownload = () => {
    toast({
      title: 'جاري التحميل',
      description: 'سيتم تحميل التقرير قريباً',
    });
  };

  const handleFilter = () => {
    toast({
      title: 'تصفية',
      description: 'تم تطبيق التصفية الافتراضية',
    });
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        {/* Left Section - Mobile Menu + Search */}
        <div className="flex items-center gap-3 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Saa'ah Logo */}
          <div className="hidden md:flex items-center mr-6">
            <img src="/branding/saaah-logo-full.png" alt="Saa'ah - سِعَة" className="h-8 object-contain bg-transparent" />
          </div>

          {/* Search Bar */}
          <div className="relative hidden md:flex flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="بحث رقم الطلب، رقم المنتج، اسم العميل..."
              className="pr-10 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Center Section - Date Range Selector */}
        <div className="hidden lg:flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[280px] bg-muted/50 border-0">
              <Calendar className="h-4 w-4 ml-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">نوفمبر 1, 2025 - نوفمبر 7, 2025</SelectItem>
              <SelectItem value="month">نوفمبر 1, 2025 - نوفمبر 30, 2025</SelectItem>
              <SelectItem value="year">يناير 1, 2025 - ديسمبر 31, 2025</SelectItem>
              <SelectItem value="custom">تخصيص التاريخ</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleFilter}>
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Language Toggle */}
          <LanguageToggle />

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">التنبيهات</h3>
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  مسح الكل
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
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
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
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                    {userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">{userName}</span>
                  <span className="text-xs text-muted-foreground">{userEmail}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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
                <User className="ml-2 h-4 w-4" />
                <span>الملف الشخصي</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                <Settings className="ml-2 h-4 w-4" />
                <span>الإعدادات</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/help')}>
                <HelpCircle className="ml-2 h-4 w-4" />
                <span>المساعدة والدعم</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleLogout}>
                <LogOut className="ml-2 h-4 w-4" />
                <span>تسجيل الخروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="بحث..."
            className="pr-10 bg-muted/50 border-0"
          />
        </div>
      </div>
    </header>
  );
};
