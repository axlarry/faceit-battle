
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Target } from "lucide-react";
import { Player } from "@/types/Player";
import { useFaceitApi } from "@/hooks/useFaceitApi";

interface FaceitToolProps {
  onShowPlayerDetails: (player: Player) => void;
  onAddFriend: (player: Player) => void;
}

export const FaceitTool = ({ onShowPlayerDetails, onAddFriend }: FaceitToolProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [searching, setSearching] = useState(false);
  const { searchPlayer, getPlayerStats, loading: apiLoading } = useFaceitApi();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await searchPlayer(searchQuery.trim());
      
      // Get detailed stats for each player
      const detailedResults = await Promise.all(
        results.slice(0, 10).map(async (player: any) => {
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

  const getLevelColor = (level: number) => {
    if (level >= 9) return 'from-red-500 to-red-600';
    if (level >= 7) return 'from-purple-500 to-purple-600';
    if (level >= 5) return 'from-blue-500 to-blue-600';
    if (level >= 3) return 'from-green-500 to-green-600';
    return 'from-gray-500 to-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Search className="w-6 h-6 text-orange-400" />
          Căutare Jucători FACEIT
        </h2>
        
        <div className="flex gap-3">
          <Input
            placeholder="Introdu nickname-ul jucătorului..."
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
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-xl font-bold text-white">
              Rezultate căutare ({searchResults.length})
            </h3>
          </div>

          <div className="space-y-1">
            {searchResults.map((player) => (
              <div
                key={player.player_id}
                className="p-4 hover:bg-white/5 transition-colors cursor-pointer group border-b border-white/5 last:border-b-0"
                onClick={() => onShowPlayerDetails(player)}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Player Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <img
                      src={player.avatar}
                      alt={player.nickname}
                      className="w-12 h-12 rounded-full border-2 border-orange-400"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-white font-bold text-lg truncate">
                        {player.nickname}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`bg-gradient-to-r ${getLevelColor(player.level || 0)} text-white border-0 text-xs`}>
                          Level {player.level}
                        </Badge>
                        <span className="text-blue-400 font-medium text-sm">
                          {player.elo?.toLocaleString()} ELO
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-green-400 font-bold">{player.wins}</div>
                      <div className="text-gray-400 text-xs">Victorii</div>
                    </div>
                    <div>
                      <div className="text-blue-400 font-bold">{player.winRate.toFixed(1)}%</div>
                      <div className="text-gray-400 text-xs">Win Rate</div>
                    </div>
                    <div>
                      <div className="text-red-400 font-bold">{player.hsRate.toFixed(1)}%</div>
                      <div className="text-gray-400 text-xs">HS%</div>
                    </div>
                    <div>
                      <div className="text-purple-400 font-bold">{player.kdRatio.toFixed(2)}</div>
                      <div className="text-gray-400 text-xs">K/D</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddFriend(player);
                      }}
                    >
                      <UserPlus size={14} className="mr-1" />
                      Adaugă
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowPlayerDetails(player);
                      }}
                    >
                      <Target size={14} className="mr-1" />
                      Detalii
                    </Button>
                  </div>
                </div>

                {/* Mobile Stats */}
                <div className="md:hidden mt-3 grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-green-400 font-bold text-sm">{player.wins}</div>
                    <div className="text-gray-400 text-xs">Victorii</div>
                  </div>
                  <div>
                    <div className="text-blue-400 font-bold text-sm">{player.winRate.toFixed(1)}%</div>
                    <div className="text-gray-400 text-xs">Win Rate</div>
                  </div>
                  <div>
                    <div className="text-red-400 font-bold text-sm">{player.hsRate.toFixed(1)}%</div>
                    <div className="text-gray-400 text-xs">HS%</div>
                  </div>
                  <div>
                    <div className="text-purple-400 font-bold text-sm">{player.kdRatio.toFixed(2)}</div>
                    <div className="text-gray-400 text-xs">K/D</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {searchResults.length === 0 && searchQuery && !searching && (
        <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-sm rounded-xl border border-white/10 p-8 text-center">
          <div className="text-gray-400 text-lg">
            Nu s-au găsit jucători pentru "{searchQuery}"
          </div>
          <div className="text-gray-500 text-sm mt-2">
            Încearcă un alt nickname sau verifică ortografia
          </div>
        </div>
      )}
    </div>
  );
};
