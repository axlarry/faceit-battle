
import { apiService } from './apiService';
import { discordProxyService } from './discordProxyService';
import { FACEIT_CONFIG } from '@/config/faceitConfig';

export class FaceitApiClient {
  private isInDiscord(): boolean {
    return window.parent !== window || 
           window.location.href.includes('discord.com') ||
           document.referrer.includes('discord.com') ||
           window.location.hostname.includes('discord.com') ||
           navigator.userAgent.includes('Discord') ||
           // Verificări specifice Discord Activity
           window.location.search.includes('frame_id') ||
           window.location.search.includes('instance_id');
  }

  async makeApiCall(endpoint: string, useLeaderboardApi: boolean = false) {
    const requestKey = `faceit-${endpoint}-${useLeaderboardApi ? 'leaderboard' : 'friends'}`;
    
    return apiService.dedupedRequest(requestKey, async () => {
      return apiService.retryRequest(async () => {
        const fullUrl = `${FACEIT_CONFIG.API_BASE}${endpoint}`;
        console.log(`🌐 Making API call to: ${fullUrl}`);
        
        const isDiscordContext = this.isInDiscord();
        console.log(`🔧 Environment: ${isDiscordContext ? 'Discord iframe' : 'standalone'}`);
        
        const apiKey = useLeaderboardApi ? 
          FACEIT_CONFIG.API_KEYS.LEADERBOARD : 
          FACEIT_CONFIG.API_KEYS.FRIENDS_AND_TOOL;
        
        if (!apiKey) {
          throw new Error('API key not available');
        }

        const headers = {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        };

        if (isDiscordContext) {
          console.log('🎮 Using Discord proxy service');
          return await discordProxyService.makeDiscordApiCall(fullUrl, headers);
        }

        // Direct API call for non-Discord environments
        return await this.makeDirectApiCall(fullUrl, headers);
      }, { maxRetries: 2, baseDelay: 2000 });
    });
  }

  private async makeDirectApiCall(url: string, headers: Record<string, string>) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        mode: 'cors',
        credentials: 'omit'
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('⏰ Rate limited, will retry');
          throw new Error('Rate limited');
        }
        
        if (response.status >= 500) {
          console.warn('🔥 Server error, will retry');
          throw new Error('Server error');
        }

        console.warn(`⚠️ API Warning ${response.status}:`, response.statusText);
        return null;
      }

      const data = await response.json();
      console.log(`✅ Direct API call successful`);
      
      return data;
    } catch (error) {
      console.error('❌ Direct API call failed:', error);
      throw error;
    }
  }
}

export const faceitApiClient = new FaceitApiClient();
