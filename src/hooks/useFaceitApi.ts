import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/apiService';

const API_BASE = 'https://open.faceit.com/data/v4';

// API Keys pentru diferite funcționalități
const FRIENDS_AND_TOOL_API_KEY = '67504c0b-4b7e-46c7-8227-1dd00f271614';
const LEADERBOARD_API_KEY = '4640b969-b9c4-4f35-a263-e0949fbe898e';

export const useFaceitApi = () => {
  const [loading, setLoading] = useState(false);

  const makeApiCall = async (endpoint: string, useLeaderboardApi: boolean = false) => {
    const apiKey = useLeaderboardApi ? LEADERBOARD_API_KEY : FRIENDS_AND_TOOL_API_KEY;
    
    if (!apiKey) {
      throw new Error('API key not available');
    }

    const requestKey = `faceit-${endpoint}-${useLeaderboardApi ? 'leaderboard' : 'friends'}`;
    
    return apiService.dedupedRequest(requestKey, async () => {
      return apiService.retryRequest(async () => {
        console.log(`Making API call to: ${API_BASE}${endpoint} with ${useLeaderboardApi ? 'leaderboard' : 'friends'} API`);
        
        try {
          const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            if (response.status === 429) {
              console.log('Rate limited, waiting before retry...');
              throw new Error('Rate limited');
            }
            
            if (response.status >= 500) {
              console.log('Server error, will retry...');
              throw new Error('Server error');
            }

            const errorData = await response.json().catch(() => ({}));
            console.error('API Error:', errorData);
            throw new Error(`API Error: ${errorData.error || response.statusText}`);
          }

          const data = await response.json();
          console.log('API Response successful');
          return data;
        } catch (error) {
          console.error('Network or fetch error:', error);
          throw error;
        }
      }, { maxRetries: 2, baseDelay: 2000 });
    });
  };

  const checkPlayerLiveMatch = async (playerId: string) => {
    try {
      console.log(`Checking live match for player: ${playerId}`);
      const data = await makeApiCall(`/players/${playerId}`, false);
      
      // Verificăm dacă jucătorul este în meci live
      if (data && data.games && data.games.cs2 && data.games.cs2.game_player_id) {
        // Încercăm să obținem informații despre meciul curent
        try {
          const matchData = await makeApiCall(`/players/${playerId}/history?game=cs2&limit=1`, false);
          if (matchData && matchData.items && matchData.items.length > 0) {
            const lastMatch = matchData.items[0];
            // Verificăm dacă meciul este în desfășurare (status: 'ONGOING' sau similar)
            if (lastMatch.status === 'ONGOING' || lastMatch.status === 'LIVE') {
              return {
                isLive: true,
                matchId: lastMatch.match_id,
                competition: lastMatch.competition_name
              };
            }
          }
        } catch (matchError) {
          console.error('Error fetching match history:', matchError);
        }
      }
      
      return { isLive: false };
    } catch (error) {
      console.error('Error checking live match:', error);
      return { isLive: false };
    }
  };

  const getPlayerStats = async (playerId: string) => {
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

  const getPlayerMatches = async (playerId: string, limit: number = 10) => {
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

  const getMatchDetails = async (matchId: string) => {
    try {
      console.log(`Fetching match details for: ${matchId}`);
      const data = await makeApiCall(`/matches/${matchId}`, false);
      console.log('Match details response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching match details:', error);
      return null;
    }
  };

  const getMatchStats = async (matchId: string) => {
    try {
      console.log(`Fetching match stats for: ${matchId}`);
      const data = await makeApiCall(`/matches/${matchId}/stats`, false);
      
      console.log('=== MATCH STATS DEBUG ===');
      console.log('Match ID:', matchId);
      console.log('Full response structure:');
      console.log(JSON.stringify(data, null, 2));
      
      // Detailed ELO debugging
      if (data) {
        console.log('🔍 ELO DEBUGGING - DETAILED ANALYSIS');
        console.log('Top-level keys:', Object.keys(data));
        
        // Check for direct elo_change
        if (data.elo_change) {
          console.log('✅ Found direct elo_change:', data.elo_change);
        }
        
        // Check results structure
        if (data.results) {
          console.log('📊 Results structure:', Object.keys(data.results));
          if (data.results.elo_changes) {
            console.log('✅ Found results.elo_changes:', data.results.elo_changes);
          }
        }
        
        // Check teams structure for ELO data
        if (data.teams) {
          console.log('👥 Teams structure:', Object.keys(data.teams));
          Object.entries(data.teams).forEach(([teamId, team]: [string, any]) => {
            console.log(`Team ${teamId} keys:`, Object.keys(team));
            if (team.players && Array.isArray(team.players)) {
              console.log(`Team ${teamId} sample player:`, team.players[0]);
              
              // Check if any player has ELO data
              team.players.forEach((player: any, index: number) => {
                if (player.elo_change !== undefined) {
                  console.log(`✅ Player ${index} has elo_change:`, player.elo_change);
                }
                if (player.elo) {
                  console.log(`✅ Player ${index} has elo object:`, player.elo);
                }
                if (player.player_stats) {
                  const statsKeys = Object.keys(player.player_stats);
                  const eloKeys = statsKeys.filter(key => 
                    key.toLowerCase().includes('elo') || 
                    key.toLowerCase().includes('rating')
                  );
                  if (eloKeys.length > 0) {
                    console.log(`✅ Player ${index} stats ELO keys:`, eloKeys);
                    eloKeys.forEach(key => {
                      console.log(`   ${key}:`, player.player_stats[key]);
                    });
                  }
                }
              });
            }
          });
        }
        
        // Check rounds structure
        if (data.rounds && Array.isArray(data.rounds)) {
          console.log('🔄 Rounds count:', data.rounds.length);
          if (data.rounds.length > 0) {
            console.log('Sample round keys:', Object.keys(data.rounds[0]));
            
            // Check first few rounds for ELO data
            data.rounds.slice(0, 3).forEach((round: any, roundIndex: number) => {
              if (round.teams) {
                Object.entries(round.teams).forEach(([teamId, team]: [string, any]) => {
                  if (team.players) {
                    team.players.forEach((player: any, playerIndex: number) => {
                      if (player.elo_change !== undefined) {
                        console.log(`✅ Round ${roundIndex} Team ${teamId} Player ${playerIndex} elo_change:`, player.elo_change);
                      }
                      if (player.elo) {
                        console.log(`✅ Round ${roundIndex} Team ${teamId} Player ${playerIndex} elo:`, player.elo);
                      }
                    });
                  }
                });
              }
            });
          }
        }
        
        console.log('=== END ELO DEBUGGING ===');
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching match stats:', error);
      return null;
    }
  };

  const getLeaderboard = async (region: string, limit: number = 100) => {
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

  const searchPlayer = async (nickname: string) => {
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

  return {
    loading,
    makeApiCall,
    getPlayerStats,
    getPlayerMatches,
    getMatchDetails,
    getMatchStats,
    getLeaderboard,
    searchPlayer,
    checkPlayerLiveMatch
  };
};
