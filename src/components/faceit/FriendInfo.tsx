
import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { EloChangeIndicator } from './EloChangeIndicator';

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

  const handleLevelIconError = () => {
    console.error(`Failed to load level icon: ${getLevelIcon(level || 1)}`);
    setLevelIconError(true);
  };

  return (
    <div className="min-w-0 flex-1">
      <h3 className="text-xl sm:text-2xl font-bold text-white truncate">{nickname}</h3>
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2">
        <div className="flex items-center gap-2">
          {!levelIconError ? (
            <img
              src={getLevelIcon(level || 1)}
              alt={`Skill Level ${level}`}
              className="w-10 h-10 sm:w-12 sm:h-12"
              onError={handleLevelIconError}
              onLoad={() => console.log(`✅ Level icon loaded successfully: ${getLevelIcon(level || 1)}`)}
            />
          ) : (
            <Badge 
              className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 px-3 sm:px-4 py-1 text-base"
            >
              Nivel {level}
            </Badge>
          )}
        </div>
        <span className="text-[#ff6500] font-bold text-xl sm:text-2xl">{elo} ELO</span>
        <div className="w-full sm:w-auto">
          <EloChangeIndicator lcryptData={lcryptData} />
        </div>
      </div>
    </div>
  );
};
