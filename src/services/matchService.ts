
import { faceitApiClient } from './faceitApiClient';

export class MatchService {
  async getMatchDetails(matchId: string) {
    try {
      console.log(`Fetching match details for: ${matchId}`);
      const data = await faceitApiClient.makeApiCall(`/matches/${matchId}`, false);
      console.log('Match details response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching match details:', error);
      return null;
    }
  }

  async getMatchStats(matchId: string) {
    try {
      console.log(`Fetching match stats for: ${matchId}`);
      const data = await faceitApiClient.makeApiCall(`/matches/${matchId}/stats`, false);
      
      console.log('=== MATCH STATS DEBUG ===');
      console.log('Match ID:', matchId);
      console.log('Full response structure:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data) {
        console.log('🔍 ELO DEBUGGING - DETAILED ANALYSIS');
        console.log('Top-level keys:', Object.keys(data));
        
        if (data.elo_change) {
          console.log('✅ Found direct elo_change:', data.elo_change);
        }
        
        if (data.results) {
          console.log('📊 Results structure:', Object.keys(data.results));
          if (data.results.elo_changes) {
            console.log('✅ Found results.elo_changes:', data.results.elo_changes);
          }
        }
        
        if (data.teams) {
          console.log('👥 Teams structure:', Object.keys(data.teams));
          Object.entries(data.teams).forEach(([teamId, team]: [string, any]) => {
            console.log(`Team ${teamId} keys:`, Object.keys(team));
            if (team.players && Array.isArray(team.players)) {
              console.log(`Team ${teamId} sample player:`, team.players[0]);
              
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
        
        if (data.rounds && Array.isArray(data.rounds)) {
          console.log('🔄 Rounds count:', data.rounds.length);
          if (data.rounds.length > 0) {
            console.log('Sample round keys:', Object.keys(data.rounds[0]));
            
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
  }
}

export const matchService = new MatchService();
