import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Package, Heart, MapPin, CreditCard, Settings, Headphones, 
  Layers, LogOut, ChevronRight, Lock, Globe, Bell, Moon, User,
  BarChart3, Users
} from 'lucide-react';
import { coreApi, authApi } from '@/lib/api';
import { useWishlist } from '@/contexts/WishlistContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDarkMode } from '@/contexts/DarkModeContext';
import { Switch } from '@/components/ui/switch';
import { setLanguage } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { getMobileTenantId } from '@/lib/storefront-utils';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Package, Heart, MapPin, CreditCard, Settings, Headphones, Layers, User, Lock, Globe, Bell, Moon
};

export default function MobileProfile() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language.startsWith('ar');
  const navigate = useNavigate();
  // Use central auth context instead of manual localStorage parsing
  const { user: authUser, isAuthenticated, loading: authLoading, logout } = useAuth();
  
  // Local state for UI
  const [user, setUser] = useState<any>(authUser);
  const [ordersCount, setOrdersCount] = useState(0);
  const { items: wishlistItems } = useWishlist();
  const [appConfig, setAppConfig] = useState<any>(null);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleNotifications = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    localStorage.setItem('notificationsEnabled', String(newValue));
  };

  useEffect(() => {
    // Sync local user state with auth context
    if (authUser) {
      setUser(authUser);
    }
  }, [authUser]);

  // Live Preview Sync: Listen for configuration updates from App Builder
  useEffect(() => {
    const handleSync = (event: MessageEvent) => {
      if (event.data?.type === 'APP_BUILDER_CONFIG_SYNC' && event.data?.config) {
        console.log('MobileProfile: Received config sync', event.data.config);
        setAppConfig(event.data.config);
      }
    };

    window.addEventListener('message', handleSync);
    
    // Signal that the preview is ready to receive config
    window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');

    return () => window.removeEventListener('message', handleSync);
  }, []);

  useEffect(() => {
    // Auth Guard for Profile Page
    if (!authLoading && !isAuthenticated) {
         console.log("MobileProfile: User not authenticated, redirecting to login");
         navigate('/login?returnTo=/profile', { replace: true });
         return;
    }

    const tenantId = getMobileTenantId();
    coreApi.get(tenantId ? `/app-builder/config?tenantId=${tenantId}` : '/app-builder/config')
      .then(res => setAppConfig(res.config || res))
      .catch(console.error);
    
    // Fetch orders if authenticated
    if (isAuthenticated) {
        coreApi.getOrders().then((res: any) => {
            if (Array.isArray(res)) setOrdersCount(res.length);
            else if (res?.data && Array.isArray(res.data)) setOrdersCount(res.data.length);
        }).catch(() => {});
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleLogout = async () => {
    try {
        await logout();
    } catch (e) {
        console.error("Logout error", e);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerData');
    
    // Redirect to login while preserving platform=mobile if present
    const search = window.location.search;
    window.location.href = `/login${search}`;
  };

  const pages = appConfig?.pages || [
    { id: 'inventory', title: t('profile.myInventory', 'My Inventory'), icon: 'Layers' },
    { id: 'orders', title: t('profile.orders', 'My Orders'), icon: 'Package' },
    { id: 'wallet', title: t('profile.wallet', 'Wallet'), icon: 'CreditCard' },
    { id: 'wishlist', title: t('profile.wishlist', 'Wishlist'), icon: 'Heart' },
    { id: 'address', title: t('profile.addresses', 'Addresses'), icon: 'MapPin' },
    { id: 'payment', title: t('profile.paymentMethods', 'Payment Methods'), icon: 'CreditCard' },
    { id: 'digital', title: t('profile.digitalKeys', 'Digital Keys'), icon: 'Lock' },
    { id: 'support', title: t('profile.support', 'Support'), icon: 'Headphones' },
    { id: 'notifications', title: t('profile.notifications', 'Notifications'), icon: 'Bell' },
  ];

  const primaryColor = appConfig?.primaryColor || '#000000';

  if (!user) return <div className="p-8 text-center pt-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div></div>;


  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-32 bg-background min-h-screen font-sans">
      {/* Header Profile Card */}
      {/* Header Profile Card - Centered Design */}
      <div className="bg-card p-6 pt-12 pb-8 rounded-b-[2.5rem] shadow-sm mb-6 border-b border-border/50">
        <div className="flex flex-col items-center text-center gap-3">
           <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
             <AvatarImage src={user.avatar} />
             <AvatarFallback className="bg-muted text-3xl font-bold" style={{ color: primaryColor }}>
               {user.firstName?.[0] || user.email?.[0]}
             </AvatarFallback>
           </Avatar>
           <div>
             <h2 className="text-xl font-bold mt-2">{user.firstName} {user.lastName}</h2>
             <p className="text-muted-foreground text-sm font-medium">{user.email}</p>
           </div>
        </div>
        
        <div className="mt-8 flex justify-center gap-4 px-4">
             <div className="min-w-[5rem] p-3 rounded-2xl bg-card border border-border shadow-sm text-center">
                 <span className="block text-xl font-bold mb-1" style={{ color: primaryColor }}>{ordersCount}</span>
                 <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{t('account.orders', 'Orders')}</span>
             </div>
             <div className="min-w-[5rem] p-3 rounded-2xl bg-card border border-border shadow-sm text-center">
                 <span className="block text-xl font-bold mb-1" style={{ color: primaryColor }}>{wishlistItems.length}</span>
                 <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{t('account.wishlist', 'Wishlist')}</span>
             </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 space-y-3">
         {pages
           .filter((p: any) => !['profile', 'address', 'addresses', 'account', 'settings', 'home', 'cart', 'categories', 'products'].includes(p.id.toLowerCase()))
           .map((page: any) => {
            const Icon = ICON_MAP[page.icon] || Layers;
            return (
              <button 
                key={page.id}
                onClick={() => {
                    if (page.id === 'orders') navigate('/account/orders');
                    else if (page.id === 'inventory') navigate('/account/inventory');
                    else if (page.id === 'wallet') navigate('/account/recharge');
                    else if (page.id === 'wishlist') navigate('/wishlist');
                    else if (page.id === 'address') navigate('/account/addresses');
                    else if (page.id === 'payment') navigate('/account/payment-methods');
                    else if (page.id === 'digital') navigate('/account/inventory');
                    else if (page.id === 'support') navigate('/account/support');
                    else if (page.id === 'notifications') navigate('/notifications');
                    else navigate(`/page/${page.id}`);
                }}
                className="w-full bg-card p-4 rounded-xl flex items-center justify-between shadow-sm border border-border active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                    <Icon size={20} />
                  </div>
                  <span className="font-medium text-foreground">{page.title}</span>
                </div>
                <ChevronRight size={18} className="text-muted-foreground" />
              </button>
            );
         })}

        {/* Management Section (Merchant/Admin) */}
        <div className="mt-6">
            <h3 className="text-lg font-bold mx-2 mb-2">{t('profile.management', 'Management')}</h3>
            
            <button onClick={() => navigate('/account/reports')} className="w-full bg-card p-4 rounded-xl flex items-center justify-between shadow-sm border border-border mb-3 active:scale-[0.98] transition-transform">
                 <div className="flex items-center gap-4">
                     <div className="p-2 rounded-lg bg-muted text-muted-foreground"><BarChart3 size={20} /></div>
                     <span className="font-medium text-foreground">{t('profile.reports', 'Reports')}</span>
                 </div>
                 <ChevronRight size={18} className="text-muted-foreground" />
            </button>

            <button onClick={() => navigate('/account/employees')} className="w-full bg-card p-4 rounded-xl flex items-center justify-between shadow-sm border border-border mb-3 active:scale-[0.98] transition-transform">
                 <div className="flex items-center gap-4">
                     <div className="p-2 rounded-lg bg-muted text-muted-foreground"><Users size={20} /></div>
                     <span className="font-medium text-foreground">{t('profile.employees', 'Employees')}</span>
                 </div>
                 <ChevronRight size={18} className="text-muted-foreground" />
            </button>

            <button onClick={() => navigate('/account/recharge-history')} className="w-full bg-card p-4 rounded-xl flex items-center justify-between shadow-sm border border-border mb-3 active:scale-[0.98] transition-transform">
                 <div className="flex items-center gap-4">
                     <div className="p-2 rounded-lg bg-muted text-muted-foreground"><CreditCard size={20} /></div>
                     <span className="font-medium text-foreground">{t('profile.rechargeOperations', 'Recharge Operations')}</span>
                 </div>
                 <ChevronRight size={18} className="text-muted-foreground" />
            </button>
        </div>

        {/* Settings Section */}
        <div className="mt-6 mb-2">
            <h3 className="text-lg font-bold mx-2 mb-2">{t('profile.settings', 'Settings')}</h3>
            
            <button onClick={() => navigate('/account/edit-profile')} className="w-full bg-card p-4 rounded-xl flex items-center justify-between shadow-sm border border-border mb-3 active:scale-[0.98] transition-transform">
                 <div className="flex items-center gap-4">
                     <div className="p-2 rounded-lg bg-muted text-muted-foreground"><User size={20} /></div>
                     <span className="font-medium text-foreground">{t('profile.editProfile', 'Edit Profile')}</span>
                 </div>
                 <ChevronRight size={18} className="text-muted-foreground" />
            </button>

            <button onClick={() => navigate('/account/addresses')} className="w-full bg-card p-4 rounded-xl flex items-center justify-between shadow-sm border border-border mb-3 active:scale-[0.98] transition-transform">
                 <div className="flex items-center gap-4">
                     <div className="p-2 rounded-lg bg-muted text-muted-foreground"><MapPin size={20} /></div>
                     <span className="font-medium text-foreground">{t('profile.addresses', 'Addresses')}</span>
                 </div>
                 <ChevronRight size={18} className="text-muted-foreground" />
            </button>

            <button onClick={() => navigate('/account/change-password')} className="w-full bg-card p-4 rounded-xl flex items-center justify-between shadow-sm border border-border mb-3 active:scale-[0.98] transition-transform">
                 <div className="flex items-center gap-4">
                     <div className="p-2 rounded-lg bg-muted text-muted-foreground"><Lock size={20} /></div>
                     <span className="font-medium text-foreground">{t('profile.changePassword', 'Change Password')}</span>
                 </div>
                 <ChevronRight size={18} className="text-muted-foreground" />
            </button>
            
            <div className="w-full bg-card p-4 rounded-xl flex items-center justify-between shadow-sm border border-border mb-3">
                 <div className="flex items-center gap-4">
                     <div className="p-2 rounded-lg bg-muted text-muted-foreground"><Globe size={20} /></div>
                     <span className="font-medium text-foreground">{t('profile.language', 'Language')}</span>
                 </div>
                 <button onClick={() => {
                     const currentLang = i18n.language && i18n.language.startsWith('ar') ? 'ar' : 'en';
                     const newLang = currentLang === 'en' ? 'ar' : 'en';
                     setLanguage(newLang);
                 }} className="font-bold text-sm text-primary" style={{ color: primaryColor }}>
                     {i18n.language && i18n.language.startsWith('ar') ? 'العربية' : 'English'}
                 </button>
            </div>

            <div className="w-full bg-card p-4 rounded-xl flex items-center justify-between shadow-sm border border-border mb-3">
                 <div className="flex items-center gap-4">
                     <div className="p-2 rounded-lg bg-muted text-muted-foreground"><Bell size={20} /></div>
                     <span className="font-medium text-foreground">{t('profile.notifications', 'Notifications')}</span>
                 </div>
                 <Switch checked={notificationsEnabled} onCheckedChange={toggleNotifications} />
            </div>

            <div className="w-full bg-card p-4 rounded-xl flex items-center justify-between shadow-sm border border-border mb-3">
                 <div className="flex items-center gap-4">
                     <div className="p-2 rounded-lg bg-muted text-muted-foreground"><Moon size={20} /></div>
                     <span className="font-medium text-foreground">{t('profile.darkMode', 'Dark Mode')}</span>
                 </div>
                 <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
            </div>
        </div>

        {/* Logout */}
        <button 
           onClick={handleLogout}
           className="w-full bg-red-50 dark:bg-destructive/10 p-4 rounded-xl flex items-center justify-between shadow-sm border border-red-100 dark:border-destructive/20 mt-6 active:scale-[0.98] transition-transform"
        >
           <div className="flex items-center gap-4">
             <div className="p-2 rounded-lg bg-red-100 dark:bg-destructive/20 text-red-600 dark:text-red-400">
               <LogOut size={20} />
             </div>
             <span className="font-medium text-red-600 dark:text-red-400">{t('auth.logout', 'Logout')}</span>
           </div>
        </button>
      </div>
    </div>
  );
}
