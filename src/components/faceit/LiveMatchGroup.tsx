import React from 'react';
import { FriendListItem } from './FriendListItem';
import { Player } from "@/types/Player";
import { Users, Zap } from 'lucide-react';

interface FriendWithLcrypt extends Player {
  lcryptData?: any;
}

interface LiveMatchInfo {
  isLive: boolean;
  matchId?: string;
  competition?: string;
  matchDetails?: any;
}

interface LiveMatchGroupProps {
  matchId: string;
  players: FriendWithLcrypt[];
  liveMatches: Record<string, LiveMatchInfo>;
  flashingPlayer: string | null;
  loadingFriends: Set<string>;
  onPlayerClick: (player: Player) => void;
}

export const LiveMatchGroup = ({ 
  matchId, 
  players, 
  liveMatches, 
  flashingPlayer, 
  loadingFriends, 
  onPlayerClick 
}: LiveMatchGroupProps) => {
  const matchInfo = liveMatches[players[0]?.player_id];
  const competition = matchInfo?.competition || 'Unknown Match';

  return (
    <div className="space-y-3 mb-6">
      {/* Header pentru grupul de meci */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-emerald-400 animate-bounce" />
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
        </div>
        <div>
          <div className="text-emerald-300 font-bold text-sm">MECI LIVE</div>
          <div className="text-emerald-200/70 text-xs">{competition}</div>
        </div>
        <div className="ml-auto flex items-center gap-1 bg-emerald-500/30 px-2 py-1 rounded-full">
          <Users size={12} className="text-emerald-300" />
          <span className="text-emerald-300 text-xs font-medium">{players.length}</span>
        </div>
      </div>

      {/* Jucătorii din acest meci */}
      <div className="space-y-2 ml-4 border-l-2 border-emerald-500/30 pl-4">
        {players.map((friend, localIndex) => {
          const liveInfo = liveMatches[friend.player_id];
          // Calculez indexul global pentru stilizare
          const globalIndex = players.length > 1 ? -1 : localIndex; // -1 pentru a nu aplica stiluri de top players
          
          return (
            <FriendListItem
              key={friend.player_id}
              friend={friend}
              index={globalIndex}
              isFlashing={flashingPlayer === friend.player_id}
              isLoadingElo={loadingFriends.has(friend.nickname)}
              isLive={liveInfo?.isLive || false}
              liveCompetition={liveInfo?.competition}
              liveMatchDetails={liveInfo?.matchDetails}
              onPlayerClick={onPlayerClick}
            />
          );
        })}
      </div>
    </div>
  );
};