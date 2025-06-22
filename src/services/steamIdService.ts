
import { supabase } from '@/integrations/supabase/client';

export class SteamIdService {
  async getSteamID64(vanityurl: string): Promise<string> {
    try {
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
