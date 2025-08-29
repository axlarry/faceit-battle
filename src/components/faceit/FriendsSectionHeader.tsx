
import React from 'react';
import { Button } from "@/components/ui/button";
import { Users, RefreshCw } from "lucide-react";
import { TodayEloStats } from './TodayEloStats';
import { groupLivePlayersByTeam, getPlayerTeamInfo } from '@/utils/teamGroupingUtils';
import TeamHeaderConnector from './TeamHeaderConnector';
import type { FriendWithLcrypt } from "@/hooks/types/lcryptDataManagerTypes";

interface LiveMatchInfo {
  isLive: boolean;
  matchId?: string;
  competition?: string;
  matchDetails?: any;
}

interface FriendWithLcryptExtended extends FriendWithLcrypt {
  player_id: string;
  avatar: string;
  nickname: string;
}

interface FriendsSectionHeaderProps {
  friendsCount: number;
  livePlayersCount: number;
  isUpdating: boolean;
  onUpdateAll: () => void;
  lcryptFriends: FriendWithLcrypt[];
  lcryptLoading: boolean;
  liveFriends: FriendWithLcryptExtended[];
  liveMatches: Record<string, LiveMatchInfo>;
}

export const FriendsSectionHeader = React.memo(({ 
  friendsCount, 
  livePlayersCount,
  isUpdating, 
  onUpdateAll,
  lcryptFriends,
  lcryptLoading,
  liveFriends,
  liveMatches
}: FriendsSectionHeaderProps) => {
  // Group live players by teams
  const teams = groupLivePlayersByTeam(liveFriends, liveMatches);
  const soloPlayers = liveFriends.filter(friend => 
    !teams.some(team => team.players.some(p => p.player_id === friend.player_id))
  );

  return (
    <div className="flex flex-col gap-3 mb-4">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-[#ff6500] rounded-lg flex items-center justify-center shadow-lg">
              <Users size={16} className="text-white" />
            </div>
            <span>Prietenii Mei ({friendsCount})</span>
          </h2>
          {livePlayersCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-green-500/20 border border-green-500/30 rounded-full px-2 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-xs font-medium">{livePlayersCount} LIVE</span>
              </div>
              
              {/* Live Player Avatars - Grouped by Teams */}
              <div className="flex items-center gap-3">
                {/* Team Groups */}
                {teams.map((team) => (
                  <TeamHeaderConnector key={team.id}>
                    <div className="flex -space-x-1 relative">
                      {team.players.slice(0, 3).map((player) => (
                        <div
                          key={player.player_id}
                          data-team-avatar
                          className={`w-8 h-8 rounded-full border-2 ${team.color} overflow-hidden bg-gray-800 shadow-lg ring-2 ring-opacity-30`}
                          title={`${player.nickname} (Team ${team.players.length})`}
                        >
                          <img
                            src={player.avatar || '/placeholder.svg'}
                            alt={player.nickname}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {team.players.length > 3 && (
                        <div className={`w-8 h-8 rounded-full border-2 ${team.color} bg-gray-700/50 flex items-center justify-center text-xs font-bold text-white ring-2 ring-opacity-30`}>
                          +{team.players.length - 3}
                        </div>
                      )}
                      {/* Team size indicator */}
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-bold text-white bg-gray-800 rounded-full w-4 h-4 flex items-center justify-center border border-gray-600">
                        {team.players.length}
                      </div>
                    </div>
                  </TeamHeaderConnector>
                ))}

                {/* Solo Players */}
                {soloPlayers.length > 0 && (
                  <div className="flex -space-x-2">
                    {soloPlayers.slice(0, 4).map((friend) => (
                      <div 
                        key={friend.player_id} 
                        className="w-8 h-8 rounded-full border-2 border-green-400 overflow-hidden bg-gray-800 shadow-lg"
                        title={friend.nickname}
                      >
                        <img 
                          src={friend.avatar || '/placeholder.svg'} 
                          alt={friend.nickname}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {soloPlayers.length > 4 && (
                      <div className="w-8 h-8 rounded-full border-2 border-green-400 bg-green-500/30 flex items-center justify-center text-green-300 text-xs font-bold">
                        +{soloPlayers.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Right side: Today Elo Stats */}
        <TodayEloStats friends={lcryptFriends} isLoading={lcryptLoading} />
      </div>
    </div>
  );
});

FriendsSectionHeader.displayName = 'FriendsSectionHeader';
