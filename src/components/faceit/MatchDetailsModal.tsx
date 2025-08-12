
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Player, Match } from "@/types/Player";
import { 
  formatMatchDuration, 
  getMatchResult, 
  getMatchScore, 
  getMapInfo 
} from "@/utils/matchUtils";
import { getEloChange } from "@/utils/eloUtils";
import { getPlayerStatsFromMatch } from "@/utils/playerDataUtils";
import { MatchHeader } from "./MatchHeader";
import { MatchInfo } from "./MatchInfo";
import { TeamPlayersSection } from "./TeamPlayersSection";
import { MatchServerInfo } from "./MatchServerInfo";

interface MatchDetailsModalProps {
  match: Match | null;
  player: Player;
  matchesStats: {[key: string]: any};
  isOpen: boolean;
  onClose: () => void;
}

export const MatchDetailsModal = ({ 
  match, 
  player, 
  matchesStats, 
  isOpen, 
  onClose 
}: MatchDetailsModalProps) => {
  if (!match) return null;

  const isWin = getMatchResult(match, player);
  const playerStats = getPlayerStatsFromMatch(match, player, matchesStats);
  const eloChange = getEloChange(match, player, matchesStats);
  const mapName = getMapInfo(match, matchesStats);
  const matchScore = getMatchScore(match, matchesStats, player);

  // Get all players from both teams
  const getAllPlayers = () => {
    const players: any[] = [];
    
    if (match.teams) {
      Object.keys(match.teams).forEach(teamId => {
        const team = match.teams[teamId];
        if (team.players) {
          team.players.forEach(p => {
            const stats = getPlayerStatsFromMatch(match, { player_id: p.player_id } as Player, matchesStats);
            players.push({
              ...p,
              teamId,
              teamName: team.nickname,
              stats,
              isCurrentPlayer: p.player_id === player.player_id
            });
          });
        }
      });
    }
    
    return players;
  };

  const allPlayers = getAllPlayers();
  const team1Players = allPlayers.filter(p => p.teamId === Object.keys(match.teams || {})[0]);
  const team2Players = allPlayers.filter(p => p.teamId === Object.keys(match.teams || {})[1]);
  const team1Name = team1Players[0]?.teamName || 'Team 1';
  const team2Name = team2Players[0]?.teamName || 'Team 2';

  // Parse match score for individual team scores
  const parseTeamScores = () => {
    if (matchScore && matchScore !== 'N/A') {
      const scores = matchScore.split(' - ').map(s => parseInt(s.trim()));
      if (scores.length === 2) {
        return { team1Score: scores[0], team2Score: scores[1] };
      }
    }
    return { team1Score: 0, team2Score: 0 };
  };

  const { team1Score, team2Score } = parseTeamScores();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-orange-500/30 text-white w-[95vw] max-w-6xl h-[90vh] max-h-[90vh] overflow-hidden shadow-2xl shadow-orange-500/20 rounded-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Detalii meci</DialogTitle>
          <DialogDescription>Statistici și informații despre meci</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6 pt-6 space-y-4 md:space-y-6 scrollbar-hide">
          {/* Match Header - Team vs Team with Map Background */}
          <MatchHeader 
            team1Name={team1Name}
            team2Name={team2Name}
            team1Score={team1Score}
            team2Score={team2Score}
            isWin={isWin}
            mapName={mapName}
          />

          {/* Match Info Row */}
          <MatchInfo 
            mapName={mapName}
            startedAt={match.started_at}
            finishedAt={match.finished_at}
            eloChange={eloChange}
          />

          {/* Players Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
            {/* Team 1 Players */}
            {team1Players.length > 0 && (
              <TeamPlayersSection 
                players={team1Players}
                teamName={team1Name}
                teamScore={team1Score}
                teamColor="blue"
              />
            )}

            {/* Team 2 Players */}
            {team2Players.length > 0 && (
              <TeamPlayersSection 
                players={team2Players}
                teamName={team2Name}
                teamScore={team2Score}
                teamColor="red"
              />
            )}
          </div>

          {/* Server Info */}
          <MatchServerInfo 
            gameMode={match.game_mode}
            competitionName={match.competition_name}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
