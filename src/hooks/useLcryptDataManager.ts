
import { useState, useEffect, useRef } from 'react';
import { Player } from '@/types/Player';

interface FriendWithLcrypt extends Player {
  lcryptData?: any;
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

  const loadLcryptDataForFriends = async () => {
    if (!enabled || friends.length === 0 || processingRef.current) return;
    
    processingRef.current = true;
    setIsLoading(true);
    setLoadingProgress(0);

    console.log('🔄 Starting ELO data loading for', friends.length, 'friends...');

    try {
      const updatedFriends: FriendWithLcrypt[] = [];
      let processedCount = 0;

      for (const friend of friends) {
        try {
          console.log(`📈 Loading ELO data for ${friend.nickname}...`);
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

          updatedFriends.push({
            ...friend,
            lcryptData
          });

        } catch (error) {
          console.error(`❌ Error processing ${friend.nickname}:`, error);
          updatedFriends.push({
            ...friend,
            lcryptData: null
          });
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

      console.log('✅ Setting friends with lcrypt data:', updatedFriends);
      setFriendsWithLcrypt(updatedFriends);
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
