
import { faceitApiClient } from './faceitApiClient';
import { toast } from '@/hooks/use-toast';
import { lcryptLiveService } from './lcryptLiveService';

export class PlayerService {
  async checkPlayerLiveMatch(playerId: string) {
    try {
      console.log(`🔍 Checking live match for player: ${playerId}`);
      
      // Get player data to get nickname for Lcrypt check
      const playerData = await faceitApiClient.makeApiCall(`/players/${playerId}`, false);
      const nickname = playerData?.nickname;

      if (nickname) {
        console.log(`🎯 Checking Lcrypt live status for: ${nickname}`);
        const lcryptLiveInfo = await lcryptLiveService.checkPlayerLiveFromLcrypt(nickname);
        if (lcryptLiveInfo.isLive) {
          console.log(`✅ Player ${nickname} is LIVE according to Lcrypt`);
          return lcryptLiveInfo;
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
