import { ShoppingCart, Eye, Heart, Star, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Product } from '@/services/types';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { formatCurrency } from '@/lib/currency-utils';

// Optimized image URL generator for Cloudinary
const getOptimizedImageUrl = (url: string, width = 400): string => {
  if (!url) return '/placeholder.svg';
  
  // If it's a Cloudinary URL, add optimization params
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    const transforms = `f_auto,q_auto,w_${width},c_limit`;
    return url.replace('/upload/', `/upload/${transforms}/`);
  }
  
  return url;
};

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  index?: number;
}


export const ProductCard = ({ product, viewMode = 'grid', index = 0 }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { settings } = useStoreSettings();
  const isWishlisted = isInWishlist(product.id);
  const [isAdding, setIsAdding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAdding) return;
    
    if (!product.id) {
      console.error('Product ID is missing:', product);
      toast({
        title: 'خطأ',
        description: 'بيانات المنتج غير مكتملة',
        variant: 'destructive',
      });
      return;
    }
    
    setIsAdding(true);
    try {
      // Only pass variantId if product has variants and the first variant has a valid id
      let variantId: string | undefined = undefined;
      if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
        const firstVariant = product.variants[0];
        if (firstVariant && firstVariant.id) {
          variantId = firstVariant.id;
        }
      }
      
      await addToCart(product.id, 1, variantId);
      toast({
        title: '✨ تمت الإضافة!',
        description: `تمت إضافة ${String(product.name || '')} إلى السلة`,
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Failed to add to cart:', err);
      toast({
        title: 'تعذرت الإضافة',
        description: err?.message || 'حدث خطأ أثناء إضافة المنتج إلى السلة',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const imageUrl = product.images?.[0]?.url || '/placeholder.svg';
  const price = Number(product.price) || 0;
  const compareAtPrice = product.compareAtPrice ? Number(product.compareAtPrice) : 0;
  const discount = compareAtPrice > price
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  if (viewMode === 'list') {
    return (
      <Link 
        to={`/products/${product.id}`} 
        className="block group animate-slide-up"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className="relative overflow-hidden rounded-xl border border-border/50 hover:border-primary/50 bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group">
          <div className="flex gap-4 p-4 relative">
            {/* Image Container */}
            <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden bg-muted/30 rounded-lg">
              {discount > 0 && (
                <Badge className="absolute top-2 right-2 z-10 gradient-accent text-white px-2 py-0.5 text-xs font-bold shadow-sm">
                  {discount}%
                </Badge>
              )}
              <OptimizedImage
                src={imageUrl}
                alt={String(product.name || '')}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            
            {/* Content */}
            <div className="flex-1 flex flex-col justify-between py-1">
              <div>
                <h3 className="font-semibold text-lg mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {String(product.name || '')}
                </h3>
                {product.description && typeof product.description === 'string' && (
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-2">
                    {product.description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-foreground">
                    {formatCurrency(price, settings?.currency || 'SAR')}
                  </span>
                  {compareAtPrice > price && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatCurrency(compareAtPrice, settings?.currency || 'SAR')}
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleToggleWishlist}
                    className={cn(
                      "h-9 w-9 rounded-lg transition-colors",
                      isWishlisted 
                        ? "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="gap-2 gradient-primary hover:shadow-md transition-all duration-300 rounded-lg font-medium h-9 px-4"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {isAdding ? '...' : 'أضف'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      to={`/products/${product.id}`} 
      className="block group animate-scale-in"
      style={{ animationDelay: `${index * 75}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden rounded-2xl border border-border/40 hover:border-primary/40 bg-card/60 backdrop-blur-md transition-all duration-500 h-full flex flex-col hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2 group">
        
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-muted/20">
          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-3 right-3 z-10">
              <Badge className="gradient-primary text-white border-none px-3 py-1 text-xs font-bold shadow-[0_5px_15px_rgba(var(--primary),0.3)] flex items-center gap-1.5 rounded-full">
                <Zap className="w-3 h-3 fill-current" />
                {discount}% خصم
              </Badge>
            </div>
          )}
          
          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className={cn(
              "absolute top-3 left-3 z-10 p-2.5 rounded-xl backdrop-blur-md transition-all duration-300 shadow-sm",
              isWishlisted 
                ? "bg-red-500 text-white shadow-[0_5px_15px_rgba(239,68,68,0.3)]" 
                : "bg-white/90 text-gray-500 hover:bg-red-500 hover:text-white"
            )}
          >
            <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
          </button>

          {/* Quick View Overlay */}
          <div className={cn(
            "absolute inset-0 bg-black/40 flex items-center justify-center transition-all duration-500 opacity-0 group-hover:opacity-100 backdrop-blur-[2px]"
          )}>
            <div className="transform transition-all duration-500 translate-y-4 group-hover:translate-y-0">
              <Button
                size="sm"
                variant="secondary"
                className="gap-2 bg-white/95 hover:bg-white text-black shadow-xl rounded-xl px-6 py-5 font-bold"
              >
                <Eye className="h-4 w-4" />
                عرض التفاصيل
              </Button>
            </div>
          </div>

          {/* Product Image */}
          <OptimizedImage
            src={imageUrl}
            alt={String(product.name || '')}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Subtle Bottom Shade */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
        
        {/* Content */}
        <div className="p-5 flex flex-col flex-1 relative bg-gradient-to-b from-transparent to-muted/20">
          {/* Rating Stars */}
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className={cn(
                  "h-3 w-3",
                  star <= 4 
                    ? "fill-amber-400 text-amber-400" 
                    : "fill-muted text-muted"
                )} 
              />
            ))}
            <span className="text-[11px] text-muted-foreground mr-2 font-medium">(24 تقييم)</span>
          </div>
          
          {/* Product Name */}
          <h3 className="font-bold text-lg mb-4 line-clamp-2 text-foreground group-hover:text-primary transition-colors leading-tight">
            {String(product.name || '')}
          </h3>
          
          {/* Price & CTA */}
          <div className="mt-auto pt-5 border-t border-border/50 flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-foreground tracking-tighter">
                  {formatCurrency(price, settings?.currency || 'SAR')}
                </span>
              </div>
              {compareAtPrice > price && (
                <span className="text-xs text-muted-foreground line-through font-medium opacity-60">
                  {formatCurrency(compareAtPrice, settings?.currency || 'SAR')}
                </span>
              )}
            </div>
            
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={isAdding}
              className={cn(
                "h-11 px-6 rounded-xl font-bold transition-all duration-300 shadow-md",
                "gradient-primary text-white hover:shadow-glow hover:scale-105",
                "active:scale-95 border-none"
              )}
            >
              <ShoppingCart className="h-4 w-4 ml-2" />
              {isAdding ? '...' : 'أضف للسلة'}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};
