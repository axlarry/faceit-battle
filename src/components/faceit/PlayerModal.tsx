
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Player, Match } from "@/types/Player";
import { UserPlus, UserMinus, ExternalLink, Trophy, Calendar, Users, Target, TrendingUp, TrendingDown, Minus, MapPin, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { PasswordDialog } from "./PasswordDialog";
import { toast } from "@/hooks/use-toast";

interface PlayerModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onAddFriend: (player: Player) => void;
  onRemoveFriend: (playerId: string) => void;
  isFriend: boolean;
}

const API_KEY = '5d81df9c-db61-494c-8e0a-d94c89bb7913';
const API_BASE = 'https://open.faceit.com/data/v4';

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
      const response = await fetch(
        `${API_BASE}/players/${player.player_id}/history?game=cs2&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load matches');
      }

      const data = await response.json();
      console.log('Matches response:', data);
      const matchesData = data.items || [];
      setMatches(matchesData);

      // Load detailed stats for each match
      const detailsPromises = matchesData.map(async (match: Match) => {
        try {
          console.log('Loading details for match:', match.match_id);
          const matchResponse = await fetch(
            `${API_BASE}/matches/${match.match_id}`,
            {
              headers: {
                'Authorization': `Bearer ${API_KEY}`
              }
            }
          );
          if (matchResponse.ok) {
            const matchDetail = await matchResponse.json();
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

    } catch (error) {
      console.error('Error loading matches:', error);
      toast({
        title: "Eroare la încărcarea meciurilor",
        description: "Nu s-au putut încărca meciurile jucătorului.",
        variant: "destructive",
      });
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
    
    if (playerTeamId === winnerTeamId) {
      return 'VICTORIE';
    } else {
      return 'ÎNFRÂNGERE';
    }
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

  const getTeammates = (match: Match) => {
    if (!match.teams) return [];
    
    for (const teamId of Object.keys(match.teams)) {
      const team = match.teams[teamId];
      const isPlayerInTeam = team.players?.some(p => p.player_id === player.player_id);
      if (isPlayerInTeam) {
        return team.players?.filter(p => p.player_id !== player.player_id) || [];
      }
    }
    return [];
  };

  const getEloChange = (match: Match) => {
    const matchDetail = matchesDetails[match.match_id];
    if (!matchDetail) return null;
    
    console.log('Getting ELO change for match:', match.match_id, matchDetail);
    
    // Check if calculate_elo exists and is an array
    if (matchDetail.calculate_elo && Array.isArray(matchDetail.calculate_elo)) {
      const playerEloData = matchDetail.calculate_elo.find((elo: any) => elo.player_id === player.player_id);
      return playerEloData;
    }
    
    // Alternative: check if there's ELO data in the match itself
    if (match.elo_change && match.elo_change.player_id === player.player_id) {
      return match.elo_change;
    }
    
    return null;
  };

  const getMapInfo = (match: Match) => {
    const matchDetail = matchesDetails[match.match_id];
    if (!matchDetail) return null;
    
    return {
      map: matchDetail.voting?.map?.pick?.[0] || matchDetail.voting?.location?.pick?.[0] || 'Unknown',
      score: matchDetail.results?.score || {}
    };
  };

  const formatMatchDuration = (startTime: number, endTime: number) => {
    const duration = endTime - startTime;
    const minutes = Math.floor(duration / 60);
    return `${minutes} min`;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 text-white max-w-6xl max-h-[95vh] overflow-y-auto">
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
                className="w-24 h-24 rounded-full border-4 border-orange-400 mx-auto"
              />
              <div>
                <h2 className="text-3xl font-bold text-white">{player.nickname}</h2>
                {player.position && (
                  <p className="text-orange-400 font-medium">#{player.position} în clasament</p>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-orange-400">{player.level}</div>
                <div className="text-gray-400">Nivel</div>
                <Badge className={`mt-2 bg-gradient-to-r ${getLevelColor(player.level || 0)} text-white border-0`}>
                  Skill Level {player.level}
                </Badge>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">{player.elo}</div>
                <div className="text-gray-400">ELO Points</div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-lg p-3 text-center border border-green-500/30">
                <div className="text-xl font-bold text-green-400">{player.wins}</div>
                <div className="text-gray-400 text-sm">Victorii</div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-lg p-3 text-center border border-blue-500/30">
                <div className="text-xl font-bold text-blue-400">{player.winRate}%</div>
                <div className="text-gray-400 text-sm">Win Rate</div>
              </div>
              
              <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-lg p-3 text-center border border-red-500/30">
                <div className="text-xl font-bold text-red-400">{player.hsRate}%</div>
                <div className="text-gray-400 text-sm">Headshot %</div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-lg p-3 text-center border border-purple-500/30">
                <div className="text-xl font-bold text-purple-400">{player.kdRatio}</div>
                <div className="text-gray-400 text-sm">K/D Ratio</div>
              </div>
            </div>

            {/* Recent Matches Section - Enhanced */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-orange-400" />
                <h3 className="text-xl font-bold text-white">Meciurile Recente (Ultimele 10)</h3>
              </div>
              
              {loadingMatches ? (
                <div className="text-center py-8">
                  <div className="text-gray-400">Se încarcă meciurile...</div>
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400">Nu s-au găsit meciuri recente</div>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {matches.map((match) => {
                    const result = getMatchResult(match);
                    const playerStats = getPlayerStats(match);
                    const teammates = getTeammates(match);
                    const eloChange = getEloChange(match);
                    const mapInfo = getMapInfo(match);
                    const isWin = result === 'VICTORIE';
                    
                    return (
                      <div
                        key={match.match_id}
                        className={`p-5 rounded-lg border ${
                          isWin 
                            ? 'bg-green-500/10 border-green-500/30' 
                            : 'bg-red-500/10 border-red-500/30'
                        }`}
                      >
                        <div className="space-y-4">
                          {/* Match Header */}
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                <Badge className={`${
                                  isWin ? 'bg-green-500' : 'bg-red-500'
                                } text-white border-0`}>
                                  {result}
                                </Badge>
                                <span className="text-white font-medium">{match.competition_name}</span>
                                {mapInfo?.map && (
                                  <div className="flex items-center gap-1 text-orange-400">
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-sm font-medium">{mapInfo.map}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {formatDate(match.started_at)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {formatMatchDuration(match.started_at, match.finished_at)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {match.game_mode}
                                </div>
                              </div>
                            </div>
                            
                            {/* ELO Change */}
                            {eloChange && (
                              <div className="text-center">
                                <div className={`flex items-center gap-2 text-lg font-bold ${
                                  eloChange.elo_change > 0 ? 'text-green-400' : 
                                  eloChange.elo_change < 0 ? 'text-red-400' : 'text-gray-400'
                                }`}>
                                  {eloChange.elo_change > 0 ? (
                                    <TrendingUp className="w-5 h-5" />
                                  ) : eloChange.elo_change < 0 ? (
                                    <TrendingDown className="w-5 h-5" />
                                  ) : (
                                    <Minus className="w-5 h-5" />
                                  )}
                                  {eloChange.elo_change > 0 ? '+' : ''}{eloChange.elo_change} ELO
                                </div>
                                <div className="text-gray-400 text-sm">
                                  {eloChange.elo_before} → {eloChange.elo_after}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Player Stats */}
                          {playerStats && (
                            <div className="bg-white/5 rounded-lg p-4">
                              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                Statisticile Mele
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                <div className="text-center">
                                  <div className="text-white font-bold text-lg">{playerStats.Kills || '0'}</div>
                                  <div className="text-gray-400 text-xs">Kills</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-white font-bold text-lg">{playerStats.Deaths || '0'}</div>
                                  <div className="text-gray-400 text-xs">Deaths</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-white font-bold text-lg">{playerStats.Assists || '0'}</div>
                                  <div className="text-gray-400 text-xs">Assists</div>
                                </div>
                                {playerStats['Headshots %'] && (
                                  <div className="text-center">
                                    <div className="text-white font-bold text-lg">{Math.round(parseFloat(playerStats['Headshots %']))}%</div>
                                    <div className="text-gray-400 text-xs">HS%</div>
                                  </div>
                                )}
                                {playerStats['K/D Ratio'] && (
                                  <div className="text-center">
                                    <div className="text-white font-bold text-lg">{parseFloat(playerStats['K/D Ratio']).toFixed(2)}</div>
                                    <div className="text-gray-400 text-xs">K/D</div>
                                  </div>
                                )}
                                {playerStats.MVPs && (
                                  <div className="text-center">
                                    <div className="text-white font-bold text-lg">{playerStats.MVPs}</div>
                                    <div className="text-gray-400 text-xs">MVPs</div>
                                  </div>
                                )}
                              </div>
                              
                              {playerStats.ADR && (
                                <div className="mt-3 flex justify-center gap-6">
                                  <div className="text-center">
                                    <div className="text-white font-bold">{Math.round(parseFloat(playerStats.ADR))}</div>
                                    <div className="text-gray-400 text-xs">ADR</div>
                                  </div>
                                  {playerStats.KAST && (
                                    <div className="text-center">
                                      <div className="text-white font-bold">{Math.round(parseFloat(playerStats.KAST))}%</div>
                                      <div className="text-gray-400 text-xs">KAST</div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Teammates */}
                          {teammates.length > 0 && (
                            <div className="bg-white/5 rounded-lg p-4">
                              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Coechipieri ({teammates.length})
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {teammates.map((teammate) => (
                                  <Badge 
                                    key={teammate.player_id}
                                    variant="secondary"
                                    className="bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  >
                                    {teammate.nickname}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Match Score */}
                          {mapInfo?.score && Object.keys(mapInfo.score).length > 0 && (
                            <div className="text-center">
                              <div className="text-gray-400 text-sm">Scor Final</div>
                              <div className="text-white font-bold text-lg">
                                {Object.values(mapInfo.score).join(' - ')}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleFriendAction}
                className={`px-6 py-3 font-medium ${
                  isFriend
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                } text-white border-0`}
              >
                {isFriend ? (
                  <>
                    <UserMinus size={16} className="mr-2" />
                    Șterge din Prieteni
                  </>
                ) : (
                  <>
                    <UserPlus size={16} className="mr-2" />
                    Adaugă la Prieteni
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white px-6 py-3"
                onClick={() => window.open(`https://www.faceit.com/en/players/${player.nickname}`, '_blank')}
              >
                <ExternalLink size={16} className="mr-2" />
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
