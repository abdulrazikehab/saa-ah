import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ReactiveCartBotProps {
  isGreeting?: boolean;
}

export const ReactiveCartBot: React.FC<ReactiveCartBotProps> = ({ isGreeting = false }) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  // Blinking effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 2500);

    return () => clearInterval(blinkInterval);
  }, []);

  // Heart reaction when greeting
  useEffect(() => {
    if (isGreeting) {
      const heartTimer = setTimeout(() => {
        setShowHeart(true);
      }, 500);
      return () => clearTimeout(heartTimer);
    }
  }, [isGreeting]);

  return (
    <motion.div
      className="relative"
      initial={{ scale: 0.5, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 blur-3xl -z-10"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{
          background: 'radial-gradient(circle, rgba(76, 217, 200, 0.5) 0%, transparent 70%)',
          transform: 'scale(2)',
        }}
      />

      {/* Main container with bounce */}
      <motion.div
        className="relative"
        animate={isGreeting ? {
          y: [0, -25, 0, -15, 0],
          rotate: [0, -5, 5, -3, 0],
        } : {
          y: [0, -10, 0],
        }}
        transition={isGreeting ? {
          duration: 1,
          times: [0, 0.3, 0.5, 0.7, 1],
        } : {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg
          width="280"
          height="320"
          viewBox="0 0 280 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_40px_rgba(76,217,200,0.5)]"
        >
          {/* Gift Cards on top */}
          <g className="gift-cards">
            {/* PlayStation Card */}
            <motion.g
              animate={{ rotate: [-8, -12, -8], y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "70px 50px" }}
            >
              <rect x="45" y="20" width="50" height="70" rx="8" fill="#1a237e" stroke="#4CD9C8" strokeWidth="1.5"/>
              <text x="70" y="60" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="bold">P</text>
            </motion.g>
            
            {/* Xbox Card */}
            <motion.g
              animate={{ rotate: [5, 8, 5], y: [0, -4, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
              style={{ transformOrigin: "115px 45px" }}
            >
              <rect x="90" y="10" width="50" height="70" rx="8" fill="#107c10" stroke="#4CD9C8" strokeWidth="1.5"/>
              <text x="115" y="52" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold">X</text>
            </motion.g>
            
            {/* Steam Card */}
            <motion.g
              animate={{ rotate: [12, 16, 12], y: [0, -3, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              style={{ transformOrigin: "160px 50px" }}
            >
              <rect x="135" y="15" width="50" height="70" rx="8" fill="#1b2838" stroke="#4CD9C8" strokeWidth="1.5"/>
              <circle cx="160" cy="50" r="12" fill="none" stroke="#fff" strokeWidth="2"/>
            </motion.g>
            
            {/* Amazon Card */}
            <motion.g
              animate={{ rotate: [18, 22, 18], y: [0, -5, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              style={{ transformOrigin: "200px 55px" }}
            >
              <rect x="175" y="25" width="50" height="70" rx="8" fill="#232f3e" stroke="#4CD9C8" strokeWidth="1.5"/>
              <text x="200" y="65" textAnchor="middle" fill="#ff9900" fontSize="22" fontWeight="bold">a</text>
            </motion.g>
          </g>

          {/* Cart Body */}
          <rect x="40" y="100" width="200" height="160" rx="24" fill="url(#cartGradient)" stroke="#4CD9C8" strokeWidth="3"/>
          
          {/* Inner glow on cart */}
          <rect x="50" y="110" width="180" height="140" rx="18" fill="url(#innerGlow)" opacity="0.5"/>

          {/* Left Eye */}
          <motion.g
            animate={isBlinking ? { scaleY: 0.1 } : { scaleY: 1 }}
            transition={{ duration: 0.1 }}
            style={{ transformOrigin: "100px 170px" }}
          >
            <motion.ellipse
              cx="100"
              cy="170"
              rx="28"
              ry="35"
              fill="url(#eyeGradient)"
              animate={isGreeting ? { 
                scale: [1, 1.2, 1],
              } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
            />
            {/* Eye highlight */}
            <ellipse cx="90" cy="158" rx="10" ry="12" fill="rgba(255,255,255,0.4)"/>
            {/* Pupil effect */}
            <motion.ellipse
              cx="100"
              cy="175"
              rx="8"
              ry="10"
              fill="rgba(0,80,70,0.3)"
              animate={{ y: [0, 2, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </motion.g>

          {/* Right Eye */}
          <motion.g
            animate={isBlinking ? { scaleY: 0.1 } : { scaleY: 1 }}
            transition={{ duration: 0.1 }}
            style={{ transformOrigin: "180px 170px" }}
          >
            <motion.ellipse
              cx="180"
              cy="170"
              rx="28"
              ry="35"
              fill="url(#eyeGradient)"
              animate={isGreeting ? { 
                scale: [1, 1.2, 1],
              } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
            />
            {/* Eye highlight */}
            <ellipse cx="170" cy="158" rx="10" ry="12" fill="rgba(255,255,255,0.4)"/>
            {/* Pupil effect */}
            <motion.ellipse
              cx="180"
              cy="175"
              rx="8"
              ry="10"
              fill="rgba(0,80,70,0.3)"
              animate={{ y: [0, 2, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            />
          </motion.g>

          {/* Blush marks */}
          {isGreeting && (
            <>
              <motion.ellipse
                cx="65"
                cy="200"
                rx="15"
                ry="8"
                fill="rgba(255,150,180,0.5)"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.6, scale: 1 }}
                transition={{ delay: 0.5 }}
              />
              <motion.ellipse
                cx="215"
                cy="200"
                rx="15"
                ry="8"
                fill="rgba(255,150,180,0.5)"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.6, scale: 1 }}
                transition={{ delay: 0.5 }}
              />
            </>
          )}

          {/* Smile */}
          <motion.path
            d="M 105 220 Q 140 255 175 220"
            stroke="#4CD9C8"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            animate={isGreeting ? {
              d: ["M 105 220 Q 140 255 175 220", "M 100 215 Q 140 270 180 215", "M 105 220 Q 140 255 175 220"],
            } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{ filter: 'drop-shadow(0 0 8px rgba(76, 217, 200, 0.8))' }}
          />

          {/* Cart Wheels */}
          <motion.circle
            cx="90"
            cy="275"
            r="18"
            fill="#0d1520"
            stroke="#4CD9C8"
            strokeWidth="3"
            animate={{ rotate: isGreeting ? 360 : 0 }}
            transition={{ duration: 1, ease: "linear" }}
            style={{ transformOrigin: "90px 275px" }}
          />
          <motion.circle
            cx="190"
            cy="275"
            r="18"
            fill="#0d1520"
            stroke="#4CD9C8"
            strokeWidth="3"
            animate={{ rotate: isGreeting ? 360 : 0 }}
            transition={{ duration: 1, ease: "linear" }}
            style={{ transformOrigin: "190px 275px" }}
          />
          {/* Wheel centers */}
          <circle cx="90" cy="275" r="6" fill="#4CD9C8"/>
          <circle cx="190" cy="275" r="6" fill="#4CD9C8"/>

          {/* Cart Handle */}
          <motion.path
            d="M 240 130 L 260 130 L 260 200 Q 260 220 240 220"
            stroke="#4CD9C8"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            animate={isGreeting ? { x: [0, 5, 0] } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="cartGradient" x1="40" y1="100" x2="40" y2="260" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e2a3a"/>
              <stop offset="100%" stopColor="#0d1520"/>
            </linearGradient>
            <linearGradient id="innerGlow" x1="140" y1="110" x2="140" y2="250" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4CD9C8" stopOpacity="0.1"/>
              <stop offset="100%" stopColor="#4CD9C8" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="eyeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5fe3d3"/>
              <stop offset="100%" stopColor="#38b5a6"/>
            </linearGradient>
          </defs>
        </svg>

        {/* Floating Hearts */}
        {showHeart && (
          <>
            <motion.span
              className="absolute top-0 left-1/2 -translate-x-1/2 text-3xl"
              initial={{ opacity: 0, y: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 1, 0], 
                y: [0, -40, -60, -80],
                scale: [0, 1.2, 1, 0.8],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              💙
            </motion.span>
            <motion.span
              className="absolute top-10 left-0 text-2xl"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 1, 0], 
                y: [0, -30, -50],
                x: [-10, -20, -30],
                scale: [0, 1, 0.5],
              }}
              transition={{ duration: 1.8, repeat: Infinity, delay: 0.5 }}
            >
              💙
            </motion.span>
          </>
        )}

        {/* Sparkles */}
        <motion.span
          className="absolute -top-4 -right-4 text-2xl"
          animate={{ 
            opacity: [0, 1, 0], 
            scale: [0, 1.2, 0],
            rotate: [0, 20, 0],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ✨
        </motion.span>
        <motion.span
          className="absolute -top-4 -left-4 text-2xl"
          animate={{ 
            opacity: [0, 1, 0], 
            scale: [0, 1.2, 0],
            rotate: [0, -20, 0],
          }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 }}
        >
          ✨
        </motion.span>
        <motion.span
          className="absolute top-1/2 -right-8 text-xl"
          animate={{ 
            opacity: [0, 1, 0], 
            scale: [0, 1, 0],
          }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        >
          ⭐
        </motion.span>
      </motion.div>
    </motion.div>
  );
};
