import { useState, useEffect } from 'react';
import { Player, Match } from '@/types/Player';
import { playerMatchesService } from '@/services/playerMatchesService';
import { playerStatsService } from '@/services/playerStatsService';

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
      const matchesData = await playerMatchesService.getPlayerMatches(player.player_id, 20);
      console.log('🎯 usePlayerMatches: Raw matches data:', matchesData);

      if (!matchesData || !Array.isArray(matchesData) || matchesData.length === 0) {
        console.log('⚠️ usePlayerMatches: No matches data available');
        setMatches([]);
        setMatchStats(null);
        return;
      }

      // Transform matches with improved data processing
      const transformedMatches = matchesData.map((match: any, index: number) => {
        console.log(`🎯 usePlayerMatches: Processing match ${index}:`, match);
        
        try {
          let playerTeam, opponentTeam, playerStats = {};
          
          // Handle teams data (both object and array formats)
          if (match.teams && typeof match.teams === 'object' && !Array.isArray(match.teams)) {
            // Object format (real API)
            const teamsArray = Object.values(match.teams);
            playerTeam = teamsArray.find((team: any) => 
              team.players?.some((p: any) => p.player_id === player.player_id)
            );
            opponentTeam = teamsArray.find((team: any) => team !== playerTeam);
            
            const playerData = playerTeam?.players?.find((p: any) => p.player_id === player.player_id);
            playerStats = playerData?.player_stats || {};
          } else if (Array.isArray(match.teams)) {
            // Array format
            playerTeam = match.teams.find((team: any) => 
              team.players?.some((p: any) => p.player_id === player.player_id)
            );
            opponentTeam = match.teams.find((team: any) => team !== playerTeam);
            
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
          const mapName = match.voting?.map?.pick?.[0] || match.map || 'Unknown';
          
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
            playerStats: playerStats,
            // Compatibility fields for MatchRow
            i18: won ? "1" : "0", // Win/Loss
            i6: (playerStats as any)?.["Kills"] || (playerStats as any)?.kills || (playerStats as any)?.K || "0", // Kills
            i8: (playerStats as any)?.["Deaths"] || (playerStats as any)?.deaths || (playerStats as any)?.D || "0", // Deaths 
            i7: (playerStats as any)?.["Assists"] || (playerStats as any)?.assists || (playerStats as any)?.A || "0", // Assists
            i10: (playerStats as any)?.["K/D Ratio"] || (playerStats as any)?.kd_ratio || "0", // K/D Ratio
            i13: (playerStats as any)?.["Headshots %"] || (playerStats as any)?.headshots_percentage || "0", // HS%
            i14: (playerStats as any)?.["ADR"] || (playerStats as any)?.adr || (playerStats as any)?.average_damage || "0", // ADR
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

      // Calculate match statistics
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

        let totalKills = 0, totalDeaths = 0, totalAssists = 0, totalHS = 0;
        let validMatches = 0;

        filteredMatches.forEach((match: any) => {
          if (match.i18 === '1') stats.wins++;
          else if (match.i18 === '0') stats.losses++;
          else stats.draws++;

          if (match.i6) {
            totalKills += parseInt(match.i6) || 0;
            validMatches++;
          }
          if (match.i8) totalDeaths += parseInt(match.i8) || 0;
          if (match.i7) totalAssists += parseInt(match.i7) || 0;
          if (match.i13) totalHS += parseFloat(match.i13) || 0;
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