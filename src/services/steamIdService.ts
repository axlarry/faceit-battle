
import { supabase } from '@/integrations/supabase/client';

// Discord environment detection
const isDiscordEnvironment = () => {
  return window.parent !== window ||
    window.location.href.includes('discord.com') ||
    window.location.href.includes('discordsays.com') ||
    window.location.href.includes('discordapp.com') ||
    document.referrer.includes('discord.com') ||
    document.referrer.includes('discordapp.com') ||
    window.location.search.includes('frame_id') ||
    window.location.search.includes('instance_id') ||
    window.location.hostname.includes('discordsays.com') ||
    window.location.hostname.includes('discordapp.com') ||
    navigator.userAgent.includes('Discord') ||
    window.top !== window.self;
};

export class SteamIdService {
  async getSteamID64(vanityurl: string): Promise<string> {
    try {
      // În Discord, returnăm un mock SteamID64
      if (isDiscordEnvironment()) {
        console.log('🎮 Discord environment - using mock SteamID64 conversion');
        return '76561198000000000';
      }

      console.log(`🔍 Converting vanity URL via Supabase proxy: ${vanityurl}`);
      
      const { data, error } = await supabase.functions.invoke('lacurte-proxy', {
        body: { vanityurl }
      });

      if (error) {
        console.warn('⚠️ Lacurte proxy error:', error);
        throw new Error(`Steam ID conversion failed: ${error.message}`);
      }

      if (data && data.steamid) {
        console.log(`✅ Successfully converted ${vanityurl} to ${data.steamid}`);
        return data.steamid;
      }

      throw new Error('Invalid response from Steam ID service');
      
    } catch (error) {
      console.error('❌ Steam ID conversion error:', error);
      throw error;
    }
  }

  isValidSteamID64(input: string): boolean {
    return /^\d{17}$/.test(input);
  }

  extractSteamVanity(input: string): string {
    input = input.trim();

    // Dacă este URL de tip steamcommunity.com/profiles/STEAMID64
    if (input.includes('steamcommunity.com/profiles/')) {
      const match = input.match(/steamcommunity\.com\/profiles\/(\d+)/);
      if (match && match[1]) {
        return match[1]; // Returnăm direct SteamID64
      }
    }

    // Dacă este URL de tip steamcommunity.com/id/username
    if (input.includes('steamcommunity.com/id/')) {
      const match = input.match(/steamcommunity\.com\/id\/([^\/]+)/);
      return match ? match[1] : input;
    }

    return input;
  }
}

export const steamIdService = new SteamIdService();
