import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';

interface FullWidthBannerProps {
  title?: string;
  subtitle?: string;
  description?: string;
  backgroundImage?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  overlay?: boolean;
  overlayColor?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export function FullWidthBanner({
  title = 'عنوان البانر الرئيسي',
  subtitle = 'عنوان فرعي مميز',
  description = 'وصف تفصيلي للبانر يمكن تخصيصه بالكامل',
  backgroundImage = 'https://images.unsplash.com/photo-1557821552-17105176677c?w=1920&h=800&fit=crop',
  ctaText = 'ابدأ الآن',
  ctaLink = '#',
  secondaryCtaText = 'شاهد الفيديو',
  secondaryCtaLink = '#',
  overlay = true,
  overlayColor = 'from-purple-900/80 via-black/50 to-transparent',
  textAlign = 'center'
}: FullWidthBannerProps) {
  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end'
  };

  return (
    <section className="relative w-full h-[600px] md:h-[700px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={backgroundImage}
          alt={title}
          className="w-full h-full object-cover"
        />
        {overlay && (
          <div className={`absolute inset-0 bg-gradient-to-r ${overlayColor}`} />
        )}
      </div>

      {/* Content */}
      <div className="relative h-full container mx-auto px-4 flex items-center">
        <div className={`max-w-3xl space-y-6 ${alignmentClasses[textAlign]} flex flex-col`}>
          {/* Subtitle Badge */}
          {subtitle && (
            <div className="inline-block">
              <span className="px-4 py-2 bg-purple-600/30 backdrop-blur-sm border border-purple-500/50 rounded-full text-sm font-semibold text-white">
                {subtitle}
              </span>
            </div>
          )}

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-black leading-tight text-white">
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p className="text-xl md:text-2xl text-gray-200 leading-relaxed">
              {description}
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex items-center gap-4 pt-4">
            {ctaText && (
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg font-bold rounded-full shadow-lg shadow-purple-500/50"
                onClick={() => window.location.href = ctaLink}
              >
                {ctaText}
                <ArrowRight className="mr-2 h-5 w-5" />
              </Button>
            )}
            {secondaryCtaText && (
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-8 py-6 text-lg font-bold rounded-full"
                onClick={() => window.location.href = secondaryCtaLink}
              >
                <Play className="ml-2 h-5 w-5" />
                {secondaryCtaText}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
    </section>
  );
}
