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

export class FaceitAnalyserService {
  private baseUrl = 'https://faceitanalyser.com/api';
  private apiKey = 'B9uwGBLLjCAoBrLJYph4TKvU2Doziue6Yq8svfvG';

  async getPlayerStats(nickname: string): Promise<FaceitAnalyserData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/stats/${encodeURIComponent(nickname)}?key=${this.apiKey}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('FaceitAnalyser response:', data);
      
      return data;
    } catch (error) {
      console.error('Error fetching FaceitAnalyser data:', error);
      toast({
        title: "Eroare FaceitAnalyser",
        description: "Nu s-au putut încărca statisticile din FaceitAnalyser.",
        variant: "destructive",
      });
      return null;
    }
  }
}

export const faceitAnalyserService = new FaceitAnalyserService();