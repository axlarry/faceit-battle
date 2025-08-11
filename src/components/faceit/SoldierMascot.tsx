import React, { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { FriendWithLcrypt } from "@/hooks/types/lcryptDataManagerTypes";

interface SoldierMascotProps {
  friends: FriendWithLcrypt[];
  isLoading?: boolean;
  size?: number;
  className?: string;
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

const thresholds = {
  veryGood: 35,
  good: 15,
  neutralLow: -10,
  bad: -30,
};

const getState = (avg: number) => {
  if (avg >= thresholds.veryGood) return "veryGood" as const;
  if (avg >= thresholds.good) return "good" as const;
  if (avg >= thresholds.neutralLow) return "neutral" as const;
  if (avg >= thresholds.bad) return "bad" as const;
  return "veryBad" as const;
};

const stateLabels: Record<ReturnType<typeof getState>, string> = {
  veryGood: "Foarte vesel",
  good: "Vesel",
  neutral: "Neutru",
  bad: "Trist",
  veryBad: "Foarte trist",
};

const stateClasses: Record<ReturnType<typeof getState>, string> = {
  veryGood: "text-primary animate-float-gentle",
  good: "text-primary/80 animate-float-gentle",
  neutral: "text-foreground/70",
  bad: "text-destructive/80",
  veryBad: "text-destructive",
};

export const SoldierMascot: React.FC<SoldierMascotProps> = ({ friends, isLoading, size = 44, className }) => {
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
      <div className={cn("w-11 h-11 rounded-full bg-muted animate-pulse", className)} aria-label="Se încarcă mascotă" />
    );
  }

  if (count === 0) return null;

  const state = getState(avg);
  const title = `ELO Today: ${avg > 0 ? "+" + avg : avg} • ${stateLabels[state]} • ${count} au jucat`;

  // Expressions per state
  const mouthPaths: Record<ReturnType<typeof getState>, string> = {
    veryGood: "M8,16 Q12,20 16,16",
    good: "M8,16 Q12,18 16,16",
    neutral: "M8,16 L16,16",
    bad: "M8,18 Q12,14 16,18",
    veryBad: "M8,19 Q12,12 16,19",
  };

  const leftEyeY = state === "veryBad" || state === "bad" ? 11 : 10;
  const rightEyeY = leftEyeY;
  const helmetTilt = state === "veryGood" ? -4 : state === "good" ? -2 : state === "bad" ? 2 : state === "veryBad" ? 4 : 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "relative inline-flex items-center justify-center",
              stateClasses[state],
              className
            )}
            aria-label={title}
            role="img"
          >
            {/* Subtle glow ring depending on state */}
            <div className={cn(
              "absolute inset-0 rounded-full blur-md opacity-30",
              state === "veryGood" || state === "good" ? "bg-primary" : state === "neutral" ? "bg-muted-foreground" : "bg-destructive"
            )} />

            {/* Soldier SVG */}
            <svg
              width={size}
              height={size}
              viewBox="0 0 28 28"
              className={cn("relative z-10 drop-shadow", state === "veryGood" ? "animate-micro-bounce" : state === "good" ? "animate-float-gentle" : "")}
            >
              {/* Helmet */}
              <g transform={`rotate(${helmetTilt} 14 6)`}>
                <rect x="5" y="2" rx="3" ry="3" width="18" height="9" className="fill-current/80" />
                <rect x="7" y="9" width="14" height="2" className="fill-current/60" />
              </g>
              {/* Face */}
              <circle cx="12" cy="12" r="10" className="fill-card stroke-current/30" strokeWidth="1" />
              {/* Eyes */}
              <circle cx="10" cy={leftEyeY} r="1.2" className="fill-current" />
              <circle cx="14" cy={rightEyeY} r="1.2" className="fill-current" />
              {/* Mouth */}
              <path d={mouthPaths[state]} className="stroke-current" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              {/* Badge */}
              <rect x="17.5" y="12.5" width="7" height="4" rx="1" className="fill-current/20" />
              <path d="M19 13.5 L21 13.5 L20 15" className="stroke-current/70" strokeWidth="1" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        </TooltipTrigger>
        <TooltipContent className="text-xs">
          <span>{title}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SoldierMascot;
