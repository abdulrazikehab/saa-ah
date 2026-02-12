import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { coreApi } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMobileTenantId } from '@/lib/storefront-utils';
import { formatCurrency } from '@/lib/currency-utils';

export default function MobileCart() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  
  // Retrieve context configuration from MobileLayout (moved up to fix Hook rule)
  const { appConfig: contextAppConfig } = useOutletContext<{ appConfig: any }>() || {};

  const { cart, updateQuantity, removeItem, loading: cartLoading } = useCart();
  
  const [appConfig, setAppConfig] = useState<any>(null);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    const tenantId = getMobileTenantId();
    coreApi.get(tenantId ? `/app-builder/config?tenantId=${tenantId}` : '/app-builder/config')
      .then(res => setAppConfig(res.config || res))
      .catch(console.error)
      .finally(() => setConfigLoading(false));
  }, []);

  // Design Helpers
  // Prioritize context config (live preview) over local state (initial fetch)
  const config = contextAppConfig || appConfig || {};

  if (configLoading && !config.pages) return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mx-auto"></div></div>;
  const primaryColor = config.primaryColor || '#000000';
  const secondaryColor = config.secondaryColor || primaryColor;
  const cornerRadius = config.cornerRadius || '1rem';
  const currency = config.currency || 'SAR';

  // Helper to get dynamic page title
  const getPageTitle = (pageId: string) => {
    // Check config.pages for the page ID
    const page = config.pages?.find((p: any) => p.id === pageId);
    if (!page) return null;
    return isRTL ? (page.titleAr || page.title) : page.title;
  };

  // Calculations
  const cartItems = cart?.items || [];
  const subtotal = cartItems.reduce((acc, item) => acc + (Number(item.price || item.product?.price || 0) * item.quantity), 0);
  const shipping = subtotal > 200 ? 0 : 25; // Simple mock logic if not available
  const total = subtotal + shipping;


  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pt-4 pb-32 px-4 bg-background min-h-screen">
         {/* Header */}
         <div className="flex items-center justify-between mb-6">
           <h2 className="text-xl font-bold text-foreground">
              {getPageTitle('cart') || (isRTL ? 'سلة التسوق' : 'Shopping Cart')}
           </h2>
           <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
             {cartItems.length} {isRTL ? 'منتجات' : 'items'}
           </span>
         </div>
         
         <div className="space-y-3">
            {cartItems.map((item) => (
              <div 
                key={item.id} 
                className="relative overflow-hidden bg-card rounded-2xl shadow-md border border-border transition-all hover:shadow-lg"
                style={{ borderRadius: cornerRadius }}
              >
                {/* Gradient accent line */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }}
                />
                
                <div className="flex gap-3 p-3 pt-4">
                   {/* Product Image */}
                   <div 
                     className="w-20 h-20 rounded-xl overflow-hidden shrink-0 shadow-inner ring-1 ring-black/5"
                     style={{ borderRadius: `calc(${cornerRadius} - 4px)` }}
                   >
                     {item.product?.images?.[0]?.url || item.product?.image || typeof item.product?.images?.[0] === 'string' ? (
                        <img 
                            src={typeof item.product?.images?.[0] === 'string' ? item.product.images[0] : (item.product?.images?.[0]?.url || item.product?.image)}
                            className="w-full h-full object-cover" 
                            alt="" 
                        />
                     ) : (
                         <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground"><Package /></div>
                     )}
                   </div>
                   
                   {/* Product Details */}
                   <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                         <h4 className="font-bold text-sm line-clamp-1 text-foreground">
                           {isRTL ? (item.product?.nameAr || item.product?.name) : item.product?.name}
                         </h4>
                      </div>
                      
                       <div className="flex justify-between items-center mt-2">
                          {/* Price */}
                          <div className="flex flex-col">
                            <span 
                              className="font-bold text-base"
                              style={{ color: primaryColor }}
                            >
                              {formatCurrency(Number(item.price || item.product?.price || 0) * item.quantity, currency)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                                {formatCurrency(Number(item.price || item.product?.price || 0), currency)} x {item.quantity}
                            </span>
                          </div>
                          
                          {/* Quantity Controls & Delete */}
                          <div className="flex items-center gap-2">
                             <div 
                               className="flex items-center gap-0 rounded-full overflow-hidden shadow-sm border px-1"
                               style={{ borderColor: primaryColor + '30' }}
                             >
                               <button 
                                 className="w-7 h-7 flex items-center justify-center text-base font-bold transition-colors hover:bg-muted rounded-l-full disabled:opacity-50 disabled:cursor-not-allowed"
                                 style={{ color: primaryColor }}
                                 onClick={() => item.quantity <= 1 ? removeItem(item.id) : updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                                 disabled={cartLoading}
                               >
                                 −
                               </button>
                               <span 
                                 className="text-xs font-bold w-6 text-center"
                                 style={{ color: primaryColor }}
                               >
                                 {item.quantity}
                               </span>
                               <button 
                                 className="w-7 h-7 flex items-center justify-center text-base font-bold text-white transition-colors rounded-r-full disabled:opacity-50 disabled:cursor-not-allowed"
                                 style={{ backgroundColor: primaryColor }}
                                 onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                 disabled={cartLoading}
                               >
                                 +
                               </button>
                             </div>

                             <button 
                                onClick={() => removeItem(item.id)}
                                disabled={cartLoading}
                                className="w-8 h-8 rounded-full bg-red-50 dark:bg-destructive/10 text-red-500 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            ))}

            {cartItems.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>{isRTL ? 'السلة فارغة' : 'Your cart is empty'}</p>
                    <Button onClick={() => navigate('/')} variant="link" className="mt-2" style={{ color: primaryColor }}>
                        {isRTL ? 'تصفح المنتجات' : 'Browse Products'}
                    </Button>
                </div>
            )}
         </div>
         
         {/* Order Summary */}
         {cartItems.length > 0 && (
             <div 
               className="mt-6 p-4 rounded-2xl bg-card shadow-lg border border-border mb-6"
               style={{ borderRadius: cornerRadius }}
             >
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  {isRTL ? 'ملخص الطلب' : 'Order Summary'}
                </h3>
                
                <div className="space-y-2">
                   <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span>
                      <span className="font-medium text-foreground">{formatCurrency(subtotal, currency)}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{isRTL ? 'الشحن' : 'Shipping'}</span>
                      <span className="font-medium text-green-600">{isRTL ? 'مجاني' : 'Free'}</span>
                   </div>
                </div>
                
                <div 
                  className="mt-3 pt-3 border-t border-border flex justify-between items-center"
                  style={{ borderColor: primaryColor + '20' }}
                >
                   <span className="font-bold text-foreground">{isRTL ? 'الإجمالي' : 'Total'}</span>
                   <span 
                     className="font-bold text-xl"
                     style={{ color: primaryColor }}
                   >
                     {formatCurrency(total, currency)}
                   </span>
                </div>
                
                <Button 
                   className="w-full h-11 mt-4 font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]" 
                   style={{ 
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      color: '#fff',
                      borderRadius: cornerRadius,
                      boxShadow: `0 4px 14px ${primaryColor}40`
                   }}
                   onClick={() => navigate('/checkout')}
                >
                   {isRTL ? 'إتمام الشراء' : 'Checkout Now'}
                </Button>
             </div>
         )}
    </div>
  );
}
