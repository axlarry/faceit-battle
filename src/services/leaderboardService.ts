
import { faceitApiClient } from './faceitApiClient';
import { toast } from '@/hooks/use-toast';

export class LeaderboardService {
  async getLeaderboard(region: string, limit: number = 100) {
    try {
      const data = await faceitApiClient.makeApiCall(`/rankings/games/cs2/regions/${region}?limit=${limit}`, true);
      return data.items || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: "Eroare la încărcarea clasamentului",
        description: "Nu s-a putut încărca clasamentul pentru această regiune.",
        variant: "destructive",
      });
      return [];
    }
  }
}

export const leaderboardService = new LeaderboardService();
