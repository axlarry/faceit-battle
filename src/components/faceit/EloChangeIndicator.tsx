
import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface EloChangeIndicatorProps {
  lcryptData: any;
}

export const EloChangeIndicator = React.memo(({ lcryptData }: EloChangeIndicatorProps) => {
  console.log('Rendering ELO change for lcryptData:', lcryptData);
  
  if (!lcryptData?.today?.present) {
    console.log('No today data present');
    return null;
  }
  
  const eloChange = lcryptData.today.elo || 0;
  
  console.log('ELO change from today.elo:', eloChange);
  
  if (eloChange === 0) {
    console.log('ELO change is 0, not showing');
    return null;
  }
  
  const isPositive = eloChange > 0;
  const color = isPositive ? 'text-green-500' : 'text-red-500'; // More vibrant colors
  const LightningIcon = isPositive ? ArrowUp : ArrowDown;
  
  return (
    <div 
      className={`${color} font-bold text-sm flex items-center gap-1`} 
      style={{
        animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }}
    >
      <LightningIcon size={14} className={color} />
      <span>+{Math.abs(eloChange)} today</span>
    </div>
  );
});

EloChangeIndicator.displayName = 'EloChangeIndicator';
