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
    if (this.apiCallCount >= this.maxCallsPerSession) {
      console.warn('API call limit reached for this session');
      return null;
    }

    try {
      this.apiCallCount++;
      
      const { data, error } = await supabase.functions.invoke('get-faceit-analyser-data', {
        body: { playerId, dataType }
      });

      if (error) {
        console.error('Edge function error:', error);
        return null;
      }

      return data?.data || null;
    } catch (error) {
      console.error('Error calling edge function:', error);
      return null;
    }
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