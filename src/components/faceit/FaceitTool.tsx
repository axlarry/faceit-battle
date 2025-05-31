
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Player } from "@/types/Player";
import { Search, User, TrendingUp, Target, Award } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FaceitToolProps {
  onShowPlayerDetails: (player: Player) => void;
  onAddFriend: (player: Player) => void;
}

const API_KEY = 'c2755709-8b70-4f89-934f-7e4a8d0b7a29';
const API_BASE = 'https://open.faceit.com/data/v4';

export const FaceitTool = ({ onShowPlayerDetails, onAddFriend }: FaceitToolProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('nickname');
  const [loading, setLoading] = useState(false);
  const [playerData, setPlayerData] = useState<Player | null>(null);

  const searchPlayer = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setPlayerData(null);
    
    try {
      let playerResponse;
      
      if (searchType === 'steam') {
        // Căutare după Steam ID
        playerResponse = await fetch(
          `${API_BASE}/players?game=cs2&game_player_id=${encodeURIComponent(searchTerm.trim())}`,
          {
            headers: {
              'Authorization': `Bearer ${API_KEY}`
            }
          }
        );
      } else {
        // Căutare după nickname FACEIT
        playerResponse = await fetch(
          `${API_BASE}/players?nickname=${encodeURIComponent(searchTerm.trim())}`,
          {
            headers: {
              'Authorization': `Bearer ${API_KEY}`
            }
          }
        );
      }

      if (!playerResponse.ok) {
        throw new Error('Jucătorul nu a fost găsit');
      }

      const playerInfo = await playerResponse.json();
      
      // Obțin statisticile jucătorului
      const statsResponse = await fetch(`${API_BASE}/players/${playerInfo.player_id}/stats/cs2`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      
      let statsData = {};
      if (statsResponse.ok) {
        statsData = await statsResponse.json();
      }

      const player: Player = {
        player_id: playerInfo.player_id,
        nickname: playerInfo.nickname,
        avatar: playerInfo.avatar || '/placeholder.svg',
        level: playerInfo.games?.cs2?.skill_level || 0,
        elo: playerInfo.games?.cs2?.faceit_elo || 0,
        wins: parseInt(statsData.lifetime?.Wins) || 0,
        winRate: Math.round((parseInt(statsData.lifetime?.Wins) / parseInt(statsData.lifetime?.Matches)) * 100) || 0,
        hsRate: parseFloat(statsData.lifetime?.['Average Headshots %']) || 0,
        kdRatio: parseFloat(statsData.lifetime?.['Average K/D Ratio']) || 0,
      };

      setPlayerData(player);

    } catch (error) {
      toast({
        title: "Eroare la căutare",
        description: "Jucătorul nu a fost găsit sau a apărut o eroare.",
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

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-lg border-green-400/30">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <Search size={16} className="text-white" />
            </div>
            FACEIT Tool - Account Lookup & Statistics
          </h2>
          
          <div className="space-y-4">
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger className="bg-white/10 border-green-400/30 text-white">
                <SelectValue placeholder="Selectează tipul de căutare" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nickname">FACEIT Username</SelectItem>
                <SelectItem value="steam">Steam ID / Username</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex gap-3">
              <Input
                placeholder={
                  searchType === 'steam' 
                    ? "Introdu Steam ID sau Steam Username..." 
                    : "Introdu FACEIT Username..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchPlayer()}
                className="bg-white/10 border-green-400/30 text-white placeholder:text-gray-400 focus:border-green-400"
              />
              <Button
                onClick={searchPlayer}
                disabled={loading || !searchTerm.trim()}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 px-8"
              >
                {loading ? 'Caută...' : 'Caută'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Player Results */}
      {playerData && (
        <Card className="bg-white/5 backdrop-blur-lg border-white/10">
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <User size={20} className="text-green-400" />
              Rezultatul căutării
            </h3>
            
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-lg p-4 border border-green-400/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={playerData.avatar}
                    alt={playerData.nickname}
                    className="w-16 h-16 rounded-full border-2 border-green-400"
                  />
                  
                  <div>
                    <h4 className="text-xl font-semibold text-white">{playerData.nickname}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`bg-gradient-to-r ${getLevelColor(playerData.level || 0)} text-white border-0`}>
                        Nivel {playerData.level}
                      </Badge>
                      <span className="text-green-400 font-medium">{playerData.elo} ELO</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="flex items-center gap-1 mb-1">
                      <Award size={14} className="text-green-400" />
                    </div>
                    <div className="text-white font-medium">{playerData.wins}</div>
                    <div className="text-gray-400">Victorii</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingUp size={14} className="text-green-400" />
                    </div>
                    <div className="text-white font-medium">{playerData.winRate}%</div>
                    <div className="text-gray-400">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 mb-1">
                      <Target size={14} className="text-green-400" />
                    </div>
                    <div className="text-white font-medium">{playerData.hsRate}%</div>
                    <div className="text-gray-400">HS%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-medium">{playerData.kdRatio}</div>
                    <div className="text-gray-400">K/D</div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => onShowPlayerDetails(playerData)}
                      className="border-green-400 text-green-400 hover:bg-green-400 hover:text-white"
                    >
                      Detalii
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => onAddFriend(playerData)}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0"
                    >
                      Adaugă
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
