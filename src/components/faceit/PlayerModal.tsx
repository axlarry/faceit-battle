
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Player, Match } from "@/types/Player";
import { UserPlus, UserMinus, ExternalLink, Trophy, Calendar, Users, Target, TrendingUp, TrendingDown, Minus, MapPin, Clock, Shield, Zap, Crosshair } from "lucide-react";
import { useState, useEffect } from "react";
import { PasswordDialog } from "./PasswordDialog";
import { toast } from "@/hooks/use-toast";
import { useFaceitApi } from "@/hooks/useFaceitApi";

interface PlayerModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onAddFriend: (player: Player) => void;
  onRemoveFriend: (playerId: string) => void;
  isFriend: boolean;
}

export const PlayerModal = ({ 
  player, 
  isOpen, 
  onClose, 
  onAddFriend, 
  onRemoveFriend, 
  isFriend 
}: PlayerModalProps) => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'add' | 'remove' | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchesDetails, setMatchesDetails] = useState<{[key: string]: any}>({});
  const { getPlayerMatches, getMatchDetails } = useFaceitApi();

  // Load matches when player changes and modal is open
  useEffect(() => {
    if (player && isOpen) {
      loadPlayerMatches();
    }
  }, [player, isOpen]);

  const loadPlayerMatches = async () => {
    if (!player) return;
    
    setLoadingMatches(true);
    
    try {
      console.log('Loading matches for player:', player.player_id);
      
      const matchesData = await getPlayerMatches(player.player_id, 10);
      setMatches(matchesData);

      // Load detailed stats for each match
      if (matchesData.length > 0) {
        const detailsPromises = matchesData.map(async (match: Match) => {
          try {
            console.log('Loading details for match:', match.match_id);
            const matchDetail = await getMatchDetails(match.match_id);
            if (matchDetail) {
              console.log('Match detail response:', matchDetail);
              return { [match.match_id]: matchDetail };
            }
          } catch (error) {
            console.error('Error loading match details:', error);
          }
          return {};
        });

        const detailsResults = await Promise.all(detailsPromises);
        const combinedDetails = detailsResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        console.log('Combined match details:', combinedDetails);
        setMatchesDetails(combinedDetails);
      }

    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoadingMatches(false);
    }
  };

  if (!player) return null;

  const getLevelColor = (level: number) => {
    if (level >= 9) return 'from-red-500 to-red-600';
    if (level >= 7) return 'from-purple-500 to-purple-600';
    if (level >= 5) return 'from-blue-500 to-blue-600';
    if (level >= 3) return 'from-green-500 to-green-600';
    return 'from-gray-500 to-gray-600';
  };

  const handleFriendAction = () => {
    if (isFriend) {
      setPendingAction('remove');
    } else {
      setPendingAction('add');
    }
    setShowPasswordDialog(true);
  };

  const confirmAction = () => {
    if (pendingAction === 'add') {
      onAddFriend(player);
    } else if (pendingAction === 'remove') {
      onRemoveFriend(player.player_id);
    }
    setPendingAction(null);
    onClose();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('ro-RO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMatchResult = (match: Match) => {
    if (!match.teams || !match.results) return 'N/A';
    
    const teamIds = Object.keys(match.teams);
    const winnerTeamId = match.results.winner;
    
    // Find which team the player is on
    let playerTeamId = '';
    for (const teamId of teamIds) {
      const team = match.teams[teamId];
      if (team.players?.some(p => p.player_id === player.player_id)) {
        playerTeamId = teamId;
        break;
      }
    }
    
    return playerTeamId === winnerTeamId;
  };

  const getPlayerStats = (match: Match) => {
    if (!match.teams) return null;
    
    for (const teamId of Object.keys(match.teams)) {
      const team = match.teams[teamId];
      const playerData = team.players?.find(p => p.player_id === player.player_id);
      if (playerData) {
        return playerData.player_stats;
      }
    }
    return null;
  };

  const getEloChange = (match: Match) => {
    const matchDetail = matchesDetails[match.match_id];
    if (!matchDetail) return null;
    
    // Check if calculate_elo exists and is an array
    if (matchDetail.calculate_elo && Array.isArray(matchDetail.calculate_elo)) {
      const playerEloData = matchDetail.calculate_elo.find((elo: any) => elo.player_id === player.player_id);
      if (playerEloData) {
        return playerEloData;
      }
    }
    
    return null;
  };

  const getMatchScore = (match: Match) => {
    if (match.results && match.results.score) {
      const scores = Object.values(match.results.score);
      if (scores.length === 2) {
        const numericScores = scores.map(score => Number(score)).filter(score => !isNaN(score));
        if (numericScores.length === 2) {
          const [score1, score2] = numericScores;
          return `${Math.max(score1, score2)} - ${Math.min(score1, score2)}`;
        }
      }
    }
    return null;
  };

  const getMapInfo = (match: Match) => {
    const matchDetail = matchesDetails[match.match_id];
    if (!matchDetail) return 'Unknown';
    
    if (matchDetail.voting?.map?.pick?.[0]) {
      return matchDetail.voting.map.pick[0];
    } else if (matchDetail.voting?.location?.pick?.[0]) {
      return matchDetail.voting.location.pick[0];
    }
    
    return 'Unknown';
  };

  const formatMatchDuration = (startTime: number, endTime: number) => {
    const duration = endTime - startTime;
    const minutes = Math.floor(duration / 60);
    return `${minutes}m`;
  };

  const getKDRatio = (stats: any) => {
    if (stats.Kills && stats.Deaths) {
      const kills = parseInt(stats.Kills);
      const deaths = parseInt(stats.Deaths);
      return deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString();
    }
    return stats['K/D Ratio'] || '0.00';
  };

  const getADR = (stats: any) => {
    return stats.ADR || stats['Average Damage'] || '0';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 text-white max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Profil Jucător - Detalii Complete
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-center">
              Informații detaliate despre jucător și istoricul meciurilor recente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Player Header */}
            <div className="text-center space-y-4">
              <img
                src={player.avatar}
                alt={player.nickname}
                className="w-20 h-20 rounded-full border-4 border-orange-400 mx-auto"
              />
              <div>
                <h2 className="text-2xl font-bold text-white">{player.nickname}</h2>
                {player.position && (
                  <p className="text-orange-400 font-medium">#{player.position} în clasament</p>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-400">{player.level}</div>
                <div className="text-gray-400 text-sm">Nivel</div>
                <Badge className={`mt-2 bg-gradient-to-r ${getLevelColor(player.level || 0)} text-white border-0 text-xs`}>
                  Skill Level {player.level}
                </Badge>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{player.elo}</div>
                <div className="text-gray-400 text-sm">ELO Points</div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-lg p-2 text-center border border-green-500/30">
                <div className="text-lg font-bold text-green-400">{player.wins}</div>
                <div className="text-gray-400 text-xs">Victorii</div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-lg p-2 text-center border border-blue-500/30">
                <div className="text-lg font-bold text-blue-400">{player.winRate}%</div>
                <div className="text-gray-400 text-xs">Win Rate</div>
              </div>
              
              <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-lg p-2 text-center border border-red-500/30">
                <div className="text-lg font-bold text-red-400">{player.hsRate}%</div>
                <div className="text-gray-400 text-xs">Headshot %</div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-lg p-2 text-center border border-purple-500/30">
                <div className="text-lg font-bold text-purple-400">{player.kdRatio}</div>
                <div className="text-gray-400 text-xs">K/D Ratio</div>
              </div>
            </div>

            {/* Recent Matches Section with Table */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-bold text-white">Meciurile Recente (Ultimele 10)</h3>
              </div>
              
              {loadingMatches ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto"></div>
                  <div className="text-gray-400 mt-3">Se încarcă meciurile...</div>
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400">Nu s-au găsit meciuri recente</div>
                </div>
              ) : (
                <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-white/5">
                        <TableHead className="text-gray-300 font-semibold">Rezultat</TableHead>
                        <TableHead className="text-gray-300 font-semibold">Hartă</TableHead>
                        <TableHead className="text-gray-300 font-semibold">Scor</TableHead>
                        <TableHead className="text-gray-300 font-semibold">K/D/A</TableHead>
                        <TableHead className="text-gray-300 font-semibold">K/D</TableHead>
                        <TableHead className="text-gray-300 font-semibold">HS%</TableHead>
                        <TableHead className="text-gray-300 font-semibold">ADR</TableHead>
                        <TableHead className="text-gray-300 font-semibold">ELO</TableHead>
                        <TableHead className="text-gray-300 font-semibold">Data</TableHead>
                        <TableHead className="text-gray-300 font-semibold">Durată</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matches.map((match) => {
                        const isWin = getMatchResult(match);
                        const playerStats = getPlayerStats(match);
                        const eloChange = getEloChange(match);
                        const mapName = getMapInfo(match);
                        const matchScore = getMatchScore(match);
                        
                        return (
                          <TableRow 
                            key={match.match_id}
                            className={`border-white/10 hover:bg-white/5 transition-colors ${
                              isWin ? 'bg-green-500/5' : 'bg-red-500/5'
                            }`}
                          >
                            {/* Result */}
                            <TableCell>
                              <Badge className={`${
                                isWin 
                                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                  : 'bg-red-500/20 text-red-400 border-red-500/30'
                              } border font-semibold`}>
                                {isWin ? 'W' : 'L'}
                              </Badge>
                            </TableCell>

                            {/* Map */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-orange-400" />
                                <span className="text-white font-medium">{mapName}</span>
                              </div>
                            </TableCell>

                            {/* Score */}
                            <TableCell>
                              <span className="text-white font-bold">
                                {matchScore || '-'}
                              </span>
                            </TableCell>

                            {/* K/D/A */}
                            <TableCell>
                              {playerStats ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-green-400 font-bold">{playerStats.Kills || '0'}</span>
                                  <span className="text-gray-400">/</span>
                                  <span className="text-red-400 font-bold">{playerStats.Deaths || '0'}</span>
                                  <span className="text-gray-400">/</span>
                                  <span className="text-blue-400 font-bold">{playerStats.Assists || '0'}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>

                            {/* K/D Ratio */}
                            <TableCell>
                              {playerStats ? (
                                <div className="flex items-center gap-1">
                                  <Target className="w-3 h-3 text-blue-400" />
                                  <span className="text-blue-400 font-bold">
                                    {getKDRatio(playerStats)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>

                            {/* Headshot % */}
                            <TableCell>
                              {playerStats && playerStats['Headshots %'] ? (
                                <div className="flex items-center gap-1">
                                  <Crosshair className="w-3 h-3 text-red-400" />
                                  <span className="text-red-400 font-bold">
                                    {Math.round(parseFloat(playerStats['Headshots %']))}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>

                            {/* ADR */}
                            <TableCell>
                              {playerStats ? (
                                <div className="flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-yellow-400" />
                                  <span className="text-yellow-400 font-bold">
                                    {getADR(playerStats)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>

                            {/* ELO Change */}
                            <TableCell>
                              {eloChange ? (
                                <div className="flex items-center gap-1">
                                  {eloChange.elo_change > 0 ? (
                                    <TrendingUp className="w-4 h-4 text-green-400" />
                                  ) : eloChange.elo_change < 0 ? (
                                    <TrendingDown className="w-4 h-4 text-red-400" />
                                  ) : (
                                    <Minus className="w-4 h-4 text-gray-400" />
                                  )}
                                  <span className={`font-bold ${
                                    eloChange.elo_change > 0 ? 'text-green-400' : 
                                    eloChange.elo_change < 0 ? 'text-red-400' : 'text-gray-400'
                                  }`}>
                                    {eloChange.elo_change > 0 ? '+' : ''}{eloChange.elo_change}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>

                            {/* Date */}
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <span className="text-gray-300 text-sm">
                                  {formatDate(match.started_at)}
                                </span>
                              </div>
                            </TableCell>

                            {/* Duration */}
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <span className="text-gray-300 text-sm">
                                  {formatMatchDuration(match.started_at, match.finished_at)}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleFriendAction}
                className={`px-4 py-2 font-medium text-sm ${
                  isFriend
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                } text-white border-0`}
              >
                {isFriend ? (
                  <>
                    <UserMinus size={14} className="mr-2" />
                    Șterge din Prieteni
                  </>
                ) : (
                  <>
                    <UserPlus size={14} className="mr-2" />
                    Adaugă la Prieteni
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white px-4 py-2 text-sm"
                onClick={() => window.open(`https://www.faceit.com/en/players/${player.nickname}`, '_blank')}
              >
                <ExternalLink size={14} className="mr-2" />
                Vezi pe FACEIT
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => {
          setShowPasswordDialog(false);
          setPendingAction(null);
        }}
        onConfirm={confirmAction}
        title={pendingAction === 'add' ? 'Adaugă Prieten' : 'Șterge Prieten'}
        description={
          pendingAction === 'add' 
            ? `Vrei să adaugi ${player.nickname} în lista de prieteni?`
            : `Vrei să ștergi ${player.nickname} din lista de prieteni?`
        }
      />
    </>
  );
};
