import { useEffect, useState } from 'react';
import { Section } from './PageBuilder';
import { Button } from '@/components/ui/button';
import { coreApi } from '@/lib/api';
import { Loader2, Moon, Sun, Globe, Menu, X } from 'lucide-react';
import { ImageSlider } from '@/components/ui/ImageSlider';
import { ContentSlider } from '@/components/ui/ContentSlider';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';


interface SectionRendererProps {
  section: Section;
  onToggleTheme?: () => void;
}

export function SectionRenderer({ section, onToggleTheme }: SectionRendererProps) {
  const { type, props: rawProps } = section;
  const props = rawProps as any;
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Cart is only available on storefront, not in dashboard page builder
  let addToCart: ((productId: string, quantity: number) => Promise<void>) | null = null;
  try {
    const cart = useCart();
    addToCart = cart.addToCart;
  } catch (e) {
    // CartProvider not available (e.g., in dashboard page builder)
    addToCart = null;
  }

  useEffect(() => {
    if (type === 'products') {
      const fetchProducts = async () => {
        setLoading(true);
        try {
          const response = await coreApi.getProducts({ 
            limit: props.limit || 8,
            ...(props.categoryId && props.categoryId !== 'all' ? { categoryId: props.categoryId } : {})
          });
          const data = response;
          setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('Failed to fetch products for section:', error);
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
                {(props.links || []).map((link: any, index: number) => (
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
                  {(props.links || []).map((link: any, index: number) => (
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
              {(props.items || []).map((item: any, index: number) => (
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
          <div className="py-16 px-8 bg-gray-50 dark:bg-gray-900">
            {props.title && <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">{props.title}</h2>}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p>No products found.</p>
              </div>
            ) : (
              <div className={`max-w-7xl mx-auto ${
                props.layout === 'carousel' ? 'relative' : ''
              }`}>
                <div className={`${
                  props.layout === 'list' ? 'grid grid-cols-1 gap-6' : 
                  props.layout === 'carousel' ? 'flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scroll-smooth scrollbar-hide' : 
                  `grid grid-cols-1 md:grid-cols-${props.columns || 4} gap-6`
                }`}
                style={props.layout === 'carousel' ? {
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  WebkitOverflowScrolling: 'touch'
                } : {}}
                >
                  {products.map((product, index) => {
                    const imageUrl = product.images?.[0]?.url || product.images?.[0] || '';
                    const description = product.description || '';
                    const truncatedDesc = description.length > 100 ? description.substring(0, 100) + '...' : description;
                    const productPrice = Number(product.price || 0);
                    const comparePrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
                    const hasDiscount = comparePrice && comparePrice > productPrice;
                    
                    return (
                      <div 
                        key={product.id} 
                        className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 group cursor-pointer transform hover:-translate-y-2 ${
                          props.layout === 'carousel' ? 'min-w-[280px] max-w-[280px] snap-center flex-shrink-0' : ''
                        } ${props.layout === 'list' ? 'flex items-center gap-4' : 'flex flex-col'}`}
                        style={props.layout === 'carousel' ? {
                          animationDelay: `${index * 100}ms`
                        } : {}}
                        onClick={() => {
                          // Navigate to product details
                          window.location.href = `/products/${product.id}`;
                        }}
                      >
                        {(props.showImage !== false) && (
                          <div className={`${props.layout === 'list' ? 'w-32 h-32' : 'h-56'} bg-gray-200 dark:bg-gray-700 relative shrink-0 overflow-hidden`}>
                            {imageUrl ? (
                              <img 
                                src={imageUrl} 
                                alt={product.name} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                            )}
                            
                            {/* Discount Badge */}
                            {hasDiscount && (
                              <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                                {Math.round((1 - productPrice / comparePrice) * 100)}% OFF
                              </div>
                            )}
                            
                            {/* Stock Badge */}
                            {(props.showStock) && product.inventoryQuantity !== undefined && (
                              <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${
                                product.inventoryQuantity > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                              }`}>
                                {product.inventoryQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                              </div>
                            )}
                            
                            {/* Gradient Overlay on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        )}
                        
                        <div className="p-5 flex-1 flex flex-col">
                          {(props.showName !== false) && (
                            <h3 className="font-bold text-lg mb-2 truncate dark:text-white group-hover:text-primary transition-colors">
                              {product.name}
                            </h3>
                          )}
                          
                          {(props.showDescription) && description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 flex-grow">
                              {truncatedDesc}
                            </p>
                          )}
                          
                          {(props.showRating) && (
                            <div className="flex items-center gap-1 mb-3">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`text-lg ${i < (product.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}>
                                  ★
                                </span>
                              ))}
                              <span className="text-xs text-gray-500 ml-2">({product.rating || 0})</span>
                            </div>
                          )}
                          
                          {(props.showPrice !== false) && (
                            <div className="mb-4">
                              <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold text-primary dark:text-primary-400">
                                  ${productPrice.toFixed(2)}
                                </p>
                                {hasDiscount && (
                                  <p className="text-sm text-gray-500 line-through">
                                    ${comparePrice.toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {(props.showAddToCart !== false) && (
                            <Button 
                              className="w-full mt-auto bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" 
                              size="sm"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  if (addToCart) {
                                    // Real cart functionality (on storefront)
                                    await addToCart(product.id, 1);
                                  } else {
                                    // Preview mode (in dashboard page builder)
                                    toast({
                                      title: 'Preview Mode',
                                      description: 'Cart functionality will work on your live storefront',
                                    });
                                  }
                                  // Show success feedback
                                  const button = e.currentTarget;
                                  const originalText = button.textContent;
                                  button.textContent = '✓ Added!';
                                  button.classList.add('bg-green-500');
                                  setTimeout(() => {
                                    button.textContent = originalText;
                                    button.classList.remove('bg-green-500');
                                  }, 2000);
                                } catch (error) {
                                  console.error('Failed to add to cart:', error);
                                }
                              }}
                            >
                              Add to Cart
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Scroll Indicators for Carousel */}
                {props.layout === 'carousel' && products.length > 3 && (
                  <div className="flex justify-center gap-2 mt-6">
                    {Array.from({ length: Math.ceil(products.length / 3) }).map((_, i) => (
                      <div 
                        key={i} 
                        className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-primary transition-colors cursor-pointer"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <style>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
              .line-clamp-2 {
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
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
              {props.title && <h2 className="text-4xl font-bold mb-4">{props.title}</h2>}
              {props.description && <p className="text-xl mb-8">{props.description}</p>}
              {props.buttonText && <Button size="lg" variant="secondary">{props.buttonText}</Button>}
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="py-12 px-8">
            <div className="max-w-4xl mx-auto prose">
              {props.content && <p>{props.content}</p>}
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
                  {(props.links || []).map((link: any, index: number) => (
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
                images={props.images || []}
                autoPlay={props.autoPlay !== false}
                interval={props.interval || 5000}
                showDots={props.showDots !== false}
                showArrows={props.showArrows !== false}
                height={props.height || '500px'}
                animationType={props.animationType || 'slide'}
              />
            </div>
            {props.description && (
              <p className="text-center text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto">
                {props.description}
              </p>
            )}
          </div>
        );

      case 'content-slider':
        return (
          <div className="py-12 px-4" style={{ backgroundColor: props.backgroundColor || 'transparent' }}>
            {props.title && <h2 className="text-3xl font-bold text-center mb-8">{props.title}</h2>}
            <ContentSlider
              items={(props.items as any[]) || []}
              direction={props.direction as 'horizontal' | 'vertical' || 'horizontal'}
              speed={props.speed || 20}
              pauseOnHover={props.pauseOnHover !== false}
              itemWidth={props.itemWidth || '300px'}
              itemHeight={props.itemHeight || 'auto'}
              gap={props.gap || '2rem'}
              backgroundColor={props.sliderBackgroundColor as string || 'transparent'}
              textColor={props.textColor as string || 'inherit'}
            />
          </div>
        );

      case 'testimonials':
        return (
          <div className="py-16 px-8 bg-gray-50 dark:bg-gray-900">
            {props.title && <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">{props.title}</h2>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {(props.items || []).map((item: any, index: number) => (
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
              {(props.plans || []).map((plan: any, index: number) => (
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
              {(props.members || []).map((member: any, index: number) => (
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
              {(props.items || []).map((item: any, index: number) => (
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

      case 'faq':
        return (
          <div className="py-16 px-8">
            {props.title && <h2 className="text-3xl font-bold text-center mb-4 dark:text-white">{props.title}</h2>}
            {props.subtitle && <p className="text-center text-gray-600 dark:text-gray-400 mb-12">{props.subtitle}</p>}
            <div className="max-w-3xl mx-auto space-y-4">
              {(props.items || []).map((item: any, index: number) => (
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
                  placeholder={props.placeholder || 'Enter your email'}
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900"
                />
                <Button size="lg" variant="secondary">
                  {props.buttonText || 'Subscribe'}
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
                    src={props.videoUrl}
                    controls={props.controls !== false}
                    autoPlay={props.autoPlay === true}
                    loop={props.loop === true}
                    poster={props.thumbnail}
                    className="w-full h-full"
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
                    <p className="text-gray-600 dark:text-gray-400">{props.email}</p>
                  </div>
                )}
                {props.phone && (
                  <div>
                    <h3 className="font-semibold mb-2 dark:text-white">Phone</h3>
                    <p className="text-gray-600 dark:text-gray-400">{props.phone}</p>
                  </div>
                )}
                {props.address && (
                  <div>
                    <h3 className="font-semibold mb-2 dark:text-white">Address</h3>
                    <p className="text-gray-600 dark:text-gray-400">{props.address}</p>
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
