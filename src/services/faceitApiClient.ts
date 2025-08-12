
import { apiService } from './apiService';
import { supabase } from '@/integrations/supabase/client';

export class FaceitApiClient {
  async makeApiCall(endpoint: string, useLeaderboardApi: boolean = false) {
    const requestKey = `faceit-${endpoint}-${useLeaderboardApi ? 'leaderboard' : 'friends'}`;
    
    return apiService.dedupedRequest(requestKey, async () => {
      return apiService.retryRequest(async () => {
        console.log(`Invoking faceit-proxy for endpoint: ${endpoint}`);
        
        try {
          const { data, error } = await supabase.functions.invoke('faceit-proxy', {
            body: { endpoint, useLeaderboardApi }
          });

          if (error) {
            const message = (error as any)?.message || 'Server error';
            if (message.includes('429') || message.toLowerCase().includes('rate')) {
              throw new Error('Rate limited');
            }
            throw new Error(message);
          }

          return data ?? null;
        } catch (error) {
          if (error instanceof TypeError && (error as any).message?.includes('Failed to fetch')) {
            console.warn('Network connectivity issue, will retry later');
          }
          throw error;
        }
      }, { maxRetries: 1, baseDelay: 3000 });
    });
  }
}

export const faceitApiClient = new FaceitApiClient();
