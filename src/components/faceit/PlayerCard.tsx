
import React from 'react';
import { Player } from "@/types/Player";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, UserPlus, Eye, Crown, Medal, Target } from "lucide-react";

interface PlayerCardProps {
  player: Player;
  onShowPlayerDetails: (player: Player) => void;
  onAddFriend: (player: Player) => void;
}

export const PlayerCard = ({ player, onShowPlayerDetails, onAddFriend }: PlayerCardProps) => {
  const getRankStyles = (position: number) => {
    if (position === 1) {
      return {
        border: 'border-yellow-400/70',
        background: 'from-yellow-600/25 via-amber-500/15 to-yellow-600/25',
        glow: 'shadow-2xl shadow-yellow-500/50',
        accent: 'yellow',
        icon: Crown
      };
    } else if (position === 2) {
      return {
        border: 'border-gray-300/60',
        background: 'from-gray-400/20 via-slate-300/10 to-gray-400/20',
        glow: 'shadow-xl shadow-gray-400/40',
        accent: 'gray',
        icon: Medal
      };
    } else if (position === 3) {
      return {
        border: 'border-orange-400/60',
        background: 'from-orange-600/20 via-amber-600/10 to-orange-600/20',
        glow: 'shadow-xl shadow-orange-500/40',
        accent: 'orange',
        icon: Medal
      };
    } else if (position <= 10) {
      return {
        border: 'border-purple-400/50',
        background: 'from-purple-600/20 via-indigo-500/10 to-purple-600/20',
        glow: 'shadow-lg shadow-purple-500/30',
        accent: 'purple',
        icon: Target
      };
    }
    
    return {
      border: 'border-slate-600/40',
      background: 'from-slate-700/30 via-slate-800/20 to-slate-700/30',
      glow: 'shadow-lg shadow-slate-900/60',
      accent: 'slate',
      icon: Trophy
    };
  };

  const rankStyles = getRankStyles(player.position || 0);
  const RankIcon = rankStyles.icon;

  return (
    <div className="relative group animate-slide-in-up" style={{ animationDelay: `${(player.position || 0) * 50}ms` }}>
      {/* Outer glow effect */}
      <div className={`absolute inset-0 rounded-3xl ${rankStyles.glow} opacity-0 group-hover:opacity-100 transition-all duration-700 blur-xl scale-105`}></div>
      
      <Card className={`
        relative overflow-hidden border-2 ${rankStyles.border} 
        hover:border-white/50 transition-all duration-700 cursor-pointer
        transform hover:scale-[1.02] hover:-translate-y-1
        backdrop-blur-xl bg-gradient-to-br ${rankStyles.background}
        group-hover:shadow-2xl
      `}>
        {/* 3D depth layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 rounded-3xl"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/5 rounded-3xl"></div>
        
        {/* Rank indicator with modern design */}
        <div className="absolute top-4 left-4 z-20">
          <div className={`
            relative flex items-center justify-center w-14 h-14 rounded-2xl font-bold text-lg
            ${player.position && player.position <= 3 
              ? 'bg-gradient-to-br from-white/20 to-white/5 border-2 border-white/30 text-white backdrop-blur-sm' 
              : 'bg-slate-800/70 text-slate-300 border border-slate-600/50'
            }
            transition-all duration-500 group-hover:scale-110
          `}>
            <RankIcon size={20} className={`text-${rankStyles.accent}-400`} />
            <span className="absolute -bottom-2 text-xs font-bold">
              #{player.position}
            </span>
          </div>
          
          {/* Rank tier indicator */}
          {player.position && player.position <= 10 && (
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 bg-${rankStyles.accent}-400 rounded-full animate-pulse shadow-lg`}>
              <div className={`absolute inset-0 bg-${rankStyles.accent}-400 rounded-full animate-ping`}></div>
            </div>
          )}
        </div>

        <div className="p-6 relative z-10">
          <div className="flex items-center gap-4 mb-4">
            {/* Enhanced Avatar */}
            <div className="relative">
              <img
                src={player.avatar}
                alt={player.nickname}
                className="w-16 h-16 rounded-2xl border-2 border-white/20 shadow-lg"
              />
              {/* Performance indicator */}
              {player.elo && player.elo > 2000 && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center border-2 border-white/20">
                  <Zap size={12} className="text-white animate-pulse" />
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white truncate mb-1">
                {player.nickname}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <span>Level {player.level}</span>
                <span className="text-orange-400">•</span>
                <span className="text-orange-400 font-semibold">
                  {player.elo} ELO
                </span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Wins</div>
              <div className="text-lg font-bold text-white">{player.wins || 0}</div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">Win Rate</div>
              <div className="text-lg font-bold text-green-400">{player.winRate || 0}%</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => onShowPlayerDetails(player)}
              className="flex-1 bg-slate-700/80 hover:bg-slate-600/90 text-white border border-slate-600/50 hover:border-slate-400/70 transition-all duration-300"
            >
              <Eye size={16} className="mr-2" />
              View
            </Button>
            <Button
              onClick={() => onAddFriend(player)}
              className="flex-1 bg-orange-600/80 hover:bg-orange-500/90 text-white border border-orange-500/50 hover:border-orange-400/70 transition-all duration-300"
            >
              <UserPlus size={16} className="mr-2" />
              Add
            </Button>
          </div>
        </div>

        {/* Shine effects */}
        <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1200 rounded-3xl"></div>
        
        {/* Floating particles for top players */}
        {player.position && player.position <= 3 && (
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-1 h-1 bg-${rankStyles.accent}-400/60 rounded-full animate-float`}
                style={{
                  left: `${20 + i * 30}%`,
                  top: `${30 + (i % 2) * 40}%`,
                  animationDelay: `${i * 1.5}s`,
                  animationDuration: `${4 + i}s`
                }}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
