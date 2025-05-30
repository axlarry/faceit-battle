
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Player } from "@/types/Player";
import { UserPlus, Users, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FriendsSectionProps {
  friends: Player[];
  onAddFriend: (player: Player) => void;
  onRemoveFriend: (playerId: string) => void;
  onShowPlayerDetails: (player: Player) => void;
}

// Setează aici propriul tău API key FACEIT
const API_KEY = 'c2755709-8b70-4f89-934f-7e4a8d0b7a29'; // Înlocuiește cu propriul tău API key
const API_BASE = 'https://open.faceit.com/data/v4';

export const FriendsSection = ({ friends, onAddFriend, onRemoveFriend, onShowPlayerDetails }: FriendsSectionProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const searchPlayer = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/players?nickname=${encodeURIComponent(searchTerm.trim())}`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Jucătorul nu a fost găsit');
      }

      const playerData = await response.json();
      
      // Get additional stats
      const statsResponse = await fetch(`${API_BASE}/players/${playerData.player_id}/stats/cs2`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      const statsData = await statsResponse.json();

      const player: Player = {
        player_id: playerData.player_id,
        nickname: playerData.nickname,
        avatar: playerData.avatar || '/placeholder.svg',
        level: playerData.games?.cs2?.skill_level || 0,
        elo: playerData.games?.cs2?.faceit_elo || 0,
        wins: parseInt(statsData.lifetime?.Wins) || 0,
        winRate: Math.round((parseInt(statsData.lifetime?.Wins) / parseInt(statsData.lifetime?.Matches)) * 100) || 0,
        hsRate: parseFloat(statsData.lifetime?.['Average Headshots %']) || 0,
        kdRatio: parseFloat(statsData.lifetime?.['Average K/D Ratio']) || 0,
      };

      onAddFriend(player);
      setSearchTerm('');

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

  // Sort friends by ELO
  const sortedFriends = [...friends].sort((a, b) => (b.elo || 0) - (a.elo || 0));

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-lg border-blue-400/30">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <UserPlus size={16} className="text-white" />
            </div>
            Adaugă Prieteni
          </h2>
          
          <div className="flex gap-3">
            <Input
              placeholder="Introdu nickname-ul prietenului..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchPlayer()}
              className="bg-white/10 border-blue-400/30 text-white placeholder:text-gray-400 focus:border-blue-400"
            />
            <Button
              onClick={searchPlayer}
              disabled={loading || !searchTerm.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 px-8"
            >
              {loading ? 'Caută...' : 'Adaugă'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Friends List */}
      <Card className="bg-white/5 backdrop-blur-lg border-white/10">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Users size={16} className="text-white" />
            </div>
            Prietenii Mei ({friends.length})
          </h2>
          
          {friends.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={40} className="text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Niciun prieten adăugat</h3>
              <p className="text-gray-400 mb-6">Caută și adaugă prieteni pentru a-i vedea în clasamentul tău personal!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedFriends.map((friend, index) => (
                <div
                  key={friend.player_id}
                  className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-lg p-4 border border-blue-400/20 hover:border-blue-400/40 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-blue-400 min-w-[3rem]">
                        #{index + 1}
                      </div>
                      
                      <img
                        src={friend.avatar}
                        alt={friend.nickname}
                        className="w-12 h-12 rounded-full border-2 border-blue-400"
                      />
                      
                      <div>
                        <h3 className="text-lg font-semibold text-white">{friend.nickname}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`bg-gradient-to-r ${getLevelColor(friend.level || 0)} text-white border-0`}>
                            Nivel {friend.level}
                          </Badge>
                          <span className="text-blue-400 font-medium">{friend.elo} ELO</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-white font-medium">{friend.wins}</div>
                        <div className="text-gray-400">Victorii</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-medium">{friend.winRate}%</div>
                        <div className="text-gray-400">Win Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-medium">{friend.hsRate}%</div>
                        <div className="text-gray-400">HS%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-medium">{friend.kdRatio}</div>
                        <div className="text-gray-400">K/D</div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => onShowPlayerDetails(friend)}
                          className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white"
                        >
                          Detalii
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => onRemoveFriend(friend.player_id)}
                          className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
