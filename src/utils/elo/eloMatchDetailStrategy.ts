
import { Player } from "@/types/Player";

export const getEloFromMatchDetail = async (
  matchId: string,
  player: Player,
  getMatchDetails: (matchId: string) => Promise<any>
) => {
  console.log(`🔍 Strategy: Using match details endpoint for ELO data (Match: ${matchId})`);
  
  try {
    const matchDetails = await getMatchDetails(matchId);
    console.log(`📊 Match details response:`, matchDetails);
    
    if (!matchDetails || !matchDetails.teams) {
      console.log('❌ No teams data found in match details');
      return null;
    }
    
    // Search through both teams
    for (const [teamId, teamData] of Object.entries(matchDetails.teams)) {
      console.log(`🔍 Checking team ${teamId}:`, teamData);
      
      // Type guard: check if teamData is an object and has players property
      if (!teamData || typeof teamData !== 'object' || !('players' in teamData)) {
        console.log(`❌ No players property found in team ${teamId}`);
        continue;
      }
      
      const teamPlayers = (teamData as any).players;
      if (!Array.isArray(teamPlayers)) {
        console.log(`❌ Players is not an array in team ${teamId}`);
        continue;
      }
      
      // Find the specific player in this team
      const playerData = teamPlayers.find((p: any) => p.player_id === player.player_id);
      
      if (playerData) {
        console.log(`✅ Found player ${player.player_id} in team ${teamId}:`, playerData);
        
        // Check for before_elo and after_elo
        if (playerData.before_elo !== undefined && playerData.after_elo !== undefined) {
          const eloChange = playerData.after_elo - playerData.before_elo;
          console.log(`✅ Calculated ELO change: ${playerData.before_elo} → ${playerData.after_elo} = ${eloChange}`);
          return { elo_change: eloChange };
        }
        
        // Check for direct elo_change property
        if (playerData.elo_change !== undefined) {
          console.log(`✅ Found direct elo_change: ${playerData.elo_change}`);
          return { elo_change: playerData.elo_change };
        }
        
        // Check for rating fields as backup
        if (playerData.before_rating !== undefined && playerData.after_rating !== undefined) {
          const eloChange = playerData.after_rating - playerData.before_rating;
          console.log(`✅ Calculated ELO change from rating: ${playerData.before_rating} → ${playerData.after_rating} = ${eloChange}`);
          return { elo_change: eloChange };
        }
        
        console.log(`❌ No ELO data found for player ${player.player_id} in match details`);
        return null;
      }
    }
    
    console.log(`❌ Player ${player.player_id} not found in any team`);
    return null;
    
  } catch (error) {
    console.error('❌ Error fetching match details for ELO:', error);
    return null;
  }
};
