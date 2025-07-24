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
  private supabaseUrl = 'https://rwizxoeyatdtggrpnpmq.supabase.co';
  private supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aXp4b2V5YXRkdGdncnBucG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2OTkwOTYsImV4cCI6MjA2NDI3NTA5Nn0.6Rpmb1a2iFqw2VZaHl-k-3otQlQuDpaxUPf28uOlLRU';

  async getPlayerStats(nickname: string): Promise<FaceitAnalyserData | null> {
    try {
      console.log('Fetching FaceitAnalyser data for:', nickname);
      
      const response = await fetch(`${this.supabaseUrl}/functions/v1/get-faceit-analyser-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`,
          'apikey': this.supabaseKey,
        },
        body: JSON.stringify({ nickname }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('FaceitAnalyser response:', data);
      
      // Check if response contains error
      if (data.error) {
        throw new Error(data.error);
      }
      
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