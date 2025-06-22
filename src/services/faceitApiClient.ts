
import { apiService } from './apiService';
import { supabase } from '@/integrations/supabase/client';

export class FaceitApiClient {
  async makeApiCall(endpoint: string, useLeaderboardApi: boolean = false) {
    try {
      console.log(`🚀 Making API call via Supabase proxy: ${endpoint}`);
      
      const { data, error } = await supabase.functions.invoke('faceit-proxy', {
        body: { 
          endpoint,
          useLeaderboardApi 
        }
      });

      if (error) {
        console.error('❌ Faceit proxy error:', error);
        throw new Error(`API Error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('❌ API call failed:', error);
      throw error;
    }
  }
}

export const faceitApiClient = new FaceitApiClient();
