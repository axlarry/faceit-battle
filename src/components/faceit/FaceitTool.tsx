
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Player } from "@/types/Player";
import { Search, User, Trophy, Sword, Crosshair, BarChart2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FaceitToolProps {
  onShowPlayerDetails: (player: Player) => void;
}

const FACEIT_API_KEY = '6bb8f3be-53d3-400b-9766-bca9106ea411';
const FACEIT_API_BASE = 'https://open.faceit.com/data/v4';
const PROXY_SERVER = 'https://lacurte.ro:3000';

export const FaceitTool = ({ onShowPlayerDetails }: FaceitToolProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'steam' | 'nickname'>('steam');
  const [loading, setLoading] = useState(false);
  const [playerData, setPlayerData] = useState<Player | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const extractSteamVanity = (input: string): string => {
    if (input.includes('steamcommunity.com')) {
      const match = input.match(/steamcommunity\.com\/id\/([^\/]+)/);
      return match ? match[1] : input;
    }
    return input.trim();
  };

  const getSteamID64 = async (input: string) => {
    try {
      const vanityName = extractSteamVanity(input);
      const response = await fetch(
        `${PROXY_SERVER}/api/steamid?vanityurl=${vanityName}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Eroare la conexiunea cu serverul proxy');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.steamid) {
        throw new Error('Profil Steam nu a fost găsit');
      }

      return data.steamid;
    } catch (error) {
      let errorMessage = 'Eroare la obținerea SteamID';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      throw new Error(errorMessage);
    }
  };

  const searchPlayer = async () => {
    if (!searchTerm.trim()) {
      setApiError('Te rog introdu un termen de căutare');
      return;
    }

    setLoading(true);
    setPlayerData(null);
    setApiError(null);

    try {
      let playerResponse;

      if (searchType === 'steam') {
        try {
          const steamID64 = await getSteamID64(searchTerm);
          playerResponse = await fetch(
            `${FACEIT_API_BASE}/players?game=cs2&game_player_id=${steamID64}`,
            { headers: { 'Authorization': `Bearer ${FACEIT_API_KEY}` } }
          );
        } catch (error) {
          throw new Error(error instanceof Error ? error.message : 'Profilul Steam nu a fost găsit');
        }
      } else {
        playerResponse = await fetch(
          `${FACEIT_API_BASE}/players?nickname=${encodeURIComponent(searchTerm.trim())}`,
          { headers: { 'Authorization': `Bearer ${FACEIT_API_KEY}` } }
        );
      }

      if (!playerResponse.ok) {
        const errorData = await playerResponse.json();
        throw new Error(errorData.message || 'Fraierul nu are cont Faceit');
      }

      const playerInfo = await playerResponse.json();
      const statsResponse = await fetch(`${FACEIT_API_BASE}/players/${playerInfo.player_id}/stats/cs2`, {
        headers: { 'Authorization': `Bearer ${FACEIT_API_KEY}` }
      });

      let statsData = {};
      if (statsResponse.ok) statsData = await statsResponse.json();

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
      const errorMessage = error instanceof Error ? error.message : 'Eroare necunoscută';
      setApiError(errorMessage);

      toast({
        title: "ATENTIE!!!",
        description: errorMessage,
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
      <Card className="bg-white/5 backdrop-blur-lg border-white/10">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
            Caută Jucător FACEIT
          </h2>

          {/* Error Display */}
          {apiError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              {apiError}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mb-4">
            <span className={`text-sm font-medium ${searchType === 'nickname' ? 'text-orange-400' : 'text-gray-400'}`}>
              FACEIT ID
            </span>

            <button
              onClick={() => {
                setSearchType(searchType === 'nickname' ? 'steam' : 'nickname');
                setApiError(null);
              }}
              className="relative inline-flex items-center h-7 rounded-full w-14 bg-gray-800 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-700"
            >
              <span className={`absolute flex items-center justify-center w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                searchType === 'steam' ? 'translate-x-7 bg-gradient-to-br from-orange-500 to-amber-500' : 'translate-x-1 bg-gradient-to-br from-gray-500 to-gray-600'
              }`}></span>
            </button>

            <span className={`text-sm font-medium ${searchType === 'steam' ? 'text-amber-400' : 'text-gray-400'}`}>
              STEAM ID/URL
            </span>
          </div>

          <div className="flex gap-3">
            <Input
              placeholder={
                searchType === 'steam'
                  ? "Introdu Steam URL sau ID (ex: donk666 sau https://steamcommunity.com/id/donk666/)"
                  : "Introdu FACEIT Nickname"
              }
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setApiError(null);
              }}
              onKeyPress={(e) => e.key === 'Enter' && searchPlayer()}
              className="bg-white/10 border-orange-400/30 text-white placeholder:text-gray-400 focus:border-orange-400"
            />
            <Button
              onClick={searchPlayer}
              disabled={loading || !searchTerm.trim()}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 px-8"
            >
              {loading ? 'Caută...' : 'Caută'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Player Results */}
      {playerData && (
        <Card className="bg-white/5 backdrop-blur-lg border-white/10">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
                Rezultate Căutare
              </h3>
              <Badge className="bg-gradient-to-r from-orange-500/10 to-red-500/10 text-orange-400 border border-orange-400/30">
                CS2 Stats
              </Badge>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-orange-400 min-w-[3rem]">
                    #{playerData.level}
                  </div>

                  <img
                    src={playerData.avatar}
                    alt={playerData.nickname}
                    className="w-12 h-12 rounded-full border-2 border-orange-400"
                  />

                  <div>
                    <h3 className="text-lg font-semibold text-white">{playerData.nickname}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`bg-gradient-to-r ${getLevelColor(playerData.level || 0)} text-white border-0`}>
                        Nivel {playerData.level}
                      </Badge>
                      <span className="text-orange-400 font-medium">{playerData.elo} ELO</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="flex items-center gap-1 mb-1 text-orange-400">
                      <Trophy size={14} />
                    </div>
                    <div className="text-white font-medium">{playerData.wins}</div>
                    <div className="text-gray-400">Victorii</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 mb-1 text-orange-400">
                      <BarChart2 size={14} />
                    </div>
                    <div className="text-white font-medium">{playerData.winRate}%</div>
                    <div className="text-gray-400">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 mb-1 text-orange-400">
                      <Crosshair size={14} />
                    </div>
                    <div className="text-white font-medium">{playerData.hsRate}%</div>
                    <div className="text-gray-400">HS%</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 mb-1 text-orange-400">
                      <Sword size={14} />
                    </div>
                    <div className="text-white font-medium">{playerData.kdRatio}</div>
                    <div className="text-gray-400">K/D</div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onShowPlayerDetails(playerData)}
                      className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white"
                    >
                      Detalii
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
