import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AnimatedBotFaceProps {
  isGreeting?: boolean;
}

export const AnimatedBotFace: React.FC<AnimatedBotFaceProps> = ({ isGreeting = false }) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [isWinking, setIsWinking] = useState(false);

  // Random blinking effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Wink when greeting
  useEffect(() => {
    if (isGreeting) {
      const winkTimeout = setTimeout(() => {
        setIsWinking(true);
        setTimeout(() => setIsWinking(false), 300);
      }, 800);

      return () => clearTimeout(winkTimeout);
    }
  }, [isGreeting]);

  return (
    <motion.div
      className="relative"
      animate={isGreeting ? { 
        y: [0, -20, 0],
        rotate: [0, -5, 5, 0],
      } : {
        y: [0, -10, 0],
      }}
      transition={{ 
        duration: isGreeting ? 0.8 : 2,
        repeat: isGreeting ? 0 : Infinity,
        ease: "easeInOut"
      }}
    >
      {/* Bot Face Container */}
      <motion.div
        className="relative w-40 h-40 rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #1a2332 0%, #0d1520 100%)',
          boxShadow: '0 0 60px rgba(76, 217, 200, 0.3), inset 0 0 30px rgba(76, 217, 200, 0.1)',
        }}
        animate={isGreeting ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.5 }}
      >
        {/* Inner glow effect */}
        <div 
          className="absolute inset-2 rounded-2xl"
          style={{
            background: 'linear-gradient(145deg, #1e2a3a 0%, #111827 100%)',
          }}
        />

        {/* Eyes Container */}
        <div className="absolute inset-0 flex items-center justify-center gap-6 pt-2">
          {/* Left Eye */}
          <motion.div
            className="relative"
            animate={isBlinking || isWinking ? { scaleY: 0.1 } : { scaleY: 1 }}
            transition={{ duration: 0.1 }}
          >
            <motion.div
              className="w-12 h-16 rounded-full"
              style={{
                background: 'linear-gradient(180deg, #4CD9C8 0%, #38b5a6 100%)',
                boxShadow: '0 0 20px rgba(76, 217, 200, 0.8), inset 0 -4px 10px rgba(0,0,0,0.3)',
              }}
              animate={isGreeting ? {
                scale: [1, 1.2, 1],
              } : {}}
              transition={{ duration: 0.3, delay: 0.2 }}
            />
            {/* Eye highlight */}
            <div 
              className="absolute top-2 left-2 w-4 h-4 rounded-full bg-white/40"
            />
          </motion.div>

          {/* Right Eye */}
          <motion.div
            className="relative"
            animate={isBlinking ? { scaleY: 0.1 } : { scaleY: 1 }}
            transition={{ duration: 0.1 }}
          >
            <motion.div
              className="w-12 h-16 rounded-full"
              style={{
                background: 'linear-gradient(180deg, #4CD9C8 0%, #38b5a6 100%)',
                boxShadow: '0 0 20px rgba(76, 217, 200, 0.8), inset 0 -4px 10px rgba(0,0,0,0.3)',
              }}
              animate={isGreeting ? {
                scale: [1, 1.2, 1],
              } : {}}
              transition={{ duration: 0.3, delay: 0.3 }}
            />
            {/* Eye highlight */}
            <div 
              className="absolute top-2 left-2 w-4 h-4 rounded-full bg-white/40"
            />
          </motion.div>
        </div>

        {/* Smile */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
          animate={isGreeting ? {
            scaleX: [1, 1.3, 1],
            scaleY: [1, 1.2, 1],
          } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <motion.div
            className="w-14 h-7 rounded-b-full border-b-4 border-x-4"
            style={{
              borderColor: '#4CD9C8',
              boxShadow: '0 4px 15px rgba(76, 217, 200, 0.5)',
            }}
          />
        </motion.div>

        {/* Cheek blush when greeting */}
        {isGreeting && (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.6, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-12 left-4 w-6 h-3 rounded-full"
              style={{
                background: 'radial-gradient(ellipse, rgba(255, 150, 180, 0.6) 0%, transparent 70%)',
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.6, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-12 right-4 w-6 h-3 rounded-full"
              style={{
                background: 'radial-gradient(ellipse, rgba(255, 150, 180, 0.6) 0%, transparent 70%)',
              }}
            />
          </>
        )}
      </motion.div>

      {/* Sparkle effects when greeting */}
      {isGreeting && (
        <>
          <motion.div
            className="absolute -top-4 -left-4 text-2xl"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
            transition={{ duration: 1.2, delay: 0.4, repeat: 1 }}
          >
            ✨
          </motion.div>
          <motion.div
            className="absolute -top-2 -right-6 text-xl"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
            transition={{ duration: 1.2, delay: 0.6, repeat: 1 }}
          >
            ✨
          </motion.div>
          <motion.div
            className="absolute top-1/2 -left-8 text-lg"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
            transition={{ duration: 1.2, delay: 0.8, repeat: 1 }}
          >
            ⭐
          </motion.div>
          <motion.div
            className="absolute top-1/2 -right-8 text-lg"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
            transition={{ duration: 1.2, delay: 1, repeat: 1 }}
          >
            ⭐
          </motion.div>
        </>
      )}

      {/* Glow effect around bot */}
      <motion.div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(76, 217, 200, 0.2) 0%, transparent 70%)',
        }}
        animate={isGreeting ? {
          opacity: [0.5, 1, 0.5],
          scale: [1, 1.2, 1],
        } : {
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ 
          duration: isGreeting ? 0.5 : 2,
          repeat: isGreeting ? 0 : Infinity,
        }}
      />
    </motion.div>
  );
};
