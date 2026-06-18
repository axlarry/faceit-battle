
import { enrichedPlayerService } from './enrichedPlayerService';
import { playerStatsService } from './playerStatsService';
import { playerMatchesService } from './playerMatchesService';
import { playerSearchService } from './playerSearchService';

export class PlayerService {
  async checkPlayerLiveMatch(playerId: string) {
    try {
      const playerData = await this.getPlayerBasicData(playerId);
      const nickname = playerData?.nickname;

      if (nickname) {
        const enriched = await enrichedPlayerService.getEnrichedPlayerData(nickname);
        if (enriched?.isLive) {
          return {
            isLive: true,
            matchId: enriched.liveInfo?.matchId || '',
            competition: enriched.liveInfo?.competition || 'FACEIT Match',
            status: enriched.liveInfo?.status || 'LIVE',
            state: enriched.liveInfo?.state || 'ONGOING',
            matchDetails: enriched.liveInfo?.matchDetails,
            liveMatch: enriched.liveInfo?.liveMatch,
          };
        }
      }

      return { isLive: false };
    } catch (error) {
      console.warn(`Error checking live match for player ${playerId}:`, error);
      return { isLive: false };
    }
  }

  private async getPlayerBasicData(playerId: string) {
    try {
      const { faceitApiClient } = await import('./faceitApiClient');
      return await faceitApiClient.makeApiCall(`/players/${playerId}`, false);
    } catch (error) {
      console.warn(`Error fetching basic player data for ${playerId}:`, error);
      return null;
    }
  }

  async getPlayerCoverImage(nickname: string) {
    try {
      const { faceitApiClient } = await import('./faceitApiClient');
      const playerData = await faceitApiClient.makeApiCall(`/players?nickname=${nickname}`, false);
      return playerData?.cover_image ?? null;
    } catch (error) {
      console.warn(`Error fetching cover image for ${nickname}:`, error);
      return null;
    }
  }

  async getPlayerStats(playerId: string) {
    return playerStatsService.getPlayerStats(playerId);
  }

  async getPlayerMatches(playerId: string, limit: number = 10) {
    return playerMatchesService.getPlayerMatches(playerId, limit);
  }

  async searchPlayer(nickname: string) {
    return playerSearchService.searchPlayer(nickname);
  }
}

export const playerService = new PlayerService();
