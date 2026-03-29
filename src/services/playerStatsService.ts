
import { faceitApiClient } from './faceitApiClient';
import { toast } from '@/hooks/use-toast';

export class PlayerStatsService {
  async getPlayerStats(playerId: string) {
    try {
      return await faceitApiClient.makeApiCall(`/players/${playerId}/stats/cs2`, false);
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
}

export const playerStatsService = new PlayerStatsService();
