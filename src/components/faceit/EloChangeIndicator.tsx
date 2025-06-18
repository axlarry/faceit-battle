
import React from 'react';

interface EloChangeIndicatorProps {
  lcryptData: any;
}

export const EloChangeIndicator = React.memo(({ lcryptData }: EloChangeIndicatorProps) => {
  console.log('Rendering ELO change for lcryptData:', lcryptData);
  
  if (!lcryptData?.today?.present) {
    console.log('No today data present');
    return null;
  }
  
  const eloWin = lcryptData.today.elo_win || 0;
  const eloLose = lcryptData.today.elo_lose || 0;
  const totalChange = eloWin + eloLose;
  
  console.log('ELO changes - Win:', eloWin, 'Lose:', eloLose, 'Total:', totalChange);
  
  if (totalChange === 0) {
    console.log('Total change is 0, not showing');
    return null;
  }
  
  const isPositive = totalChange > 0;
  const color = isPositive ? 'text-green-400' : 'text-red-400';
  const arrow = isPositive ? '↑' : '↓';
  
  return (
    <div 
      className={`${color} font-bold text-sm animate-pulse flex items-center gap-1`} 
      style={{
        animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }}
    >
      <span>{arrow}</span>
      <span>{Math.abs(totalChange)}</span>
    </div>
  );
});

EloChangeIndicator.displayName = 'EloChangeIndicator';
