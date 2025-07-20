
import { faceitApiClient } from './faceitApiClient';
import { toast } from '@/hooks/use-toast';

export class PlayerMatchesService {
  async getPlayerMatches(playerId: string, limit: number = 10) {
    try {
      console.log(`🎯 Fetching matches for player: ${playerId} with limit: ${limit}`);
      const data = await faceitApiClient.makeApiCall(`/players/${playerId}/history?game=cs2&limit=${limit}`, false);
      console.log('🎯 Player matches API response:', data);
      console.log('🎯 API response structure:', {
        hasItems: !!data?.items,
        itemsLength: data?.items?.length,
        firstItem: data?.items?.[0]
      });
      
      if (!data || !data.items || !Array.isArray(data.items)) {
        console.log('🚨 No valid API data for player:', playerId);
        toast({
          title: "Eroare la încărcarea matchurilor",
          description: "Nu s-au putut încărca matchurile jucătorului.",
          variant: "destructive",
        });
        return [];
      }
      
      console.log(`🎯 Returning ${data.items.length} real API matches`);
      return data.items;
    } catch (error) {
      console.error('🚨 Error fetching player matches:', error);
      toast({
        title: "Eroare la încărcarea matchurilor",
        description: "A apărut o eroare la încărcarea matchurilor.",
        variant: "destructive",
      });
      return [];
    }
  }

}

export const playerMatchesService = new PlayerMatchesService();
