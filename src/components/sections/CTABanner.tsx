import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface CTABannerProps {
  title?: string;
  description?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
  buttonStyle?: 'primary' | 'secondary' | 'outline';
}

export function CTABanner({
  title = 'جاهز للبدء؟',
  description = 'انضم إلى آلاف العملاء السعداء واحصل على أفضل العروض',
  ctaText = 'ابدأ الآن',
  ctaLink = '#',
  backgroundImage,
  backgroundColor,
  textColor,
  buttonStyle = 'primary'
}: CTABannerProps) {
  // Use theme variables if no custom colors provided
  const bgStyle = backgroundColor || 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))';
  const txtColor = textColor || 'var(--theme-text)';
  
  const buttonStyles = {
    primary: 'theme-btn-primary',
    secondary: 'theme-btn-secondary',
    outline: 'theme-btn-outline'
  };

  return (
    <section className="py-16" style={{ backgroundColor: 'var(--theme-background)' }}>
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl">
          {/* Background */}
          {backgroundImage ? (
            <div className="absolute inset-0">
              <img
                src={backgroundImage}
                alt={title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${bgStyle}90, ${bgStyle}90)` }} />
            </div>
          ) : (
            <div 
              className="absolute inset-0" 
              style={{ background: bgStyle }}
            />
          )}

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: 'var(--theme-accent)', opacity: 0.1 }} />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: 'var(--theme-secondary)', opacity: 0.1 }} />

          {/* Content */}
          <div className="relative z-10 text-center py-20 px-6" style={{ color: txtColor }}>
            <h2 className="text-4xl md:text-6xl font-black mb-6" style={{ fontFamily: 'var(--theme-heading-family)' }}>
              {title}
            </h2>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
              {description}
            </p>
            <Button
              size="lg"
              className={`${buttonStyles[buttonStyle]} px-10 py-7 text-lg font-bold rounded-full shadow-2xl hover:scale-105 transition-all`}
              onClick={() => window.location.href = ctaLink}
            >
              {ctaText}
              <ArrowLeft className="mr-3 h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
