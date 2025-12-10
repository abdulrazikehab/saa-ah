import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export type FaceState = 'neutral' | 'happy' | 'sad' | 'excited' | 'wink' | 'attention' | 'sleeping';

interface InteractiveFaceProps {
  state: FaceState;
  className?: string;
}

export function InteractiveFace({ state, className }: InteractiveFaceProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate normalized position (-1 to 1)
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Colors
  const colors = {
    body: '#1a1a1a',       // Dark Black/Grey
    highlight: '#333333',  // Lighter Grey for 3D effect
    eye: '#00E5FF',        // Cyan Glow
    eyeHappy: '#00FF99',   // Green for success
    eyeSad: '#FF3366',     // Red/Pink for error
    blush: '#FF6699'
  };

  // Face container variants
  const faceVariants = {
    neutral: { 
      y: 0, 
      scale: 1,
      rotate: 0,
      transition: { duration: 0.5, type: "spring" as const }
    },
    attention: { 
      scale: 1.05, 
      y: 5,
      rotate: 0,
      transition: { duration: 0.3 } 
    },
    happy: { 
      y: [0, -15, 0], 
      rotate: [0, -5, 5, 0],
      scale: 1.1,
      transition: { 
        y: { repeat: Infinity, duration: 0.6, ease: "easeInOut" as const },
        rotate: { repeat: Infinity, duration: 1, ease: "easeInOut" as const }
      } 
    }, 
    sad: { 
      x: [-5, 5, -5, 5, 0], 
      rotate: [-2, 2, -2, 2, 0],
      y: 5,
      transition: { duration: 0.4 } 
    }, 
    excited: { 
      scale: [1, 1.05, 1], 
      transition: { repeat: Infinity, duration: 0.4 } 
    },
    sleeping: {
      y: 0,
      scale: 1,
      rotate: 0,
      transition: { duration: 0.3 }
    },
  };

  // Eye Shapes
  const eyeVariants = {
    neutral: { 
      d: "M 0 0 C 0 -10 20 -10 20 0 C 20 10 0 10 0 0", 
      scaleY: 1,
      fill: colors.eye,
      stroke: "none",
      strokeWidth: 0
    },
    attention: { 
      d: "M 0 0 C 0 -5 20 -5 20 0 C 20 5 0 5 0 0", 
      scaleY: 0.8,
      fill: colors.eye,
      stroke: "none",
      strokeWidth: 0
    },
    happy: { 
      d: "M 0 5 Q 10 -5 20 5", 
      scaleY: 1,
      fill: "rgba(0,0,0,0)",
      stroke: colors.eyeHappy,
      strokeWidth: 4
    },
    sad: { 
      d: "M 0 5 L 20 0 L 20 5 L 0 10 Z", 
      scaleY: 1,
      fill: colors.eyeSad,
      stroke: "none",
      strokeWidth: 0
    },
    excited: { 
      d: "M 0 -2 L 20 -2 L 20 18 L 0 18 Z", 
      scaleY: 1,
      fill: colors.eye,
      stroke: "none",
      strokeWidth: 0
    },
    sleeping: {
      d: "M 0 0 L 20 0",
      scaleY: 1,
      fill: "rgba(0,0,0,0)",
      stroke: colors.eye,
      strokeWidth: 3
    }
  };

  // Pupil movement (only visible in some states)
  const lookX = (state === 'neutral' || state === 'excited' || state === 'attention') ? mousePosition.x * 8 : 0;
  const lookY = (state === 'neutral' || state === 'excited' || state === 'attention') ? mousePosition.y * 8 : 0;
  
  // Show hands covering eyes in sleeping state
  const showHands = state === 'sleeping';

  return (
    <motion.div
      className={`w-32 h-32 mx-auto relative ${className}`}
      animate={state}
      variants={faceVariants}
    >
      <svg viewBox="0 0 140 140" className="w-full h-full drop-shadow-2xl">
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#404040" />
            <stop offset="100%" stopColor="#101010" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Main Body - The "BlackBox" */}
        <rect 
          x="20" y="20" width="100" height="100" 
          rx="25" 
          fill="url(#bodyGradient)" 
          stroke="#555" 
          strokeWidth="1"
        />
        
        {/* Highlight for 3D effect */}
        <path d="M 30 30 Q 70 30 110 30" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.2" />

        {/* Face Container */}
        <g transform={`translate(${lookX}, ${lookY})`}>
          
          {/* Left Eye */}
          <g transform="translate(45, 60)">
            <motion.path
              initial="neutral"
              variants={eyeVariants}
              animate={state}
              filter="url(#glow)"
            />
          </g>

          {/* Right Eye */}
          <g transform="translate(75, 60)">
            <motion.path
              initial="neutral"
              variants={eyeVariants}
              animate={state}
              filter="url(#glow)"
            />
          </g>

          {/* Mouth */}
          <g transform="translate(70, 85)">
            <motion.path
              initial="neutral"
              animate={state}
              variants={{
                neutral: { d: "M -10 0 Q 0 5 10 0", stroke: colors.eye, strokeWidth: 2, fill: "rgba(0,0,0,0)" },
                attention: { d: "M -5 0 L 5 0", stroke: colors.eye, strokeWidth: 2, fill: "rgba(0,0,0,0)" }, 
                happy: { d: "M -15 -5 Q 0 15 15 -5", stroke: colors.eyeHappy, strokeWidth: 3, fill: "rgba(0,0,0,0)" },
                sad: { d: "M -10 5 Q 0 -5 10 5", stroke: colors.eyeSad, strokeWidth: 2, fill: "rgba(0,0,0,0)" },
                excited: { d: "M -10 0 Q 0 15 10 0 Z", stroke: "none", strokeWidth: 0, fill: colors.eye },
                sleeping: { d: "M -8 0 Q 0 3 8 0", stroke: colors.eye, strokeWidth: 2, fill: "rgba(0,0,0,0)" }
              }}
              strokeLinecap="round"
            />
          </g>

          {/* Hands covering eyes (sleeping state) */}
          {showHands && (
            <>
              <motion.rect
                x="40" y="50" width="25" height="20" rx="3"
                fill="#555" opacity="0.8"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 0.8, y: 0 }}
                transition={{ duration: 0.3 }}
              />
              <motion.rect
                x="75" y="50" width="25" height="20" rx="3"
                fill="#555" opacity="0.8"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 0.8, y: 0 }}
                transition={{ duration: 0.3 }}
              />
            </>
          )}

          {/* Cheeks (Blush) */}
          <motion.g 
            initial={{ opacity: 0 }}
            animate={{ opacity: (state === 'happy' || state === 'excited') ? 0.6 : 0 }}
          >
            <circle cx="35" cy="75" r="5" fill={colors.blush} filter="blur(2px)" />
            <circle cx="105" cy="75" r="5" fill={colors.blush} filter="blur(2px)" />
          </motion.g>

        </g>
      </svg>
    </motion.div>
  );
}
