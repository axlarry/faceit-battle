
import React from 'react';
import { Player } from "@/types/Player";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, UserPlus } from "lucide-react";

interface PlayerCardProps {
  player: Player;
  onShowPlayerDetails: (player: Player) => void;
  onAddFriend: (player: Player) => void;
}

export const PlayerCard = ({ player, onShowPlayerDetails, onAddFriend }: PlayerCardProps) => {
  return (
    <Card className="p-4 bg-white/5 backdrop-blur-lg border-white/10 hover:bg-white/10 transition-all duration-300">
      <div className="flex items-center gap-4 mb-4">
        {/* Rank Number */}
        <div className="flex items-center justify-center w-12 h-12 bg-orange-500/20 rounded-lg border border-orange-500/30">
          <span className="text-orange-400 font-bold text-lg">#{player.position}</span>
        </div>

        {/* Avatar */}
        <img
          src={player.avatar || '/placeholder.svg'}
          alt={player.nickname}
          className="w-12 h-12 rounded-lg border border-white/20"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder.svg';
          }}
        />

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold truncate">
            {player.nickname}
          </h3>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span>Level {player.level || 0}</span>
            <span className="text-orange-400">•</span>
            <span className="text-orange-400 font-medium">
              {player.elo || 0} ELO
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Wins</div>
          <div className="text-lg font-bold text-white">{player.wins || 0}</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Win Rate</div>
          <div className="text-lg font-bold text-green-400">{player.winRate || 0}%</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => onShowPlayerDetails(player)}
          variant="outline" 
          size="sm"
          className="flex-1 bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
        >
          <Eye size={14} className="mr-1" />
          View
        </Button>
        <Button
          onClick={() => onAddFriend(player)}
          size="sm"
          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white transition-colors"
        >
          <UserPlus size={14} className="mr-1" />
          Add
        </Button>
      </div>
    </Card>
  );
};
