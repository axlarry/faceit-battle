
import { apiService } from '@/services/apiService';
import { API_BASE, FRIENDS_AND_TOOL_API_KEY, LEADERBOARD_API_KEY } from '@/config/faceitApi';

export const makeApiCall = async (endpoint: string, useLeaderboardApi: boolean = false) => {
  const apiKey = useLeaderboardApi ? LEADERBOARD_API_KEY : FRIENDS_AND_TOOL_API_KEY;
  
  if (!apiKey) {
    throw new Error('API key not available');
  }

  const requestKey = `faceit-${endpoint}-${useLeaderboardApi ? 'leaderboard' : 'friends'}`;
  
  return apiService.dedupedRequest(requestKey, async () => {
    return apiService.retryRequest(async () => {
      console.log(`Making API call to: ${API_BASE}${endpoint} with ${useLeaderboardApi ? 'leaderboard' : 'friends'} API`);
      
      try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 429) {
            console.log('Rate limited, waiting before retry...');
            throw new Error('Rate limited');
          }
          
          if (response.status >= 500) {
            console.log('Server error, will retry...');
            throw new Error('Server error');
          }

          const errorData = await response.json().catch(() => ({}));
          console.error('API Error:', errorData);
          throw new Error(`API Error: ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        console.log('API Response successful');
        return data;
      } catch (error) {
        console.error('Network or fetch error:', error);
        throw error;
      }
    }, { maxRetries: 2, baseDelay: 2000 });
  });
};
