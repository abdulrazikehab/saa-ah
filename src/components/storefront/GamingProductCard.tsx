import { ShoppingCart, Heart, Star, Zap, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/currency-utils';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';

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
  const { i18n } = useTranslation();
  const { settings } = useStoreSettings();
  const isRtl = i18n.language === 'ar';
  
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
      <div className="gaming-card h-full flex flex-col group relative border-none shadow-[0_10px_30px_-15px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_50px_-15px_rgba(var(--primary),0.3)] transition-all duration-500 overflow-hidden rounded-[2rem] bg-card/10 backdrop-blur-xl">
        {/* Decorative Light Effect */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        
        {/* Image Container */}
        <div className="relative aspect-[4/5] overflow-hidden">
          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-3 py-1.5 text-xs font-black shadow-lg flex items-center gap-1.5 border-none rounded-full items-center">
                <Zap className="w-3.5 h-3.5 fill-current" />
                {discount}% {isRtl ? 'خصم' : 'OFF'}
              </Badge>
            </div>
          )}
          
          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className={cn(
              "absolute top-4 left-4 z-10 p-2.5 rounded-2xl backdrop-blur-md transition-all duration-300",
              isWishlisted 
                ? "bg-red-500 text-white shadow-[0_8px_20px_rgba(239,68,68,0.4)]" 
                : "bg-black/30 text-white hover:bg-white hover:text-red-500"
            )}
          >
            <Heart className={cn("h-4.5 w-4.5", isWishlisted && "fill-current")} />
          </button>

          {/* Quick View Overlay */}
          <div className={cn(
            "absolute inset-0 bg-black/50 flex items-center justify-center transition-all duration-500 opacity-0 group-hover:opacity-100 backdrop-blur-[3px]"
          )}>
            <div className="transform transition-all duration-500 translate-y-6 group-hover:translate-y-0 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-3xl bg-white/10 flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl">
                <Eye className="h-7 w-7 text-white" />
              </div>
              <span className="text-white font-black text-xs tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                {isRtl ? 'عرض التفاصيل' : 'Quick View'}
              </span>
            </div>
          </div>

          {/* Product Image */}
          <OptimizedImage
            src={imageUrl}
            alt={product.nameAr || product.name || ''}
            className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
          
          {/* Bottom Gradient Overlay */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>
        
        {/* Content */}
        <div className="p-6 flex flex-col flex-1 relative -mt-10 z-10">
          <Card className="p-5 h-full flex flex-col glass-card border-white/10 bg-black/40 backdrop-blur-2xl rounded-[1.5rem] shadow-2xl">
            {/* Category/Brand */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black text-primary tracking-[0.2em] uppercase opacity-90">
                {isRtl ? 'بطاقة رقمية مميزة' : 'PREMIUM DIGITAL'}
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
            </div>
            
            {/* Product Name */}
            <h3 className="font-bold text-lg mb-3 line-clamp-2 text-white group-hover:text-primary transition-colors leading-snug min-h-[3.5rem]">
              {isRtl ? (product.nameAr || product.name) : (product.name || product.nameAr)}
            </h3>
            
            {/* Rating */}
            <div className="flex items-center gap-1.5 mb-5">
              <div className="flex -space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={cn(
                      "h-3 w-3",
                      star <= (product.rating || 4) 
                        ? "fill-yellow-400 text-yellow-400" 
                        : "fill-white/10 text-white/5"
                    )} 
                  />
                ))}
              </div>
              <span className="text-[10px] text-white/30 font-bold tracking-wider">({(product.rating || 4).toFixed(1)})</span>
            </div>
            
            {/* Price & CTA */}
            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white tracking-tighter">
                    {formatCurrency(price, settings?.currency || 'SAR')}
                  </span>
                </div>
                {compareAtPrice > price && (
                  <span className="text-xs text-white/30 line-through font-bold">
                    {formatCurrency(compareAtPrice, settings?.currency || 'SAR')}
                  </span>
                )}
              </div>
              
              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={isAdding}
                className={cn(
                  "h-11 px-5 rounded-2xl font-black transition-all duration-500",
                  "gradient-primary text-white hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] hover:scale-105",
                  "active:scale-95 border-none shadow-lg"
                )}
              >
                <ShoppingCart className="h-4.5 w-4.5 ml-2" />
                {isAdding ? '...' : (isRtl ? 'شراء' : 'Buy')}
              </Button>
            </div>
          </Card>
        </div>
        
        {/* Decorative Corner */}
        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary/20 rounded-tl-[3rem] border-t border-l border-primary/30 pointer-events-none group-hover:scale-150 transition-transform duration-700" />
      </div>
    </Link>
  );
};
