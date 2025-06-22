
import { apiService } from './apiService';
import { supabase } from '@/integrations/supabase/client';

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
    const requestKey = `faceit-edge-${endpoint}-${useLeaderboardApi ? 'leaderboard' : 'friends'}`;
    
    return apiService.dedupedRequest(requestKey, async () => {
      return apiService.retryRequest(async () => {
        // ALWAYS use Edge Functions in Discord - no direct API calls
        if (isDiscordEnvironment()) {
          console.log('🎮 Discord environment detected - using Edge Functions exclusively');
          return await this.makeEdgeFunctionCall(endpoint, useLeaderboardApi);
        }
        
        // For non-Discord environments, still prefer Edge Functions for consistency
        console.log('🌐 Non-Discord environment - using Edge Functions for reliability');
        return await this.makeEdgeFunctionCall(endpoint, useLeaderboardApi);
      }, { maxRetries: 3, baseDelay: 1500 });
    });
  }

  private async makeEdgeFunctionCall(endpoint: string, useLeaderboardApi: boolean) {
    try {
      console.log(`🚀 Making Edge Function call for: ${endpoint}`);
      
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
}

export const faceitApiClient = new FaceitApiClient();
