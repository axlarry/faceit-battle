
import { faceitAnalyserApiClient } from './faceitAnalyserApiClient';
import { toast } from '@/hooks/use-toast';

export class PlayerStatsService {
  async getPlayerStats(playerId: string) {
    try {
      const data = await faceitAnalyserApiClient.getPlayerStats(playerId);
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
}

export const playerStatsService = new PlayerStatsService();
