import React, { memo, useMemo } from 'react';

interface PlayerStatsCompactProps {
  wins: number;
  winRate: number;
  hsRate: number;
  kdRatio: number;
}

const StatItem = memo(({ value, label }: { value: string | number; label: string }) => (
  <div className="text-center">
    <div className="text-foreground font-bold">{value}</div>
    <div className="text-muted-foreground">{label}</div>
  </div>
));

StatItem.displayName = 'StatItem';

export const PlayerStatsCompact = memo(({ wins, winRate, hsRate, kdRatio }: PlayerStatsCompactProps) => {
  const stats = useMemo(() => [
    { value: wins, label: 'W' },
    { value: `${winRate}%`, label: 'WR' },
    { value: `${hsRate}%`, label: 'HS' },
    { value: kdRatio, label: 'K/D' },
  ], [wins, winRate, hsRate, kdRatio]);

  return (
    <div className="flex gap-3 text-xs">
      {stats.map((stat, idx) => (
        <StatItem key={idx} value={stat.value} label={stat.label} />
      ))}
    </div>
  );
});

PlayerStatsCompact.displayName = 'PlayerStatsCompact';
