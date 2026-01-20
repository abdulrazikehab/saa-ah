import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

export const InteractiveBackground = ({ className }: { className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  // Mouse position (0 to 1)
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Smooth mouse values
  const springConfig = { damping: 20, stiffness: 100, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;
      // We want global mouse movement to affect it, but relative to window is fine for a full-width hero
      const { innerWidth, innerHeight } = window;
      const x = e.clientX / innerWidth;
      const y = e.clientY / innerHeight;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Transform values for different blobs to create parallax
  // Blob 1: Moves opposite to mouse
  const x1 = useTransform(smoothX, [0, 1], ["-10%", "10%"]);
  const y1 = useTransform(smoothY, [0, 1], ["-10%", "10%"]);

  // Blob 2: Moves with mouse
  const x2 = useTransform(smoothX, [0, 1], ["20%", "-20%"]);
  const y2 = useTransform(smoothY, [0, 1], ["20%", "-20%"]);

  // Blob 3: Moves faster
  const x3 = useTransform(smoothX, [0, 1], ["-30%", "30%"]);
  const y3 = useTransform(smoothY, [0, 1], ["-30%", "30%"]);

  return (
    <div 
      ref={ref} 
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
    >
      <div className="absolute inset-0 bg-background/50 backdrop-blur-3xl" />
      
      {/* Blob 1 - Primary Color */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 dark:bg-primary/30 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-100"
        style={{ x: x1, y: y1 }}
      />

      {/* Blob 2 - Secondary Color */}
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-secondary/20 dark:bg-secondary/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-100"
        style={{ x: x2, y: y2 }}
      />

      {/* Blob 3 - Accent/Highlight */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/10 dark:bg-blue-500/10 rounded-full blur-[90px] mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-100"
        style={{ x: x3, y: y3 }}
      />
      
      {/* Grid Pattern Overlay for texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(#888 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
    </div>
  );
};
