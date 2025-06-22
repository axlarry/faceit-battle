
import { apiService } from './apiService';
import { supabase } from '@/integrations/supabase/client';

export class FaceitApiClient {
  async makeApiCall(endpoint: string, useLeaderboardApi: boolean = false) {
    const requestKey = `faceit-edge-${endpoint}-${useLeaderboardApi ? 'leaderboard' : 'friends'}`;
    
    return apiService.dedupedRequest(requestKey, async () => {
      return apiService.retryRequest(async () => {
        // FORȚĂM folosirea Edge Functions pentru compatibilitate maximă cu Discord
        console.log('🎯 FORCING Edge Function usage for Discord compatibility');
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
