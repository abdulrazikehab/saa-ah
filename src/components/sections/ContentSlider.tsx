import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  image?: string;
  icon?: string;
}

interface ContentSliderProps {
  title?: string;
  subtitle?: string;
  items?: ContentItem[];
  speed?: number;
  direction?: 'left' | 'right';
}

export function ContentSlider({
  title = 'محتوى متحرك',
  subtitle = 'عرض مستمر للمحتوى',
  items = [],
  speed = 30,
  direction = 'right'
}: ContentSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const defaultItems: ContentItem[] = [
    {
      id: '1',
      title: 'منتج رائع 1',
      description: 'وصف المنتج الأول',
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop'
    },
    {
      id: '2',
      title: 'منتج رائع 2',
      description: 'وصف المنتج الثاني',
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop'
    },
    {
      id: '3',
      title: 'منتج رائع 3',
      description: 'وصف المنتج الثالث',
      image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop'
    },
    {
      id: '4',
      title: 'منتج رائع 4',
      description: 'وصف المنتج الرابع',
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop'
    },
    {
      id: '5',
      title: 'منتج رائع 5',
      description: 'وصف المنتج الخامس',
      image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=300&fit=crop'
    },
  ];

  const activeItems = items.length > 0 ? items : defaultItems;
  // Duplicate items for infinite scroll
  const duplicatedItems = [...activeItems, ...activeItems, ...activeItems];

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let scrollPosition = 0;

    const scroll = () => {
      if (direction === 'right') {
        scrollPosition -= 1;
        if (Math.abs(scrollPosition) >= scrollContainer.scrollWidth / 3) {
          scrollPosition = 0;
        }
      } else {
        scrollPosition += 1;
        if (scrollPosition >= scrollContainer.scrollWidth / 3) {
          scrollPosition = 0;
        }
      }

      scrollContainer.style.transform = `translateX(${scrollPosition}px)`;
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);

    return () => cancelAnimationFrame(animationId);
  }, [direction]);

  return (
    <section className="py-16 bg-gradient-to-b from-gray-900 to-black overflow-hidden">
      <div className="container mx-auto px-4 mb-12">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center">
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
      </div>

      {/* Infinite Scroll Container */}
      <div className="relative">
        {/* Gradient Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />

        {/* Scrolling Content */}
        <div className="flex gap-6" ref={scrollRef} style={{ willChange: 'transform' }}>
          {duplicatedItems.map((item, index) => (
            <Card
              key={`${item.id}-${index}`}
              className="flex-shrink-0 w-80 bg-gray-900 border-gray-800 hover:border-purple-500 transition-all duration-300 overflow-hidden group"
            >
              {/* Image */}
              {item.image && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
                </div>
              )}

              {/* Content */}
              <div className="p-6 space-y-3">
                <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
