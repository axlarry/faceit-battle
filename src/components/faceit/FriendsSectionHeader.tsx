
import React from 'react';
import { Button } from "@/components/ui/button";
import { Users, RefreshCw } from "lucide-react";
import { TodayEloStats } from './TodayEloStats';
import type { FriendWithLcrypt } from "@/hooks/types/lcryptDataManagerTypes";

interface FriendsSectionHeaderProps {
  friendsCount: number;
  livePlayersCount: number;
  isUpdating: boolean;
  onUpdateAll: () => void;
  lcryptFriends: FriendWithLcrypt[];
  lcryptLoading: boolean;
}

export const FriendsSectionHeader = React.memo(({ 
  friendsCount, 
  livePlayersCount,
  isUpdating, 
  onUpdateAll,
  lcryptFriends,
  lcryptLoading
}: FriendsSectionHeaderProps) => {
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
            <div className="flex items-center gap-1 bg-green-500/20 border border-green-500/30 rounded-full px-2 py-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 text-xs font-medium">{livePlayersCount} LIVE</span>
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
