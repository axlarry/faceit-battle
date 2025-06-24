
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
    <Card className="p-4 bg-gray-800/60 border-gray-700/50 hover:bg-gray-700/60 transition-colors">
      <div className="flex items-center gap-4">
        {/* Rank Number */}
        <div className="flex items-center justify-center w-10 h-10 bg-orange-500/20 rounded-lg border border-orange-500/30">
          <span className="text-orange-400 font-bold">#{player.position}</span>
        </div>

        {/* Avatar */}
        <img
          src={player.avatar || '/placeholder.svg'}
          alt={player.nickname}
          className="w-12 h-12 rounded-lg border border-gray-600"
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
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Level {player.level || 0}</span>
            <span className="text-orange-400">•</span>
            <span className="text-orange-400 font-medium">
              {player.elo || 0} ELO
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-6 text-sm">
          <div className="text-center">
            <div className="text-gray-400">Wins</div>
            <div className="text-white font-bold">{player.wins || 0}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Win Rate</div>
            <div className="text-green-400 font-bold">{player.winRate || 0}%</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => onShowPlayerDetails(player)}
            variant="outline" 
            size="sm"
            className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <Eye size={14} className="mr-1" />
            Detalii
          </Button>
          <Button
            onClick={() => onAddFriend(player)}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <UserPlus size={14} className="mr-1" />
            Adaugă
          </Button>
        </div>
      </div>
    </Card>
  );
};
