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


export const SoldierMascot: React.FC<SoldierMascotProps> = ({ friends, isLoading, size = 80, className }) => {
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
      <div className={cn("w-20 h-20 rounded-full bg-muted animate-pulse", className)} aria-label="Se încarcă mascotă" />
    );
  }

  if (count === 0) return null;

  const state = getState(avg);
  const title = `ELO Today: ${avg > 0 ? "+" + avg : avg} • ${stateLabels[state]} • ${count} au jucat`;

  // Clean animation system
  const animation = state === "veryGood" 
    ? "animate-bounce" 
    : state === "good" 
    ? "animate-pulse" 
    : state === "veryBad" 
    ? "animate-ping" 
    : "";

  // Professional color scheme
  const stateColors = {
    veryGood: "text-emerald-500",
    good: "text-green-500", 
    neutral: "text-slate-500",
    bad: "text-orange-500",
    veryBad: "text-red-500"
  };

  const glowColors = {
    veryGood: "shadow-lg shadow-emerald-500/30",
    good: "shadow-md shadow-green-500/20",
    neutral: "shadow-sm shadow-slate-500/10",
    bad: "shadow-md shadow-orange-500/20", 
    veryBad: "shadow-lg shadow-red-500/30"
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "relative inline-flex items-center justify-center transition-all duration-300",
              stateColors[state],
              animation,
              className
            )}
            aria-label={title}
            role="img"
          >
            {/* Professional glow effect */}
            <div className={cn(
              "absolute inset-0 rounded-full blur-sm opacity-40 transition-all duration-500",
              glowColors[state]
            )} />

            {/* Modern Shield Icon */}
            <svg
              width={size}
              height={size}
              viewBox="0 0 100 100"
              className="relative z-10 transition-transform duration-300 hover:scale-105"
            >
              {/* Main shield shape */}
              <path
                d="M50 10 C35 10, 25 20, 25 35 C25 55, 35 75, 50 90 C65 75, 75 55, 75 35 C75 20, 65 10, 50 10 Z"
                className="fill-current/20 stroke-current stroke-2"
              />
              
              {/* Inner shield details */}
              <path
                d="M50 18 C38 18, 30 26, 30 38 C30 54, 38 68, 50 80 C62 68, 70 54, 70 38 C70 26, 62 18, 50 18 Z"
                className="fill-current/10"
              />

              {/* Center emblem */}
              <circle
                cx="50"
                cy="42"
                r="12"
                className="fill-current/30 stroke-current stroke-1"
              />

              {/* Crosshair/target symbol */}
              <g className="stroke-current stroke-2 stroke-linecap-round">
                <line x1="50" y1="34" x2="50" y2="50" />
                <line x1="42" y1="42" x2="58" y2="42" />
                <circle cx="50" cy="42" r="4" className="fill-none stroke-current stroke-1" />
              </g>

              {/* Professional rank stripes */}
              <g className="fill-current/40">
                <rect x="35" y="60" width="8" height="2" rx="1" />
                <rect x="35" y="64" width="12" height="2" rx="1" />
                <rect x="35" y="68" width="6" height="2" rx="1" />
              </g>

              {/* Dynamic elements based on state */}
              {state === "veryGood" && (
                <g className="animate-pulse">
                  <circle cx="42" cy="30" r="2" className="fill-current/60" />
                  <circle cx="58" cy="30" r="2" className="fill-current/60" />
                  <circle cx="35" cy="45" r="1.5" className="fill-current/40" />
                  <circle cx="65" cy="45" r="1.5" className="fill-current/40" />
                </g>
              )}

              {state === "good" && (
                <g className="animate-pulse opacity-75">
                  <circle cx="40" cy="32" r="1" className="fill-current/50" />
                  <circle cx="60" cy="32" r="1" className="fill-current/50" />
                </g>
              )}

              {state === "veryBad" && (
                <g className="animate-ping">
                  <circle cx="50" cy="42" r="16" className="fill-none stroke-current/30 stroke-1" />
                  <circle cx="50" cy="42" r="20" className="fill-none stroke-current/20 stroke-1" />
                </g>
              )}
            </svg>
          </div>
        </TooltipTrigger>
        <TooltipContent className="text-xs font-medium">
          <span>{title}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SoldierMascot;
