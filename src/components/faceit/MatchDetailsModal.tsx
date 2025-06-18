
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
  Users,
  Star,
  Sword
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
      <div className={`relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] ${
        playerData.isCurrentPlayer 
          ? 'bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 border-2 border-orange-500/50 shadow-lg shadow-orange-500/20' 
          : 'bg-white/5 border border-white/10 hover:bg-white/10'
      }`}>
        {playerData.isCurrentPlayer && (
          <div className="absolute top-2 right-2">
            <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
              playerData.isCurrentPlayer 
                ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white' 
                : 'bg-gradient-to-br from-slate-600 to-slate-700 text-white'
            }`}>
              {playerData.nickname.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className={`font-semibold text-sm ${
                playerData.isCurrentPlayer ? 'text-orange-300' : 'text-white'
              }`}>
                {playerData.nickname}
              </span>
              <div className="text-xs text-gray-400">Level {playerData.skill_level || '-'}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-1 bg-black/20 rounded-lg px-2 py-1">
              <span className="text-green-400 font-bold">{playerKda.kills}</span>
              <span className="text-gray-400">/</span>
              <span className="text-red-400 font-bold">{playerKda.deaths}</span>
              <span className="text-gray-400">/</span>
              <span className="text-blue-400 font-bold">{playerKda.assists}</span>
            </div>
            
            <div className="flex items-center gap-1 bg-black/20 rounded-lg px-2 py-1">
              <Target className="w-3 h-3 text-blue-400" />
              <span className="text-blue-400 font-bold">{getKDRatio(playerData.stats)}</span>
            </div>
            
            <div className="flex items-center gap-1 bg-black/20 rounded-lg px-2 py-1">
              <Crosshair className="w-3 h-3 text-red-400" />
              <span className="text-red-400 font-bold">{getHeadshotPercentage(playerData.stats)}%</span>
            </div>
            
            <div className="flex items-center gap-1 bg-black/20 rounded-lg px-2 py-1">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-yellow-400 font-bold">{getADR(playerData.stats)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/20 text-white max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="border-b border-white/10 pb-6">
          <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            Detalii Meci Complete
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 p-2">
          {/* Match Header - Enhanced */}
          <div className="relative bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-8 border border-white/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-6">
                  <Badge className={`${
                    isWin 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg shadow-green-500/30' 
                      : 'bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg shadow-red-500/30'
                  } font-bold text-lg px-6 py-3 rounded-xl`}>
                    {isWin ? '🏆 VICTORIE' : '💥 ÎNFRÂNGERE'}
                  </Badge>
                  
                  <div className="flex items-center gap-3 bg-black/20 rounded-xl px-4 py-2">
                    <MapPin className="w-6 h-6 text-orange-400" />
                    <span className="text-2xl font-bold text-white">{mapName}</span>
                  </div>
                </div>
                
                <div className="text-right bg-black/20 rounded-xl p-4">
                  <div className="text-3xl font-bold text-white mb-1">{matchScore}</div>
                  <div className="text-gray-300 text-sm font-medium">Scor Final</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-black/20 rounded-xl p-4 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-orange-400" />
                  <div>
                    <div className="text-gray-300 text-xs font-medium">Data</div>
                    <div className="text-white text-sm font-bold">{formatDate(match.started_at)}</div>
                  </div>
                </div>
                
                <div className="bg-black/20 rounded-xl p-4 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-gray-300 text-xs font-medium">Durată</div>
                    <div className="text-white text-sm font-bold">{formatMatchDuration(match.started_at, match.finished_at)}</div>
                  </div>
                </div>
                
                <div className="bg-black/20 rounded-xl p-4 flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <div>
                    <div className="text-gray-300 text-xs font-medium">Mod Joc</div>
                    <div className="text-white text-sm font-bold">{match.game_mode}</div>
                  </div>
                </div>
                
                <div className="bg-black/20 rounded-xl p-4 flex items-center gap-3">
                  {eloChange && typeof eloChange.elo_change === 'number' ? (
                    eloChange.elo_change > 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : eloChange.elo_change < 0 ? (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    ) : (
                      <Minus className="w-5 h-5 text-gray-400" />
                    )
                  ) : (
                    <Minus className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <div className="text-gray-300 text-xs font-medium">Schimbare ELO</div>
                    <div className={`text-sm font-bold ${
                      eloChange && typeof eloChange.elo_change === 'number' ? (
                        eloChange.elo_change > 0 ? 'text-green-400' : 
                        eloChange.elo_change < 0 ? 'text-red-400' : 'text-gray-400'
                      ) : 'text-gray-400'
                    }`}>
                      {eloChange && typeof eloChange.elo_change === 'number' ? (
                        `${eloChange.elo_change > 0 ? '+' : ''}${eloChange.elo_change}`
                      ) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Stats - Enhanced */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              Statisticile Tale
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-6 text-center border border-green-500/30">
                <div className="text-3xl font-bold text-green-400 mb-2">{kda.kills}</div>
                <div className="text-green-300 text-sm font-medium">Ucideri</div>
              </div>
              <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl p-6 text-center border border-red-500/30">
                <div className="text-3xl font-bold text-red-400 mb-2">{kda.deaths}</div>
                <div className="text-red-300 text-sm font-medium">Decese</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-6 text-center border border-blue-500/30">
                <div className="text-3xl font-bold text-blue-400 mb-2">{kda.assists}</div>
                <div className="text-blue-300 text-sm font-medium">Asistențe</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-6 text-center border border-purple-500/30">
                <div className="text-3xl font-bold text-purple-400 mb-2">{getKDRatio(playerStats)}</div>
                <div className="text-purple-300 text-sm font-medium">K/D Ratio</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-6 text-center border border-orange-500/30">
                <div className="text-2xl font-bold text-orange-400 mb-2">{getHeadshotPercentage(playerStats)}%</div>
                <div className="text-orange-300 text-sm font-medium">Headshot %</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-xl p-6 text-center border border-yellow-500/30">
                <div className="text-2xl font-bold text-yellow-400 mb-2">{getADR(playerStats)}</div>
                <div className="text-yellow-300 text-sm font-medium">ADR</div>
              </div>
            </div>
          </div>

          {/* Teams - Enhanced */}
          {(team1Players.length > 0 || team2Players.length > 0) && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                Jucători
              </h3>
              
              {team1Players.length > 0 && (
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-2xl p-6 border border-blue-500/20">
                  <h4 className="text-lg font-bold text-blue-300 mb-4 flex items-center gap-2">
                    <Sword className="w-5 h-5" />
                    {team1Players[0]?.teamName || 'Echipa 1'}
                  </h4>
                  <div className="space-y-3">
                    {team1Players.map((playerData, index) => (
                      <PlayerRow key={index} playerData={playerData} />
                    ))}
                  </div>
                </div>
              )}
              
              {team2Players.length > 0 && (
                <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-2xl p-6 border border-red-500/20">
                  <h4 className="text-lg font-bold text-red-300 mb-4 flex items-center gap-2">
                    <Sword className="w-5 h-5" />
                    {team2Players[0]?.teamName || 'Echipa 2'}
                  </h4>
                  <div className="space-y-3">
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
