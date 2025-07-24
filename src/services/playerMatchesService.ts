
import { faceitAnalyserApiClient } from './faceitAnalyserApiClient';
import { toast } from '@/hooks/use-toast';

export class PlayerMatchesService {
  async getPlayerMatches(playerId: string, limit: number = 10) {
    try {
      console.log(`Fetching matches for player: ${playerId}`);
      const data = await faceitAnalyserApiClient.getPlayerMatches(playerId, { limit: limit.toString() });
      console.log('Player matches response:', data);
      return data.segments || [];
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
