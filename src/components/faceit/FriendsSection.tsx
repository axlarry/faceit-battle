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
  onReloadFriends?: () => void;
}

const API_KEY = '5d81df9c-db61-494c-8e0a-d94c89bb7913';
const API_BASE = 'https://open.faceit.com/data/v4';

export const FriendsSection = ({ 
  friends, 
  onAddFriend, 
  onRemoveFriend, 
  onShowPlayerDetails,
  onUpdateFriend,
  onReloadFriends
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
    reloadFriends: onReloadFriends || (() => {}),
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

  const sortedFriends = [...friends].sort((a, b) => (b.elo || 0) - (a.elo || 0));

  return (
    <div className="space-y-6 px-4 md:px-0">
      {/* Search Section */}
      <Card className="bg-[#1a1d21] border-[#2a2f36] shadow-xl">
        <div className="p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8 flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#ff6500] rounded-lg flex items-center justify-center shadow-lg">
              <UserPlus size={20} className="md:w-6 md:h-6 text-white" />
            </div>
            <span className="text-lg md:text-3xl">Adaugă Prieteni</span>
          </h2>
          
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Introdu nickname-ul prietenului..."
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
              {loading ? 'Caută...' : 'Adaugă'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Friends List */}
      <Card className="bg-[#1a1d21] border-[#2a2f36] shadow-xl">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-[#ff6500] rounded-lg flex items-center justify-center shadow-lg">
                <Users size={20} className="md:w-6 md:h-6 text-white" />
              </div>
              <span className="text-lg md:text-3xl">Prietenii Mei ({friends.length})</span>
            </h2>
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <span className="text-xs md:text-sm text-[#9f9f9f]">
                Actualizare automată la 5 min
              </span>
              <Button
                onClick={updateAllFriends}
                disabled={isUpdating}
                size="lg"
                className="bg-transparent border-2 border-[#ff6500] text-[#ff6500] hover:bg-[#ff6500] hover:text-white rounded-lg h-10 md:h-12 px-4 md:px-6 font-bold"
              >
                <RefreshCw size={16} className={`md:w-5 md:h-5 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
                {isUpdating ? 'Actualizare...' : 'Actualizează acum'}
              </Button>
            </div>
          </div>
          
          {friends.length === 0 ? (
            <div className="text-center py-12 md:py-16">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-[#ff6500] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Users size={40} className="md:w-12 md:h-12 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-3">Niciun prieten adăugat</h3>
              <p className="text-[#9f9f9f] text-base md:text-lg mb-8">Caută și adaugă prieteni pentru a-i vedea în clasamentul tău personal!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedFriends.map((friend, index) => (
                <div
                  key={friend.player_id}
                  className="bg-[#2a2f36] rounded-lg p-4 md:p-6 border border-[#3a4048] hover:border-[#ff6500]/50 transition-all duration-300 shadow-lg"
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6">
                    <div className="flex items-center gap-4 md:gap-6 w-full lg:w-auto">
                      <div className="text-2xl md:text-3xl font-bold text-[#ff6500] min-w-[3rem] md:min-w-[4rem]">
                        #{index + 1}
                      </div>
                      
                      <img
                        src={friend.avatar}
                        alt={friend.nickname}
                        className="w-12 h-12 md:w-16 md:h-16 rounded-lg border-2 border-[#ff6500] shadow-lg"
                      />
                      
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg md:text-xl font-bold text-white truncate">{friend.nickname}</h3>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-2">
                          <Badge className={`${getLevelColor(friend.level || 0)} text-white border-0 px-2 md:px-3 py-1 text-xs md:text-sm`}>
                            Nivel {friend.level}
                          </Badge>
                          <span className="text-[#ff6500] font-bold text-sm md:text-lg">{friend.elo} ELO</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 md:gap-8 text-sm md:text-base w-full lg:w-auto justify-between lg:justify-end">
                      <div className="text-center">
                        <div className="text-white font-bold text-lg md:text-xl">{friend.wins}</div>
                        <div className="text-[#9f9f9f] text-xs md:text-sm">Victorii</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold text-lg md:text-xl">{friend.winRate}%</div>
                        <div className="text-[#9f9f9f] text-xs md:text-sm">Win Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold text-lg md:text-xl">{friend.hsRate}%</div>
                        <div className="text-[#9f9f9f] text-xs md:text-sm">HS%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold text-lg md:text-xl">{friend.kdRatio}</div>
                        <div className="text-[#9f9f9f] text-xs md:text-sm">K/D</div>
                      </div>
                      
                      <div className="flex gap-2 md:gap-3">
                        <Button 
                          size="lg"
                          onClick={() => onShowPlayerDetails(friend)}
                          className={`bg-transparent border-2 ${getLevelBorder(friend.level || 0)} text-white hover:bg-[#ff6500] hover:border-[#ff6500] rounded-lg px-3 md:px-4 h-10 md:h-12 font-bold text-xs md:text-sm`}
                        >
                          Detalii
                        </Button>
                        <Button 
                          size="lg"
                          onClick={() => handleRemoveFriend(friend.player_id)}
                          className="bg-transparent border-2 border-red-400 text-red-400 hover:bg-red-500 hover:border-red-500 hover:text-white rounded-lg px-3 md:px-4 h-10 md:h-12 font-bold"
                        >
                          <Trash2 size={16} className="md:w-5 md:h-5" />
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
