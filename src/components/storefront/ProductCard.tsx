import { ShoppingCart, Eye, Heart, Star, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Product } from '@/services/types';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

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
                    {price.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">ر.س</span>
                  </span>
                  {compareAtPrice > price && (
                    <span className="text-sm text-muted-foreground line-through">
                      {compareAtPrice.toFixed(2)}
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
      <div className="relative overflow-hidden rounded-xl border border-border/40 hover:border-primary/40 bg-card transition-all duration-300 h-full flex flex-col hover:shadow-lg hover:-translate-y-1 group">
        
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted/20">
          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-2 right-2 z-10">
              <Badge className="gradient-accent text-white px-2 py-0.5 text-xs font-bold shadow-sm flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {discount}%
              </Badge>
            </div>
          )}
          
          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className={cn(
              "absolute top-2 left-2 z-10 p-2 rounded-lg backdrop-blur-sm transition-all duration-200 shadow-sm",
              isWishlisted 
                ? "bg-white/90 text-red-500 shadow-sm" 
                : "bg-black/20 text-white hover:bg-white/90 hover:text-red-500"
            )}
          >
            <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
          </button>

          {/* Quick View Overlay */}
          <div className={cn(
            "absolute inset-0 bg-black/40 flex items-center justify-center transition-all duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
            <Button
              size="sm"
              variant="secondary"
              className="gap-2 bg-white/95 hover:bg-white shadow-lg rounded-lg backdrop-blur-sm transform transition-all duration-300 translate-y-2 group-hover:translate-y-0"
            >
              <Eye className="h-4 w-4" />
              عرض
            </Button>
          </div>

          {/* Product Image */}
          <OptimizedImage
            src={imageUrl}
            alt={String(product.name || '')}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        
        {/* Content */}
        <div className="p-4 flex flex-col flex-1 relative">
          {/* Rating Stars */}
          <div className="flex items-center gap-0.5 mb-1.5">
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
            <span className="text-[10px] text-muted-foreground mr-1">(24)</span>
          </div>
          
          {/* Product Name */}
          <h3 className="font-semibold text-base mb-1.5 line-clamp-1 text-foreground group-hover:text-primary transition-colors">
            {String(product.name || '')}
          </h3>
          
          {/* Price & CTA */}
          <div className="mt-auto pt-2 flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-foreground">
                  {price.toFixed(2)}
                </span>
                <span className="text-xs font-medium text-muted-foreground">ر.س</span>
              </div>
              {compareAtPrice > price && (
                <span className="text-xs text-muted-foreground line-through">
                  {compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>
            
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={isAdding}
              className={cn(
                "h-9 px-4 rounded-lg font-medium transition-all duration-300",
                "gradient-primary text-white hover:shadow-md hover:scale-105",
                "active:scale-95"
              )}
            >
              <ShoppingCart className="h-4 w-4 ml-1.5" />
              {isAdding ? '...' : 'أضف'}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};
