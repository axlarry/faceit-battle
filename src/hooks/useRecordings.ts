
import { useState, useEffect, useCallback } from 'react';
import { Recording } from '@/types/streaming';
import { recordingsService } from '@/services/recordingsService';

interface UseRecordingsResult {
  recordings: Recording[];
  groupedRecordings: Record<string, Recording[]>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useRecordings = (nickname?: string): UseRecordingsResult => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecordings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = nickname 
        ? await recordingsService.getRecordingsForUser(nickname)
        : await recordingsService.getAllRecordings();
      setRecordings(data);
    } catch (err) {
      setError('Failed to load recordings');
      console.error('Error fetching recordings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [nickname]);

  useEffect(() => {
    fetchRecordings();
  }, [fetchRecordings]);

  const refresh = useCallback(async () => {
    recordingsService.clearCache();
    await fetchRecordings();
  }, [fetchRecordings]);

  const groupedRecordings = recordingsService.getRecordingsGroupedByUser(recordings);

  return {
    recordings,
    groupedRecordings,
    isLoading,
    error,
    refresh,
  };
};
