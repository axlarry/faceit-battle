
import React from 'react';
import { Button } from "@/components/ui/button";
import { Users, RefreshCw } from "lucide-react";

interface FriendsSectionHeaderProps {
  friendsCount: number;
  livePlayersCount: number;
  isUpdating: boolean;
  onUpdateAll: () => void;
}

export const FriendsSectionHeader = React.memo(({ 
  friendsCount, 
  livePlayersCount,
  isUpdating, 
  onUpdateAll 
}: FriendsSectionHeaderProps) => {
  return (
    <div className="flex flex-col gap-3 mb-4">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-[#ff6500] rounded-lg flex items-center justify-center shadow-lg">
            <Users size={16} className="text-white" />
          </div>
          <span>Prietenii Mei ({friendsCount}) {livePlayersCount} Players Live</span>
        </h2>
        
        <Button
          onClick={onUpdateAll}
          disabled={isUpdating}
          size="sm"
          className="bg-transparent border-2 border-[#ff6500] text-[#ff6500] hover:bg-[#ff6500] hover:text-white rounded-lg h-8 px-3 font-bold text-sm"
        >
          <RefreshCw size={14} className={`mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
          {isUpdating ? 'Actualizare...' : 'Actualizează'}
        </Button>
      </div>
      
      {/* Status Row */}
      <div className="text-xs text-gray-400">
        Actualizare automată la 15 min
      </div>
    </div>
  );
});

FriendsSectionHeader.displayName = 'FriendsSectionHeader';
