
import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { EloChangeIndicator } from './EloChangeIndicator';
import { calculateLevelFromElo } from '@/utils/levelUtils';

interface FriendInfoProps {
  nickname: string;
  level?: number;
  elo: number;
  lcryptData?: any;
}

const getLevelIcon = (level: number) => {
  const iconMap: { [key: number]: string } = {
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
  
  return iconMap[level] || iconMap[1];
};

export const FriendInfo = ({ nickname, level, elo, lcryptData }: FriendInfoProps) => {
  const [levelIconError, setLevelIconError] = useState(false);
  
  // Calculează nivelul dinamic din ELO
  const calculatedLevel = calculateLevelFromElo(elo);

  const handleLevelIconError = () => {
    console.error(`Failed to load level icon: ${getLevelIcon(calculatedLevel)}`);
    setLevelIconError(true);
  };

  return (
    <>
      {/* Level Icon - Compact */}
      <div className="flex items-center gap-1">
        {!levelIconError ? (
          <img
            src={getLevelIcon(calculatedLevel)}
            alt={`Skill Level ${calculatedLevel}`}
            className="w-6 h-6"
            onError={handleLevelIconError}
          />
        ) : (
          <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 px-1 py-0 text-xs">
            {calculatedLevel}
          </Badge>
        )}
      </div>
      
      {/* ELO */}
      <span className="text-[#ff6500] font-bold text-sm">{elo} ELO</span>
      
      {/* ELO Change Indicator */}
      <EloChangeIndicator lcryptData={lcryptData} />
    </>
  );
};
