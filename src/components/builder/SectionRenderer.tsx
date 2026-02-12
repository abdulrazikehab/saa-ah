import { useEffect, useState, useContext, useCallback } from 'react';
import { Section } from './PageBuilder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { coreApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { Loader2, Moon, Sun, Globe, Menu, X, Wallet, ShoppingCart, DollarSign, Heart, Users, FileText, Search, Package, Store, Plus, Minus, Upload, Calendar, TrendingUp, BarChart3, User, CreditCard, MessageSquare, ArrowRight, RefreshCw, ChevronDown, FolderOpen, Phone, Settings, RotateCcw } from 'lucide-react';
import { 
  SupportTicketsSection, 
  FavoritesPageSection, 
  BalanceOperationsSection, 
  EmployeesPageSection, 
  ChargeWalletSection, 
  ReportsPageSection, 
  ProfilePageSection, 
  BankAccountsSection, 
  CustomerOrdersSection, 
  InventoryPageSection 
} from './MerchantSections';
import {
  CartSection,
  AuthSection,
  CheckoutSection,
  BrandListSection,
  CategoriesHierarchySection,
  StorePageSection
} from './StorefrontSections';
import PermissionsPage from '@/components/storefront/PermissionsPage';
import { staffService, StaffUser } from '@/services/staff.service';
import { ImageSlider } from '@/components/ui/ImageSlider';
import { ContentSlider } from '@/components/ui/ContentSlider';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/core/api-client';
import { Product, Brand, Category } from '@/services/types';
import { isErrorObject } from '@/lib/error-utils';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { GamingProductCard } from '@/components/storefront/GamingProductCard';
import { SafeHTML } from '@/components/common/SafeHTML';

// Safe cart hook that doesn't throw if context is unavailable
const useSafeCart = () => {
  try {
    return useCart();
  } catch {
    // CartProvider not available (e.g., in dashboard page builder)
    return null;
  }
};


interface SectionRendererProps {
  section: Section;
  onToggleTheme?: () => void;
}

// Store Managers List Section Component
interface StoreManagersListProps {
  title?: string;
  component?: string;
}

function StoreManagersListSection({ props }: { props: StoreManagersListProps }) {
  const [storeManagers, setStoreManagers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStoreManagers = async () => {
      try {
        setLoading(true);
        const response = await staffService.getStaffUsers(1, 100);
        const staff = response.data || [];
        // Filter for store managers (role === 'STORE_MANAGER')
        const managers = staff.filter((s: StaffUser & { role?: string }) => s.role === 'STORE_MANAGER');
        setStoreManagers(managers);
      } catch (error) {
        console.error('Failed to load store managers:', error);
        setStoreManagers([]);
      } finally {
        setLoading(false);
      }
    };
    loadStoreManagers();
  }, []);

  if (loading) {
    return (
      <div className="py-16 px-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">جاري تحميل مديري المتجر...</p>
      </div>
    );
  }

  if (storeManagers.length === 0) {
    return (
      <div className="py-16 px-8 text-center">
        <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">لا يوجد مديري متجر متاحين حالياً</p>
      </div>
    );
  }

  return (
    <div className="py-16 px-8">
      {props.title && (
        <h2 className="text-3xl font-bold text-center mb-4 dark:text-white">
          {props.title}
        </h2>
      )}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {storeManagers.map((manager: StaffUser & { phone?: string; name?: string }) => (
          <Card key={manager.id} className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-lg">{manager.name || manager.email}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="outline" className="w-full justify-center">
                مدير متجرك
              </Badge>
              {manager.phone && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${manager.phone}`} className="hover:text-primary">
                    {manager.phone}
                  </a>
                </div>
              )}
              <p className="text-xs text-gray-500">{manager.email}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { Mail, MapPin, Send } from 'lucide-react';

interface SectionProps {
  [key: string]: unknown;
  title?: string;
  subtitle?: string;
  limit?: number;
  categoryId?: string;
  animationType?: string;
  animationDuration?: number;
  backgroundColor?: string;
  textColor?: string;
  companyName?: string;
  logoUrl?: string;
  links?: Array<{ label: string; url: string }>;
  showLanguageToggle?: boolean;
  showThemeToggle?: boolean;
  textAlign?: string;
  contentPosition?: string;
  minHeight?: string;
  titleSize?: number;
  subtitleSize?: number;
  overlayOpacity?: number;
  buttonStyle?: string;
  backgroundImage?: string;
  buttonText?: string;
  items?: unknown[];
  layout?: string;
  columns?: number;
  showImage?: boolean;
  showName?: boolean;
  showDescription?: boolean;
  showRating?: boolean;
  showPrice?: boolean;
  showAddToCart?: boolean;
  showStock?: boolean;
  content?: string;
  imageUrl?: string;
  alt?: string;
  images?: string[];
  autoPlay?: boolean;
  interval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  height?: string;
  direction?: string;
  speed?: number;
  pauseOnHover?: boolean;
  itemWidth?: string;
  itemHeight?: string;
  gap?: string;
  sliderBackgroundColor?: string;
  plans?: unknown[];
  members?: unknown[];
  logos?: string[];
  grayscale?: boolean;
  email?: string;
  phone?: string;
  address?: string;
  methods?: string[];
  productsPerCategory?: number;
  productsLayout?: string;
  productsColumns?: number;
  component?: string;
}

function AboutUsSection({ props }: { props: SectionProps }) {
  const { settings } = useStoreSettings();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const displayTitle = props.title || (isRTL ? 'من نحن' : 'About Us');
  const displaySubtitle = props.subtitle || (isRTL ? 'قصتنا ورؤيتنا' : 'Our Story and Vision');
  const description = props.content || settings?.storeDescription || settings?.descriptionAr || (isRTL ? 'نحن متخصصون في تقديم أفضل الخدمات والمنتجات لعملائنا بجودة عالية وأسعار منافسة.' : 'We specialize in providing the best services and products to our customers with high quality and competitive prices.');

  return (
    <div className="py-20 px-8 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-8 animate-in slide-in-from-left duration-700">
          <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-bold tracking-wide uppercase">
            {isRTL ? 'من نحن' : 'About Us'}
          </div>
          <h2 className="text-4xl md:text-5xl font-black dark:text-white leading-tight">
            {displayTitle}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
            {displaySubtitle}
          </p>
          <div className="prose prose-lg dark:prose-invert">
             <p className="text-gray-500 dark:text-gray-500 whitespace-pre-wrap">{description as string}</p>
          </div>
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-100 dark:border-gray-800">
             <div>
                <div className="text-3xl font-black text-primary mb-1">100%</div>
                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">{isRTL ? 'جودة مضمونة' : 'Quality Guaranteed'}</div>
             </div>
             <div>
                <div className="text-3xl font-black text-primary mb-1">24/7</div>
                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">{isRTL ? 'دعم مستمر' : 'Continuous Support'}</div>
             </div>
          </div>
        </div>
        
        <div className="flex-1 relative animate-in zoom-in duration-1000">
          <div className="absolute -inset-4 bg-primary/20 rounded-[2rem] rotate-3 -z-10 blur-2xl opacity-50" />
          <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800">
             <img 
              src={props.imageUrl || 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop'} 
              alt="About Us" 
              className="w-full h-full object-cover aspect-[4/3]"
             />
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactUsSection({ props }: { props: SectionProps }) {
  const { settings } = useStoreSettings();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  const displayEmail = props.email || settings?.email;
  const displayPhone = props.phone || settings?.phone;
  const displayAddress = props.address || settings?.address;
  const displayTitle = props.title || (isRTL ? 'تواصل معنا' : 'Contact Us');
  const displaySubtitle = props.subtitle || (isRTL ? 'نحن هنا لمساعدتك دائماً' : 'We are always here to help you');

  return (
    <div className="py-20 px-8 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 dark:text-white">{displayTitle}</h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">{displaySubtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 dark:text-white">{isRTL ? 'البريد الإلكتروني' : 'Email'}</h3>
                <p className="text-gray-600 dark:text-gray-400">{displayEmail || 'support@example.com'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 dark:text-white">{isRTL ? 'رقم الهاتف' : 'Phone Number'}</h3>
                <p className="text-gray-600 dark:text-gray-400" dir="ltr">{displayPhone || '+966 50 000 0000'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 dark:text-white">{isRTL ? 'العنوان' : 'Address'}</h3>
                <p className="text-gray-600 dark:text-gray-400">{displayAddress || (isRTL ? 'المملكة العربية السعودية' : 'Saudi Arabia')}</p>
              </div>
            </div>
          </div>

          {/* Contact Form Placeholder */}
          <Card className="p-8 shadow-xl border-none bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700">
             <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-sm font-medium dark:text-gray-200">{isRTL ? 'الاسم' : 'Name'}</label>
                      <Input placeholder={isRTL ? 'اسمك الكريم' : 'Your name'} className="bg-gray-50 dark:bg-gray-900 border-none" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-medium dark:text-gray-200">{isRTL ? 'البريد الإلكتروني' : 'Email'}</label>
                      <Input placeholder="example@mail.com" className="bg-gray-50 dark:bg-gray-900 border-none" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-medium dark:text-gray-200">{isRTL ? 'الموضوع' : 'Subject'}</label>
                   <Input placeholder={isRTL ? 'كيف يمكننا مساعدتك؟' : 'How can we help?'} className="bg-gray-50 dark:bg-gray-900 border-none" />
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-medium dark:text-gray-200">{isRTL ? 'الرسالة' : 'Message'}</label>
                   <textarea 
                    className="w-full min-h-[120px] p-3 rounded-md bg-gray-50 dark:bg-gray-900 border-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    placeholder={isRTL ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                   />
                </div>
                <Button className="w-full h-12 gap-2 text-lg">
                   {isRTL ? 'إرسال الرسالة' : 'Send Message'}
                   <Send className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                </Button>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}




function ProductsSection({ props }: { props: SectionProps }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(props.categoryId || 'all');
  const [selectedBrandId, setSelectedBrandId] = useState('all');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await coreApi.getProducts({ 
        limit: props.limit || 8,
        search: searchQuery || undefined,
        categoryId: selectedCategoryId !== 'all' ? selectedCategoryId : undefined,
        brandId: selectedBrandId !== 'all' ? selectedBrandId : undefined,
      });
      
      let items: Product[] = [];
      if (Array.isArray(response)) {
        items = response;
      } else if (response && typeof response === 'object' && 'data' in response) {
        // Paginated format { data: Product[], meta: ... }
        items = (response as { data: Product[] }).data;
      } else if (response && typeof response === 'object' && 'products' in response) {
        items = (response as { products: Product[] }).products;
      }
      
      const validItems = items.filter((p: unknown): p is Product => 
        p !== null && typeof p === 'object' && 'id' in p && !isErrorObject(p)
      );
      
      setProducts(validItems);
    } catch (error) {
      console.error('Failed to fetch products for section:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [props.limit, searchQuery, selectedCategoryId, selectedBrandId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [catsRes, brandsRes] = await Promise.all([
          coreApi.getCategories({ limit: 100 }),
          coreApi.getBrands({ limit: 100 })
        ]);
        
        const cats = Array.isArray(catsRes) ? catsRes : ((catsRes as { categories: Category[] }).categories || []);
        setCategories(cats);
        
        const brs = Array.isArray(brandsRes) ? brandsRes : ((brandsRes as { data: Brand[] }).data || []);
        setBrands(brs);
      } catch (err) {
        console.error("Failed to load filters", err);
      }
    };
    loadFilters();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="py-24 px-8 bg-[#0a0a0f] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col gap-10 mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                {props.title || (isRTL ? "جميع المنتجات" : "All Products")}
              </h2>
              <div className="h-1.5 w-24 bg-primary rounded-full" />
            </div>

            <div className="flex flex-wrap items-center gap-4">
               {/* Search Input */}
               <form onSubmit={handleSearch} className="relative group min-w-[300px]">
                  <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 transition-colors group-focus-within:text-primary", isRTL ? "left-4" : "right-4")} />
                  <Input 
                    placeholder={isRTL ? "ابحث عن منتج..." : "Search product..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                        "h-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:border-primary/50 transition-all",
                        isRTL ? "pl-12" : "pr-12"
                    )}
                  />
               </form>

               <Button 
                variant="outline" 
                size="icon" 
                onClick={fetchProducts}
                className="h-12 w-12 rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white hover:text-black transition-colors"
                disabled={loading}
               >
                  <RotateCcw className={cn("w-5 h-5", loading && "animate-spin")} />
               </Button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col gap-6">
            {/* Categories */}
            <div className="flex flex-wrap items-center gap-4">
                <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">{isRTL ? "التصنيفات:" : "Categories:"}</span>
                <div className="flex flex-wrap bg-white/5 backdrop-blur-md rounded-2xl p-1.5 border border-white/10 gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedCategoryId('all')}
                        className={cn(
                            "h-10 px-6 rounded-xl text-[11px] font-black transition-all",
                            selectedCategoryId === 'all' ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        {isRTL ? "الكل" : "All"}
                    </Button>
                    {(categories || []).slice(0, 10).map((cat) => (
                        <Button 
                            key={cat.id} 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className={cn(
                                "h-10 px-6 rounded-xl text-[11px] font-black transition-all",
                                selectedCategoryId === cat.id ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {isRTL ? (cat.nameAr || cat.name) : cat.name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Brands */}
            {(brands || []).length > 0 && (
                <div className="flex flex-wrap items-center gap-4">
                    <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">{isRTL ? "الماركات:" : "Brands:"}</span>
                    <div className="flex flex-wrap bg-white/5 backdrop-blur-md rounded-2xl p-1.5 border border-white/10 gap-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedBrandId('all')}
                            className={cn(
                                "h-10 px-6 rounded-xl text-[11px] font-black transition-all",
                                selectedBrandId === 'all' ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {isRTL ? "الكل" : "All"}
                        </Button>
                        {(brands || []).slice(0, 10).map((brand) => (
                            <Button 
                                key={brand.id} 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setSelectedBrandId(brand.id)}
                                className={cn(
                                    "h-10 px-6 rounded-xl text-[11px] font-black transition-all",
                                    selectedBrandId === brand.id ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {isRTL ? (brand.nameAr || brand.name) : brand.name}
                            </Button>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 bg-white/5 rounded-3xl border border-white/10">
            <Package className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <p className="text-white/60">{isRTL ? "لا توجد منتجات متاحة حالياً" : "No products available at the moment"}</p>
          </div>
        ) : (
          <div className={cn(
            "grid gap-8",
            props.layout === 'list' ? 'grid-cols-1' : 
            `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${props.columns || 4}`
          )}>
            {products.map((product, index) => (
              <GamingProductCard 
                key={product.id || index} 
                product={product} 
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function SectionRenderer({ section, onToggleTheme }: SectionRendererProps) {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language || 'ar';
  const isRTL = currentLanguage === 'ar';
  const { type, props: rawProps } = section;
  const props = rawProps as SectionProps;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [heroSearchQuery, setHeroSearchQuery] = useState('');
  const navigate = useNavigate();
  
  const handleNavigate = (url?: string) => {
    if (!url) return;
    if (url.startsWith('http')) {
      window.location.href = url;
    } else {
      navigate(url);
    }
  };
  
  // Cart is only available on storefront, not in dashboard page builder - use safe hook
  const cartContext = useSafeCart();
  const addToCart = cartContext?.addToCart || null;

  useEffect(() => {
    if (type === 'products') {
      const fetchProducts = async () => {
        setLoading(true);
        try {
          const response = await coreApi.getProducts({ 
            limit: props.limit || 8,
            ...(props.categoryId && props.categoryId !== 'all' ? { categoryId: props.categoryId } : {})
          });
          // Validate response is not an error object
          if (response && typeof response === 'object') {
            if (Array.isArray(response)) {
              const validProducts = response.filter((p: unknown): p is Product => 
                p !== null && typeof p === 'object' && 'id' in p && !('error' in p) && !('statusCode' in p)
              );
              setProducts(validProducts);
            } else if ('products' in response && Array.isArray((response as { products: unknown[] }).products)) {
              const productsArray = (response as { products: unknown[] }).products;
              const validProducts = productsArray.filter((p: unknown): p is Product => 
                p !== null && typeof p === 'object' && 'id' in p && !('error' in p) && !('statusCode' in p)
              );
              setProducts(validProducts);
            } else if ('data' in response && Array.isArray((response as { data: unknown[] }).data)) {
              // Paginated format { data: Product[], meta: ... }
              const productsArray = (response as { data: unknown[] }).data;
              const validProducts = productsArray.filter((p: unknown): p is Product => 
                p !== null && typeof p === 'object' && 'id' in p && !isErrorObject(p)
              );
              setProducts(validProducts);
            } else if (!isErrorObject(response) && 'id' in (response as Record<string, unknown>)) {
              // Single product
              setProducts([response as unknown as Product]);
            } else {
              setProducts([]);
            }
          } else {
            setProducts([]);
          }
        } catch (error) {
          console.error('Failed to fetch products for section:', error);
          setProducts([]);
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
    }
  }, [type, props.limit, props.categoryId]);

  const animationStyle = {
    animationName: props.animationType !== 'none' ? props.animationType : undefined,
    animationDuration: props.animationDuration ? `${props.animationDuration}s` : undefined,
    animationFillMode: 'both',
  };

  const content = (() => {
    switch (type) {
      case 'header':
        return (
          <header 
            className="py-4 px-6 shadow-sm relative z-50"
            style={{
              backgroundColor: props.backgroundColor || '#ffffff',
              color: props.textColor || '#000000',
            }}
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-2">
                {props.logoUrl ? (
                  <img src={props.logoUrl} alt={props.companyName} className="h-10 w-auto object-contain" />
                ) : (
                  <span className="text-xl font-bold">{props.companyName}</span>
                )}
              </div>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-6">
                {(props.links || []).map((link: { label: string; url: string }, index: number) => (
                  <a 
                    key={index} 
                    href={link.url} 
                    className="hover:opacity-70 transition-opacity font-medium"
                    style={{ color: props.textColor }}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              {/* Actions */}
              <div className="hidden md:flex items-center gap-4">
                {props.showLanguageToggle && (
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Globe className="w-5 h-5" />
                  </Button>
                )}
                {props.showThemeToggle && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full"
                    onClick={onToggleTheme}
                  >
                    <Sun className="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </Button>
                )}
                {props.showLogin !== false && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-full gap-2"
                      onClick={() => navigate('/login')}
                    >
                      <User className="w-5 h-5" />
                      <span className="hidden lg:inline">{isRTL ? 'تسجيل الدخول' : 'Sign In'}</span>
                    </Button>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button 
                className="md:hidden p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Mobile Nav */}
            {isMobileMenuOpen && (
              <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-t p-4 shadow-lg">
                <nav className="flex flex-col gap-4">
                  {(props.links || []).map((link: { label: string; url: string }, index: number) => (
                    <a 
                      key={index} 
                      href={link.url} 
                      className="block py-2 font-medium"
                      style={{ color: props.textColor }}
                    >
                      {link.label}
                    </a>
                  ))}
                  <div className="flex items-center gap-4 pt-4 border-t mt-2">
                    {props.showLanguageToggle && (
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Globe className="w-4 h-4" /> Language
                      </Button>
                    )}
                    {props.showLogin !== false && (
                       <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => navigate('/login')}
                        >
                          <User className="w-4 h-4" /> {isRTL ? 'تسجيل الدخول' : 'Sign In'}
                        </Button>
                    )}
                    {props.showThemeToggle && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2"
                        onClick={onToggleTheme}
                      >
                        <Moon className="w-4 h-4" /> Theme
                      </Button>
                    )}
                    {props.showLogin !== false && (
                       <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => navigate('/login')}
                        >
                          <User className="w-4 h-4" /> {isRTL ? 'تسجيل الدخول' : 'Sign In'}
                        </Button>
                    )}
                  </div>
                </nav>
              </div>
            )}
          </header>
        );

      case 'hero': {
        const heroTextAlign = props.textAlign || 'center';
        const heroContentPosition = props.contentPosition || 'center';
        const heroMinHeight = props.minHeight || '500px';
        const heroTitleSize = props.titleSize || 48;
        const heroSubtitleSize = props.subtitleSize || 20;
        const heroOverlayOpacity = props.overlayOpacity || 0.4;
        
        const displayName = (isRTL && props.nameAr) ? props.nameAr : (props.name || props.title);
        const displayDescription = (isRTL && props.descriptionAr) ? props.descriptionAr : (props.description || props.subtitle);
        
        const alignClasses = {
          left: 'text-left items-start',
          center: 'text-center items-center',
          right: 'text-right items-end'
        };

        return (
          <div
            className={cn(
                "relative flex items-center justify-center p-8 md:p-24 overflow-hidden",
                props.className
            )}
            style={{
              minHeight: heroMinHeight,
              // Force theme primary color if background is default blue or undefined, otherwise use prop
              backgroundColor: (!props.backgroundColor || props.backgroundColor === '#2563eb') ? 'var(--theme-primary, #2563eb)' : props.backgroundColor,
              color: props.textColor || '#fff',
              backgroundImage: props.backgroundImage ? `url(${props.backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              ...animationStyle,
            }}
          >
            {/* Dark Overlay */}
            <div 
              className="absolute inset-0 bg-[#000] transition-opacity duration-300 pointer-events-none"
              style={{ opacity: heroOverlayOpacity }}
            />
            
            {/* Animated Glows */}
            <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />
            
            <div className={cn("relative z-10 max-w-6xl w-full flex flex-col gap-8", alignClasses[heroTextAlign as keyof typeof alignClasses])}>
                <div className="space-y-4">
                    {displayName && (
                        <h1 
                            className="font-black leading-tight tracking-tight drop-shadow-2xl"
                            style={{ fontSize: `${heroTitleSize}px` }}
                        >
                            {displayName as string}
                        </h1>
                    )}
                    {displayDescription && (
                        <p 
                            className="max-w-2xl opacity-70 leading-relaxed font-medium"
                            style={{ fontSize: `${heroSubtitleSize}px` }}
                        >
                            {displayDescription as string}
                        </p>
                    )}
                </div>

                {props.showSearch !== false && (
                    <div className="w-full max-w-xl group relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative flex items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2 px-4 shadow-2xl">
                            <Search className="w-5 h-5 text-white/40" />
                            <Input 
                                className="bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-white/20 h-10 text-sm" 
                                placeholder={isRTL ? "ابحث عن منتجك المفضل..." : "Search for your favorite product..."}
                                value={heroSearchQuery}
                                onChange={(e) => setHeroSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleNavigate(`/products?search=${encodeURIComponent(heroSearchQuery)}`);
                                    }
                                }}
                            />
                            <Button 
                                size="sm" 
                                className="bg-primary hover:bg-primary/90 text-white h-10 px-6 rounded-xl font-bold"
                                onClick={() => handleNavigate(`/products?search=${encodeURIComponent(heroSearchQuery)}`)}
                            >
                                {isRTL ? 'بحث' : 'Search'}
                            </Button>
                        </div>
                    </div>
                )}

                {props.buttonText && (
                    <Button 
                        size="lg"
                        className="h-14 px-10 rounded-2xl bg-white text-black hover:bg-gray-100 font-black shadow-2xl transition-all active:scale-95 flex items-center gap-3"
                        onClick={() => handleNavigate((props.buttonUrl as string) || (props.url as string) || '/products')}
                    >
                        {props.buttonText}
                        <ArrowRight className={cn("w-5 h-5", isRTL && "rotate-180")} />
                    </Button>
                )}
            </div>
          </div>
        );
      }

      case 'features':
        return (
          <div className="py-24 px-8 bg-white dark:bg-[#0a0a0a]" style={{ backgroundColor: props.backgroundColor, color: props.textColor }}>
            {props.title && (
              <h2 className="text-4xl font-black text-center mb-16">
                {props.title}
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-7xl mx-auto">
              {(props.items || []).map((item: { icon?: string; title?: string; description?: string }, index: number) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center text-center p-8 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-primary/20 hover:bg-primary/5 transition-all duration-300 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                    {item.icon && <span className="text-3xl">{item.icon}</span>}
                  </div>
                  {item.title && <h3 className="text-xl font-bold mb-3">{item.title}</h3>}
                  {item.description && <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{item.description}</p>}
                </div>
              ))}
            </div>
          </div>
        );

      case 'products':
        return <ProductsSection props={props} />;

      case 'cta':
        return (
          <div
            className="py-20 px-8 text-center"
            style={{
              backgroundColor: props.backgroundColor || '#6366f1',
              color: props.textColor || '#fff',
            }}
          >
            <div className="max-w-3xl mx-auto">
              {props.title && <h2 className="text-4xl font-bold mb-4">{String(props.title)}</h2>}
              {props.description && <p className="text-xl mb-8">{String(props.description)}</p>}
              {props.buttonText && (
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => handleNavigate((props.buttonUrl as string) || (props.url as string))}
                >
                  {String(props.buttonText)}
                </Button>
              )}
            </div>
          </div>
        );

      case 'text':
        // Don't render placeholder text sections
        if (props.content && (
          (props.content as string).includes('سيظهر هنا') ||
          (props.content as string).includes('will appear here')
        )) {
          return null;
        }
        return (
          <div className="py-12 px-8">
            <div className="max-w-4xl mx-auto prose prose-lg dark:prose-invert">
              {props.title && <h2 className="text-2xl font-bold mb-4">{props.title}</h2>}
              {props.content && (
                /* SECURITY FIX: Using SafeHTML to prevent XSS */
                <SafeHTML 
                  html={props.content as string}
                  className="prose prose-lg dark:prose-invert max-w-none"
                />
              )}
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="py-8">
            {props.imageUrl && (
              <img src={props.imageUrl} alt={props.alt || ''} className="w-full h-auto" />
            )}
          </div>
        );

      case 'footer':
        return (
          <footer className="bg-gray-900 text-white py-12 px-8">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                {props.companyName && <h3 className="font-bold text-lg mb-4">{props.companyName}</h3>}
              </div>
              <div>
                <h4 className="font-semibold mb-4">Links</h4>
                <ul className="space-y-2">
                  {(props.links || []).map((link: { label: string; url: string }, index: number) => (
                    <li key={index}>
                      <a href={link.url} className="hover:underline">{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Follow Us</h4>
              </div>
            </div>
          </footer>
        );

      case 'gallery':
        return (
          <div className="py-16 px-8">
            {props.title && <h2 className="text-3xl font-bold text-center mb-12">{props.title}</h2>}
            <div className={`grid gap-4 max-w-6xl mx-auto`} style={{ gridTemplateColumns: `repeat(${props.columns || 3}, 1fr)` }}>
              {(props.images || []).map((url: string, index: number) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                  <img src={url} alt={`Gallery item ${index + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          </div>
        );

      case 'slider':
        return (
          <div className="py-8 px-4">
            {props.title && <h2 className="text-3xl font-bold text-center mb-8">{props.title}</h2>}
            <div className="max-w-6xl mx-auto">
              <ImageSlider
                images={(props.images || []) as string[]}
                autoPlay={props.autoPlay !== false}
                interval={props.interval || 5000}
                showDots={props.showDots !== false}
                showArrows={props.showArrows !== false}
                height={props.height || '500px'}
                animationType={(props.animationType as 'slide' | 'fade' | 'zoom') || 'slide'}
              />
            </div>
            {props.description && (
              <p className="text-center text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto">
                {String(props.description)}
              </p>
            )}
          </div>
        );

      case 'content-slider':
        return (
          <div className="py-12 px-4" style={{ backgroundColor: props.backgroundColor || 'transparent' }}>
            {props.title && <h2 className="text-3xl font-bold text-center mb-8">{props.title}</h2>}
            <ContentSlider
              items={(props.items || []) as Array<{ id: string; content: React.ReactNode; icon?: string; title?: string; description?: string }>}
              direction={(props.direction as 'horizontal' | 'vertical') || 'horizontal'}
              speed={props.speed || 20}
              pauseOnHover={props.pauseOnHover !== false}
              itemWidth={props.itemWidth || '300px'}
              itemHeight={props.itemHeight || 'auto'}
              gap={props.gap || '2rem'}
              backgroundColor={(props.sliderBackgroundColor as string) || 'transparent'}
              textColor={(props.textColor as string) || 'inherit'}
            />
          </div>
        );

      case 'testimonials':
        return (
          <div className="py-16 px-8 bg-gray-50 dark:bg-gray-900">
            {props.title && <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">{props.title}</h2>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {(props.items || []).map((item: { rating?: number; text?: string; name?: string; role?: string; image?: string }, index: number) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-lg ${i < (item.rating || 5) ? 'text-yellow-400' : 'text-gray-300'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  {item.text && <p className="text-gray-600 dark:text-gray-300 mb-4 italic">"{item.text}"</p>}
                  <div className="flex items-center gap-3">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-full object-cover" />
                    )}
                    <div>
                      {item.name && <p className="font-semibold dark:text-white">{item.name}</p>}
                      {item.role && <p className="text-sm text-gray-500 dark:text-gray-400">{item.role}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="py-16 px-8">
            {props.title && <h2 className="text-3xl font-bold text-center mb-4 dark:text-white">{props.title}</h2>}
            {props.subtitle && <p className="text-center text-gray-600 dark:text-gray-400 mb-12">{props.subtitle}</p>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {(props.plans || []).map((plan: { name?: string; price?: string; currency?: string; period?: string; features?: string[]; highlighted?: boolean }, index: number) => (
                <div 
                  key={index} 
                  className={`bg-white dark:bg-gray-800 rounded-lg p-8 shadow-md ${plan.highlighted ? 'ring-2 ring-blue-500 scale-105' : ''}`}
                >
                  {plan.name && <h3 className="text-2xl font-bold mb-4 dark:text-white">{plan.name}</h3>}
                  <div className="mb-6">
                    <span className="text-4xl font-bold dark:text-white">{plan.price}</span>
                    {plan.currency && <span className="text-gray-600 dark:text-gray-400 ml-2">{plan.currency}</span>}
                    {plan.period && <span className="text-gray-600 dark:text-gray-400">/{plan.period}</span>}
                  </div>
                  {plan.features && (
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature: string, fIndex: number) => (
                        <li key={fIndex} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <span className="text-green-500">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button className="w-full" variant={plan.highlighted ? 'default' : 'outline'}>
                    Choose Plan
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="py-16 px-8">
            {props.title && <h2 className="text-3xl font-bold text-center mb-4 dark:text-white">{props.title}</h2>}
            {props.subtitle && <p className="text-center text-gray-600 dark:text-gray-400 mb-12">{props.subtitle}</p>}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {(props.members || []).map((member: { image?: string; name?: string; role?: string; bio?: string }, index: number) => (
                <div key={index} className="text-center">
                  {member.image && (
                    <img src={member.image} alt={member.name} className="w-32 h-32 rounded-full mx-auto mb-4 object-cover" />
                  )}
                  {member.name && <h3 className="text-xl font-semibold mb-1 dark:text-white">{member.name}</h3>}
                  {member.role && <p className="text-gray-600 dark:text-gray-400 mb-2">{member.role}</p>}
                  {member.bio && <p className="text-sm text-gray-500 dark:text-gray-500">{member.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        );

      case 'stats':
        return (
          <div className="py-16 px-8 bg-gray-900 text-white">
            {props.title && <h2 className="text-3xl font-bold text-center mb-12">{props.title}</h2>}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {(props.items || []).map((item: { number?: string; suffix?: string; label?: string }, index: number) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold mb-2">
                    {item.number}{item.suffix}
                  </div>
                  {item.label && <p className="text-gray-300">{item.label}</p>}
                </div>
              ))}
            </div>
          </div>
        );

      case 'merchant-dashboard':
        return <MerchantDashboardSection props={props} />;

      case 'product-list':
        return <ProductListSection props={props} />;

      case 'store-page':
        return <StorePageSection props={props} />;

      case 'permissions-page':
        return <PermissionsPage props={props as Record<string, unknown>} />;

      case 'cart-section':
      case 'cart':
        return <CartSection props={props} />;

      case 'auth-section':
      case 'auth-page':
      case 'login':
      case 'signup':
      case 'register':
        return <AuthSection props={props} />;

      case 'checkout-section':
      case 'checkout':
        return <CheckoutSection props={props} />;

      case 'categories-hierarchy':
        return <CategoriesHierarchySection props={props} />;

      case 'brands':
        return <BrandListSection props={props} />;

      case 'wallet-section':
      case 'balance-operations':
      case 'transactions-section':
        return <BalanceOperationsSection props={props} />;

      case 'inventory-section':
      case 'inventory-page':
        return <InventoryPageSection props={props} />;

      case 'recharge-section':
      case 'charge-wallet':
        return <ChargeWalletSection props={props} />;

      case 'employees-section':
      case 'employees-page':
        return <EmployeesPageSection props={props} />;

      case 'reports-section':
      case 'reports-page':
        return <ReportsPageSection props={props} />;

      case 'support-section':
      case 'support-tickets':
        return <SupportTicketsSection props={props} />;

      case 'profile-section':
      case 'profile-page':
        return <ProfilePageSection props={props} />;

      case 'orders-section':
      case 'customer-orders':
        return <CustomerOrdersSection props={props} />;

      case 'wishlist-section':
      case 'favorites-page':
        return <FavoritesPageSection props={props} />;

      case 'bank-accounts-section':
      case 'bank-accounts':
        return <BankAccountsSection props={props} />;

      case 'addresses-section':
        return (
          <div className="py-12 px-6 text-center">
            <h2 className="text-2xl font-bold mb-4">{props.title || 'العناوين'}</h2>
            <p className="text-gray-500">مكون إدارة العناوين سيظهر هنا.</p>
          </div>
        );

      case 'notifications-section':
        return (
          <div className="py-12 px-6 text-center">
            <h2 className="text-2xl font-bold mb-4">{props.title || 'الإشعارات'}</h2>
            <p className="text-gray-500">مكون الإشعارات سيظهر هنا.</p>
          </div>
        );

      case 'payment-methods-section':
        return (
          <div className="py-12 px-6 text-center">
            <h2 className="text-2xl font-bold mb-4">{props.title || 'طرق الدفع'}</h2>
            <p className="text-gray-500">مكون طرق الدفع سيظهر هنا.</p>
          </div>
        );

      case 'settings-section':
        return (
          <div className="py-12 px-6 text-center">
            <h2 className="text-2xl font-bold mb-4">{props.title || 'الإعدادات'}</h2>
            <p className="text-gray-500">مكون الإعدادات سيظهر هنا.</p>
          </div>
        );


      case 'about-us':
      case 'about':
      case 'about-section':
        return <AboutUsSection props={props} />;

      case 'contact-us':
      case 'contact':
      case 'contact-section':
        return <ContactUsSection props={props} />;

      case 'store-managers':
      case 'custom':
        // Handle custom component StoreManagersList
        if (props.component === 'StoreManagersList' || type === 'store-managers') {
          return <StoreManagersListSection props={props} />;
        }
        // Fall through for other custom components
        return null;

      case 'faq':
      case 'faq-section':
        return (
          <div className="py-16 px-8">
            {props.title && <h2 className="text-3xl font-bold text-center mb-4 dark:text-white">{props.title}</h2>}
            {props.subtitle && <p className="text-center text-gray-600 dark:text-gray-400 mb-12">{props.subtitle}</p>}
            <div className="max-w-3xl mx-auto space-y-4">
              {(props.items || []).map((item: { question?: string; answer?: string }, index: number) => (
                <details key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                  <summary className="font-semibold cursor-pointer dark:text-white">{item.question}</summary>
                  <p className="mt-4 text-gray-600 dark:text-gray-300">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        );

      case 'newsletter':
        return (
          <div 
            className="py-16 px-8 text-center"
            style={{
              backgroundColor: props.backgroundColor || '#6366f1',
              color: props.textColor || '#fff',
            }}
          >
            <div className="max-w-2xl mx-auto">
              {props.title && <h2 className="text-3xl font-bold mb-4">{props.title}</h2>}
              {props.subtitle && <p className="text-lg mb-8">{props.subtitle}</p>}
              <div className="flex gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder={String(props.placeholder || 'Enter your email')}
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900"
                />
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => {
                    toast({
                      title: "Success",
                      description: "You have successfully subscribed to our newsletter!",
                    });
                  }}
                >
                  {String(props.buttonText || 'Subscribe')}
                </Button>
              </div>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="py-16 px-8">
            {props.title && <h2 className="text-3xl font-bold text-center mb-8 dark:text-white">{props.title}</h2>}
            <div className="max-w-4xl mx-auto">
              {props.videoUrl ? (
                <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <video
                    src={String(props.videoUrl)}
                    controls={props.controls !== false}
                    autoPlay={props.autoPlay === true}
                    loop={props.loop === true}
                    poster={props.thumbnail ? String(props.thumbnail) : undefined}
                    className="w-full h-full"
                    onPlay={(e) => {
                      // Handle play promise to avoid AbortError
                      const video = e.currentTarget;
                      const playPromise = video.play();
                      if (playPromise !== undefined) {
                        playPromise.catch(() => {
                          // Ignore play() interruptions - this is normal when pause() is called quickly
                        });
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">No video URL provided</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'countdown':
        return (
          <div className="py-16 px-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center">
            {props.title && <h2 className="text-4xl font-bold mb-4">{props.title}</h2>}
            {props.subtitle && <p className="text-xl mb-8">{props.subtitle}</p>}
            <div className="flex justify-center gap-4 max-w-2xl mx-auto">
              {props.showDays && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[100px]">
                  <div className="text-4xl font-bold">00</div>
                  <div className="text-sm">Days</div>
                </div>
              )}
              {props.showHours && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[100px]">
                  <div className="text-4xl font-bold">00</div>
                  <div className="text-sm">Hours</div>
                </div>
              )}
              {props.showMinutes && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[100px]">
                  <div className="text-4xl font-bold">00</div>
                  <div className="text-sm">Minutes</div>
                </div>
              )}
              {props.showSeconds && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 min-w-[100px]">
                  <div className="text-4xl font-bold">00</div>
                  <div className="text-sm">Seconds</div>
                </div>
              )}
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="py-12 px-8 bg-gray-50 dark:bg-gray-900">
            {props.title && <h2 className="text-2xl font-bold text-center mb-8 dark:text-white">{props.title}</h2>}
            <div className="flex flex-wrap justify-center items-center gap-6 max-w-4xl mx-auto">
              {(props.methods || ['Visa', 'Mastercard', 'PayPal', 'Apple Pay']).map((method: string, index: number) => (
                <div 
                  key={index} 
                  className="bg-white dark:bg-gray-800 rounded-lg px-6 py-3 shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <span className="font-medium text-gray-700 dark:text-gray-300">{method}</span>
                </div>
              ))}
            </div>
          </div>
        );


      default:
        console.warn(`Unknown section type: ${type}`);
        return null; // Silently skip unknown section types
    }
  })();

  return (
    <div style={animationStyle as React.CSSProperties}>
      <style>
        {`
          @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes slide-down { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes slide-left { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          @keyframes slide-right { from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          @keyframes zoom { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          @keyframes bounce { 
            0%, 20%, 50%, 80%, 100% {transform: translateY(0);} 
            40% {transform: translateY(-20px);} 
            60% {transform: translateY(-10px);} 
          }
        `}
      </style>
      {content}
    </div>
  );
}

// Merchant Dashboard Section Component
interface MerchantDashboardProps {
  title?: string;
  subtitle?: string;
  titleEn?: string;
  titleAr?: string;
  subtitleEn?: string;
  subtitleAr?: string;
}

interface DashboardData {
  walletBalance?: number;
  currency?: string;
  todayOrdersCount?: number;
  todayProfit?: number;
  pendingOrdersCount?: number;
  totalOrderValue?: number;
  revenueTotal?: number;
  ordersCount?: number;
}

interface Order {
  id: string;
  orderNumber?: string;
  createdAt: string;
  status?: string;
}

interface Recharge {
  id: string;
  referenceId?: string;
  createdAt?: string;
  date?: string;
  description?: string;
  type?: string;
  amount?: number;
  value?: number;
  status?: string;
}

function MerchantDashboardSection({ props }: { props: MerchantDashboardProps }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const title = isRTL 
    ? (props.titleAr as string) || (props.title as string) || 'لوحة التحكم'
    : (props.titleEn as string) || (props.title as string) || 'Dashboard';
  
  const subtitle = isRTL
    ? (props.subtitleAr as string) || (props.subtitle as string) || 'نظرة عامة على أداء متجرك'
    : (props.subtitleEn as string) || (props.subtitle as string) || 'Overview of your store performance';

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingRecharges, setPendingRecharges] = useState<Recharge[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch merchant dashboard data
      const [dashboardResponse, ordersResponse] = await Promise.all([
        apiClient.fetch(`${apiClient.coreUrl}/merchant/dashboard/home`, { requireAuth: true }).catch(() => null),
        apiClient.fetch(`${apiClient.coreUrl}/merchant/orders?limit=10&status=PENDING`, { requireAuth: true }).catch(() => ({ items: [] }))
      ]);

      if (dashboardResponse) {
        setDashboardData(dashboardResponse);
      } else {
        // Fallback: try to get basic stats
        const [balanceData, statsData] = await Promise.all([
          apiClient.fetch(`${apiClient.coreUrl}/transactions/balance`, { requireAuth: true }).catch(() => ({ balance: 0 })),
          apiClient.fetch(`${apiClient.coreUrl}/dashboard/stats`, { requireAuth: true }).catch(() => ({ orderCount: 0, revenue: 0 }))
        ]);
        
        setDashboardData({
          walletBalance: balanceData?.balance || 0,
          currency: 'SAR',
          todayOrdersCount: statsData?.orderCount || 0,
          todayProfit: 0,
          pendingOrdersCount: 0,
          totalOrderValue: statsData?.revenue || 0
        });
      }

      // Set orders
      if (ordersResponse?.items) {
        setOrders(ordersResponse.items);
      }

      // Fetch pending recharges (if endpoint exists)
      try {
        const recharges = await apiClient.fetch(`${apiClient.coreUrl}/merchant/wallet/recharges?status=PENDING`, { requireAuth: true }).catch(() => ({ items: [] }));
        setPendingRecharges(recharges?.items || []);
      } catch (e) {
        setPendingRecharges([]);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setDashboardData({
        walletBalance: 0,
        currency: 'SAR',
        todayOrdersCount: 0,
        todayProfit: 0,
        pendingOrdersCount: 0,
        totalOrderValue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const walletBalance = dashboardData?.walletBalance || 0;
  const currency = dashboardData?.currency || 'SAR';
  const totalOrderValue = dashboardData?.totalOrderValue || dashboardData?.revenueTotal || 0;
  const ordersCount = dashboardData?.todayOrdersCount || dashboardData?.ordersCount || 0;

  const quickActions = [
    { icon: Wallet, label: 'شحن الرصيد', link: '/charge-wallet', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    { icon: ShoppingCart, label: 'إنشاء طلب', link: '/store', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    { icon: Heart, label: 'المفضلة', link: '/favorites', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
    { icon: Users, label: 'إضافة موظف', link: '/employees', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    { icon: FileText, label: 'إضافة تذكرة', link: '/support', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {isRTL ? (props.titleAr || props.title) : (props.titleEn || props.title)}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isRTL ? (props.subtitleAr || props.subtitle) : (props.subtitleEn || props.subtitle)}
            </p>
          </div>
          <Button 
            onClick={loadDashboardData} 
            variant="outline" 
            className="gap-2 shadow-sm hover:shadow-md transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            تحديث البيانات
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">رصيد المحفظة</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {walletBalance.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currency === 'SAR' ? 'ريال سعودي' : currency === 'USD' ? 'دولار أمريكي' : currency}
                  </p>
                </div>
                <div className="p-4 bg-yellow-200 dark:bg-yellow-800/40 rounded-2xl shadow-inner">
                  <Wallet className="h-8 w-8 text-yellow-700 dark:text-yellow-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">إجمالي قيمة الطلبات</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {totalOrderValue.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currency === 'SAR' ? 'ريال سعودي' : currency === 'USD' ? 'دولار أمريكي' : currency}
                  </p>
                </div>
                <div className="p-4 bg-blue-200 dark:bg-blue-800/40 rounded-2xl shadow-inner">
                  <DollarSign className="h-8 w-8 text-blue-700 dark:text-blue-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">عدد الطلبات</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{ordersCount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">طلبات اليوم</p>
                </div>
                <div className="p-4 bg-green-200 dark:bg-green-800/40 rounded-2xl shadow-inner">
                  <ShoppingCart className="h-8 w-8 text-green-700 dark:text-green-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold">إجراءات سريعة</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">الوصول السريع إلى الوظائف الأساسية</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto py-6 flex flex-col items-center gap-3 hover:shadow-lg hover:scale-105 transition-all duration-200 border-2 hover:border-primary/50"
                    onClick={() => navigate(action.link)}
                  >
                    <div className={`p-4 rounded-xl ${action.color} shadow-sm`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-semibold">{action.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Complaints */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-xl font-semibold">الشكاوى المعلقة</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">آخر الطلبات المعلقة</p>
              </div>
              {orders.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/support')}
                  className="text-primary hover:text-primary/80"
                >
                  عرض الكل
                  <ArrowRight className="h-4 w-4 mr-1" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                        <TableHead className="font-semibold">تاريخ الإضافة</TableHead>
                        <TableHead className="font-semibold">عنوان التذكرة</TableHead>
                        <TableHead className="font-semibold">رقم الطلب</TableHead>
                        <TableHead className="font-semibold">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.slice(0, 5).map((order) => (
                        <TableRow key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <TableCell className="text-sm">{new Date(order.createdAt).toLocaleDateString('ar-SA', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}</TableCell>
                          <TableCell className="font-medium">طلب #{order.orderNumber}</TableCell>
                          <TableCell className="font-mono text-xs">{order.orderNumber}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={order.status === 'PENDING' ? 'secondary' : 'default'}
                              className="font-medium"
                            >
                              {order.status === 'PENDING' ? 'معلق' : order.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                    <FileText className="h-8 w-8" />
                  </div>
                  <p className="font-medium">لا توجد طلبات معلقة</p>
                  <p className="text-sm mt-1">جميع الطلبات تم معالجتها</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Recharges */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-xl font-semibold">عمليات شحن الرصيد النقدي</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">العمليات المعلقة</p>
              </div>
              {pendingRecharges.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/balance-operations')}
                  className="text-primary hover:text-primary/80"
                >
                  عرض الكل
                  <ArrowRight className="h-4 w-4 mr-1" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {pendingRecharges.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                        <TableHead className="font-semibold">التاريخ</TableHead>
                        <TableHead className="font-semibold">رقم العملية</TableHead>
                        <TableHead className="font-semibold">الوصف</TableHead>
                        <TableHead className="font-semibold">القيمة</TableHead>
                        <TableHead className="font-semibold">الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRecharges.slice(0, 5).map((recharge) => (
                        <TableRow key={recharge.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                          <TableCell className="text-sm">{new Date(recharge.createdAt || recharge.date).toLocaleDateString('ar-SA', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}</TableCell>
                          <TableCell className="font-mono text-xs">{recharge.referenceId || recharge.id.slice(0, 8)}</TableCell>
                          <TableCell className="text-sm">{recharge.description || recharge.type || 'شحن رصيد'}</TableCell>
                          <TableCell className="font-semibold">
                            {Math.abs(recharge.amount || recharge.value || 0).toFixed(2)} {currency}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={recharge.status === 'PENDING' ? 'secondary' : 'default'}
                              className="font-medium"
                            >
                              {recharge.status === 'PENDING' ? 'معلق' : recharge.status === 'COMPLETED' ? 'مكتمل' : recharge.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                    <Wallet className="h-8 w-8" />
                  </div>
                  <p className="font-medium">لا توجد عمليات معلقة</p>
                  <p className="text-sm mt-1">جميع العمليات تم معالجتها</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Product List Section Component
interface ProductListProps {
  title?: string;
  subtitle?: string;
  titleEn?: string;
  titleAr?: string;
  subtitleEn?: string;
  subtitleAr?: string;
}

function ProductListSection({ props }: { props: ProductListProps }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const title = isRTL 
    ? (props.titleAr as string) || (props.title as string) || 'قائمة المنتجات'
    : (props.titleEn as string) || (props.title as string) || 'Product List';

  const subtitle = isRTL
    ? (props.subtitleAr as string) || (props.subtitle as string) || 'إدارة المخزون والمنتجات الخاصة بك'
    : (props.subtitleEn as string) || (props.subtitle as string) || 'Manage your inventory and products';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = products.filter((p) =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      // Try merchant API first, fallback to regular products API
      const response = await apiClient.fetch(`${apiClient.coreUrl}/merchant/products?limit=100`, { requireAuth: true })
        .catch(() => coreApi.getProducts({ limit: 100 }));
      
      const productsData = response?.data || (Array.isArray(response) ? response : []);
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="بحث عن منتج..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pr-12 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>

        {/* Products Table */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {filteredProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الرقم التعريفي</TableHead>
                      <TableHead className="text-right">المنتج</TableHead>
                      <TableHead className="text-right">علامة تجارية</TableHead>
                      <TableHead className="text-right">سعر الجملة</TableHead>
                      <TableHead className="text-right">نسبة الربح</TableHead>
                      <TableHead className="text-right">السعر قبل الضريبة</TableHead>
                      <TableHead className="text-right">العمله</TableHead>
                      <TableHead className="text-right">سعر البيع المقترح</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const wholesalePrice = product.wholesalePrice || (product as { costPerItem?: number }).costPerItem || 0;
                      const retailPrice = product.price || product.retailPrice || 0;
                      const profitMargin = wholesalePrice > 0 ? ((retailPrice - wholesalePrice) / wholesalePrice * 100).toFixed(2) : '0.00';
                      const currency = product.currency || 'SAR';
                      
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-mono text-sm">{product.id.slice(0, 8)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {(() => {
                                const firstImage = product.images?.[0];
                                const imageSrc = (typeof firstImage === 'object' && firstImage?.url) || 
                                               (typeof firstImage === 'string' ? firstImage : '') ||
                                               product.image || '';
                                return imageSrc ? (
                                  <img
                                    src={imageSrc}
                                    alt={product.name || ''}
                                    className="w-12 h-12 rounded object-cover"
                                  />
                                ) : null;
                              })() || (
                                <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{product.nameAr || product.name}</p>
                                {product.description && (
                                  <p className="text-sm text-gray-500">{product.description.slice(0, 50)}...</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{product.brand?.name || product.brand?.nameAr || 'N/A'}</TableCell>
                          <TableCell>{wholesalePrice.toFixed(6)}</TableCell>
                          <TableCell>{profitMargin}%</TableCell>
                          <TableCell>{retailPrice.toFixed(6)}</TableCell>
                          <TableCell>{currency === 'SAR' ? 'ريال' : currency === 'USD' ? '$' : currency}</TableCell>
                          <TableCell>{retailPrice.toFixed(6)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Package className="h-12 w-12 mb-4" />
                <p>لا توجد منتجات</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Store Page Section Component

// Note: StorePageSection and CategoriesHierarchySection are imported from StorefrontSections.tsx
