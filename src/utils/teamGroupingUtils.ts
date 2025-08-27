import type { FriendWithLcrypt } from "@/hooks/types/lcryptDataManagerTypes";

interface MatchCriteria {
  map?: string;
  server?: string;
  queue?: string;
  score?: string;
  duration?: string;
  round?: number;
}

interface TeamGroup {
  id: string;
  players: FriendWithLcrypt[];
  matchCriteria: MatchCriteria;
  color: string;
}

// Team colors for visual differentiation
const TEAM_COLORS = [
  'border-blue-400 ring-blue-400/20',
  'border-purple-400 ring-purple-400/20', 
  'border-pink-400 ring-pink-400/20',
  'border-yellow-400 ring-yellow-400/20',
  'border-cyan-400 ring-cyan-400/20',
];

export function groupLivePlayersByTeam(liveFriends: FriendWithLcrypt[], liveMatches: Record<string, any>): TeamGroup[] {
  const teams: TeamGroup[] = [];
  const processedPlayers = new Set<string>();

  liveFriends.forEach((friend) => {
    if (processedPlayers.has(friend.player_id)) return;

    const liveData = liveMatches[friend.player_id];
    if (!liveData?.isLive || !liveData.matchDetails) return;

    const matchCriteria = extractMatchCriteria(liveData.matchDetails);
    if (!matchCriteria) return;

    // Find other players with matching criteria
    const teammates = liveFriends.filter((otherFriend) => {
      if (otherFriend.player_id === friend.player_id) return true;
      if (processedPlayers.has(otherFriend.player_id)) return false;

      const otherLiveData = liveMatches[otherFriend.player_id];
      if (!otherLiveData?.isLive || !otherLiveData.matchDetails) return false;

      const otherCriteria = extractMatchCriteria(otherLiveData.matchDetails);
      return areMatchCriteriaSame(matchCriteria, otherCriteria);
    });

    if (teammates.length >= 2 && teammates.length <= 5) {
      const teamId = `team-${teams.length}`;
      const colorClass = TEAM_COLORS[teams.length % TEAM_COLORS.length];

      teams.push({
        id: teamId,
        players: teammates,
        matchCriteria,
        color: colorClass,
      });

      // Mark all teammates as processed
      teammates.forEach(teammate => processedPlayers.add(teammate.player_id));
    }
  });

  return teams;
}

function extractMatchCriteria(matchDetails: any): MatchCriteria | null {
  // Extract from lcrypt current data structure
  if (matchDetails.map && matchDetails.server && matchDetails.what) {
    return {
      map: matchDetails.map,
      server: matchDetails.server,
      queue: matchDetails.what,
      score: matchDetails.score,
      duration: matchDetails.duration,
      round: matchDetails.round,
    };
  }

  // Fallback for other data structures
  if (matchDetails.current) {
    return {
      map: matchDetails.current.map,
      server: matchDetails.current.server,
      queue: matchDetails.current.what,
      score: matchDetails.current.score,
      duration: matchDetails.current.duration,
      round: matchDetails.current.round,
    };
  }

  return null;
}

function areMatchCriteriaSame(criteria1: MatchCriteria, criteria2: MatchCriteria): boolean {
  return (
    criteria1.map === criteria2.map &&
    criteria1.server === criteria2.server &&
    criteria1.queue === criteria2.queue &&
    criteria1.score === criteria2.score &&
    criteria1.duration === criteria2.duration &&
    criteria1.round === criteria2.round
  );
}

export function getPlayerTeamInfo(playerId: string, teams: TeamGroup[]): { team: TeamGroup; isInTeam: boolean } | null {
  const team = teams.find(t => t.players.some(p => p.player_id === playerId));
  return team ? { team, isInTeam: true } : null;
}