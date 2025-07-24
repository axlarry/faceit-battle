
import { faceitAnalyserApiClient } from './faceitAnalyserApiClient';
import { toast } from '@/hooks/use-toast';

export class PlayerSearchService {
  async searchPlayer(nickname: string) {
    try {
      console.log(`Searching for player: ${nickname}`);
      // FaceitAnalyser uses player ID, try to get overview first
      const data = await faceitAnalyserApiClient.getPlayerOverview(nickname);
      console.log('Player search response:', data);
      
      if (data && data.playerId) {
        return [{
          player_id: data.playerId,
          nickname: data.nickname || nickname,
          avatar: '',
          country: '',
          skill_level: Math.round((data.current_elo || 0) / 200), // Convert ELO to skill level approximation
          faceit_elo: data.current_elo || 0,
          cover_image: '',
          cover_featured_image: '',
          games: {
            cs2: {
              skill_level: Math.round((data.current_elo || 0) / 200),
              faceit_elo: data.current_elo || 0
            }
          }
        }];
      }
      
      return [];
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

export const playerSearchService = new PlayerSearchService();
