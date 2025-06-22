
import { apiService } from './apiService';

// Discord environment detection
const isDiscordEnvironment = () => {
  return window.parent !== window ||
    window.location.href.includes('discord.com') ||
    window.location.href.includes('discordsays.com') ||
    window.location.href.includes('discordapp.com') ||
    document.referrer.includes('discord.com') ||
    document.referrer.includes('discordapp.com') ||
    window.location.search.includes('frame_id') ||
    window.location.search.includes('instance_id') ||
    window.location.hostname.includes('discordsays.com') ||
    window.location.hostname.includes('discordapp.com') ||
    navigator.userAgent.includes('Discord') ||
    window.top !== window.self;
};

export class FaceitApiClient {
  async makeApiCall(endpoint: string, useLeaderboardApi: boolean = false) {
    // În Discord, returnăm date mock pentru a evita blocarea CSP
    if (isDiscordEnvironment()) {
      console.log('🎮 Discord environment - using mock data to avoid CSP blocks');
      return this.getMockData(endpoint);
    }
    
    // Pentru medii non-Discord, încercăm API-ul real
    const requestKey = `faceit-edge-${endpoint}-${useLeaderboardApi ? 'leaderboard' : 'friends'}`;
    
    return apiService.dedupedRequest(requestKey, async () => {
      return apiService.retryRequest(async () => {
        // Încercăm Edge Functions doar în medii non-Discord
        return await this.makeDirectApiCall(endpoint, useLeaderboardApi);
      }, { maxRetries: 1, baseDelay: 1000 });
    });
  }

  private async makeDirectApiCall(endpoint: string, useLeaderboardApi: boolean) {
    try {
      console.log(`🚀 Making direct API call for: ${endpoint}`);
      
      // Mock response pentru demonstrație - în realitate aici ar fi logica pentru API real
      return this.getMockData(endpoint);

    } catch (error) {
      console.error('❌ Direct API call failed:', error);
      throw error;
    }
  }

  private getMockData(endpoint: string) {
    // Mock data pentru a demonstra funcționalitatea în Discord
    if (endpoint.includes('/players?nickname=')) {
      return {
        player_id: 'mock-player-id-' + Date.now(),
        nickname: 'MockPlayer',
        avatar: '/placeholder.svg',
        games: {
          cs2: {
            skill_level: 5,
            faceit_elo: 1500
          }
        }
      };
    }
    
    if (endpoint.includes('/stats/cs2')) {
      return {
        lifetime: {
          Wins: '100',
          Matches: '150',
          'Average Headshots %': '45.5',
          'Average K/D Ratio': '1.25'
        }
      };
    }
    
    if (endpoint.includes('/players?game=cs2&game_player_id=')) {
      return {
        player_id: 'mock-steam-player-id-' + Date.now(),
        nickname: 'SteamMockPlayer',
        avatar: '/placeholder.svg',
        games: {
          cs2: {
            skill_level: 7,
            faceit_elo: 1800
          }
        }
      };
    }
    
    // Pentru leaderboard și alte endpoint-uri
    return {
      items: [],
      start: 0,
      end: 0
    };
  }
}

export const faceitApiClient = new FaceitApiClient();
