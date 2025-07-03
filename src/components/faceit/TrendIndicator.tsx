import React from 'react';

interface TrendIndicatorProps {
  trend?: string;
}

export const TrendIndicator = React.memo(({ trend }: TrendIndicatorProps) => {
  if (!trend) return null;

  return (
    <div className="flex items-center gap-0.5">
      {trend.split('').map((letter, index) => (
        <span
          key={index}
          className={`font-bold text-sm ${
            letter.toLowerCase() === 'w' ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {letter}
        </span>
      ))}
    </div>
  );
});

TrendIndicator.displayName = 'TrendIndicator';