import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ContentSliderProps {
  items: Array<{
    id: string;
    content: ReactNode;
    icon?: string;
    title?: string;
    description?: string;
  }>;
  direction?: 'horizontal' | 'vertical';
  speed?: number; // Duration in seconds for one complete cycle
  pauseOnHover?: boolean;
  itemWidth?: string;
  itemHeight?: string;
  gap?: string;
  backgroundColor?: string;
  textColor?: string;
}

export function ContentSlider({
  items,
  direction = 'horizontal',
  speed = 20,
  pauseOnHover = true,
  itemWidth = '300px',
  itemHeight = 'auto',
  gap = '2rem',
  backgroundColor = 'transparent',
  textColor = 'inherit',
}: ContentSliderProps) {
  if (!items || items.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No content to display</p>
      </div>
    );
  }

  // Duplicate items for seamless loop
  const duplicatedItems = [...items, ...items, ...items];

  const isHorizontal = direction === 'horizontal';

  return (
    <div
      className="overflow-hidden relative"
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      <motion.div
        className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'}`}
        style={{
          gap,
        }}
        animate={
          isHorizontal
            ? {
                x: [0, `-${100 / 3}%`],
              }
            : {
                y: [0, `-${100 / 3}%`],
              }
        }
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
        }}
        whileHover={pauseOnHover ? { animationPlayState: 'paused' } : {}}
      >
        {duplicatedItems.map((item, index) => (
          <motion.div
            key={`${item.id}-${index}`}
            className="flex-shrink-0 p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
            style={{
              width: isHorizontal ? itemWidth : '100%',
              height: itemHeight,
            }}
            whileHover={{ scale: 1.05 }}
          >
            {/* Icon */}
            {item.icon && (
              <div className="text-4xl mb-3 text-center">{item.icon}</div>
            )}

            {/* Title */}
            {item.title && (
              <h3 className="font-bold text-lg mb-2 text-center">
                {item.title}
              </h3>
            )}

            {/* Description */}
            {item.description && (
              <p className="text-sm opacity-90 text-center">
                {item.description}
              </p>
            )}

            {/* Custom Content */}
            {item.content && <div className="mt-2">{item.content}</div>}
          </motion.div>
        ))}
      </motion.div>

      {/* Gradient Overlays for fade effect */}
      {isHorizontal ? (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-current to-transparent opacity-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-current to-transparent opacity-10 pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-current to-transparent opacity-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-current to-transparent opacity-10 pointer-events-none" />
        </>
      )}
    </div>
  );
}
