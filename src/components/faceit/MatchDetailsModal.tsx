
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Player, Match } from "@/types/Player";
import { Trophy, Calendar, MapPin, Clock, Users, Target, Crosshair, Zap, TrendingUp, Globe, Flag } from "lucide-react";
import { 
  formatDate, 
  formatMatchDuration, 
  getMatchResult, 
  getMatchScore, 
  getMapInfo 
} from "@/utils/matchUtils";
import { getPlayerStatsFromMatch, getKDA } from "@/utils/playerDataUtils";
import { getKDRatio, getHeadshotPercentage, getADR } from "@/utils/statsUtils";
import { useLcryptApi } from "@/hooks/useLcryptApi";
import { useState, useEffect } from "react";

interface MatchDetailsModalProps {
  match: Match | null;
  player: Player;
  matchesStats: {[key: string]: any};
  isOpen: boolean;
  onClose: () => void;
}

interface PlayerEloData {
  [nickname: string]: {
    elo: number;
    level: string;
    region_ranking: number | null;
    country_ranking: number | null;
    country_flag: string;
  } | null;
}

export const MatchDetailsModal = ({ match, player, matchesStats, isOpen, onClose }: MatchDetailsModalProps) => {
  const [playersEloData, setPlayersEloData] = useState<PlayerEloData>({});
  const [loadingEloData, setLoadingEloData] = useState(false);
  const { getPlayerEloData } = useLcryptApi();

  useEffect(() => {
    if (match && isOpen) {
      loadAllPlayersEloData();
    }
  }, [match, isOpen]);

  const loadAllPlayersEloData = async () => {
    if (!match) return;
    
    setLoadingEloData(true);
    const matchData = matchesStats[match.match_id];
    if (!matchData || !matchData.rounds || !matchData.rounds[0] || !matchData.rounds[0].teams) {
      setLoadingEloData(false);
      return;
    }

    const allPlayers: string[] = [];
    Object.values(matchData.rounds[0].teams).forEach((team: any) => {
      if (team.players) {
        Object.values(team.players).forEach((p: any) => {
          if (p.nickname) {
            allPlayers.push(p.nickname);
          }
        });
      }
    });

    const eloDataPromises = allPlayers.map(async (nickname) => {
      const data = await getPlayerEloData(nickname);
      return { nickname, data };
    });

    try {
      const results = await Promise.all(eloDataPromises);
      const eloDataMap: PlayerEloData = {};
      results.forEach(({ nickname, data }) => {
        eloDataMap[nickname] = data;
      });
      setPlayersEloData(eloDataMap);
    } catch (error) {
      console.error('Error loading ELO data for players:', error);
    } finally {
      setLoadingEloData(false);
    }
  };

  if (!match) return null;

  const isWin = getMatchResult(match, player);
  const mapName = getMapInfo(match, matchesStats);
  const matchScore = getMatchScore(match, matchesStats, player);
  const matchData = matchesStats[match.match_id];

  const formatRanking = (ranking: number | null) => {
    if (!ranking) return 'N/A';
    if (ranking >= 1000000) return `${Math.floor(ranking / 1000000)}M+`;
    if (ranking >= 1000) return `${Math.floor(ranking / 1000)}K+`;
    return `#${ranking}`;
  };

  const getLevelColor = (level: number | string) => {
    const lvl = typeof level === 'string' ? parseInt(level) : level;
    if (lvl >= 9) return 'from-red-500 to-red-600';
    if (lvl >= 7) return 'from-purple-500 to-purple-600';
    if (lvl >= 5) return 'from-blue-500 to-blue-600';
    if (lvl >= 3) return 'from-green-500 to-green-600';
    return 'from-gray-500 to-gray-600';
  };

  const renderTeamPlayers = (teamData: any, teamName: string, isWinningTeam: boolean) => {
    if (!teamData || !teamData.players) {
      return (
        <div className="text-center text-gray-400 text-sm py-4">
          Nu s-au găsit jucători pentru {teamName}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className={`text-center text-sm font-bold mb-3 ${isWinningTeam ? 'text-green-400' : 'text-red-400'}`}>
          {teamName} {isWinningTeam ? '(CÂȘTIGĂTORI)' : '(ÎNVINȘI)'}
        </div>
        <div className="space-y-1">
          {Object.values(teamData.players).map((p: any, index: number) => {
            const playerStats = p.player_stats || {};
            const kda = getKDA({ player_stats: playerStats });
            const eloData = playersEloData[p.nickname];
            
            return (
              <div key={index} className="bg-white/5 rounded-lg p-2 border border-white/10">
                <div className="flex items-center justify-between">
                  {/* Player Name & Country */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="text-white font-medium text-sm truncate">
                      {p.nickname}
                    </div>
                    {eloData?.country_flag && (
                      <span className="text-xs">{eloData.country_flag}</span>
                    )}
                  </div>

                  {/* ELO & Level */}
                  <div className="flex items-center gap-2">
                    {loadingEloData ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-orange-400"></div>
                    ) : eloData ? (
                      <>
                        <Badge className={`bg-gradient-to-r ${getLevelColor(eloData.level)} text-white border-0 text-xs px-1 py-0`}>
                          {eloData.level}
                        </Badge>
                        <span className="text-orange-400 font-bold text-xs">{eloData.elo}</span>
                      </>
                    ) : (
                      <span className="text-gray-400 text-xs">N/A</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 mt-2 text-xs">
                  {/* K/D/A */}
                  <div className="text-center">
                    <div className="text-gray-400 mb-1">K/D/A</div>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-green-400 font-bold">{kda.kills}</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-red-400 font-bold">{kda.deaths}</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-blue-400 font-bold">{kda.assists}</span>
                    </div>
                  </div>

                  {/* K/D Ratio */}
                  <div className="text-center">
                    <div className="text-gray-400 mb-1">K/D</div>
                    <div className="text-blue-400 font-bold">
                      {getKDRatio({ player_stats: playerStats })}
                    </div>
                  </div>

                  {/* HS% */}
                  <div className="text-center">
                    <div className="text-gray-400 mb-1">HS%</div>
                    <div className="text-red-400 font-bold">
                      {getHeadshotPercentage({ player_stats: playerStats })}%
                    </div>
                  </div>

                  {/* ADR */}
                  <div className="text-center">
                    <div className="text-gray-400 mb-1">ADR</div>
                    <div className="text-yellow-400 font-bold">
                      {getADR({ player_stats: playerStats })}
                    </div>
                  </div>

                  {/* Global Rank */}
                  <div className="text-center">
                    <div className="text-gray-400 mb-1">Global</div>
                    {loadingEloData ? (
                      <div className="animate-spin rounded-full h-2 w-2 border-b border-blue-400 mx-auto"></div>
                    ) : (
                      <div className="text-blue-400 font-bold text-xs">
                        {formatRanking(eloData?.region_ranking)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-cyan-500/30 text-white max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="border-b border-cyan-500/20 pb-4">
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            🎮 DETALII MECI COMPLETE 🎮
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Match Info Header */}
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-4 border border-cyan-500/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-gray-400">Hartă</div>
                  <div className="text-white font-bold">{mapName}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-orange-400" />
                <div>
                  <div className="text-gray-400">Rezultat</div>
                  <div className={`font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                    {matchScore} {isWin ? '(W)' : '(L)'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="text-gray-400">Data</div>
                  <div className="text-white font-bold">{formatDate(match.started_at)}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-400" />
                <div>
                  <div className="text-gray-400">Durată</div>
                  <div className="text-white font-bold">{formatMatchDuration(match.started_at, match.finished_at)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Teams Display */}
          {matchData && matchData.rounds && matchData.rounds[0] && matchData.rounds[0].teams ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Object.entries(matchData.rounds[0].teams).map(([teamId, teamData]: [string, any], index) => {
                const isWinningTeam = match.results.winner === teamId;
                return (
                  <div key={teamId} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    {renderTeamPlayers(teamData, `Echipa ${index + 1}`, isWinningTeam)}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <div>Nu s-au putut încărca detaliile jucătorilor pentru acest meci</div>
              <div className="text-sm mt-2">Datele match-ului nu sunt disponibile</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
