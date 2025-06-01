
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
        searchUrl = `${STEAM_PROXY}/steam-to-faceit?steam=${encodeURIComponent(searchTerm.trim())}`;
      } else {
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
    if (level >= 9) return 'bg-red-500';
    if (level >= 7) return 'bg-purple-500';
    if (level >= 5) return 'bg-blue-500';
    if (level >= 3) return 'bg-green-500';
    return 'bg-gray-500';
  };

  const getLevelBorder = (level: number) => {
    if (level >= 9) return 'border-red-400';
    if (level >= 7) return 'border-purple-400';
    if (level >= 5) return 'border-blue-400';
    if (level >= 3) return 'border-green-400';
    return 'border-gray-400';
  };

  return (
    <div className="space-y-6 px-4 md:px-0">
      <Card className="bg-[#1a1d21] border-[#2a2f36] shadow-xl">
        <div className="p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8 flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#ff6500] rounded-lg flex items-center justify-center shadow-lg">
              <Search size={20} className="md:w-6 md:h-6 text-white" />
            </div>
            <span className="text-lg md:text-3xl">FACEIT Tool - Player Search</span>
          </h2>
          
          <div className="space-y-6">
            <div className="bg-[#2a2f36] rounded-lg p-4 md:p-6 border border-[#3a4048]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <span className="text-white font-semibold text-sm md:text-base">Tip căutare:</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className={`font-medium ${!searchBySteam ? 'text-[#ff6500]' : 'text-[#9f9f9f]'}`}>
                    FACEIT Username
                  </span>
                  <Switch
                    checked={searchBySteam}
                    onCheckedChange={setSearchBySteam}
                    className="data-[state=checked]:bg-[#ff6500]"
                  />
                  <span className={`font-medium ${searchBySteam ? 'text-[#ff6500]' : 'text-[#9f9f9f]'}`}>
                    Steam ID/Username
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder={searchBySteam ? "Introdu Steam ID sau Steam username..." : "Introdu FACEIT username..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchPlayer()}
                className="bg-[#2a2f36] border-[#3a4048] text-white placeholder:text-[#9f9f9f] focus:border-[#ff6500] rounded-lg h-12"
              />
              <Button
                onClick={searchPlayer}
                disabled={loading || !searchTerm.trim()}
                className="bg-[#ff6500] hover:bg-[#e55a00] text-white border-0 px-6 md:px-8 h-12 rounded-lg shadow-lg font-bold"
              >
                {loading ? 'Caută...' : 'Caută'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {foundPlayer && (
        <Card className="bg-[#1a1d21] border-[#2a2f36] shadow-xl">
          <div className="p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-6">Rezultatul căutării</h3>
            <div className="bg-[#2a2f36] rounded-lg p-4 md:p-6 border border-[#3a4048]">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 w-full lg:w-auto">
                  <img
                    src={foundPlayer.avatar}
                    alt={foundPlayer.nickname}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-lg border-2 border-[#ff6500] shadow-lg"
                  />
                  
                  <div className="min-w-0 flex-1">
                    <h4 className="text-lg md:text-2xl font-bold text-white truncate">{foundPlayer.nickname}</h4>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-2">
                      <Badge className={`${getLevelColor(foundPlayer.level || 0)} text-white border-0 px-2 md:px-3 py-1 text-xs md:text-sm`}>
                        Nivel {foundPlayer.level}
                      </Badge>
                      <span className="text-[#ff6500] font-bold text-sm md:text-lg">{foundPlayer.elo} ELO</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 md:gap-8 text-sm md:text-base w-full lg:w-auto justify-between lg:justify-end">
                  <div className="text-center">
                    <div className="text-white font-bold text-lg md:text-xl">{foundPlayer.wins}</div>
                    <div className="text-[#9f9f9f] text-xs md:text-sm">Victorii</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg md:text-xl">{foundPlayer.winRate}%</div>
                    <div className="text-[#9f9f9f] text-xs md:text-sm">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg md:text-xl">{foundPlayer.hsRate}%</div>
                    <div className="text-[#9f9f9f] text-xs md:text-sm">HS%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-lg md:text-xl">{foundPlayer.kdRatio}</div>
                    <div className="text-[#9f9f9f] text-xs md:text-sm">K/D</div>
                  </div>
                  
                  <Button 
                    size="lg"
                    onClick={() => onShowPlayerDetails(foundPlayer)}
                    className={`bg-transparent border-2 ${getLevelBorder(foundPlayer.level || 0)} text-white hover:bg-[#ff6500] hover:border-[#ff6500] rounded-lg px-4 md:px-6 h-10 md:h-12 font-bold`}
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
