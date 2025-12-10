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
  layer: 'back' | 'mid' | 'front';
  twinkle: boolean;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface SnowPile {
  id: number;
  x: number;
  width: number;
  height: number;
  opacity: number;
}

const Snowflakes = () => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const [snowPiles, setSnowPiles] = useState<SnowPile[]>([]);
  const [wind, setWind] = useState({ strength: 0, direction: 1 });
  const animationRef = useRef<number>();
  const timeRef = useRef(0);
  const windRef = useRef({ strength: 0, target: 0, direction: 1 });

  // Initialize snowflakes and snow piles
  useEffect(() => {
    const types: Snowflake['type'][] = ['crystal', 'soft', 'sparkle'];
    const layers: Snowflake['layer'][] = ['back', 'mid', 'front'];
    
    const flakes: Snowflake[] = Array.from({ length: 90 }, (_, i) => {
      const layer = layers[Math.floor(Math.random() * layers.length)];
      const baseSize = layer === 'back' ? 2 : layer === 'mid' ? 4 : 7;
      const size = baseSize + Math.random() * (baseSize * 0.5);
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
        twinkle: Math.random() > 0.6,
        twinkleSpeed: Math.random() * 3 + 2,
        twinklePhase: Math.random() * Math.PI * 2,
      };
    });
    setSnowflakes(flakes);

    // Initialize snow piles at bottom
    const piles: SnowPile[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: (i / 25) * window.innerWidth + Math.random() * 40 - 20,
      width: Math.random() * 80 + 60,
      height: Math.random() * 15 + 8,
      opacity: Math.random() * 0.3 + 0.7,
    }));
    setSnowPiles(piles);
  }, []);

  // Wind gusts - occasional random wind
  useEffect(() => {
    const windInterval = setInterval(() => {
      // 30% chance of wind gust
      if (Math.random() > 0.7) {
        windRef.current = {
          strength: 0,
          target: Math.random() * 3 + 1,
          direction: Math.random() > 0.5 ? 1 : -1,
        };
      }
    }, 3000);

    return () => clearInterval(windInterval);
  }, []);

  // Smooth animation loop
  useEffect(() => {
    const animate = () => {
      timeRef.current += 0.016;
      
      // Smooth wind transition
      const windDiff = windRef.current.target - windRef.current.strength;
      if (Math.abs(windDiff) > 0.01) {
        windRef.current.strength += windDiff * 0.02;
      } else {
        // Decay wind
        windRef.current.target *= 0.995;
      }
      
      const currentWind = windRef.current.strength * windRef.current.direction;
      
      setSnowflakes(prev => prev.map(flake => {
        // Wind affects layers differently (front more, back less)
        const windMultiplier = flake.layer === 'front' ? 1.5 : flake.layer === 'mid' ? 1 : 0.5;
        const windEffect = currentWind * windMultiplier;
        
        let newY = flake.y + flake.speed;
        const wobbleOffset = Math.sin(timeRef.current * 2 + flake.wobblePhase) * flake.wobbleAmplitude;
        let newX = flake.x + wobbleOffset * 0.1 + windEffect * 0.5;
        const newRotation = flake.rotation + flake.rotationSpeed + windEffect * 0.5;
        
        // Reset when below screen
        if (newY > window.innerHeight + 20) {
          newY = -20;
          newX = Math.random() * window.innerWidth;
        }
        
        // Keep within bounds horizontally
        if (newX < -50) newX = window.innerWidth + 50;
        if (newX > window.innerWidth + 50) newX = -50;
        
        return { ...flake, x: newX, y: newY, rotation: newRotation };
      }));

      setWind({ strength: windRef.current.strength, direction: windRef.current.direction });
      
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
    const twinkleFactor = 0.3 + (twinkle + 1) * 0.35;
    return flake.opacity * twinkleFactor;
  };

  // Sort by layer for proper z-ordering
  const sortedFlakes = useMemo(() => {
    const layerOrder = { back: 0, mid: 1, front: 2 };
    return [...snowflakes].sort((a, b) => layerOrder[a.layer] - layerOrder[b.layer]);
  }, [snowflakes]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Snow accumulation at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none">
        {/* Base snow layer */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-6"
          style={{
            background: 'linear-gradient(to top, rgba(255,255,255,0.9) 0%, rgba(240,248,255,0.7) 50%, rgba(255,255,255,0) 100%)',
            filter: 'blur(1px)',
          }}
        />
        
        {/* Snow pile bumps */}
        {snowPiles.map(pile => (
          <div
            key={pile.id}
            className="absolute bottom-0"
            style={{
              left: pile.x,
              width: pile.width,
              height: pile.height + 6,
              background: `radial-gradient(ellipse at 50% 100%, 
                rgba(255,255,255,${pile.opacity}) 0%, 
                rgba(240,248,255,${pile.opacity * 0.8}) 40%,
                rgba(220,235,250,${pile.opacity * 0.5}) 70%,
                rgba(255,255,255,0) 100%)`,
              borderRadius: '50% 50% 0 0',
              filter: 'blur(0.5px)',
              transform: `translateX(-50%) skewX(${wind.strength * wind.direction * 2}deg)`,
              transition: 'transform 0.5s ease-out',
            }}
          />
        ))}
        
        {/* Sparkle effects on snow */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`sparkle-${i}`}
            className="absolute bottom-2"
            style={{
              left: `${(i / 12) * 100 + Math.random() * 5}%`,
              width: 3,
              height: 3,
              background: 'white',
              borderRadius: '50%',
              boxShadow: '0 0 4px 1px rgba(255,255,255,0.8)',
              opacity: 0.5 + Math.sin(timeRef.current * 3 + i) * 0.5,
              animation: `twinkle ${1.5 + Math.random()}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Snowflakes */}
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
      
      {/* Ambient glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(200,220,255,0.03) 0%, transparent 50%)',
        }}
      />

      {/* Twinkle keyframes */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default Snowflakes;
