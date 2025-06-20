
import { useState, useEffect, useRef } from 'react';
import { Player } from '@/types/Player';

interface FriendWithLcrypt extends Player {
  lcryptData?: any;
  isLoadingElo?: boolean;
}

interface UseLcryptDataManagerProps {
  friends: Player[];
  enabled?: boolean;
  onUpdateFriend?: (player: Player) => void;
}

export const useLcryptDataManager = ({ 
  friends, 
  enabled = true,
  onUpdateFriend 
}: UseLcryptDataManagerProps) => {
  const [friendsWithLcrypt, setFriendsWithLcrypt] = useState<FriendWithLcrypt[]>(friends);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const processingRef = useRef(false);

  const setPlayerLoadingState = (playerId: string, isLoading: boolean) => {
    setFriendsWithLcrypt(prev => 
      prev.map(friend => 
        friend.player_id === playerId 
          ? { ...friend, isLoadingElo: isLoading }
          : friend
      )
    );
  };

  const updatePlayerLcryptData = (playerId: string, lcryptData: any) => {
    setFriendsWithLcrypt(prev => 
      prev.map(friend => 
        friend.player_id === playerId 
          ? { ...friend, lcryptData, isLoadingElo: false }
          : friend
      )
    );
  };

  const loadLcryptDataForFriends = async () => {
    if (!enabled || friends.length === 0 || processingRef.current) return;
    
    processingRef.current = true;
    setIsLoading(true);
    setLoadingProgress(0);

    console.log('🔄 Starting ELO data loading for', friends.length, 'friends...');

    try {
      let processedCount = 0;

      for (const friend of friends) {
        try {
          console.log(`📈 Loading ELO data for ${friend.nickname}...`);
          
          // Set loading state for this specific player
          setPlayerLoadingState(friend.player_id, true);
          
          const lcryptResponse = await fetch('/api/lcrypt-elo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname: friend.nickname })
          });

          let lcryptData = null;
          if (lcryptResponse.ok) {
            const responseData = await lcryptResponse.json();
            if (responseData && !responseData.error) {
              lcryptData = responseData;
              console.log(`✅ ELO data loaded for ${friend.nickname}:`, lcryptData);
            } else {
              console.warn(`⚠️ ELO API returned error for ${friend.nickname}:`, responseData);
            }
          } else {
            console.warn(`⚠️ Failed to load ELO data for ${friend.nickname} - HTTP ${lcryptResponse.status}`);
          }

          // Update this specific player's data
          updatePlayerLcryptData(friend.player_id, lcryptData);

        } catch (error) {
          console.error(`❌ Error processing ${friend.nickname}:`, error);
          updatePlayerLcryptData(friend.player_id, null);
        }

        processedCount++;
        const progress = (processedCount / friends.length) * 100;
        setLoadingProgress(progress);
        console.log(`📊 Progress: ${processedCount}/${friends.length} (${Math.round(progress)}%)`);

        // Add delay to avoid rate limiting
        if (processedCount < friends.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      console.log('✅ Completed ELO data loading for all friends');

    } catch (error) {
      console.error('❌ Error during data loading:', error);
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
      processingRef.current = false;
    }
  };

  // Load data when friends change
  useEffect(() => {
    if (friends.length > 0) {
      // Initialize friends with lcrypt data structure
      const initialFriends = friends.map(friend => ({
        ...friend,
        lcryptData: null,
        isLoadingElo: false
      }));
      setFriendsWithLcrypt(initialFriends);
      
      loadLcryptDataForFriends();
    } else {
      setFriendsWithLcrypt([]);
    }
  }, [friends]);

  return {
    friendsWithLcrypt,
    isLoading,
    loadingProgress,
    reloadData: loadLcryptDataForFriends
  };
};
