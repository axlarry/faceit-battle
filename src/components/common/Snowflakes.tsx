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
  layer: 'back' | 'mid' | 'front'; // Parallax layers
  twinkle: boolean;
  twinkleSpeed: number;
  twinklePhase: number;
}

const Snowflakes = () => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  // Initialize snowflakes with variety and parallax layers
  useEffect(() => {
    const types: Snowflake['type'][] = ['crystal', 'soft', 'sparkle'];
    const layers: Snowflake['layer'][] = ['back', 'mid', 'front'];
    
    const flakes: Snowflake[] = Array.from({ length: 90 }, (_, i) => {
      const layer = layers[Math.floor(Math.random() * layers.length)];
      // Size based on layer for parallax depth
      const baseSize = layer === 'back' ? 2 : layer === 'mid' ? 4 : 7;
      const size = baseSize + Math.random() * (baseSize * 0.5);
      // Speed based on layer - front (larger) falls faster
      const baseSpeed = layer === 'back' ? 0.3 : layer === 'mid' ? 0.7 : 1.2;
      
      return {
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight * 2 - window.innerHeight,
        size,
        speed: baseSpeed + Math.random() * 0.3,
        opacity: layer === 'back' ? 0.3 : layer === 'mid' ? 0.6 : 0.9,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleAmplitude: Math.random() * 2 + 0.5,
        blur: layer === 'back' ? 2 : layer === 'mid' ? 0.8 : 0,
        type: types[Math.floor(Math.random() * types.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * (layer === 'front' ? 1.5 : 0.5),
        layer,
        twinkle: Math.random() > 0.6, // 40% of flakes twinkle
        twinkleSpeed: Math.random() * 3 + 2,
        twinklePhase: Math.random() * Math.PI * 2,
      };
    });
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

  // Calculate twinkle opacity
  const getTwinkleOpacity = (flake: Snowflake) => {
    if (!flake.twinkle) return flake.opacity;
    const twinkle = Math.sin(timeRef.current * flake.twinkleSpeed + flake.twinklePhase);
    const twinkleFactor = 0.3 + (twinkle + 1) * 0.35; // Range: 0.3 to 1.0
    return flake.opacity * twinkleFactor;
  };

  // Sort by layer for proper z-ordering
  const sortedFlakes = useMemo(() => {
    const layerOrder = { back: 0, mid: 1, front: 2 };
    return [...snowflakes].sort((a, b) => layerOrder[a.layer] - layerOrder[b.layer]);
  }, [snowflakes]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {sortedFlakes.map(flake => {
        const currentOpacity = getTwinkleOpacity(flake);
        const glowIntensity = flake.twinkle ? 1.3 : 1;
        
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
                opacity: currentOpacity,
                transform: `translate(-50%, -50%) rotate(${flake.rotation}deg)`,
                filter: `blur(${flake.blur * 0.5}px) drop-shadow(0 0 ${flake.size * glowIntensity}px rgba(200, 230, 255, ${0.4 + (flake.twinkle ? 0.3 : 0)}))`,
                transition: flake.twinkle ? 'opacity 0.15s ease-out' : 'none',
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
                opacity: currentOpacity,
                transform: `translate(-50%, -50%) rotate(${flake.rotation}deg) scale(${flake.twinkle ? 0.9 + Math.sin(timeRef.current * flake.twinkleSpeed) * 0.15 : 1})`,
                transition: flake.twinkle ? 'transform 0.1s ease-out' : 'none',
              }}
            >
              <div
                className="w-full h-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(200,220,255,1) 50%, rgba(255,255,255,1) 100%)',
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                  filter: `drop-shadow(0 0 ${flake.size * glowIntensity}px rgba(180, 210, 255, ${0.6 + (flake.twinkle ? 0.3 : 0)}))`,
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
              opacity: currentOpacity * 0.8,
              transform: `translate(-50%, -50%) scale(${flake.twinkle ? 0.95 + Math.sin(timeRef.current * flake.twinkleSpeed) * 0.1 : 1})`,
              background: `radial-gradient(circle at 30% 30%, 
                rgba(255,255,255,1) 0%, 
                rgba(220,235,255,0.9) 30%,
                rgba(180,210,255,0.5) 60%, 
                rgba(255,255,255,0) 100%)`,
              boxShadow: `
                0 0 ${flake.size * 1.5 * glowIntensity}px rgba(255,255,255,${0.3 + (flake.twinkle ? 0.2 : 0)}),
                0 0 ${flake.size * 3 * glowIntensity}px rgba(200,220,255,${0.15 + (flake.twinkle ? 0.15 : 0)})
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
