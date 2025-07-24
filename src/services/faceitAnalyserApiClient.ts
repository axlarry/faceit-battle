import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export class FaceitAnalyserApiClient {
  async makeApiCall(endpoint: string, playerId: string, filters?: Record<string, any>): Promise<any> {
    try {
      console.log('Making FaceitAnalyser API call via Supabase:', endpoint, playerId);

      const { data, error } = await supabase.functions.invoke('get-faceit-analyser-data', {
        body: { 
          endpoint: endpoint.replace('/api/', ''), // Remove /api/ prefix since it's added in the function
          playerId,
          filters 
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message);
      }

      if (data?.error) {
        console.error('FaceitAnalyser API error:', data.error);
        throw new Error(data.error);
      }

      console.log('FaceitAnalyser API response:', data);
      return data;
    } catch (error) {
      console.error('FaceitAnalyser API error:', error);
      toast({
        title: "Eroare API",
        description: "Nu s-a putut conecta la FaceitAnalyser API.",
        variant: "destructive",
      });
      throw error;
    }
  }

  // Player overview
  async getPlayerOverview(playerId: string) {
    return this.makeApiCall('overview', playerId);
  }

  // Player stats
  async getPlayerStats(playerId: string) {
    return this.makeApiCall('stats', playerId);
  }

  // Player matches
  async getPlayerMatches(playerId: string, filters?: Record<string, any>) {
    return this.makeApiCall('matches', playerId, filters);
  }

  // Player maps performance
  async getPlayerMaps(playerId: string) {
    return this.makeApiCall('maps', playerId);
  }

  // Player hubs
  async getPlayerHubs(playerId: string) {
    return this.makeApiCall('hubs', playerId);
  }

  // Player insights
  async getPlayerInsights(playerId: string, segmentName: string) {
    return this.makeApiCall(`insights/${segmentName}`, playerId);
  }

  // Player names
  async getPlayerNames(playerId: string) {
    return this.makeApiCall('names', playerId);
  }

  // Player highlights
  async getPlayerHighlights(playerId: string) {
    return this.makeApiCall('highlights', playerId);
  }

  // Player graphs
  async getPlayerGraphs(playerId: string) {
    return this.makeApiCall('playerGraphs', playerId);
  }
}

export const faceitAnalyserApiClient = new FaceitAnalyserApiClient();