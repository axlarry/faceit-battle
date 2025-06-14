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

const API_KEY = 'f1755f40-8f84-4d62-b315-5f09dc25eef5';
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
  const [apiError, setApiError] = useState<string | null>(null);

  // Load matches when player changes and modal is open
  useEffect(() => {
    if (player && isOpen) {
      loadPlayerMatches();
    }
  }, [player, isOpen]);

  const loadPlayerMatches = async () => {
    if (!player) return;
    
    setLoadingMatches(true);
    setApiError(null);
    
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
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(`API Error: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('Matches response:', data);
      const matchesData = data.items || [];
      setMatches(matchesData);

      // Load detailed stats for each match
      if (matchesData.length > 0) {
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
      }

    } catch (error) {
      console.error('Error loading matches:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setApiError(errorMessage);
      
      toast({
        title: "Eroare la încărcarea meciurilor",
        description: `Nu s-au putut încărca meciurile: ${errorMessage}`,
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
      if (playerEloData) {
        console.log('Found ELO data:', playerEloData);
        return playerEloData;
      }
    }
    
    // Alternative: check if there's ELO data in the match itself
    if (match.elo_change && match.elo_change.player_id === player.player_id) {
      return match.elo_change;
    }
    
    // Try to find ELO data in match results
    if (matchDetail && matchDetail.results && matchDetail.results.elo_change) {
      const playerEloData = matchDetail.results.elo_change.find((elo: any) => elo.player_id === player.player_id);
      if (playerEloData) {
        console.log('Found ELO data in results:', playerEloData);
        return playerEloData;
      }
    }
    
    console.log('No ELO data found for player');
    return null;
  };

  const getMatchScore = (match: Match) => {
    const matchDetail = matchesDetails[match.match_id];
    
    console.log('Getting match score for:', match.match_id, {
      match: match,
      matchDetail: matchDetail
    });
    
    // Try to get the actual numeric scores from match results
    if (match.results && match.results.score) {
      const scores = Object.values(match.results.score);
      console.log('Match results score:', scores);
      
      // Convert to numbers and sort to show higher score first for better display
      const numericScores = scores.map(score => Number(score));
      const sortedScores = [...numericScores].sort((a, b) => b - a);
      return `${sortedScores[0]} - ${sortedScores[1]}`;
    }
    
    // Try from match detail results
    if (matchDetail && matchDetail.results && matchDetail.results.score) {
      const scores = Object.values(matchDetail.results.score);
      console.log('Match detail results score:', scores);
      
      if (scores.length === 2 && scores.every(score => typeof score === 'number' && score >= 0)) {
        const numericScores = scores.map(score => Number(score));
        const sortedScores = [...numericScores].sort((a, b) => b - a);
        return `${sortedScores[0]} - ${sortedScores[1]}`;
      }
    }
    
    // Try to get from match stats if available
    if (matchDetail && matchDetail.teams) {
      const teamIds = Object.keys(matchDetail.teams);
      if (teamIds.length === 2) {
        const team1Stats = matchDetail.teams[teamIds[0]].team_stats;
        const team2Stats = matchDetail.teams[teamIds[1]].team_stats;
        
        if (team1Stats && team2Stats && team1Stats['Final Score'] && team2Stats['Final Score']) {
          const score1 = Number(team1Stats['Final Score']);
          const score2 = Number(team2Stats['Final Score']);
          if (!isNaN(score1) && !isNaN(score2)) {
            return `${Math.max(score1, score2)} - ${Math.min(score1, score2)}`;
          }
        }
      }
    }
    
    // If we still can't get scores, try to show rounds won if available
    if (matchDetail && matchDetail.rounds && Array.isArray(matchDetail.rounds)) {
      const roundsData = matchDetail.rounds;
      const team1Rounds = roundsData.filter((round: any) => round.round_stats && round.round_stats.Winner === matchDetail.teams ? Object.keys(matchDetail.teams)[0] : null).length;
      const team2Rounds = roundsData.filter((round: any) => round.round_stats && round.round_stats.Winner === matchDetail.teams ? Object.keys(matchDetail.teams)[1] : null).length;
      
      if (team1Rounds > 0 || team2Rounds > 0) {
        return `${Math.max(team1Rounds, team2Rounds)} - ${Math.min(team1Rounds, team2Rounds)}`;
      }
    }
    
    // Last resort: show win/loss status
    const result = getMatchResult(match);
    return result;
  };

  const getMapInfo = (match: Match) => {
    const matchDetail = matchesDetails[match.match_id];
    if (!matchDetail) return null;
    
    // Try different possible locations for map info
    let mapName = 'Unknown';
    
    if (matchDetail.voting?.map?.pick?.[0]) {
      mapName = matchDetail.voting.map.pick[0];
    } else if (matchDetail.voting?.location?.pick?.[0]) {
      mapName = matchDetail.voting.location.pick[0];
    } else if (matchDetail.voting?.map?.entity_id) {
      mapName = matchDetail.voting.map.entity_id;
    }
    
    return { map: mapName };
  };

  const formatMatchDuration = (startTime: number, endTime: number) => {
    const duration = endTime - startTime;
    const minutes = Math.floor(duration / 60);
    return `${minutes} min`;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
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

            {/* Recent Matches Section - Compact Design */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-bold text-white">Meciurile Recente (Ultimele 10)</h3>
              </div>
              
              {apiError ? (
                <div className="text-center py-6">
                  <div className="text-red-400 font-medium">Eroare API: {apiError}</div>
                  <div className="text-gray-400 text-sm mt-2">
                    Nu se pot încărca meciurile în acest moment.
                  </div>
                  <Button 
                    onClick={loadPlayerMatches}
                    className="mt-3 bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2"
                  >
                    Încearcă din nou
                  </Button>
                </div>
              ) : loadingMatches ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-400 mx-auto"></div>
                  <div className="text-gray-400 mt-2 text-sm">Se încarcă meciurile...</div>
                </div>
              ) : matches.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-gray-400 text-sm">Nu s-au găsit meciuri recente</div>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {matches.map((match) => {
                    const result = getMatchResult(match);
                    const playerStats = getPlayerStats(match);
                    const teammates = getTeammates(match);
                    const eloChange = getEloChange(match);
                    const mapInfo = getMapInfo(match);
                    const matchScore = getMatchScore(match);
                    const isWin = result === 'VICTORIE';
                    
                    return (
                      <div
                        key={match.match_id}
                        className={`relative overflow-hidden rounded-lg border transition-all duration-200 ${
                          isWin 
                            ? 'bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/20 hover:border-green-400/40' 
                            : 'bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/20 hover:border-red-400/40'
                        }`}
                      >
                        <div className="p-2 space-y-2">
                          {/* Match Header - More Compact */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`text-xs font-bold px-2 py-0.5 ${
                                isWin 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-red-500 text-white'
                              } border-0`}>
                                {result}
                              </Badge>
                              <span className="text-white font-medium text-xs truncate max-w-24">{match.competition_name}</span>
                              {mapInfo?.map && (
                                <div className="flex items-center gap-1 bg-orange-500/20 border border-orange-500/30 rounded px-1 py-0.5">
                                  <MapPin className="w-3 h-3 text-orange-400" />
                                  <span className="text-orange-400 text-xs font-medium">{mapInfo.map}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* ELO Change - More Prominent */}
                            {eloChange && (
                              <div className="flex items-center gap-1 bg-white/10 border border-white/20 rounded px-2 py-1">
                                {eloChange.elo_change > 0 ? (
                                  <TrendingUp className="w-4 h-4 text-green-400" />
                                ) : eloChange.elo_change < 0 ? (
                                  <TrendingDown className="w-4 h-4 text-red-400" />
                                ) : (
                                  <Minus className="w-4 h-4 text-gray-400" />
                                )}
                                <span className={`text-sm font-bold ${
                                  eloChange.elo_change > 0 ? 'text-green-400' : 
                                  eloChange.elo_change < 0 ? 'text-red-400' : 'text-gray-400'
                                }`}>
                                  {eloChange.elo_change > 0 ? '+' : ''}{eloChange.elo_change} ELO
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Match Info Row - More Compact */}
                          <div className="flex items-center justify-between text-xs text-gray-300">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span className="text-xs">{formatDate(match.started_at)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span className="text-xs">{formatMatchDuration(match.started_at, match.finished_at)}</span>
                              </div>
                            </div>
                            
                            {/* Match Score */}
                            {matchScore && (
                              <div className="flex items-center gap-1 bg-white/10 rounded px-2 py-1">
                                <Trophy className="w-3 h-3 text-orange-400" />
                                <span className="text-white font-bold text-sm">{matchScore}</span>
                              </div>
                            )}
                          </div>

                          {/* Player Stats - More Compact Grid */}
                          {playerStats && (
                            <div className="bg-white/5 rounded p-2 border border-white/10">
                              <div className="grid grid-cols-6 gap-1">
                                <div className="text-center">
                                  <div className="text-white font-bold text-xs">{playerStats.Kills || '0'}</div>
                                  <div className="text-gray-400 text-xs">K</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-white font-bold text-xs">{playerStats.Deaths || '0'}</div>
                                  <div className="text-gray-400 text-xs">D</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-white font-bold text-xs">{playerStats.Assists || '0'}</div>
                                  <div className="text-gray-400 text-xs">A</div>
                                </div>
                                {playerStats['Headshots %'] && (
                                  <div className="text-center">
                                    <div className="text-red-400 font-bold text-xs">{Math.round(parseFloat(playerStats['Headshots %']))}%</div>
                                    <div className="text-gray-400 text-xs">HS</div>
                                  </div>
                                )}
                                {playerStats['K/D Ratio'] && (
                                  <div className="text-center">
                                    <div className="text-blue-400 font-bold text-xs">{parseFloat(playerStats['K/D Ratio']).toFixed(1)}</div>
                                    <div className="text-gray-400 text-xs">K/D</div>
                                  </div>
                                )}
                                {playerStats.MVPs && (
                                  <div className="text-center">
                                    <div className="text-yellow-400 font-bold text-xs">{playerStats.MVPs}</div>
                                    <div className="text-gray-400 text-xs">MVP</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Teammates - More Compact */}
                          {teammates.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Users className="w-3 h-3 text-blue-400" />
                              <div className="flex flex-wrap gap-1">
                                {teammates.slice(0, 3).map((teammate) => (
                                  <Badge 
                                    key={teammate.player_id}
                                    className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-1 py-0.5 text-xs"
                                  >
                                    {teammate.nickname.length > 6 ? teammate.nickname.substring(0, 6) + '...' : teammate.nickname}
                                  </Badge>
                                ))}
                                {teammates.length > 3 && (
                                  <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 px-1 py-0.5 text-xs">
                                    +{teammates.length - 3}
                                  </Badge>
                                )}
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
