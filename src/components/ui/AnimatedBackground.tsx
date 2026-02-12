import { useEffect, useRef } from 'react';

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle system
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      color: string;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.2;
        
        // Random color from gradient palette
        const colors = [
          'rgba(139, 92, 246, ', // Purple
          'rgba(236, 72, 153, ', // Pink
          'rgba(59, 130, 246, ',  // Blue
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around screen
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color + this.opacity + ')';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Create particles
    const particlesArray: Particle[] = [];
    const numberOfParticles = 50;

    for (let i = 0; i < numberOfParticles; i++) {
      particlesArray.push(new Particle());
    }

    // Animation loop
    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesArray.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

export function GradientOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Large purple orb */}
      <div
        className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full opacity-20 blur-3xl animate-float"
        style={{
          background: 'radial-gradient(circle, hsl(250 84% 60%) 0%, transparent 70%)',
          animationDelay: '0s',
        }}
      />
      
      {/* Medium pink orb */}
      <div
        className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl animate-float"
        style={{
          background: 'radial-gradient(circle, hsl(330 85% 60%) 0%, transparent 70%)',
          animationDelay: '2s',
        }}
      />
      
      {/* Small blue orb */}
      <div
        className="absolute -bottom-1/4 left-1/3 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl animate-float"
        style={{
          background: 'radial-gradient(circle, hsl(220 90% 60%) 0%, transparent 70%)',
          animationDelay: '4s',
        }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(250 84% 60%) 1px, transparent 1px),
            linear-gradient(90deg, hsl(250 84% 60%) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
}
