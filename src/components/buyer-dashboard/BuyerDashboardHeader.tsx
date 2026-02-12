import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bell, 
  Search, 
  Menu, 
  ShoppingCart,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Heart,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';

interface BuyerDashboardHeaderProps {
  onMenuClick: () => void;
  userName: string;
  userEmail: string;
  userAvatar?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'order' | 'product' | 'promotion' | 'system';
}

export const BuyerDashboardHeader = ({ 
  onMenuClick, 
  userName, 
  userEmail, 
  userAvatar 
}: BuyerDashboardHeaderProps) => {
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'منتج جديد متاح',
      message: 'تم إضافة منتج جديد يمكنك الوصول إليه الآن',
      time: 'منذ 5 دقائق',
      read: false,
      type: 'product'
    },
    {
      id: '2',
      title: 'طلبك مكتمل',
      message: 'تم إتمام طلبك بنجاح. يمكنك تحميل المنتج الآن',
      time: 'منذ ساعة',
      read: false,
      type: 'order'
    }
  ]);

  const isRTL = i18n.language === 'ar';
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    await logout();
    const search = window.location.search;
    window.location.href = `/login${search}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart className="h-4 w-4 text-success" />;
      case 'product': return <Package className="h-4 w-4 text-primary" />;
      case 'promotion': return <Heart className="h-4 w-4 text-destructive" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-card/95 backdrop-blur-md border-b flex items-center justify-between px-4 md:px-6">
      {/* Left Side: Menu + Search */}
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} h-4 w-4 text-muted-foreground`} />
          <Input
            type="search"
            placeholder="ابحث عن المنتجات..."
            className={`w-[200px] lg:w-[300px] ${isRTL ? 'pr-9' : 'pl-9'} bg-muted/50`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* Right Side: Actions */}
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
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-destructive"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">الإشعارات</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} جديد
                </Badge>
              )}
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">لا توجد إشعارات</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{String(notification.title || '')}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {String(notification.message || '')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {String(notification.time || '')}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-1.5" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t">
              <Button variant="ghost" className="w-full text-sm" asChild>
                <Link to="/buyer/notifications">عرض جميع الإشعارات</Link>
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Cart Quick Access */}
        <Button variant="ghost" size="icon" asChild>
          <Link to="/cart">
            <ShoppingCart className="h-5 w-5" />
          </Link>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {userName?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">{userName}</span>
                <span className="text-xs text-muted-foreground">مشتري</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{userName}</span>
                <span className="text-xs font-normal text-muted-foreground">{userEmail}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/buyer/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {i18n.language === 'ar' ? 'الملف الشخصي' : 'Profile'}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/buyer/orders" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                {t('sections.customerOrders.title')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/buyer/favorites" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                {i18n.language === 'ar' ? 'المفضلة' : 'Favorites'}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/buyer/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {i18n.language === 'ar' ? 'الإعدادات' : 'Settings'}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="h-4 w-4 ml-2" />
              تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

