import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gamepad2, Smartphone, Tv, Gift, Zap, Headphones, ShoppingBag, CreditCard } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  gradient: string;
  count?: number;
}

interface CategoryGridProps {
  categories?: Category[];
  language?: 'ar' | 'en';
  onCategoryClick?: (category: Category) => void;
}

export function CategoryGrid({ categories = [], language = 'ar', onCategoryClick }: CategoryGridProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iconMap: Record<string, any> = {
    gamepad: Gamepad2,
    smartphone: Smartphone,
    tv: Tv,
    gift: Gift,
    zap: Zap,
    headphones: Headphones,
    shopping: ShoppingBag,
    card: CreditCard,
  };

  const defaultCategories: Category[] = [
    {
      id: '1',
      name: 'Voice Chat',
      nameAr: 'محادثة صوتية',
      icon: 'headphones',
      gradient: 'from-purple-600 to-pink-600',
      count: 45
    },
    {
      id: '2',
      name: 'Voice Chat Games',
      nameAr: 'ألعاب المحادثة الصوتية',
      icon: 'gamepad',
      gradient: 'from-blue-600 to-cyan-600',
      count: 32
    },
    {
      id: '3',
      name: 'Games Voucher',
      nameAr: 'قسائم الألعاب',
      icon: 'gift',
      gradient: 'from-green-600 to-emerald-600',
      count: 28
    },
    {
      id: '4',
      name: 'Games Console',
      nameAr: 'منصات الألعاب',
      icon: 'tv',
      gradient: 'from-orange-600 to-red-600',
      count: 18
    },
    {
      id: '5',
      name: 'Mobile & Data',
      nameAr: 'الجوال والبيانات',
      icon: 'smartphone',
      gradient: 'from-pink-600 to-rose-600',
      count: 56
    },
    {
      id: '6',
      name: 'Entertainment Voucher',
      nameAr: 'قسائم الترفيه',
      icon: 'zap',
      gradient: 'from-yellow-600 to-orange-600',
      count: 24
    },
    {
      id: '7',
      name: 'Shopping Voucher',
      nameAr: 'قسائم التسوق',
      icon: 'shopping',
      gradient: 'from-indigo-600 to-purple-600',
      count: 38
    },
    {
      id: '8',
      name: 'Payment Cards',
      nameAr: 'بطاقات الدفع',
      icon: 'card',
      gradient: 'from-teal-600 to-cyan-600',
      count: 15
    },
  ];

  const activeCategories = categories.length > 0 ? categories : defaultCategories;

  return (
    <div className="py-16 bg-black">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            {language === 'ar' ? 'تصفح حسب الفئة' : 'Browse by Category'}
          </h2>
          <p className="text-gray-400 text-lg">
            {language === 'ar' 
              ? 'اختر من مجموعة واسعة من المنتجات الرقمية' 
              : 'Choose from a wide range of digital products'}
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
          {activeCategories.map((category, index) => {
            const Icon = iconMap[category.icon] || Gamepad2;
            
            return (
              <Card
                key={category.id}
                className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-purple-500 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 hover:-translate-y-2 cursor-pointer"
                onClick={() => onCategoryClick?.(category)}
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />

                {/* Content */}
                <div className="relative p-6 flex flex-col items-center text-center space-y-4">
                  {/* Icon Container */}
                  <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-10 w-10 text-white" />
                    
                    {/* Glow Effect */}
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${category.gradient} blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300`} />
                  </div>

                  {/* Category Name */}
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">
                      {language === 'ar' ? category.nameAr : category.name}
                    </h3>
                    {category.count && (
                      <p className="text-gray-400 text-sm">
                        {category.count} {language === 'ar' ? 'منتج' : 'products'}
                      </p>
                    )}
                  </div>

                  {/* Hover Arrow */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Decorative Corner */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full" />
              </Card>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-purple-500 bg-purple-500/10 hover:bg-purple-500/20 text-white px-8 py-6 text-lg font-bold rounded-full"
          >
            {language === 'ar' ? 'عرض جميع الفئات' : 'View All Categories'}
          </Button>
        </div>
      </div>
    </div>
  );
}
