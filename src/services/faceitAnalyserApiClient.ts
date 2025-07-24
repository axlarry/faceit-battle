import { toast } from '@/hooks/use-toast';

export class FaceitAnalyserApiClient {
  private baseUrl = 'https://faceitanalyser.com';
  private apiKey = 'B9uwGBLLjCAoBrLJYph4TKvU2Doziue6Yq8svfvG';

  async makeApiCall(endpoint: string): Promise<any> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log('Making FaceitAnalyser API call to:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
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
    return this.makeApiCall(`/api/overview/${playerId}`);
  }

  // Player stats
  async getPlayerStats(playerId: string) {
    return this.makeApiCall(`/api/stats/${playerId}`);
  }

  // Player matches
  async getPlayerMatches(playerId: string, filters?: Record<string, any>) {
    let endpoint = `/api/matches/${playerId}`;
    if (filters) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        params.append(key, value.toString());
      });
      endpoint += `?${params.toString()}`;
    }
    return this.makeApiCall(endpoint);
  }

  // Player maps performance
  async getPlayerMaps(playerId: string) {
    return this.makeApiCall(`/api/maps/${playerId}`);
  }

  // Player hubs
  async getPlayerHubs(playerId: string) {
    return this.makeApiCall(`/api/hubs/${playerId}`);
  }

  // Player insights
  async getPlayerInsights(playerId: string, segmentName: string) {
    return this.makeApiCall(`/api/insights/${playerId}/${segmentName}`);
  }

  // Player names
  async getPlayerNames(playerId: string) {
    return this.makeApiCall(`/api/names/${playerId}`);
  }

  // Player highlights
  async getPlayerHighlights(playerId: string) {
    return this.makeApiCall(`/api/highlights/${playerId}`);
  }

  // Player graphs
  async getPlayerGraphs(playerId: string) {
    return this.makeApiCall(`/api/playerGraphs/${playerId}`);
  }
}

export const faceitAnalyserApiClient = new FaceitAnalyserApiClient();