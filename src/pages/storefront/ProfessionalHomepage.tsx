import { useState, useEffect } from 'react';
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader';
import { StorefrontFooter } from '@/components/storefront/StorefrontFooter';
import { HeroSection } from '@/components/storefront/HeroSection';
import { CategoryGrid } from '@/components/storefront/CategoryGrid';
import { PremiumProductCard } from '@/components/storefront/PremiumProductCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Zap, Shield, Headphones, TrendingUp, ArrowRight } from 'lucide-react';

export function ProfessionalHomepage() {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [cartItemCount, setCartItemCount] = useState(0);

  // Sample featured products
  const featuredProducts = [
    {
      id: '1',
      name: 'PUBG Mobile UC',
      nameAr: 'شحن بوبجي موبايل',
      price: 45,
      originalPrice: 60,
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=600&fit=crop',
      category: 'Gaming',
      categoryAr: 'ألعاب',
      rating: 4.8,
      reviews: 1250,
      badge: 'hot' as const,
      instant: true
    },
    {
      id: '2',
      name: 'Free Fire Diamonds',
      nameAr: 'الماس فري فاير',
      price: 35,
      originalPrice: 50,
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=600&fit=crop',
      category: 'Gaming',
      categoryAr: 'ألعاب',
      rating: 4.9,
      reviews: 2100,
      badge: 'sale' as const,
      instant: true
    },
    {
      id: '3',
      name: 'PlayStation Plus',
      nameAr: 'بلايستيشن بلس',
      price: 120,
      image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=600&fit=crop',
      category: 'Console',
      categoryAr: 'منصات',
      rating: 5.0,
      reviews: 890,
      badge: 'exclusive' as const,
      instant: true
    },
    {
      id: '4',
      name: 'iTunes Gift Card',
      nameAr: 'بطاقة آيتونز',
      price: 100,
      image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=600&fit=crop',
      category: 'Gift Cards',
      categoryAr: 'بطاقات هدايا',
      rating: 4.7,
      reviews: 650,
      badge: 'new' as const,
      instant: true
    },
  ];

  const handleSearch = (query: string) => {
    console.log('Search:', query);
  };

  const handleAddToCart = (product: any) => {
    setCartItemCount(prev => prev + 1);
    console.log('Added to cart:', product);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <StorefrontHeader 
        cartItemCount={cartItemCount}
        onSearch={handleSearch}
      />

      {/* Hero Section */}
      <HeroSection language={language} />

      {/* Features Bar */}
      <div className="bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-purple-900/20 border-y border-purple-500/20">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3 text-white">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Zap className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="font-bold">{language === 'ar' ? 'توصيل فوري' : 'Instant Delivery'}</p>
                <p className="text-sm text-gray-400">{language === 'ar' ? 'خلال ثوانٍ' : 'Within seconds'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-white">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Shield className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="font-bold">{language === 'ar' ? 'دفع آمن' : 'Secure Payment'}</p>
                <p className="text-sm text-gray-400">{language === 'ar' ? '100% محمي' : '100% Protected'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-white">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Headphones className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="font-bold">{language === 'ar' ? 'دعم 24/7' : '24/7 Support'}</p>
                <p className="text-sm text-gray-400">{language === 'ar' ? 'دائماً متاحون' : 'Always available'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-white">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <p className="font-bold">{language === 'ar' ? 'أفضل الأسعار' : 'Best Prices'}</p>
                <p className="text-sm text-gray-400">{language === 'ar' ? 'ضمان السعر' : 'Price guarantee'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Grid */}
      <CategoryGrid language={language} />

      {/* Featured Products */}
      <div className="py-16 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-2">
                {language === 'ar' ? 'المنتجات المميزة' : 'Featured Products'}
              </h2>
              <p className="text-gray-400 text-lg">
                {language === 'ar' ? 'الأكثر مبيعاً هذا الأسبوع' : 'Best sellers this week'}
              </p>
            </div>
            <Button
              variant="outline"
              className="border-2 border-purple-500 bg-purple-500/10 hover:bg-purple-500/20 text-white font-bold"
            >
              {language === 'ar' ? 'عرض الكل' : 'View All'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <PremiumProductCard
                key={product.id}
                product={product}
                language={language}
                onAddToCart={handleAddToCart}
                onQuickView={(p) => console.log('Quick view:', p)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Promotional Banner */}
      <div className="py-16 bg-black">
        <div className="container mx-auto px-4">
          <Card className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 border-0 p-12 md:p-16">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

            {/* Content */}
            <div className="relative z-10 text-center text-white space-y-6">
              <h2 className="text-4xl md:text-6xl font-black">
                {language === 'ar' ? 'عروض حصرية' : 'Exclusive Deals'}
              </h2>
              <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
                {language === 'ar' 
                  ? 'احصل على خصم يصل إلى 50٪ على منتجات مختارة' 
                  : 'Get up to 50% off on selected products'}
              </p>
              <div className="flex items-center justify-center gap-4 pt-4">
                <Button
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-6 text-lg font-bold rounded-full shadow-lg"
                >
                  {language === 'ar' ? 'تسوق الآن' : 'Shop Now'}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-bold rounded-full"
                >
                  {language === 'ar' ? 'اعرف المزيد' : 'Learn More'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="py-16 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-black text-white">
              {language === 'ar' ? 'اشترك في النشرة الإخبارية' : 'Subscribe to Newsletter'}
            </h2>
            <p className="text-gray-400 text-lg">
              {language === 'ar' 
                ? 'احصل على آخر العروض والأخبار مباشرة في بريدك الإلكتروني' 
                : 'Get the latest deals and news directly in your inbox'}
            </p>
            <div className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder={language === 'ar' ? 'بريدك الإلكتروني' : 'Your email'}
                className="flex-1 px-6 py-4 bg-gray-800 border border-gray-700 rounded-full text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
              />
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 rounded-full font-bold"
              >
                {language === 'ar' ? 'اشترك' : 'Subscribe'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <StorefrontFooter />
    </div>
  );
}
