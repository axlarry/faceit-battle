import React from 'react';
import { TrendingUp, TrendingDown, Minus, Users, Trophy } from 'lucide-react';
import type { FriendWithLcrypt } from "@/hooks/types/lcryptDataManagerTypes";

interface TodayEloStatsProps {
  friends: FriendWithLcrypt[];
  isLoading?: boolean;
}

const parseTodayElo = (elo: unknown): number | null => {
  if (elo === null || elo === undefined) return null;
  if (typeof elo === "number" && !Number.isNaN(elo)) return elo;
  if (typeof elo === "string") {
    const parsed = parseInt(elo);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

export const TodayEloStats = ({ friends, isLoading }: TodayEloStatsProps) => {
  const stats = React.useMemo(() => {
    const todaysElos = (friends || [])
      .map((f) => {
        const present = f.lcryptData?.today?.present;
        const value = parseTodayElo(f.lcryptData?.today?.elo);
        return present && value !== null ? value : null;
      })
      .filter((v): v is number => v !== null);

    if (todaysElos.length === 0) return { avg: 0, count: 0, positive: 0, negative: 0, neutral: 0 };
    
    const sum = todaysElos.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / todaysElos.length);
    const positive = todaysElos.filter(v => v > 0).length;
    const negative = todaysElos.filter(v => v < 0).length;
    const neutral = todaysElos.filter(v => v === 0).length;
    
    return { avg, count: todaysElos.length, positive, negative, neutral };
  }, [friends]);

  if (isLoading && stats.count === 0) {
    return (
      <div className="flex gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-muted animate-pulse rounded-xl w-20 h-16" />
        ))}
      </div>
    );
  }

  if (stats.count === 0) return null;

  const getAvgColor = (avg: number) => {
    if (avg >= 20) return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
    if (avg >= 5) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (avg >= -5) return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    if (avg >= -20) return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  const getAvgIcon = (avg: number) => {
    if (avg > 0) return <TrendingUp size={14} />;
    if (avg < 0) return <TrendingDown size={14} />;
    return <Minus size={14} />;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Media ELO Today */}
      <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border ${getAvgColor(stats.avg)} backdrop-blur-sm`}>
        {getAvgIcon(stats.avg)}
        <div className="text-xs">
          <div className="font-bold">{stats.avg > 0 ? '+' : ''}{stats.avg}</div>
          <div className="opacity-70">AVG</div>
        </div>
      </div>

      {/* Jucători activi astăzi */}
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border bg-blue-500/20 border-blue-500/30 text-blue-400 backdrop-blur-sm">
        <Users size={14} />
        <div className="text-xs">
          <div className="font-bold">{stats.count}</div>
          <div className="opacity-70">ACTIVI</div>
        </div>
      </div>

      {/* Cei cu ELO pozitiv */}
      {stats.positive > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border bg-emerald-500/20 border-emerald-500/30 text-emerald-400 backdrop-blur-sm">
          <Trophy size={14} />
          <div className="text-xs">
            <div className="font-bold">{stats.positive}</div>
            <div className="opacity-70">+ELO</div>
          </div>
        </div>
      )}
    </div>
  );
};