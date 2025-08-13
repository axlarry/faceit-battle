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


export const SoldierMascot: React.FC<SoldierMascotProps> = ({ friends, isLoading, size = 56, className }) => {
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

  // Expressions per state (face)
  const mouthPaths: Record<ReturnType<typeof getState>, string> = {
    veryGood: "M24,34 Q32,40 40,34",
    good: "M24,35 Q32,38 40,35",
    neutral: "M24,36 L40,36",
    bad: "M24,38 Q32,32 40,38",
    veryBad: "M24,40 Q32,28 40,40",
  };

  const isVeryHappy = state === "veryGood";
  const isHappy = state === "good" || isVeryHappy;
  const isNeutral = state === "neutral";
  const isSad = state === "bad";
  const isVerySad = state === "veryBad";

  const containerAnim = isVeryHappy
    ? "animate-elo-positive-strong"
    : isHappy
    ? "animate-elo-positive"
    : isNeutral
    ? "animate-elo-neutral"
    : isSad
    ? "animate-elo-negative"
    : "animate-elo-negative-strong";

  const colorClass = isVeryHappy
    ? "text-accent"
    : isHappy
    ? "text-primary"
    : isNeutral
    ? "text-muted-foreground"
    : "text-destructive";

  const glowClass = isVeryHappy
    ? "bg-accent"
    : isHappy
    ? "bg-primary"
    : isNeutral
    ? "bg-muted-foreground"
    : "bg-destructive";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "relative inline-flex items-center justify-center",
              colorClass,
              containerAnim,
              className
            )}
            aria-label={title}
            role="img"
          >
            {/* Subtle glow ring depending on state */}
            <div className={cn(
              "absolute inset-0 rounded-full blur-md opacity-30",
              glowClass
            )} />

            {/* Soldier SVG */}
            <svg
              width={size}
              height={size}
              viewBox="0 0 64 64"
              className={cn("relative z-10 drop-shadow")}
            >
              {/* Helmet */}
              <g transform={`rotate(${isVeryHappy ? -6 : isHappy ? -3 : isSad ? 3 : isVerySad ? 6 : 0} 32 12)`}>
                <rect x="14" y="4" rx="6" ry="6" width="36" height="16" className="fill-current/80" />
                <rect x="18" y="18" width="28" height="3" className="fill-current/60" />
              </g>

              {/* Head */}
              <circle cx="28" cy="28" r="16" className="fill-card stroke-current/30" strokeWidth="1.5" />

              {/* Eyes */}
              <circle cx="24" cy={isSad || isVerySad ? 22 : 21} r="2" className="fill-current" />
              <circle cx="32" cy={isSad || isVerySad ? 22 : 21} r="2" className="fill-current" />

              {/* Eyebrows for rage */}
              {(isSad || isVerySad) && (
                <g className={cn(isVerySad && "animate-rage-shake")}> 
                  <path d="M20 18 L26 16" className="stroke-current" strokeWidth="2" strokeLinecap="round" />
                  <path d="M30 16 L36 18" className="stroke-current" strokeWidth="2" strokeLinecap="round" />
                </g>
              )}

              {/* Mouth */}
              <path d={mouthPaths[state]} className="stroke-current" strokeWidth="2" fill="none" strokeLinecap="round" />

              {/* Body */}
              <rect x="22" y="36" width="22" height="14" rx="4" className="fill-current/15" />

              {/* Left arm (idle) */}
              <g transform="translate(22,38)">
                <rect x="-8" y="4" width="10" height="4" rx="2" className={cn("fill-current/40", isNeutral && "animate-tired-breathe")} />
              </g>

              {/* Right arm with weapon */}
              <g transform="translate(44,38)">
                {/* Shoulder pivot at (0,0) */}
                <g className={cn(isHappy && "animate-recoil-loop", isVerySad && "animate-rage-shake")}
                   style={{ transformOrigin: "0px 0px" }}>
                  <rect x="0" y="4" width="12" height="4" rx="2" className="fill-current/60" />
                  {/* Weapon */}
                  <g transform="translate(10,2)">
                    <rect x="0" y="2" width="16" height="4" rx="2" className="fill-current" />
                    <rect x="14" y="1" width="4" height="2" className="fill-current" />
                    {/* Muzzle flash (happy) */}
                    {isHappy && (
                      <g className="animate-flash-burst text-accent">
                        <polygon points="20,3 24,5 20,7 21,5" className="fill-current" />
                        <line x1="18" y1="4" x2="26" y2="4" className="stroke-current/70" strokeWidth="1" />
                      </g>
                    )}
                  </g>
                </g>
              </g>

              {/* Legs */}
              <g>
                <rect x="26" y="50" width="4" height="8" rx="2" className={cn("fill-current/40", isNeutral && "animate-tired-breathe")} />
                <rect x="36" y="50" width="4" height="8" rx="2" className={cn("fill-current/40", isNeutral && "animate-tired-breathe")} />
              </g>

              {/* Rage aura */}
              {isVerySad && (
                <g className="animate-rage-shake">
                  <circle cx="28" cy="28" r="20" className="stroke-current/30" strokeWidth="1.5" fill="none" />
                  <path d="M12 10 L16 12 L12 14" className="stroke-current" strokeWidth="1" fill="none" />
                  <path d="M44 10 L48 12 L44 14" className="stroke-current" strokeWidth="1" fill="none" />
                </g>
              )}

              {/* Sweat drop for neutral */}
              {isNeutral && (
                <g className="text-secondary animate-tired-breathe">
                  <path d="M40 20 C41 18, 43 18, 42 21 C41 23, 39 23, 40 20 Z" className="fill-current/60" />
                </g>
              )}
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
