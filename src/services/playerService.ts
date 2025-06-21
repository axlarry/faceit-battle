import { faceitApiClient } from './faceitApiClient';
import { FACEIT_CONFIG } from '@/config/faceitConfig';
import { toast } from '@/hooks/use-toast';

export class PlayerService {
  async checkPlayerLiveMatch(playerId: string) {
    try {
      console.log(`🔍 Checking live match for player: ${playerId}`);
      
      // First check player's recent match history
      const historyData = await faceitApiClient.makeApiCall(`/players/${playerId}/history?game=cs2&limit=5`, false);
      
      if (!historyData || !historyData.items || historyData.items.length === 0) {
        console.log(`❌ No match history found for player: ${playerId}`);
        return { isLive: false };
      }

      console.log(`📊 Found ${historyData.items.length} recent matches for ${playerId}`);
      console.log('🔍 Full history response:', JSON.stringify(historyData, null, 2));
      
      // Check each match for live status
      for (const match of historyData.items) {
        console.log(`🎮 Checking match ${match.match_id} with status: ${match.status}`);
        
        // Enhanced live status detection based on swagger.json
        if (FACEIT_CONFIG.LIVE_MATCH_STATUSES.includes(match.status.toUpperCase())) {
          console.log(`✅ Player ${playerId} is LIVE in match ${match.match_id} (status: ${match.status})`);
          
          // Get additional match details to verify it's truly live
          const matchDetails = await this.getMatchDetailsForLiveCheck(match.match_id);
          
          return {
            isLive: true,
            matchId: match.match_id,
            competition: match.competition_name || matchDetails?.competition_name || 'Unknown Competition',
            status: match.status,
            matchDetails: matchDetails
          };
        }
      }
      
      // Additional check: look for ongoing matches via player's current games
      const currentMatch = await this.checkPlayerCurrentMatch(playerId);
      if (currentMatch.isLive) {
        return currentMatch;
      }
      
      console.log(`❌ Player ${playerId} is not in any live matches`);
      return { isLive: false };
      
    } catch (error) {
      console.warn(`⚠️ Error checking live match for player ${playerId}:`, error);
      return { isLive: false };
    }
  }

  private async getMatchDetailsForLiveCheck(matchId: string) {
    try {
      console.log(`🔍 Getting match details for live check: ${matchId}`);
      const matchData = await faceitApiClient.makeApiCall(`/matches/${matchId}`, false);
      
      if (matchData) {
        console.log(`📋 Match details for ${matchId}:`, {
          status: matchData.status,
          state: matchData.state,
          competition: matchData.competition_name
        });
        
        // Verify the match is actually live/ongoing
        const isActuallyLive = FACEIT_CONFIG.LIVE_MATCH_STATUSES.includes(matchData.status?.toUpperCase());
        
        return {
          ...matchData,
          isActuallyLive
        };
      }
      
      return null;
    } catch (error) {
      console.warn(`⚠️ Error getting match details for live check:`, error);
      return null;
    }
  }

  private async checkPlayerCurrentMatch(playerId: string) {
    try {
      // Alternative approach: check if player has any active/current matches
      console.log(`🎯 Checking current match status for player: ${playerId}`);
      
      // This would be an additional API call to check current player status
      // Based on swagger.json, we might need to check player's current state
      const playerData = await faceitApiClient.makeApiCall(`/players/${playerId}`, false);
      
      if (playerData) {
        console.log(`👤 Player data for live check:`, {
          playerId: playerData.player_id,
          nickname: playerData.nickname,
          status: playerData.status || 'unknown'
        });
        
        // Check if player status indicates they're in a match
        if (playerData.status && ['PLAYING', 'IN_MATCH', 'LIVE'].includes(playerData.status.toUpperCase())) {
          return {
            isLive: true,
            matchId: 'current',
            competition: 'Live Match',
            status: playerData.status
          };
        }
      }
      
      return { isLive: false };
    } catch (error) {
      console.warn(`⚠️ Error checking current match status:`, error);
      return { isLive: false };
    }
  }

  async getPlayerStats(playerId: string) {
    try {
      const data = await faceitApiClient.makeApiCall(`/players/${playerId}/stats/cs2`, false);
      console.log('Player stats response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching player stats:', error);
      toast({
        title: "Eroare la încărcarea statisticilor",
        description: "Nu s-au putut încărca statisticile jucătorului.",
        variant: "destructive",
      });
      return null;
    }
  }

  async getPlayerMatches(playerId: string, limit: number = 10) {
    try {
      console.log(`Fetching matches for player: ${playerId}`);
      const data = await faceitApiClient.makeApiCall(`/players/${playerId}/history?game=cs2&limit=${limit}`, false);
      console.log('Player matches response:', data);
      return data.items || [];
    } catch (error) {
      console.error('Error fetching player matches:', error);
      toast({
        title: "Eroare la încărcarea meciurilor",
        description: "Nu s-au putut încărca meciurile jucătorului.",
        variant: "destructive",
      });
      return [];
    }
  }

  async searchPlayer(nickname: string) {
    try {
      const data = await faceitApiClient.makeApiCall(`/search/players?nickname=${encodeURIComponent(nickname)}&game=cs2`, false);
      return data.items || [];
    } catch (error) {
      console.error('Error searching player:', error);
      toast({
        title: "Eroare la căutarea jucătorului",
        description: "Nu s-a putut găsi jucătorul specificat.",
        variant: "destructive",
      });
      return [];
    }
  }
}

export const playerService = new PlayerService();
