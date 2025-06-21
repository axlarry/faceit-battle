
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
      <DialogContent className="modal-bg-tech modal-border-glow text-white max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="modal-content-overlay border-b border-slate-700 pb-4 rounded-t-lg">
          <DialogTitle className="text-2xl font-bold text-center text-orange-400">
            Match Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 p-4 modal-content-overlay rounded-b-lg">
          {/* Match Header - Team vs Team */}
          <MatchHeader 
            team1Name={team1Name}
            team2Name={team2Name}
            team1Score={team1Score}
            team2Score={team2Score}
            isWin={isWin}
          />

          {/* Match Info Row */}
          <MatchInfo 
            mapName={mapName}
            startedAt={match.started_at}
            finishedAt={match.finished_at}
            eloChange={eloChange}
          />

          {/* Players Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
