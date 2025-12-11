
import { apiService } from './apiService';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction, isDiscordActivity } from '@/lib/discordProxy';

// Helper to invoke edge functions with Discord proxy support
const invokeFunction = async (functionName: string, body: Record<string, unknown>) => {
  if (isDiscordActivity()) {
    return invokeEdgeFunction(functionName, body);
  }
  return supabase.functions.invoke(functionName, { body });
};

export class FaceitApiClient {
  async makeApiCall(endpoint: string, useLeaderboardApi: boolean = false) {
    const requestKey = `faceit-${endpoint}-${useLeaderboardApi ? 'leaderboard' : 'friends'}`;
    
    return apiService.dedupedRequest(requestKey, async () => {
      return apiService.retryRequest(async () => {
        console.log(`Proxying Faceit API call to: ${endpoint}`);
        
        const { data, error } = await invokeFunction('proxy-faceit', { endpoint, useLeaderboardApi });
        
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
