import { ShoppingCart, Eye, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

import { Product } from '@/services/types';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

export const ProductCard = ({ product, viewMode = 'grid' }: ProductCardProps) => {
  const { addToCart } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAdding) return;
    
    // If product has variants, user should go to product detail page to select variant
    if (product.variants && product.variants.length > 0) {
      toast({
        title: 'تنبيه',
        description: 'الرجاء الانتقال لصفحة المنتج لاختيار الخيارات',
        variant: 'default',
      });
      return;
    }
    
    setIsAdding(true);
    try {
      await addToCart(product.id, 1);
      toast({
        title: 'تمت الإضافة!',
        description: `تمت إضافة ${product.name} إلى السلة`,
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
      title: isWishlisted ? 'تمت الإزالة' : 'تمت الإضافة',
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
      <Link to={`/products/${product.id}`} className="block group">
        <Card className="overflow-hidden border-2 hover:border-primary/50 hover:shadow-2xl transition-all duration-300 bg-white dark:bg-gray-900">
          <div className="flex gap-6 p-6">
            <div className="relative w-48 h-48 flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-xl">
              {discount > 0 && (
                <Badge className="absolute top-3 right-3 z-10 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 text-sm font-bold shadow-lg">
                  خصم {discount}%
                </Badge>
              )}
              <img
                src={imageUrl}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-2xl mb-3 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                    {product.description}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {price.toFixed(2)} ر.س
                  </span>
                  {compareAtPrice > price && (
                    <span className="text-xl text-gray-400 line-through">
                      {compareAtPrice.toFixed(2)} ر.س
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleToggleWishlist}
                    className={`border-2 transition-all ${
                      isWishlisted 
                        ? 'bg-red-50 border-red-500 text-red-500' 
                        : 'hover:bg-red-50 hover:border-red-500 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {isAdding ? 'جاري الإضافة...' : 'أضف للسلة'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link to={`/products/${product.id}`} className="block group">
      <Card className="overflow-hidden border-2 hover:border-primary/50 hover:shadow-2xl transition-all duration-300 bg-white dark:bg-gray-900 h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
          {discount > 0 && (
            <Badge className="absolute top-3 right-3 z-10 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1.5 text-sm font-bold shadow-lg animate-pulse">
              خصم {discount}%
            </Badge>
          )}
          
          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-3 left-3 z-10 p-2.5 rounded-full backdrop-blur-sm transition-all ${
              isWishlisted 
                ? 'bg-red-500 text-white' 
                : 'bg-white/90 text-gray-700 hover:bg-red-500 hover:text-white'
            }`}
          >
            <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>

          {/* Quick View Button */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="gap-2 bg-white/95 hover:bg-white shadow-xl"
            >
              <Eye className="h-5 w-5" />
              عرض سريع
            </Button>
          </div>

          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
        
        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors min-h-[3.5rem]">
            {product.name}
          </h3>
          
          <div className="mt-auto">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {price.toFixed(2)} ر.س
              </span>
              {compareAtPrice > price && (
                <span className="text-sm text-gray-400 line-through">
                  {compareAtPrice.toFixed(2)} ر.س
                </span>
              )}
            </div>
            
            <Button
              size="lg"
              onClick={handleAddToCart}
              disabled={isAdding}
              className="w-full gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transition-all"
            >
              <ShoppingCart className="h-5 w-5" />
              {isAdding ? 'جاري الإضافة...' : 'أضف للسلة'}
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
};
