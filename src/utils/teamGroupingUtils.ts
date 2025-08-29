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
  const used = new Set<string>();

  // 1) Group by explicit matchId when available (most reliable)
  const byMatchId = new Map<string, FriendWithLcrypt[]>();
  liveFriends.forEach((f) => {
    const lm = liveMatches[f.player_id];
    if (!lm?.isLive) return;
    if (lm.matchId) {
      const arr = byMatchId.get(lm.matchId) || [];
      arr.push(f);
      byMatchId.set(lm.matchId, arr);
    }
  });

  byMatchId.forEach((players, id) => {
    if (players.length >= 2 && players.length <= 5) {
      teams.push({
        id: `team-${teams.length}`,
        players,
        matchCriteria: { queue: 'matchId', map: undefined, server: undefined },
        color: TEAM_COLORS[teams.length % TEAM_COLORS.length],
      });
      players.forEach(p => used.add(p.player_id));
    }
  });

  // 2) Fallback: group by relaxed criteria (competition + map + server when present)
  const byRelaxedKey = new Map<string, FriendWithLcrypt[]>();
  liveFriends.forEach((f) => {
    if (used.has(f.player_id)) return;
    const lm = liveMatches[f.player_id];
    if (!lm?.isLive) return;
    const md = lm.matchDetails || {};
    const key = `${lm.competition || 'unknown'}|${md.map || 'unknown'}|${md.server || 'unknown'}|${md.what || md.queue || 'unknown'}`;
    const arr = byRelaxedKey.get(key) || [];
    arr.push(f);
    byRelaxedKey.set(key, arr);
  });

  byRelaxedKey.forEach((players, key) => {
    if (players.length >= 2 && players.length <= 5) {
      teams.push({
        id: `team-${teams.length}`,
        players,
        matchCriteria: { queue: key },
        color: TEAM_COLORS[teams.length % TEAM_COLORS.length],
      });
      players.forEach(p => used.add(p.player_id));
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