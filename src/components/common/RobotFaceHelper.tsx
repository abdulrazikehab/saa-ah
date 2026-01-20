import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Robot face expressions/moods
export type RobotMood = 'happy' | 'thinking' | 'excited' | 'wink' | 'surprised' | 'talking' | 'sleeping' | 'love';

interface RobotFaceHelperProps {
  mood?: RobotMood;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showMessage?: boolean;
  message?: string;
  onMessageClick?: () => void;
  className?: string;
  autoChangeMood?: boolean;
  isArabic?: boolean;
  followMouse?: boolean;
}

// Robot face component with animated expressions
export function RobotFaceHelper({
  mood = 'happy',
  size = 'md',
  showMessage = false,
  message,
  onMessageClick,
  className,
  autoChangeMood = false,
  isArabic = false,
  followMouse = true,
}: RobotFaceHelperProps) {
  const [currentMood, setCurrentMood] = useState<RobotMood>(mood);
  const [isBlinking, setIsBlinking] = useState(false);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for eyes
  useEffect(() => {
    if (!followMouse) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate direction from center to mouse
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      
      // Limit the eye movement range (max 3px offset)
      const maxOffset = 3;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const normalizedX = distance > 0 ? (deltaX / distance) * Math.min(distance / 50, 1) * maxOffset : 0;
      const normalizedY = distance > 0 ? (deltaY / distance) * Math.min(distance / 50, 1) * maxOffset : 0;
      
      setEyeOffset({ x: normalizedX, y: normalizedY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [followMouse]);

  // Blink randomly
  useEffect(() => {
    if (currentMood === 'sleeping' || currentMood === 'wink') return;
    
    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
      }
    }, 2500);

    return () => clearInterval(blinkInterval);
  }, [currentMood]);

  // Auto change mood periodically
  useEffect(() => {
    if (!autoChangeMood) return;
    
    const moods: RobotMood[] = ['happy', 'excited', 'wink', 'thinking'];
    const interval = setInterval(() => {
      const randomMood = moods[Math.floor(Math.random() * moods.length)];
      setCurrentMood(randomMood);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoChangeMood]);

  // Sync with prop
  useEffect(() => {
    setCurrentMood(mood);
  }, [mood]);

  // Size mapping
  const sizeClasses = {
    xs: 'w-10 h-10',
    sm: 'w-12 h-12',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28',
  };

  const eyeSize = {
    xs: { width: 8, height: 10 },
    sm: { width: 10, height: 12 },
    md: { width: 12, height: 14 },
    lg: { width: 18, height: 22 },
    xl: { width: 24, height: 30 },
  };

  const mouthSize = {
    xs: { width: 6 },
    sm: { width: 8 },
    md: { width: 10 },
    lg: { width: 16 },
    xl: { width: 22 },
  };

  const cheekSize = {
    xs: 1.5,
    sm: 2,
    md: 3,
    lg: 5,
    xl: 7,
  };

  // Eye expressions based on mood
  const getEyeStyle = (isLeft: boolean) => {
    const base = eyeSize[size];
    
    if (isBlinking) {
      return { ...base, height: 2 };
    }

    switch (currentMood) {
      case 'happy':
        return base;
      case 'thinking':
        return { ...base, height: base.height * 0.7 };
      case 'excited':
        return { ...base, height: base.height * 1.1 };
      case 'wink':
        return isLeft ? base : { ...base, height: 2 };
      case 'surprised':
        return { ...base, width: base.width * 1.2, height: base.height * 1.2 };
      case 'talking':
        return base;
      case 'sleeping':
        return { ...base, height: 2 };
      case 'love':
        return base;
      default:
        return base;
    }
  };

  // Mouth expressions based on mood
  const getMouthPath = () => {
    const w = mouthSize[size].width;
    const h = w * 0.5;

    switch (currentMood) {
      case 'happy':
        return `M 0 0 Q ${w / 2} ${h} ${w} 0`;
      case 'thinking':
        return `M 0 ${h / 2} L ${w} ${h / 2}`;
      case 'excited':
        return `M 0 0 Q ${w / 2} ${h * 1.3} ${w} 0`;
      case 'wink':
        return `M 0 0 Q ${w / 2} ${h} ${w} 0`;
      case 'surprised':
        return `M ${w * 0.3} 0 A ${w * 0.2} ${h * 0.6} 0 1 1 ${w * 0.7} 0`;
      case 'talking':
        return `M ${w * 0.2} 0 Q ${w / 2} ${h * 0.7} ${w * 0.8} 0`;
      case 'sleeping':
        return `M ${w * 0.3} ${h / 2} L ${w * 0.7} ${h / 2}`;
      case 'love':
        return `M 0 0 Q ${w / 2} ${h * 1.1} ${w} 0`;
      default:
        return `M 0 0 Q ${w / 2} ${h} ${w} 0`;
    }
  };

  const defaultMessages = useMemo(() => ({
    happy: isArabic ? 'مرحباً! كيف يمكنني مساعدتك؟' : 'Hi! How can I help you?',
    thinking: isArabic ? 'دعني أفكر...' : 'Let me think...',
    excited: isArabic ? 'رائع! لنبدأ!' : 'Awesome! Let\'s go!',
    wink: isArabic ? 'لديّ فكرة!' : 'I have an idea!',
    surprised: isArabic ? 'واو!' : 'Wow!',
    talking: isArabic ? 'أسمعك...' : 'I\'m listening...',
    sleeping: 'Zzz...',
    love: isArabic ? 'أحب متجرك!' : 'Love your store!',
  }), [isArabic]);

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)} ref={containerRef}>
      {/* Message bubble */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={cn(
              'absolute -top-14 bg-white dark:bg-slate-800 rounded-2xl px-3 py-1.5 shadow-lg border border-border cursor-pointer z-10',
              isArabic ? 'rounded-br-sm' : 'rounded-bl-sm'
            )}
            onClick={onMessageClick}
          >
            <p className="text-xs font-medium text-foreground whitespace-nowrap">
              {message || defaultMessages[currentMood]}
            </p>
            <div 
              className={cn(
                'absolute w-2 h-2 bg-white dark:bg-slate-800 border-b border-r border-border transform rotate-45',
                isArabic ? '-bottom-1 right-3' : '-bottom-1 left-3'
              )} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Robot Face Container */}
      <motion.div
        className={cn(
          sizeClasses[size],
          'relative rounded-xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border border-slate-500/50 shadow-lg overflow-hidden cursor-pointer'
        )}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Subtle glass overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        
        {/* Eyes Container */}
        <div className="absolute inset-0 flex items-center justify-center gap-[20%] pb-[8%]">
          {/* Left Eye */}
          <motion.div
            className="relative"
            animate={{
              scaleY: isBlinking ? 0.1 : 1,
              x: eyeOffset.x,
              y: eyeOffset.y,
            }}
            transition={{ duration: 0.1, x: { duration: 0.15 }, y: { duration: 0.15 } }}
          >
            <motion.div
              className="rounded-sm bg-cyan-400"
              style={{
                width: getEyeStyle(true).width,
                height: getEyeStyle(true).height,
              }}
              animate={{
                width: getEyeStyle(true).width,
                height: getEyeStyle(true).height,
              }}
              transition={{ duration: 0.2 }}
            />
            {/* Eye pupil/reflection */}
            <motion.div
              className="absolute top-[20%] left-[55%] w-[15%] h-[15%] bg-white/70 rounded-full"
              animate={{
                opacity: isBlinking ? 0 : 1,
              }}
            />
            {/* Love hearts overlay */}
            {currentMood === 'love' && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center text-red-500 text-xs"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.3 }}
              >
                ❤
              </motion.div>
            )}
          </motion.div>

          {/* Right Eye */}
          <motion.div
            className="relative"
            animate={{
              scaleY: isBlinking || (currentMood === 'wink') ? 0.1 : 1,
              x: eyeOffset.x,
              y: eyeOffset.y,
            }}
            transition={{ duration: 0.1, x: { duration: 0.15 }, y: { duration: 0.15 } }}
          >
            <motion.div
              className="rounded-sm bg-cyan-400"
              style={{
                width: getEyeStyle(false).width,
                height: getEyeStyle(false).height,
              }}
              animate={{
                width: getEyeStyle(false).width,
                height: getEyeStyle(false).height,
              }}
              transition={{ duration: 0.2 }}
            />
            {/* Eye pupil/reflection */}
            <motion.div
              className="absolute top-[20%] left-[55%] w-[15%] h-[15%] bg-white/70 rounded-full"
              animate={{
                opacity: isBlinking || (currentMood === 'wink') ? 0 : 1,
              }}
            />
            {/* Love hearts overlay */}
            {currentMood === 'love' && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center text-red-500 text-xs"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                ❤
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Mouth */}
        <motion.div
          className="absolute bottom-[18%] left-1/2 transform -translate-x-1/2"
          animate={currentMood === 'talking' ? {
            scaleY: [1, 0.6, 1],
          } : {}}
          transition={{
            duration: 0.25,
            repeat: currentMood === 'talking' ? Infinity : 0,
            repeatType: 'reverse',
          }}
        >
          <svg
            width={mouthSize[size].width + 4}
            height={mouthSize[size].width * 0.6}
            viewBox={`-2 -2 ${mouthSize[size].width + 4} ${mouthSize[size].width * 0.6}`}
          >
            <motion.path
              d={getMouthPath()}
              stroke="rgb(45, 212, 191)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              initial={false}
              animate={{ d: getMouthPath() }}
              transition={{ duration: 0.3 }}
            />
          </svg>
        </motion.div>

        {/* Blush cheeks - only show for happy moods */}
        <motion.div
          className="absolute rounded-full bg-pink-400/25"
          style={{
            width: cheekSize[size],
            height: cheekSize[size],
            left: '10%',
            bottom: '22%',
          }}
          animate={{
            opacity: ['happy', 'excited', 'love', 'wink'].includes(currentMood) ? 0.5 : 0,
          }}
          transition={{ duration: 0.3 }}
        />
        <motion.div
          className="absolute rounded-full bg-pink-400/25"
          style={{
            width: cheekSize[size],
            height: cheekSize[size],
            right: '10%',
            bottom: '22%',
          }}
          animate={{
            opacity: ['happy', 'excited', 'love', 'wink'].includes(currentMood) ? 0.5 : 0,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Sleeping Z's */}
        <AnimatePresence>
          {currentMood === 'sleeping' && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute text-cyan-300 font-bold"
                  style={{
                    fontSize: size === 'sm' ? '6px' : size === 'md' ? '8px' : '12px',
                    right: '8%',
                    top: '8%',
                  }}
                  initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
                  animate={{
                    opacity: [0, 1, 0],
                    y: -15 - i * 8,
                    x: 8 + i * 4,
                    scale: 0.7 + i * 0.15,
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                >
                  Z
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default RobotFaceHelper;
