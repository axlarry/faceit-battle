
import { apiService } from './apiService';
import { FACEIT_CONFIG } from '@/config/faceitConfig';
import { supabase } from '@/integrations/supabase/client';

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
        const isDiscordContext = this.isInDiscord();
        console.log(`🔧 Environment: ${isDiscordContext ? 'Discord iframe' : 'standalone'}`);
        
        if (isDiscordContext) {
          console.log('🎮 Using Supabase Edge Function for Discord');
          return await this.makeEdgeFunctionCall(endpoint, useLeaderboardApi);
        }

        // Direct API call for non-Discord environments
        return await this.makeDirectApiCall(endpoint, useLeaderboardApi);
      }, { maxRetries: 2, baseDelay: 2000 });
    });
  }

  private async makeEdgeFunctionCall(endpoint: string, useLeaderboardApi: boolean) {
    try {
      console.log(`🌐 Making Edge Function call for: ${endpoint}`);
      
      const { data, error } = await supabase.functions.invoke('faceit-proxy', {
        body: {
          endpoint,
          useLeaderboardApi
        }
      });

      if (error) {
        console.error('❌ Edge Function error:', error);
        throw new Error(error.message || 'Edge Function call failed');
      }

      if (data?.error) {
        console.warn('⚠️ API Error from Edge Function:', data.error);
        if (data.error === 'Not found') {
          return null;
        }
        throw new Error(`API Error: ${data.error}`);
      }

      console.log('✅ Edge Function call successful');
      return data;

    } catch (error) {
      console.error('❌ Edge Function call failed:', error);
      throw error;
    }
  }

  private async makeDirectApiCall(endpoint: string, useLeaderboardApi: boolean) {
    try {
      const fullUrl = `${FACEIT_CONFIG.API_BASE}${endpoint}`;
      console.log(`🌐 Making direct API call to: ${fullUrl}`);
      
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

      const response = await fetch(fullUrl, {
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
