import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Activity, Zap, GamepadIcon } from 'lucide-react';
import { Player } from '@/types/Player';
import { faceitAnalyserService } from '@/services/faceitAnalyserService';

interface ModernTodayCardProps {
  player: Player;
  lcryptData?: any;
}

export const ModernTodayCard = ({ player, lcryptData }: ModernTodayCardProps) => {
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

  const renderEloChange = () => {
    if (!lcryptData?.today?.present) return null;
    
    let eloChange = lcryptData.today.elo;
    if (typeof eloChange === 'string') {
      eloChange = parseInt(eloChange);
    }
    
    const isPositive = eloChange > 0;
    const isZero = eloChange === 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    
    if (isZero) {
      return (
        <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-3 border border-orange-500/30">
          <Activity className="text-orange-400 w-5 h-5" />
          <div className="text-center">
            <div className="text-orange-400 font-bold text-lg">0 ELO</div>
            <div className="text-xs text-gray-400">Today</div>
          </div>
        </div>
      );
    }

    const bgGradient = isPositive 
      ? 'from-green-500/20 to-emerald-500/20' 
      : 'from-red-500/20 to-pink-500/20';
    const borderColor = isPositive ? 'border-green-500/30' : 'border-red-500/30';
    const textColor = isPositive ? 'text-green-400' : 'text-red-400';
    const displayValue = isPositive ? `+${eloChange}` : `${eloChange}`;
    
    return (
      <div className={`flex items-center justify-center gap-3 bg-gradient-to-r ${bgGradient} rounded-xl p-3 border ${borderColor}`}>
        <Icon className={`${textColor} w-5 h-5 animate-pulse`} />
        <div className="text-center">
          <div className={`${textColor} font-bold text-lg`}>{displayValue}</div>
          <div className="text-xs text-gray-400">ELO Today</div>
        </div>
      </div>
    );
  };

  const renderTodayStats = () => {
    if (!lcryptData?.today?.present) return null;
    
    const wins = lcryptData.today.win || 0;
    const losses = lcryptData.today.lose || 0;
    const totalGames = lcryptData.today.count || 0;
    
    return (
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center bg-green-500/10 rounded-lg p-2 border border-green-500/20">
          <div className="text-green-400 font-bold text-lg">{wins}</div>
          <div className="text-gray-400">Wins</div>
        </div>
        <div className="text-center bg-red-500/10 rounded-lg p-2 border border-red-500/20">
          <div className="text-red-400 font-bold text-lg">{losses}</div>
          <div className="text-gray-400">Losses</div>
        </div>
        <div className="text-center bg-blue-500/10 rounded-lg p-2 border border-blue-500/20">
          <div className="text-blue-400 font-bold text-lg">{totalGames}</div>
          <div className="text-gray-400">Total</div>
        </div>
      </div>
    );
  };

  const hasData = lcryptData?.today?.present;
  const hasMatches = hasData && (lcryptData.today.count > 0);

  return (
    <div className="relative group">
      {/* Glowing background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-all duration-500" />
      
      <div className="relative bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-emerald-400/50 transition-all duration-500 transform hover:scale-[1.02] hover:shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Calendar className="text-emerald-400 w-8 h-8" />
              {hasData && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
              )}
            </div>
            <div>
              <div className="text-xl font-bold text-white">Today</div>
              <div className="text-emerald-400 text-sm font-medium">Performance</div>
            </div>
          </div>
          <Zap className="text-yellow-400 w-6 h-6" />
        </div>

        {hasData ? (
          <div className="space-y-4">
            {/* ELO Change */}
            {renderEloChange()}
            
            {/* Today's matches stats */}
            {hasMatches && renderTodayStats()}
            
            {/* FaceitAnalyser Career Stats */}
            {faceitAnalyserData && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-2 border border-green-500/20">
                    <div className="text-green-400 font-bold">{faceitAnalyserData.w?.toLocaleString() || 'N/A'}</div>
                    <div className="text-gray-400">Wins</div>
                  </div>
                  <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-lg p-2 border border-red-500/20">
                    <div className="text-red-400 font-bold">{faceitAnalyserData.l?.toLocaleString() || 'N/A'}</div>
                    <div className="text-gray-400">Losses</div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-lg p-2 border border-orange-500/20">
                    <div className="text-orange-400 font-bold">{faceitAnalyserData.lowest_elo?.toLocaleString() || 'N/A'}</div>
                    <div className="text-gray-400">Lowest ELO</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-lg p-2 border border-purple-500/20">
                    <div className="text-purple-400 font-bold">{faceitAnalyserData.avg_d?.toFixed(2) || 'N/A'}</div>
                    <div className="text-gray-400">Avg Deaths</div>
                  </div>
                  <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-2 border border-cyan-500/20">
                    <div className="text-cyan-400 font-bold">{faceitAnalyserData.d?.toLocaleString() || 'N/A'}</div>
                    <div className="text-gray-400">Total Deaths</div>
                  </div>
                  <div className="bg-gradient-to-r from-blue-500/10 to-teal-500/10 rounded-lg p-2 border border-blue-500/20">
                    <div className="text-blue-400 font-bold">{faceitAnalyserData.avg_elo?.toLocaleString() || 'N/A'}</div>
                    <div className="text-gray-400">Avg ELO</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-3xl font-bold text-blue-400 mb-2">{player.elo}</div>
            <div className="text-gray-400 text-base mb-3">Current ELO</div>
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-3 border border-blue-500/20">
              <div className="text-xs text-gray-400">No matches played today</div>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Activity className="text-emerald-400 animate-spin w-5 h-5" />
              <span className="text-white text-sm">Loading today's data...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};