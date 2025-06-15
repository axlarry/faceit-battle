
import { Player } from "@/types/Player";

export const getEloFromMatchDetail = async (
  matchId: string,
  player: Player,
  getMatchDetails: (matchId: string) => Promise<any>
) => {
  try {
    const matchDetails = await getMatchDetails(matchId);
    
    if (!matchDetails || !matchDetails.teams) {
      return null;
    }
    
    // Search through both teams
    for (const [teamId, teamData] of Object.entries(matchDetails.teams)) {
      // Type guard: check if teamData has players property
      if (!teamData || typeof teamData !== 'object' || !('players' in teamData)) {
        continue;
      }
      
      const teamPlayers = (teamData as any).players;
      if (!Array.isArray(teamPlayers)) {
        continue;
      }
      
      // Find the specific player in this team
      const playerData = teamPlayers.find((p: any) => p.player_id === player.player_id);
      
      if (playerData) {
        // Check for before_elo and after_elo
        if (typeof playerData.before_elo === 'number' && typeof playerData.after_elo === 'number') {
          const eloChange = playerData.after_elo - playerData.before_elo;
          return { elo_change: eloChange };
        }
        
        // Check for direct elo_change property
        if (typeof playerData.elo_change === 'number') {
          return { elo_change: playerData.elo_change };
        }
        
        // Check for rating fields as backup
        if (typeof playerData.before_rating === 'number' && typeof playerData.after_rating === 'number') {
          const eloChange = playerData.after_rating - playerData.before_rating;
          return { elo_change: eloChange };
        }
        
        return null;
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('Error fetching match details for ELO:', error);
    return null;
  }
};
