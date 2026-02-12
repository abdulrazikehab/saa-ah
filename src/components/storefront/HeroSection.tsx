import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface HeroSlide {
  id: string;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  image: string;
  ctaText: string;
  ctaTextAr: string;
  ctaLink: string;
  gradient?: string;
}

interface HeroSectionProps {
  slides?: HeroSlide[];
  autoPlay?: boolean;
  interval?: number;
  language?: 'ar' | 'en';
}

export function HeroSection({ 
  slides = [], 
  autoPlay = true, 
  interval = 5000,
  language = 'ar' 
}: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Default slides if none provided
  const defaultSlides: HeroSlide[] = [
    {
      id: '1',
      title: 'Your Instant Digital Cards Store',
      titleAr: 'متجرك الفوري للبطاقات الرقمية',
      subtitle: 'Top-Up & Gaming Cards',
      subtitleAr: 'بطاقات الشحن والألعاب',
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920&h=800&fit=crop',
      ctaText: 'Shop Now',
      ctaTextAr: 'تسوق الآن',
      ctaLink: '/products',
      gradient: 'from-purple-900/80 via-black/50 to-transparent'
    },
    {
      id: '2',
      title: 'Exclusive Gaming Deals',
      titleAr: 'عروض حصرية للألعاب',
      subtitle: 'Save up to 50% on popular games',
      subtitleAr: 'وفر حتى 50٪ على الألعاب الشهيرة',
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1920&h=800&fit=crop',
      ctaText: 'View Deals',
      ctaTextAr: 'عرض العروض',
      ctaLink: '/offers',
      gradient: 'from-blue-900/80 via-black/50 to-transparent'
    },
    {
      id: '3',
      title: 'Instant Delivery',
      titleAr: 'توصيل فوري',
      subtitle: 'Get your codes in seconds',
      subtitleAr: 'احصل على أكوادك في ثوانٍ',
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&h=800&fit=crop',
      ctaText: 'Learn More',
      ctaTextAr: 'اعرف المزيد',
      ctaLink: '/about',
      gradient: 'from-green-900/80 via-black/50 to-transparent'
    }
  ];

  const activeSlides = slides.length > 0 ? slides : defaultSlides;

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, activeSlides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const currentSlideData = activeSlides[currentSlide];

  return (
    <div className="relative w-full h-[600px] md:h-[700px] overflow-hidden bg-black">
      {/* Background Images with Parallax Effect */}
      {activeSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            index === currentSlide 
              ? 'opacity-100 scale-100' 
              : 'opacity-0 scale-110'
          }`}
        >
          <img
            src={slide.image}
            alt={language === 'ar' ? slide.titleAr : slide.title}
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient || 'from-black/60 to-transparent'}`} />
        </div>
      ))}

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex items-center">
        <div className="max-w-3xl text-white space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Subtitle */}
          <div className="inline-block">
            <span className="px-4 py-2 bg-purple-600/30 backdrop-blur-sm border border-purple-500/50 rounded-full text-sm font-semibold">
              {language === 'ar' ? currentSlideData.subtitleAr : currentSlideData.subtitle}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-black leading-tight">
            {language === 'ar' ? (
              <>
                {currentSlideData.titleAr.split(' ').map((word, i) => (
                  <span
                    key={i}
                    className={i % 2 === 1 ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600' : ''}
                  >
                    {word}{' '}
                  </span>
                ))}
              </>
            ) : (
              <>
                {currentSlideData.title.split(' ').map((word, i) => (
                  <span
                    key={i}
                    className={i === 2 || i === 3 ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600' : ''}
                  >
                    {word}{' '}
                  </span>
                ))}
              </>
            )}
          </h1>

          {/* CTA Buttons */}
          <div className="flex items-center gap-4 pt-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg font-bold rounded-full shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all"
              onClick={() => window.location.href = currentSlideData.ctaLink}
            >
              {language === 'ar' ? currentSlideData.ctaTextAr : currentSlideData.ctaText}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-8 py-6 text-lg font-bold rounded-full"
            >
              <Play className="mr-2 h-5 w-5" />
              {language === 'ar' ? 'شاهد الفيديو' : 'Watch Video'}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full transition-all group"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full transition-all group"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {activeSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide 
                ? 'w-8 bg-white' 
                : 'w-2 bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
    </div>
  );
}
