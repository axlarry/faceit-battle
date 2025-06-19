
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Player, Match } from "@/types/Player";
import { 
  Trophy, 
  MapPin, 
  Clock, 
  Calendar, 
  Target, 
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Star,
  Shield,
  Crosshair,
  Zap
} from "lucide-react";
import { 
  formatDate, 
  formatMatchDuration, 
  getMatchResult, 
  getMatchScore, 
  getMapInfo 
} from "@/utils/matchUtils";
import { getEloChange } from "@/utils/eloUtils";
import { getPlayerStatsFromMatch, getKDA } from "@/utils/playerDataUtils";
import { getKDRatio, getHeadshotPercentage, getADR } from "@/utils/statsUtils";

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

  const PlayerStatsRow = ({ playerData, teamSide }: { playerData: any, teamSide: 'left' | 'right' }) => {
    const kda = getKDA(playerData.stats);
    
    return (
      <div className={`flex items-center py-3 px-4 bg-slate-800/50 rounded-lg border border-slate-700/50 ${
        playerData.isCurrentPlayer ? 'ring-2 ring-orange-500/50 bg-orange-500/10' : ''
      }`}>
        {/* Player Info */}
        <div className="flex items-center gap-3 min-w-[180px]">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            playerData.isCurrentPlayer 
              ? 'bg-orange-500 text-white' 
              : 'bg-slate-600 text-slate-200'
          }`}>
            {playerData.nickname.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className={`font-semibold text-sm flex items-center gap-1 ${
              playerData.isCurrentPlayer ? 'text-orange-400' : 'text-white'
            }`}>
              {playerData.nickname}
              {playerData.isCurrentPlayer && <Star className="w-3 h-3 fill-orange-400" />}
            </div>
            <div className="text-xs text-slate-400">
              Level {playerData.skill_level || '-'}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 ml-auto text-xs">
          <div className="text-center">
            <div className="text-slate-400 mb-1">K/D</div>
            <div className="text-white font-semibold">{getKDRatio(playerData.stats)}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-400 mb-1">K</div>
            <div className="text-green-400 font-semibold">{kda.kills}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-400 mb-1">A</div>
            <div className="text-blue-400 font-semibold">{kda.assists}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-400 mb-1">D</div>
            <div className="text-red-400 font-semibold">{kda.deaths}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-400 mb-1">HS%</div>
            <div className="text-purple-400 font-semibold">{getHeadshotPercentage(playerData.stats)}%</div>
          </div>
          <div className="text-center">
            <div className="text-slate-400 mb-1">ADR</div>
            <div className="text-yellow-400 font-semibold">{getADR(playerData.stats)}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border border-slate-700 text-white max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-700 pb-4">
          <DialogTitle className="text-2xl font-bold text-center text-orange-400">
            Match Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 p-4">
          {/* Match Header - Team vs Team */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              {/* Team 1 */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-white mb-1">{team1Name}</div>
                  <div className="text-slate-400 text-sm">Team</div>
                </div>
                <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-slate-400" />
                </div>
              </div>

              {/* Match Score & Status */}
              <div className="text-center px-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className={`text-4xl font-bold ${team1Score > team2Score ? 'text-green-400' : 'text-red-400'}`}>
                    {team1Score}
                  </div>
                  <div className="text-2xl text-slate-400">:</div>
                  <div className={`text-4xl font-bold ${team2Score > team1Score ? 'text-green-400' : 'text-red-400'}`}>
                    {team2Score}
                  </div>
                </div>
                <Badge className={`${
                  isWin 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                } border font-semibold px-4 py-1`}>
                  {isWin ? 'VICTORY' : 'DEFEAT'}
                </Badge>
              </div>

              {/* Team 2 */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-slate-400" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-white mb-1">{team2Name}</div>
                  <div className="text-slate-400 text-sm">Team</div>
                </div>
              </div>
            </div>

            {/* Match Info Row */}
            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-700">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-400" />
                <div>
                  <div className="text-slate-400 text-xs">Map</div>
                  <div className="text-white font-semibold">{mapName}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-slate-400 text-xs">Date</div>
                  <div className="text-white font-semibold text-sm">{formatDate(match.started_at)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-400" />
                <div>
                  <div className="text-slate-400 text-xs">Duration</div>
                  <div className="text-white font-semibold">{formatMatchDuration(match.started_at, match.finished_at)}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {eloChange && typeof eloChange.elo_change === 'number' ? (
                  eloChange.elo_change > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : eloChange.elo_change < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  ) : (
                    <Minus className="w-4 h-4 text-slate-400" />
                  )
                ) : (
                  <Minus className="w-4 h-4 text-slate-400" />
                )}
                <div>
                  <div className="text-slate-400 text-xs">ELO Change</div>
                  <div className={`font-semibold ${
                    eloChange && typeof eloChange.elo_change === 'number' ? (
                      eloChange.elo_change > 0 ? 'text-green-400' : 
                      eloChange.elo_change < 0 ? 'text-red-400' : 'text-slate-400'
                    ) : 'text-slate-400'
                  }`}>
                    {eloChange && typeof eloChange.elo_change === 'number' ? (
                      `${eloChange.elo_change > 0 ? '+' : ''}${eloChange.elo_change}`
                    ) : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Players Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team 1 Players */}
            {team1Players.length > 0 && (
              <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <h3 className="text-lg font-bold text-white">{team1Name}</h3>
                  <div className="ml-auto text-2xl font-bold text-blue-400">{team1Score}</div>
                </div>
                <div className="space-y-2">
                  {team1Players.map((playerData, index) => (
                    <PlayerStatsRow key={index} playerData={playerData} teamSide="left" />
                  ))}
                </div>
              </div>
            )}

            {/* Team 2 Players */}
            {team2Players.length > 0 && (
              <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <h3 className="text-lg font-bold text-white">{team2Name}</h3>
                  <div className="ml-auto text-2xl font-bold text-red-400">{team2Score}</div>
                </div>
                <div className="space-y-2">
                  {team2Players.map((playerData, index) => (
                    <PlayerStatsRow key={index} playerData={playerData} teamSide="right" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Server Info */}
          <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700 text-center">
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-slate-400">Server:</span>
                <span className="text-white font-semibold">{match.game_mode}</span>
              </div>
              <div className="w-px h-4 bg-slate-600"></div>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-slate-400">Competition:</span>
                <span className="text-white font-semibold">{match.competition_name}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
