
import { faceitApiClient } from './faceitApiClient';

export class LiveMatchService {
  async getPlayerLiveMatch(playerId: string) {
    try {
      console.log(`🔍 Checking for live match for player: ${playerId}`);
      
      // First, get player's current matches
      const playerData = await faceitApiClient.makeApiCall(`/players/${playerId}`, false);
      
      if (!playerData) {
        console.log('❌ Could not fetch player data');
        return null;
      }

      // Check if player has any active matches
      if (playerData.games && playerData.games.cs2 && playerData.games.cs2.game_player_id) {
        // Try to get current match info
        const matchHistory = await faceitApiClient.makeApiCall(
          `/players/${playerId}/history?game=cs2&limit=1`, 
          false
        );

        if (matchHistory && matchHistory.items && matchHistory.items.length > 0) {
          const latestMatch = matchHistory.items[0];
          
          // Check if the latest match is currently ongoing
          if (latestMatch.status === 'ONGOING' || latestMatch.status === 'LIVE') {
            console.log(`✅ Found live match: ${latestMatch.match_id}`);
            return {
              isLive: true,
              matchId: latestMatch.match_id,
              matchRoomUrl: `https://www.faceit.com/en/cs2/room/${latestMatch.match_id}`
            };
          }
        }
      }

      // Alternative: Check through search endpoint
      try {
        const searchResponse = await faceitApiClient.makeApiCall(
          `/search/matches?type=ongoing&game=cs2&limit=50`, 
          false
        );

        if (searchResponse && searchResponse.items) {
          // Look for the player in ongoing matches
          for (const match of searchResponse.items) {
            if (match.teams && typeof match.teams === 'object') {
              for (const team of Object.values(match.teams)) {
                if (team && typeof team === 'object' && 'players' in team && Array.isArray(team.players)) {
                  const playerFound = team.players.find((p: any) => p.player_id === playerId);
                  if (playerFound) {
                    console.log(`✅ Found player in live match: ${match.match_id}`);
                    return {
                      isLive: true,
                      matchId: match.match_id,
                      matchRoomUrl: `https://www.faceit.com/en/cs2/room/${match.match_id}`
                    };
                  }
                }
              }
            }
          }
        }
      } catch (searchError) {
        console.warn('Search endpoint not available:', searchError);
      }

      console.log('❌ No live match found for player');
      return null;
      
    } catch (error) {
      console.error('Error checking for live match:', error);
      return null;
    }
  }
}

export const liveMatchService = new LiveMatchService();
