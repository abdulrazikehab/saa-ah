import { Zap, Shield, Headphones, TrendingUp, Truck, Award, Clock, CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Feature {
  icon: string;
  title: string;
  description: string;
  color?: string;
}

interface FeaturesGridProps {
  title?: string;
  subtitle?: string;
  features?: Feature[];
  columns?: 2 | 3 | 4;
}

export function FeaturesGrid({
  title = 'لماذا نحن؟',
  subtitle = 'مميزات تجعلنا الخيار الأفضل',
  features = [],
  columns = 4
}: FeaturesGridProps) {
  const iconMap: Record<string, any> = {
    zap: Zap,
    shield: Shield,
    headphones: Headphones,
    trending: TrendingUp,
    truck: Truck,
    award: Award,
    clock: Clock,
    card: CreditCard,
  };

  const defaultFeatures: Feature[] = [
    {
      icon: 'zap',
      title: 'توصيل فوري',
      description: 'احصل على منتجاتك في ثوانٍ معدودة',
      color: 'from-yellow-600 to-orange-600'
    },
    {
      icon: 'shield',
      title: 'دفع آمن 100%',
      description: 'جميع المعاملات محمية ومشفرة',
      color: 'from-green-600 to-emerald-600'
    },
    {
      icon: 'headphones',
      title: 'دعم فني 24/7',
      description: 'فريقنا متاح دائماً لمساعدتك',
      color: 'from-blue-600 to-cyan-600'
    },
    {
      icon: 'award',
      title: 'أفضل الأسعار',
      description: 'نضمن لك أفضل الأسعار في السوق',
      color: 'from-purple-600 to-pink-600'
    },
    {
      icon: 'truck',
      title: 'شحن مجاني',
      description: 'شحن مجاني على جميع الطلبات',
      color: 'from-red-600 to-rose-600'
    },
    {
      icon: 'clock',
      title: 'متاح دائماً',
      description: 'تسوق في أي وقت على مدار الساعة',
      color: 'from-indigo-600 to-purple-600'
    },
    {
      icon: 'card',
      title: 'طرق دفع متعددة',
      description: 'ادفع بالطريقة التي تناسبك',
      color: 'from-teal-600 to-cyan-600'
    },
    {
      icon: 'trending',
      title: 'عروض حصرية',
      description: 'احصل على خصومات وعروض مميزة',
      color: 'from-pink-600 to-rose-600'
    },
  ];

  const activeFeatures = features.length > 0 ? features : defaultFeatures;

  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4'
  };

  return (
    <section className="py-16 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-4">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-gray-400 text-lg">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Features Grid */}
        <div className={`grid grid-cols-1 ${gridCols[columns]} gap-6`}>
          {activeFeatures.map((feature, index) => {
            const Icon = iconMap[feature.icon] || Zap;
            const color = feature.color || 'from-purple-600 to-pink-600';

            return (
              <Card
                key={index}
                className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-purple-500 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-2 p-6"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                {/* Content */}
                <div className="relative space-y-4">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-white">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Decorative Corner */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full" />
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
