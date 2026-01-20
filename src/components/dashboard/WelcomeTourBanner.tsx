import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTour } from './TourGuide';
import { motion, AnimatePresence } from 'framer-motion';

export default function WelcomeTourBanner() {
  const { t, i18n } = useTranslation();
  const { startTour } = useTour();
  const [isVisible, setIsVisible] = useState(false);
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    // Show banner if tour hasn't been completed
    const tourCompleted = localStorage.getItem('tour_completed');
    const bannerDismissed = sessionStorage.getItem('tour_banner_dismissed');
    
    if (!tourCompleted && !bannerDismissed) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('tour_banner_dismissed', 'true');
  };

  const handleStartTour = () => {
    setIsVisible(false);
    sessionStorage.setItem('tour_banner_dismissed', 'true');
    startTour();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ 
            type: 'spring',
            stiffness: 300,
            damping: 25
          }}
          className="mb-6"
        >
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 shadow-2xl">
              {/* Animated Background Pattern */}
              <motion.div
                className="absolute inset-0 opacity-10"
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%'],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 30%, white 1px, transparent 1px)',
                  backgroundSize: '60px 60px'
                }} />
              </motion.div>
              
              {/* Animated gradient overlay */}
              <motion.div
                className="absolute inset-0 opacity-20"
                animate={{
                  background: [
                    'radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)',
                    'radial-gradient(circle at 100% 100%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)',
                    'radial-gradient(circle at 0% 0%, rgba(255, 255, 255, 0.3) 0%, transparent 50%)',
                  ],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 opacity-30"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: 'easeInOut',
                }}
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                }}
              />

            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 z-10 text-white/80 hover:text-white hover:bg-white/20"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>

            <CardContent className="p-6 relative z-10">
              <div className={`flex items-center justify-between gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: 'spring',
                      stiffness: 300,
                      damping: 20,
                      delay: 0.2
                    }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl relative overflow-hidden"
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    />
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                      className="relative z-10"
                    >
                      <Sparkles className="w-8 h-8 text-white" />
                    </motion.div>
                  </motion.div>
                  <div className={`text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                    <motion.h3
                      initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-xl font-bold mb-1"
                    >
                      {t('tour.banner.title', 'مرحباً بك! 👋')}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-white/90 text-sm max-w-md"
                    >
                      {t('tour.banner.description', 'هل تريد جولة سريعة للتعرف على لوحة التحكم؟ سنساعدك على فهم كيفية إدارة متجرك بسهولة.')}
                    </motion.p>
                  </div>
                </div>
                
                <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="text-white/80 hover:text-white hover:bg-white/20"
                      onClick={handleDismiss}
                    >
                      {t('common.later', 'لاحقاً')}
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      size="sm"
                      className="bg-white text-teal-600 hover:bg-white/90 font-semibold shadow-xl gap-2 relative overflow-hidden group"
                      onClick={handleStartTour}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{
                          x: ['-100%', '100%'],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />
                      <motion.span
                        className="relative z-10 flex items-center gap-2"
                        animate={{
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        {t('tour.startTour', 'ابدأ الجولة')}
                        <motion.div
                          animate={{ x: [0, 3, 0] }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                        >
                          <ArrowRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                        </motion.div>
                      </motion.span>
                    </Button>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
