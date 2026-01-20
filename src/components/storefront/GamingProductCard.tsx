import { ShoppingCart, Heart, Star, Zap, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

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
  currency?: string;
}

interface GamingProductCardProps {
  product: Product;
  index?: number;
}

export const GamingProductCard = ({ product, index = 0 }: GamingProductCardProps) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);
  const [isAdding, setIsAdding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAdding) return;
    
    setIsAdding(true);
    try {
      await addToCart(product.id, 1);
      toast({
        title: '✨ تمت الإضافة!',
        description: `تمت إضافة ${product.nameAr || product.name || ''} إلى السلة`,
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
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
      addToWishlist(product as any); // Casting to any because of context type mismatch
    }
  };

  const firstImage = product.images?.[0];
  const imageUrl = (typeof firstImage === 'object' && firstImage?.url) || 
                  (typeof firstImage === 'string' ? firstImage : '') ||
                  product.image || '/placeholder.svg';
                  
  const price = Number(product.price) || 0;
  const compareAtPrice = product.compareAtPrice ? Number(product.compareAtPrice) : 0;
  const discount = compareAtPrice > price
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  return (
    <Link 
      to={`/products/${product.id}`} 
      className="block group animate-scale-in"
      style={{ animationDelay: `${index * 75}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="gaming-card h-full flex flex-col group">
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden">
          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-3 right-3 z-10">
              <Badge className="bg-red-500 text-white px-2 py-1 text-xs font-bold shadow-[0_0_10px_rgba(239,68,68,0.5)] flex items-center gap-1 border-none">
                <Zap className="w-3 h-3 fill-current" />
                {discount}%
              </Badge>
            </div>
          )}
          
          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className={cn(
              "absolute top-3 left-3 z-10 p-2 rounded-xl backdrop-blur-md transition-all duration-300",
              isWishlisted 
                ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]" 
                : "bg-black/40 text-white hover:bg-white hover:text-red-500"
            )}
          >
            <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
          </button>

          {/* Quick View Overlay */}
          <div className={cn(
            "absolute inset-0 bg-black/60 flex items-center justify-center transition-all duration-500 backdrop-blur-[2px]",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
            <div className="transform transition-all duration-500 translate-y-4 group-hover:translate-y-0 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <span className="text-white font-bold text-sm tracking-widest uppercase">عرض التفاصيل</span>
            </div>
          </div>

          {/* Product Image */}
          <OptimizedImage
            src={imageUrl}
            alt={product.nameAr || product.name || ''}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Bottom Gradient Overlay */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
        </div>
        
        {/* Content */}
        <div className="p-5 flex flex-col flex-1 relative bg-gradient-to-b from-transparent to-black/20">
          {/* Category/Brand */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-primary tracking-widest uppercase opacity-80">بطاقة رقمية</span>
            <div className="h-[1px] flex-1 bg-primary/20" />
          </div>
          
          {/* Product Name */}
          <h3 className="font-bold text-lg mb-3 line-clamp-2 text-white group-hover:text-primary transition-colors leading-tight">
            {product.nameAr || product.name || ''}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                className={cn(
                  "h-3 w-3",
                  star <= (product.rating || 4) 
                    ? "fill-yellow-400 text-yellow-400" 
                    : "fill-white/10 text-white/10"
                )} 
              />
            ))}
            <span className="text-[10px] text-white/40 mr-2 font-medium">({(product.rating || 4).toFixed(1)})</span>
          </div>
          
          {/* Price & CTA */}
          <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white tracking-tighter">
                  {price.toFixed(2)}
                </span>
                <span className="text-[10px] font-bold text-white/60 uppercase">ر.س</span>
              </div>
              {compareAtPrice > price && (
                <span className="text-xs text-white/40 line-through font-medium">
                  {compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>
            
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={isAdding}
              className={cn(
                "h-11 px-5 rounded-xl font-bold transition-all duration-300",
                "bg-primary text-white hover:shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:scale-105",
                "active:scale-95 border-none"
              )}
            >
              <ShoppingCart className="h-4 w-4 ml-2" />
              {isAdding ? '...' : 'شراء'}
            </Button>
          </div>
        </div>
        
        {/* Decorative Corner */}
        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary/10 rounded-tl-3xl border-t border-l border-primary/20 pointer-events-none" />
      </div>
    </Link>
  );
};
