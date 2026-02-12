import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { coreApi } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Share2, Heart, ShoppingCart, Check } from 'lucide-react';
import { Product } from '@/services/types';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getMobileTenantId } from '@/lib/storefront-utils';
import { formatCurrency } from '@/lib/currency-utils';

export default function MobileProduct() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [appConfig, setAppConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isFavourite, setIsFavourite] = useState(false);

  // Live Preview Sync: Listen for configuration updates from App Builder
  useEffect(() => {
    const handleSync = (event: MessageEvent) => {
      if (event.data?.type === 'APP_BUILDER_CONFIG_SYNC' && event.data?.config) {
        console.log('MobileProduct: Received config sync', event.data.config);
        setAppConfig(event.data.config);
      }
    };

    window.addEventListener('message', handleSync);
    
    // Signal that the preview is ready to receive config
    window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');

    return () => window.removeEventListener('message', handleSync);
  }, []);

  useEffect(() => {
    const load = async () => {
        try {
            const tenantId = getMobileTenantId();
            const [configRes, productRes] = await Promise.all([
                coreApi.get(tenantId ? `/app-builder/config?tenantId=${tenantId}` : '/app-builder/config'),
                coreApi.getProduct(id!)
            ]);
            setAppConfig(configRes.config || configRes);
            
            // Handle product response variations
            const res = productRes as any;
            let loadedProduct: Product | null = null;
            if (res?.data) loadedProduct = res.data;
            else if (res?.product) loadedProduct = res.product;
            else loadedProduct = res;
            
            setProduct(loadedProduct);
            if (loadedProduct) {
                setIsFavourite(isInWishlist(loadedProduct.id));
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    if (id) load();
  }, [id, isInWishlist]);

  if (loading || !product || !appConfig) return (
      <div className="flex justify-center items-center min-vh-screen">
         <div className="animate-spin h-8 w-8 border-2 border-gray-900 rounded-full border-t-transparent" />
      </div>
  );

  const config = appConfig;
  const primaryColor = config.primaryColor || '#000000';
  const cornerRadius = config.cornerRadius || '1rem';
  
  const pName = product.nameAr || product.name;
  const pDesc = product.descriptionAr || product.description;
  const pPrice = product.price || 0;
  
  // Handle image resolution
  let pImage = '';
  if (product.images && product.images.length > 0) {
      const first = product.images[0];
      if (typeof first === 'string') pImage = first;
      else if (typeof first === 'object' && (first as any).url) pImage = (first as any).url;
  } else if (product.image) {
      if (typeof product.image === 'string') pImage = product.image;
      else if ((product.image as any).url) pImage = (product.image as any).url;
  }

  const handleAddToCart = async () => {
      setAdding(true);
      try {
          await addToCart(product.id, quantity);
          toast({
            title: isRTL ? '✅ تمت الإضافة' : '✅ Added to Cart',
            description: isRTL ? 'تمت إضافة المنتج إلى سلة التسوق بنجاح' : 'Product successfully added to your cart',
          });
      } catch (e) {
          console.error(e);
          toast({
            variant: "destructive",
            title: isRTL ? '❌ فشل الطلب' : '❌ Failed',
            description: isRTL ? 'تعذر إضافة المنتج، يرجى المحاولة لاحقاً' : 'Could not add product, please try again',
          });
      } finally {
          setAdding(false);
      }
  };

  const handleToggleFavourite = () => {
    if (isFavourite) {
      removeFromWishlist(product.id);
      setIsFavourite(false);
    } else {
      addToWishlist(product);
      setIsFavourite(true);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: pName,
      text: pDesc?.replace(/<[^>]*>?/gm, '').substring(0, 100) + '...',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: isRTL ? '📋 تم النسخ' : '📋 Copied!',
          description: isRTL ? 'تم نسخ الرابط إلى الحافظة' : 'Link copied to clipboard',
        });
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };


  return (
    <div className="bg-white min-h-screen pb-24 relative overflow-x-hidden">
        {/* Header Actions (Floating) */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-10 pt-safe-top">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm">
                <ChevronLeft className={`w-6 h-6 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
            <div className="flex gap-2">
                <button 
                  onClick={handleToggleFavourite}
                  className={`w-10 h-10 backdrop-blur rounded-full flex items-center justify-center shadow-sm transition-all ${isFavourite ? 'bg-red-50 text-red-500' : 'bg-white/80 text-gray-600'}`}
                >
                    <Heart className={`w-5 h-5 ${isFavourite ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={handleShare}
                  className="w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-gray-600"
                >
                    <Share2 className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* Image */}
        <div className="aspect-square bg-gray-100 relative">
            {pImage ? (
              <img src={pImage} className="w-full h-full object-cover" alt={pName} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <ShoppingCart className="w-16 h-16 text-gray-200" />
              </div>
            )}
        </div>

        {/* Content (Sheet style) */}
        <div className="bg-white rounded-t-[30px] -mt-8 relative z-0 px-6 pt-8 pb-4 space-y-4 min-h-[50vh] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto" />
            
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{pName}</h1>
                <div className="flex items-center gap-3 mt-2">
                    <span className="text-2xl font-extrabold" style={{ color: primaryColor }}>
                        {formatCurrency(pPrice, config.currency || 'SAR')}
                    </span>
                    {product.compareAtPrice && product.compareAtPrice > pPrice && (
                        <span className="text-sm text-gray-400 line-through">
                            {formatCurrency(product.compareAtPrice, config.currency || 'SAR')}
                        </span>
                    )}
                </div>
            </div>

            <div className="py-4">
                <h3 className="font-bold text-sm mb-3 text-gray-900 uppercase tracking-wider">{isRTL ? 'الوصف' : 'Description'}</h3>
                <div 
                    className="text-gray-600 text-sm leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: pDesc || `<p>${isRTL ? 'لا يوجد وصف متاح لهذا المنتج.' : 'No description available for this product.'}</p>` }}
                />
            </div>
        </div>

        {/* Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-100 safe-area-bottom z-30">
            <div className="flex items-center gap-4 mb-4">
               <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl p-1 shadow-inner">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 active:scale-95 transition-transform"
                  >
                    <span className="text-xl font-bold">−</span>
                  </button>
                  <span className="w-10 text-center font-bold text-gray-900">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-10 h-10 flex items-center justify-center text-gray-600 active:scale-95 transition-transform"
                  >
                    <span className="text-xl font-bold">+</span>
                  </button>
               </div>
               <div className="text-xs text-gray-400 font-medium">
                  {isRTL ? 'الكمية المختارة' : 'Selected quantity'}
               </div>
            </div>

            <Button 
                className="w-full h-14 text-lg font-bold shadow-xl transition-all active:scale-[0.98]"
                style={{ 
                    backgroundColor: primaryColor,
                    borderRadius: cornerRadius,
                    boxShadow: `0 10px 25px -5px ${primaryColor}40`
                }}
                onClick={handleAddToCart}
                disabled={adding}
            >
                {adding ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent" />
                    <span>{isRTL ? 'جاري الإضافة...' : 'Adding...'}</span>
                  </div>
                ) : (
                    <div className="flex items-center justify-center gap-3">
                        <ShoppingCart className="w-6 h-6" />
                        <span>{isRTL ? 'إضافة للسلة' : 'Add to Cart'}</span>
                    </div>
                )}
            </Button>
        </div>
    </div>
  );
}
