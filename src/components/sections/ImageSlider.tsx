import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageSlide {
  id: string;
  image: string;
  alt: string;
}

interface ImageSliderProps {
  images?: ImageSlide[];
  autoPlay?: boolean;
  interval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  aspectRatio?: 'video' | 'square' | 'wide';
}

export function ImageSlider({
  images = [],
  autoPlay = true,
  interval = 4000,
  showDots = true,
  showArrows = true,
  aspectRatio = 'video'
}: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const defaultImages: ImageSlide[] = [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=1200&h=600&fit=crop',
      alt: 'صورة 1'
    },
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=600&fit=crop',
      alt: 'صورة 2'
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&h=600&fit=crop',
      alt: 'صورة 3'
    },
  ];

  const activeImages = images.length > 0 ? images : defaultImages;

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeImages.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, activeImages.length, currentIndex]);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % activeImages.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeImages.length) % activeImages.length);
  };

  const aspectRatioClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    wide: 'aspect-[21/9]'
  };

  return (
    <section className="py-16 bg-black">
      <div className="container mx-auto px-4">
        <div className="relative max-w-6xl mx-auto">
          {/* Slider Container */}
          <div className={`relative ${aspectRatioClasses[aspectRatio]} rounded-2xl overflow-hidden`}>
            {/* Images */}
            {activeImages.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  index === currentIndex
                    ? 'opacity-100 scale-100'
                    : 'opacity-0 scale-110'
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.alt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            ))}

            {/* Navigation Arrows */}
            {showArrows && activeImages.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full transition-all group z-10"
                  aria-label="الصورة السابقة"
                >
                  <ChevronRight className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-full transition-all group z-10"
                  aria-label="الصورة التالية"
                >
                  <ChevronLeft className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                </button>
              </>
            )}

            {/* Dots Indicator */}
            {showDots && activeImages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                {activeImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'w-8 bg-white'
                        : 'w-2 bg-white/50 hover:bg-white/70'
                    }`}
                    aria-label={`الانتقال للصورة ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
