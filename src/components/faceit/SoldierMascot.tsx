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

  // Enhanced expressions per state
  const eyePositions: Record<ReturnType<typeof getState>, { leftY: number; rightY: number; shape: string }> = {
    veryGood: { leftY: 20, rightY: 20, shape: "excited" },
    good: { leftY: 21, rightY: 21, shape: "happy" },
    neutral: { leftY: 22, rightY: 22, shape: "normal" },
    bad: { leftY: 23, rightY: 23, shape: "tired" },
    veryBad: { leftY: 21, rightY: 21, shape: "angry" },
  };

  const mouthPaths: Record<ReturnType<typeof getState>, string> = {
    veryGood: "M22,34 Q32,42 42,34",
    good: "M24,35 Q32,39 40,35",
    neutral: "M26,36 L38,36",
    bad: "M24,39 Q32,33 40,39",
    veryBad: "M22,41 Q32,29 42,41",
  };

  const isVeryHappy = state === "veryGood";
  const isHappy = state === "good" || isVeryHappy;
  const isNeutral = state === "neutral";
  const isSad = state === "bad";
  const isVerySad = state === "veryBad";

  // Enhanced animation system
  const soldierAnimation = isVeryHappy
    ? "animate-soldier-victory-dance"
    : isHappy
    ? "animate-soldier-shooting-up"
    : isNeutral
    ? "animate-soldier-patrol"
    : isSad
    ? "animate-soldier-sad-slump"
    : "animate-soldier-rage-mode";

  const weaponAnimation = isVeryHappy || isHappy
    ? "animate-weapon-recoil-strong"
    : isVerySad
    ? "animate-soldier-rage-mode"
    : "";

  const colorClass = isVeryHappy
    ? "text-accent"
    : isHappy
    ? "text-primary"
    : isNeutral
    ? "text-muted-foreground"
    : "text-destructive";

  const glowClass = isVeryHappy
    ? "shadow-lg shadow-accent/50"
    : isHappy
    ? "shadow-lg shadow-primary/50"
    : isNeutral
    ? "shadow-md shadow-muted-foreground/30"
    : "shadow-lg shadow-destructive/50";

  // Enhanced color palette with gradients
  const palette = {
    veryGood: { 
      helmet: "fill-accent", 
      helmetDetails: "fill-accent/90", 
      helmetStripe: "fill-accent/70",
      body: "fill-accent/20", 
      bodyDetails: "fill-accent/30",
      limb: "fill-accent/40", 
      weapon: "fill-primary", 
      weaponDetails: "fill-primary/80",
      muzzle: "text-accent",
      effects: "text-accent"
    },
    good: { 
      helmet: "fill-primary", 
      helmetDetails: "fill-primary/90", 
      helmetStripe: "fill-primary/70",
      body: "fill-primary/20", 
      bodyDetails: "fill-primary/30",
      limb: "fill-primary/40", 
      weapon: "fill-primary", 
      weaponDetails: "fill-primary/80",
      muzzle: "text-primary",
      effects: "text-primary"
    },
    neutral: { 
      helmet: "fill-muted-foreground", 
      helmetDetails: "fill-muted-foreground/80", 
      helmetStripe: "fill-muted-foreground/60",
      body: "fill-muted/30", 
      bodyDetails: "fill-muted-foreground/20",
      limb: "fill-muted-foreground/50", 
      weapon: "fill-muted-foreground", 
      weaponDetails: "fill-muted-foreground/70",
      muzzle: "text-muted-foreground",
      effects: "text-muted-foreground"
    },
    bad: { 
      helmet: "fill-destructive/90", 
      helmetDetails: "fill-destructive/80", 
      helmetStripe: "fill-destructive/60",
      body: "fill-destructive/15", 
      bodyDetails: "fill-destructive/25",
      limb: "fill-destructive/40", 
      weapon: "fill-destructive", 
      weaponDetails: "fill-destructive/80",
      muzzle: "text-destructive",
      effects: "text-destructive"
    },
    veryBad: { 
      helmet: "fill-destructive", 
      helmetDetails: "fill-destructive/90", 
      helmetStripe: "fill-destructive/70",
      body: "fill-destructive/20", 
      bodyDetails: "fill-destructive/30",
      limb: "fill-destructive/50", 
      weapon: "fill-destructive", 
      weaponDetails: "fill-destructive/80",
      muzzle: "text-destructive",
      effects: "text-destructive"
    },
  } as const;

  const paletteState = palette[state];
  const eyeState = eyePositions[state];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "relative inline-flex items-center justify-center",
              colorClass,
              soldierAnimation,
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

            {/* Enhanced Soldier SVG */}
            <svg
              width={size}
              height={size}
              viewBox="0 0 64 64"
              className={cn("relative z-10", glowClass)}
            >
              {/* Enhanced Military Helmet */}
              <g transform={`rotate(${isVeryHappy ? -6 : isHappy ? -3 : isSad ? 3 : isVerySad ? 6 : 0} 32 12)`}>
                <ellipse cx="32" cy="12" rx="18" ry="8" className={cn(paletteState.helmet)} />
                <ellipse cx="32" cy="10" rx="16" ry="6" className={cn(paletteState.helmetDetails)} />
                <rect x="20" y="18" width="24" height="4" rx="2" className={cn(paletteState.helmetStripe)} />
                <circle cx="26" cy="8" r="1.5" className={cn(paletteState.helmetDetails)} />
                <circle cx="38" cy="8" r="1.5" className={cn(paletteState.helmetDetails)} />
                <rect x="30" y="6" width="4" height="2" rx="1" className={cn(paletteState.helmetDetails)} />
              </g>

              {/* Enhanced Head with better proportions */}
              <circle cx="32" cy="28" r="14" className="fill-card stroke-border" strokeWidth="1" />
              
              {/* Enhanced Eyes with expressions */}
              {eyeState.shape === "excited" && (
                <>
                  <ellipse cx="26" cy={eyeState.leftY} rx="2.5" ry="3" className="fill-current" />
                  <ellipse cx="38" cy={eyeState.rightY} rx="2.5" ry="3" className="fill-current" />
                  <path d="M24 17 Q26 15 28 17" className="stroke-current" strokeWidth="1.5" fill="none" />
                  <path d="M36 17 Q38 15 40 17" className="stroke-current" strokeWidth="1.5" fill="none" />
                </>
              )}
              {eyeState.shape === "happy" && (
                <>
                  <ellipse cx="26" cy={eyeState.leftY} rx="2" ry="2.5" className="fill-current" />
                  <ellipse cx="38" cy={eyeState.rightY} rx="2" ry="2.5" className="fill-current" />
                  <path d="M24 18 Q26 16 28 18" className="stroke-current" strokeWidth="1" fill="none" />
                  <path d="M36 18 Q38 16 40 18" className="stroke-current" strokeWidth="1" fill="none" />
                </>
              )}
              {eyeState.shape === "normal" && (
                <>
                  <circle cx="26" cy={eyeState.leftY} r="2" className="fill-current" />
                  <circle cx="38" cy={eyeState.rightY} r="2" className="fill-current" />
                </>
              )}
              {eyeState.shape === "tired" && (
                <>
                  <ellipse cx="26" cy={eyeState.leftY} rx="2" ry="1.5" className="fill-current/70" />
                  <ellipse cx="38" cy={eyeState.rightY} rx="2" ry="1.5" className="fill-current/70" />
                  <path d="M24 19 Q26 21 28 19" className="stroke-current/50" strokeWidth="1" fill="none" />
                  <path d="M36 19 Q38 21 40 19" className="stroke-current/50" strokeWidth="1" fill="none" />
                </>
              )}
              {eyeState.shape === "angry" && (
                <>
                  <ellipse cx="26" cy={eyeState.leftY} rx="2.5" ry="2" className="fill-destructive" />
                  <ellipse cx="38" cy={eyeState.rightY} rx="2.5" ry="2" className="fill-destructive" />
                  <path d="M22 16 L30 19" className="stroke-current" strokeWidth="2" strokeLinecap="round" />
                  <path d="M34 19 L42 16" className="stroke-current" strokeWidth="2" strokeLinecap="round" />
                </>
              )}

              {/* Enhanced Mouth expressions */}
              <path d={mouthPaths[state]} className="stroke-current" strokeWidth="2.5" fill="none" strokeLinecap="round" />

              {/* Enhanced Military Body with details */}
              <rect x="20" y="36" width="24" height="16" rx="6" className={cn(paletteState.body)} />
              <rect x="22" y="38" width="20" height="12" rx="4" className={cn(paletteState.bodyDetails)} />
              {/* Military patches */}
              <rect x="24" y="40" width="3" height="2" rx="0.5" className={cn(paletteState.helmetDetails)} />
              <rect x="37" y="40" width="3" height="2" rx="0.5" className={cn(paletteState.helmetDetails)} />
              {/* Chest pockets */}
              <rect x="26" y="44" width="4" height="3" rx="1" className={cn(paletteState.bodyDetails)} />
              <rect x="34" y="44" width="4" height="3" rx="1" className={cn(paletteState.bodyDetails)} />

              {/* Enhanced Left arm with articulation */}
              <g transform="translate(20,40)">
                <ellipse cx="0" cy="0" rx="3" ry="6" className={cn(paletteState.limb, isNeutral && "animate-tired-breathe")} />
                <rect x="-8" y="2" width="12" height="5" rx="2.5" className={cn(paletteState.limb, isNeutral && "animate-tired-breathe")} />
                <circle cx="-6" cy="4" r="1.5" className={cn(paletteState.bodyDetails)} />
              </g>

              {/* Enhanced Right arm with detailed weapon */}
              <g transform="translate(44,40)" className={cn(weaponAnimation)}>
                <g className={cn(isHappy && "animate-recoil-loop", isVerySad && "animate-rage-shake")}
                   style={{ transformOrigin: "0px 0px" }}>
                  {/* Shoulder */}
                  <ellipse cx="0" cy="0" rx="3" ry="6" className={cn(paletteState.limb)} />
                  {/* Forearm */}
                  <rect x="0" y="2" width="14" height="5" rx="2.5" className={cn(paletteState.limb)} />
                  <circle cx="12" cy="4" r="1.5" className={cn(paletteState.bodyDetails)} />
                  
                  {/* Enhanced AK-47 Style Weapon */}
                  <g transform="translate(12,0)">
                    {/* Main body */}
                    <rect x="0" y="2" width="18" height="5" rx="2" className={cn(paletteState.weapon)} />
                    {/* Stock */}
                    <rect x="-4" y="3" width="6" height="3" rx="1" className={cn(paletteState.weaponDetails)} />
                    {/* Barrel */}
                    <rect x="16" y="3" width="8" height="3" rx="1.5" className={cn(paletteState.weapon)} />
                    {/* Grip */}
                    <rect x="4" y="6" width="3" height="6" rx="1.5" className={cn(paletteState.weaponDetails)} />
                    {/* Magazine */}
                    <rect x="6" y="7" width="6" height="8" rx="2" className={cn(paletteState.weaponDetails)} />
                    {/* Trigger guard */}
                    <path d="M8 6 Q10 8 12 6" className="stroke-current" strokeWidth="1" fill="none" />
                    {/* Scope/sight */}
                    <rect x="12" y="1" width="4" height="1.5" rx="0.5" className={cn(paletteState.weaponDetails)} />
                    
                    {/* Enhanced Muzzle flash for happy states */}
                    {isHappy && (
                      <g className={cn("animate-muzzle-flash-burst", paletteState.effects)}>
                        <polygon points="24,4.5 28,3 30,4.5 28,6 24,4.5" className="fill-current" />
                        <polygon points="26,4.5 30,2 32,4.5 30,7 26,4.5" className="fill-current/70" />
                        <line x1="24" y1="4.5" x2="32" y2="4.5" className="stroke-current" strokeWidth="2" />
                        {/* Sparks */}
                        <circle cx="28" cy="2" r="0.5" className={cn("fill-current animate-victory-sparks")} />
                        <circle cx="30" cy="7" r="0.5" className={cn("fill-current animate-victory-sparks")} />
                      </g>
                    )}
                    
                    {/* Victory fireworks for very happy */}
                    {isVeryHappy && (
                      <g className={cn("animate-victory-sparks", paletteState.effects)}>
                        <circle cx="28" cy="0" r="1" className="fill-current" />
                        <circle cx="32" cy="-2" r="0.8" className="fill-current/80" />
                        <circle cx="26" cy="-1" r="0.6" className="fill-current/60" />
                        <path d="M28 0 L30 -4 M28 0 L26 -3 M28 0 L32 -1" className="stroke-current" strokeWidth="1" />
                      </g>
                    )}
                  </g>
                </g>
              </g>

              {/* Enhanced Legs with military boots */}
              <g>
                <rect x="24" y="52" width="6" height="10" rx="3" className={cn(paletteState.limb, isNeutral && "animate-tired-breathe")} />
                <rect x="34" y="52" width="6" height="10" rx="3" className={cn(paletteState.limb, isNeutral && "animate-tired-breathe")} />
                {/* Military boots */}
                <ellipse cx="27" cy="61" rx="4" ry="2" className={cn(paletteState.weaponDetails)} />
                <ellipse cx="37" cy="61" rx="4" ry="2" className={cn(paletteState.weaponDetails)} />
                {/* Boot details */}
                <rect x="25" y="60" width="4" height="1" className={cn(paletteState.helmetDetails)} />
                <rect x="35" y="60" width="4" height="1" className={cn(paletteState.helmetDetails)} />
              </g>

              {/* Enhanced Rage effects */}
              {isVerySad && (
                <g className={cn("animate-rage-steam", paletteState.effects)}>
                  <circle cx="32" cy="28" r="22" className="stroke-current/20" strokeWidth="2" fill="none" />
                  <circle cx="32" cy="28" r="26" className="stroke-current/10" strokeWidth="1" fill="none" />
                  {/* Steam from ears */}
                  <g className="animate-smoke-puff">
                    <ellipse cx="18" cy="24" rx="2" ry="4" className="fill-current/30" />
                    <ellipse cx="46" cy="24" rx="2" ry="4" className="fill-current/30" />
                  </g>
                  {/* Anger symbols */}
                  <g className="animate-rage-shake">
                    <path d="M12 8 L16 12 L12 16" className="stroke-current" strokeWidth="2" fill="none" strokeLinecap="round" />
                    <path d="M52 8 L48 12 L52 16" className="stroke-current" strokeWidth="2" fill="none" strokeLinecap="round" />
                    <path d="M8 12 L12 8 L16 12 L12 16 Z" className="fill-current/20" />
                    <path d="M48 12 L52 8 L56 12 L52 16 Z" className="fill-current/20" />
                  </g>
                </g>
              )}

              {/* Enhanced effects for neutral state */}
              {isNeutral && (
                <g className={cn("animate-tired-breathe", paletteState.effects)}>
                  <path d="M44 20 C45 18, 47 18, 46 21 C45 23, 43 23, 44 20 Z" className="fill-current/40" />
                  <ellipse cx="45" cy="19" rx="0.5" ry="1" className="fill-current/20" />
                </g>
              )}

              {/* Victory celebration effects */}
              {isVeryHappy && (
                <g className={cn("animate-victory-sparks", paletteState.effects)}>
                  <circle cx="16" cy="16" r="1" className="fill-current/60" />
                  <circle cx="48" cy="16" r="1" className="fill-current/60" />
                  <circle cx="20" cy="48" r="0.8" className="fill-current/40" />
                  <circle cx="44" cy="48" r="0.8" className="fill-current/40" />
                  <path d="M16 16 L18 12 M16 16 L12 14 M16 16 L20 18" className="stroke-current/40" strokeWidth="1" />
                  <path d="M48 16 L46 12 M48 16 L52 14 M48 16 L44 18" className="stroke-current/40" strokeWidth="1" />
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
