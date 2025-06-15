
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
  Crosshair, 
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Users
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
  const kda = getKDA(playerStats);

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

  const PlayerRow = ({ playerData }: { playerData: any }) => {
    const playerKda = getKDA(playerData.stats);
    
    return (
      <div className={`flex items-center justify-between p-3 rounded-lg ${
        playerData.isCurrentPlayer ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-white/5'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {playerData.nickname.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className={`font-medium ${
            playerData.isCurrentPlayer ? 'text-orange-400' : 'text-white'
          }`}>
            {playerData.nickname}
          </span>
        </div>
        
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-green-400 font-bold">{playerKda.kills}</span>
            <span className="text-gray-400">/</span>
            <span className="text-red-400 font-bold">{playerKda.deaths}</span>
            <span className="text-gray-400">/</span>
            <span className="text-blue-400 font-bold">{playerKda.assists}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3 text-blue-400" />
            <span className="text-blue-400 font-bold">
              {getKDRatio(playerData.stats)}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Crosshair className="w-3 h-3 text-red-400" />
            <span className="text-red-400 font-bold">
              {getHeadshotPercentage(playerData.stats)}%
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-400 font-bold">
              {getADR(playerData.stats)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Detalii Meci Complete
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Match Header */}
          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Badge className={`${
                  isWin 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                } border font-semibold text-lg px-4 py-2`}>
                  {isWin ? 'VICTORIE' : 'ÎNFRÂNGERE'}
                </Badge>
                
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-400" />
                  <span className="text-xl font-bold text-white">{mapName}</span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-white mb-1">{matchScore}</div>
                <div className="text-gray-400 text-sm">Scor Final</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-gray-400 text-xs">Data</div>
                  <div className="text-white text-sm font-medium">
                    {formatDate(match.started_at)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-gray-400 text-xs">Durată</div>
                  <div className="text-white text-sm font-medium">
                    {formatMatchDuration(match.started_at, match.finished_at)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-gray-400 text-xs">Mod Joc</div>
                  <div className="text-white text-sm font-medium">
                    {match.game_mode}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {eloChange && typeof eloChange.elo_change === 'number' ? (
                  eloChange.elo_change > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : eloChange.elo_change < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  ) : (
                    <Minus className="w-4 h-4 text-gray-400" />
                  )
                ) : (
                  <Minus className="w-4 h-4 text-gray-400" />
                )}
                <div>
                  <div className="text-gray-400 text-xs">Schimbare ELO</div>
                  <div className={`text-sm font-bold ${
                    eloChange && typeof eloChange.elo_change === 'number' ? (
                      eloChange.elo_change > 0 ? 'text-green-400' : 
                      eloChange.elo_change < 0 ? 'text-red-400' : 'text-gray-400'
                    ) : 'text-gray-400'
                  }`}>
                    {eloChange && typeof eloChange.elo_change === 'number' ? (
                      `${eloChange.elo_change > 0 ? '+' : ''}${eloChange.elo_change}`
                    ) : '-'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Stats */}
          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-400" />
              Statisticile Tale
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{kda.kills}</div>
                <div className="text-gray-400 text-sm">Ucideri</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{kda.deaths}</div>
                <div className="text-gray-400 text-sm">Decese</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{kda.assists}</div>
                <div className="text-gray-400 text-sm">Asistențe</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{getKDRatio(playerStats)}</div>
                <div className="text-gray-400 text-sm">K/D Ratio</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mt-4">
              <div className="text-center">
                <div className="text-xl font-bold text-red-400">{getHeadshotPercentage(playerStats)}%</div>
                <div className="text-gray-400 text-sm">Headshot %</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-400">{getADR(playerStats)}</div>
                <div className="text-gray-400 text-sm">ADR</div>
              </div>
            </div>
          </div>

          {/* Teams */}
          {(team1Players.length > 0 || team2Players.length > 0) && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-400" />
                Jucători
              </h3>
              
              {team1Players.length > 0 && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-md font-semibold text-white mb-3">
                    {team1Players[0]?.teamName || 'Echipa 1'}
                  </h4>
                  <div className="space-y-2">
                    {team1Players.map((playerData, index) => (
                      <PlayerRow key={index} playerData={playerData} />
                    ))}
                  </div>
                </div>
              )}
              
              {team2Players.length > 0 && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-md font-semibold text-white mb-3">
                    {team2Players[0]?.teamName || 'Echipa 2'}
                  </h4>
                  <div className="space-y-2">
                    {team2Players.map((playerData, index) => (
                      <PlayerRow key={index} playerData={playerData} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
