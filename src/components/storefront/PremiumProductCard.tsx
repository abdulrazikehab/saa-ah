import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Eye, Star, Zap } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { formatCurrency } from '@/lib/currency-utils';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';

interface Product {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  categoryAr: string;
  rating?: number;
  reviews?: number;
  badge?: 'new' | 'hot' | 'sale' | 'exclusive';
  instant?: boolean;
}

interface ProductCardProps {
  product: Product;
  language?: 'ar' | 'en';
  onAddToCart?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
}

export function PremiumProductCard({ 
  product, 
  language = 'ar',
  onAddToCart,
  onQuickView 
}: ProductCardProps) {
  const { settings } = useStoreSettings();
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'new': return 'bg-green-500';
      case 'hot': return 'bg-red-500';
      case 'sale': return 'bg-orange-500';
      case 'exclusive': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getBadgeText = (badge?: string) => {
    if (!badge) return '';
    const badges = {
      new: { ar: 'جديد', en: 'NEW' },
      hot: { ar: 'رائج', en: 'HOT' },
      sale: { ar: 'تخفيض', en: 'SALE' },
      exclusive: { ar: 'حصري', en: 'EXCLUSIVE' }
    };
    return badges[badge as keyof typeof badges]?.[language] || '';
  };

  return (
    <Card
      className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-purple-500 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-purple-900/20 to-pink-900/20">
        <OptimizedImage
          src={product.image}
          alt={language === 'ar' ? product.nameAr : product.name}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isHovered ? 'scale-110' : 'scale-100'
          }`}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.badge && (
            <Badge className={`${getBadgeColor(product.badge)} text-white font-bold px-3 py-1 shadow-lg`}>
              {getBadgeText(product.badge)}
            </Badge>
          )}
          {discount > 0 && (
            <Badge className="bg-red-500 text-white font-bold px-3 py-1 shadow-lg">
              -{discount}%
            </Badge>
          )}
          {product.instant && (
            <Badge className="bg-green-500 text-white font-bold px-2 py-1 shadow-lg flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {language === 'ar' ? 'فوري' : 'Instant'}
            </Badge>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-all group/fav"
        >
          <Heart
            className={`h-5 w-5 transition-all ${
              isFavorite 
                ? 'fill-red-500 text-red-500' 
                : 'text-white group-hover/fav:text-red-500'
            }`}
          />
        </button>

        {/* Quick Actions (Show on Hover) */}
        <div
          className={`absolute inset-x-0 bottom-0 p-4 flex items-center gap-2 transition-all duration-300 ${
            isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          }`}
        >
          <Button
            onClick={() => onAddToCart?.(product)}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold shadow-lg"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {language === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
          </Button>
          <Button
            onClick={() => onQuickView?.(product)}
            size="icon"
            variant="outline"
            className="bg-white/10 backdrop-blur-sm border-white/30 hover:bg-white/20"
          >
            <Eye className="h-4 w-4 text-white" />
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        {/* Category */}
        <p className="text-xs text-purple-400 font-semibold uppercase tracking-wider">
          {language === 'ar' ? product.categoryAr : product.category}
        </p>

        {/* Product Name */}
        <h3 className="text-white font-bold text-lg line-clamp-2 min-h-[3.5rem]">
          {language === 'ar' ? product.nameAr : product.name}
        </h3>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating!)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
            {product.reviews && (
              <span className="text-xs text-gray-400">
                ({product.reviews})
              </span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            {formatCurrency(product.price, settings?.currency || 'SAR')}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-500 line-through">
              {formatCurrency(product.originalPrice, settings?.currency || 'SAR')}
            </span>
          )}
        </div>

        {/* Payment Methods */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
          <div className="flex items-center gap-1">
            <div className="px-2 py-0.5 bg-blue-600 rounded text-[10px] font-bold text-white">VISA</div>
            <div className="px-2 py-0.5 bg-orange-600 rounded text-[10px] font-bold text-white">MASTER</div>
            <div className="px-2 py-0.5 bg-green-600 rounded text-[10px] font-bold text-white">MADA</div>
          </div>
        </div>
      </div>

      {/* Glow Effect on Hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-pink-500/0 pointer-events-none transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </Card>
  );
}
