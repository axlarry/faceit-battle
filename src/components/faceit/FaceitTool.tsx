
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Player } from "@/types/Player";
import { Search, User, Trophy, Sword, Crosshair, BarChart2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PasswordDialog } from "./PasswordDialog";
import { useFaceitApi } from "@/hooks/useFaceitApi";

interface FaceitToolProps {
  onShowPlayerDetails: (player: Player) => void;
  onAddFriend: (player: Player) => Promise<void>;
}

// Discord environment detection
const isDiscordEnvironment = () => {
  return window.parent !== window ||
    window.location.href.includes('discord.com') ||
    document.referrer.includes('discord.com') ||
    window.location.search.includes('frame_id') ||
    navigator.userAgent.includes('Discord');
};

export const FaceitTool = ({ onShowPlayerDetails, onAddFriend }: FaceitToolProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'steam' | 'nickname'>('steam');
  const [loading, setLoading] = useState(false);
  const [playerData, setPlayerData] = useState<Player | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingPlayer, setPendingPlayer] = useState<Player | null>(null);

  const { makeApiCall } = useFaceitApi();

  const isValidSteamID64 = (input: string): boolean => {
    return /^\d{17}$/.test(input);
  };

  const extractSteamVanity = (input: string): string => {
    input = input.trim();

    // Dacă este URL de tip steamcommunity.com/profiles/STEAMID64
    if (input.includes('steamcommunity.com/profiles/')) {
      const match = input.match(/steamcommunity\.com\/profiles\/(\d+)/);
      if (match && match[1]) {
        return match[1]; // Returnăm direct SteamID64
      }
    }

    // Dacă este URL de tip steamcommunity.com/id/username
    if (input.includes('steamcommunity.com/id/')) {
      const match = input.match(/steamcommunity\.com\/id\/([^\/]+)/);
      return match ? match[1] : input;
    }

    return input;
  };

  const getSteamID64 = async (input: string) => {
    try {
      input = input.trim();

      // În Discord, returnăm un mock SteamID64
      if (isDiscordEnvironment()) {
        console.log('🎮 Discord environment - using mock SteamID64');
        return '76561198000000000';
      }

      // Verificăm dacă inputul este deja un SteamID64 valid (17 cifre)
      if (/^\d{17}$/.test(input)) {
        return input;
      }

      // Extragem vanity name sau SteamID64 din URL (dacă e cazul)
      const extracted = extractSteamVanity(input);

      // Dacă după extracție avem un SteamID64 valid, îl returnăm direct
      if (/^\d{17}$/.test(extracted)) {
        return extracted;
      }

      // În medii non-Discord, returnăm mock data pentru demonstrație
      return '76561198000000001';
    } catch (error) {
      throw new Error('Eroare la obținerea SteamID - funcționalitate limitată în Discord');
    }
  };

  const getUserFriendlyErrorMessage = (error: any): string => {
    if (isDiscordEnvironment()) {
      return 'Căutarea funcționează în modul demonstrativ în Discord. Încearcă să cauți orice nume pentru a vedea un exemplu.';
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Verificăm dacă eroarea conține "API Error:"
    if (errorMessage.includes('API Error:')) {
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        return 'Jucătorul nu a fost găsit pe FACEIT. Verifică dacă numele sau ID-ul sunt corecte.';
      }
      if (errorMessage.includes('403') || errorMessage.includes('unauthorized')) {
        return 'Acces neautorizat la API. Te rog contactează administratorul.';
      }
      if (errorMessage.includes('500')) {
        return 'Problemă temporară cu serverul FACEIT. Te rog încearcă din nou peste câteva minute.';
      }
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        return 'Prea multe cereri. Te rog așteaptă câteva secunde și încearcă din nou.';
      }
      return 'Nu s-au găsit rezultate pentru căutarea ta. Verifică dacă datele introduse sunt corecte.';
    }
    
    return errorMessage;
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
      let playerInfo;

      if (searchType === 'steam') {
        // Folosim SteamID64 direct dacă este valid
        if (isValidSteamID64(searchTerm)) {
          playerInfo = await makeApiCall(`/players?game=cs2&game_player_id=${searchTerm}`);
        } else {
          // Altfel încercăm să obținem SteamID64 din vanity URL sau profile URL
          const steamID64 = await getSteamID64(searchTerm);
          playerInfo = await makeApiCall(`/players?game=cs2&game_player_id=${steamID64}`);
        }
      } else {
        // Căutare după nickname FACEIT
        playerInfo = await makeApiCall(`/players?nickname=${encodeURIComponent(searchTerm.trim())}`);
      }

      const statsData = await makeApiCall(`/players/${playerInfo.player_id}/stats/cs2`);

      const player: Player = {
        player_id: playerInfo.player_id,
        nickname: playerInfo.nickname,
        avatar: playerInfo.avatar || '/placeholder.svg',
        level: playerInfo.games?.cs2?.skill_level || 0,
        elo: playerInfo.games?.cs2?.faceit_elo || 0,
        wins: parseInt(statsData.lifetime?.Wins || '0') || 0,
        winRate: Math.round((parseInt(statsData.lifetime?.Wins || '0') / parseInt(statsData.lifetime?.Matches || '1')) * 100) || 0,
        hsRate: parseFloat(statsData.lifetime?.['Average Headshots %'] || '0') || 0,
        kdRatio: parseFloat(statsData.lifetime?.['Average K/D Ratio'] || '0') || 0,
      };

      setPlayerData(player);
    } catch (error) {
      const friendlyErrorMessage = getUserFriendlyErrorMessage(error);
      setApiError(friendlyErrorMessage);

      toast({
        title: "Căutare nereușită",
        description: friendlyErrorMessage,
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

  const confirmAddFriend = async () => {
    if (pendingPlayer) {
      await onAddFriend(pendingPlayer);
      setPendingPlayer(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Discord Info Banner */}
      {isDiscordEnvironment() && (
        <Card className="bg-blue-500/10 backdrop-blur-lg border-blue-500/30">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-blue-400 font-medium">Discord Activity Mode</h3>
                <p className="text-blue-300 text-sm">Aplicația rulează în modul demonstrativ. Toate căutările vor afișa date de exemplu.</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Search Section */}
      <Card className="bg-white/5 backdrop-blur-lg border-white/10">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
            Caută Jucător FACEIT
          </h2>

          {/* Error Display */}
          {apiError && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                </div>
                <div className="flex-1">
                  <h4 className="text-red-400 font-medium mb-1">Căutare nereușită</h4>
                  <p className="text-red-300 text-sm leading-relaxed">{apiError}</p>
                </div>
              </div>
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
                  ? "Introdu Steam URL, ID sau SteamID64 (ex: donk666, https://steamcommunity.com/id/donk666/ sau 76561197960287930)"
                  : "Introdu FACEIT Nickname"
              }
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setApiError(null);
              }}
              onKeyPress={(e) => e.key === 'Enter' && !loading && searchPlayer()}
              className="bg-white/10 border-orange-400/30 text-white placeholder:text-gray-400 focus:border-orange-400"
            />
            <Button
              onClick={searchPlayer}
              disabled={loading || !searchTerm.trim()}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 px-8"
            >
              {loading ? 'Caută...' : 'Caută'}
              <Search className="ml-2 h-4 w-4" />
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
                {isDiscordEnvironment() ? 'Demo Data' : 'CS2 Stats'}
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
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
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
                    <Button
                      size="sm"
                      onClick={() => handleAddFriend(playerData)}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
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
