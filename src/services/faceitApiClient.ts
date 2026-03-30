
import { optimizedApiService } from './optimizedApiService';
import { invokeEdgeFunction, isDiscordActivity } from '@/lib/discordProxy';
import { supabase } from '@/integrations/supabase/client';

const invokeFunction = async (functionName: string, body: Record<string, unknown>) => {
  if (isDiscordActivity()) return invokeEdgeFunction(functionName, body);
  return supabase.functions.invoke(functionName, { body });
};

export class FaceitApiClient {
  async makeApiCall(endpoint: string, useLeaderboardApi = false) {
    const requestKey = `faceit-${endpoint}-${useLeaderboardApi ? 'leaderboard' : 'default'}`;

    return optimizedApiService.dedupedRequest(requestKey, async () => {
      const { data, error } = await invokeFunction('proxy-faceit', { endpoint, useLeaderboardApi });

      if (error) {
        if ((error as any)?.message?.includes('429') || (error as any)?.message?.includes('Rate limited')) {
          throw new Error('Rate limited');
        }
        return null;
      }

      return data ?? null;
    // 90s cache: covers stats/matches/history requests opened in the modal
    }, { cacheTime: 90000, maxRetries: 1, baseDelay: 3000 });
  }
}

export const faceitApiClient = new FaceitApiClient();
