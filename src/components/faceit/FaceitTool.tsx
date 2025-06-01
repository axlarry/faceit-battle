
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Player } from "@/types/Player";
import { Search, UserPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FaceitToolProps {
  onShowPlayerDetails: (player: Player) => void;
  onAddFriend: (player: Player) => void;
}

const API_KEY = 'c2755709-8b70-4f89-934f-7e4a8d0b7a29';
const API_BASE = 'https://open.faceit.com/data/v4';

export const FaceitTool = ({ onShowPlayerDetails, onAddFriend }: FaceitToolProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'nickname' | 'steam'>('nickname');
  const [loading, setLoading] = useState(false);
  const [foundPlayer, setFoundPlayer] = useState<Player | null>(null);

  const searchPlayer = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      let searchUrl = '';
      if (searchType === 'nickname') {
        searchUrl = `${API_BASE}/players?nickname=${encodeURIComponent(searchTerm.trim())}`;
      } else {
        searchUrl = `${API_BASE}/players?game_player_id=${encodeURIComponent(searchTerm.trim())}&game=cs2`;
      }

      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });

      if (!response.ok) {
        throw new Error('Jucătorul nu a fost găsit');
      }

      const playerData = await response.json();
      
      // Get additional stats
      const statsResponse = await fetch(`${API_BASE}/players/${playerData.player_id}/stats/cs2`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      
      let statsData = {};
      if (statsResponse.ok) {
        statsData = await statsResponse.json();
      }

      const player: Player = {
        player_id: playerData.player_id,
        nickname: playerData.nickname,
        avatar: playerData.avatar || '/placeholder.svg',
        level: playerData.games?.cs2?.skill_level || 0,
        elo: playerData.games?.cs2?.faceit_elo || 0,
        wins: parseInt((statsData as any).lifetime?.Wins) || 0,
        winRate: Math.round((parseInt((statsData as any).lifetime?.Wins) / parseInt((statsData as any).lifetime?.Matches)) * 100) || 0,
        hsRate: parseFloat((statsData as any).lifetime?.['Average Headshots %']) || 0,
        kdRatio: parseFloat((statsData as any).lifetime?.['Average K/D Ratio']) || 0,
      };

      setFoundPlayer(player);

    } catch (error) {
      toast({
        title: "Eroare la căutare",
        description: "Jucătorul nu a fost găsit sau a apărut o eroare.",
        variant: "destructive",
      });
      setFoundPlayer(null);
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

  const handleAddFriend = () => {
    if (foundPlayer) {
      onAddFriend(foundPlayer);
      setFoundPlayer(null);
      setSearchTerm('');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-lg border-green-400/30">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <Search size={16} className="text-white" />
            </div>
            FACEIT Tool - Account Lookup & Statistics
          </h2>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button
                variant={searchType === 'nickname' ? 'default' : 'outline'}
                onClick={() => setSearchType('nickname')}
                className={searchType === 'nickname' 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0' 
                  : 'border-green-400 text-green-400 hover:bg-green-400 hover:text-white bg-white/5'
                }
              >
                FACEIT Username
              </Button>
              <Button
                variant={searchType === 'steam' ? 'default' : 'outline'}
                onClick={() => setSearchType('steam')}
                className={searchType === 'steam' 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0' 
                  : 'border-green-400 text-green-400 hover:bg-green-400 hover:text-white bg-white/5'
                }
              >
                Steam ID/Username
              </Button>
            </div>
            
            <div className="flex gap-3">
              <Input
                placeholder={searchType === 'nickname' ? "Introdu FACEIT username..." : "Introdu Steam ID sau Steam username..."}
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

      {foundPlayer && (
        <Card className="bg-white/5 backdrop-blur-lg border-white/10">
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">Rezultatul căutării</h3>
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-lg p-4 border border-green-400/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={foundPlayer.avatar}
                    alt={foundPlayer.nickname}
                    className="w-16 h-16 rounded-full border-2 border-green-400"
                  />
                  
                  <div>
                    <h4 className="text-xl font-semibold text-white">{foundPlayer.nickname}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`bg-gradient-to-r ${getLevelColor(foundPlayer.level || 0)} text-white border-0`}>
                        Nivel {foundPlayer.level}
                      </Badge>
                      <span className="text-green-400 font-medium">{foundPlayer.elo} ELO</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-white font-medium">{foundPlayer.wins}</div>
                    <div className="text-gray-400">Victorii</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-medium">{foundPlayer.winRate}%</div>
                    <div className="text-gray-400">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-medium">{foundPlayer.hsRate}%</div>
                    <div className="text-gray-400">HS%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-medium">{foundPlayer.kdRatio}</div>
                    <div className="text-gray-400">K/D</div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => onShowPlayerDetails(foundPlayer)}
                      className="border-green-400 text-green-400 hover:bg-green-400 hover:text-white"
                    >
                      Detalii
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleAddFriend}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0"
                    >
                      <UserPlus size={16} className="mr-1" />
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
