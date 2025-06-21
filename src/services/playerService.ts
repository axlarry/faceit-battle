import { faceitApiClient } from './faceitApiClient';
import { FACEIT_CONFIG } from '@/config/faceitConfig';
import { toast } from '@/hooks/use-toast';

export class PlayerService {
  async checkPlayerLiveMatch(playerId: string) {
    try {
      console.log(`🔍 Checking live match for player: ${playerId}`);
      
      // Method 1: Check player's current status directly
      const playerStatus = await this.checkPlayerCurrentStatus(playerId);
      if (playerStatus.isLive) {
        console.log(`✅ Player ${playerId} is LIVE (method 1 - player status)`);
        return playerStatus;
      }
      
      // Method 2: Check match history for very recent matches that might be ongoing
      const historyData = await faceitApiClient.makeApiCall(`/players/${playerId}/history?game=cs2&limit=5`, false);
      
      if (historyData && historyData.items && historyData.items.length > 0) {
        console.log(`📊 Found ${historyData.items.length} recent matches for ${playerId}`);
        
        // Check each recent match for live status
        for (const match of historyData.items) {
          console.log(`🎮 Checking match ${match.match_id} with status: ${match.status}`);
          
          // Get detailed match information to check real-time status
          const liveMatchInfo = await this.checkSpecificMatchLiveStatus(match.match_id, playerId);
          if (liveMatchInfo.isLive) {
            console.log(`✅ Player ${playerId} is LIVE in match ${match.match_id} (method 2 - match details)`);
            return liveMatchInfo;
          }
        }
      }
      
      // Method 3: Try to search for any ongoing matches the player might be in
      const ongoingMatchInfo = await this.searchPlayerInOngoingMatches(playerId);
      if (ongoingMatchInfo.isLive) {
        console.log(`✅ Player ${playerId} is LIVE (method 3 - ongoing matches search)`);
        return ongoingMatchInfo;
      }
      
      console.log(`❌ Player ${playerId} is not in any live matches (checked all methods)`);
      return { isLive: false };
      
    } catch (error) {
      console.warn(`⚠️ Error checking live match for player ${playerId}:`, error);
      return { isLive: false };
    }
  }

  private async checkPlayerCurrentStatus(playerId: string) {
    try {
      console.log(`👤 Checking current status for player: ${playerId}`);
      
      // Get player details to check current status
      const playerData = await faceitApiClient.makeApiCall(`/players/${playerId}`, false);
      
      if (playerData) {
        console.log(`👤 Player data:`, {
          playerId: playerData.player_id,
          nickname: playerData.nickname,
          status: playerData.status || 'unknown',
          games: playerData.games || 'no games info'
        });
        
        // Check if player has any status indicating they're playing
        if (playerData.status && ['PLAYING', 'IN_MATCH', 'LIVE', 'ONGOING'].includes(playerData.status.toUpperCase())) {
          return {
            isLive: true,
            matchId: 'current-status',
            competition: 'Live Match (Player Status)',
            status: playerData.status,
            matchDetails: playerData
          };
        }
        
        // Check CS2 game specific data
        if (playerData.games && playerData.games.cs2) {
          const cs2Data = playerData.games.cs2;
          console.log(`🎮 CS2 specific data:`, cs2Data);
          
          if (cs2Data.faceit_elo && cs2Data.skill_level) {
            // Additional checks for CS2 specific status
          }
        }
      }
      
      return { isLive: false };
    } catch (error) {
      console.warn(`⚠️ Error checking player current status:`, error);
      return { isLive: false };
    }
  }

  private async checkSpecificMatchLiveStatus(matchId: string, playerId: string) {
    try {
      console.log(`🔍 Getting detailed match status for: ${matchId}`);
      
      const matchData = await faceitApiClient.makeApiCall(`/matches/${matchId}`, false);
      
      if (matchData) {
        console.log(`📋 Detailed match data for ${matchId}:`, {
          match_id: matchData.match_id,
          status: matchData.status,
          state: matchData.state,
          competition: matchData.competition_name,
          started_at: matchData.started_at,
          configured_at: matchData.configured_at,
          map: matchData.voting?.map?.pick?.[0] || 'Unknown'
        });
        
        // Enhanced live status detection
        const isLiveStatus = FACEIT_CONFIG.LIVE_MATCH_STATUSES.includes(matchData.status?.toUpperCase());
        const isLiveState = matchData.state && ['ONGOING', 'LIVE', 'IN_PROGRESS'].includes(matchData.state.toUpperCase());
        
        if (isLiveStatus || isLiveState) {
          // Verify player is actually in this match
          const playerInMatch = this.verifyPlayerInMatch(matchData, playerId);
          
          if (playerInMatch) {
            return {
              isLive: true,
              matchId: matchData.match_id,
              competition: matchData.competition_name || 'Live Match',
              status: matchData.status,
              state: matchData.state,
              matchDetails: matchData,
              liveMatch: {
                match_id: matchData.match_id,
                competition_name: matchData.competition_name,
                status: matchData.status,
                started_at: matchData.started_at || Date.now() / 1000,
                finished_at: null,
                teams: matchData.teams || {},
                voting: matchData.voting || {}
              }
            };
          }
        }
      }
      
      return { isLive: false };
    } catch (error) {
      console.warn(`⚠️ Error checking specific match live status:`, error);
      return { isLive: false };
    }
  }

  private async searchPlayerInOngoingMatches(playerId: string) {
    try {
      console.log(`🔍 Searching for ongoing matches with player: ${playerId}`);
      
      // This is a fallback method - we could try different approaches
      // For now, we'll return false but log the attempt
      console.log(`ℹ️ Ongoing matches search not implemented yet for player: ${playerId}`);
      
      return { isLive: false };
    } catch (error) {
      console.warn(`⚠️ Error searching ongoing matches:`, error);
      return { isLive: false };
    }
  }

  private verifyPlayerInMatch(matchData: any, playerId: string): boolean {
    if (!matchData.teams) return false;
    
    for (const teamKey in matchData.teams) {
      const team = matchData.teams[teamKey];
      if (team.players) {
        for (const player of team.players) {
          if (player.player_id === playerId) {
            console.log(`✅ Verified player ${playerId} is in match ${matchData.match_id}`);
            return true;
          }
        }
      }
    }
    
    console.log(`❌ Player ${playerId} not found in match ${matchData.match_id} teams`);
    return false;
  }

  async getPlayerStats(playerId: string) {
    try {
      const data = await faceitApiClient.makeApiCall(`/players/${playerId}/stats/cs2`, false);
      console.log('Player stats response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching player stats:', error);
      toast({
        title: "Eroare la încărcarea statisticilor",
        description: "Nu s-au putut încărca statisticile jucătorului.",
        variant: "destructive",
      });
      return null;
    }
  }

  async getPlayerMatches(playerId: string, limit: number = 10) {
    try {
      console.log(`Fetching matches for player: ${playerId}`);
      const data = await faceitApiClient.makeApiCall(`/players/${playerId}/history?game=cs2&limit=${limit}`, false);
      console.log('Player matches response:', data);
      return data.items || [];
    } catch (error) {
      console.error('Error fetching player matches:', error);
      toast({
        title: "Eroare la încărcarea meciurilor",
        description: "Nu s-au putut încărca meciurile jucătorului.",
        variant: "destructive",
      });
      return [];
    }
  }

  async searchPlayer(nickname: string) {
    try {
      const data = await faceitApiClient.makeApiCall(`/search/players?nickname=${encodeURIComponent(nickname)}&game=cs2`, false);
      return data.items || [];
    } catch (error) {
      console.error('Error searching player:', error);
      toast({
        title: "Eroare la căutarea jucătorului",
        description: "Nu s-a putut găsi jucătorul specificat.",
        variant: "destructive",
      });
      return [];
    }
  }
}

export const playerService = new PlayerService();
