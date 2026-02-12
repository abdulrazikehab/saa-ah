import { useEffect, useRef, useState } from 'react';

interface SaaahCharacterProps {
  isHappy?: boolean;
  isError?: boolean;
  isTyping?: boolean;
}

export default function SaaahCharacter({ isHappy = false, isError = false, isTyping = false }: SaaahCharacterProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [eyePosition, setEyePosition] = useState({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } });
  const [isBlinking, setIsBlinking] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!boxRef.current) return;

      const rect = boxRef.current.getBoundingClientRect();
      const boxCenterX = rect.left + rect.width / 2;
      const boxCenterY = rect.top + rect.height / 2;

      const leftEyeX = boxCenterX - 20;
      const leftEyeY = boxCenterY - 10;
      const rightEyeX = boxCenterX + 20;
      const rightEyeY = boxCenterY - 10;

      const calculateEyePosition = (eyeX: number, eyeY: number) => {
        const angle = Math.atan2(e.clientY - eyeY, e.clientX - eyeX);
        const distance = Math.min(3, Math.hypot(e.clientX - eyeX, e.clientY - eyeY) / 60);
        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
        };
      };

      setEyePosition({
        left: calculateEyePosition(leftEyeX, leftEyeY),
        right: calculateEyePosition(rightEyeX, rightEyeY),
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div ref={boxRef} className="relative w-48 h-56 mx-auto">
      <div className={`absolute inset-0 transition-all duration-500 ${
        isHappy ? 'animate-bounce-gentle' : 
        isError ? 'animate-shake' : ''
      }`}>
        <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-2xl">
          <defs>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4ECDC4" />
              <stop offset="100%" stopColor="#3BA99C" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* BMO-style body (rounded rectangle) */}
          <rect
            x="40"
            y="40"
            width="120"
            height="160"
            rx="15"
            fill="url(#bodyGradient)"
            stroke="#2D7A6E"
            strokeWidth="4"
          />

          {/* Screen area (darker) */}
          <rect
            x="55"
            y="60"
            width="90"
            height="80"
            rx="8"
            fill="#2D7A6E"
            opacity="0.3"
          />

          {/* Face screen */}
          <rect
            x="60"
            y="65"
            width="80"
            height="70"
            rx="6"
            fill="#1A4D44"
          />

          {/* Eyes - Normal */}
          {!isError && !isBlinking && (
            <>
              {/* Left eye (dot style like BMO) */}
              <circle
                cx={85 + eyePosition.left.x}
                cy={95 + eyePosition.left.y}
                r={isHappy ? "4" : "5"}
                fill="#4ECDC4"
              />
              
              {/* Right eye */}
              <circle
                cx={115 + eyePosition.right.x}
                cy={95 + eyePosition.right.y}
                r={isHappy ? "4" : "5"}
                fill="#4ECDC4"
              />
            </>
          )}

          {/* Blinking */}
          {isBlinking && !isError && (
            <>
              <line x1="80" y1="95" x2="90" y2="95" stroke="#4ECDC4" strokeWidth="2" strokeLinecap="round"/>
              <line x1="110" y1="95" x2="120" y2="95" stroke="#4ECDC4" strokeWidth="2" strokeLinecap="round"/>
            </>
          )}

          {/* Error eyes (X X) */}
          {isError && (
            <>
              <g>
                <line x1="80" y1="90" x2="90" y2="100" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round"/>
                <line x1="90" y1="90" x2="80" y2="100" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round"/>
              </g>
              <g>
                <line x1="110" y1="90" x2="120" y2="100" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round"/>
                <line x1="120" y1="90" x2="110" y2="100" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round"/>
              </g>
            </>
          )}

          {/* Mouth - Happy (big smile) */}
          {isHappy && (
            <path
              d="M 75 115 Q 100 125 125 115"
              stroke="#4ECDC4"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          )}

          {/* Mouth - Error (sad) */}
          {isError && (
            <path
              d="M 75 120 Q 100 112 125 120"
              stroke="#FF6B6B"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          )}

          {/* Mouth - Normal (small line) */}
          {!isHappy && !isError && (
            <line
              x1="85"
              y1="118"
              x2="115"
              y2="118"
              stroke="#4ECDC4"
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}

          {/* BMO buttons */}
          <g>
            {/* Left buttons */}
            <circle cx="70" cy="160" r="4" fill="#FFD93D" opacity="0.8" />
            <circle cx="70" cy="175" r="4" fill="#6BCB77" opacity="0.8" />
            
            {/* Right buttons */}
            <circle cx="130" cy="160" r="4" fill="#FF6B6B" opacity="0.8" />
            <circle cx="130" cy="175" r="4" fill="#4D96FF" opacity="0.8" />
          </g>

          {/* D-pad (cross buttons) */}
          <g transform="translate(95, 155)">
            <rect x="-3" y="-10" width="6" height="20" rx="2" fill="#2D7A6E" opacity="0.6" />
            <rect x="-10" y="-3" width="20" height="6" rx="2" fill="#2D7A6E" opacity="0.6" />
          </g>

          {/* Sparkles when happy */}
          {isHappy && (
            <>
              <circle cx="35" cy="50" r="3" fill="#FFD93D" className="animate-ping" />
              <circle cx="165" cy="50" r="3" fill="#FFD93D" className="animate-ping" style={{ animationDelay: '0.2s' }} />
              <circle cx="100" cy="30" r="3" fill="#FFD93D" className="animate-ping" style={{ animationDelay: '0.4s' }} />
            </>
          )}

          {/* Hearts when happy */}
          {isHappy && (
            <>
              <text x="25" y="100" fontSize="20" className="animate-float-up">💚</text>
              <text x="170" y="120" fontSize="20" className="animate-float-up" style={{ animationDelay: '0.3s' }}>💚</text>
            </>
          )}
        </svg>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-8px) rotate(-3deg); }
          75% { transform: translateX(8px) rotate(3deg); }
        }
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float-up {
          0% { opacity: 0; transform: translateY(0); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-30px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 0.6s ease-in-out infinite;
        }
        .animate-float-up {
          animation: float-up 2s ease-out infinite;
        }
      `}</style>
    </div>
  );
}
