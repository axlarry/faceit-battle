import { useEffect, useState, useRef, useMemo } from 'react';

interface Snowflake {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  wobblePhase: number;
  wobbleAmplitude: number;
  blur: number;
  type: 'crystal' | 'soft' | 'sparkle';
  rotation: number;
  rotationSpeed: number;
}

const Snowflakes = () => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  // Initialize snowflakes with variety
  useEffect(() => {
    const types: Snowflake['type'][] = ['crystal', 'soft', 'sparkle'];
    const flakes: Snowflake[] = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight * 2 - window.innerHeight,
      size: Math.random() * 6 + 3,
      speed: Math.random() * 1.2 + 0.3,
      opacity: Math.random() * 0.6 + 0.4,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleAmplitude: Math.random() * 2 + 1,
      blur: Math.random() * 1.5,
      type: types[Math.floor(Math.random() * types.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2,
    }));
    setSnowflakes(flakes);
  }, []);

  // Smooth animation loop
  useEffect(() => {
    const animate = () => {
      timeRef.current += 0.016;
      
      setSnowflakes(prev => prev.map(flake => {
        let newY = flake.y + flake.speed;
        const wobbleOffset = Math.sin(timeRef.current * 2 + flake.wobblePhase) * flake.wobbleAmplitude;
        let newX = flake.x + wobbleOffset * 0.1;
        const newRotation = flake.rotation + flake.rotationSpeed;
        
        // Reset when below screen
        if (newY > window.innerHeight + 20) {
          newY = -20;
          newX = Math.random() * window.innerWidth;
        }
        
        // Keep within bounds horizontally
        if (newX < -20) newX = window.innerWidth + 20;
        if (newX > window.innerWidth + 20) newX = -20;
        
        return { ...flake, x: newX, y: newY, rotation: newRotation };
      }));
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Memoized crystal SVG path
  const crystalPath = useMemo(() => (
    <g>
      <line x1="12" y1="0" x2="12" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="21" y1="3" x2="3" y2="21" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      {/* Crystal branches */}
      <line x1="12" y1="4" x2="8" y2="0" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="12" y1="4" x2="16" y2="0" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="12" y1="20" x2="8" y2="24" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="12" y1="20" x2="16" y2="24" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="4" y1="12" x2="0" y2="8" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="4" y1="12" x2="0" y2="16" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="20" y1="12" x2="24" y2="8" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="20" y1="12" x2="24" y2="16" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
    </g>
  ), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {snowflakes.map(flake => {
        if (flake.type === 'crystal') {
          return (
            <svg
              key={flake.id}
              className="absolute text-white/90"
              width={flake.size * 2.5}
              height={flake.size * 2.5}
              viewBox="0 0 24 24"
              style={{
                left: flake.x,
                top: flake.y,
                opacity: flake.opacity,
                transform: `translate(-50%, -50%) rotate(${flake.rotation}deg)`,
                filter: `blur(${flake.blur * 0.5}px) drop-shadow(0 0 ${flake.size}px rgba(200, 230, 255, 0.6))`,
              }}
            >
              {crystalPath}
            </svg>
          );
        }
        
        if (flake.type === 'sparkle') {
          return (
            <div
              key={flake.id}
              className="absolute"
              style={{
                left: flake.x,
                top: flake.y,
                width: flake.size,
                height: flake.size,
                opacity: flake.opacity,
                transform: `translate(-50%, -50%) rotate(${flake.rotation}deg)`,
              }}
            >
              <div
                className="w-full h-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(200,220,255,1) 50%, rgba(255,255,255,1) 100%)',
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                  filter: `drop-shadow(0 0 ${flake.size}px rgba(180, 210, 255, 0.8))`,
                }}
              />
            </div>
          );
        }
        
        // Soft type - gentle bokeh-like dots
        return (
          <div
            key={flake.id}
            className="absolute rounded-full"
            style={{
              left: flake.x,
              top: flake.y,
              width: flake.size,
              height: flake.size,
              opacity: flake.opacity * 0.8,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle at 30% 30%, 
                rgba(255,255,255,1) 0%, 
                rgba(220,235,255,0.9) 30%,
                rgba(180,210,255,0.5) 60%, 
                rgba(255,255,255,0) 100%)`,
              boxShadow: `
                0 0 ${flake.size * 1.5}px rgba(255,255,255,0.4),
                0 0 ${flake.size * 3}px rgba(200,220,255,0.2)
              `,
              filter: `blur(${flake.blur}px)`,
            }}
          />
        );
      })}
      
      {/* Subtle ambient glow overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(200,220,255,0.03) 0%, transparent 50%)',
        }}
      />
    </div>
  );
};

export default Snowflakes;
