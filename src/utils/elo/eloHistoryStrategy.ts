
import { Player } from "@/types/Player";

export const getEloFromMatchHistory = async (
  player: Player, 
  getPlayerMatchHistory: (playerId: string, limit: number) => Promise<{ matches: any[], source: string }>
) => {
  console.log('🔍 Strategy: Using match history for ELO data...');
  
  try {
    const { matches, source } = await getPlayerMatchHistory(player.player_id, 20);
    console.log(`📊 Fetched ${matches.length} matches from source: ${source}`);
    
    if (!matches || matches.length === 0) {
      console.log('❌ No matches found in history');
      return {};
    }
    
    const eloData: { [matchId: string]: { elo_change: number } } = {};
    
    for (const match of matches) {
      const matchId = match.match_id;
      if (!matchId) continue;
      
      console.log(`🔍 Checking match ${matchId} for ELO data:`, match);
      
      // Check various possible locations for ELO data
      let eloChange = null;
      
      // Direct ELO change
      if (match.elo_change !== undefined) {
        eloChange = match.elo_change;
        console.log(`✅ Found direct elo_change: ${eloChange}`);
      }
      
      // Rating change (alternative name)
      else if (match.rating_change !== undefined) {
        eloChange = match.rating_change;
        console.log(`✅ Found rating_change: ${eloChange}`);
      }
      
      // Check in stats object
      else if (match.stats) {
        if (match.stats.elo_change !== undefined) {
          eloChange = match.stats.elo_change;
          console.log(`✅ Found stats.elo_change: ${eloChange}`);
        } else if (match.stats.rating_change !== undefined) {
          eloChange = match.stats.rating_change;
          console.log(`✅ Found stats.rating_change: ${eloChange}`);
        }
      }
      
      // Check in player-specific data
      else if (match.player_stats && match.player_stats[player.player_id]) {
        const playerStats = match.player_stats[player.player_id];
        if (playerStats.elo_change !== undefined) {
          eloChange = playerStats.elo_change;
          console.log(`✅ Found player_stats.elo_change: ${eloChange}`);
        }
      }
      
      // Check ELO before/after pattern
      else if (match.elo_before !== undefined && match.elo_after !== undefined) {
        eloChange = match.elo_after - match.elo_before;
        console.log(`✅ Calculated ELO change from before/after: ${eloChange}`);
      }
      
      if (eloChange !== null && typeof eloChange === 'number') {
        eloData[matchId] = { elo_change: eloChange };
        console.log(`✅ Stored ELO change for match ${matchId}: ${eloChange}`);
      } else {
        console.log(`❌ No ELO data found for match ${matchId}`);
      }
    }
    
    console.log(`📈 Final ELO data collected for ${Object.keys(eloData).length} matches:`, eloData);
    return eloData;
    
  } catch (error) {
    console.error('❌ Error fetching ELO from match history:', error);
    return {};
  }
};
