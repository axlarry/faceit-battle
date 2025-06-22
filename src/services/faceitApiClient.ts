
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
        console.log(`🌐 Making API call to: ${FACEIT_CONFIG.API_BASE}${endpoint}`);
        console.log(`🔧 Environment: ${window.parent !== window ? 'Discord iframe' : 'standalone'}`);
        
        try {
          // Headers specifice pentru Discord iframe
          const headers: Record<string, string> = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          };

          // Adaugă headers specifice pentru Discord iframe dacă suntem în Discord
          const isInDiscord = window.parent !== window || 
                             window.location.href.includes('discord.com') ||
                             document.referrer.includes('discord.com');

          if (isInDiscord) {
            console.log('🎮 Adding Discord-specific headers');
            headers['X-Requested-With'] = 'XMLHttpRequest';
            headers['Origin'] = window.location.origin;
          }

          const response = await fetch(`${FACEIT_CONFIG.API_BASE}${endpoint}`, {
            method: 'GET',
            headers,
            // Adaugă mode pentru a gestiona CORS în Discord
            mode: isInDiscord ? 'cors' : 'cors',
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

            if (response.status === 0 || response.status === 403) {
              console.warn('🚫 CORS or network issue, trying fallback');
              throw new Error('Network or CORS error');
            }

            console.warn(`⚠️ API Warning ${response.status}:`, response.statusText);
            return null;
          }

          const data = await response.json();
          console.log(`✅ API call successful, received data:`, data ? 'Yes' : 'No');
          
          return data;
        } catch (error) {
          console.error('❌ API call failed:', error);
          
          if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            console.warn('🌐 Network connectivity issue in Discord iframe');
            throw new Error('Network error - Discord iframe restrictions');
          }
          
          if (error.message.includes('CORS')) {
            console.warn('🚫 CORS issue in Discord iframe');
            throw new Error('CORS error - Discord iframe restrictions');
          }
          
          throw error;
        }
      }, { maxRetries: 2, baseDelay: 2000 });
    });
  }
}

export const faceitApiClient = new FaceitApiClient();
