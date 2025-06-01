
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Player } from "@/types/Player";
import { UserPlus, Users, Trash2, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useFriendsAutoUpdate } from "@/hooks/useFriendsAutoUpdate";
import { PasswordDialog } from "./PasswordDialog";

interface FriendsSectionProps {
  friends: Player[];
  onAddFriend: (player: Player) => void;
  onRemoveFriend: (playerId: string) => void;
  onShowPlayerDetails: (player: Player) => void;
  onUpdateFriend?: (player: Player) => void;
}

const API_KEY = 'c2755709-8b70-4f89-934f-7e4a8d0b7a29';
const API_BASE = 'https://open.faceit.com/data/v4';

export const FriendsSection = ({ 
  friends, 
  onAddFriend, 
  onRemoveFriend, 
  onShowPlayerDetails,
  onUpdateFriend 
}: FriendsSectionProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'add' | 'remove';
    player?: Player;
    playerId?: string;
  } | null>(null);

  // Auto-update friends data every 5 minutes
  const { isUpdating, updateAllFriends } = useFriendsAutoUpdate({
    friends,
    updateFriend: onUpdateFriend || (() => {}),
    enabled: true
  });

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

      setPendingAction({ type: 'add', player });
      setShowPasswordDialog(true);

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

  const handleAddFriend = (player: Player) => {
    setPendingAction({ type: 'add', player });
    setShowPasswordDialog(true);
  };

  const handleRemoveFriend = (playerId: string) => {
    setPendingAction({ type: 'remove', playerId });
    setShowPasswordDialog(true);
  };

  const confirmAction = () => {
    if (pendingAction) {
      if (pendingAction.type === 'add' && pendingAction.player) {
        onAddFriend(pendingAction.player);
        setSearchTerm('');
      } else if (pendingAction.type === 'remove' && pendingAction.playerId) {
        onRemoveFriend(pendingAction.playerId);
      }
      setPendingAction(null);
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 9) return 'from-red-500 to-red-600';
    if (level >= 7) return 'from-purple-500 to-purple-600';
    if (level >= 5) return 'from-blue-500 to-blue-600';
    if (level >= 3) return 'from-green-500 to-green-600';
    return 'from-gray-500 to-gray-600';
  };

  const sortedFriends = [...friends].sort((a, b) => (b.elo || 0) - (a.elo || 0));

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card className="bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border-white/20 shadow-2xl">
        <div className="p-8">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <UserPlus size={24} className="text-white" />
            </div>
            Adaugă Prieteni
          </h2>
          
          <div className="flex gap-4">
            <Input
              placeholder="Introdu nickname-ul prietenului..."
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
              {loading ? 'Caută...' : 'Adaugă'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Friends List */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/20 shadow-2xl">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Users size={24} className="text-white" />
              </div>
              Prietenii Mei ({friends.length})
            </h2>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                Actualizare automată la 5 min
              </span>
              <Button
                onClick={updateAllFriends}
                disabled={isUpdating}
                size="lg"
                variant="outline"
                className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white rounded-xl"
              >
                <RefreshCw size={20} className={isUpdating ? 'animate-spin' : ''} />
                {isUpdating ? 'Actualizare...' : 'Actualizează acum'}
              </Button>
            </div>
          </div>
          
          {friends.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Users size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Niciun prieten adăugat</h3>
              <p className="text-gray-400 text-lg mb-8">Caută și adaugă prieteni pentru a-i vedea în clasamentul tău personal!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedFriends.map((friend, index) => (
                <div
                  key={friend.player_id}
                  className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="text-3xl font-bold text-purple-400 min-w-[4rem]">
                        #{index + 1}
                      </div>
                      
                      <img
                        src={friend.avatar}
                        alt={friend.nickname}
                        className="w-16 h-16 rounded-xl border-2 border-purple-400 shadow-lg"
                      />
                      
                      <div>
                        <h3 className="text-xl font-bold text-white">{friend.nickname}</h3>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge className={`bg-gradient-to-r ${getLevelColor(friend.level || 0)} text-white border-0 px-3 py-1`}>
                            Nivel {friend.level}
                          </Badge>
                          <span className="text-purple-400 font-bold text-lg">{friend.elo} ELO</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 text-base">
                      <div className="text-center">
                        <div className="text-white font-bold text-xl">{friend.wins}</div>
                        <div className="text-gray-400">Victorii</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold text-xl">{friend.winRate}%</div>
                        <div className="text-gray-400">Win Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold text-xl">{friend.hsRate}%</div>
                        <div className="text-gray-400">HS%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold text-xl">{friend.kdRatio}</div>
                        <div className="text-gray-400">K/D</div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button 
                          size="lg"
                          variant="outline"
                          onClick={() => onShowPlayerDetails(friend)}
                          className="border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white rounded-xl"
                        >
                          Detalii
                        </Button>
                        <Button 
                          size="lg"
                          variant="outline"
                          onClick={() => handleRemoveFriend(friend.player_id)}
                          className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white rounded-xl"
                        >
                          <Trash2 size={20} />
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

      <PasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => {
          setShowPasswordDialog(false);
          setPendingAction(null);
        }}
        onConfirm={confirmAction}
        title={pendingAction?.type === 'add' ? 'Adaugă Prieten' : 'Șterge Prieten'}
        description={
          pendingAction?.type === 'add' 
            ? `Vrei să adaugi ${pendingAction.player?.nickname} în lista de prieteni?`
            : 'Vrei să ștergi acest prieten din listă?'
        }
      />
    </div>
  );
};
