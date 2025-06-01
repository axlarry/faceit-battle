
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Player } from "@/types/Player";
import { Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FaceitToolProps {
  onShowPlayerDetails: (player: Player) => void;
  onAddFriend: (player: Player) => void;
}

const API_KEY = 'c2755709-8b70-4f89-934f-7e4a8d0b7a29';
const API_BASE = 'https://open.faceit.com/data/v4';
const STEAM_PROXY = 'https://lacurte.ro:3000';

export const FaceitTool = ({ onShowPlayerDetails }: FaceitToolProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBySteam, setSearchBySteam] = useState(false);
  const [loading, setLoading] = useState(false);
  const [foundPlayer, setFoundPlayer] = useState<Player | null>(null);

  const searchPlayer = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      let searchUrl = '';
      if (searchBySteam) {
        // Use proxy for Steam ID search
        searchUrl = `${STEAM_PROXY}/steam-to-faceit?steam=${encodeURIComponent(searchTerm.trim())}`;
      } else {
        // Direct FACEIT username search
        searchUrl = `${API_BASE}/players?nickname=${encodeURIComponent(searchTerm.trim())}`;
      }

      const response = await fetch(searchUrl, {
        headers: searchBySteam ? {} : {
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

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border-white/20 shadow-2xl">
        <div className="p-8">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Search size={24} className="text-white" />
            </div>
            FACEIT Tool - Account Lookup & Statistics
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold">Tip căutare:</span>
                <div className="flex items-center gap-4">
                  <span className={`text-sm font-medium ${!searchBySteam ? 'text-purple-400' : 'text-gray-400'}`}>
                    FACEIT Username
                  </span>
                  <Switch
                    checked={searchBySteam}
                    onCheckedChange={setSearchBySteam}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-indigo-500 data-[state=checked]:to-purple-500"
                  />
                  <span className={`text-sm font-medium ${searchBySteam ? 'text-purple-400' : 'text-gray-400'}`}>
                    Steam ID/Username
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Input
                placeholder={searchBySteam ? "Introdu Steam ID sau Steam username..." : "Introdu FACEIT username..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchPlayer()}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400 rounded-xl"
              />
              <Button
                onClick={searchPlayer}
                disabled={loading || !searchTerm.trim()}
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white border-0 px-8 rounded-xl shadow-lg"
              >
                {loading ? 'Caută...' : 'Caută'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {foundPlayer && (
        <Card className="bg-white/5 backdrop-blur-xl border-white/20 shadow-2xl">
          <div className="p-8">
            <h3 className="text-2xl font-bold text-white mb-6">Rezultatul căutării</h3>
            <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <img
                    src={foundPlayer.avatar}
                    alt={foundPlayer.nickname}
                    className="w-20 h-20 rounded-xl border-2 border-purple-400 shadow-lg"
                  />
                  
                  <div>
                    <h4 className="text-2xl font-bold text-white">{foundPlayer.nickname}</h4>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge className={`bg-gradient-to-r ${getLevelColor(foundPlayer.level || 0)} text-white border-0 px-3 py-1`}>
                        Nivel {foundPlayer.level}
                      </Badge>
                      <span className="text-purple-400 font-bold text-lg">{foundPlayer.elo} ELO</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 text-base">
                  <div className="text-center">
                    <div className="text-white font-bold text-xl">{foundPlayer.wins}</div>
                    <div className="text-gray-400">Victorii</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-xl">{foundPlayer.winRate}%</div>
                    <div className="text-gray-400">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-xl">{foundPlayer.hsRate}%</div>
                    <div className="text-gray-400">HS%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-xl">{foundPlayer.kdRatio}</div>
                    <div className="text-gray-400">K/D</div>
                  </div>
                  
                  <Button 
                    size="lg"
                    variant="outline"
                    onClick={() => onShowPlayerDetails(foundPlayer)}
                    className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white rounded-xl px-6"
                  >
                    Detalii
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
