
import { makeApiCall } from './faceitApiClient';
import { toast } from '@/hooks/use-toast';

export const getLeaderboard = async (region: string, limit: number = 100) => {
  try {
    // Folosim API-ul pentru clasamentul global
    const data = await makeApiCall(`/rankings/games/cs2/regions/${region}?limit=${limit}`, true);
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
};
