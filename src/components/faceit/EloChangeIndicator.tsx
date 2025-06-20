
import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface EloChangeIndicatorProps {
  lcryptData: any;
}

export const EloChangeIndicator = React.memo(({ lcryptData }: EloChangeIndicatorProps) => {
  console.log('EloChangeIndicator - lcryptData:', lcryptData);
  
  if (!lcryptData) {
    console.log('EloChangeIndicator - No lcryptData provided');
    return null;
  }
  
  if (!lcryptData.today?.present) {
    console.log('EloChangeIndicator - No today data present for:', lcryptData);
    return null;
  }
  
  // Handle both string and number values for ELO change
  let eloChange = lcryptData.today.elo;
  
  // If it's a string like "+30" or "-43", parse it
  if (typeof eloChange === 'string') {
    // Remove + sign if present and parse as integer
    eloChange = parseInt(eloChange.replace('+', ''));
  }
  
  console.log('EloChangeIndicator - Parsed ELO change:', eloChange);
  
  if (isNaN(eloChange) || eloChange === 0) {
    console.log('EloChangeIndicator - ELO change is 0 or invalid, not showing');
    return null;
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
