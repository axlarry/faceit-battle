import { supabase } from "@/integrations/supabase/client";
import { CacheEntry } from "@/types/FaceitAnalyser";

class FaceitAnalyserCacheService {
  async getCachedData(playerId: string, cacheType: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('faceit_analyser_cache')
        .select('data, expires_at')
        .eq('player_id', playerId)
        .eq('cache_type', cacheType)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if cache is expired
      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      
      if (now > expiresAt) {
        // Cache expired, delete it
        await this.deleteCachedData(playerId, cacheType);
        return null;
      }

      return data.data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  async setCachedData(playerId: string, nickname: string, cacheType: string, data: any): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 4); // 4 hours TTL

      await supabase
        .from('faceit_analyser_cache')
        .upsert({
          player_id: playerId,
          nickname,
          cache_type: cacheType,
          data,
          expires_at: expiresAt.toISOString()
        });
    } catch (error) {
      console.error('Error setting cached data:', error);
    }
  }

  async deleteCachedData(playerId: string, cacheType: string): Promise<void> {
    try {
      await supabase
        .from('faceit_analyser_cache')
        .delete()
        .eq('player_id', playerId)
        .eq('cache_type', cacheType);
    } catch (error) {
      console.error('Error deleting cached data:', error);
    }
  }

  async getExpiredCacheEntries(): Promise<CacheEntry[]> {
    try {
      const { data, error } = await supabase
        .from('faceit_analyser_cache')
        .select('*')
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Error getting expired cache entries:', error);
        return [];
      }

      return (data || []).map(entry => ({
        playerId: entry.player_id,
        cacheType: entry.cache_type as 'player_stats' | 'player_graphs' | 'match_analysis',
        data: entry.data,
        expiresAt: entry.expires_at,
        createdAt: entry.created_at
      }));
    } catch (error) {
      console.error('Error getting expired cache entries:', error);
      return [];
    }
  }

  async cleanExpiredCache(): Promise<void> {
    try {
      await supabase
        .from('faceit_analyser_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());
    } catch (error) {
      console.error('Error cleaning expired cache:', error);
    }
  }

  async getCacheStats(): Promise<{
    totalEntries: number;
    expiredEntries: number;
    cacheByType: Record<string, number>;
  }> {
    try {
      const { data: allEntries } = await supabase
        .from('faceit_analyser_cache')
        .select('cache_type, expires_at');

      const { data: expiredEntries } = await supabase
        .from('faceit_analyser_cache')
        .select('id')
        .lt('expires_at', new Date().toISOString());

      const totalEntries = allEntries?.length || 0;
      const expiredCount = expiredEntries?.length || 0;
      
      const cacheByType = (allEntries || []).reduce((acc, entry) => {
        acc[entry.cache_type] = (acc[entry.cache_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalEntries,
        expiredEntries: expiredCount,
        cacheByType
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        expiredEntries: 0,
        cacheByType: {}
      };
    }
  }
}

export const faceitAnalyserCacheService = new FaceitAnalyserCacheService();