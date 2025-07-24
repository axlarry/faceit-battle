import { useState, useEffect } from 'react';

// Convert Steam ID to Steam ID64
const convertSteamIdToSteamId64 = (steamId: string): string => {
  const steamIdMatch = steamId.match(/^STEAM_[0-5]:([01]):(\d+)$/);
  
  if (!steamIdMatch) {
    return steamId;
  }
  
  const y = parseInt(steamIdMatch[1]);
  const z = parseInt(steamIdMatch[2]);
  
  const steamId64 = 76561197960265728n + BigInt(z * 2) + BigInt(y);
  
  return steamId64.toString();
};

export const useSteamIdConverter = (playerId: string) => {
  const [steamId, setSteamId] = useState<string | null>(null);
  const [steamId64, setSteamId64] = useState<string | null>(null);

  useEffect(() => {
    const fetchSteamId = async () => {
      try {
        // Use the original Faceit API for Steam platform data since FaceitAnalyser doesn't provide this
        const { faceitApiClient } = await import('@/services/faceitApiClient');
        const playerData = await faceitApiClient.makeApiCall(`/players/${playerId}`, false);
        if (playerData?.platforms?.steam) {
          const steamIdRaw = playerData.platforms.steam;
          setSteamId(steamIdRaw);
          const steamId64Converted = convertSteamIdToSteamId64(steamIdRaw);
          setSteamId64(steamId64Converted);
        }
      } catch (error) {
        console.error('Error fetching Steam ID:', error);
      }
    };

    if (!steamId && playerId) {
      fetchSteamId();
    }
  }, [playerId, steamId]);

  return { steamId, steamId64 };
};