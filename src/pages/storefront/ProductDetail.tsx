import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShoppingCart, ArrowLeft, Heart, Share2, Star, Truck, 
  Shield, RotateCcw, Check, Minus, Plus, Loader2, Package,
  ChevronLeft, ChevronRight, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { useTranslation } from 'react-i18next';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';

import { StorefrontLoading } from '@/components/storefront/StorefrontLoading';
import { ProductCard } from '@/components/storefront/ProductCard';
import { coreApi } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { Product, ProductVariant, ProductImage, Category } from '@/services/types';
import { BRAND_NAME_AR, BRAND_NAME_EN } from '@/config/logo.config';

export default function ProductDetail() {
  const { t, i18n } = useTranslation();
  const { settings } = useStoreSettings();
  const { id, productId } = useParams();
  // Handle both /products/:id and /products/:tenantId/:productId patterns
  const actualProductId = productId || id;
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const { addToCart } = useCart();

  useEffect(() => {
    loadProduct();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualProductId]);

  const loadCategories = async () => {
    try {
      const data = await coreApi.getCategories();
      const list = Array.isArray(data) ? data : ((data as any).categories || []);
      setCategories(list);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadProduct = async () => {
    const isRtl = i18n.language === 'ar';
    try {
      setLoading(true);
      const data = await coreApi.getProduct(actualProductId!);
      console.log('Loaded product data:', data);
      console.log('Product variants from API:', data.variants);
      
      setProduct(data);
      
      if (data.variants && Array.isArray(data.variants) && data.variants.length > 0) {
        console.log('Setting selected variant to:', data.variants[0]);
        setSelectedVariant(data.variants[0]);
      } else {
        console.log('No variants found for this product');
        setSelectedVariant(null);
      }
      
      // Load related products if category exists
      if (data.categoryId) {
        const related = await coreApi.getProducts({ 
          categoryId: data.categoryId,
          limit: 4 
        });
        // Filter out current product
        setRelatedProducts(related.filter((p: Product) => p.id !== data.id).slice(0, 4));
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      toast({
        title: isRtl ? 'تعذر تحميل المنتج' : 'Failed to Load Product',
        description: isRtl 
          ? 'حدث خطأ أثناء تحميل بيانات المنتج. يرجى المحاولة مرة أخرى.'
          : 'An error occurred while loading product data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    const isRtl = i18n.language === 'ar';
    
    try {
      // If product has variants but none is selected, use the first variant automatically
      let variantId = selectedVariant?.id;
      if (product.variants && product.variants.length > 0 && !variantId) {
        variantId = product.variants[0].id;
        // Optionally set the selected variant in state for UI consistency
        setSelectedVariant(product.variants[0]);
      }
      
      await addToCart(product.id, quantity, variantId);
      toast({
        title: isRtl ? 'تمت الإضافة!' : 'Added!',
        description: isRtl 
          ? `تمت إضافة ${product.name} إلى السلة`
          : `${product.name} added to cart`,
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast({
        title: isRtl ? 'تعذرت الإضافة للسلة' : 'Failed to Add to Cart',
        description: isRtl 
          ? 'حدث خطأ أثناء إضافة المنتج للسلة. يرجى المحاولة مرة أخرى.'
          : 'An error occurred while adding the product to cart. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getBreadcrumbs = () => {
    if (!product || !product.categoryId) return [];
    
    const path = [];
    let currentId = product.categoryId;
    
    // Safety break to avoid infinite loops
    let depth = 0;
    while (currentId && depth < 10) {
      const category = categories.find(c => c.id === currentId);
      if (category) {
        path.unshift(category);
        currentId = category.parentId;
      } else {
        break;
      }
      depth++;
    }
    
    return path;
  };

  if (loading) {
    return <StorefrontLoading />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

        <div className="container py-20">
          <Card className="p-12 text-center border-0 shadow-lg">
            <Package className="h-20 w-20 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              {isRtl ? 'المنتج غير موجود' : 'Product Not Found'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {isRtl 
                ? 'عذراً، لم نتمكن من العثور على هذا المنتج'
                : 'Sorry, we couldn\'t find this product'}
            </p>
            <Link to="/products">
              <Button>
                {isRtl ? 'العودة إلى المنتجات' : 'Back to Products'}
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const currentPrice = Number(selectedVariant?.price || product.price) || 0;
  const comparePrice = product.compareAtPrice ? Number(product.compareAtPrice) : 0;
  const discount = comparePrice > currentPrice 
    ? Math.round(((comparePrice - currentPrice) / comparePrice) * 100)
    : 0;

  const images = product.images?.length > 0 
    ? product.images 
    : [{ url: '/placeholder.svg' }];

  const features = [
    { icon: Truck, text: 'شحن مجاني للطلبات فوق 200 ر.س' },
    { icon: Shield, text: 'ضمان استرجاع المال خلال 30 يوم' },
    { icon: RotateCcw, text: 'إرجاع مجاني خلال 14 يوم' },
  ];

  const breadcrumbs = getBreadcrumbs();
  const isRtl = i18n.language === 'ar';
  const SeparatorIcon = isRtl ? ChevronLeft : ChevronRight;

  const handleShare = async () => {
    const shareData = {
      title: product.nameAr || product.name,
      text: product.descriptionAr || product.description,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: isRtl ? 'تم نسخ الرابط' : 'Link Copied',
          description: isRtl ? 'تم نسخ رابط المنتج إلى الحافظة' : 'Product link copied to clipboard',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-fade-in">

      <div className="container py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center flex-wrap gap-2 text-sm">
          <Link 
            to="/" 
            className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
          >
            {isRtl 
              ? (settings?.storeNameAr || settings?.storeName || BRAND_NAME_AR) 
              : (settings?.storeName || BRAND_NAME_EN)}
          </Link>
          
          <SeparatorIcon className="h-4 w-4 text-gray-400" />
          
          {breadcrumbs.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2">
              <Link 
                to={`/categories/${cat.id}`}
                className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {isRtl ? (cat.nameAr || cat.name) : (cat.name || cat.nameAr)}
              </Link>
              <SeparatorIcon className="h-4 w-4 text-gray-400" />
            </div>
          ))}
          
          <span className="text-indigo-600 font-medium truncate max-w-[200px]">
            {isRtl ? (product.nameAr || product.name) : (product.name || product.nameAr)}
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Image Gallery */}
          <div className="space-y-4 animate-slide-in-left">
            {/* Main Image */}
            <Card className="overflow-hidden border-0 shadow-xl relative group">
              {discount > 0 && (
                <Badge className="absolute top-4 right-4 z-10 bg-red-500 text-white px-3 py-1 text-sm font-bold animate-pulse">
                  خصم {discount}%
                </Badge>
              )}
              <img
                src={images[selectedImage]?.url}
                alt={product.name}
                className="w-full h-[500px] object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setSelectedImage((selectedImage - 1 + images.length) % images.length)}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setSelectedImage((selectedImage + 1) % images.length)}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
            </Card>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {images.map((img: ProductImage, idx: number) => (
                  <Card
                    key={idx}
                    className={`overflow-hidden cursor-pointer transition-all border-2 ${
                      selectedImage === idx
                        ? 'border-indigo-600 shadow-lg scale-105'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <img
                      src={img.url}
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-20 object-cover"
                    />
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8 animate-slide-in-right">
            {/* Title & Price */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                {isRtl ? (product.nameAr || product.name) : (product.name || product.nameAr)}
              </h1>
              
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-4xl font-bold text-indigo-600">
                  {Number(currentPrice || 0).toFixed(2)} {isRtl ? 'ر.س' : (settings?.currency || 'SAR')}
                </span>
                {comparePrice > 0 && Number(comparePrice) > Number(currentPrice) && (
                  <span className="text-2xl text-gray-500 line-through">
                    {Number(comparePrice).toFixed(2)} {isRtl ? 'ر.س' : (settings?.currency || 'SAR')}
                  </span>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < 4
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  4.5 (128 {isRtl ? 'تقييم' : 'reviews'})
                </span>
              </div>

              {/* Availability */}
              <div className="flex items-center gap-2">
                {product.isAvailable ? (
                  <>
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">
                      {isRtl ? 'متوفر في المخزون' : 'In Stock'}
                    </span>
                  </>
                ) : (
                  <Badge variant="destructive">
                    {isRtl ? 'غير متوفر' : 'Out of Stock'}
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h3 className="font-semibold text-lg mb-3">
                {isRtl ? 'الوصف' : 'Description'}
              </h3>
              <div 
                className="text-gray-600 dark:text-gray-400 leading-relaxed prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: isRtl 
                    ? (product.descriptionAr || product.description || 'لا يوجد وصف متاح لهذا المنتج.')
                    : (product.description || product.descriptionAr || 'No description available for this product.')
                }}
              />
            </div>

            {/* Additional Info (Weight, Dimensions, Tags) */}
            {(product.weight || product.dimensions || (product.tags && product.tags.length > 0)) && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-lg mb-2">
                  {isRtl ? 'معلومات إضافية' : 'Additional Information'}
                </h3>
                {product.weight && (
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      {isRtl ? 'الوزن' : 'Weight'}
                    </span>
                    <span className="font-medium">
                      {product.weight} {isRtl ? 'كجم' : 'kg'}
                    </span>
                  </div>
                )}
                {product.dimensions && (
                  <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      {isRtl ? 'الأبعاد' : 'Dimensions'}
                    </span>
                    <span className="font-medium">{product.dimensions}</span>
                  </div>
                )}
                {product.tags && product.tags.length > 0 && (
                  <div className="pt-2">
                    <span className="text-gray-600 dark:text-gray-400 block mb-2">
                      {isRtl ? 'الوسوم' : 'Tags'}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="bg-white dark:bg-gray-700">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Variants */}
            {product.variants?.length > 0 && 
             product.variants.some((variant: ProductVariant) => 
               variant.name?.toLowerCase() !== 'default' && 
               variant.name?.toLowerCase() !== 'افتراضي'
             ) && (
              <div>
                <label className="block font-semibold text-lg mb-3">
                  {isRtl ? 'الخيارات' : 'Options'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {product.variants
                    .filter((variant: ProductVariant) => 
                      variant.name?.toLowerCase() !== 'default' && 
                      variant.name?.toLowerCase() !== 'افتراضي'
                    )
                    .map((variant: ProductVariant) => (
                      <Button
                        key={variant.id}
                        variant={selectedVariant?.id === variant.id ? 'default' : 'outline'}
                        onClick={() => setSelectedVariant(variant)}
                        className={`h-12 border-2 ${selectedVariant?.id === variant.id ? 'border-indigo-600' : ''}`}
                      >
                        {variant.name}
                      </Button>
                    ))}
                </div>
              </div>
            )}

            {/* Quantity Slider */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="font-semibold text-lg">
                  {isRtl ? 'الكمية' : 'Quantity'}
                </label>
                <span className="text-xl font-bold text-indigo-600">{quantity}</span>
              </div>
              
              <div className="py-4">
                <Slider
                  defaultValue={[1]}
                  value={[quantity]}
                  min={1}
                  max={product.stock || 50}
                  step={1}
                  disabled={!product.isActive}
                  onValueChange={(vals) => setQuantity(vals[0])}
                  className={`py-4 ${!product.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {!product.isActive && (
                  <p className="text-sm text-red-500 mt-2">
                    {isRtl 
                      ? 'لا يمكن تغيير الكمية لهذا المنتج (قيمة ثابتة)'
                      : 'Cannot change quantity for this product (fixed value)'}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 h-14 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg transition-all transform hover:scale-[1.02]"
                onClick={async (e) => {
                  const btn = e.currentTarget;
                  const originalContent = btn.innerHTML;
                  btn.innerHTML = '<span class="flex items-center gap-2"><div class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div> جاري الإضافة...</span>';
                  btn.setAttribute('disabled', 'true');
                  
                  await handleAddToCart();
                  
                  btn.innerHTML = '<span class="flex items-center gap-2">✓ تمت الإضافة</span>';
                  btn.classList.add('bg-green-600', 'hover:bg-green-700');
                  btn.classList.remove('from-indigo-600', 'to-purple-600');
                  
                  setTimeout(() => {
                    btn.innerHTML = originalContent;
                    btn.removeAttribute('disabled');
                    btn.classList.remove('bg-green-600', 'hover:bg-green-700');
                    btn.classList.add('from-indigo-600', 'to-purple-600');
                  }, 2000);
                }}
                disabled={!product.isAvailable}
              >
                <ShoppingCart className="ml-2 h-5 w-5" />
                {product.isAvailable 
                  ? (isRtl ? 'أضف إلى السلة' : 'Add to Cart')
                  : (isRtl ? 'غير متوفر' : 'Out of Stock')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className={`h-14 w-14 border-2 ${
                  isWishlisted ? 'text-red-500 border-red-500' : ''
                }`}
                onClick={() => setIsWishlisted(!isWishlisted)}
              >
                <Heart className={`h-6 w-6 ${isWishlisted ? 'fill-current' : ''}`} />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 w-14 border-2"
                onClick={handleShare}
              >
                <Share2 className="h-6 w-6" />
              </Button>
            </div>

            {/* Features - Hide for digital stores as they don't have delivery/returns */}
            {settings?.storeType !== 'DIGITAL_CARDS' && (
              <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-0">
                <div className="space-y-4">
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <feature.icon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* SKU */}
            {product.sku && (
              <p className="text-sm text-gray-500">
                {isRtl ? 'رمز المنتج:' : 'Product Code:'} <span className="font-mono">{product.sku}</span>
              </p>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-2xl font-bold mb-8">
              {isRtl ? 'منتجات قد تعجبك' : 'You May Also Like'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-slide-in-left { animation: slide-in-left 0.6s ease-out; }
        .animate-slide-in-right { animation: slide-in-right 0.6s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
}
