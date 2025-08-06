import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Target, TrendingUp, Sparkles } from 'lucide-react';
import { Player } from '@/types/Player';
import { faceitAnalyserService } from '@/services/faceitAnalyserService';

interface ModernSkillCardProps {
  player: Player;
  lcryptData?: any;
}

export const ModernSkillCard = ({ player, lcryptData }: ModernSkillCardProps) => {
  const [faceitAnalyserData, setFaceitAnalyserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadFaceitAnalyserData = async () => {
      setIsLoading(true);
      try {
        const data = await faceitAnalyserService.getPlayerStats(player.nickname);
        setFaceitAnalyserData(data);
      } catch (error) {
        console.error('Error loading FaceitAnalyser data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFaceitAnalyserData();
  }, [player.nickname]);

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

  const getLevelGradient = (level: number) => {
    if (level >= 9) return 'from-red-500 via-red-400 to-orange-500';
    if (level >= 7) return 'from-purple-500 via-purple-400 to-pink-500';
    if (level >= 5) return 'from-blue-500 via-blue-400 to-cyan-500';
    if (level >= 3) return 'from-green-500 via-green-400 to-emerald-500';
    return 'from-gray-500 via-gray-400 to-slate-500';
  };

  // Calculate FA Rating
  const faRating = faceitAnalyserData ? 
    Math.round((faceitAnalyserData.avg_hltv * 100) * (faceitAnalyserData.wr / 100) * 10) / 10 : null;

  return (
    <div className="relative group">
      {/* Glowing background effect */}
      <div className={`absolute inset-0 bg-gradient-to-r ${getLevelGradient(player.level || 1)} rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-all duration-500`} />
      
      <div className="relative bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-orange-400/50 transition-all duration-500 transform hover:scale-[1.02] hover:shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={getLevelIcon(player.level || 1)}
                alt={`Skill Level ${player.level}`}
                className="w-12 h-12 drop-shadow-2xl"
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse shadow-lg" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">Level {player.level}</div>
              <div className="text-orange-400 text-sm font-medium">Skill Level</div>
            </div>
          </div>
          <Trophy className="text-orange-400 w-6 h-6" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-2xl font-bold text-orange-400">{player.elo}</div>
              <TrendingUp className="text-green-400 w-4 h-4" />
            </div>
            <div className="text-xs text-gray-400">ELO Points</div>
          </div>

          {faceitAnalyserData && (
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Star className="text-yellow-400 w-4 h-4" />
                <div className="text-2xl font-bold text-yellow-400">{faRating}</div>
              </div>
              <div className="text-xs text-gray-400">FA Rating</div>
            </div>
          )}
        </div>

        {/* Country & Region Rankings */}
        {lcryptData && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-3 border border-orange-500/30">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{lcryptData.country_flag}</span>
                <div>
                  <div className="text-orange-400 font-bold text-lg">#{lcryptData.country_ranking}</div>
                  <div className="text-xs text-gray-400">Country Rank</div>
                </div>
              </div>
            </div>
            
            {lcryptData.region_ranking && (
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl p-3 border border-blue-500/30">
                <div className="flex items-center gap-3">
                  <Target className="text-blue-400 w-6 h-6" />
                  <div>
                    <div className="text-blue-400 font-bold text-lg">#{lcryptData.region_ranking}</div>
                    <div className="text-xs text-gray-400">Region Rank</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Additional FA Stats */}
        {faceitAnalyserData && (
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="text-center">
              <div className="text-green-400 font-bold">{faceitAnalyserData.wr}%</div>
              <div className="text-gray-400">Win Rate</div>
            </div>
            <div className="text-center">
              <div className="text-cyan-400 font-bold">{faceitAnalyserData.avg_k}</div>
              <div className="text-gray-400">Avg Kills</div>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-400 animate-spin w-5 h-5" />
              <span className="text-white text-sm">Loading FA data...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};