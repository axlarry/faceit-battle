
import { FACEIT_CONFIG } from '@/config/faceitConfig';

const PROXY_ENDPOINTS = [
  'https://cors-anywhere.herokuapp.com/',
  'https://api.allorigins.win/get?url=',
  'https://corsproxy.io/?'
];

export class ProxyApiService {
  private currentProxyIndex = 0;

  private getProxyUrl(originalUrl: string): string {
    const proxy = PROXY_ENDPOINTS[this.currentProxyIndex];
    
    if (proxy.includes('allorigins.win')) {
      return `${proxy}${encodeURIComponent(originalUrl)}`;
    } else {
      return `${proxy}${originalUrl}`;
    }
  }

  private async tryNextProxy() {
    this.currentProxyIndex = (this.currentProxyIndex + 1) % PROXY_ENDPOINTS.length;
    console.log(`🔄 Switching to proxy ${this.currentProxyIndex + 1}/${PROXY_ENDPOINTS.length}`);
  }

  async makeProxiedRequest(endpoint: string, useLeaderboardApi: boolean = false) {
    const apiKey = useLeaderboardApi ? 
      FACEIT_CONFIG.API_KEYS.LEADERBOARD : 
      FACEIT_CONFIG.API_KEYS.FRIENDS_AND_TOOL;
    
    if (!apiKey) {
      throw new Error('API key not available');
    }

    const originalUrl = `${FACEIT_CONFIG.API_BASE}${endpoint}`;
    let attempts = 0;
    const maxAttempts = PROXY_ENDPOINTS.length * 2;

    while (attempts < maxAttempts) {
      try {
        const proxyUrl = this.getProxyUrl(originalUrl);
        console.log(`🌐 Discord proxy attempt ${attempts + 1}: ${proxyUrl.substring(0, 100)}...`);

        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          mode: 'cors',
          credentials: 'omit'
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        let data;
        const currentProxy = PROXY_ENDPOINTS[this.currentProxyIndex];
        
        if (currentProxy.includes('allorigins.win')) {
          const proxyResponse = await response.json();
          if (proxyResponse.contents) {
            data = JSON.parse(proxyResponse.contents);
          } else {
            throw new Error('Invalid proxy response format');
          }
        } else {
          data = await response.json();
        }

        console.log(`✅ Discord proxy success with proxy ${this.currentProxyIndex + 1}`);
        return data;

      } catch (error) {
        console.warn(`❌ Proxy attempt ${attempts + 1} failed:`, error);
        
        attempts++;
        if (attempts < maxAttempts) {
          await this.tryNextProxy();
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    throw new Error(`All proxy attempts failed after ${maxAttempts} tries`);
  }
}

export const proxyApiService = new ProxyApiService();
