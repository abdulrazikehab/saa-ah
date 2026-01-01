import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShoppingCart, ArrowLeft, Heart, Share2, Star, 
  Shield, Check, Minus, Plus, Loader2, Package,
  ChevronLeft, ChevronRight, Tag, Download, FileText,
  Clock, Award, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubMarketProductCard } from '@/components/submarket/SubMarketProductCard';
import { coreApi } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { toast } from '@/hooks/use-toast';
import { Product, ProductVariant, ProductImage } from '@/services/types';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';

export default function SubMarketProductDetail() {
  const { t } = useTranslation();
  const { settings } = useStoreSettings();
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data = await coreApi.getProduct(id!);
      
      setProduct(data);
      
      if (data.variants && Array.isArray(data.variants) && data.variants.length > 0) {
        setSelectedVariant(data.variants[0]);
      } else {
        setSelectedVariant(null);
      }
      
      // Load related products
      if (data.categoryId) {
        const related = await coreApi.getProducts({ 
          categoryId: data.categoryId,
          limit: 4 
        });
        setRelatedProducts(related.filter((p: Product) => p.id !== data.id).slice(0, 4));
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      toast({
        title: 'Error',
        description: 'Failed to load product details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      toast({
        title: 'Select Options',
        description: 'Please select product options before adding to cart',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const variantId = selectedVariant?.id;
      await addToCart(product.id, quantity, variantId);
      toast({
        title: 'Added!',
        description: `${product.name} added to cart`,
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast({
        title: 'Error',
        description: 'Failed to add product to cart',
        variant: 'destructive',
      });
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    // Navigate to checkout
    window.location.href = '/checkout';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background py-20">
        <div className="container mx-auto">
          <Card className="p-12 text-center">
            <Package className="h-20 w-20 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
            <p className="text-muted-foreground mb-6">
              Sorry, we couldn't find this product
            </p>
            <Button asChild>
              <Link to="/products">Back to Products</Link>
            </Button>
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

  const rating = (product as any).rating || 4.5;
  const reviewCount = (product as any).reviewCount || 128;

  const features = [
    { icon: Zap, text: 'Instant Delivery' },
    { icon: Shield, text: '100% Secure' },
    { icon: Award, text: 'Money Back Guarantee' },
    { icon: Clock, text: '24/7 Support' },
  ];

  const whatsIncluded = [
    'Digital Card Code',
    'Instant Email Delivery',
    'Lifetime Validity',
    'Full Support',
  ];

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: product.description,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link Copied',
          description: 'Product link copied to clipboard',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.back', 'Back')}
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Image Gallery */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Main Image */}
            <Card className="overflow-hidden border-2 shadow-xl relative group">
              {discount > 0 && (
                <Badge className="absolute top-4 right-4 z-10 bg-red-500 text-white px-3 py-1 text-sm font-bold">
                  <Tag className="h-3 w-3 mr-1" />
                  -{discount}%
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setSelectedImage((selectedImage - 1 + images.length) % images.length)}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
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
                        ? 'border-primary shadow-lg scale-105'
                        : 'border-transparent hover:border-muted-foreground/30'
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
          </motion.div>

          {/* Product Info */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Title & Price */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-4xl font-bold text-primary">
                  {currentPrice.toFixed(2)} {settings?.currency || 'SAR'}
                </span>
                {comparePrice > 0 && Number(comparePrice) > Number(currentPrice) && (
                  <span className="text-2xl text-muted-foreground line-through">
                    {comparePrice.toFixed(2)} {settings?.currency || 'SAR'}
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
                        i < Math.floor(rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {rating} ({reviewCount} {t('common.reviews', 'reviews')})
                </span>
              </div>

              {/* Availability */}
              <div className="flex items-center gap-2 mb-6">
                {product.isAvailable ? (
                  <>
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">{t('common.status.inStock', 'In Stock')}</span>
                  </>
                ) : (
                  <Badge variant="destructive">{t('common.status.outOfStock', 'Out of Stock')}</Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Product Type */}
            <div>
              <Badge variant="secondary" className="mb-2">
                <Package className="h-3 w-3 mr-1" />
                {t('common.digitalProduct', 'Digital Product')}
              </Badge>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Select Option</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <Button
                      key={variant.id}
                      variant={selectedVariant?.id === variant.id ? 'default' : 'outline'}
                      onClick={() => setSelectedVariant(variant)}
                    >
                      {variant.name} - ${Number(variant.price || 0).toFixed(2)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="font-semibold mb-3">Quantity</h3>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={handleAddToCart}
                className="flex-1 gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </Button>
              <Button
                size="lg"
                variant="default"
                onClick={handleBuyNow}
                className="flex-1 gap-2"
              >
                Buy Now
              </Button>
            </div>

            {/* Secondary Actions */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={isWishlisted ? 'bg-red-50 border-red-500 text-red-500' : ''}
              >
                <Heart className={`h-5 w-5 mr-2 ${isWishlisted ? 'fill-current' : ''}`} />
                {isWishlisted ? 'Saved' : 'Save'}
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-5 w-5 mr-2" />
                Share
              </Button>
            </div>

            {/* Features */}
            <Card className="p-4 bg-muted/50">
              <div className="grid grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <feature.icon className="h-5 w-5 text-primary" />
                    <span className="text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="description" className="mb-16">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="included">What's Included</TabsTrigger>
            <TabsTrigger value="reviews">Reviews & Ratings</TabsTrigger>
            <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="mt-6">
            <Card className="p-6">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description || 'No description available.' }}
              />
            </Card>
          </TabsContent>
          
          <TabsContent value="included" className="mt-6">
            <Card className="p-6">
              <ul className="space-y-3">
                {whatsIncluded.map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-6">
            <Card className="p-6">
              <div className="text-center py-8">
                <Star className="h-12 w-12 mx-auto text-yellow-400 mb-4" />
                <p className="text-muted-foreground">Reviews coming soon</p>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="shipping" className="mt-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Digital Delivery</h4>
                  <p className="text-muted-foreground">
                    This is a digital product. You will receive your code instantly via email after purchase.
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2">Returns</h4>
                  <p className="text-muted-foreground">
                    Digital products are non-refundable once delivered. Please ensure you select the correct product before purchase.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold mb-8">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((product) => (
                <SubMarketProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

