import React, { useState, memo, useCallback, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { EloChangeIndicator } from './EloChangeIndicator';
import { TrendIndicator } from './TrendIndicator';
import { calculateLevelFromElo } from '@/utils/levelUtils';

interface FriendInfoProps {
  nickname: string;
  level?: number;
  elo: number;
  lcryptData?: any;
}

const LEVEL_ICONS: Record<number, string> = {
  1: '/faceit-icons/skill-level-1.png',
  2: '/faceit-icons/skill-level-2.png',
  3: '/faceit-icons/skill-level-3.png',
  4: '/faceit-icons/skill-level-4.png',
  5: '/faceit-icons/skill-level-5.png',
  6: '/faceit-icons/skill-level-6.png',
  7: '/faceit-icons/skill-level-7.png',
  8: '/faceit-icons/skill-level-8.png',
  9: '/faceit-icons/skill-level-9.png',
  10: '/faceit-icons/skill-level-10.png',
};

export const FriendInfo = memo(({ nickname, level, elo, lcryptData }: FriendInfoProps) => {
  const [levelIconError, setLevelIconError] = useState(false);
  
  const calculatedLevel = useMemo(() => calculateLevelFromElo(elo), [elo]);
  const levelIcon = useMemo(() => LEVEL_ICONS[calculatedLevel] || LEVEL_ICONS[1], [calculatedLevel]);

  const handleLevelIconError = useCallback(() => {
    setLevelIconError(true);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {!levelIconError ? (
          <img
            src={levelIcon}
            alt={`Level ${calculatedLevel}`}
            loading="lazy"
            decoding="async"
            className="w-9 h-9"
            onError={handleLevelIconError}
          />
        ) : (
          <Badge className="bg-gradient-to-r from-muted to-muted-foreground text-foreground border-0 px-1 py-0 text-xs">
            {calculatedLevel}
          </Badge>
        )}
      </div>
      
      <div className="flex flex-col gap-0.5">
        <span className="text-primary font-bold text-sm">{elo} ELO</span>
        {lcryptData?.country_ranking && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {lcryptData?.country_flag && (
              <span>{lcryptData.country_flag}</span>
            )}
            <span>#{lcryptData.country_ranking?.toLocaleString()}</span>
            {lcryptData?.region_ranking && (
              <span className="text-muted-foreground/70">• EU #{lcryptData.region_ranking?.toLocaleString()}</span>
            )}
          </div>
        )}
        <TrendIndicator trend={lcryptData?.trend} report={lcryptData?.report} />
      </div>
      
      <EloChangeIndicator lcryptData={lcryptData} />
    </div>
  );
});

FriendInfo.displayName = 'FriendInfo';
