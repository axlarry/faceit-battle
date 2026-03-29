
import { faceitApiClient } from './faceitApiClient';
import { toast } from '@/hooks/use-toast';

export class PlayerMatchesService {
  async getPlayerMatches(playerId: string, limit: number = 10) {
    try {
      const data = await faceitApiClient.makeApiCall(`/players/${playerId}/history?game=cs2&limit=${limit}`, false);
      return data?.items || [];
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
}

export const playerMatchesService = new PlayerMatchesService();
