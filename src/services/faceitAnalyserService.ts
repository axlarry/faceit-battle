import { supabase } from "@/integrations/supabase/client";
import { faceitAnalyserCacheService } from "./faceitAnalyserCacheService";
import { 
  FaceitAnalyserPlayerData, 
  FaceitAnalyserStats, 
  PlayerGraphsData, 
  MapPerformance,
  MatchAnalysisData 
} from "@/types/FaceitAnalyser";

class FaceitAnalyserService {
  private apiCallCount = 0;
  private maxCallsPerSession = 15; // Conservative limit to stay under monthly quota

  private async callEdgeFunction(playerId: string, dataType: string): Promise<any> {
    console.log('⚠️ FaceitAnalyser API temporar dezactivat - folosesc date mock pentru:', { playerId, dataType });
    
    // Return mock data temporarily since the API is not working
    return new Promise((resolve) => {
      setTimeout(() => {
        if (dataType === 'player_stats') {
          resolve({
            rating: 1.25,
            kast: 72.5,
            impact_score: 1.15,
            adr: 85.3,
            clutch_success: 35.8,
            entry_kill_rate: 12.4,
            trade_kill_rate: 18.7,
            multi_kill_rounds: 8.2,
            pistol_round_win_rate: 58.3,
            eco_round_win_rate: 25.6,
            force_round_win_rate: 41.7
          });
        } else if (dataType === 'player_graphs') {
          resolve({
            elo_history: [
              { date: '2024-01-01', elo: 2100, matches: 5 },
              { date: '2024-01-15', elo: 2150, matches: 8 },
              { date: '2024-02-01', elo: 2180, matches: 12 },
              { date: '2024-02-15', elo: 2200, matches: 7 },
              { date: '2024-03-01', elo: 2250, matches: 9 },
              { date: '2024-03-15', elo: 2280, matches: 6 },
              { date: '2024-04-01', elo: 2300, matches: 4 }
            ],
            rating_trend: [
              { date: '2024-01-01', rating: 1.1, matches: 5 },
              { date: '2024-01-15', rating: 1.15, matches: 8 },
              { date: '2024-02-01', rating: 1.2, matches: 12 },
              { date: '2024-02-15', rating: 1.18, matches: 7 },
              { date: '2024-03-01', rating: 1.22, matches: 9 },
              { date: '2024-03-15', rating: 1.25, matches: 6 },
              { date: '2024-04-01', rating: 1.28, matches: 4 }
            ],
            kd_trend: [
              { date: '2024-01-01', kd_ratio: 1.0, matches: 5 },
              { date: '2024-01-15', kd_ratio: 1.05, matches: 8 },
              { date: '2024-02-01', kd_ratio: 1.1, matches: 12 },
              { date: '2024-02-15', kd_ratio: 1.08, matches: 7 },
              { date: '2024-03-01', kd_ratio: 1.12, matches: 9 },
              { date: '2024-03-15', kd_ratio: 1.15, matches: 6 },
              { date: '2024-04-01', kd_ratio: 1.18, matches: 4 }
            ],
            win_rate_trend: [
              { date: '2024-01-01', win_rate: 65, matches: 5 },
              { date: '2024-01-15', win_rate: 67, matches: 8 },
              { date: '2024-02-01', win_rate: 70, matches: 12 },
              { date: '2024-02-15', win_rate: 68, matches: 7 },
              { date: '2024-03-01', win_rate: 72, matches: 9 },
              { date: '2024-03-15', win_rate: 75, matches: 6 },
              { date: '2024-04-01', win_rate: 78, matches: 4 }
            ],
            map_performance: [
              { map_name: 'de_dust2', avg_rating: 1.2, matches: 15 },
              { map_name: 'de_mirage', avg_rating: 1.15, matches: 12 },
              { map_name: 'de_inferno', avg_rating: 1.18, matches: 10 },
              { map_name: 'de_cache', avg_rating: 1.25, matches: 8 },
              { map_name: 'de_overpass', avg_rating: 1.1, matches: 6 }
            ]
          });
        } else {
          resolve({
            map_performance: {
              'de_dust2': { winrate: 75, avg_rating: 1.2 },
              'de_mirage': { winrate: 68, avg_rating: 1.15 },
              'de_inferno': { winrate: 72, avg_rating: 1.18 },
              'de_cache': { winrate: 80, avg_rating: 1.25 },
              'de_overpass': { winrate: 60, avg_rating: 1.1 }
            }
          });
        }
      }, 500); // Simulate API delay
    });
  }

  async getPlayerAdvancedStats(playerId: string, nickname: string): Promise<FaceitAnalyserStats | null> {
    try {
      // Check cache first
      const cachedData = await faceitAnalyserCacheService.getCachedData(playerId, 'player_stats');
      if (cachedData) {
        return cachedData;
      }

      // Fetch from API
      const apiData = await this.callEdgeFunction(playerId, 'player_stats');
      if (!apiData) {
        return null;
      }

      // Transform API response to our format
      const stats: FaceitAnalyserStats = {
        rating: apiData.rating || 0,
        kast: apiData.kast || 0,
        impactScore: apiData.impact_score || 0,
        adr: apiData.adr || 0,
        clutchSuccess: apiData.clutch_success || 0,
        entryKillRate: apiData.entry_kill_rate || 0,
        tradeKillRate: apiData.trade_kill_rate || 0,
        multiKillRounds: apiData.multi_kill_rounds || 0,
        pistolRoundWinRate: apiData.pistol_round_win_rate || 0,
        ecoRoundWinRate: apiData.eco_round_win_rate || 0,
        forceRoundWinRate: apiData.force_round_win_rate || 0,
      };

      // Cache the result
      await faceitAnalyserCacheService.setCachedData(playerId, nickname, 'player_stats', stats);

      return stats;
    } catch (error) {
      console.error('Error getting player advanced stats:', error);
      return null;
    }
  }

  async getPlayerGraphsData(playerId: string, nickname: string): Promise<PlayerGraphsData | null> {
    try {
      // Check cache first
      const cachedData = await faceitAnalyserCacheService.getCachedData(playerId, 'player_graphs');
      if (cachedData) {
        return cachedData;
      }

      // Fetch from API
      const apiData = await this.callEdgeFunction(playerId, 'player_graphs');
      if (!apiData) {
        return null;
      }

      // Transform API response to our format
      const graphsData: PlayerGraphsData = {
        eloHistory: apiData.elo_history?.map((point: any) => ({
          date: point.date,
          value: point.elo,
          matches: point.matches
        })) || [],
        ratingTrend: apiData.rating_trend?.map((point: any) => ({
          date: point.date,
          value: point.rating,
          matches: point.matches
        })) || [],
        kdTrend: apiData.kd_trend?.map((point: any) => ({
          date: point.date,
          value: point.kd_ratio,
          matches: point.matches
        })) || [],
        winRateTrend: apiData.win_rate_trend?.map((point: any) => ({
          date: point.date,
          value: point.win_rate,
          matches: point.matches
        })) || [],
        performanceHeatmap: apiData.map_performance?.map((mapData: any) => ({
          map: mapData.map_name,
          performance: mapData.avg_rating,
          matches: mapData.matches
        })) || []
      };

      // Cache the result
      await faceitAnalyserCacheService.setCachedData(playerId, nickname, 'player_graphs', graphsData);

      return graphsData;
    } catch (error) {
      console.error('Error getting player graphs data:', error);
      return null;
    }
  }

  async getPlayerMapStats(playerId: string, nickname: string): Promise<MapPerformance[]> {
    try {
      // For now, we'll get this from the graphs data
      const graphsData = await this.getPlayerGraphsData(playerId, nickname);
      if (!graphsData || !graphsData.performanceHeatmap) {
        return [];
      }

      // Transform performance heatmap to map stats format
      return graphsData.performanceHeatmap.map(mapData => ({
        mapName: mapData.map,
        matches: mapData.matches,
        winRate: 0, // Will need to be added to API response
        avgKills: 0, // Will need to be added to API response
        avgDeaths: 0, // Will need to be added to API response
        avgKD: 0, // Will need to be added to API response
        avgRating: mapData.performance,
        avgADR: 0, // Will need to be added to API response
        avgKAST: 0, // Will need to be added to API response
      }));
    } catch (error) {
      console.error('Error getting player map stats:', error);
      return [];
    }
  }

  async getMatchAnalysis(matchId: string): Promise<MatchAnalysisData | null> {
    try {
      // Check cache first
      const cachedData = await faceitAnalyserCacheService.getCachedData(matchId, 'match_analysis');
      if (cachedData) {
        return cachedData;
      }

      // Fetch from API
      const apiData = await this.callEdgeFunction(matchId, 'match_analysis');
      if (!apiData) {
        return null;
      }

      // Transform API response to our format
      const analysisData: MatchAnalysisData = {
        matchId,
        playerRatings: apiData.player_ratings?.map((player: any) => ({
          playerId: player.player_id,
          nickname: player.nickname,
          kills: player.kills,
          deaths: player.deaths,
          assists: player.assists,
          kdRatio: player.kd_ratio,
          rating: player.rating,
          kast: player.kast,
          adr: player.adr,
          impactScore: player.impact_score,
          entryKills: player.entry_kills,
          clutchWins: player.clutch_wins,
          clutchAttempts: player.clutch_attempts,
        })) || [],
        teamComparison: {
          faction1: {
            name: apiData.team_comparison?.faction1?.name || 'Team 1',
            avgRating: apiData.team_comparison?.faction1?.avg_rating || 0,
            totalKills: apiData.team_comparison?.faction1?.total_kills || 0,
            totalDeaths: apiData.team_comparison?.faction1?.total_deaths || 0,
            avgADR: apiData.team_comparison?.faction1?.avg_adr || 0,
            avgKAST: apiData.team_comparison?.faction1?.avg_kast || 0,
            teamScore: apiData.team_comparison?.faction1?.team_score || 0,
          },
          faction2: {
            name: apiData.team_comparison?.faction2?.name || 'Team 2',
            avgRating: apiData.team_comparison?.faction2?.avg_rating || 0,
            totalKills: apiData.team_comparison?.faction2?.total_kills || 0,
            totalDeaths: apiData.team_comparison?.faction2?.total_deaths || 0,
            avgADR: apiData.team_comparison?.faction2?.avg_adr || 0,
            avgKAST: apiData.team_comparison?.faction2?.avg_kast || 0,
            teamScore: apiData.team_comparison?.faction2?.team_score || 0,
          }
        },
        roundAnalysis: apiData.round_analysis?.map((round: any) => ({
          roundNumber: round.round_number,
          winnerFaction: round.winner_faction,
          roundType: round.round_type,
          mvpPlayer: round.mvp_player,
          duration: round.duration,
        })) || undefined,
        mapInsights: {
          mapName: apiData.map_insights?.map_name || '',
          avgRoundDuration: apiData.map_insights?.avg_round_duration || 0,
          pistolRoundWinRate: {
            faction1: apiData.map_insights?.pistol_round_win_rate?.faction1 || 0,
            faction2: apiData.map_insights?.pistol_round_win_rate?.faction2 || 0,
          },
          economyBreaks: apiData.map_insights?.economy_breaks || 0,
          comebackRounds: apiData.map_insights?.comeback_rounds || 0,
          clutchSituations: apiData.map_insights?.clutch_situations || 0,
        },
        lastUpdated: new Date().toISOString()
      };

      // Cache the result
      await faceitAnalyserCacheService.setCachedData(matchId, '', 'match_analysis', analysisData);

      return analysisData;
    } catch (error) {
      console.error('Error getting match analysis:', error);
      return null;
    }
  }

  async getCompletePlayerData(playerId: string, nickname: string): Promise<FaceitAnalyserPlayerData | null> {
    try {
      const [stats, graphs, mapStats] = await Promise.all([
        this.getPlayerAdvancedStats(playerId, nickname),
        this.getPlayerGraphsData(playerId, nickname),
        this.getPlayerMapStats(playerId, nickname)
      ]);

      return {
        playerId,
        nickname,
        stats: stats || undefined,
        mapStats: mapStats.length > 0 ? mapStats : undefined,
        graphs: graphs || undefined,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting complete player data:', error);
      return null;
    }
  }

  getApiCallCount(): number {
    return this.apiCallCount;
  }

  resetApiCallCount(): void {
    this.apiCallCount = 0;
  }
}

export const faceitAnalyserService = new FaceitAnalyserService();