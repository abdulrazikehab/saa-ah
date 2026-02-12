import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, ShoppingBag, Check, Package } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Product } from '@/services/types';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency-utils';

interface MobileProductCardProps {
  product: Product;
  config?: any;
}

export function MobileProductCard({ product, config = {} }: MobileProductCardProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { cart, addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const enableGlass = (config as any).enableGlassEffect;
  const primaryColor = config.primaryColor || '#000000';
  const cornerRadius = config.cornerRadius || '1rem';
  
  const pName = product.nameAr || product.name || 'Product';
  const pPrice = product.price || 0;
  
  const pImg = product.image || (product.images && product.images[0]) || '';
  const imgSrc = typeof pImg === 'string' ? pImg : (pImg as any).url || (pImg as any).imageUrl || '';
  
  const inWishlist = isInWishlist(product.id);
  const inCart = cart?.items?.some(item => item.productId === product.id) || false;

  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product.id, 1);
  };

  // Values based on glass mode
  const bgClass = enableGlass 
    ? "bg-white/10 backdrop-blur-md border border-white/20 shadow-lg text-white" 
    : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-foreground";
    
  const textClass = enableGlass
    ? "text-white"
    : "dark:text-gray-100 text-gray-900";

  const labelClass = enableGlass
    ? "text-white/60"
    : "text-gray-400";

  return (
    <div 
      className={`rounded-xl overflow-hidden shadow-sm flex flex-col group cursor-pointer active:scale-[0.98] transition-all relative h-full ${bgClass}`} 
      style={{ borderRadius: cornerRadius }}
      onClick={() => navigate(`/products/${product.id}`)}
    >
      {/* Favorite Button */}
      <button 
        onClick={toggleWishlist}
        className={`absolute top-2 right-2 z-10 p-2 rounded-full shadow-sm backdrop-blur-md transition-colors ${inWishlist ? 'bg-red-50 text-red-500' : 'bg-white/80 text-gray-400 hover:text-red-500'}`}
      >
        <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} className={inWishlist ? 'animate-pulse' : ''} />
      </button>

      {/* Product Image */}
      <div className={`aspect-[4/5] relative flex items-center justify-center overflow-hidden ${enableGlass ? 'bg-white/5' : 'bg-gray-50 dark:bg-gray-900'}`}>
        {imgSrc ? (
          <img src={imgSrc} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" alt={pName} />
        ) : (
          <Package className={`w-8 h-8 ${enableGlass ? 'text-white/30' : 'text-gray-200'}`} />
        )}
        
        {/* Quick Add to Cart Button on Image Overlay for better accessibility */}
        <div className="absolute bottom-2 left-2 right-2">
            <Button 
                onClick={handleAddToCart}
                className="w-full h-9 rounded-lg shadow-lg text-[11px] font-black uppercase tracking-wider gap-1.5 active:scale-95 transition-all outline-none border-none"
                style={{ 
                    backgroundColor: inCart ? '#22c55e' : primaryColor,
                    color: '#fff'
                }}
            >
                {inCart ? (
                    <><Check size={14} /> {isRTL ? 'في السلة' : 'In Cart'}</>
                ) : (
                    <><ShoppingBag size={14} /> {isRTL ? 'إضافة' : 'Add Card'}</>
                )}
            </Button>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-3 flex flex-col flex-1">
        <h4 className={`font-bold text-xs line-clamp-2 mb-1 h-8 ${textClass}`}>
            {pName}
        </h4>
        <div className="mt-auto flex items-end justify-between gap-1">
            <div className="flex flex-col">
                <span className={`text-[10px] font-bold uppercase tracking-tighter leading-none mb-0.5 ${labelClass}`}>Price</span>
                <span className="font-black text-sm" style={{ color: enableGlass ? 'white' : primaryColor }}>
                    {formatCurrency(pPrice, config.currency || 'SAR')}
                </span>
            </div>
            
            {/* Optional badge or small info */}
            {product.stock !== undefined && product.stock < 10 && product.stock > 0 && (
                <span className="text-[8px] font-black bg-orange-50 text-orange-500 px-1.5 py-0.5 rounded uppercase tracking-widest">Low Stock</span>
            )}
        </div>
      </div>
    </div>
  );
}
