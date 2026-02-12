import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Loader2,
  ArrowRight,
  Tag,
  Truck,
  Shield,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/contexts/CartContext';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { StorefrontLoading } from '@/components/storefront/StorefrontLoading';
import { formatCurrency } from '@/lib/currency-utils';
import { CartItem, Page } from '@/services/types';
import { SectionRenderer } from '@/components/builder/SectionRenderer';
import { Section } from '@/components/builder/PageBuilder';
import { coreApi } from '@/lib/api';
import { Capacitor } from '@capacitor/core';
import MobileCart from '@/pages/mobile/MobileCart';

// Define helper interface for image properties
interface ImageWithUrl {
  url?: string;
  imageUrl?: string;
  src?: string;
  image?: string;
  path?: string;
}

export default function Cart() {
  const isNativeMode = Capacitor.isNativePlatform() || window.location.href.includes('platform=mobile') || sessionStorage.getItem('isMobilePlatform') === 'true';
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { cart, loading, updateQuantity, removeItem, refreshCart } = useCart();
  const { settings } = useStoreSettings();
  const [couponCode, setCouponCode] = useState('');
  const [customPage, setCustomPage] = useState<Page | null>(null);

  // Fetch custom cart page on mount
  useEffect(() => {
    const fetchCustomPage = async () => {
      try {
        const cartPage = await coreApi.getPageBySlug('cart');
        if (cartPage && cartPage.isPublished && 
            cartPage.content?.sections && 
            Array.isArray(cartPage.content.sections) && 
            cartPage.content.sections.length > 0) {
          setCustomPage(cartPage);
        }
      } catch (e) {
        // No custom page found, continue with default layout
      }
    };
    fetchCustomPage();
  }, []);

  if (isNativeMode) return <MobileCart />;

  const applyCoupon = () => {
    if (!couponCode) return;
    toast({
      title: t('cart.couponCode', 'Coupon Code'),
      description: t('cart.couponApplied', 'Coupon code applied successfully'),
    });
  };

  if (loading) {
    return <StorefrontLoading />;
  }

  // Get cart items - ensure it's always an array
  const cartItems: CartItem[] = Array.isArray(cart?.cartItems) 
    ? cart!.cartItems! 
    : Array.isArray(cart?.items) 
      ? cart!.items 
      : [];
  
  // Filter out invalid items and ensure all items have product data
  const validCartItems = cartItems.filter((item: CartItem) => {
    if (!item || !item.id) {
      return false;
    }
    // Only show items with valid product data
    if (!item.product) {
      // Try to refresh cart to reload product data
      if (item.productId) {
        setTimeout(() => refreshCart(), 1000);
      }
      return false;
    }
    return true;
  });
  
  const isEmpty = !validCartItems || validCartItems.length === 0;
  const subtotal = validCartItems.reduce((sum: number, item: CartItem) => {
    // Priority: 1. unitPriceSnapshot 2. productVariant 3. retailPrice 4. wholesalePrice 5. product.price
    const price = 
      item.unitPriceSnapshot ??
      item.productVariant?.price ?? 
      item.product?.retailPrice ?? 
      item.product?.wholesalePrice ?? 
      item.product?.price ?? 
      0;
    return sum + Number(price) * (item.quantity || 1);
  }, 0) ?? 0;
  
  // Respect settings for shipping and tax
  const isShippingEnabled = settings?.shippingEnabled === true && settings?.storeType !== 'DIGITAL_CARDS';
  const shipping = isShippingEnabled ? (subtotal > 200 ? 0 : 25) : 0;
  
  // Tax calculation (if enabled)
  const isTaxEnabled = settings?.taxEnabled !== false;
  const taxRate = settings?.taxRate ?? 15; // Use tax rate from settings, default to 15%
  const taxAmount = isTaxEnabled ? (subtotal * taxRate / 100) : 0;
  
  const total = subtotal + shipping + taxAmount;

  // If custom page with sections exists, render it
  if (customPage && customPage.content?.sections && Array.isArray(customPage.content.sections)) {
    const sections = customPage.content.sections as Section[];
    return (
      <div className="min-h-screen bg-background">
        {sections.map((section, index) => (
          <SectionRenderer key={section.id || `section-${index}`} section={section} />
        ))}
      </div>
    );
  }

  // Default layout
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {t('nav.cart', 'Shopping Cart')}
          </h1>
          {!isEmpty && (
            <p className="text-muted-foreground text-lg">
              {t('cart.itemsCount', { count: validCartItems.length })}
            </p>
          )}
        </div>

        {isEmpty ? (
          <Card className="p-16 text-center border-0 shadow-lg">
            <ShoppingBag className="h-24 w-24 mx-auto text-gray-400 mb-6" />
            <h2 className="text-3xl font-bold mb-4">{t('cart.emptyTitle', 'Your cart is empty')}</h2>
            <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
              {t('cart.emptyDesc', 'Start shopping now and discover our amazing products')}
            </p>
                <div className="flex flex-col gap-4 items-center justify-center">
                  <div className="flex gap-4">
                    <Link to="/products">
                      <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8">
                        {t('cart.browseProducts', 'Browse Products')}
                        <ArrowRight className="mr-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      onClick={async () => {
                        console.log('🔍 DEBUG: Manual cart refresh triggered');
                        await refreshCart(true);
                        toast({
                          title: 'Debug',
                          description: `Cart refreshed. Items: ${cartItems.length}, Valid: ${validCartItems.length}`,
                        });
                      }}
                      className="px-8"
                    >
                      🔍 Debug Cart
                    </Button>
                  </div>
                  
                  {cartItems.length > 0 && validCartItems.length === 0 && (
                    <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-4 py-2 rounded-lg border border-amber-200 mt-4 max-w-md">
                      ⚠️ {t('cart.dataError', 'Some items are in your cart but product data could not be loaded. This might be due to a store mismatch.')}
                      <br />
                      <span className="text-xs opacity-75">(Total items: {cartItems.length})</span>
                    </p>
                  )}
                </div>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
                  {validCartItems.map((item: CartItem) => {
                    // Ensure product exists
                    if (!item.product) {
                      console.error('❌ Cart item missing product:', item);
                      return null;
                    }
                    
                    const productName = item.product?.nameAr || item.product?.name || 'منتج غير معروف';
                    
                    // Product images can be objects with 'url' property or strings
                    let productImage: string | null = null;

                    if (item.product?.images && item.product.images.length > 0) {
                      const firstImage = item.product.images[0];
                      if (typeof firstImage === 'string') {
                        productImage = firstImage;
                      } else if (firstImage?.url) {
                        productImage = firstImage.url;
                      } else {
                        const img = firstImage as ImageWithUrl;
                        if (img.imageUrl) {
                          productImage = img.imageUrl;
                        } else if (typeof firstImage === 'object' && firstImage !== null) {
                          // Try to find any URL-like property
                          const urlKeys: (keyof ImageWithUrl)[] = ['url', 'imageUrl', 'src', 'image', 'path'];
                          for (const key of urlKeys) {
                            const val = (firstImage as unknown as ImageWithUrl)[key];
                            if (val && typeof val === 'string') {
                              productImage = val;
                              break;
                            }
                          }
                        }
                      }
                    }
                    
                    // Fallback: try to get image from product directly
                    if (!productImage && item.product?.image) {
                      const prodImage = item.product.image as unknown as ImageWithUrl;
                      productImage = typeof item.product.image === 'string' 
                        ? item.product.image 
                        : prodImage?.url || prodImage?.imageUrl;
                    }
                    
                    const productPrice = Number(item.unitPriceSnapshot ?? item.productVariant?.price ?? item.product?.retailPrice ?? item.product?.price ?? 0) || 0;
                    const quantity = Number(item.quantity ?? 1);
                    
                    return (
                      <Card key={item.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                        <div className="p-6">
                          <div className="flex gap-6">
                            {/* Product Image */}
                            <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              {productImage ? (
                                <img
                                  src={productImage}
                                  alt={productName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.error('Failed to load product image:', productImage, 'for product:', item.productId);
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex-1">
                                <h3 className="font-bold text-lg mb-1 text-foreground" title={productName}>
                                  {productName}
                                </h3>
                                {item.product?.sku && (
                                  <p className="text-sm text-muted-foreground font-mono">
                                    SKU: {item.product.sku}
                                  </p>
                                )}
                              </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex-shrink-0"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 border-2"
                              onClick={() => updateQuantity(item.id, quantity - 1)}
                              disabled={quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-bold text-lg">
                              {quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 border-2"
                              onClick={() => updateQuantity(item.id, quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Price */}
                          <div className="text-left">
                            <p className="font-bold text-2xl text-indigo-600">
                              {formatCurrency(productPrice * quantity, settings?.currency || 'SAR')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(productPrice, settings?.currency || 'SAR')} × {quantity}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            }).filter(Boolean)}

              {/* Continue Shopping */}
              <Link to="/products">
                <Button variant="outline" size="lg" className="w-full border-2">
                  <ShoppingCart className="ml-2 h-5 w-5" />
                  {t('cart.continueShopping', 'Continue Shopping')}
                </Button>
              </Link>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-4 border-0 shadow-lg">
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-6">{t('checkout.orderSummary', 'Order Summary')}</h2>

                  {/* Coupon Code */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                      {t('cart.couponCode', 'Coupon Code')}
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder={t('cart.enterCode', 'Enter code')}
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={applyCoupon} variant="outline">
                        {t('common.apply', 'Apply')}
                      </Button>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Price Breakdown */}
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-lg">
                      <span className="text-muted-foreground">{t('cart.subtotal', 'Subtotal')}</span>
                      <span className="font-semibold">{formatCurrency(subtotal, settings?.currency || 'SAR')}</span>
                    </div>
                    {isShippingEnabled && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('cart.shipping', 'Shipping')}</span>
                          <span className="font-semibold">
                            {shipping === 0 ? (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                {t('common.free', 'Free')}
                              </Badge>
                            ) : (
                              formatCurrency(shipping, settings?.currency || 'SAR')
                            )}
                          </span>
                        </div>
                        {shipping > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {t('cart.freeShippingHint', { 
                              amount: formatCurrency(200 - subtotal, settings?.currency || 'SAR'),
                              currency: '' 
                            })}
                          </p>
                        )}
                      </>
                    )}
                    
                    {isTaxEnabled && taxAmount > 0 && (
                      <div className="flex justify-between text-lg">
                        <span className="text-muted-foreground">{t('cart.tax', 'Tax')} ({taxRate}%)</span>
                        <span className="font-semibold">{formatCurrency(taxAmount, settings?.currency || 'SAR')}</span>
                      </div>
                    )}
                  </div>

                  <Separator className="my-6" />

                  {/* Total */}
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xl font-bold">{t('cart.total', 'Total')}</span>
                    <span className="text-3xl font-bold text-indigo-600">
                      {formatCurrency(total, settings?.currency || 'SAR')}
                    </span>
                  </div>

                  {/* Checkout Button */}
                  <Link to="/checkout">
                    <Button 
                      size="lg" 
                      className="w-full h-14 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg mb-4"
                    >
                      {t('cart.checkout', 'Checkout')}
                      <ArrowRight className="mr-2 h-5 w-5" />
                    </Button>
                  </Link>

                  {/* Trust Badges */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span>{t('checkout.securePayment', 'Secure and encrypted payment')}</span>
                    </div>
                    {isShippingEnabled && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Truck className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <span>{t('checkout.fastShipping', 'Fast and reliable shipping')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Tag className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      <span>{t('checkout.bestPrices', 'Best prices guaranteed')}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
