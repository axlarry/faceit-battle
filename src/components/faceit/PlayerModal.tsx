
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Player, Match } from "@/types/Player";
import { UserPlus, UserMinus, ExternalLink, Trophy, Calendar, Users, Target } from "lucide-react";
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
      setMatches(data.items || []);
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Profil Jucător - Detalii Complete
            </DialogTitle>
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

            {/* Recent Matches Section */}
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
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {matches.map((match) => {
                    const result = getMatchResult(match);
                    const playerStats = getPlayerStats(match);
                    const isWin = result === 'VICTORIE';
                    
                    return (
                      <div
                        key={match.match_id}
                        className={`p-4 rounded-lg border ${
                          isWin 
                            ? 'bg-green-500/10 border-green-500/30' 
                            : 'bg-red-500/10 border-red-500/30'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <Badge className={`${
                                isWin ? 'bg-green-500' : 'bg-red-500'
                              } text-white border-0`}>
                                {result}
                              </Badge>
                              <span className="text-white font-medium">{match.competition_name}</span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(match.started_at)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {match.game_mode}
                              </div>
                            </div>
                          </div>
                          
                          {playerStats && (
                            <div className="flex gap-4 text-sm">
                              <div className="text-center">
                                <div className="text-white font-bold">{playerStats.Kills || '0'}</div>
                                <div className="text-gray-400">K</div>
                              </div>
                              <div className="text-center">
                                <div className="text-white font-bold">{playerStats.Deaths || '0'}</div>
                                <div className="text-gray-400">D</div>
                              </div>
                              <div className="text-center">
                                <div className="text-white font-bold">{playerStats.Assists || '0'}</div>
                                <div className="text-gray-400">A</div>
                              </div>
                              {playerStats['Headshots %'] && (
                                <div className="text-center">
                                  <div className="text-white font-bold">{Math.round(parseFloat(playerStats['Headshots %']))}%</div>
                                  <div className="text-gray-400">HS</div>
                                </div>
                              )}
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
