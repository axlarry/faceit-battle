
import { Player, Match } from "@/types/Player";

export const searchDirectEloChange = (matchStatsData: any, player: Player) => {
  console.log('🔍 Strategy 1: Checking direct ELO change...');
  
  if (matchStatsData.elo_change) {
    console.log('🔍 Found elo_change at root level:', matchStatsData.elo_change);
    
    if (Array.isArray(matchStatsData.elo_change)) {
      const playerEloData = matchStatsData.elo_change.find((elo: any) => 
        elo.player_id === player.player_id
      );
      
      if (playerEloData && typeof playerEloData.elo_change === 'number') {
        console.log('✅ Found ELO change in direct array:', playerEloData.elo_change);
        return { elo_change: playerEloData.elo_change };
      }
    }
  }
  
  return null;
};

export const searchResultsSection = (matchStatsData: any, player: Player) => {
  console.log('🔍 Strategy 2: Checking results section...');
  
  if (!matchStatsData.results) return null;
  
  // Check for elo_changes in results
  if (matchStatsData.results.elo_changes) {
    console.log('Found elo_changes in results:', matchStatsData.results.elo_changes);
    
    if (Array.isArray(matchStatsData.results.elo_changes)) {
      const playerEloData = matchStatsData.results.elo_changes.find((elo: any) => 
        elo.player_id === player.player_id
      );
      
      if (playerEloData && typeof playerEloData.elo_change === 'number') {
        console.log('✅ Found ELO change in results.elo_changes:', playerEloData.elo_change);
        return { elo_change: playerEloData.elo_change };
      }
    }
  }
  
  // Check for player-specific data in results
  if (matchStatsData.results[player.player_id]) {
    const playerResultData = matchStatsData.results[player.player_id];
    console.log('Found player-specific results data:', playerResultData);
    
    if (typeof playerResultData.elo_change === 'number') {
      console.log('✅ Found ELO change in player results:', playerResultData.elo_change);
      return { elo_change: playerResultData.elo_change };
    }
  }
  
  return null;
};

export const searchTeamsStructure = (matchStatsData: any, player: Player) => {
  console.log('🔍 Strategy 3: Checking teams structure...');
  
  if (!matchStatsData.teams) return null;
  
  for (const [teamId, team] of Object.entries(matchStatsData.teams) as [string, any][]) {
    console.log(`Checking team ${teamId}:`, team);
    
    if (team.players && Array.isArray(team.players)) {
      const playerData = team.players.find((p: any) => p.player_id === player.player_id);
      
      if (playerData) {
        console.log('Found player in team:', playerData);
        
        // Check various ELO properties
        const eloProperties = [
          'elo_change', 'ELO Change', 'Elo Change', 
          'rating_change', 'Rating Change', 'faceit_elo_change'
        ];
        
        for (const prop of eloProperties) {
          if (playerData[prop] !== undefined) {
            const eloValue = typeof playerData[prop] === 'string' 
              ? parseInt(playerData[prop]) 
              : playerData[prop];
            
            if (typeof eloValue === 'number') {
              console.log(`✅ Found ELO change in teams.${teamId}.players via ${prop}:`, eloValue);
              return { elo_change: eloValue };
            }
          }
        }
        
        // Check player_stats for ELO data
        if (playerData.player_stats) {
          console.log('Checking player_stats for ELO data:', playerData.player_stats);
          
          for (const prop of eloProperties) {
            if (playerData.player_stats[prop] !== undefined) {
              const eloValue = typeof playerData.player_stats[prop] === 'string' 
                ? parseInt(playerData.player_stats[prop]) 
                : playerData.player_stats[prop];
              
              if (typeof eloValue === 'number') {
                console.log(`✅ Found ELO change in player_stats via ${prop}:`, eloValue);
                return { elo_change: eloValue };
              }
            }
          }
        }
      }
    }
  }
  
  return null;
};

export const searchRoundsStructure = (matchStatsData: any, player: Player) => {
  console.log('🔍 Strategy 4: Checking rounds structure...');
  
  if (!matchStatsData.rounds || !Array.isArray(matchStatsData.rounds)) return null;
  
  // Check last round for final ELO data
  const lastRound = matchStatsData.rounds[matchStatsData.rounds.length - 1];
  if (lastRound && lastRound.teams) {
    for (const [teamId, team] of Object.entries(lastRound.teams) as [string, any][]) {
      if (team.players && Array.isArray(team.players)) {
        const playerData = team.players.find((p: any) => p.player_id === player.player_id);
        
        if (playerData && playerData.elo_change !== undefined) {
          const eloValue = typeof playerData.elo_change === 'string' 
            ? parseInt(playerData.elo_change) 
            : playerData.elo_change;
          
          if (typeof eloValue === 'number') {
            console.log('✅ Found ELO change in last round:', eloValue);
            return { elo_change: eloValue };
          }
        }
      }
    }
  }
  
  return null;
};

export const searchOriginalMatch = (match: Match, player: Player) => {
  console.log('🔍 Strategy 6: Checking original match.teams data...');
  
  if (!match.teams) return null;
  
  for (const [teamId, team] of Object.entries(match.teams)) {
    const playerData = team.players?.find(p => p.player_id === player.player_id);
    if (playerData && playerData.player_stats) {
      console.log('Found player in original match teams:', playerData);
      
      // Check for ELO in original match player stats
      const eloProps = ['elo_change', 'ELO Change', 'rating_change', 'Rating Change'];
      for (const prop of eloProps) {
        if (playerData.player_stats[prop] !== undefined) {
          const eloValue = typeof playerData.player_stats[prop] === 'string' 
            ? parseInt(playerData.player_stats[prop]) 
            : playerData.player_stats[prop];
          
          if (typeof eloValue === 'number') {
            console.log(`✅ Found ELO change in original match via ${prop}:`, eloValue);
            return { elo_change: eloValue };
          }
        }
      }
    }
  }
  
  return null;
};
