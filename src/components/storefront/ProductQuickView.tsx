import { useState } from 'react';
import { X, ZoomIn, Heart, Share2, ShoppingCart, Star, Zap, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  originalPrice?: number;
  images: string[];
  description: string;
  descriptionAr: string;
  category: string;
  categoryAr: string;
  rating?: number;
  reviews?: number;
  instant?: boolean;
  features?: string[];
  featuresAr?: string[];
}

interface ProductQuickViewProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  language?: 'ar' | 'en';
  onAddToCart?: (product: Product, quantity: number) => void;
}

export function ProductQuickView({
  isOpen,
  onClose,
  product,
  language = 'ar',
  onAddToCart
}: ProductQuickViewProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!product) return null;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div
          className="bg-gray-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left Side - Images */}
            <div className="relative bg-gray-800 p-6">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-white" />
              </button>

              {/* Main Image */}
              <div className="relative aspect-square rounded-xl overflow-hidden mb-4 group">
                <img
                  src={product.images[selectedImage]}
                  alt={language === 'ar' ? product.nameAr : product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {discount > 0 && (
                    <Badge className="bg-red-500 text-white font-bold px-3 py-1">
                      -{discount}%
                    </Badge>
                  )}
                  {product.instant && (
                    <Badge className="bg-green-500 text-white font-bold px-2 py-1 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {language === 'ar' ? 'فوري' : 'Instant'}
                    </Badge>
                  )}
                </div>

                {/* Zoom Icon */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="p-2 bg-black/50 backdrop-blur-sm rounded-full">
                    <ZoomIn className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Thumbnail Images */}
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? 'border-purple-500 scale-105'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side - Details */}
            <div className="p-6 overflow-y-auto max-h-[90vh]">
              {/* Category */}
              <p className="text-purple-400 font-semibold text-sm uppercase tracking-wider mb-2">
                {language === 'ar' ? product.categoryAr : product.category}
              </p>

              {/* Title */}
              <h2 className="text-3xl font-black text-white mb-4">
                {language === 'ar' ? product.nameAr : product.name}
              </h2>

              {/* Rating */}
              {product.rating && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.rating!)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-white font-semibold">{product.rating}</span>
                  {product.reviews && (
                    <span className="text-gray-400 text-sm">
                      ({product.reviews} {language === 'ar' ? 'تقييم' : 'reviews'})
                    </span>
                  )}
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                  {product.price} {language === 'ar' ? 'ر.س' : 'SAR'}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    {product.originalPrice} {language === 'ar' ? 'ر.س' : 'SAR'}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-gray-300 leading-relaxed mb-6">
                {language === 'ar' ? product.descriptionAr : product.description}
              </p>

              {/* Features */}
              {product.features && product.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-white font-bold mb-3">
                    {language === 'ar' ? 'المميزات' : 'Features'}
                  </h3>
                  <ul className="space-y-2">
                    {(language === 'ar' ? product.featuresAr : product.features)?.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-300">
                        <svg className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="flex flex-col items-center p-3 bg-gray-800 rounded-lg">
                  <Zap className="h-6 w-6 text-green-500 mb-1" />
                  <span className="text-xs text-gray-400 text-center">
                    {language === 'ar' ? 'توصيل فوري' : 'Instant'}
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 bg-gray-800 rounded-lg">
                  <Shield className="h-6 w-6 text-blue-500 mb-1" />
                  <span className="text-xs text-gray-400 text-center">
                    {language === 'ar' ? 'دفع آمن' : 'Secure'}
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 bg-gray-800 rounded-lg">
                  <Clock className="h-6 w-6 text-purple-500 mb-1" />
                  <span className="text-xs text-gray-400 text-center">
                    {language === 'ar' ? 'دعم 24/7' : '24/7 Support'}
                  </span>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-white font-semibold">
                  {language === 'ar' ? 'الكمية:' : 'Quantity:'}
                </span>
                <div className="flex items-center gap-3 bg-gray-800 rounded-lg p-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  >
                    <span className="text-white text-xl">−</span>
                  </button>
                  <span className="text-white font-bold w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  >
                    <span className="text-white text-xl">+</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => onAddToCart?.(product, quantity)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-lg rounded-xl shadow-lg shadow-purple-500/50"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {language === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setIsFavorite(!isFavorite)}
                    variant="outline"
                    className="border-gray-700 hover:bg-gray-800"
                  >
                    <Heart className={`mr-2 h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                    {language === 'ar' ? 'المفضلة' : 'Wishlist'}
                  </Button>
                  <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
                    <Share2 className="mr-2 h-5 w-5" />
                    {language === 'ar' ? 'مشاركة' : 'Share'}
                  </Button>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mt-6 pt-6 border-t border-gray-800">
                <p className="text-gray-400 text-sm mb-3">
                  {language === 'ar' ? 'طرق الدفع المتاحة:' : 'Payment methods:'}
                </p>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 bg-blue-600 rounded text-xs font-bold text-white">VISA</div>
                  <div className="px-3 py-1.5 bg-orange-600 rounded text-xs font-bold text-white">MASTER</div>
                  <div className="px-3 py-1.5 bg-green-600 rounded text-xs font-bold text-white">MADA</div>
                  <div className="px-3 py-1.5 bg-gray-700 rounded text-xs font-bold text-white">STC PAY</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
