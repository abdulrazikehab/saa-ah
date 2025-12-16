import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  ShoppingCart, 
  CreditCard, 
  Zap, 
  Shield, 
  Clock,
  ChevronRight,
  Star,
  Gift,
  Sparkles,
  ArrowLeft,
  Gamepad2,
  Music,
  Film,
  ShoppingBag,
  Smartphone,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { coreApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Brand {
  id: string;
  name: string;
  nameAr?: string;
  code?: string;
  logo?: string;
}

interface Category {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
}

interface CardProduct {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  price: number;
  currencyCode: string;
  imageUrl?: string;
  brand?: Brand;
  category?: Category;
  inStock: number;
  isPopular?: boolean;
}

// Brand logos/icons mapping
const brandIcons: Record<string, string> = {
  'ITUNES': '🍎',
  'GOOGLEPLAY': '▶️',
  'PLAYSTATION': '🎮',
  'XBOX': '🎯',
  'STEAM': '🎲',
  'PUBG': '🔫',
  'FREEFIRE': '🔥',
  'NETFLIX': '🎬',
  'SPOTIFY': '🎵',
  'RAZERGOLD': '💎',
  'AMAZON': '📦',
  'NINTENDO': '🕹️',
};

// Category icons
const categoryIcons: Record<string, any> = {
  'gaming': Gamepad2,
  'entertainment': Film,
  'shopping': ShoppingBag,
  'mobile-apps': Smartphone,
  'music': Music,
};

export default function CardsHome() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredCards, setFeaturedCards] = useState<CardProduct[]>([]);
  const [popularCards, setPopularCards] = useState<CardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [brandsRes, categoriesRes, cardsRes] = await Promise.all([
        coreApi.getBrands().catch(() => []),
        coreApi.getCategories().catch(() => []),
        coreApi.get('/card-products?limit=12').catch(() => ({ data: [] })),
      ]);
      
      setBrands(Array.isArray(brandsRes) ? brandsRes : []);
      setCategories(Array.isArray(categoriesRes) ? categoriesRes : []);
      
      const cards = cardsRes.data || [];
      setFeaturedCards(cards.slice(0, 8));
      setPopularCards(cards.filter((c: CardProduct) => c.isPopular).slice(0, 4));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/cards?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-purple-200">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

        <div className="container relative py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <Badge className="mb-6 bg-purple-500/20 text-purple-300 border-purple-500/30 px-4 py-2 text-sm">
              <Sparkles className="h-4 w-4 mr-2" />
              {isRTL ? 'أسرع طريقة للحصول على بطاقاتك' : 'Fastest way to get your cards'}
            </Badge>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-white">{isRTL ? 'بطاقات رقمية' : 'Digital Cards'}</span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                {isRTL ? 'بضغطة زر' : 'At Your Fingertips'}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              {isRTL 
                ? 'احصل على بطاقات iTunes, Google Play, PlayStation, Steam والمزيد بشكل فوري وآمن'
                : 'Get iTunes, Google Play, PlayStation, Steam cards and more instantly and securely'
              }
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                  type="text"
                  placeholder={isRTL ? 'ابحث عن البطاقات...' : 'Search for cards...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 pr-12 pl-4 bg-white/10 border-white/20 text-white placeholder:text-slate-400 rounded-2xl text-lg focus:bg-white/20 focus:border-purple-400"
                />
                <Button 
                  type="submit"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 rounded-xl"
                >
                  {isRTL ? 'بحث' : 'Search'}
                </Button>
              </div>
            </form>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-6 text-slate-300">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                <span>{isRTL ? 'تسليم فوري' : 'Instant Delivery'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-400" />
                <span>{isRTL ? 'دفع آمن' : 'Secure Payment'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" />
                <span>{isRTL ? '24/7 متاح' : '24/7 Available'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brands Section */}
      {brands.length > 0 && (
        <section className="py-16 border-t border-white/10">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                {isRTL ? 'العلامات التجارية' : 'Popular Brands'}
              </h2>
              <Link to="/cards">
                <Button variant="ghost" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10">
                  {isRTL ? 'عرض الكل' : 'View All'}
                  <ChevronRight className={cn("h-4 w-4", isRTL && "rotate-180")} />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {brands.slice(0, 12).map((brand) => (
                <Link key={brand.id} to={`/cards?brand=${brand.id}`}>
                  <Card className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group">
                    <CardContent className="p-4 text-center">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                        {brand.logo ? (
                          <img src={brand.logo} alt={brand.name} className="w-10 h-10 object-contain" />
                        ) : (
                          brandIcons[brand.code || ''] || '🎁'
                        )}
                      </div>
                      <p className="text-white font-medium text-sm truncate">
                        {isRTL ? brand.nameAr || brand.name : brand.name}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-16 bg-black/20">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                {isRTL ? 'التصنيفات' : 'Categories'}
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.slice(0, 5).map((category) => {
                const IconComponent = categoryIcons[category.slug] || Gift;
                return (
                  <Link key={category.id} to={`/cards?category=${category.id}`}>
                    <Card className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-white/10 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group overflow-hidden">
                      <CardContent className="p-6 text-center relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <IconComponent className="h-7 w-7 text-purple-400" />
                          </div>
                          <h3 className="text-white font-semibold">
                            {isRTL ? category.nameAr || category.name : category.name}
                          </h3>
                          {category.description && (
                            <p className="text-slate-400 text-sm mt-1 line-clamp-1">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Cards */}
      {featuredCards.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {isRTL ? 'البطاقات المميزة' : 'Featured Cards'}
                </h2>
                <p className="text-slate-400">
                  {isRTL ? 'أكثر البطاقات مبيعاً' : 'Best selling cards'}
                </p>
              </div>
              <Link to="/cards">
                <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                  {isRTL ? 'عرض الكل' : 'View All'}
                  <ChevronRight className={cn("h-4 w-4 ml-1", isRTL && "rotate-180")} />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredCards.map((card) => (
                <Link key={card.id} to={`/cards/${card.id}`}>
                  <Card className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer group overflow-hidden">
                    <CardContent className="p-0">
                      {/* Card Image */}
                      <div className="aspect-[4/3] bg-gradient-to-br from-purple-600/30 to-blue-600/30 relative overflow-hidden">
                        {card.imageUrl ? (
                          <img 
                            src={card.imageUrl} 
                            alt={card.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <CreditCard className="h-16 w-16 text-purple-400/50" />
                          </div>
                        )}
                        
                        {/* Stock Badge */}
                        {card.inStock > 0 && (
                          <Badge className="absolute top-3 right-3 bg-green-500/90 text-white">
                            {isRTL ? 'متوفر' : 'In Stock'}
                          </Badge>
                        )}
                        
                        {/* Popular Badge */}
                        {card.isPopular && (
                          <Badge className="absolute top-3 left-3 bg-yellow-500/90 text-black">
                            <Star className="h-3 w-3 mr-1" />
                            {isRTL ? 'الأكثر مبيعاً' : 'Popular'}
                          </Badge>
                        )}
                      </div>

                      {/* Card Info */}
                      <div className="p-4">
                        {card.brand && (
                          <p className="text-purple-400 text-xs font-medium mb-1">
                            {isRTL ? card.brand.nameAr || card.brand.name : card.brand.name}
                          </p>
                        )}
                        <h3 className="text-white font-semibold mb-2 line-clamp-2">
                          {isRTL ? card.nameAr || card.name : card.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-purple-400">
                            {card.price.toFixed(2)} {card.currencyCode}
                          </span>
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 rounded-lg">
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-16 bg-black/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {isRTL ? 'كيف يعمل؟' : 'How It Works'}
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              {isRTL 
                ? 'احصل على بطاقتك في 3 خطوات بسيطة'
                : 'Get your card in 3 simple steps'
              }
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: isRTL ? 'اختر البطاقة' : 'Choose Card',
                description: isRTL ? 'تصفح مجموعتنا الواسعة من البطاقات الرقمية' : 'Browse our wide collection of digital cards',
                color: 'from-purple-500 to-purple-600',
              },
              {
                icon: CreditCard,
                title: isRTL ? 'ادفع بأمان' : 'Pay Securely',
                description: isRTL ? 'استخدم رصيد محفظتك أو بطاقتك البنكية' : 'Use your wallet balance or bank card',
                color: 'from-blue-500 to-blue-600',
              },
              {
                icon: Zap,
                title: isRTL ? 'استلم فوراً' : 'Receive Instantly',
                description: isRTL ? 'احصل على كود البطاقة فوراً في حسابك' : 'Get the card code instantly in your account',
                color: 'from-green-500 to-green-600',
              },
            ].map((step, index) => (
              <Card key={index} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className={cn(
                    "w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br flex items-center justify-center",
                    step.color
                  )}>
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {index + 1}
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 border-purple-500/30 overflow-hidden relative">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.1)_1px,transparent_1px)] bg-[size:30px_30px]" />
            <CardContent className="p-8 md:p-12 text-center relative">
              <Gift className="h-16 w-16 mx-auto mb-6 text-purple-400" />
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
                {isRTL ? 'هل أنت مستعد للبدء؟' : 'Ready to get started?'}
              </h2>
              <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
                {isRTL 
                  ? 'سجل الآن واحصل على أول بطاقة لك'
                  : 'Sign up now and get your first card'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/cards">
                  <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8">
                    {isRTL ? 'تصفح البطاقات' : 'Browse Cards'}
                    <ArrowLeft className={cn("h-5 w-5 ml-2", !isRTL && "rotate-180")} />
                  </Button>
                </Link>
                <Link to="/auth/signup">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8">
                    {isRTL ? 'إنشاء حساب' : 'Create Account'}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer Trust Badges */}
      <section className="py-8 border-t border-white/10">
        <div className="container">
          <div className="flex flex-wrap justify-center items-center gap-8 text-slate-400 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-400" />
              <span>{isRTL ? 'دفع آمن 100%' : '100% Secure Payment'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              <span>{isRTL ? 'تسليم فوري' : 'Instant Delivery'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-400" />
              <span>{isRTL ? '+10,000 عميل سعيد' : '10,000+ Happy Customers'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <span>{isRTL ? 'دعم 24/7' : '24/7 Support'}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

