import { useEffect, useState, useCallback } from 'react';

interface Snowflake {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
}

interface SleighPosition {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

const Snowflakes = () => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const [sleigh, setSleigh] = useState<SleighPosition>({ x: 100, y: 100, targetX: 100, targetY: 100 });

  // Initialize snowflakes
  useEffect(() => {
    const flakes: Snowflake[] = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight - window.innerHeight,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.7 + 0.3,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.02 + 0.01,
    }));
    setSnowflakes(flakes);
  }, []);

  // Animate snowflakes
  useEffect(() => {
    let animationId: number;
    
    const animate = () => {
      setSnowflakes(prev => prev.map(flake => {
        let newY = flake.y + flake.speed;
        let newX = flake.x + Math.sin(flake.wobble) * 0.5;
        const newWobble = flake.wobble + flake.wobbleSpeed;
        
        // Reset snowflake when it goes below screen
        if (newY > window.innerHeight) {
          newY = -10;
          newX = Math.random() * window.innerWidth;
        }
        
        return { ...flake, x: newX, y: newY, wobble: newWobble };
      }));
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Track mouse for sleigh
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setSleigh(prev => ({ ...prev, targetX: e.clientX, targetY: e.clientY }));
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Smooth sleigh animation following mouse
  useEffect(() => {
    let animationId: number;
    
    const animateSleigh = () => {
      setSleigh(prev => ({
        ...prev,
        x: prev.x + (prev.targetX - prev.x) * 0.05,
        y: prev.y + (prev.targetY - prev.y) * 0.05,
      }));
      animationId = requestAnimationFrame(animateSleigh);
    };
    
    animationId = requestAnimationFrame(animateSleigh);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Modern Snowflakes */}
      {snowflakes.map(flake => (
        <div
          key={flake.id}
          className="absolute rounded-full"
          style={{
            left: flake.x,
            top: flake.y,
            width: flake.size,
            height: flake.size,
            opacity: flake.opacity,
            background: `radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(200,220,255,0.8) 50%, rgba(255,255,255,0) 100%)`,
            boxShadow: `0 0 ${flake.size * 2}px rgba(255,255,255,0.5), 0 0 ${flake.size * 4}px rgba(200,220,255,0.3)`,
            filter: 'blur(0.5px)',
          }}
        />
      ))}
      
      {/* Sleigh with Reindeer */}
      <div
        className="absolute transition-transform duration-75"
        style={{
          left: sleigh.x - 80,
          top: sleigh.y - 25,
          transform: `rotate(${(sleigh.targetX - sleigh.x) * 0.1}deg)`,
        }}
      >
        {/* Trail sparkles */}
        <div className="absolute -right-2 top-1/2 flex gap-1">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="w-1 h-1 rounded-full bg-yellow-300 animate-pulse"
              style={{
                opacity: 0.8 - i * 0.15,
                animationDelay: `${i * 100}ms`,
                boxShadow: '0 0 4px rgba(255,215,0,0.8)',
              }}
            />
          ))}
        </div>
        
        {/* Reindeer and Sleigh SVG */}
        <svg width="160" height="50" viewBox="0 0 160 50" className="drop-shadow-lg">
          {/* Connection lines (reins) */}
          <path
            d="M75 25 Q85 22 95 25"
            stroke="#8B4513"
            strokeWidth="1"
            fill="none"
            opacity="0.7"
          />
          <path
            d="M75 28 Q85 31 95 28"
            stroke="#8B4513"
            strokeWidth="1"
            fill="none"
            opacity="0.7"
          />
          
          {/* Front Reindeer */}
          <g transform="translate(15, 12)">
            {/* Body */}
            <ellipse cx="20" cy="18" rx="15" ry="10" fill="#8B4513" />
            {/* Head */}
            <circle cx="38" cy="12" r="7" fill="#A0522D" />
            {/* Antlers */}
            <path d="M42 5 L48 -2 M45 -1 L50 0" stroke="#654321" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M35 5 L32 -2 M33 -1 L28 0" stroke="#654321" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Red nose (Rudolph!) */}
            <circle cx="44" cy="13" r="3" fill="#FF0000">
              <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />
            </circle>
            {/* Eye */}
            <circle cx="39" cy="10" r="1.5" fill="#000" />
            {/* Legs */}
            <line x1="12" y1="28" x2="10" y2="38" stroke="#654321" strokeWidth="3" strokeLinecap="round" />
            <line x1="28" y1="28" x2="30" y2="38" stroke="#654321" strokeWidth="3" strokeLinecap="round" />
          </g>
          
          {/* Back Reindeer */}
          <g transform="translate(45, 14)">
            {/* Body */}
            <ellipse cx="18" cy="16" rx="13" ry="9" fill="#A0522D" />
            {/* Head */}
            <circle cx="34" cy="11" r="6" fill="#8B4513" />
            {/* Antlers */}
            <path d="M37 5 L42 0" stroke="#654321" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M32 5 L28 0" stroke="#654321" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* Eye */}
            <circle cx="35" cy="9" r="1" fill="#000" />
            {/* Legs */}
            <line x1="10" y1="25" x2="8" y2="33" stroke="#654321" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="24" y1="25" x2="26" y2="33" stroke="#654321" strokeWidth="2.5" strokeLinecap="round" />
          </g>
          
          {/* Sleigh */}
          <g transform="translate(95, 15)">
            {/* Sleigh body */}
            <path
              d="M0 10 Q5 0 20 0 L55 0 Q65 0 60 15 L55 25 Q50 35 10 35 Q-5 35 0 20 Z"
              fill="url(#sleighGradient)"
              stroke="#8B0000"
              strokeWidth="2"
            />
            {/* Sleigh runner */}
            <path
              d="M5 32 Q0 38 -5 38 L-8 38 Q-12 38 -10 35 L60 35 Q65 35 62 38 L58 38"
              fill="#FFD700"
              stroke="#DAA520"
              strokeWidth="1"
            />
            {/* Decorative swirl */}
            <path
              d="M10 15 Q15 10 25 12"
              stroke="#FFD700"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            {/* Santa silhouette */}
            <circle cx="35" cy="5" r="8" fill="#DC143C" />
            <circle cx="35" cy="-2" r="5" fill="#FFE4C4" />
            {/* Santa hat */}
            <path d="M30 -5 Q35 -15 42 -8" fill="#DC143C" />
            <circle cx="42" cy="-8" r="2" fill="white" />
          </g>
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="sleighGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#DC143C" />
              <stop offset="50%" stopColor="#B22222" />
              <stop offset="100%" stopColor="#8B0000" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

export default Snowflakes;
