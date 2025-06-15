
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const API_BASE = 'https://open.faceit.com/data/v4';

export const useFaceitApi = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-faceit-api-key');
      if (error) throw error;
      setApiKey(data.apiKey);
    } catch (error) {
      console.error('Error loading API key:', error);
      // Fallback to hardcoded key for now
      setApiKey('f1755f40-8f84-4d62-b315-5f09dc25eef5');
    } finally {
      setLoading(false);
    }
  };

  const makeApiCall = async (endpoint: string) => {
    if (!apiKey) {
      throw new Error('API key not available');
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API Error: ${errorData.error || response.statusText}`);
    }

    return await response.json();
  };

  const getPlayerStats = async (playerId: string) => {
    try {
      return await makeApiCall(`/players/${playerId}/stats/cs2`);
    } catch (error) {
      console.error('Error fetching player stats:', error);
      toast({
        title: "Eroare la încărcarea statisticilor",
        description: "Nu s-au putut încărca statisticile jucătorului.",
        variant: "destructive",
      });
      return null;
    }
  };

  const getPlayerMatches = async (playerId: string, limit: number = 10) => {
    try {
      const data = await makeApiCall(`/players/${playerId}/history?game=cs2&limit=${limit}`);
      return data.items || [];
    } catch (error) {
      console.error('Error fetching player matches:', error);
      toast({
        title: "Eroare la încărcarea meciurilor",
        description: "Nu s-au putut încărca meciurile jucătorului.",
        variant: "destructive",
      });
      return [];
    }
  };

  const getMatchDetails = async (matchId: string) => {
    try {
      return await makeApiCall(`/matches/${matchId}`);
    } catch (error) {
      console.error('Error fetching match details:', error);
      return null;
    }
  };

  const getMatchStats = async (matchId: string) => {
    try {
      return await makeApiCall(`/matches/${matchId}/stats`);
    } catch (error) {
      console.error('Error fetching match stats:', error);
      return null;
    }
  };

  const getLeaderboard = async (region: string, limit: number = 100) => {
    try {
      const data = await makeApiCall(`/leaderboards/cs2/general?region=${region}&limit=${limit}`);
      return data.items || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: "Eroare la încărcarea clasamentului",
        description: "Nu s-a putut încărca clasamentul pentru această regiune.",
        variant: "destructive",
      });
      return [];
    }
  };

  const searchPlayer = async (nickname: string) => {
    try {
      const data = await makeApiCall(`/search/players?nickname=${encodeURIComponent(nickname)}&game=cs2`);
      return data.items || [];
    } catch (error) {
      console.error('Error searching player:', error);
      toast({
        title: "Eroare la căutarea jucătorului",
        description: "Nu s-a putut găsi jucătorul specificat.",
        variant: "destructive",
      });
      return [];
    }
  };

  return {
    apiKey,
    loading,
    makeApiCall,
    getPlayerStats,
    getPlayerMatches,
    getMatchDetails,
    getMatchStats,
    getLeaderboard,
    searchPlayer
  };
};
