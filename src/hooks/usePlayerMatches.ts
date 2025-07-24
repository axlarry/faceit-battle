import { useState, useEffect } from 'react';
import { Player, Match } from '@/types/Player';
import { playerMatchesService } from '@/services/playerMatchesService';
import { playerStatsService } from '@/services/playerStatsService';
import { matchService } from '@/services/matchService';

interface PlayerMatchesResult {
  matches: Match[];
  isLoadingMatches: boolean;
  matchStats: {
    wins: number;
    losses: number;
    draws: number;
    totalMatches: number;
    winRate: number;
    avgKills: number;
    avgDeaths: number;
    avgAssists: number;
    avgKDRatio: number;
    avgHSPercentage: number;
  } | null;
  playerStats: any;
  isLoadingStats: boolean;
  reloadMatches: () => void;
}

export const usePlayerMatches = (player: Player | null, isOpen: boolean): PlayerMatchesResult => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [matchStats, setMatchStats] = useState<{
    wins: number;
    losses: number;
    draws: number;
    totalMatches: number;
    winRate: number;
    avgKills: number;
    avgDeaths: number;
    avgAssists: number;
    avgKDRatio: number;
    avgHSPercentage: number;
  } | null>(null);

  const loadPlayerMatches = async () => {
    if (!player) return;
    
    console.log('🎯 usePlayerMatches: Loading matches for:', player.nickname);
    setIsLoadingMatches(true);
    
    try {
      const matchesData = await playerMatchesService.getPlayerMatches(player.player_id, 10);
      console.log('🎯 usePlayerMatches: Raw matches data:', matchesData);

      if (!matchesData || !Array.isArray(matchesData) || matchesData.length === 0) {
        console.log('⚠️ usePlayerMatches: No matches data available');
        setMatches([]);
        setMatchStats(null);
        return;
      }

      console.log('🎯 usePlayerMatches: Fetching detailed stats for each match...');
      
      // Fetch detailed match stats for each match in parallel
      const matchStatsPromises = matchesData.map(async (match: any) => {
        try {
          const matchStats = await matchService.getMatchStats(match.match_id);
          return { matchId: match.match_id, stats: matchStats };
        } catch (error) {
          console.error(`Failed to fetch stats for match ${match.match_id}:`, error);
          return { matchId: match.match_id, stats: null };
        }
      });

      const matchStatsResults = await Promise.all(matchStatsPromises);
      const matchStatsMap = new Map(matchStatsResults.map(result => [result.matchId, result.stats]));

      // Transform matches with detailed stats
      const transformedMatches = matchesData.map((match: any, index: number) => {
        console.log(`🎯 usePlayerMatches: Processing match ${index}:`, match);
        
        try {
          const matchStats = matchStatsMap.get(match.match_id);
          let playerStats = {};
          let detailedPlayerStats = {};
          
          // Extract player stats from detailed match stats
          if (matchStats && matchStats.teams) {
            for (const teamId of Object.keys(matchStats.teams)) {
              const team = matchStats.teams[teamId];
              if (team.players) {
                const playerData = team.players.find((p: any) => p.player_id === player.player_id);
                if (playerData) {
                  detailedPlayerStats = playerData.player_stats || {};
                  console.log(`🎯 Found detailed player stats:`, detailedPlayerStats);
                  break;
                }
              }
            }
          }

          // Handle teams data from basic match info
          let playerTeam, opponentTeam;
          if (match.teams && typeof match.teams === 'object' && !Array.isArray(match.teams)) {
            const teamsArray = Object.values(match.teams);
            playerTeam = teamsArray.find((team: any) => 
              team.players?.some((p: any) => p.player_id === player.player_id)
            );
            opponentTeam = teamsArray.find((team: any) => team !== playerTeam);
            
            const playerData = playerTeam?.players?.find((p: any) => p.player_id === player.player_id);
            playerStats = playerData?.player_stats || {};
          }
          
          // Calculate scores
          let playerScore = 0, opponentScore = 0;
          if (match.results?.score) {
            const factionKey = Object.keys(match.teams || {}).find(key => 
              (match.teams as any)[key].players?.some((p: any) => p.player_id === player.player_id)
            );
            
            if (factionKey && match.results.score[factionKey] !== undefined) {
              playerScore = parseInt(match.results.score[factionKey]) || 0;
              const opponentKey = Object.keys(match.results.score).find(k => k !== factionKey);
              opponentScore = opponentKey ? parseInt(match.results.score[opponentKey]) || 0 : 0;
            }
          }
          
          const won = playerScore > opponentScore;
          
          // Get map name
          const mapName = match.voting?.map?.pick?.[0] || matchStats?.voting?.map?.pick?.[0] || match.map || 'Unknown';
          
          // Use detailed stats if available, fallback to basic stats
          const finalPlayerStats = Object.keys(detailedPlayerStats).length > 0 ? detailedPlayerStats : playerStats;
          
          // Extract stats with multiple possible keys
          const kills = (finalPlayerStats as any)?.["Kills"] || (finalPlayerStats as any)?.kills || (finalPlayerStats as any)?.K || "0";
          const deaths = (finalPlayerStats as any)?.["Deaths"] || (finalPlayerStats as any)?.deaths || (finalPlayerStats as any)?.D || "0";
          const assists = (finalPlayerStats as any)?.["Assists"] || (finalPlayerStats as any)?.assists || (finalPlayerStats as any)?.A || "0";
          const kdRatio = (finalPlayerStats as any)?.["K/D Ratio"] || (finalPlayerStats as any)?.kd_ratio || (finalPlayerStats as any)?.["KD Ratio"] || "0";
          const hsPercentage = (finalPlayerStats as any)?.["Headshots %"] || (finalPlayerStats as any)?.headshots_percentage || (finalPlayerStats as any)?.["Headshot %"] || "0";
          const adr = (finalPlayerStats as any)?.["ADR"] || (finalPlayerStats as any)?.adr || (finalPlayerStats as any)?.["Average Damage per Round"] || "0";

          console.log(`🎯 Match ${match.match_id} stats - K:${kills} D:${deaths} A:${assists} KD:${kdRatio} HS:${hsPercentage} ADR:${adr}`);

          return {
            match_id: match.match_id,
            started_at: match.started_at,
            finished_at: match.finished_at,
            competition_name: match.competition_name || "Europe 5v5 Queue",
            competition_type: match.competition_type || "matchmaking",
            game_mode: match.game_mode || "5v5",
            max_players: match.max_players || 10,
            teams: match.teams || {},
            teams_size: match.teams_size || 5,
            status: match.status || "finished",
            results: {
              winner: won ? "faction1" : "faction2",
              score: {
                faction1: playerScore,
                faction2: opponentScore
              }
            },
            playerStats: finalPlayerStats,
            // Compatibility fields for MatchRow with real data
            i18: won ? "1" : "0", // Win/Loss
            i6: String(kills), // Kills
            i8: String(deaths), // Deaths 
            i7: String(assists), // Assists
            i10: String(kdRatio), // K/D Ratio
            i13: String(hsPercentage), // HS%
            i14: String(adr), // ADR
            team_stats: {
              team1: playerScore,
              team2: opponentScore
            },
            map: mapName
          } as Match;
        } catch (error) {
          console.error('🚨 usePlayerMatches: Error transforming match:', error, match);
          return null;
        }
      }).filter(Boolean);

      // Filter out obsolete maps
      const obsoleteMaps = ['de_cache', 'de_cobblestone', 'de_cbble', 'cs_office', 'cs_agency', 'cs_italy'];
      const filteredMatches = transformedMatches.filter((match: any) => {
        const mapName = match.map || '';
        const isObsolete = obsoleteMaps.includes(mapName?.toLowerCase());
        if (isObsolete) {
          console.log('❌ usePlayerMatches: Filtering out match with obsolete map:', mapName);
        }
        return !isObsolete;
      });

      console.log('🎯 usePlayerMatches: Final matches count:', filteredMatches.length);
      setMatches(filteredMatches);

      // Calculate match statistics from real data
      if (filteredMatches.length > 0) {
        const stats = {
          wins: 0,
          losses: 0,
          draws: 0,
          totalMatches: filteredMatches.length,
          winRate: 0,
          avgKills: 0,
          avgDeaths: 0,
          avgAssists: 0,
          avgKDRatio: 0,
          avgHSPercentage: 0
        };

        let totalKills = 0, totalDeaths = 0, totalAssists = 0, totalHS = 0, totalADR = 0;
        let validMatches = 0;

        filteredMatches.forEach((match: any) => {
          if (match.i18 === '1') stats.wins++;
          else if (match.i18 === '0') stats.losses++;
          else stats.draws++;

          const kills = parseInt(match.i6) || 0;
          const deaths = parseInt(match.i8) || 0;
          const assists = parseInt(match.i7) || 0;
          const hs = parseFloat(match.i13) || 0;

          if (kills > 0 || deaths > 0) {
            totalKills += kills;
            totalDeaths += deaths;
            totalAssists += assists;
            totalHS += hs;
            validMatches++;
          }
        });

        if (validMatches > 0) {
          stats.avgKills = totalKills / validMatches;
          stats.avgDeaths = totalDeaths / validMatches;
          stats.avgAssists = totalAssists / validMatches;
          stats.avgKDRatio = totalDeaths > 0 ? totalKills / totalDeaths : totalKills;
          stats.avgHSPercentage = totalHS / validMatches;
        }

        stats.winRate = stats.totalMatches > 0 ? (stats.wins / stats.totalMatches) * 100 : 0;
        console.log('📊 usePlayerMatches: Match statistics:', stats);
        setMatchStats(stats);
      }
    } catch (error) {
      console.error('🚨 usePlayerMatches: Error loading matches:', error);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const loadPlayerStats = async () => {
    if (!player) return;
    
    console.log('🎯 usePlayerMatches: Loading player stats for:', player.nickname);
    setIsLoadingStats(true);
    
    try {
      const stats = await playerStatsService.getPlayerStats(player.player_id);
      console.log('🎯 usePlayerMatches: Player stats loaded:', stats);
      setPlayerStats(stats);
    } catch (error) {
      console.error('🚨 usePlayerMatches: Error loading player stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const reloadMatches = () => {
    if (player && isOpen) {
      loadPlayerMatches();
      loadPlayerStats();
    }
  };

  useEffect(() => {
    if (player && isOpen) {
      loadPlayerMatches();
      loadPlayerStats();
    }
  }, [player, isOpen]);

  return {
    matches,
    isLoadingMatches,
    matchStats,
    playerStats,
    isLoadingStats,
    reloadMatches
  };
};