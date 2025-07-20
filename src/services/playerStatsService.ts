
import { faceitApiClient } from './faceitApiClient';
import { toast } from '@/hooks/use-toast';

export class PlayerStatsService {
  async getPlayerStats(playerId: string) {
    try {
      const data = await faceitApiClient.makeApiCall(`/players/${playerId}/stats/cs2`, false);
      console.log('🎯 Real player stats response:', data);
      
      // Only return real data from Faceit API
      if (!data || !data.segments) {
        console.log('⚠️ No real stats data available from Faceit API');
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('🚨 Error fetching real player stats:', error);
      toast({
        title: "Eroare la încărcarea statisticilor",
        description: "Nu s-au putut încărca statisticile reale de la Faceit.",
        variant: "destructive",
      });
      return null;
    }
  }
}

export const playerStatsService = new PlayerStatsService();
