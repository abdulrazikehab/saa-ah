import { useEffect, useState, useContext } from 'react';
import { Section } from './PageBuilder';
import { Button } from '@/components/ui/button';
import { coreApi } from '@/lib/api';
import { Loader2, Moon, Sun, Globe, Menu, X, Wallet, ShoppingCart, DollarSign, Heart, Users, FileText, Search, Package, Store, Plus, Minus, Upload, Calendar, TrendingUp, BarChart3, User, CreditCard, MessageSquare, ArrowRight, RefreshCw, ChevronDown, FolderOpen, Phone, Settings } from 'lucide-react';
import { SupportTicketsSection, FavoritesPageSection, BalanceOperationsSection, EmployeesPageSection, ChargeWalletSection, ReportsPageSection, ProfilePageSection, BankAccountsSection } from './MerchantSections';
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

interface Product {
  id: string;
  name?: string;
  nameAr?: string;
  description?: string;
  images?: Array<{ url: string } | string>;
  image?: string;
  price?: number;
  compareAtPrice?: number;
  rating?: number;
  inventoryQuantity?: number;
  sku?: string;
  wholesalePrice?: number;
  costPerItem?: number;
  retailPrice?: number;
  currency?: string;
  brand?: {
    name?: string;
    nameAr?: string;
  };
}

export function SectionRenderer({ section, onToggleTheme }: SectionRendererProps) {
  const { type, props: rawProps } = section;
  const props = rawProps as SectionProps;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
            } else if (!('error' in response) && !('statusCode' in response)) {
              // Single product
              setProducts([response as Product]);
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
                  </div>
                </nav>
              </div>
            )}
          </header>
        );

      case 'hero': {
        const heroTextAlign = props.textAlign || 'center';
        const heroContentPosition = props.contentPosition || 'center';
        const heroMinHeight = props.minHeight || '400px';
        const heroTitleSize = props.titleSize || 48;
        const heroSubtitleSize = props.subtitleSize || 20;
        const heroOverlayOpacity = props.overlayOpacity || 0.3;
        const heroButtonStyle = props.buttonStyle || 'primary';
        
        const positionClasses = {
          top: 'items-start pt-20',
          center: 'items-center',
          bottom: 'items-end pb-20'
        };
        
        const alignClasses = {
          left: 'text-left items-start',
          center: 'text-center items-center',
          right: 'text-right items-end'
        };
        
        const buttonVariants = {
          primary: 'bg-blue-600 hover:bg-blue-700 text-white',
          secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
          outline: 'border-2 border-white text-white hover:bg-white hover:text-gray-900',
          ghost: 'text-white hover:bg-white/10'
        };

        return (
          <div
            className={`relative flex ${positionClasses[heroContentPosition as keyof typeof positionClasses]} justify-center p-12 overflow-hidden`}
            style={{
              minHeight: heroMinHeight,
              backgroundColor: props.backgroundColor || '#6366f1',
              color: props.textColor || '#fff',
              backgroundImage: props.backgroundImage ? `url(${props.backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              ...animationStyle,
            }}
          >
            {/* Overlay */}
            {props.backgroundImage && (
              <div 
                className="absolute inset-0 bg-black transition-opacity duration-300"
                style={{ opacity: heroOverlayOpacity }}
              />
            )}
            
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-blue-600/20 animate-gradient-shift" />
            
            {/* Content */}
            <div className={`relative max-w-4xl w-full flex flex-col ${alignClasses[heroTextAlign as keyof typeof alignClasses]} gap-6 z-10`}>
              {props.title && (
                <h1 
                  className="font-bold leading-tight animate-fade-in-up"
                  style={{ 
                    fontSize: `${heroTitleSize}px`,
                    animationDelay: '0.1s'
                  }}
                >
                  {props.title}
                </h1>
              )}
              {props.subtitle && (
                <p 
                  className="leading-relaxed animate-fade-in-up"
                  style={{ 
                    fontSize: `${heroSubtitleSize}px`,
                    animationDelay: '0.2s'
                  }}
                >
                  {props.subtitle}
                </p>
              )}
              {props.buttonText && (
                <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  <Button 
                    size="lg"
                    className={`${buttonVariants[heroButtonStyle as keyof typeof buttonVariants]} transition-all duration-300 transform hover:scale-105 shadow-lg`}
                  >
                    {props.buttonText}
                  </Button>
                </div>
              )}
            </div>

            {/* Decorative elements */}
            <div className="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            
            <style>{`
              @keyframes fade-in-up {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              @keyframes gradient-shift {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 0.8; }
              }
              .animate-fade-in-up {
                animation: fade-in-up 0.6s ease-out forwards;
                opacity: 0;
              }
              .animate-gradient-shift {
                animation: gradient-shift 8s ease-in-out infinite;
              }
            `}</style>
          </div>
        );
      }

      case 'features':
        return (
          <div className="py-16 px-8" style={{ backgroundColor: props.backgroundColor, color: props.textColor }}>
            {props.title && (
              <h2 className="text-3xl font-bold text-center mb-12 animate-fade-in">
                {props.title}
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {(props.items || []).map((item: { icon?: string; title?: string; description?: string }, index: number) => (
                <div 
                  key={index} 
                  className="text-center group hover:transform hover:scale-105 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative">
                    {item.icon && (
                      <div className="text-6xl mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                        {item.icon}
                      </div>
                    )}
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/20 group-hover:to-purple-500/20 rounded-full blur-2xl transition-all duration-300" />
                  </div>
                  {item.title && (
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h3>
                  )}
                  {item.description && (
                    <p className="text-gray-600 dark:text-gray-400">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="py-20 px-8 bg-[#0a0a0f] relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse-slow" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
              {props.title && (
                <div className="flex flex-col items-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight text-center">
                    {props.title}
                  </h2>
                  <div className="h-1.5 w-24 bg-gradient-to-r from-primary to-purple-600 rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <div className="absolute inset-0 blur-lg bg-primary/20 animate-pulse" />
                  </div>
                  <p className="text-white/40 font-medium tracking-widest uppercase text-xs">جاري تحميل المنتجات...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-24 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                  <Package className="w-16 h-16 mx-auto mb-4 text-white/20" />
                  <p className="text-white/60 text-lg font-medium">لا توجد منتجات متاحة حالياً</p>
                </div>
              ) : (
                <div className={`${
                  props.layout === 'carousel' ? 'relative' : ''
                }`}>
                  <div className={`${
                    props.layout === 'list' ? 'grid grid-cols-1 gap-8' : 
                    props.layout === 'carousel' ? 'flex overflow-x-auto gap-8 pb-8 snap-x snap-mandatory scroll-smooth scrollbar-hide' : 
                    `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${props.columns || 4} gap-8`
                  }`}
                  style={props.layout === 'carousel' ? {
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch'
                  } : {}}
                  >
                    {products.map((product, index) => (
                      <GamingProductCard 
                        key={product.id || index} 
                        product={product} 
                        index={index}
                      />
                    ))}
                  </div>
                  
                  {/* Scroll Indicators for Carousel */}
                  {props.layout === 'carousel' && products.length > (props.columns || 4) && (
                    <div className="flex justify-center gap-3 mt-10">
                      {Array.from({ length: Math.ceil(products.length / (props.columns || 4)) }).map((_, i) => (
                        <div 
                          key={i} 
                          className="w-10 h-1.5 rounded-full bg-white/10 hover:bg-primary/50 transition-all cursor-pointer"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <style>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
          </div>
        );

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
              {props.buttonText && <Button size="lg" variant="secondary">{String(props.buttonText)}</Button>}
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

      case 'support-tickets':
        return <SupportTicketsSection props={props} />;

      case 'favorites-page':
        return <FavoritesPageSection props={props} />;

      case 'balance-operations':
        return <BalanceOperationsSection props={props} />;

      case 'employees-page':
        return <EmployeesPageSection props={props} />;

      case 'charge-wallet':
        return <ChargeWalletSection props={props} />;

      case 'reports-page':
        return <ReportsPageSection props={props} />;

      case 'profile-page':
        return <ProfilePageSection props={props} />;

      case 'bank-accounts':
        return <BankAccountsSection props={props} />;

      case 'permissions-page':
        return <PermissionsPage />;

      case 'store-managers':
      case 'custom':
        // Handle custom component StoreManagersList
        if (props.component === 'StoreManagersList' || type === 'store-managers') {
          return <StoreManagersListSection props={props} />;
        }
        // Fall through for other custom components
        return null;

      case 'faq':
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
                <Button size="lg" variant="secondary">
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

      case 'brands':
        return (
          <div className="py-16 px-8 bg-gray-50 dark:bg-gray-900">
            {props.title && <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">{props.title}</h2>}
            <div 
              className="grid gap-8 max-w-6xl mx-auto items-center"
              style={{ gridTemplateColumns: `repeat(${props.columns || 6}, 1fr)` }}
            >
              {(props.logos || []).map((logo: string, index: number) => (
                <div key={index} className="flex items-center justify-center">
                  <img 
                    src={logo} 
                    alt={`Brand ${index + 1}`} 
                    className={`max-h-12 w-auto object-contain ${props.grayscale ? 'grayscale hover:grayscale-0' : ''} transition-all`}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="py-16 px-8">
            {props.title && <h2 className="text-3xl font-bold text-center mb-4 dark:text-white">{props.title}</h2>}
            {props.subtitle && <p className="text-center text-gray-600 dark:text-gray-400 mb-12">{props.subtitle}</p>}
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                {props.email && (
                  <div>
                    <h3 className="font-semibold mb-2 dark:text-white">Email</h3>
                    <p className="text-gray-600 dark:text-gray-400">{String(props.email)}</p>
                  </div>
                )}
                {props.phone && (
                  <div>
                    <h3 className="font-semibold mb-2 dark:text-white">Phone</h3>
                    <p className="text-gray-600 dark:text-gray-400">{String(props.phone)}</p>
                  </div>
                )}
                {props.address && (
                  <div>
                    <h3 className="font-semibold mb-2 dark:text-white">Address</h3>
                    <p className="text-gray-600 dark:text-gray-400">{String(props.address)}</p>
                  </div>
                )}
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
                <form className="space-y-4">
                  <input
                    type="text"
                    placeholder="Name"
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <textarea
                    placeholder="Message"
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <Button className="w-full">Send Message</Button>
                </form>
              </div>
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

      case 'categories-hierarchy':
        return <CategoriesHierarchySection props={props} />;

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
              {props.title || 'لوحة التحكم'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {props.subtitle || 'نظرة عامة على أداء متجرك'}
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
}

function ProductListSection({ props }: { props: ProductListProps }) {
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">قائمة المنتجات</h1>
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
                      const wholesalePrice = product.wholesalePrice || product.costPerItem || 0;
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
interface StorePageProps {
  title?: string;
  subtitle?: string;
}

function StorePageSection({ props }: { props: StorePageProps }) {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<Array<{ id: string; name?: string; nameAr?: string; logo?: string; category?: { name?: string; nameAr?: string } }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name?: string; nameAr?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Use safe cart hook - always call at top level
  const cartContext = useSafeCart();
  
  // Get cart items from CartContext
  const cart = cartContext?.cart;
  const cartItems = cart && 'items' in cart && Array.isArray(cart.items)
    ? cart.items
    : cart && 'cartItems' in cart && Array.isArray((cart as { cartItems: unknown[] }).cartItems)
      ? (cart as { cartItems: unknown[] }).cartItems
      : [];
  
  // Debug: Log cart state and refresh when cart changes
  useEffect(() => {
    console.log('🛒 StorePageSection: Cart state updated', {
      hasCart: !!cart,
      cartId: (cart as { id?: string })?.id,
      itemsCount: cartItems.length,
      items: cartItems.map((item: { id?: string; productId?: string; product?: { name?: string; nameAr?: string }; quantity?: number }) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name || item.product?.nameAr || 'Unknown',
        hasProduct: !!item.product,
        quantity: item.quantity,
      })),
    });
    
    // Refresh cart when component mounts or cart context changes
    if (cartContext?.refreshCart) {
      cartContext.refreshCart().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartContext, cart?.id, cartItems.length]); // Use cart.id instead of whole cart object

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [brandsData, categoriesData] = await Promise.all([
        apiClient.fetch(`${apiClient.coreUrl}/brands`, { requireAuth: false }).catch(() => []),
        coreApi.getCategories().catch(() => [])
      ]);

      setBrands(Array.isArray(brandsData) ? brandsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Failed to load store data:', error);
      setBrands([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromCart = async (itemId: string) => {
    if (!cartContext || !('removeItem' in cartContext)) {
      toast({
        title: 'خطأ',
        description: 'سلة التسوق غير متاحة',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await (cartContext as { removeItem: (id: string) => Promise<void> }).removeItem(itemId);
      toast({
        title: 'تم الحذف',
        description: 'تم حذف العنصر من السلة',
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      toast({
        title: 'خطأ',
        description: 'فشل حذف العنصر من السلة',
        variant: 'destructive',
      });
    }
  };
  
  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (!cartContext || !('updateQuantity' in cartContext)) {
      return;
    }
    
    try {
      await (cartContext as { updateQuantity: (id: string, qty: number) => Promise<void> }).updateQuantity(itemId, quantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تحديث الكمية',
        variant: 'destructive',
      });
    }
  };

  const filteredBrands = brands.filter((brand) => {
    const matchesSearch = !searchQuery || 
      brand.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.nameAr?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Calculate cart total and count from CartContext items
  const cartTotal = cartItems.reduce((sum: number, item: { productVariant?: { price?: number }; product?: { price?: number }; quantity?: number }) => {
    const price = Number(item.productVariant?.price ?? item.product?.price ?? 0);
    const quantity = Number(item.quantity ?? 0);
    return sum + (price * quantity);
  }, 0);
  const cartCount = cartItems.reduce((sum: number, item: { quantity?: number }) => sum + Number(item.quantity ?? 0), 0);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">منصة التجارة الإلكترونية</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">اختر العلامة التجارية وابدأ التسوق</p>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="ابحث عن علامة تجارية أو اسم بطاقة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border-2 border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800 dark:text-white"
              >
                <option value="all">كل الأقسام</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nameAr || cat.name}</option>
                ))}
              </select>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">{filteredBrands.length} علامة تجارية</p>

            {/* Brands Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredBrands.map((brand) => (
                <Card
                  key={brand.id}
                  className="cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 shadow-lg group overflow-hidden"
                  onClick={() => navigate(`/products?brandId=${brand.id}`)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-square relative overflow-hidden rounded-t-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Store className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {brand.nameAr || brand.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {brand.category?.nameAr || brand.category?.name || 'بطاقات الألعاب'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredBrands.length === 0 && (
              <div className="text-center py-12">
                <Store className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">لا توجد علامات تجارية</p>
              </div>
            )}
          </div>
        </div>

        {/* Shopping Cart Sidebar */}
        <div className="w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">سلة الشراء</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{Number(cartCount)} عنصر</p>
          </div>
          <div className="p-6">
          
          {cartItems.length > 0 ? (
            <>
              <div className="space-y-3 mb-6 max-h-[55vh] overflow-y-auto">
                {cartItems.map((item: { id?: string; product?: { name?: string; nameAr?: string; price?: number; images?: Array<{ url?: string } | string> }; productVariant?: { price?: number }; quantity?: number }) => {
                  // Validate item has product data
                  if (!item.product) {
                    console.error('❌ Cart item missing product:', item);
                    return null;
                  }
                  
                  const productName = item.product?.nameAr || item.product?.name || 'منتج غير معروف';
                  const productPrice = Number(item.productVariant?.price ?? item.product?.price ?? 0);
                  const quantity = Number(item.quantity ?? 0);
                  const totalPrice = productPrice * quantity;
                  // Product images are objects with 'url' property
                  const firstImage = item.product?.images?.[0];
                  const productImage = (typeof firstImage === 'object' && firstImage?.url) || 
                                      (typeof firstImage === 'string' ? firstImage : null);
                  
                  return (
                    <div key={item.id} className="flex gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary/50 transition-colors bg-gray-50 dark:bg-gray-800/50">
                      {productImage && (
                        <img
                          src={productImage}
                          alt={productName}
                          className="w-20 h-20 rounded-lg object-cover shadow-sm"
                          onError={(e) => {
                            console.error('Failed to load product image:', productImage);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1 truncate" title={productName}>
                          {productName}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, Math.max(1, quantity - 1))}
                            className="p-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs text-gray-500">الكمية: {quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, quantity + 1)}
                            className="p-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-primary">
                          {totalPrice.toFixed(2)} ر.س
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFromCart(item.id || '')}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                }).filter((item): item is NonNullable<typeof item> => item !== null)}
              </div>
              
              <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6 space-y-4 sticky bottom-0 bg-white dark:bg-gray-900">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">عدد البطاقات</span>
                  <span className="font-bold text-lg">{Number(cartCount)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white font-bold text-lg">الإجمالي</span>
                  <span className="text-primary font-bold text-xl">{Number(cartTotal).toFixed(2)} ر.س</span>
                </div>
                <Button
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                  onClick={() => navigate('/cart')}
                >
                  <ShoppingCart className="ml-2 h-5 w-5" />
                  إتمام الطلب
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <ShoppingCart className="h-12 w-12" />
              </div>
              <p className="font-medium text-lg mb-2">السلة فارغة</p>
              <p className="text-sm">ابدأ بإضافة المنتجات إلى السلة</p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Categories Hierarchy Section Component - Displays Categories -> Subcategories -> Products
interface Category {
  id: string;
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  image?: string;
  parentId?: string | null;
  slug?: string;
}

interface CategoriesHierarchyProps {
  title?: string;
  subtitle?: string;
  productsPerCategory?: number;
  productsLayout?: string;
  productsColumns?: number;
  showAddToCart?: boolean;
}

function CategoriesHierarchySection({ props }: { props: CategoriesHierarchyProps }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Record<string, Category[]>>({});
  const [products, setProducts] = useState<Record<string, Product[]>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const categoriesData = await coreApi.getCategories();
      const allCategories: Category[] = Array.isArray(categoriesData) ? categoriesData : ((categoriesData as { categories?: Category[] })?.categories || []);
      
      // Filter to get only parent categories (no parentId)
      const parentCategories = allCategories.filter((cat) => !cat.parentId || cat.parentId === null);
      setCategories(parentCategories);

      // Build subcategories map
      const subcategoriesMap: Record<string, Category[]> = {};
      allCategories.forEach((cat) => {
        if (cat.parentId) {
          if (!subcategoriesMap[cat.parentId]) {
            subcategoriesMap[cat.parentId] = [];
          }
          subcategoriesMap[cat.parentId].push(cat);
        }
      });
      setSubcategories(subcategoriesMap);

      // Load products for all categories and subcategories
      const productsMap: Record<string, Product[]> = {};
      const allCategoryIds = allCategories.map((c) => c.id);
      
      for (const categoryId of allCategoryIds) {
        try {
          const productsData = await coreApi.getProducts({ 
            categoryId,
            limit: props.productsPerCategory || 12
          });
          const productsList = Array.isArray(productsData) ? productsData : ((productsData as { products?: Product[] })?.products || []);
          productsMap[categoryId] = productsList;
        } catch (error) {
          console.error(`Failed to load products for category ${categoryId}:`, error);
          productsMap[categoryId] = [];
        }
      }
      setProducts(productsMap);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.productsPerCategory]); // loadCategories is stable, no need to include

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
      setSelectedCategoryId(null);
    } else {
      newExpanded.add(categoryId);
      setSelectedCategoryId(categoryId);
    }
    setExpandedCategories(newExpanded);
    setExpandedSubcategories(new Set()); // Reset subcategories when category changes
  };

  const toggleSubcategory = (subcategoryId: string) => {
    const newExpanded = new Set(expandedSubcategories);
    if (newExpanded.has(subcategoryId)) {
      newExpanded.delete(subcategoryId);
      setSelectedSubcategoryId(null);
    } else {
      newExpanded.add(subcategoryId);
      setSelectedSubcategoryId(subcategoryId);
    }
    setExpandedSubcategories(newExpanded);
  };

  // Cart functionality - use safe hook
  const cartContextForCategory = useSafeCart();
  const addToCart = cartContextForCategory?.addToCart || null;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {props.title || 'الفئات والمنتجات'}
          </h1>
          {props.subtitle && (
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {props.subtitle}
            </p>
          )}
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">لا توجد فئات متاحة</p>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((category) => {
              const categorySubcategories = subcategories[category.id] || [];
              const categoryProducts = products[category.id] || [];
              const isExpanded = expandedCategories.has(category.id);
              const hasSubcategories = categorySubcategories.length > 0;
              const hasProducts = categoryProducts.length > 0;

              return (
                <Card 
                  key={category.id} 
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <CardHeader 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {category.image && (
                          <img 
                            src={category.image} 
                            alt={category.nameAr || category.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {category.nameAr || category.name}
                          </CardTitle>
                          {category.descriptionAr || category.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {category.descriptionAr || category.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            {hasSubcategories && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                {categorySubcategories.length} فئة فرعية
                              </Badge>
                            )}
                            {hasProducts && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                {categoryProducts.length} منتج
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(hasSubcategories || hasProducts) && (
                          <Button variant="ghost" size="icon">
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ArrowRight className="h-5 w-5" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0 pb-6">
                      {/* Subcategories */}
                      {hasSubcategories && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <FolderOpen className="h-5 w-5" />
                            الفئات الفرعية
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {categorySubcategories.map((subcategory) => {
                              const subcategoryProducts = products[subcategory.id] || [];
                              const isSubExpanded = expandedSubcategories.has(subcategory.id);
                              
                              return (
                                <Card
                                  key={subcategory.id}
                                  className="border-2 hover:border-primary/50 transition-all cursor-pointer"
                                  onClick={() => toggleSubcategory(subcategory.id)}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="font-semibold text-gray-900 dark:text-white">
                                        {subcategory.nameAr || subcategory.name}
                                      </h4>
                                      {subcategoryProducts.length > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                          {subcategoryProducts.length}
                                        </Badge>
                                      )}
                                    </div>
                                    {isSubExpanded && subcategoryProducts.length > 0 && (
                                      <div className="mt-4 pt-4 border-t">
                                        <div className="grid grid-cols-2 gap-2">
                                          {subcategoryProducts.slice(0, 4).map((product) => (
                                            <div
                                              key={product.id}
                                              className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/products/${product.id}`);
                                              }}
                                            >
                                              <p className="font-medium truncate">{product.nameAr || product.name}</p>
                                              <p className="text-primary font-bold">${Number(product.price ?? 0).toFixed(2)}</p>
                                            </div>
                                          ))}
                                        </div>
                                        {subcategoryProducts.length > 4 && (
                                          <Button
                                            variant="link"
                                            size="sm"
                                            className="mt-2 w-full"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navigate(`/collections/${subcategory.slug || subcategory.id}`);
                                            }}
                                          >
                                            عرض جميع المنتجات ({subcategoryProducts.length})
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Products in Category */}
                      {hasProducts && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            المنتجات
                          </h3>
                          <div className={`grid gap-6 ${
                            props.productsLayout === 'list' ? 'grid-cols-1' :
                            props.productsLayout === 'carousel' ? 'grid-cols-1' :
                            `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${props.productsColumns || 4}`
                          }`}>
                            {categoryProducts.map((product) => {
                              const productName = String(product?.name || '');
                              const productNameAr = String(product?.nameAr || productName);
                              const firstImage = product?.images?.[0];
                              const imageUrl = (typeof firstImage === 'object' && firstImage?.url) || 
                                              (typeof firstImage === 'string' ? firstImage : '') ||
                                              product?.image || '';
                              const productPrice = Number(product?.price || 0);
                              const comparePrice = product?.compareAtPrice ? Number(product.compareAtPrice) : null;
                              const hasDiscount = comparePrice && comparePrice > productPrice;
                              const inventoryQuantity = Number(product?.inventoryQuantity || 0);

                              return (
                                <Card
                                  key={product.id}
                                  className="border-0 shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer overflow-hidden"
                                  onClick={() => navigate(`/products/${product.id}`)}
                                >
                                  {imageUrl && (
                                    <div className="h-48 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                                      <img
                                        src={String(imageUrl)}
                                        alt={productNameAr}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                      />
                                      {hasDiscount && comparePrice && (
                                        <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                          {Math.round((1 - productPrice / comparePrice) * 100)}% OFF
                                        </div>
                                      )}
                                      {inventoryQuantity <= 0 && (
                                        <div className="absolute top-3 right-3 bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                          غير متوفر
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  <CardContent className="p-5">
                                    <h4 className="font-bold text-lg mb-2 truncate dark:text-white group-hover:text-primary transition-colors">
                                      {productNameAr}
                                    </h4>
                                    <div className="flex items-baseline gap-2 mb-4">
                                      <p className="text-2xl font-bold text-primary">
                                        ${productPrice.toFixed(2)}
                                      </p>
                                      {hasDiscount && (
                                        <p className="text-sm text-gray-500 line-through">
                                          ${comparePrice.toFixed(2)}
                                        </p>
                                      )}
                                    </div>
                                    {props.showAddToCart !== false && addToCart && inventoryQuantity > 0 && (
                                      <Button
                                        className="w-full bg-primary hover:bg-primary/90 text-white font-semibold"
                                        size="sm"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          try {
                                            await (addToCart as (productId: string, quantity: number) => Promise<void>)(product.id, 1);
                                            toast({
                                              title: 'تمت الإضافة',
                                              description: `تم إضافة ${productNameAr} إلى السلة`,
                                            });
                                          } catch (error) {
                                            console.error('Failed to add to cart:', error);
                                          }
                                        }}
                                      >
                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                        إضافة إلى السلة
                                      </Button>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* No subcategories and no products */}
                      {!hasSubcategories && !hasProducts && (
                        <div className="text-center py-8 text-gray-400">
                          <p>لا توجد فئات فرعية أو منتجات في هذه الفئة</p>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
