import { toast } from '@/hooks/use-toast';

export interface FaceitAnalyserData {
  playerId: string;
  m: number; // matches
  r: number; // rounds
  w: number; // wins
  k: number; // kills
  a: number; // assists
  d: number; // deaths
  hs: number; // headshots
  kdr: number;
  krr: number;
  drr: number;
  diff: number;
  diffrr: number;
  hltv: number;
  current_elo: number;
  total_elo: number;
  total_elo_m: number;
  highest_elo: number;
  lowest_elo: number;
  first_occurrence: string;
  last_occurrence: string;
  segment_value: string;
  hsp: number; // headshot percentage
  real_kdr: number;
  avg_elo: number;
  wr: number; // win rate
  avg_k: number;
  avg_d: number;
  avg_hltv: number;
  l: number; // losses
  avg_diff: number;
  avg_kdr: number;
  avg_krr: number;
  avg_drr: number;
  avg_diffrr: number;
  real_krr: number;
  real_drr: number;
  real_diffrr: number;
}

export interface FaceitAnalyserComplete {
  overview: any;
  stats: FaceitAnalyserData;
  matches: any[];
  hubs: any[];
  maps: any;
  names: any[];
  highlights: any[];
  playerGraphs: any;
}

export class FaceitAnalyserService {
  private supabaseUrl = 'https://rwizxoeyatdtggrpnpmq.supabase.co';
  private supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aXp4b2V5YXRkdGdncnBucG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2OTkwOTYsImV4cCI6MjA2NDI3NTA5Nn0.6Rpmb1a2iFqw2VZaHl-k-3otQlQuDpaxUPf28uOlLRU';

  private async fetchEndpoint(nickname: string, endpoint: string): Promise<any> {
    const response = await fetch(`${this.supabaseUrl}/functions/v1/get-faceit-analyser-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.supabaseKey}`,
        'apikey': this.supabaseKey,
      },
      body: JSON.stringify({ nickname, endpoint }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  }

  async getPlayerStats(nickname: string): Promise<FaceitAnalyserData | null> {
    try {
      console.log('Fetching FaceitAnalyser stats for:', nickname);
      return await this.fetchEndpoint(nickname, 'stats');
    } catch (error) {
      console.error('Error fetching FaceitAnalyser stats:', error);
      return null;
    }
  }

  async getCompletePlayerData(nickname: string): Promise<FaceitAnalyserComplete | null> {
    try {
      console.log('Fetching complete FaceitAnalyser data for:', nickname);
      
      const [overview, stats, matches, hubs, maps, names, highlights, playerGraphs] = await Promise.allSettled([
        this.fetchEndpoint(nickname, 'overview'),
        this.fetchEndpoint(nickname, 'stats'),
        this.fetchEndpoint(nickname, 'matches'),
        this.fetchEndpoint(nickname, 'hubs'),
        this.fetchEndpoint(nickname, 'maps'),
        this.fetchEndpoint(nickname, 'names'),
        this.fetchEndpoint(nickname, 'highlights'),
        this.fetchEndpoint(nickname, 'playerGraphs'),
      ]);

      return {
        overview: overview.status === 'fulfilled' ? overview.value : null,
        stats: stats.status === 'fulfilled' ? stats.value : null,
        matches: matches.status === 'fulfilled' ? matches.value : [],
        hubs: hubs.status === 'fulfilled' ? hubs.value : [],
        maps: maps.status === 'fulfilled' ? maps.value : null,
        names: names.status === 'fulfilled' ? names.value : [],
        highlights: highlights.status === 'fulfilled' ? highlights.value : [],
        playerGraphs: playerGraphs.status === 'fulfilled' ? playerGraphs.value : null,
      };
    } catch (error) {
      console.error('Error fetching complete FaceitAnalyser data:', error);
      toast({
        title: "Eroare FaceitAnalyser",
        description: "Nu s-au putut încărca datele complete din FaceitAnalyser.",
        variant: "destructive",
      });
      return null;
    }
  }
}

export const faceitAnalyserService = new FaceitAnalyserService();