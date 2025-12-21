import { ShoppingCart, Eye, Heart, Star, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { Product } from '@/services/types';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  index?: number;
}

export const ProductCard = ({ product, viewMode = 'grid', index = 0 }: ProductCardProps) => {
  const { addToCart } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAdding) return;
    
    setIsAdding(true);
    try {
      const variantId = product.variants && product.variants.length > 0 
        ? product.variants[0].id 
        : undefined;
      
      await addToCart(product.id, 1, variantId);
      toast({
        title: '✨ تمت الإضافة!',
        description: `تمت إضافة ${String(product.name || '')} إلى السلة`,
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? '💔 تمت الإزالة' : '❤️ تمت الإضافة',
      description: isWishlisted 
        ? 'تمت إزالة المنتج من المفضلة' 
        : 'تمت إضافة المنتج إلى المفضلة',
    });
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
        <div className="relative overflow-hidden rounded-2xl border-2 border-border/50 hover:border-primary/50 bg-card transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 group">
          {/* Gradient Overlay on Hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute inset-0 gradient-mesh opacity-30" />
          </div>
          
          <div className="flex gap-6 p-6 relative">
            {/* Image Container */}
            <div className="relative w-48 h-48 flex-shrink-0 overflow-hidden bg-muted/30 rounded-xl">
              {discount > 0 && (
                <Badge className="absolute top-3 right-3 z-10 gradient-accent text-white px-3 py-1.5 text-sm font-bold shadow-lg animate-pulse">
                  <Zap className="w-3 h-3 mr-1" />
                  خصم {discount}%
                </Badge>
              )}
              <img
                src={imageUrl}
                alt={String(product.name || '')}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
            
            {/* Content */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-2xl mb-3 gradient-text group-hover:opacity-100 opacity-80 transition-opacity">
                  {String(product.name || '')}
                </h3>
                {product.description && typeof product.description === 'string' && (
                  <p className="text-muted-foreground line-clamp-2 mb-4">
                    {product.description}
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold gradient-text">
                    {price.toFixed(2)} ر.س
                  </span>
                  {compareAtPrice > price && (
                    <span className="text-xl text-muted-foreground line-through">
                      {compareAtPrice.toFixed(2)} ر.س
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleToggleWishlist}
                    className={cn(
                      "rounded-xl border-2 transition-all duration-300 hover:scale-110",
                      isWishlisted 
                        ? "bg-accent/10 border-accent text-accent shadow-glow-accent" 
                        : "hover:bg-accent/10 hover:border-accent hover:text-accent"
                    )}
                  >
                    <Heart className={cn("h-5 w-5", isWishlisted && "fill-current")} />
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="gap-2 gradient-primary hover:shadow-glow transition-all duration-300 hover:scale-105 rounded-xl font-semibold"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {isAdding ? 'جاري الإضافة...' : 'أضف للسلة'}
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
      <div className="relative overflow-hidden rounded-2xl border-2 border-border/30 hover:border-primary/50 bg-card transition-all duration-500 h-full flex flex-col hover:shadow-2xl hover:-translate-y-2 group">
        {/* Aurora Glow on Hover */}
        <div className="absolute -inset-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary/20 blur-[100px]" />
          <div className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full bg-secondary/15 blur-[80px]" />
        </div>
        
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted/20">
          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-3 right-3 z-10 animate-bounce-in">
              <Badge className="gradient-accent text-white px-3 py-1.5 text-sm font-bold shadow-lg flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {discount}%
              </Badge>
            </div>
          )}
          
          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className={cn(
              "absolute top-3 left-3 z-10 p-2.5 rounded-xl backdrop-blur-md transition-all duration-300 shadow-lg",
              isWishlisted 
                ? "bg-accent text-white shadow-glow-accent scale-110" 
                : "bg-white/90 dark:bg-black/50 text-muted-foreground hover:bg-accent hover:text-white hover:scale-110"
            )}
          >
            <Heart className={cn("h-5 w-5", isWishlisted && "fill-current animate-wiggle")} />
          </button>

          {/* Quick View Overlay */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-center justify-center transition-all duration-500",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
            <Button
              size="lg"
              variant="secondary"
              className="gap-2 bg-white/95 dark:bg-black/80 hover:bg-white dark:hover:bg-black shadow-2xl rounded-xl backdrop-blur-sm transform transition-all duration-300 translate-y-4 group-hover:translate-y-0"
            >
              <Eye className="h-5 w-5" />
              عرض سريع
            </Button>
          </div>

          {/* Product Image */}
          <img
            src={imageUrl}
            alt={String(product.name || '')}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Shimmer Effect on Hover */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 -translate-x-full",
            isHovered && "translate-x-full"
          )} />
        </div>
        
        {/* Content */}
        <div className="p-5 flex flex-col flex-1 relative">
          {/* Rating Stars (Placeholder) */}
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className={cn(
                  "h-4 w-4 transition-all duration-300",
                  star <= 4 
                    ? "fill-warning text-warning" 
                    : "fill-muted text-muted"
                )} 
                style={{ transitionDelay: `${star * 50}ms` }}
              />
            ))}
            <span className="text-xs text-muted-foreground mr-1">(24)</span>
          </div>
          
          {/* Product Name */}
          <h3 className="font-bold text-lg mb-2 line-clamp-2 transition-colors duration-300 group-hover:text-primary min-h-[3.5rem]">
            {String(product.name || '')}
          </h3>
          
          {/* Price & CTA */}
          <div className="mt-auto space-y-4">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-bold gradient-text">
                {price.toFixed(2)}
              </span>
              <span className="text-lg font-semibold text-primary">ر.س</span>
              {compareAtPrice > price && (
                <span className="text-sm text-muted-foreground line-through">
                  {compareAtPrice.toFixed(2)} ر.س
                </span>
              )}
            </div>
            
            <Button
              size="lg"
              onClick={handleAddToCart}
              disabled={isAdding}
              className={cn(
                "w-full gap-2 rounded-xl font-semibold transition-all duration-300",
                "gradient-primary text-white hover:shadow-glow",
                "active:scale-95"
              )}
            >
              <ShoppingCart className={cn(
                "h-5 w-5 transition-transform duration-300",
                isHovered && "animate-wiggle"
              )} />
              {isAdding ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري الإضافة...
                </span>
              ) : 'أضف للسلة'}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};
