
import { makeApiCall } from './faceitApiClient';
import { toast } from '@/hooks/use-toast';

export const checkPlayerLiveMatch = async (playerId: string) => {
  try {
    console.log(`Checking live match for player: ${playerId}`);
    const data = await makeApiCall(`/players/${playerId}`, false);
    
    // Verifică dacă jucătorul este în meci
    if (data && data.games && data.games.cs2) {
      const gameData = data.games.cs2;
      // Dacă jucătorul are un status activ sau este în meci
      if (gameData.status === 'ONGOING' || gameData.status === 'LIVE') {
        return {
          isLive: true,
          matchData: gameData
        };
      }
    }
    
    // Verifică și prin endpoint-ul de history pentru meciuri recente
    const historyData = await makeApiCall(`/players/${playerId}/history?game=cs2&limit=1`, false);
    if (historyData && historyData.items && historyData.items.length > 0) {
      const lastMatch = historyData.items[0];
      const now = Date.now();
      const matchStart = lastMatch.started_at * 1000;
      const timeDiff = now - matchStart;
      
      // Dacă meciul a început în ultimele 2 ore și nu s-a terminat încă
      if (timeDiff < 2 * 60 * 60 * 1000 && lastMatch.status === 'ONGOING') {
        return {
          isLive: true,
          matchData: lastMatch
        };
      }
    }
    
    return { isLive: false, matchData: null };
  } catch (error) {
    console.error('Error checking live match:', error);
    return { isLive: false, matchData: null };
  }
};

export const getPlayerStats = async (playerId: string) => {
  try {
    const data = await makeApiCall(`/players/${playerId}/stats/cs2`, false);
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
};

export const getPlayerMatches = async (playerId: string, limit: number = 10) => {
  try {
    console.log(`Fetching matches for player: ${playerId}`);
    const data = await makeApiCall(`/players/${playerId}/history?game=cs2&limit=${limit}`, false);
    console.log('Player matches response:', data);
    return data.items || [];
  } catch (error) {
    console.error('Error fetching player matches:', error);
    toast({
      title: "Eroare la încărcarea meciurilor",
      description: "Nu s-au putut încărca meciurile jucătorului.",
      variant: "destructive",
    });
    return [];
  }
};

export const searchPlayer = async (nickname: string) => {
  try {
    const data = await makeApiCall(`/search/players?nickname=${encodeURIComponent(nickname)}&game=cs2`, false);
    return data.items || [];
  } catch (error) {
    console.error('Error searching player:', error);
    toast({
      title: "Eroare la căutarea jucătorului",
      description: "Nu s-a putut găsi jucătorul specificat.",
      variant: "destructive",
    });
    return [];
  }
};
