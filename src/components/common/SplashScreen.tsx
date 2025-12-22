import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLogoUrl } from '@/config/logo.config';
import { Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Step 1: Logo Animation (0-2s)
    const timer1 = setTimeout(() => {
      setStep(1);
    }, 2000);

    // Step 2: Motivation Text (2-4s)
    const timer2 = setTimeout(() => {
      setStep(2);
    }, 4500);

    // Step 3: Finish (5s)
    const timer3 = setTimeout(() => {
      onFinish();
    }, 5500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      
      {/* Animated Orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity, delay: 2 }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
      />

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="logo"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 flex flex-col items-center"
          >
            <div className="relative p-8 rounded-3xl bg-card/50 backdrop-blur-xl border border-primary/20 shadow-2xl shadow-primary/20 mb-8">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-3xl border border-dashed border-primary/30"
              />
              <img 
                src={getLogoUrl()} 
                alt="Saeaa Logo" 
                className="h-32 w-auto object-contain"
              />
            </div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold gradient-text"
            >
              Saeaa
            </motion.h1>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="motivation"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 text-center max-w-2xl px-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <Sparkles className="w-8 h-8 text-primary" />
            </motion.div>
            
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              <span className="block text-foreground mb-2">رحلتك نحو النجاح</span>
              <span className="gradient-text-aurora">تبدأ الآن</span>
            </h2>
            
            <p className="text-xl text-muted-foreground">
              نبني مستقبلك الرقمي، خطوة بخطوة
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Bar */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-64 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 5.5, ease: "linear" }}
          className="h-full gradient-primary"
        />
      </div>
    </motion.div>
  );
};
