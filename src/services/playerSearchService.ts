import { faceitAnalyserApiClient } from './faceitAnalyserApiClient';
import { toast } from '@/hooks/use-toast';

export class PlayerSearchService {
  async searchPlayer(nickname: string) {
    try {
      console.log(`Searching for player: ${nickname}`);
      
      // First try FaceitAnalyser API for overview (if it works)
      try {
        const data = await faceitAnalyserApiClient.getPlayerOverview(nickname);
        console.log('Player search response from FaceitAnalyser:', data);
        
        if (data && data.playerId) {
          return [{
            player_id: data.playerId,
            nickname: data.nickname || nickname,
            avatar: '',
            country: '',
            skill_level: Math.round((data.current_elo || 0) / 200),
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
      } catch (analyserError) {
        console.warn('FaceitAnalyser search failed, falling back to Faceit API:', analyserError);
      }
      
      // Fallback to original Faceit API
      const { faceitApiClient } = await import('./faceitApiClient');
      const data = await faceitApiClient.makeApiCall(`/search/players?nickname=${encodeURIComponent(nickname)}&game=cs2`, false);
      console.log('Player search response from Faceit API:', data);
      
      if (data.items && data.items.length > 0) {
        return data.items.map((player: any) => ({
          player_id: player.player_id,
          nickname: player.nickname,
          avatar: player.avatar || '',
          country: player.country || '',
          skill_level: player.games?.cs2?.skill_level || 0,
          faceit_elo: player.games?.cs2?.faceit_elo || 0,
          cover_image: player.cover_image || '',
          cover_featured_image: player.cover_featured_image || '',
          games: player.games || {}
        }));
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