
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users, Target, RefreshCw, Search } from "lucide-react";
import { Player } from "@/types/Player";
import { useFaceitApi } from "@/hooks/useFaceitApi";

interface FriendsSectionProps {
  friends: Player[];
  onAddFriend: (player: Player) => void;
  onUpdateFriend: (updatedPlayer: Player) => void;
  onRemoveFriend: (playerId: string) => void;
  onShowPlayerDetails: (player: Player) => void;
  onReloadFriends: () => void;
}

export const FriendsSection = ({
  friends,
  onAddFriend,
  onUpdateFriend,
  onRemoveFriend,
  onShowPlayerDetails,
  onReloadFriends
}: FriendsSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { searchPlayer, getPlayerStats, loading: apiLoading } = useFaceitApi();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await searchPlayer(searchQuery.trim());
      
      // Get detailed stats for each player
      const detailedResults = await Promise.all(
        results.slice(0, 5).map(async (player: any) => {
          try {
            const stats = await getPlayerStats(player.player_id);
            const playerStats = stats?.segments?.[0]?.stats || {};
            
            return {
              player_id: player.player_id,
              nickname: player.nickname,
              avatar: player.avatar || '/placeholder.svg',
              level: player.skill_level,
              elo: player.faceit_elo,
              wins: parseInt(playerStats.Wins?.value || '0'),
              winRate: parseFloat(playerStats['Win Rate %']?.value || '0'),
              hsRate: parseFloat(playerStats['Headshots %']?.value || '0'),
              kdRatio: parseFloat(playerStats['K/D Ratio']?.value || '0')
            };
          } catch (error) {
            console.error('Error fetching player stats:', error);
            return {
              player_id: player.player_id,
              nickname: player.nickname,
              avatar: player.avatar || '/placeholder.svg',
              level: player.skill_level,
              elo: player.faceit_elo,
              wins: 0,
              winRate: 0,
              hsRate: 0,
              kdRatio: 0
            };
          }
        })
      );
      
      setSearchResults(detailedResults);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleRefreshStats = async () => {
    setRefreshing(true);
    try {
      for (const friend of friends) {
        try {
          const stats = await getPlayerStats(friend.player_id);
          const playerStats = stats?.segments?.[0]?.stats || {};
          
          const updatedPlayer: Player = {
            ...friend,
            wins: parseInt(playerStats.Wins?.value || '0'),
            winRate: parseFloat(playerStats['Win Rate %']?.value || '0'),
            hsRate: parseFloat(playerStats['Headshots %']?.value || '0'),
            kdRatio: parseFloat(playerStats['K/D Ratio']?.value || '0')
          };
          
          onUpdateFriend(updatedPlayer);
        } catch (error) {
          console.error(`Error updating stats for ${friend.nickname}:`, error);
        }
      }
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 9) return 'from-red-500 to-red-600';
    if (level >= 7) return 'from-purple-500 to-purple-600';
    if (level >= 5) return 'from-blue-500 to-blue-600';
    if (level >= 3) return 'from-green-500 to-green-600';
    return 'from-gray-500 to-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Add Friend Section */}
      <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-orange-400" />
          Adaugă Prieten Nou
        </h2>
        
        <div className="flex gap-3 mb-4">
          <Input
            placeholder="Caută jucător după nickname..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="bg-white/10 border-white/20 text-white placeholder-gray-400 flex-1"
            disabled={apiLoading || searching}
          />
          <Button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || apiLoading || searching}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
          >
            {searching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Search size={16} className="mr-2" />
                Caută
              </>
            )}
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Rezultate căutare:</h3>
            {searchResults.map((player) => (
              <div
                key={player.player_id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={player.avatar}
                    alt={player.nickname}
                    className="w-10 h-10 rounded-full border-2 border-orange-400"
                  />
                  <div>
                    <div className="text-white font-medium">{player.nickname}</div>
                    <div className="flex items-center gap-2">
                      <Badge className={`bg-gradient-to-r ${getLevelColor(player.level || 0)} text-white border-0 text-xs`}>
                        Level {player.level}
                      </Badge>
                      <span className="text-blue-400 text-sm">{player.elo} ELO</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      onAddFriend(player);
                      setSearchResults([]);
                      setSearchQuery("");
                    }}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                  >
                    <UserPlus size={14} className="mr-1" />
                    Adaugă
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onShowPlayerDetails(player)}
                    className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white"
                  >
                    <Target size={14} className="mr-1" />
                    Detalii
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Friends List - Original Design Restored */}
      <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-orange-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Lista Prieteni ({friends.length})
              </h2>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleRefreshStats}
                disabled={refreshing || friends.length === 0}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                size="sm"
              >
                {refreshing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <RefreshCw size={16} className="mr-2" />
                )}
                Actualizează Stats
              </Button>
              
              <Button
                onClick={onReloadFriends}
                variant="outline"
                className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white"
                size="sm"
              >
                <RefreshCw size={16} className="mr-2" />
                Reîncarcă
              </Button>
            </div>
          </div>
        </div>

        {friends.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              Nu ai prieteni adăugați încă
            </h3>
            <p className="text-gray-500 mb-6">
              Caută și adaugă jucători pentru a-i urmări progresul
            </p>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {friends.map((friend) => (
              <div
                key={friend.player_id}
                className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => onShowPlayerDetails(friend)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={friend.avatar}
                      alt={friend.nickname}
                      className="w-12 h-12 rounded-full border-2 border-orange-400"
                    />
                    <div>
                      <div className="text-white font-bold text-lg">{friend.nickname}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge className={`bg-gradient-to-r ${getLevelColor(friend.level || 0)} text-white border-0`}>
                          Level {friend.level}
                        </Badge>
                        <span className="text-blue-400 font-medium">{friend.elo} ELO</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-green-400 font-bold">{friend.wins}</div>
                      <div className="text-gray-400 text-sm">Victorii</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-400 font-bold">{friend.winRate?.toFixed(1)}%</div>
                      <div className="text-gray-400 text-sm">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-400 font-bold">{friend.hsRate?.toFixed(1)}%</div>
                      <div className="text-gray-400 text-sm">HS %</div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-400 font-bold">{friend.kdRatio?.toFixed(2)}</div>
                      <div className="text-gray-400 text-sm">K/D</div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowPlayerDetails(friend);
                      }}
                    >
                      <Target size={14} className="mr-1" />
                      Detalii
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
