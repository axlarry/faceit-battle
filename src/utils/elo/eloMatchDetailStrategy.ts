
import { Player } from "@/types/Player";

export const getEloFromMatchDetail = async (
  matchId: string,
  player: Player,
  getMatchDetails: (matchId: string) => Promise<any>
) => {
  try {
    console.log(`[ELO] Fetching match details for match ${matchId} and player ${player.player_id}`);
    const matchDetails = await getMatchDetails(matchId);
    
    console.log(`[ELO] Match details response:`, matchDetails);
    
    if (!matchDetails || !matchDetails.teams) {
      console.log(`[ELO] No teams found in match details`);
      return null;
    }
    
    // Check faction1 and faction2 structure
    const factions = ['faction1', 'faction2'];
    
    for (const factionName of factions) {
      const faction = matchDetails.teams[factionName];
      if (!faction || !faction.players || !Array.isArray(faction.players)) {
        console.log(`[ELO] No players found in ${factionName}`);
        continue;
      }
      
      console.log(`[ELO] Checking ${factionName} with ${faction.players.length} players`);
      
      // Find the specific player in this faction
      const playerData = faction.players.find((p: any) => p.player_id === player.player_id);
      
      if (playerData) {
        console.log(`[ELO] Found player data:`, playerData);
        
        // Check for before_elo and after_elo (primary method)
        if (typeof playerData.before_elo === 'number' && typeof playerData.after_elo === 'number') {
          const eloChange = playerData.after_elo - playerData.before_elo;
          console.log(`[ELO] Found ELO change: ${eloChange} (${playerData.before_elo} -> ${playerData.after_elo})`);
          return { elo_change: eloChange };
        }
        
        // Check for direct elo_change property
        if (typeof playerData.elo_change === 'number') {
          console.log(`[ELO] Found direct elo_change: ${playerData.elo_change}`);
          return { elo_change: playerData.elo_change };
        }
        
        console.log(`[ELO] Player found but no ELO data available`);
        return null;
      }
    }
    
    console.log(`[ELO] Player ${player.player_id} not found in any faction`);
    return null;
    
  } catch (error) {
    console.error('[ELO] Error fetching match details:', error);
    return null;
  }
};
