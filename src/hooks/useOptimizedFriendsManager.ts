// V2.0 Unified Friends Management Hook - Consolidates all friend operations
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Player } from '@/types/Player';
import { friendDataProcessor } from '@/services/friendDataProcessor';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction, isDiscordActivity } from '@/lib/discordProxy';
import { toast } from '@/hooks/use-toast';

// Helper to invoke edge functions with Discord proxy support
const invokeFunction = async (functionName: string, body: Record<string, unknown>) => {
  if (isDiscordActivity()) {
    return invokeEdgeFunction(functionName, body);
  }
  return supabase.functions.invoke(functionName, { body });
};

interface OptimizedFriendsState {
  friends: Player[];
  friendsWithLcrypt: any[];
  liveMatches: Record<string, any>;
  loadingFriends: Set<string>;
  isLoading: boolean;
  lastUpdate: number;
}

interface UseOptimizedFriendsManagerProps {
  enabled?: boolean;
  batchSize?: number;
  updateInterval?: number;
}

export const useOptimizedFriendsManager = ({ 
  enabled = true, 
  batchSize = 3,
  updateInterval = 45000 
}: UseOptimizedFriendsManagerProps = {}) => {
  const [state, setState] = useState<OptimizedFriendsState>({
    friends: [],
    friendsWithLcrypt: [],
    liveMatches: {},
    loadingFriends: new Set(),
    isLoading: false,
    lastUpdate: 0
  });

  // Optimized state updater to reduce re-renders
  const updateState = useCallback((updater: Partial<OptimizedFriendsState> | ((prev: OptimizedFriendsState) => Partial<OptimizedFriendsState>)) => {
    setState(prev => ({
      ...prev,
      ...(typeof updater === 'function' ? updater(prev) : updater)
    }));
  }, []);

  // Load friends from Supabase with optimized caching
  const loadFriends = useCallback(async (refreshData = false) => {
    try {
      // Load cached data first for instant display
      const { data } = await invokeFunction('friends-gateway', { action: 'list' });

      const items = (data as any)?.items || [];
      const friendsData: Player[] = items.map((friend: any) => ({
        player_id: friend.player_id,
        nickname: friend.nickname,
        avatar: friend.avatar,
        level: friend.level || 0,
        elo: friend.elo || 0,
        wins: friend.wins || 0,
        winRate: friend.winRate || 0,
        hsRate: friend.hsRate || 0,
        kdRatio: friend.kdRatio || 0,
      }));

      updateState({ 
        friends: friendsData,
        friendsWithLcrypt: friendsData.map(f => ({ ...f, lcryptData: undefined }))
      });

      // Background refresh if requested
      if (refreshData) {
        invokeFunction('friends-gateway', { action: 'refresh_all' }).then(() => {
          // Reload after background update
          loadFriends(false);
        }).catch(console.warn);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      toast({
        title: "Loading Error",
        description: "Could not load friends list",
        variant: "destructive",
      });
    }
  }, [updateState]);

  // Optimized batch processing with intelligent scheduling
  const processFriendsBatch = useCallback(async (friends: Player[], startIndex = 0) => {
    if (!enabled || friends.length === 0) return;

    const now = Date.now();
    if (now - state.lastUpdate < updateInterval) return;

    updateState({ isLoading: true, lastUpdate: now });

    try {
      for (let i = 0; i < friends.length; i += batchSize) {
        const batch = friends.slice(i, i + batchSize);
        
        // Process batch concurrently
        await Promise.allSettled(
          batch.map(async (friend) => {
            updateState(prev => ({
              loadingFriends: new Set(prev.loadingFriends).add(friend.nickname)
            }));

            try {
              const updatedFriend = await friendDataProcessor.updateFriendData(
                friend,
                enabled,
                (updater) => updateState(prev => ({ 
                  loadingFriends: updater(prev.loadingFriends) 
                })),
                (updater) => updateState(prev => ({ 
                  friendsWithLcrypt: updater(prev.friendsWithLcrypt) 
                })),
                (updater) => updateState(prev => ({ 
                  liveMatches: updater(prev.liveMatches) 
                }))
              );
              
              return updatedFriend;
            } finally {
              updateState(prev => {
                const newSet = new Set(prev.loadingFriends);
                newSet.delete(friend.nickname);
                return { loadingFriends: newSet };
              });
            }
          })
        );

        // Smart delay between batches
        if (i + batchSize < friends.length) {
          await new Promise(resolve => setTimeout(resolve, 400));
        }
      }
    } finally {
      updateState({ isLoading: false });
    }
  }, [enabled, batchSize, state.lastUpdate, updateInterval, updateState]);

  // Add friend with optimized validation and nickname sync
  const addFriend = useCallback(async (player: Player, password: string) => {
    const existingFriend = state.friends.find(f => f.player_id === player.player_id);
    
    if (existingFriend) {
      // Check if it's a nickname change
      if (existingFriend.nickname !== player.nickname) {
        console.log(`🔄 Detected nickname change: ${existingFriend.nickname} -> ${player.nickname}`);
        
        // Update the nickname in database and local state
        try {
          await invokeFunction('friends-gateway', {
            action: 'update_nickname',
            password,
            playerId: player.player_id,
            newNickname: player.nickname
          });

          // Update local state with new nickname
          updateState(prev => ({
            friends: prev.friends.map(f => 
              f.player_id === player.player_id 
                ? { ...f, nickname: player.nickname, avatar: player.avatar }
                : f
            ),
            friendsWithLcrypt: prev.friendsWithLcrypt.map(f => 
              f.player_id === player.player_id 
                ? { ...f, nickname: player.nickname, avatar: player.avatar }
                : f
            )
          }));
          
          toast({
            title: "Nickname Updated!",
            description: `Updated ${existingFriend.nickname} to ${player.nickname}`,
          });
        } catch (error) {
          toast({
            title: "Update Failed",
            description: "Could not update nickname. Invalid password or error occurred.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Already Added",
          description: `${player.nickname} is already in your friends list.`,
          variant: "destructive",
        });
      }
      return;
    }

    try {
      const { error } = await invokeFunction('friends-gateway', {
        action: 'add',
        password,
        player: {
          player_id: player.player_id,
          nickname: player.nickname,
          avatar: player.avatar,
          level: player.level || 0,
          elo: player.elo || 0,
          wins: player.wins || 0,
          win_rate: player.winRate || 0,
          hs_rate: player.hsRate || 0,
          kd_ratio: player.kdRatio || 0,
        }
      });

      if (error) {
        toast({
          title: "Add Failed",
          description: "Invalid password or gateway error.",
          variant: "destructive",
        });
        return;
      }

      updateState(prev => ({
        friends: [...prev.friends, player],
        friendsWithLcrypt: [...prev.friendsWithLcrypt, { ...player, lcryptData: undefined }]
      }));
      
      toast({
        title: "Friend Added!",
        description: `${player.nickname} has been added to your friends list.`,
      });
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  }, [state.friends, updateState]);

  // Remove friend with optimized state management
  const removeFriend = useCallback(async (playerId: string, password: string) => {
    try {
      const { error } = await invokeFunction('friends-gateway', { action: 'remove', password, playerId });

      if (error) {
        toast({
          title: "Remove Failed", 
          description: "Invalid password or gateway error.",
          variant: "destructive",
        });
        return;
      }

      updateState(prev => ({
        friends: prev.friends.filter(f => f.player_id !== playerId),
        friendsWithLcrypt: prev.friendsWithLcrypt.filter(f => f.player_id !== playerId),
        liveMatches: Object.fromEntries(
          Object.entries(prev.liveMatches).filter(([id]) => id !== playerId)
        )
      }));
      
      toast({
        title: "Friend Removed",
        description: "Player has been removed from your friends list.",
      });
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  }, [updateState]);

  // Computed values with memoization
  const computedValues = useMemo(() => {
    const liveFriends = state.friendsWithLcrypt.filter(friend => {
      const liveInfo = state.liveMatches[friend.player_id];
      return liveInfo?.isLive;
    });

    return {
      livePlayersCount: liveFriends.length,
      liveFriends,
      totalFriends: state.friends.length,
      isAnyLoading: state.isLoading || state.loadingFriends.size > 0
    };
  }, [state.friendsWithLcrypt, state.liveMatches, state.friends.length, state.isLoading, state.loadingFriends.size]);

  // Initialize on mount
  useEffect(() => {
    if (enabled) {
      loadFriends(true);
    }
  }, [enabled, loadFriends]);

  // Auto-process friends data
  useEffect(() => {
    if (enabled && state.friends.length > 0) {
      processFriendsBatch(state.friends);
    }
  }, [enabled, state.friends, processFriendsBatch]);

  return {
    // State
    friends: state.friends,
    friendsWithLcrypt: state.friendsWithLcrypt,
    liveMatches: state.liveMatches,
    loadingFriends: state.loadingFriends,
    isLoading: state.isLoading,
    
    // Computed values
    ...computedValues,
    
    // Actions
    addFriend,
    removeFriend,
    loadFriends,
    refreshFriends: () => loadFriends(true),
    
    // Manual controls
    processBatch: processFriendsBatch
  };
};