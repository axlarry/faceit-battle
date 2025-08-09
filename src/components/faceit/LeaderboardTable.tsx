
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Player } from "@/types/Player";
import { toast } from "@/hooks/use-toast";
import { PasswordDialog } from "./PasswordDialog";
import { useFaceitApi } from "@/hooks/useFaceitApi";
import { LeaderboardHeader } from "./LeaderboardHeader";
import { PlayerCard } from "./PlayerCard";
import { LoadMoreButton } from "./LoadMoreButton";
import { EmptyLeaderboardState } from "./EmptyLeaderboardState";

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
  
  const { getLeaderboard, makeApiCall } = useFaceitApi();

  useEffect(() => {
    console.log(`Region changed from ${previousRegionRef.current} to: ${region}`);
    
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    setPlayers([]);
    setOffset(0);
    setLoading(false);
    
    previousRegionRef.current = region;
    
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
    console.log(`Loading players for region: ${region}, offset: ${currentOffset}, reset: ${reset}`);
    
    if (loading) {
      console.log('Already loading, skipping request');
      return;
    }
    
    setLoading(true);
    
    try {
      // Folosim noua metodă getLeaderboard care folosește API-ul pentru clasament
      const data = await makeApiCall(`/rankings/games/cs2/regions/${region}?offset=${currentOffset}&limit=${limit}`, true);
      
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

      const playersWithDetails = await Promise.all(
        data.items.map(async (item: any) => {
          try {
            // Pentru detaliile jucătorului folosim API-ul pentru prieteni/tool
            const playerData = await makeApiCall(`/players/${item.player_id}`, false);
            const statsData = await makeApiCall(`/players/${item.player_id}/stats/cs2`, false);

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
      <Card className="glass-card border">
        <div className="p-3 sm:p-4 md:p-6">
          <LeaderboardHeader region={region} />
          
          {loading && players.length === 0 ? (
            <EmptyLeaderboardState loading={loading} />
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {players.map((player) => (
                <PlayerCard
                  key={player.player_id}
                  player={player}
                  onShowPlayerDetails={onShowPlayerDetails}
                  onAddFriend={handleAddFriend}
                />
              ))}
            </div>
          )}

          {players.length > 0 && !loading && (
            <LoadMoreButton
              loading={loading}
              onLoadMore={() => loadPlayers(offset)}
            />
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
