
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
  
  // Handle both string and number values for ELO change
  let eloChange = lcryptData.today.elo;
  
  // If it's a string like "+30" or "-43", parse it
  if (typeof eloChange === 'string') {
    eloChange = parseInt(eloChange);
  }
  
  console.log('ELO change from today.elo:', eloChange);
  
  // Show "0 today" in red when ELO change is 0 but player has played today
  if (eloChange === 0) {
    console.log('ELO change is 0, showing as "0 today"');
    return (
      <div className="text-red-500 font-bold text-sm flex items-center gap-1">
        <span>0 today</span>
      </div>
    );
  }
  
  const isPositive = eloChange > 0;
  const color = isPositive ? 'text-green-500' : 'text-red-500';
  const LightningIcon = isPositive ? ArrowUp : ArrowDown;
  
  // Format the ELO display correctly
  const displayValue = isPositive ? `+${eloChange}` : `${eloChange}`;
  
  return (
    <div 
      className={`${color} font-bold text-sm flex items-center gap-1`} 
      style={{
        animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }}
    >
      <LightningIcon size={14} className={color} />
      <span>{displayValue} today</span>
    </div>
  );
});

EloChangeIndicator.displayName = 'EloChangeIndicator';
