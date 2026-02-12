import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ShowcaseProduct {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  descriptionAr: string;
  rating?: number;
  badge?: string;
}

interface ProductShowcaseProps {
  products?: ShowcaseProduct[];
  language?: 'ar' | 'en';
  autoPlay?: boolean;
  interval?: number;
}

export function ProductShowcase({ 
  products = [], 
  language = 'ar',
  autoPlay = true,
  interval = 4000 
}: ProductShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const defaultProducts: ShowcaseProduct[] = [
    {
      id: '1',
      name: 'PUBG Mobile UC',
      nameAr: 'شحن بوبجي موبايل',
      price: 45,
      originalPrice: 60,
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop',
      description: 'Instant delivery of UC for PUBG Mobile',
      descriptionAr: 'توصيل فوري لشحن بوبجي موبايل',
      rating: 4.8,
      badge: 'HOT'
    },
    {
      id: '2',
      name: 'Free Fire Diamonds',
      nameAr: 'الماس فري فاير',
      price: 35,
      originalPrice: 50,
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop',
      description: 'Get diamonds instantly for Free Fire',
      descriptionAr: 'احصل على الماس فوراً لفري فاير',
      rating: 4.9,
      badge: 'SALE'
    },
    {
      id: '3',
      name: 'PlayStation Plus',
      nameAr: 'بلايستيشن بلس',
      price: 120,
      image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&h=600&fit=crop',
      description: '12 months subscription',
      descriptionAr: 'اشتراك 12 شهر',
      rating: 5.0,
      badge: 'EXCLUSIVE'
    },
  ];

  const activeProducts = products.length > 0 ? products : defaultProducts;

  useEffect(() => {
    if (!autoPlay) return;

    timerRef.current = setInterval(() => {
      next();
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, autoPlay, interval]);

  const next = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % activeProducts.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + activeProducts.length) % activeProducts.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const goTo = (index: number) => {
    if (isAnimating || index === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const getVisibleProducts = () => {
    const visible = [];
    for (let i = -1; i <= 1; i++) {
      const index = (currentIndex + i + activeProducts.length) % activeProducts.length;
      visible.push({ product: activeProducts[index], offset: i });
    }
    return visible;
  };

  return (
    <div className="relative py-20 bg-gradient-to-b from-black via-gray-900 to-black overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-4">
            {language === 'ar' ? 'منتجات مميزة' : 'Featured Products'}
          </h2>
          <p className="text-gray-400 text-xl">
            {language === 'ar' ? 'اكتشف أفضل العروض' : 'Discover the best deals'}
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative h-[500px] flex items-center justify-center">
          {/* Products */}
          <div className="relative w-full max-w-6xl">
            {getVisibleProducts().map(({ product, offset }) => {
              const isCenter = offset === 0;
              const scale = isCenter ? 1 : 0.8;
              const opacity = isCenter ? 1 : 0.4;
              const zIndex = isCenter ? 30 : 20 - Math.abs(offset);
              const translateX = offset * 400;

              return (
                <div
                  key={product.id}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
                  style={{
                    transform: `translateX(calc(-50% + ${translateX}px)) translateY(-50%) scale(${scale})`,
                    opacity,
                    zIndex,
                    pointerEvents: isCenter ? 'auto' : 'none',
                  }}
                >
                  <div className="w-[400px] bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl overflow-hidden border-2 border-gray-700 shadow-2xl">
                    {/* Image */}
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={product.image}
                        alt={language === 'ar' ? product.nameAr : product.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      
                      {/* Badge */}
                      {product.badge && (
                        <Badge className="absolute top-4 left-4 bg-red-500 text-white font-bold px-4 py-2 text-sm">
                          {product.badge}
                        </Badge>
                      )}

                      {/* Rating */}
                      {product.rating && (
                        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-full">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-white font-bold">{product.rating}</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                      <h3 className="text-2xl font-black text-white">
                        {language === 'ar' ? product.nameAr : product.name}
                      </h3>
                      <p className="text-gray-400">
                        {language === 'ar' ? product.descriptionAr : product.description}
                      </p>

                      {/* Price */}
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                          {product.price} {language === 'ar' ? 'ر.س' : 'SAR'}
                        </span>
                        {product.originalPrice && (
                          <span className="text-lg text-gray-500 line-through">
                            {product.originalPrice} {language === 'ar' ? 'ر.س' : 'SAR'}
                          </span>
                        )}
                      </div>

                      {/* CTA */}
                      <Button
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-6 text-lg rounded-xl shadow-lg shadow-purple-500/50"
                      >
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        {language === 'ar' ? 'أضف للسلة' : 'Add to Cart'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full transition-all group disabled:opacity-50"
            disabled={isAnimating}
          >
            <ChevronLeft className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-4 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full transition-all group disabled:opacity-50"
            disabled={isAnimating}
          >
            <ChevronRight className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Indicators */}
        <div className="flex items-center justify-center gap-3 mt-12">
          {activeProducts.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={`transition-all ${
                index === currentIndex
                  ? 'w-12 h-3 bg-gradient-to-r from-purple-500 to-pink-500'
                  : 'w-3 h-3 bg-gray-600 hover:bg-gray-500'
              } rounded-full`}
              aria-label={`Go to product ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
