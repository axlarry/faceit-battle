import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction, isDiscordActivity } from '@/lib/discordProxy';

// Helper to invoke edge functions with Discord proxy support
const invokeFunction = async (functionName: string, body: Record<string, unknown>) => {
  if (isDiscordActivity()) {
    return invokeEdgeFunction(functionName, body);
  }
  return supabase.functions.invoke(functionName, { body });
};

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
  private async fetchEndpoint(nickname: string, endpoint: string): Promise<any> {
    const { data, error } = await invokeFunction('get-faceit-analyser-data', { nickname, endpoint });

    if (error) {
      throw new Error((error as any)?.message || 'Failed to fetch analyser data');
    }

    if ((data as any)?.error) {
      throw new Error((data as any).error);
    }

    return data;
  }

  async getPlayerStats(nickname: string): Promise<FaceitAnalyserData | null> {
    try {
      return await this.fetchEndpoint(nickname, 'stats');
    } catch (error) {
      console.error('Error fetching FaceitAnalyser stats:', error);
      return null;
    }
  }

  async getCompletePlayerData(nickname: string): Promise<FaceitAnalyserComplete | null> {
    try {
      const endpoints = ['overview', 'stats', 'matches', 'hubs', 'maps', 'names', 'highlights', 'playerGraphs'] as const;
      const results = await Promise.allSettled(
        endpoints.map(ep => this.fetchEndpoint(nickname, ep))
      );

      const [overview, stats, matches, hubs, maps, names, highlights, playerGraphs] = results;

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
