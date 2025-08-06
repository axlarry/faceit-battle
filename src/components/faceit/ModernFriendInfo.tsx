import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { EloChangeIndicator } from './EloChangeIndicator';
import { TrendIndicator } from './TrendIndicator';
import { calculateLevelFromElo } from '@/utils/levelUtils';
import { faceitAnalyserService } from '@/services/faceitAnalyserService';
import { Sparkles, Trophy, Target, TrendingUp, Calendar, Star } from 'lucide-react';

interface ModernFriendInfoProps {
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

export const ModernFriendInfo = ({ nickname, level, elo, lcryptData }: ModernFriendInfoProps) => {
  const [levelIconError, setLevelIconError] = useState(false);
  const [faceitAnalyserData, setFaceitAnalyserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Calculează nivelul dinamic din ELO
  const calculatedLevel = calculateLevelFromElo(elo);

  useEffect(() => {
    const loadFaceitAnalyserData = async () => {
      setIsLoading(true);
      try {
        const data = await faceitAnalyserService.getPlayerStats(nickname);
        setFaceitAnalyserData(data);
      } catch (error) {
        console.error('Error loading FaceitAnalyser data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFaceitAnalyserData();
  }, [nickname]);

  const handleLevelIconError = () => {
    console.error(`Failed to load level icon: ${getLevelIcon(calculatedLevel)}`);
    setLevelIconError(true);
  };

  // Calculate FA Rating (simplified version)
  const faRating = faceitAnalyserData ? 
    Math.round((faceitAnalyserData.avg_hltv * 100) * (faceitAnalyserData.wr / 100) * 10) / 10 : null;

  return (
    <div className="flex items-center gap-4">
      {/* Enhanced Skill Level Display */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400/30 to-red-400/30 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
        
        <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-600/50 rounded-xl p-3 hover:border-orange-400/50 transition-all duration-300">
          <div className="flex items-center gap-2">
            {/* Level Icon */}
            <div className="relative">
              {!levelIconError ? (
                <img
                  src={getLevelIcon(calculatedLevel)}
                  alt={`Skill Level ${calculatedLevel}`}
                  className="w-8 h-8 drop-shadow-lg"
                  onError={handleLevelIconError}
                />
              ) : (
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 px-2 py-1 text-xs font-bold">
                  {calculatedLevel}
                </Badge>
              )}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse shadow-lg"></div>
            </div>
            
            {/* Level Info */}
            <div className="flex flex-col">
              <span className="text-white text-xs font-semibold">Level {calculatedLevel}</span>
              {faceitAnalyserData && (
                <div className="flex items-center gap-1">
                  <Star size={10} className="text-yellow-400" />
                  <span className="text-yellow-400 text-xs font-bold">FA: {faRating}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced ELO Display */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
        
        <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-600/50 rounded-xl p-3 hover:border-blue-400/50 transition-all duration-300">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-orange-400" />
              <span className="text-orange-400 font-bold text-sm">{elo}</span>
              <span className="text-slate-300 text-xs">ELO</span>
            </div>
            
            {faceitAnalyserData && (
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp size={10} className="text-green-400" />
                <span className="text-slate-300">WR: </span>
                <span className="text-green-400 font-semibold">{faceitAnalyserData.wr}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Today Display */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/30 to-cyan-400/30 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
        
        <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-600/50 rounded-xl p-3 hover:border-emerald-400/50 transition-all duration-300 min-w-[120px]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Calendar size={12} className="text-emerald-400" />
              <span className="text-slate-300 text-xs font-medium">Today</span>
            </div>
            
            {/* ELO Change from lcryptData */}
            {lcryptData?.today?.present ? (
              <div className="flex items-center gap-2">
                <EloChangeIndicator lcryptData={lcryptData} />
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                <span className="text-slate-400 text-xs">No data</span>
              </div>
            )}
            
            {/* FaceitAnalyser recent matches info */}
            {faceitAnalyserData && (
              <div className="flex items-center gap-1 text-xs">
                <Target size={10} className="text-cyan-400" />
                <span className="text-cyan-400 font-semibold">
                  {faceitAnalyserData.avg_k} AVG K
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-400 animate-spin" />
          <span className="text-slate-400 text-xs">Loading FA data...</span>
        </div>
      )}
    </div>
  );
};