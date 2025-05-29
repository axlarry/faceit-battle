
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Player } from "@/types/Player";
import { toast } from "@/hooks/use-toast";

interface LeaderboardTableProps {
  region: string;
  onShowPlayerDetails: (player: Player) => void;
  onAddFriend: (player: Player) => void;
}

// Demo data pentru testare
const generateDemoPlayers = (region: string, offset: number, limit: number): Player[] => {
  const demoPlayers: Player[] = [];
  const regionPrefix = region.toLowerCase();
  
  for (let i = 0; i < limit; i++) {
    const position = offset + i + 1;
    const playerId = `demo-${regionPrefix}-${position}`;
    const nickname = `${regionPrefix}Player${position}`;
    const level = Math.floor(Math.random() * 10) + 1;
    const elo = Math.floor(Math.random() * 2000) + 1000;
    const wins = Math.floor(Math.random() * 500) + 50;
    const matches = wins + Math.floor(Math.random() * 200) + 20;
    const winRate = Math.round((wins / matches) * 100);
    const hsRate = Math.floor(Math.random() * 60) + 20;
    const kdRatio = (Math.random() * 1.5 + 0.5).toFixed(2);

    demoPlayers.push({
      player_id: playerId,
      nickname: nickname,
      avatar: `https://picsum.photos/seed/${playerId}/100/100`,
      position: position,
      level: level,
      elo: elo,
      wins: wins,
      winRate: winRate,
      hsRate: hsRate,
      kdRatio: parseFloat(kdRatio),
    });
  }
  
  return demoPlayers;
};

export const LeaderboardTable = ({ region, onShowPlayerDetails, onAddFriend }: LeaderboardTableProps) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    setPlayers([]);
    setOffset(0);
    loadPlayers(0, true);
  }, [region]);

  const loadPlayers = async (currentOffset: number, reset = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      // Simulăm un delay pentru a simula un API real
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const demoPlayers = generateDemoPlayers(region, currentOffset, limit);
      
      if (demoPlayers.length === 0) {
        toast({
          title: "Nu există mai mulți jucători",
          description: "S-au încărcat toți jucătorii disponibili.",
        });
        return;
      }

      if (reset) {
        setPlayers(demoPlayers);
      } else {
        setPlayers(prev => [...prev, ...demoPlayers]);
      }
      
      setOffset(currentOffset + limit);

    } catch (error) {
      console.error('Error loading demo leaderboard:', error);
      toast({
        title: "Eroare la încărcare",
        description: "Nu s-au putut încărca datele clasamentului demo.",
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
      <Card className="bg-white/5 backdrop-blur-lg border-white/10">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
            Clasament Demo {region}
          </h2>
          
          <div className="space-y-3">
            {players.map((player, index) => (
              <div
                key={player.player_id}
                className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-orange-400 min-w-[3rem]">
                      #{player.position}
                    </div>
                    
                    <img
                      src={player.avatar}
                      alt={player.nickname}
                      className="w-12 h-12 rounded-full border-2 border-orange-400"
                    />
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white">{player.nickname}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`bg-gradient-to-r ${getLevelColor(player.level || 0)} text-white border-0`}>
                          Nivel {player.level}
                        </Badge>
                        <span className="text-orange-400 font-medium">{player.elo} ELO</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-white font-medium">{player.wins}</div>
                      <div className="text-gray-400">Victorii</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-medium">{player.winRate}%</div>
                      <div className="text-gray-400">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-medium">{player.hsRate}%</div>
                      <div className="text-gray-400">HS%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-medium">{player.kdRatio}</div>
                      <div className="text-gray-400">K/D</div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => onShowPlayerDetails(player)}
                        className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white"
                      >
                        Detalii
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => onAddFriend(player)}
                        className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white"
                      >
                        Adaugă
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {players.length > 0 && offset < 100 && (
            <div className="text-center pt-6">
              <Button
                onClick={() => loadPlayers(offset)}
                disabled={loading}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 px-8 py-3"
              >
                {loading ? 'Se încarcă...' : 'Încarcă mai mulți'}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
