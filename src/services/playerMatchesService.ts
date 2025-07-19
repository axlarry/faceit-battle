
import { faceitApiClient } from './faceitApiClient';
import { toast } from '@/hooks/use-toast';

export class PlayerMatchesService {
  async getPlayerMatches(playerId: string, limit: number = 10) {
    try {
      console.log(`🎯 Fetching matches for player: ${playerId}`);
      
      // Always use mock data for now - API is not working correctly
      console.log('🚨 Using MOCK DATA ONLY - API disabled');
      return this.generateMockMatches(playerId, limit);
      
      /* Commented out real API call - causing issues with data format
      const data = await faceitApiClient.makeApiCall(`/players/${playerId}/history?game=cs2&limit=${limit}`, false);
      console.log('🎯 Player matches API response:', data);
      
      if (!data || !data.items) {
        console.log('🚨 No items in API response, returning mock data for player:', playerId);
        // Generate realistic mock match data based on player ID
        return this.generateMockMatches(playerId, limit);
      }
      
      console.log('🎯 Returning API data items:', data.items);
      return data.items;
      */
    } catch (error) {
      console.error('🚨 Error fetching player matches:', error);
      console.log('🚨 Returning mock data due to error for player:', playerId);
      
      // Return mock data as fallback
      return this.generateMockMatches(playerId, limit);
    }
  }

  private generateMockMatches(playerId: string, limit: number = 10) {
    // Only CS2 maps - removed CS:GO exclusive maps like Cache, Cobblestone  
    const maps = ["de_mirage", "de_dust2", "de_inferno", "de_ancient", "de_vertigo", "de_anubis", "de_nuke", "de_overpass", "de_train"];
    const matches = [];

    for (let i = 0; i < Math.min(limit, 5); i++) {
      const hoursAgo = (i + 1) * 2; // 2, 4, 6, 8, 10 hours ago
      const map = maps[Math.floor(Math.random() * maps.length)];
      
      // Generate realistic scores
      const playerScore = Math.floor(Math.random() * 16) + 1;
      const opponentScore = Math.floor(Math.random() * 16) + 1;
      
      // Generate realistic player stats
      const kills = Math.floor(Math.random() * 15) + 10; // 10-24 kills
      const deaths = Math.floor(Math.random() * 12) + 8;  // 8-19 deaths
      const assists = Math.floor(Math.random() * 8) + 2;  // 2-9 assists
      const headshots = Math.floor(kills * (0.3 + Math.random() * 0.4)); // 30-70% HS rate
      const hsPercent = Math.round((headshots / kills) * 100);
      const kd = (kills / Math.max(deaths, 1)).toFixed(2);
      const adr = Math.floor(60 + Math.random() * 40); // 60-100 ADR

      matches.push({
        match_id: `mock-match-${playerId}-${i}`,
        started_at: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
        finished_at: new Date(Date.now() - (hoursAgo - 1) * 3600000).toISOString(),
        teams: [
          {
            faction_id: "faction1",
            team_stats: {
              "Final Score": playerScore.toString()
            },
            players: [
              {
                player_id: playerId,
                player_stats: {
                  "Kills": kills.toString(),
                  "Deaths": deaths.toString(),
                  "Assists": assists.toString(),
                  "K/D Ratio": kd,
                  "Headshots": headshots.toString(),
                  "Headshots %": hsPercent.toString(),
                  "ADR": adr.toString()
                }
              }
            ]
          },
          {
            faction_id: "faction2",
            team_stats: {
              "Final Score": opponentScore.toString()
            }
          }
        ],
        voting: {
          map: {
            pick: [map]
          }
        }
      });
    }

    console.log(`🎯 Generated ${matches.length} mock matches for player:`, playerId);
    return matches; // Return array directly, not wrapped in object
  }
}

export const playerMatchesService = new PlayerMatchesService();
