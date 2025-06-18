import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Player } from "@/types/Player";
import { toast } from "@/hooks/use-toast";
import { PasswordDialog } from "./PasswordDialog";
import { useFaceitApi } from "@/hooks/useFaceitApi";

interface LeaderboardTableProps {
  region: string;
  onShowPlayerDetails: (player: Player) => void;
  onAddFriend: (player: Player) => void;
}

export const LeaderboardTable = ({ region, onShowPlayerDetails, onAddFriend }: LeaderboardTableProps) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingPlayer, setPendingPlayer] = useState<Player | null>(null);
  const limit = 20;
  const previousRegionRef = useRef<string>('');
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { makeApiCall } = useFaceitApi();

  useEffect(() => {
    console.log(`Region changed from ${previousRegionRef.current} to: ${region}`);
    
    // Clear any pending timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    // Clear data immediately when region changes
    setPlayers([]);
    setOffset(0);
    setLoading(false); // Reset loading state
    
    // Store current region
    previousRegionRef.current = region;
    
    // Start loading immediately with a small delay to ensure state is updated
    loadingTimeoutRef.current = setTimeout(() => {
      console.log(`Starting to load data for region: ${region}`);
      loadPlayers(0, true);
    }, 100);

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [region]);

  const loadPlayers = async (currentOffset: number, reset = false) => {
    console.log(`Loading players for region: ${region}, offset: ${currentOffset}, reset: ${reset}, loading: ${loading}`);
    
    if (loading) {
      console.log('Already loading, skipping request');
      return;
    }
    
    setLoading(true);
    
    try {
      const data = await makeApiCall(`/rankings/games/cs2/regions/${region}?offset=${currentOffset}&limit=${limit}`);
      
      if (!data || !data.items || data.items.length === 0) {
        console.log('No data or empty items array received');
        if (currentOffset === 0) {
          toast({
            title: "Nu există jucători",
            description: "Nu s-au găsit jucători pentru această regiune.",
          });
        } else {
          toast({
            title: "Nu există mai mulți jucători",
            description: "S-au încărcat toți jucătorii disponibili.",
          });
        }
        return;
      }

      console.log(`Received ${data.items.length} players for region ${region}`);

      // Get detailed player info
      const playersWithDetails = await Promise.all(
        data.items.map(async (item: any) => {
          try {
            const playerData = await makeApiCall(`/players/${item.player_id}`);
            const statsData = await makeApiCall(`/players/${item.player_id}/stats/cs2`);

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
        console.log(`Setting ${playersWithDetails.length} players (reset) for region ${region}`);
        setPlayers(playersWithDetails);
      } else {
        console.log(`Adding ${playersWithDetails.length} players to existing ${players.length} for region ${region}`);
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
    <div className="space-y-4 sm:space-y-6">
      <Card className="bg-white/5 backdrop-blur-lg border-white/10">
        <div className="p-3 sm:p-4 md:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
            <span className="truncate">Clasament {region}</span>
          </h2>
          
          {loading && players.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-white">Se încarcă clasamentul...</div>
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Nu s-au găsit jucători pentru această regiune.</div>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {players.map((player, index) => (
                <div
                  key={player.player_id}
                  className="bg-white/5 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto min-w-0">
                      <div className="text-lg sm:text-2xl font-bold text-orange-400 min-w-[2rem] sm:min-w-[3rem] flex-shrink-0">
                        #{player.position}
                      </div>
                      
                      <img
                        src={player.avatar}
                        alt={player.nickname}
                        className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-orange-400 flex-shrink-0"
                      />
                      
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-lg font-semibold text-white truncate">{player.nickname}</h3>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                          <Badge className={`bg-gradient-to-r ${getLevelColor(player.level || 0)} text-white border-0 text-xs px-1 sm:px-2 py-0.5`}>
                            Nivel {player.level}
                          </Badge>
                          <span className="text-orange-400 font-medium text-xs sm:text-sm">{player.elo} ELO</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 lg:gap-6 text-xs w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-center">
                        <div className="text-white font-medium text-xs sm:text-sm">{player.wins}</div>
                        <div className="text-gray-400 text-xs">Victorii</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-medium text-xs sm:text-sm">{player.winRate}%</div>
                        <div className="text-gray-400 text-xs">Win Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-medium text-xs sm:text-sm">{player.hsRate}%</div>
                        <div className="text-gray-400 text-xs">HS%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-medium text-xs sm:text-sm">{player.kdRatio}</div>
                        <div className="text-gray-400 text-xs">K/D</div>
                      </div>
                      
                      <div className="flex gap-1 sm:gap-2">
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => onShowPlayerDetails(player)}
                          className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white text-xs px-2 sm:px-3 h-6 sm:h-8"
                        >
                          <span className="hidden sm:inline">Detalii</span>
                          <span className="sm:hidden">Info</span>
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddFriend(player)}
                          className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white text-xs px-2 sm:px-3 h-6 sm:h-8"
                        >
                          <span className="hidden sm:inline">Adaugă</span>
                          <span className="sm:hidden">+</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {players.length > 0 && !loading && (
            <div className="text-center pt-4 sm:pt-6">
              <Button
                onClick={() => loadPlayers(offset)}
                disabled={loading}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
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
