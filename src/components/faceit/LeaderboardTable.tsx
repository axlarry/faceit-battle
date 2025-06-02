import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Player } from "@/types/Player";
import { toast } from "@/hooks/use-toast";
import { PasswordDialog } from "./PasswordDialog";

interface LeaderboardTableProps {
  region: string;
  onShowPlayerDetails: (player: Player) => void;
  onAddFriend: (player: Player) => void;
}

// Setează aici propriul tău API key FACEIT
const API_KEY = 'c2755709-8b70-4f89-934f-7e4a8d0b7a29'; // Înlocuiește cu propriul tău API key
const API_BASE = 'https://open.faceit.com/data/v4';

export const LeaderboardTable = ({ region, onShowPlayerDetails, onAddFriend }: LeaderboardTableProps) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingPlayer, setPendingPlayer] = useState<Player | null>(null);
  const limit = 20;

  useEffect(() => {
    setPlayers([]);
    setOffset(0);
    loadPlayers(0, true);
  }, [region]);

  const loadPlayers = async (currentOffset: number, reset = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/rankings/games/cs2/regions/${region}?offset=${currentOffset}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Eroare API: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.items.length === 0) {
        toast({
          title: "Nu există mai mulți jucători",
          description: "S-au încărcat toți jucătorii disponibili.",
        });
        return;
      }

      // Get detailed player info
      const playersWithDetails = await Promise.all(
        data.items.map(async (item: any) => {
          try {
            const playerResponse = await fetch(`${API_BASE}/players/${item.player_id}`, {
              headers: { 'Authorization': `Bearer ${API_KEY}` }
            });
            const playerData = await playerResponse.json();
            
            const statsResponse = await fetch(`${API_BASE}/players/${item.player_id}/stats/cs2`, {
              headers: { 'Authorization': `Bearer ${API_KEY}` }
            });
            const statsData = await statsResponse.json();

            return {
              player_id: item.player_id,
              nickname: item.nickname,
              avatar: playerData.avatar || '/placeholder.svg',
              position: item.position,
              level: playerData.games?.cs2?.skill_level || 0,
              elo: playerData.games?.cs2?.faceit_elo || 0,
              wins: parseInt(statsData.lifetime?.Wins) || 0,
              winRate: Math.round((parseInt(statsData.lifetime?.Wins) / parseInt(statsData.lifetime?.Matches)) * 100) || 0,
              hsRate: parseFloat(statsData.lifetime?.['Average Headshots %']) || 0,
              kdRatio: parseFloat(statsData.lifetime?.['Average K/D Ratio']) || 0,
            };
          } catch (error) {
            console.error(`Error loading player ${item.player_id}:`, error);
            return {
              player_id: item.player_id,
              nickname: item.nickname,
              avatar: '/placeholder.svg',
              position: item.position,
              level: 0,
              elo: 0,
              wins: 0,
              winRate: 0,
              hsRate: 0,
              kdRatio: 0,
            };
          }
        })
      );

      if (reset) {
        setPlayers(playersWithDetails);
      } else {
        setPlayers(prev => [...prev, ...playersWithDetails]);
      }
      
      setOffset(currentOffset + limit);

    } catch (error) {
      console.error('Error loading leaderboard:', error);
      toast({
        title: "Eroare la încărcare",
        description: "Nu s-au putut încărca datele clasamentului.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 9) return 'from-red-500 to-red-600';
    if (level >= 7) return 'from-purple-500 to-purple-600';
    if (level >= 5) return 'from-blue-500 to-blue-600';
    if (level >= 3) return 'from-green-500 to-green-600';
    return 'from-gray-500 to-gray-600';
  };

  const handleAddFriend = (player: Player) => {
    setPendingPlayer(player);
    setShowPasswordDialog(true);
  };

  const confirmAddFriend = () => {
    if (pendingPlayer) {
      onAddFriend(pendingPlayer);
      setPendingPlayer(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 backdrop-blur-lg border-white/10">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
            Clasament {region}
          </h2>
          
          <div className="space-y-3">
            {players.map((player, index) => (
              <div
                key={player.player_id}
                className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-orange-400 min-w-[3rem]">
                      #{player.position}
                    </div>
                    
                    <img
                      src={player.avatar}
                      alt={player.nickname}
                      className="w-12 h-12 rounded-full border-2 border-orange-400"
                    />
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white">{player.nickname}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`bg-gradient-to-r ${getLevelColor(player.level || 0)} text-white border-0`}>
                          Nivel {player.level}
                        </Badge>
                        <span className="text-orange-400 font-medium">{player.elo} ELO</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-white font-medium">{player.wins}</div>
                      <div className="text-gray-400">Victorii</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-medium">{player.winRate}%</div>
                      <div className="text-gray-400">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-medium">{player.hsRate}%</div>
                      <div className="text-gray-400">HS%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-medium">{player.kdRatio}</div>
                      <div className="text-gray-400">K/D</div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => onShowPlayerDetails(player)}
                        className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white"
                      >
                        Detalii
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddFriend(player)}
                        className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white"
                      >
                        Adaugă
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {players.length > 0 && (
            <div className="text-center pt-6">
              <Button
                onClick={() => loadPlayers(offset)}
                disabled={loading}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 px-8 py-3"
              >
                {loading ? 'Se încarcă...' : 'Încarcă mai mulți'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      <PasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => {
          setShowPasswordDialog(false);
          setPendingPlayer(null);
        }}
        onConfirm={confirmAddFriend}
        title="Adaugă Prieten"
        description={`Vrei să adaugi ${pendingPlayer?.nickname} în lista de prieteni?`}
      />
    </div>
  );
};
