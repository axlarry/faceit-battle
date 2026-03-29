
import { faceitApiClient } from './faceitApiClient';

export class MatchService {
  async getMatchDetails(matchId: string) {
    try {
      return await faceitApiClient.makeApiCall(`/matches/${matchId}`, false);
    } catch (error) {
      console.error('Error fetching match details:', error);
      return null;
    }
  }

  async getMatchStats(matchId: string) {
    try {
      return await faceitApiClient.makeApiCall(`/matches/${matchId}/stats`, false);
    } catch (error) {
      console.error('Error fetching match stats:', error);
      return null;
    }
  }
}

export const matchService = new MatchService();
