import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type FriendWithLcrypt } from '@/hooks/types/lcryptDataManagerTypes';

interface EloTodaySummaryProps {
  friends: FriendWithLcrypt[];
  isLoading?: boolean;
}

const parseTodayElo = (elo: unknown): number | null => {
  if (elo === null || elo === undefined) return null;
  if (typeof elo === 'number' && !Number.isNaN(elo)) return elo;
  if (typeof elo === 'string') {
    const parsed = parseInt(elo);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const thresholds = {
  veryGood: 35,
  good: 15,
  neutralLow: -10,
  bad: -30,
};

const getState = (avg: number) => {
  if (avg >= thresholds.veryGood) return 'veryGood' as const;
  if (avg >= thresholds.good) return 'good' as const;
  if (avg >= thresholds.neutralLow) return 'neutral' as const;
  if (avg >= thresholds.bad) return 'bad' as const;
  return 'veryBad' as const;
};

const stateLabels: Record<ReturnType<typeof getState>, string> = {
  veryGood: 'Very good day',
  good: 'Good day',
  neutral: 'Neutral day',
  bad: 'Bad day',
  veryBad: 'Very bad day',
};

const stateClasses: Record<ReturnType<typeof getState>, string> = {
  veryGood:
    'bg-gradient-to-r from-primary/20 to-primary/10 ring-1 ring-primary/40 animate-elo-positive-strong',
  good:
    'bg-gradient-to-r from-primary/10 to-primary/5 ring-1 ring-primary/30 animate-elo-positive',
  neutral:
    'bg-muted ring-1 ring-border animate-elo-neutral',
  bad:
    'bg-gradient-to-r from-destructive/10 to-destructive/5 ring-1 ring-destructive/30 animate-elo-negative',
  veryBad:
    'bg-gradient-to-r from-destructive/20 to-destructive/10 ring-1 ring-destructive/40 animate-elo-negative-strong',
};

export const EloTodaySummary: React.FC<EloTodaySummaryProps> = ({ friends, isLoading }) => {
  const { avg, count } = useMemo(() => {
    const todays = (friends || [])
      .map((f) => {
        const present = f.lcryptData?.today?.present;
        const value = parseTodayElo(f.lcryptData?.today?.elo);
        return present && value !== null ? value : null;
      })
      .filter((v): v is number => v !== null);

    if (todays.length === 0) return { avg: 0, count: 0 };
    const sum = todays.reduce((a, b) => a + b, 0);
    return { avg: Math.round(sum / todays.length), count: todays.length };
  }, [friends]);

  if (isLoading && count === 0) {
    return (
      <section aria-label="ELO Today summary" className="mb-3">
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">ELO Today</CardTitle>
            <CardDescription>Loading today performance…</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-40" />
          </CardContent>
        </Card>
      </section>
    );
  }

  if (count === 0) return null;

  const state = getState(avg);
  const sign = avg > 0 ? `+${avg}` : `${avg}`;

  return (
    <section aria-label="ELO Today summary" className="mb-3">
      <Card className={`glass-card overflow-hidden ${stateClasses[state]}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">ELO Today</CardTitle>
          <CardDescription>{count} played today</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-semibold tracking-tight">{sign}</span>
              <span className="text-sm text-muted-foreground">average change</span>
            </div>
            <div className="text-sm font-medium">{stateLabels[state]}</div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default EloTodaySummary;
