
const DISCORD_PROXY_ENDPOINTS = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://cors-anywhere.herokuapp.com/'
];

export class DiscordProxyService {
  private currentProxyIndex = 0;

  private isDiscordEnvironment(): boolean {
    return (
      window.parent !== window ||
      window.location.href.includes('discord.com') ||
      document.referrer.includes('discord.com') ||
      window.location.hostname.includes('discord.com') ||
      navigator.userAgent.includes('Discord') ||
      // Verificare specifică pentru Discord Activity
      window.location.search.includes('frame_id') ||
      window.location.search.includes('instance_id')
    );
  }

  private getNextProxy(): string {
    const proxy = DISCORD_PROXY_ENDPOINTS[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % DISCORD_PROXY_ENDPOINTS.length;
    return proxy;
  }

  async makeDiscordApiCall(url: string, headers: Record<string, string> = {}) {
    if (!this.isDiscordEnvironment()) {
      // Direct call for non-Discord environments
      const response = await fetch(url, { 
        headers,
        mode: 'cors',
        credentials: 'omit'
      });
      return response.json();
    }

    console.log('🎮 Making Discord proxy API call to:', url);
    
    let lastError: Error;
    
    // Încercăm fiecare proxy
    for (let attempt = 0; attempt < DISCORD_PROXY_ENDPOINTS.length; attempt++) {
      try {
        const proxy = this.getNextProxy();
        const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
        
        console.log(`🌐 Discord proxy attempt ${attempt + 1}: ${proxy}`);
        
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            ...headers,
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
          },
          mode: 'cors',
          credentials: 'omit'
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Discord proxy success');
        return data;

      } catch (error) {
        console.warn(`❌ Discord proxy attempt ${attempt + 1} failed:`, error);
        lastError = error as Error;
        
        // Mică pauză între încercări
        if (attempt < DISCORD_PROXY_ENDPOINTS.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    throw new Error(`All Discord proxy attempts failed: ${lastError?.message}`);
  }
}

export const discordProxyService = new DiscordProxyService();
