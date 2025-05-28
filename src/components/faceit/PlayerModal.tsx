
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Player } from "@/pages/Index";
import { UserPlus, UserMinus, ExternalLink } from "lucide-react";

interface PlayerModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onAddFriend: (player: Player) => void;
  onRemoveFriend: (playerId: string) => void;
  isFriend: boolean;
}

export const PlayerModal = ({ 
  player, 
  isOpen, 
  onClose, 
  onAddFriend, 
  onRemoveFriend, 
  isFriend 
}: PlayerModalProps) => {
  if (!player) return null;

  const getLevelColor = (level: number) => {
    if (level >= 9) return 'from-red-500 to-red-600';
    if (level >= 7) return 'from-purple-500 to-purple-600';
    if (level >= 5) return 'from-blue-500 to-blue-600';
    if (level >= 3) return 'from-green-500 to-green-600';
    return 'from-gray-500 to-gray-600';
  };

  const handleFriendAction = () => {
    if (isFriend) {
      onRemoveFriend(player.player_id);
    } else {
      onAddFriend(player);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Profil Jucător
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Player Header */}
          <div className="text-center space-y-4">
            <img
              src={player.avatar}
              alt={player.nickname}
              className="w-24 h-24 rounded-full border-4 border-orange-400 mx-auto"
            />
            <div>
              <h2 className="text-3xl font-bold text-white">{player.nickname}</h2>
              {player.position && (
                <p className="text-orange-400 font-medium">#{player.position} în clasament</p>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-orange-400">{player.level}</div>
              <div className="text-gray-400">Nivel</div>
              <Badge className={`mt-2 bg-gradient-to-r ${getLevelColor(player.level || 0)} text-white border-0`}>
                Skill Level {player.level}
              </Badge>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{player.elo}</div>
              <div className="text-gray-400">ELO Points</div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-lg p-3 text-center border border-green-500/30">
              <div className="text-xl font-bold text-green-400">{player.wins}</div>
              <div className="text-gray-400 text-sm">Victorii</div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-lg p-3 text-center border border-blue-500/30">
              <div className="text-xl font-bold text-blue-400">{player.winRate}%</div>
              <div className="text-gray-400 text-sm">Win Rate</div>
            </div>
            
            <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-lg p-3 text-center border border-red-500/30">
              <div className="text-xl font-bold text-red-400">{player.hsRate}%</div>
              <div className="text-gray-400 text-sm">Headshot %</div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-lg p-3 text-center border border-purple-500/30">
              <div className="text-xl font-bold text-purple-400">{player.kdRatio}</div>
              <div className="text-gray-400 text-sm">K/D Ratio</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleFriendAction}
              className={`px-6 py-3 font-medium ${
                isFriend
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
              } text-white border-0`}
            >
              {isFriend ? (
                <>
                  <UserMinus size={16} className="mr-2" />
                  Șterge din Prieteni
                </>
              ) : (
                <>
                  <UserPlus size={16} className="mr-2" />
                  Adaugă la Prieteni
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white px-6 py-3"
              onClick={() => window.open(`https://www.faceit.com/en/players/${player.nickname}`, '_blank')}
            >
              <ExternalLink size={16} className="mr-2" />
              Vezi pe FACEIT
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
