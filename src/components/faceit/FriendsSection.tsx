import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Player } from "@/types/Player";
import { UserPlus, Users, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useFriendsAutoUpdate } from "@/hooks/useFriendsAutoUpdate";
import { PasswordDialog } from "./PasswordDialog";
import { useFaceitApi } from "@/hooks/useFaceitApi";
import { supabase } from "@/integrations/supabase/client";

interface FriendsSectionProps {
  friends: Player[];
  onAddFriend: (player: Player) => void;
  onRemoveFriend: (playerId: string) => void;
  onShowPlayerDetails: (player: Player) => void;
  onUpdateFriend?: (player: Player) => void;
  onReloadFriends?: () => void;
}

interface FriendWithLcrypt extends Player {
  lcryptData?: any;
}

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
  const [flashingPlayer, setFlashingPlayer] = useState<string | null>(null);
  const [friendsWithLcrypt, setFriendsWithLcrypt] = useState<FriendWithLcrypt[]>([]);

  const { makeApiCall } = useFaceitApi();

  // Auto-update friends data every 5 minutes
  const { isUpdating, updateAllFriends } = useFriendsAutoUpdate({
    friends,
    updateFriend: onUpdateFriend || (() => {}),
    reloadFriends: onReloadFriends || (() => {}),
    enabled: true
  });

  // Load Lcrypt data for each friend
  React.useEffect(() => {
    const loadLcryptData = async () => {
      if (friends.length === 0) {
        setFriendsWithLcrypt([]);
        return;
      }

      console.log('Loading lcrypt data for friends:', friends.map(f => f.nickname));
      
      const updatedFriends = await Promise.all(
        friends.map(async (friend) => {
          try {
            console.log(`Fetching ELO data for nickname: ${friend.nickname}`);
            
            const { data: result, error: supabaseError } = await supabase.functions.invoke('get-lcrypt-elo', {
              body: { nickname: friend.nickname }
            });

            if (supabaseError) {
              console.error('Supabase error for', friend.nickname, ':', supabaseError);
              return { ...friend, lcryptData: null };
            }

            if (result?.error) {
              console.error('Lcrypt API error for', friend.nickname, ':', result.error);
              return { ...friend, lcryptData: null };
            }

            console.log('Lcrypt data received for', friend.nickname, ':', result);
            return { ...friend, lcryptData: result };
          } catch (error) {
            console.error('Error fetching lcrypt data for', friend.nickname, ':', error);
            return { ...friend, lcryptData: null };
          }
        })
      );
      
      console.log('All friends with lcrypt data:', updatedFriends);
      setFriendsWithLcrypt(updatedFriends);
    };

    loadLcryptData();
  }, [friends]);

  const searchPlayer = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const playerData = await makeApiCall(`/players?nickname=${encodeURIComponent(searchTerm.trim())}`);
      const statsData = await makeApiCall(`/players/${playerData.player_id}/stats/cs2`);

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

  const handlePlayerClick = (player: Player) => {
    setFlashingPlayer(player.player_id);
    setTimeout(() => {
      setFlashingPlayer(null);
      onShowPlayerDetails(player);
    }, 200);
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

  const renderEloChange = (lcryptData: any) => {
    console.log('Rendering ELO change for lcryptData:', lcryptData);
    
    if (!lcryptData?.today?.present) {
      console.log('No today data present');
      return null;
    }
    
    const eloWin = lcryptData.today.elo_win || 0;
    const eloLose = lcryptData.today.elo_lose || 0;
    const totalChange = eloWin + eloLose;
    
    console.log('ELO changes - Win:', eloWin, 'Lose:', eloLose, 'Total:', totalChange);
    
    if (totalChange === 0) {
      console.log('Total change is 0, not showing');
      return null;
    }
    
    const isPositive = totalChange > 0;
    const color = isPositive ? 'text-green-400' : 'text-red-400';
    const arrow = isPositive ? '↑' : '↓';
    
    return (
      <div className={`${color} font-bold text-sm animate-pulse flex items-center gap-1`}>
        <span>{arrow}</span>
        <span>{Math.abs(totalChange)}</span>
      </div>
    );
  };

  const sortedFriends = [...friendsWithLcrypt].sort((a, b) => (b.elo || 0) - (a.elo || 0));

  return (
    <div className="space-y-4 px-4 md:px-0">
      {/* Friends List - Compact Version */}
      <Card className="bg-[#1a1d21] border-[#2a2f36] shadow-xl">
        <div className="p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-5 gap-4">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-[#ff6500] rounded-lg flex items-center justify-center shadow-lg">
                <Users size={16} className="md:w-5 md:h-5 text-white" />
              </div>
              <span className="text-lg md:text-2xl">Prietenii Mei ({friends.length})</span>
            </h2>
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
              <span className="text-xs text-[#9f9f9f]">
                Actualizare automată la 5 min
              </span>
              <Button
                onClick={updateAllFriends}
                disabled={isUpdating}
                size="sm"
                className="bg-transparent border-2 border-[#ff6500] text-[#ff6500] hover:bg-[#ff6500] hover:text-white rounded-lg h-8 px-3 font-bold text-sm"
              >
                <RefreshCw size={14} className={`mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
                {isUpdating ? 'Actualizare...' : 'Actualizează acum'}
              </Button>
            </div>
          </div>

          {/* Quick Search for Adding Friends */}
          <div className="mb-4 p-3 bg-[#2a2f36] rounded-lg border border-[#3a4048]">
            <div className="flex flex-col md:flex-row gap-3">
              <Input
                placeholder="Caută și adaugă prieteni..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchPlayer()}
                className="bg-[#1a1d21] border-[#3a4048] text-white placeholder:text-[#9f9f9f] focus:border-[#ff6500] rounded-lg h-8 text-sm"
              />
              <Button
                onClick={searchPlayer}
                disabled={loading || !searchTerm.trim()}
                size="sm"
                className="bg-[#ff6500] hover:bg-[#e55a00] text-white border-0 px-4 h-8 rounded-lg shadow-lg font-bold text-sm"
              >
                <UserPlus size={14} className="mr-2" />
                {loading ? 'Caută...' : 'Adaugă'}
              </Button>
            </div>
          </div>
          
          {friends.length === 0 ? (
            <div className="text-center py-8 md:py-10">
              <div className="w-16 h-16 md:w-18 md:h-18 bg-[#ff6500] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users size={28} className="md:w-9 md:h-9 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2">Niciun prieten adăugat</h3>
              <p className="text-[#9f9f9f] text-sm md:text-base mb-4">Caută și adaugă prieteni pentru a-i vedea în clasamentul tău personal!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedFriends.map((friend, index) => (
                <div
                  key={friend.player_id}
                  onClick={() => handlePlayerClick(friend)}
                  className={`bg-[#2a2f36] rounded-lg p-3 border border-[#3a4048] hover:border-[#ff6500]/50 transition-all duration-300 shadow-lg cursor-pointer transform hover:scale-[1.01] ${
                    flashingPlayer === friend.player_id ? 'animate-pulse bg-[#ff6500]/20 border-[#ff6500]' : ''
                  }`}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-4">
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                      <div className="text-lg font-bold text-[#ff6500] min-w-[2.5rem]">
                        #{index + 1}
                      </div>
                      
                      <img
                        src={friend.avatar}
                        alt={friend.nickname}
                        className="w-10 h-10 rounded-lg border-2 border-[#ff6500] shadow-lg"
                      />
                      
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-white truncate">{friend.nickname}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge className={`${getLevelColor(friend.level || 0)} text-white border-0 px-2 py-1 text-xs`}>
                            Nivel {friend.level}
                          </Badge>
                          <span className="text-[#ff6500] font-bold text-sm">{friend.elo} ELO</span>
                          {renderEloChange(friend.lcryptData)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs w-full lg:w-auto justify-between lg:justify-end">
                      <div className="text-center">
                        <div className="text-white font-bold text-sm">{friend.wins}</div>
                        <div className="text-[#9f9f9f] text-xs">Victorii</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold text-sm">{friend.winRate}%</div>
                        <div className="text-[#9f9f9f] text-xs">Win Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold text-sm">{friend.hsRate}%</div>
                        <div className="text-[#9f9f9f] text-xs">HS%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-bold text-sm">{friend.kdRatio}</div>
                        <div className="text-[#9f9f9f] text-xs">K/D</div>
                      </div>
                      
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={`https://www.faceit.com/en/players/${friend.nickname}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-transparent border-2 border-[#ff6500] text-[#ff6500] hover:bg-[#ff6500] hover:text-white rounded-lg px-3 h-7 font-bold text-xs flex items-center gap-1 transition-all duration-200 hover:scale-105"
                        >
                          <ExternalLink size={11} />
                          Faceit
                        </a>
                        <a
                          href={`https://steamcommunity.com/search/users/#text=${friend.nickname}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-transparent border-2 border-blue-400 text-blue-400 hover:bg-blue-500 hover:border-blue-500 hover:text-white rounded-lg px-3 h-7 font-bold text-xs flex items-center gap-1 transition-all duration-200 hover:scale-105"
                        >
                          <ExternalLink size={11} />
                          Steam
                        </a>
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
