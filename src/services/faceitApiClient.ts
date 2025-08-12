
import { apiService } from './apiService';
import { supabase } from '@/integrations/supabase/client';

export class FaceitApiClient {
  async makeApiCall(endpoint: string, useLeaderboardApi: boolean = false) {
    const requestKey = `faceit-${endpoint}-${useLeaderboardApi ? 'leaderboard' : 'friends'}`;
    
    return apiService.dedupedRequest(requestKey, async () => {
      return apiService.retryRequest(async () => {
        console.log(`Proxying Faceit API call to: ${endpoint}`);
        
        const { data, error } = await supabase.functions.invoke('proxy-faceit', {
          body: { endpoint, useLeaderboardApi },
        });
        
        if (error) {
          // Surface rate limit conditions to the retry handler
          if ((error as any)?.message?.includes('429') || (error as any)?.message?.includes('Rate limited')) {
            throw new Error('Rate limited');
          }
          console.warn('Faceit proxy error:', error);
          return null;
        }
        
        return data ?? null;
      }, { maxRetries: 1, baseDelay: 3000 });
    });
  }
}

export const faceitApiClient = new FaceitApiClient();
