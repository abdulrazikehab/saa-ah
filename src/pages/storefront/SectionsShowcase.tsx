import { FullWidthBanner } from '@/components/sections/FullWidthBanner';
import { FeaturesGrid } from '@/components/sections/FeaturesGrid';
import { ImageSlider } from '@/components/sections/ImageSlider';
import { ContentSlider } from '@/components/sections/ContentSlider';
import { PaymentMethods } from '@/components/sections/PaymentMethods';
import { CTABanner } from '@/components/sections/CTABanner';
import { RichText } from '@/components/sections/RichText';
import { ImageBlock } from '@/components/sections/ImageBlock';
import { PageFooter } from '@/components/sections/PageFooter';
import { PremiumProductCard } from '@/components/storefront/PremiumProductCard';

export function SectionsShowcase() {
  // Sample products
  const sampleProducts = [
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

  return (
    <div className="min-h-screen bg-black">
      {/* 1. واجهة رئيسية - بانر بعرض كامل */}
      <FullWidthBanner
        title="متجرك الإلكتروني الشامل"
        subtitle="عروض حصرية"
        description="احصل على أفضل المنتجات الرقمية بأسعار لا تقبل المنافسة"
        ctaText="تسوق الآن"
        ctaLink="/products"
        secondaryCtaText="شاهد الفيديو"
        secondaryCtaLink="#video"
      />

      {/* 2. المميزات - شبكة المميزات */}
      <FeaturesGrid
        title="لماذا تختارنا؟"
        subtitle="مميزات تجعلنا الخيار الأمثل لك"
        columns={4}
      />

      {/* 3. المنتجات - عرض المنتجات */}
      <section className="py-16 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              المنتجات المميزة
            </h2>
            <p className="text-gray-400 text-lg">
              أفضل المنتجات الرقمية بأسعار تنافسية
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {sampleProducts.map((product) => (
              <PremiumProductCard
                key={product.id}
                product={product}
                language="ar"
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Image Slider - معرض الصور المتحرك */}
      <ImageSlider
        autoPlay={true}
        interval={5000}
        showDots={true}
        showArrows={true}
        aspectRatio="video"
      />

      {/* 5. Content Slider - محتوى متحرك لا نهائي */}
      <ContentSlider
        title="أحدث العروض"
        subtitle="عروض محدودة لفترة محدودة"
        speed={30}
        direction="right"
      />

      {/* 6. صورة - كتلة صورة */}
      <ImageBlock
        image="https://images.unsplash.com/photo-1557821552-17105176677c?w=1200&h=800&fit=crop"
        alt="صورة ترويجية"
        caption="صورة توضيحية للمنتجات"
        aspectRatio="wide"
        rounded={true}
        shadow={true}
        overlay={true}
        overlayText="عروض حصرية"
        overlayPosition="center"
      />

      {/* 7. نص - محتوى نصي غني */}
      <RichText
        title="من نحن"
        subtitle="تعرف على قصتنا"
        content={`
          <p>نحن متجر إلكتروني رائد في مجال المنتجات الرقمية، نقدم لعملائنا <strong>أفضل الأسعار</strong> و<strong>أسرع خدمة</strong> في السوق.</p>
          
          <h3>مميزاتنا</h3>
          <ul>
            <li>توصيل فوري خلال ثوانٍ</li>
            <li>دعم فني متاح 24/7</li>
            <li>أسعار تنافسية</li>
            <li>ضمان استرجاع الأموال</li>
          </ul>
          
          <blockquote>
            "رضا عملائنا هو هدفنا الأول"
          </blockquote>
          
          <p>انضم إلى <em>آلاف العملاء السعداء</em> واستمتع بتجربة تسوق فريدة.</p>
        `}
        textAlign="right"
        maxWidth="lg"
      />

      {/* 8. Payment Methods - طرق الدفع */}
      <PaymentMethods
        title="طرق الدفع المتاحة"
        subtitle="ادفع بالطريقة التي تناسبك"
        layout="horizontal"
      />

      {/* 9. دعوة لاتخاذ إجراء - بانر تفاعلي */}
      <CTABanner
        title="جاهز للبدء؟"
        description="انضم إلى آلاف العملاء السعداء واحصل على أفضل العروض الحصرية"
        ctaText="ابدأ التسوق الآن"
        ctaLink="/products"
        buttonStyle="primary"
      />

      {/* 10. تذييل الصفحة - Footer */}
      <PageFooter
        logoText="متجري"
        description="متجرك الإلكتروني المتكامل لجميع احتياجاتك من المنتجات الرقمية"
        contactEmail="info@mystore.com"
        contactPhone="+966 50 123 4567"
        contactAddress="الرياض، المملكة العربية السعودية"
        socialLinks={[
          { platform: 'facebook', url: 'https://facebook.com' },
          { platform: 'twitter', url: 'https://twitter.com' },
          { platform: 'instagram', url: 'https://instagram.com' },
          { platform: 'youtube', url: 'https://youtube.com' },
        ]}
        showPaymentMethods={true}
      />
    </div>
  );
}
