
import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface EloChangeIndicatorProps {
  lcryptData: any;
}

export const EloChangeIndicator = React.memo(({ lcryptData }: EloChangeIndicatorProps) => {
  if (!lcryptData?.today?.present) {
    return null;
  }

  let eloChange = lcryptData.today.elo;
  if (typeof eloChange === 'string') {
    eloChange = parseInt(eloChange);
  }

  if (eloChange === 0) {
    return (
      <div
        className="text-red-500 font-bold text-base flex items-center gap-1"
        style={{ animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
      >
        <span>0 today</span>
      </div>
    );
  }

  const isPositive = eloChange > 0;
  const color = isPositive ? 'text-green-500' : 'text-red-500';
  const LightningIcon = isPositive ? ArrowUp : ArrowDown;
  const displayValue = isPositive ? `+${eloChange}` : `${eloChange}`;

  return (
    <div
      className={`${color} font-bold text-base flex items-center gap-1`}
      style={{ animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
    >
      <LightningIcon size={14} className={color} />
      <span>{displayValue} today</span>
    </div>
  );
});

EloChangeIndicator.displayName = 'EloChangeIndicator';
