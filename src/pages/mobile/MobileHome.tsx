import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Search, Package, Layout, Wallet, ShoppingBag, 
  Settings2, User, HelpCircle, FileText, ArrowRight,
  ChevronRight, Box, CreditCard, LayoutDashboard, Grid
} from 'lucide-react';
import { coreApi } from '@/lib/api';
import { MobileSectionRenderer } from '@/components/mobile/MobileSectionRenderer';
import { Section } from '@/components/builder/PageBuilder';
import { Input } from '@/components/ui/input';
import { Category, Product, Brand, Page } from '@/services/types';
import { useAuth } from '@/contexts/AuthContext';
import { MobileProductCard } from '@/components/mobile/MobileProductCard';
import { walletService } from '@/services/wallet.service';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { getMobileTenantId } from '@/lib/storefront-utils';
import { formatCurrency } from '@/lib/currency-utils';

const DEFAULT_CONFIG = {
  appName: 'Store',
  primaryColor: '#000000',
  secondaryColor: '#333333',
  cornerRadius: '1rem',
  showSearch: true,
  showBanner: true,
  showCategories: true,
  showFeatured: true,
  bannerText: 'Welcome',
  bannerTextAr: 'مرحباً',
  bannerSubtext: 'Discover our best products',
  bannerSubtextAr: 'اكتشف أفضل منتجاتنا',
};

const DEFAULT_HOME_PREFS = {
  showInventory: true,
  showOrders: true,
  showWallet: true,
  showSupport: true,
  showProfile: true,
  showDigitalKeys: true
};

interface MobileHomeProps {
  products?: Product[];
  categories?: Category[];
  brands?: Brand[];
  pages?: Page[];
  homePage?: Page | null;
  appConfig?: any;
  loading?: boolean;
}

export default function MobileHome({ 
  products: initialProducts, 
  categories: initialCategories,
  brands: initialBrands,
  pages: initialPages,
  homePage: initialHomePage,
  appConfig: initialConfig,
  loading: initialLoading = false
}: MobileHomeProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [config, setConfig] = useState<Record<string, any>>(initialConfig || DEFAULT_CONFIG);
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [loading, setLoading] = useState(initialLoading || !initialProducts);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Home Preferences
  const [homePrefs, setHomePrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('mobileHomePrefs');
      return saved ? JSON.parse(saved) : DEFAULT_HOME_PREFS;
    } catch {
      return DEFAULT_HOME_PREFS;
    }
  });

  // Dynamic Page State
  const [dynamicSections, setDynamicSections] = useState<Section[]>([]);
  const [hasDynamicPage, setHasDynamicPage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('mobileHomePrefs', JSON.stringify(homePrefs));
  }, [homePrefs]);

  // Live Preview Sync: Use context from MobileLayout
  const { appConfig: contextAppConfig } = useOutletContext<{ appConfig: any }>() || {};

  useEffect(() => {
    if (contextAppConfig) {
      console.log('MobileHome: Received config from context', contextAppConfig);
      setConfig(contextAppConfig);
      
      // Update dynamic sections if they were modified
      const builderSections = contextAppConfig.sections || contextAppConfig.homeSections || contextAppConfig.content?.sections;
      if (builderSections && Array.isArray(builderSections)) {
          setDynamicSections(builderSections);
          setHasDynamicPage(builderSections.length > 0);
      }
    }
  }, [contextAppConfig]);

  // Effect to handle props updates or initial load
  useEffect(() => {
    if (initialConfig) {
       setConfig(initialConfig);
       
       // If custom home page is passed (from web store logic), use it
       if (initialHomePage && initialHomePage.content && Array.isArray(initialHomePage.content.sections)) {
          setDynamicSections(initialHomePage.content.sections as Section[]);
          setHasDynamicPage(true);
       } else {
          // Fallback to app builder sections
          const builderSections = (initialConfig as any).sections || (initialConfig as any).homeSections || (initialConfig as any).content?.sections;
          if (builderSections && Array.isArray(builderSections) && builderSections.length > 0) {
             setDynamicSections(builderSections);
             setHasDynamicPage(true);
          } else {
             setHasDynamicPage(false);
          }
       }
    }
    
    if (initialProducts) setProducts(initialProducts);
    if (initialCategories) setCategories(initialCategories);
    
    if (initialLoading !== undefined) setLoading(initialLoading);
    
  }, [initialConfig, initialProducts, initialCategories, initialHomePage, initialLoading]);

  useEffect(() => {
    // Only fetch if no config passed (meaning we are running standalone or in a context that didn't provide data)
    if (initialConfig && initialProducts) return;

    let isMounted = true;
    
    const loadData = async () => {
        try {
            if (isMounted) {
                setLoading(true);
                setError(null);
            }
            
            const currentTenantId = getMobileTenantId();

            // Load Wallet Balance if User is Logged In
            if (user) {
              walletService.getBalance()
                .then(w => isMounted && setWalletBalance(Number(w.balance)))
                .catch(() => {});
            }

            // 1. Fetch Config
            const configPromise = coreApi.get(currentTenantId ? `/app-builder/config?tenantId=${currentTenantId}` : '/app-builder/config').catch(() => null);

            // 2. Fetch Products & Categories
            const productsPromise = coreApi.getProducts({ limit: 8 }).catch(() => []); 
            const categoriesPromise = coreApi.getCategories({ all: true }).catch(() => []);
            
            const [configRes, productsRes, categoriesRes] = await Promise.all([
                configPromise,
                productsPromise,
                categoriesPromise
            ]);

            if (!isMounted) return;

            // Process Config
            let appConfig = DEFAULT_CONFIG;
            if (configRes && Object.keys(configRes).length > 0) {
                  appConfig = configRes.config || configRes || DEFAULT_CONFIG;
            }
            setConfig(appConfig);

            // Process Data
            if (Array.isArray(productsRes)) setProducts(productsRes);
            else if (productsRes?.data) setProducts(productsRes.data);
            
            if (Array.isArray(categoriesRes)) setCategories(categoriesRes);
            else if (categoriesRes?.categories) setCategories(categoriesRes.categories);
            
            // Dynamic Sections Check
            const builderSections = (appConfig as any).sections || (appConfig as any).homeSections || (appConfig as any).content?.sections;
            if (builderSections && Array.isArray(builderSections) && builderSections.length > 0) {
                  setDynamicSections(builderSections);
                  setHasDynamicPage(true);
            } else {
                  setHasDynamicPage(false);
            }

        } catch (e: any) {
            console.error("Failed to load mobile home data", e);
            if (isMounted) setError(e.message || "Failed to connect to server");
        } finally {
            if (isMounted) setLoading(false);
        }
    };
    
    loadData();
    return () => { isMounted = false; };
  }, [user, initialConfig, initialProducts]);

  const primaryColor = config.primaryColor || '#000000';
  const secondaryColor = config.secondaryColor || primaryColor;
  
  // Quick Actions Configuration
  const quickActions = [
    { id: 'showInventory', label: 'sidebar.inventory', defaultLabel: isRTL ? 'المخزون' : 'Inventory', icon: Box, path: '/account/inventory', show: homePrefs.showInventory },
    { id: 'showOrders', label: 'sidebar.orders', defaultLabel: isRTL ? 'طلباتي' : 'My Orders', icon: Package, path: '/account/orders', show: homePrefs.showOrders },
    { id: 'showWallet', label: 'sidebar.payment', defaultLabel: isRTL ? 'المحفظة' : 'Wallet', icon: Wallet, path: '/account/recharge', show: homePrefs.showWallet },
    { id: 'showDigitalKeys', label: 'design.themes.digitalCards', defaultLabel: isRTL ? 'مفاتيح رقمية' : 'Digital Keys', icon: FileText, path: '/account/digital-keys', show: homePrefs.showDigitalKeys },
    { id: 'showProfile', label: 'nav.profile', defaultLabel: isRTL ? 'الملف الشخصي' : 'Profile', icon: User, path: '/account', show: homePrefs.showProfile },
    { id: 'showSupport', label: 'sidebar.support', defaultLabel: isRTL ? 'الدعم' : 'Support', icon: HelpCircle, path: '/support', show: homePrefs.showSupport },
  ].filter(action => action.show);

  if (loading) {
      return (
        <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] bg-background">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" style={{ borderColor: primaryColor }}></div>
            <p className="text-sm text-muted-foreground">Loading App...</p>
        </div>
      );
  }

  if (error) {
      return (
          <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-center bg-background">
              <div className="text-red-500 mb-2">⚠️ Connection Error</div>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <button 
                  onClick={() => window.location.reload()} 
                  className="px-4 py-2 text-white rounded-lg text-sm"
                  style={{ backgroundColor: primaryColor }}
              >
                  Retry
              </button>
          </div>
      );
  }

  const enableGlass = (config as any).enableGlassEffect;

  // Dynamic styles based on glass settings
  const cardStyle = enableGlass 
    ? "bg-white/10 backdrop-blur-md border border-white/20 shadow-lg" 
    : "bg-card border border-border shadow-sm";
    
  const textStyle = enableGlass
    ? "text-white"
    : "text-foreground";

  const mutedTextStyle = enableGlass
    ? "text-white/70"
    : "text-muted-foreground";


  return (
    <div 
        className={`pb-24 min-h-screen font-sans selection:bg-primary/20 ${enableGlass ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white' : 'bg-background'}`}
        style={enableGlass && config.primaryColor ? { backgroundImage: `linear-gradient(135deg, ${config.primaryColor}40, ${config.secondaryColor}40), url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1000&q=80')`, backgroundSize: 'cover', backgroundBlendMode: 'overlay' } : {}}
    >
        
        {/* Custom Header Area */}
        <div className={`px-6 pt-6 pb-2 sticky top-0 z-20 ${enableGlass ? 'bg-transparent' : 'bg-gradient-to-b from-background to-transparent backdrop-blur-sm'}`}>
            <div className="flex justify-between items-start mb-4">
               <div>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${mutedTextStyle}`}>
                    {user ? (isRTL ? `مرحباً, ${user.name?.split(' ')[0]}` : `Hello, ${user.name?.split(' ')[0]}`) : (isRTL ? 'مرحباً بك' : 'Welcome Guest')}
                  </p>
                  <h1 className={`text-2xl font-black tracking-tight ${textStyle}`}>
                    {config.appName}
                  </h1>
               </div>
               
               <div className="flex items-center gap-3">
                   {user && (
                       <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 ${enableGlass ? 'bg-white/10 border border-white/20' : 'bg-card border border-border shadow-sm'}`}>
                           <Wallet size={14} className="text-primary" style={{ color: enableGlass ? 'white' : primaryColor }} />
                           <span className={`text-xs font-bold ${textStyle}`}>
                             {walletBalance !== null ? formatCurrency(walletBalance, config.currency || 'SAR') : formatCurrency(0, config.currency || 'SAR')}
                           </span>
                       </div>
                   )}
                   <button 
                     onClick={() => setIsSettingsOpen(true)}
                     className={`p-2 rounded-full transition-colors ${enableGlass ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' : 'hover:bg-muted bg-card border border-border text-foreground shadow-sm'}`}
                   >
                     <Settings2 size={20} />
                   </button>
               </div>
            </div>

            {/* Configurable Search in Header */}
            {(!hasDynamicPage && config.showSearch) && (
              <div className="relative group">
                  <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 group-focus-within:text-primary transition-colors ${enableGlass ? 'text-white/60' : 'text-muted-foreground'}`} />
                  <Input 
                     readOnly
                     onClick={() => navigate('/products')} 
                     placeholder={isRTL ? 'ابحث عن المنتجات...' : 'Search products...'} 
                     className={`h-12 rounded-2xl ${isRTL ? 'pr-12' : 'pl-12'} text-base transition-shadow focus:shadow-md ${enableGlass ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50' : 'bg-card border-border shadow-sm'}`}
                  />
              </div>
            )}
        </div>

        {/* Dynamic Page Content or Creative Layout */}
        {hasDynamicPage ? (
            <div className="flex flex-col gap-0 pb-10">
                {dynamicSections
                    .filter(section => section.type !== 'footer')
                    .map((section, index) => (
                        <MobileSectionRenderer key={section.id || index} section={section} config={config} />
                    ))
                }
            </div>
        ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Banner */}
                {config.showBanner && (
                  <div className="px-4">
                    <div 
                      className="w-full aspect-[2.2/1] rounded-3xl flex flex-col items-center justify-center text-white p-6 text-center shadow-xl relative overflow-hidden group cursor-pointer"
                      style={{ 
                        background: config.bannerImage ? `url(${config.bannerImage}) center/cover no-repeat` : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                      }}
                      onClick={() => navigate('/products')}
                    >
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                      
                      {/* Decorative Elements */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                      <div className="relative z-10 flex flex-col items-center gap-2">
                          <span className="font-black text-2xl md:text-3xl uppercase tracking-wider drop-shadow-lg">
                            {isRTL ? config.bannerTextAr : config.bannerText}
                          </span>
                          {(isRTL ? config.bannerSubtextAr : config.bannerSubtext) && (
                            <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-sm font-bold border border-white/20">
                              {isRTL ? config.bannerSubtextAr : config.bannerSubtext}
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Categories */}
                {config.showCategories && categories.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4 px-6">
                       <h3 className={`font-black text-lg ${textStyle}`}>{isRTL ? config.categoriesTitleAr : config.categoriesTitle}</h3>
                       <button onClick={() => navigate('/categories')} className="flex items-center gap-1 text-xs font-bold text-primary" style={{ color: enableGlass ? 'white' : primaryColor }}>
                          {isRTL ? 'عرض الكل' : 'See All'}
                          <ChevronRight size={14} className="rtl:rotate-180" />
                       </button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 pb-4">
                       {categories.map((cat: Category) => (
                            <div 
                              key={cat.id} 
                              className="group flex flex-col items-center gap-2 shrink-0 cursor-pointer"
                              onClick={() => navigate(`/categories/${cat.id}`)}
                            >
                               <div className={`w-16 h-16 rounded-[18px] flex items-center justify-center overflow-hidden group-hover:border-primary transition-all group-hover:shadow-md ${cardStyle}`} style={{ borderColor: enableGlass ? 'rgba(255,255,255,0.2)' : 'transparent' }}>
                                  {cat.image ? (
                                     <img src={cat.image} className="w-full h-full object-cover" alt="" />
                                  ) : (
                                     <LayoutDashboard className={`w-6 h-6 ${enableGlass ? 'text-white/70' : 'text-muted-foreground/30'}`} />
                                  )}
                               </div>
                               <span className={`text-[11px] font-bold group-hover:text-primary transition-colors truncate w-16 text-center ${mutedTextStyle}`}>
                                  {cat.nameAr || cat.name}
                                </span>
                            </div>
                       ))}
                    </div>
                  </div>
                )}

                {/* Featured Products - LIMITED TO 4 */}
                {config.showFeatured && products.length > 0 && (
                   <div className="px-4">
                      <div className="flex justify-between items-center mb-5 px-2">
                        <div className="flex items-center gap-2">
                           <div className="w-1 h-6 rounded-full" style={{ backgroundColor: enableGlass ? 'white' : primaryColor }}></div>
                           <h3 className={`font-black text-xl ${textStyle}`}>{isRTL ? config.featuredTitleAr : config.featuredTitle}</h3>
                        </div>
                        <button onClick={() => navigate('/products')} className={`w-8 h-8 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors ${enableGlass ? 'bg-white/20 text-white' : 'bg-muted text-foreground'}`}>
                           <ArrowRight size={16} className="rtl:rotate-180" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {products.slice(0, 4).map((product: Product) => (
                           <MobileProductCard key={product.id} product={product} config={config} />
                        ))}
                      </div>
                      
                      <div className="mt-6">
                        <Button 
                            variant="outline" 
                            className={`w-full h-12 rounded-xl border-dashed border-2 font-bold hover:text-primary hover:border-primary hover:bg-primary/5 transition-all ${enableGlass ? 'bg-transparent border-white/30 text-white hover:text-white hover:bg-white/10' : 'text-muted-foreground'}`}
                            onClick={() => navigate('/products')}
                        >
                            {t('storefront.home.shopNow', 'Browse All Products')}
                        </Button>
                      </div>
                   </div>
                )}
                
                {/* Quick Access - Moved below products as requested */}
                {quickActions.length > 0 && (
                   <div className="px-4 mt-2 mb-8">
                      <div className="flex items-center gap-2 mb-5 px-2">
                           <div className="w-1 h-6 rounded-full" style={{ backgroundColor: enableGlass ? 'white' : primaryColor }}></div>
                           <h3 className={`font-black text-xl ${textStyle}`}>{t('common.quickServices', 'Quick Services')}</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                          {quickActions.map((action, idx) => (
                              <button
                                key={action.id}
                                onClick={() => navigate(action.path)}
                                className={`group relative flex flex-col items-center gap-3 p-4 rounded-3xl transition-all active:scale-95 overflow-hidden ${cardStyle} ${enableGlass ? 'hover:bg-white/20' : 'hover:shadow-md'}`}
                                style={{ animationDelay: `${idx * 50}ms` }}
                              >
                                  <div className={`absolute inset-0 transition-colors ${enableGlass ? 'bg-white/0 group-hover:bg-white/5' : 'bg-primary/0 group-hover:bg-primary/5'}`} style={{ color: enableGlass ? 'white' : primaryColor }}></div>
                                  
                                  <div 
                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${enableGlass ? 'bg-white/10 text-white' : 'text-primary bg-primary/10'}`}
                                    style={enableGlass ? {} : { color: primaryColor, backgroundColor: `${primaryColor}15` }}
                                  >
                                      <action.icon size={26} strokeWidth={1.5} />
                                  </div>
                                  <span className={`text-xs font-bold text-center leading-tight z-10 w-full truncate ${enableGlass ? 'text-white group-hover:text-white' : 'text-muted-foreground group-hover:text-primary transition-colors'}`}>
                                    {t(action.label, action.defaultLabel)}
                                  </span>
                              </button>
                          ))}
                      </div>
                   </div>
                )}
            </div>
        )}

        {/* Customization Sheet */}
        <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <SheetContent side="bottom" className={`rounded-t-[32px] p-0 overflow-hidden ${enableGlass ? 'bg-gray-900 border-white/20 text-white' : 'bg-background'}`}>
              <div className={`p-6 border-b ${enableGlass ? 'border-white/10' : 'border-border'}`}>
                  <SheetHeader>
                      <SheetTitle className={`text-xl font-black ${textStyle}`}>{t('common.settings', 'Home Settings')}</SheetTitle>
                      <SheetDescription className={mutedTextStyle}>Customize what you see on your home screen.</SheetDescription>
                  </SheetHeader>
              </div>
              
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                 <div className="space-y-4">
                     <h4 className={`text-sm font-bold uppercase tracking-wider mb-2 ${mutedTextStyle}`}>Quick Access</h4>
                     <div className="space-y-4">
                         {Object.entries(DEFAULT_HOME_PREFS).map(([key, defaultValue]) => {
                             let translationKey = '';
                             let displayLabel = key.replace('show', '');
                             
                             if (key.includes('Inventory')) translationKey = 'sidebar.inventory';
                             if (key.includes('Orders')) translationKey = 'sidebar.orders';
                             if (key.includes('Wallet')) translationKey = 'sidebar.payment';
                             if (key.includes('Support')) translationKey = 'sidebar.support';
                             if (key.includes('Profile')) translationKey = 'nav.profile';
                             if (key.includes('Digital')) translationKey = 'design.themes.digitalCards';
                             
                             const translatedLabel = translationKey ? t(translationKey, displayLabel) : displayLabel;
                             
                             return (
                                 <div key={key} className={`flex items-center justify-between p-3 rounded-xl ${enableGlass ? 'bg-white/10 border-white/10' : 'bg-card border border-border'}`}>
                                     <div className="flex items-center gap-3">
                                         <div className={`p-2 rounded-lg ${enableGlass ? 'bg-white/5 text-white' : 'bg-muted text-muted-foreground'}`}>
                                             {key.includes('Inventory') && <Box size={18} />}
                                             {key.includes('Orders') && <Package size={18} />}
                                             {key.includes('Wallet') && <Wallet size={18} />}
                                             {key.includes('Support') && <HelpCircle size={18} />}
                                             {key.includes('Profile') && <User size={18} />}
                                             {key.includes('Digital') && <FileText size={18} />}
                                         </div>
                                         <Label htmlFor={key} className={`font-bold ${textStyle}`}>{translatedLabel}</Label>
                                     </div>
                                     <Switch 
                                        id={key}
                                        checked={(homePrefs as any)[key]} 
                                        onCheckedChange={(checked) => setHomePrefs(prev => ({ ...prev, [key]: checked }))}
                                        style={{ '--primary': primaryColor } as any}
                                     />
                                 </div>
                             );
                         })}
                     </div>
                 </div>
              </div>
              
              <div className={`p-6 border-t ${enableGlass ? 'bg-white/5 border-white/10' : 'bg-muted/30 border-border'}`}>
                  <Button className="w-full h-12 rounded-xl text-lg font-bold shadow-lg text-white" onClick={() => setIsSettingsOpen(false)} style={{ backgroundColor: primaryColor }}>
                      {t('common.done', 'Done')}
                  </Button>
              </div>
          </SheetContent>
        </Sheet>
    </div>
  );
}
