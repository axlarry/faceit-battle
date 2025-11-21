import { useEffect, useState } from 'react';

const Snowflakes = () => {
  const [snowflakes, setSnowflakes] = useState<Array<{
    id: number;
    left: string;
    animationDuration: string;
    animationDelay: string;
    fontSize: string;
    opacity: number;
  }>>([]);

  useEffect(() => {
    const flakes = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 10 + 10}s`,
      animationDelay: `${Math.random() * 10}s`,
      fontSize: `${Math.random() * 0.8 + 0.5}em`,
      opacity: Math.random() * 0.6 + 0.4,
    }));
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="snowflakes pointer-events-none fixed inset-0 z-50">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake absolute"
          style={{
            left: flake.left,
            animationDuration: flake.animationDuration,
            animationDelay: flake.animationDelay,
            fontSize: flake.fontSize,
            opacity: flake.opacity,
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );
};

export default Snowflakes;
