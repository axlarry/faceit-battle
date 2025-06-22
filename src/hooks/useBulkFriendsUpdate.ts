
import { useState, useCallback } from 'react';
import { Player } from '@/types/Player';
import { useFaceitApi } from '@/hooks/useFaceitApi';
import { playerService } from '@/services/playerService';
import { LiveMatchInfo } from '@/hooks/types/lcryptDataManagerTypes';

interface UseBulkFriendsUpdateProps {
  friends: Player[];
  updateFriend: (updatedPlayer: Player) => void;
  reloadFriends: () => void;
}

export const useBulkFriendsUpdate = ({ 
  friends, 
  updateFriend,
  reloadFriends 
}: UseBulkFriendsUpdateProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { getPlayerStats } = useFaceitApi();

  const updateAllFriends = useCallback(async () => {
    if (isUpdating || friends.length === 0) return;
    
    setIsUpdating(true);
    console.log(`🔄 Starting bulk update for ${friends.length} friends`);
    
    try {
      // Process friends in smaller batches for better performance
      const batchSize = 3; // Reduced from 5 for better API handling
      const batches = [];
      
      for (let i = 0; i < friends.length; i += batchSize) {
        batches.push(friends.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        const updatePromises = batch.map(async (friend) => {
          try {
            console.log(`📊 Updating friend: ${friend.nickname}`);
            
            // Get fresh stats and live status
            const [statsData, liveStatus] = await Promise.all([
              getPlayerStats(friend.player_id),
              playerService.checkPlayerLiveMatch(friend.player_id)
            ]);

            if (statsData) {
              // Type assertion to ensure we have the correct type
              const typedLiveStatus = liveStatus as LiveMatchInfo;
              
              const updatedFriend: Player = {
                ...friend,
                level: statsData.games?.cs2?.skill_level || friend.level,
                elo: statsData.games?.cs2?.faceit_elo || friend.elo,
                isLive: typedLiveStatus.isLive || false,
                liveMatchDetails: typedLiveStatus.isLive && typedLiveStatus.matchDetails ? typedLiveStatus.matchDetails : undefined
              };

              updateFriend(updatedFriend);
              console.log(`✅ Updated ${friend.nickname}: ELO ${updatedFriend.elo}, Level ${updatedFriend.level}, Live: ${updatedFriend.isLive}`);
            }
          } catch (error) {
            console.warn(`❌ Failed to update friend ${friend.nickname}:`, error);
          }
        });

        await Promise.allSettled(updatePromises);
        
        // Add delay between batches to respect rate limits
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      console.log(`✅ Bulk update completed for all friends`);
    } catch (error) {
      console.error('❌ Error during bulk friends update:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [friends, updateFriend, getPlayerStats, isUpdating]);

  return {
    isUpdating,
    updateAllFriends
  };
};
