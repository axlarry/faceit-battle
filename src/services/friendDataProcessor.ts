
import { Player } from '@/types/Player';
import { fetchLcryptData } from '@/services/lcryptLiveService';
import { lcryptLiveService } from '@/services/lcryptLiveService';
import { playerService } from '@/services/playerService';
import { FriendWithLcrypt, LiveMatchInfo } from '@/hooks/types/lcryptDataManagerTypes';

export class FriendDataProcessor {
  async updateFriendData(
    friend: Player,
    enabled: boolean,
    setLoadingFriends: (updater: (prev: Set<string>) => Set<string>) => void,
    setFriendsWithLcrypt: (updater: (prev: FriendWithLcrypt[]) => FriendWithLcrypt[]) => void,
    setLiveMatches: (updater: (prev: Record<string, LiveMatchInfo>) => Record<string, LiveMatchInfo>) => void
  ): Promise<FriendWithLcrypt> {
    if (!enabled) return friend;

    // Marchează prietenul ca fiind în curs de încărcare
    setLoadingFriends(prev => new Set(prev).add(friend.nickname));

    try {
      console.log(`Fetching Lcrypt data, live status and cover image for ${friend.nickname}...`);
      
      // Încarcă datele Lcrypt, verifică statusul LIVE și cover image în paralel
      const [lcryptData, liveInfo, coverImage] = await Promise.all([
        fetchLcryptData(friend.nickname),
        lcryptLiveService.checkPlayerLiveFromLcrypt(friend.nickname),
        playerService.getPlayerCoverImage(friend.nickname)
      ]);
      
      const updatedFriend: FriendWithLcrypt = {
        ...friend,
        lcryptData,
        elo: lcryptData?.elo || friend.elo || 0,
        isLive: liveInfo.isLive,
        liveMatchDetails: liveInfo.isLive && 'matchDetails' in liveInfo ? liveInfo.matchDetails : undefined,
        liveCompetition: liveInfo.isLive && 'competition' in liveInfo ? liveInfo.competition : undefined,
        cover_image: coverImage || friend.cover_image
      };

      // Actualizează și statusul LIVE în state-ul separat
      setLiveMatches(prev => ({
        ...prev,
        [friend.player_id]: liveInfo
      }));

      console.log(`✅ Successfully updated ${friend.nickname} with ELO: ${updatedFriend.elo} ${liveInfo.isLive ? '(LIVE)' : ''} ${coverImage ? '(Cover Image)' : ''}`);
      
      // Actualizează prietenul în lista principală imediat după finalizare
      setFriendsWithLcrypt(prevFriends => 
        prevFriends.map(prevFriend => 
          prevFriend.player_id === updatedFriend.player_id ? updatedFriend : prevFriend
        )
      );
      
      // Elimină prietenul din setul de încărcare
      setLoadingFriends(prev => {
        const newSet = new Set(prev);
        newSet.delete(friend.nickname);
        return newSet;
      });

      return updatedFriend;
    } catch (error) {
      console.error(`❌ Failed to fetch data for ${friend.nickname}:`, error);
      
      // Actualizează cu date null în caz de eroare
      const failedFriend: FriendWithLcrypt = { ...friend, lcryptData: null };
      setFriendsWithLcrypt(prevFriends => 
        prevFriends.map(prevFriend => 
          prevFriend.player_id === failedFriend.player_id ? failedFriend : prevFriend
        )
      );
      
      // Actualizează și statusul LIVE ca false în caz de eroare
      setLiveMatches(prev => ({
        ...prev,
        [friend.player_id]: { isLive: false }
      }));
      
      // Elimină prietenul din setul de încărcare chiar și în caz de eroare
      setLoadingFriends(prev => {
        const newSet = new Set(prev);
        newSet.delete(friend.nickname);
        return newSet;
      });

      return failedFriend;
    }
  }

  async processFriendsBatch(
    batch: Player[],
    updateFriendData: (friend: Player) => Promise<FriendWithLcrypt>
  ): Promise<FriendWithLcrypt[]> {
    const batchPromises = batch.map(friend => updateFriendData(friend));
    const batchResults = await Promise.allSettled(batchPromises);
    
    return batchResults
      .filter((result): result is PromiseFulfilledResult<FriendWithLcrypt> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  }
}

export const friendDataProcessor = new FriendDataProcessor();
