
import { faceitApiClient } from './faceitApiClient';
import { FACEIT_CONFIG } from '@/config/faceitConfig';
import { toast } from '@/hooks/use-toast';

export class PlayerService {
  async checkPlayerLiveMatch(playerId: string) {
    try {
      console.log(`🔍 Checking live match for player: ${playerId}`);
      
      const historyData = await faceitApiClient.makeApiCall(`/players/${playerId}/history?game=cs2&limit=3`, false);
      
      if (!historyData || !historyData.items || historyData.items.length === 0) {
        console.log(`❌ No match history found for player: ${playerId}`);
        return { isLive: false };
      }

      console.log(`📊 Found ${historyData.items.length} recent matches for ${playerId}`);
      
      for (const match of historyData.items) {
        console.log(`🎮 Checking match ${match.match_id} with status: ${match.status}`);
        
        if (FACEIT_CONFIG.LIVE_MATCH_STATUSES.includes(match.status)) {
          console.log(`✅ Player ${playerId} is LIVE in match ${match.match_id} (status: ${match.status})`);
          
          return {
            isLive: true,
            matchId: match.match_id,
            competition: match.competition_name || 'Unknown Competition'
          };
        }
      }
      
      console.log(`❌ Player ${playerId} is not in any live matches`);
      return { isLive: false };
      
    } catch (error) {
      console.warn(`⚠️ Error checking live match for player ${playerId}:`, error);
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
