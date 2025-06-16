
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
  Sword,
  Shield,
  Flame
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
import { useState, useEffect } from "react";
import { useFaceitApi } from "@/hooks/useFaceitApi";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [eloChange, setEloChange] = useState<{ elo_change: number } | null>(null);
  const [loadingElo, setLoadingElo] = useState(true);
  const { getMatchDetails } = useFaceitApi();

  useEffect(() => {
    if (match && isOpen) {
      const fetchEloChange = async () => {
        setLoadingElo(true);
        try {
          const result = await getEloChange(match, player, matchesStats, getMatchDetails);
          setEloChange(result);
        } catch (error) {
          console.error('Error fetching ELO change:', error);
        } finally {
          setLoadingElo(false);
        }
      };

      fetchEloChange();
    }
  }, [match?.match_id, player.player_id, isOpen]);

  if (!match) return null;

  const isWin = getMatchResult(match, player);
  const playerStats = getPlayerStatsFromMatch(match, player, matchesStats);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 backdrop-blur-xl border border-cyan-500/30 text-white max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="border-b border-cyan-500/20 pb-6">
          <DialogTitle className="text-4xl font-black text-center bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            ⚡ MATCH ANALYSIS ⚡
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8 p-2">
          {/* Match Header - Futuristic */}
          <div className="relative bg-gradient-to-br from-cyan-900/20 via-blue-900/20 to-purple-900/20 rounded-3xl p-8 border border-cyan-400/30 overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDBmZmZmIiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-8">
                  <Badge className={`${
                    isWin 
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-black border-0 shadow-2xl shadow-green-500/50' 
                      : 'bg-gradient-to-r from-red-400 to-pink-500 text-black border-0 shadow-2xl shadow-red-500/50'
                  } font-black text-xl px-8 py-4 rounded-2xl`}>
                    {isWin ? '🏆 VICTORY' : '💀 DEFEAT'}
                  </Badge>
                  
                  <div className="flex items-center gap-4 bg-black/40 rounded-2xl px-6 py-3 border border-cyan-400/30">
                    <MapPin className="w-8 h-8 text-cyan-400" />
                    <span className="text-3xl font-black text-cyan-300">{mapName}</span>
                  </div>
                </div>
                
                <div className="text-right bg-black/40 rounded-2xl p-6 border border-cyan-400/30">
                  <div className="text-4xl font-black text-cyan-300 mb-2">{matchScore}</div>
                  <div className="text-gray-300 text-sm font-bold">FINAL SCORE</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-black/40 rounded-2xl p-5 flex items-center gap-4 border border-cyan-400/20">
                  <Calendar className="w-6 h-6 text-cyan-400" />
                  <div>
                    <div className="text-gray-300 text-xs font-bold">DATE</div>
                    <div className="text-white text-sm font-black">{formatDate(match.started_at)}</div>
                  </div>
                </div>
                
                <div className="bg-black/40 rounded-2xl p-5 flex items-center gap-4 border border-cyan-400/20">
                  <Clock className="w-6 h-6 text-blue-400" />
                  <div>
                    <div className="text-gray-300 text-xs font-bold">DURATION</div>
                    <div className="text-white text-sm font-black">{formatMatchDuration(match.started_at, match.finished_at)}</div>
                  </div>
                </div>
                
                <div className="bg-black/40 rounded-2xl p-5 flex items-center gap-4 border border-cyan-400/20">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                  <div>
                    <div className="text-gray-300 text-xs font-bold">MODE</div>
                    <div className="text-white text-sm font-black">{match.game_mode}</div>
                  </div>
                </div>
                
                <div className="bg-black/40 rounded-2xl p-5 flex items-center gap-4 border border-cyan-400/20">
                  {loadingElo ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
                  ) : eloChange && typeof eloChange.elo_change === 'number' ? (
                    eloChange.elo_change > 0 ? (
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    ) : eloChange.elo_change < 0 ? (
                      <TrendingDown className="w-6 h-6 text-red-400" />
                    ) : (
                      <Minus className="w-6 h-6 text-gray-400" />
                    )
                  ) : (
                    <Minus className="w-6 h-6 text-gray-400" />
                  )}
                  <div>
                    <div className="text-gray-300 text-xs font-bold">ELO CHANGE</div>
                    <div className={`text-sm font-black ${
                      loadingElo ? 'text-gray-400' :
                      eloChange && typeof eloChange.elo_change === 'number' ? (
                        eloChange.elo_change > 0 ? 'text-green-400' : 
                        eloChange.elo_change < 0 ? 'text-red-400' : 'text-gray-400'
                      ) : 'text-gray-400'
                    }`}>
                      {loadingElo ? '...' :
                       eloChange && typeof eloChange.elo_change === 'number' ? (
                        `${eloChange.elo_change > 0 ? '+' : ''}${eloChange.elo_change}`
                      ) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Stats - Futuristic */}
          <div className="bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-red-900/20 rounded-3xl p-8 border border-purple-400/30">
            <h3 className="text-3xl font-black text-white mb-8 flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              YOUR PERFORMANCE
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-500/30 to-emerald-600/30 rounded-2xl p-8 text-center border border-green-400/50 shadow-xl shadow-green-500/20">
                <div className="text-4xl font-black text-green-300 mb-3">{kda.kills}</div>
                <div className="text-green-200 text-sm font-bold">KILLS</div>
              </div>
              <div className="bg-gradient-to-br from-red-500/30 to-pink-600/30 rounded-2xl p-8 text-center border border-red-400/50 shadow-xl shadow-red-500/20">
                <div className="text-4xl font-black text-red-300 mb-3">{kda.deaths}</div>
                <div className="text-red-200 text-sm font-bold">DEATHS</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500/30 to-cyan-600/30 rounded-2xl p-8 text-center border border-blue-400/50 shadow-xl shadow-blue-500/20">
                <div className="text-4xl font-black text-blue-300 mb-3">{kda.assists}</div>
                <div className="text-blue-200 text-sm font-bold">ASSISTS</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/30 to-violet-600/30 rounded-2xl p-8 text-center border border-purple-400/50 shadow-xl shadow-purple-500/20">
                <div className="text-4xl font-black text-purple-300 mb-3">{getKDRatio(playerStats)}</div>
                <div className="text-purple-200 text-sm font-bold">K/D RATIO</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-orange-500/30 to-yellow-500/30 rounded-2xl p-8 text-center border border-orange-400/50 shadow-xl shadow-orange-500/20">
                <div className="text-3xl font-black text-orange-300 mb-3">{getHeadshotPercentage(playerStats)}%</div>
                <div className="text-orange-200 text-sm font-bold">HEADSHOT %</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-500/30 to-amber-500/30 rounded-2xl p-8 text-center border border-yellow-400/50 shadow-xl shadow-yellow-500/20">
                <div className="text-3xl font-black text-yellow-300 mb-3">{getADR(playerStats)}</div>
                <div className="text-yellow-200 text-sm font-bold">ADR</div>
              </div>
            </div>
          </div>

          {/* Teams Table - Modern and Futuristic */}
          {(team1Players.length > 0 || team2Players.length > 0) && (
            <div className="space-y-8">
              <h3 className="text-3xl font-black text-white flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                BATTLEFIELD OVERVIEW
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Team 1 */}
                {team1Players.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-3xl p-6 border border-blue-400/30 shadow-2xl shadow-blue-500/10">
                    <h4 className="text-2xl font-black text-blue-300 mb-6 flex items-center gap-3">
                      <Shield className="w-6 h-6" />
                      {team1Players[0]?.teamName || 'TEAM ALPHA'}
                    </h4>
                    
                    <Table>
                      <TableHeader>
                        <TableRow className="border-blue-400/20 hover:bg-blue-900/20">
                          <TableHead className="text-blue-300 font-bold">PLAYER</TableHead>
                          <TableHead className="text-blue-300 font-bold text-center">K/D/A</TableHead>
                          <TableHead className="text-blue-300 font-bold text-center">K/D</TableHead>
                          <TableHead className="text-blue-300 font-bold text-center">HS%</TableHead>
                          <TableHead className="text-blue-300 font-bold text-center">ADR</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {team1Players.map((playerData, index) => {
                          const playerKda = getKDA(playerData.stats);
                          return (
                            <TableRow 
                              key={index} 
                              className={`border-blue-400/10 hover:bg-blue-900/20 transition-all duration-300 ${
                                playerData.isCurrentPlayer ? 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-orange-400/50' : ''
                              }`}
                            >
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  {playerData.isCurrentPlayer && <Star className="w-4 h-4 text-orange-400 fill-orange-400" />}
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                                    playerData.isCurrentPlayer 
                                      ? 'bg-gradient-to-br from-orange-500 to-yellow-500 text-black' 
                                      : 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white'
                                  }`}>
                                    {playerData.nickname.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <span className={`font-bold text-sm ${
                                      playerData.isCurrentPlayer ? 'text-orange-300' : 'text-blue-200'
                                    }`}>
                                      {playerData.nickname}
                                    </span>
                                    <div className="text-xs text-gray-400">LVL {playerData.skill_level || '-'}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1 text-xs">
                                  <span className="text-green-400 font-bold">{playerKda.kills}</span>
                                  <span className="text-gray-500">/</span>
                                  <span className="text-red-400 font-bold">{playerKda.deaths}</span>
                                  <span className="text-gray-500">/</span>
                                  <span className="text-blue-400 font-bold">{playerKda.assists}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-blue-300 font-bold text-sm">
                                {getKDRatio(playerData.stats)}
                              </TableCell>
                              <TableCell className="text-center text-orange-300 font-bold text-sm">
                                {getHeadshotPercentage(playerData.stats)}%
                              </TableCell>
                              <TableCell className="text-center text-yellow-300 font-bold text-sm">
                                {getADR(playerData.stats)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                {/* Team 2 */}
                {team2Players.length > 0 && (
                  <div className="bg-gradient-to-br from-red-900/30 to-pink-900/30 rounded-3xl p-6 border border-red-400/30 shadow-2xl shadow-red-500/10">
                    <h4 className="text-2xl font-black text-red-300 mb-6 flex items-center gap-3">
                      <Flame className="w-6 h-6" />
                      {team2Players[0]?.teamName || 'TEAM BRAVO'}
                    </h4>
                    
                    <Table>
                      <TableHeader>
                        <TableRow className="border-red-400/20 hover:bg-red-900/20">
                          <TableHead className="text-red-300 font-bold">PLAYER</TableHead>
                          <TableHead className="text-red-300 font-bold text-center">K/D/A</TableHead>
                          <TableHead className="text-red-300 font-bold text-center">K/D</TableHead>
                          <TableHead className="text-red-300 font-bold text-center">HS%</TableHead>
                          <TableHead className="text-red-300 font-bold text-center">ADR</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {team2Players.map((playerData, index) => {
                          const playerKda = getKDA(playerData.stats);
                          return (
                            <TableRow 
                              key={index} 
                              className={`border-red-400/10 hover:bg-red-900/20 transition-all duration-300 ${
                                playerData.isCurrentPlayer ? 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border-orange-400/50' : ''
                              }`}
                            >
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  {playerData.isCurrentPlayer && <Star className="w-4 h-4 text-orange-400 fill-orange-400" />}
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                                    playerData.isCurrentPlayer 
                                      ? 'bg-gradient-to-br from-orange-500 to-yellow-500 text-black' 
                                      : 'bg-gradient-to-br from-red-600 to-pink-600 text-white'
                                  }`}>
                                    {playerData.nickname.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <span className={`font-bold text-sm ${
                                      playerData.isCurrentPlayer ? 'text-orange-300' : 'text-red-200'
                                    }`}>
                                      {playerData.nickname}
                                    </span>
                                    <div className="text-xs text-gray-400">LVL {playerData.skill_level || '-'}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1 text-xs">
                                  <span className="text-green-400 font-bold">{playerKda.kills}</span>
                                  <span className="text-gray-500">/</span>
                                  <span className="text-red-400 font-bold">{playerKda.deaths}</span>
                                  <span className="text-gray-500">/</span>
                                  <span className="text-blue-400 font-bold">{playerKda.assists}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-red-300 font-bold text-sm">
                                {getKDRatio(playerData.stats)}
                              </TableCell>
                              <TableCell className="text-center text-orange-300 font-bold text-sm">
                                {getHeadshotPercentage(playerData.stats)}%
                              </TableCell>
                              <TableCell className="text-center text-yellow-300 font-bold text-sm">
                                {getADR(playerData.stats)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
