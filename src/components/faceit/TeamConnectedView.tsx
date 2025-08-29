import React from 'react';
import { Player } from "@/types/Player";
import { FriendListItem } from './FriendListItem';
import { Users, Zap } from 'lucide-react';

interface FriendWithLcrypt extends Player {
  lcryptData?: any;
}

interface TeamGroup {
  id: string;
  players: FriendWithLcrypt[];
  matchCriteria: any;
  color: string;
}

interface LiveMatchInfo {
  isLive: boolean;
  matchId?: string;
  competition?: string;
  matchDetails?: any;
}

interface TeamConnectedViewProps {
  team: TeamGroup;
  flashingPlayer: string | null;
  loadingFriends: Set<string>;
  liveMatches: Record<string, LiveMatchInfo>;
  onPlayerClick: (player: Player) => void;
}

export const TeamConnectedView = ({
  team,
  flashingPlayer,
  loadingFriends,
  liveMatches,
  onPlayerClick
}: TeamConnectedViewProps) => {
  const matchInfo = liveMatches[team.players[0]?.player_id];
  const competition = matchInfo?.competition || 'Unknown Match';
  const mapName = team.matchCriteria?.map || 'Unknown Map';
  const score = team.matchCriteria?.score || '';

  return (
    <div className="relative space-y-2 mb-6">
      {/* Team Header */}
      <div className={`flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-xl backdrop-blur-sm ${team.color}`}>
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-emerald-400 animate-bounce" />
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
        </div>
        <div>
          <div className="text-emerald-300 font-bold text-sm">
            ECHIPA LIVE • {mapName}
          </div>
          <div className="text-emerald-200/70 text-xs">
            {competition} {score && `• ${score}`}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1 bg-emerald-500/30 px-2 py-1 rounded-full">
          <Users size={12} className="text-emerald-300" />
          <span className="text-emerald-300 text-xs font-medium">{team.players.length}</span>
        </div>
      </div>

      {/* Connected Players with Visual Lines */}
      <div className="relative">
        {/* Connecting Lines Background */}
        <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-400/60 via-emerald-400/40 to-emerald-400/60"></div>
        
        {/* Team Players */}
        <div className="space-y-1 relative">
          {team.players.map((player, playerIndex) => {
            const liveInfo = liveMatches[player.player_id];
            const isFirst = playerIndex === 0;
            const isLast = playerIndex === team.players.length - 1;
            
            return (
              <div key={player.player_id} className="relative">
                {/* Connection Node */}
                <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10">
                  <div className={`w-4 h-4 rounded-full border-2 border-emerald-400 bg-background/80 backdrop-blur-sm ${team.color}`}>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mx-auto mt-0.5 animate-pulse"></div>
                  </div>
                </div>

                {/* Horizontal Line to Player */}
                <div className="absolute left-10 top-1/2 w-6 h-px bg-gradient-to-r from-emerald-400/60 to-transparent"></div>

                {/* Player Item with Left Margin */}
                <div className="ml-16">
                  <FriendListItem
                    friend={player}
                    index={-1} // No ranking styling for team players
                    isFlashing={flashingPlayer === player.player_id}
                    isLoadingElo={loadingFriends.has(player.nickname)}
                    isLive={liveInfo?.isLive || false}
                    liveCompetition={liveInfo?.competition}
                    liveMatchDetails={liveInfo?.matchDetails}
                    onPlayerClick={onPlayerClick}
                  />
                </div>

                {/* Team Connection Indicator */}
                {!isLast && (
                  <div className="absolute left-8 bottom-0 w-px h-3 bg-emerald-400/30"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Team Border Effect */}
        <div className="absolute inset-0 rounded-lg border border-emerald-400/20 bg-emerald-500/5 backdrop-blur-sm pointer-events-none"></div>
      </div>
    </div>
  );
};