import React, { useEffect, useState } from 'react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, Package, X, ShoppingCart } from 'lucide-react';
import { coreApi } from '@/lib/api';
import { formatCurrency } from '@/lib/currency-utils';

export default function MobileWishlist() {
  const { items, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeConfig, setActiveConfig] = useState<any>(null);

  useEffect(() => {
    coreApi.get('/app-builder/config').then(res => setActiveConfig(res.config || res)).catch(() => {});
  }, []);

  const primaryColor = activeConfig?.primaryColor || '#000000';

  return (
    <div className="pb-24 bg-background min-h-screen">
      <div className="bg-card p-4 shadow-sm sticky top-0 z-10 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3">
             <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-muted text-foreground">
                <ArrowIcon className="w-5 h-5 rtl:rotate-180" />
             </button>
             <h1 className="text-lg font-bold text-foreground">{t('nav.wishlist', 'Favorites')}</h1>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{items.length} items</span>
      </div>

      <div className="p-4 space-y-4">
        {items.length === 0 ? (
             <div className="text-center py-20 text-muted-foreground">
               <Heart className="h-16 w-16 mx-auto mb-4 opacity-50" />
               <p className="mb-4">{t('wishlist.empty', 'Your wishlist is empty')}</p>
               <Button onClick={() => navigate('/products')} style={{ backgroundColor: primaryColor }} className="text-white">
                 {t('storefront.home.shopNow', 'Shop Now')}
               </Button>
             </div>
        ) : (
           items.map((product) => {
              const img = product.image || product.images?.[0] || '';
              const imgSrc = typeof img === 'string' ? img : (img as any).url || '';

              return (
               <div key={product.id} className="flex gap-4 p-3 bg-card rounded-xl shadow-sm border border-border" onClick={() => navigate(`/product/${product.id}`)}>
                  <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden shrink-0 relative flex items-center justify-center">
                      {imgSrc ? <img src={imgSrc} className="w-full h-full object-cover" alt={product.name} /> : <Package className="text-muted-foreground/50" />}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div className="flex justify-between items-start gap-2">
                          <h3 className="text-sm font-bold line-clamp-2 leading-tight text-foreground">{product.name}</h3>
                          <button 
                             className="text-muted-foreground hover:text-red-500 p-1 -mr-2 -mt-2"
                             onClick={(e) => { e.stopPropagation(); removeFromWishlist(product.id); }}
                          >
                              <X size={18} />
                          </button>
                      </div>
                      
                      <div className="flex items-end justify-between mt-2">
                          <div>
                              <span className="font-bold block" style={{ color: primaryColor }}>{formatCurrency(product.price || (product as any).salePrice || 0, activeConfig?.currency || 'SAR')}</span>
                          </div>
                          <Button 
                             size="sm" 
                             className="h-8 rounded-full px-4 text-xs font-bold shadow-none text-white"
                             style={{ backgroundColor: primaryColor }}
                             onClick={(e) => { 
                                 e.stopPropagation(); 
                                 addToCart(product.id, 1); 
                             }}
                          >
                             <ShoppingCart size={14} className="mr-1" />
                             {t('common.add', 'Add')}
                          </Button>
                      </div>
                  </div>
               </div>
              );
           })
        )}
      </div>
    </div>
  );
}

function ArrowIcon(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="m15 18-6-6 6-6"/>
        </svg>
    )
}
