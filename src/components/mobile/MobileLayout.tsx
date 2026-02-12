import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingCart, Grid, User, Bell, RefreshCw, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/contexts/CartContext';
import { coreApi } from '@/lib/api';
import { getMobileTenantId } from '@/lib/storefront-utils';
import { CORE_ROOT_URL } from '@/services/core/api-client';
import { walletService } from '@/services/wallet.service';

import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';

interface AppConfig {
  primaryColor?: string;
  logo?: string;
  storeLogo?: string;
  fontFamily?: string;
  appName?: string;
  settings?: {
    enableWallet?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export const MobileLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { cart } = useCart();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { unreadCount } = useNotifications();
  const isRTL = i18n.language === 'ar';
  
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  // Fetch App Builder Config to apply styles
  // Live Preview Sync: Listen for configuration updates from App Builder
  useEffect(() => {
    const handleSync = (event: MessageEvent) => {
      if (event.data?.type === 'APP_BUILDER_CONFIG_SYNC' && event.data?.config) {
        console.log('MobileLayout: Received config sync', event.data.config);
        setAppConfig(event.data.config);
      }
    };

    window.addEventListener('message', handleSync);
    
    // Signal that the preview is ready to receive config
    window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');

    return () => window.removeEventListener('message', handleSync);
  }, []);

  useEffect(() => {
    const loadConfig = async () => {
        try {
            // Use centralized utility to get tenant ID (checks URL params, localStorage, etc)
            let currentTenantId = getMobileTenantId();
            
            // Allow Dev Tenant injection for both nip.io AND direct IP access (192.168...)
            const isLocalNetwork = window.location.hostname.includes('nip.io') || window.location.hostname.startsWith('192.168.');
            
            if (!currentTenantId && isLocalNetwork) {
                 const DEV_TENANT_ID = 'c692ca44-bcea-4963-bb47-73957dd8b929';
                 currentTenantId = DEV_TENANT_ID;
                 // Store it so api-client can use it for subsequent calls (like products)
                 try { localStorage.setItem('storefrontTenantId', DEV_TENANT_ID); } catch (e) { /* ignore */ }
            }

            const configUrl = currentTenantId 
                ? `/app-builder/config?tenantId=${currentTenantId}` 
                : '/app-builder/config';

            console.log("MobileLayout fetching config from:", configUrl);
            const data = await coreApi.get(configUrl);
            
            if (data?.config) {
                setAppConfig(data.config);
                setConfigError(null);
            } else if (data && !data.error) {
                setAppConfig(data);
                setConfigError(null);
            } else {
                 console.warn("MobileLayout: Config data invalid", data);
            }
        } catch (e: unknown) {
            console.error("Failed to load app config", e);
            const errorMessage = e instanceof Error ? e.message : "Unknown Error";
            setConfigError(errorMessage);
        }
    };
    loadConfig();

    if (user && isAuthenticated) {
        walletService.getBalance()
        .then(res => setBalance(Number(res.balance) || 0))
        .catch(() => setBalance(null));
    }
  }, [isAuthenticated, user]);

  const isAuthPage = React.useMemo(() => {
    const path = location.pathname.toLowerCase();
    return path.includes('/login') || 
           path.includes('/signup') || 
           path.includes('/auth') || 
           path.includes('/forgot-password') || 
           path.includes('/reset-password') || 
           path.includes('/invite');
  }, [location.pathname]);
  
  // Define pages that require authentication - practically everything except auth pages
  const isProtectedPage = !isAuthPage;
  
  useEffect(() => {
    // Only redirect if auth is done loading, user is not authenticated, and on a protected page
    if (!authLoading && !isAuthenticated && isProtectedPage) {
        // Prevent infinite loops by checking if we're already on the login page in any variety
        const returnTo = location.pathname + location.search;
        const searchParams = new URLSearchParams();
        searchParams.set('returnTo', returnTo);
        const loginUrl = `/login?${searchParams.toString()}`;
        
        console.log("MobileLayout: Guard triggering redirect to login for protected page:", returnTo);
        navigate(loginUrl, { replace: true });
    }
  }, [isAuthenticated, authLoading, isProtectedPage, navigate, location.pathname, location.search]);

  // Show loading only for protected pages while auth is being checked
  if (isProtectedPage && authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" style={{ borderColor: '#000' }}></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }
  
  // For protected pages, if not authenticated, don't render (redirect is happening)
  if (isProtectedPage && !isAuthenticated) {
    return null;
  }
  
  // Helper function for Profile button click - redirect to login if not authenticated
  const handleProfileClick = () => {
    console.log("handleProfileClick called, isAuthenticated:", isAuthenticated, "authLoading:", authLoading);
    
    if (authLoading) {
      // Still checking auth, don't navigate yet
      console.log("Auth still loading, waiting...");
      return;
    }
    
    if (isAuthenticated) {
      console.log("User authenticated, navigating to /profile");
      navigate('/profile');
    } else {
      console.log("User NOT authenticated, navigating to /login with returnTo");
      // Navigate directly to login with returnTo parameter
      navigate('/login?returnTo=/profile');
    }
  };

  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  const cartItemCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  
  // Design Config Defaults
  const primaryColor = (appConfig?.primaryColor as string) || '#000000'; 
  const logoUrl = (appConfig?.logo as string) || (appConfig?.storeLogo as string);
  const fontFamily = (appConfig?.fontFamily as string) || 'inherit';

  // Header Visibility: Only show main header on Home page
  const isHome = location.pathname === '/' || location.pathname === '/en' || location.pathname === '/ar' || location.pathname === '/home';
  const showHeader = isHome; // Only showing standard header on Home. Inner pages have their own headers.

  const showNav = !isAuthPage; // Show bottom nav everywhere except auth pages
  
  // Cast helper for nested settings
  const configSettings = appConfig?.settings as { enableWallet?: boolean } | undefined;
  
  const enableGlass = (appConfig as any)?.enableGlassEffect;
  
  // Dynamic Styles
  const headerClass = enableGlass
    ? "bg-transparent border-transparent"
    : "bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-gray-100/50 dark:border-gray-700/50";

  const navClass = enableGlass
    ? "bg-transparent border-transparent backdrop-blur-xl"
    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700";

  const iconClass = enableGlass 
    ? "text-white/80" 
    : "text-gray-400";
    
  const activeIconClass = enableGlass
    ? "text-white"
    : "";

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${enableGlass ? 'bg-black text-white' : 'bg-gray-50 dark:bg-gray-900'}`} 
         style={{ fontFamily }}>
      
      {/* CONNECTION ERROR BANNER */}
      {configError && (
        <div className="bg-amber-50 border-b border-amber-200 p-2 flex items-center justify-between animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-amber-900">
                    {t('common.connectionError', 'Connection optimized for local network')}
                </span>
            </div>
            <button 
                onClick={() => window.location.reload()} 
                className="text-[10px] bg-amber-200/50 hover:bg-amber-200 px-2 py-0.5 rounded-full font-bold text-amber-900 transition-colors flex items-center gap-1"
            >
                <RefreshCw size={10} />
                {t('common.refresh', 'Refresh')}
            </button>
        </div>
      )}

      {/* Top Header - Sticky (Only on Home) */}
      {showHeader && !isAuthPage && (
        <header className={`px-5 py-3 flex items-center justify-between sticky top-0 z-50 h-[72px] border-b transition-all ${headerClass}`}>
           {/* Left Side: Store Logo or Welcome */}
           <div className="flex items-center gap-3">
               {logoUrl ? (
                   <img src={logoUrl} alt="Logo" className="h-8 w-auto object-contain" onClick={() => navigate('/')} />
               ) : (
                   <div className="flex flex-col" onClick={() => navigate('/')}>
                       <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-0.5" style={{ color: enableGlass ? 'white' : primaryColor }}>
                           {appConfig?.appName || 'Store'}
                       </span>
                       <span className={`text-xs font-bold leading-none ${enableGlass ? 'text-white/70' : 'text-gray-400'}`}>
                           {isRTL ? 'مرحباً بك' : 'Welcome back'}
                       </span>
                   </div>
               )}
           </div>

           {/* Right Side: Grouped Actions */}
           <div className="flex items-center gap-3">
               {/* Wallet Balance - Pill Style */}
               {(configSettings?.enableWallet !== false && balance !== null) && (
                   <div 
                        onClick={() => navigate('/account/recharge')} 
                        className={`flex items-center gap-2 px-3 py-2 rounded-2xl border active:scale-95 transition-all shadow-sm ${enableGlass ? 'bg-white/10 border-white/10' : 'bg-gray-50 dark:bg-gray-900 border-gray-100/50 dark:border-gray-700/50'}`}
                   >
                       <div className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: enableGlass ? 'white' : primaryColor }}>
                           <span className={`text-[10px] font-bold ${enableGlass ? 'text-black' : 'text-white'}`}>$</span>
                       </div>
                       <span className="text-xs font-black" style={{ color: enableGlass ? 'white' : primaryColor }}>
                           {balance.toFixed(2)}
                       </span>
                   </div>
               )}

               {/* Notifications */}
               <button 
                onClick={() => navigate('/notifications')} 
                className={`p-2.5 rounded-2xl border relative active:scale-95 transition-all ${enableGlass ? 'bg-white/10 border-white/10 text-white' : 'bg-gray-50 dark:bg-gray-900 border-gray-100/50 dark:border-gray-700/50'}`}
               >
                  <Bell className={`w-5 h-5 ${enableGlass ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                  )}
               </button>

               {/* Profile Avatar */}
               <div className="flex items-center" onClick={handleProfileClick}>
                   {user ? (
                       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden border shadow-sm active:scale-95 transition-all ${enableGlass ? 'bg-white/10 border-white/20' : 'bg-primary/5 border-primary/10'}`}>
                           {user.avatar ? (
                               <img 
                                 src={user.avatar.startsWith('http') ? user.avatar : `${CORE_ROOT_URL}${user.avatar.startsWith('/') ? '' : '/'}${user.avatar}`} 
                                 className="w-full h-full object-cover" 
                                 alt="" 
                                 onError={(e) => {
                                     const img = e.target as HTMLImageElement;
                                     img.style.display = 'none';
                                     if (img.parentElement) {
                                         const span = document.createElement('span');
                                         span.className = 'font-black text-sm';
                                         span.style.color = enableGlass ? 'white' : primaryColor;
                                         span.innerText = (user.name || 'U').charAt(0).toUpperCase();
                                         img.parentElement.appendChild(span);
                                     }
                                 }}
                               />
                           ) : (
                               <span className="font-black text-sm" style={{ color: enableGlass ? 'white' : primaryColor }}>
                                   {(user.name || 'U').charAt(0).toUpperCase()}
                               </span>
                           )}
                       </div>
                   ) : (
                       <button 
                         className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm ${enableGlass ? 'bg-white/10 border-white/20' : 'bg-gray-50 dark:bg-gray-700 border-gray-100'}`}
                       >
                           <User size={18} className={enableGlass ? "text-white" : "text-gray-400"} />
                       </button>
                   )}
               </div>
           </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
         {authLoading && !isAuthenticated ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: enableGlass ? 'white' : primaryColor }} />
                <p className="text-sm text-muted-foreground">{t('common.loading', 'Loading...')}</p>
            </div>
         ) : (
            <Outlet context={{ appConfig }} />
         )}
      </main>

      {/* Bottom Navigation - Fixed. Order: Home, Categories, Cart, Profile */}
      {showNav && (
      <nav className={`fixed bottom-0 left-0 right-0 border-t px-6 py-3 flex justify-between items-center z-50 safe-area-bottom transition-all ${navClass}`}>
        
        {/* Home */}
        <button 
          onClick={() => navigate('/')} 
          className="flex flex-col items-center gap-1 min-w-[60px]"
          style={{ color: isActive('/') ? (enableGlass ? 'white' : primaryColor) : undefined }}
        >
           <Home size={24} className={isActive('/') ? (enableGlass ? "text-white drop-shadow-md" : "") : iconClass} />
           <span className={`text-[10px] font-medium ${isActive('/') ? (enableGlass ? "font-bold" : "") : iconClass}`}>{t('common.home', 'Home')}</span>
        </button>

        {/* Categories */}
        <button 
          onClick={() => navigate('/categories')} 
          className="flex flex-col items-center gap-1 min-w-[60px]"
          style={{ color: isActive('/categories') ? (enableGlass ? 'white' : primaryColor) : undefined }}
        >
           <Grid size={24} className={isActive('/categories') ? (enableGlass ? "text-white drop-shadow-md" : "") : iconClass} />
           <span className={`text-[10px] font-medium ${isActive('/categories') ? (enableGlass ? "font-bold" : "") : iconClass}`}>{t('common.categories', 'Categories')}</span>
        </button>
        
        {/* Cart */}
        <button 
          onClick={() => navigate('/cart')} 
          className="flex flex-col items-center gap-1 min-w-[60px] relative"
          style={{ color: isActive('/cart') ? (enableGlass ? 'white' : primaryColor) : undefined }}
        >
           <div className="relative">
             <ShoppingCart size={24} className={isActive('/cart') ? (enableGlass ? "text-white drop-shadow-md" : "") : iconClass} />
             {cartItemCount > 0 && (
               <span className="absolute -top-2 -right-2 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full"
                     style={{ backgroundColor: isActive('/cart') ? (enableGlass ? 'white' : primaryColor) : '#ef4444', color: (enableGlass && isActive('/cart')) ? 'black' : 'white' }}>
                 {cartItemCount}
               </span>
             )}
           </div>
           <span className={`text-[10px] font-medium ${isActive('/cart') ? (enableGlass ? "font-bold" : "") : iconClass}`}>{t('common.cart', 'Cart')}</span>
        </button>

        {/* Profile */}
        <button 
          onClick={handleProfileClick} 
          className="flex flex-col items-center gap-1 min-w-[60px]"
          style={{ color: isActive('/profile') ? (enableGlass ? 'white' : primaryColor) : undefined }}
        >
           <User size={24} className={isActive('/profile') ? (enableGlass ? "text-white drop-shadow-md" : "") : iconClass} />
           <span className={`text-[10px] font-medium ${isActive('/profile') ? (enableGlass ? "font-bold" : "") : iconClass}`}>{t('common.profile', 'Profile')}</span>
        </button>
        
      </nav>
      )}
    </div>
  );
};
