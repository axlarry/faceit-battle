
import { apiService } from './apiService';
import { FACEIT_CONFIG } from '@/config/faceitConfig';

export class FaceitApiClient {
  async makeApiCall(endpoint: string, useLeaderboardApi: boolean = false) {
    const apiKey = useLeaderboardApi ? 
      FACEIT_CONFIG.API_KEYS.LEADERBOARD : 
      FACEIT_CONFIG.API_KEYS.FRIENDS_AND_TOOL;
    
    if (!apiKey) {
      throw new Error('API key not available');
    }

    const requestKey = `faceit-${endpoint}-${useLeaderboardApi ? 'leaderboard' : 'friends'}`;
    
    return apiService.dedupedRequest(requestKey, async () => {
      return apiService.retryRequest(async () => {
        console.log(`Making API call to: ${FACEIT_CONFIG.API_BASE}${endpoint}`);
        
        try {
          const response = await fetch(`${FACEIT_CONFIG.API_BASE}${endpoint}`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            if (response.status === 429) {
              throw new Error('Rate limited');
            }
            
            if (response.status >= 500) {
              throw new Error('Server error');
            }

            console.warn(`API Warning ${response.status}:`, response.statusText);
            return null;
          }

          const data = await response.json();
          return data;
        } catch (error) {
          if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            console.warn('Network connectivity issue, will retry later');
          }
          throw error;
        }
      }, { maxRetries: 1, baseDelay: 3000 });
    });
  }
}

export const faceitApiClient = new FaceitApiClient();
