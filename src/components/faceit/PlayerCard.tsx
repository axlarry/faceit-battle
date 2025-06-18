
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Player } from "@/types/Player";
import { PlayerStats } from "./PlayerStats";

interface PlayerCardProps {
  player: Player;
  onShowPlayerDetails: (player: Player) => void;
  onAddFriend: (player: Player) => void;
}

export const PlayerCard = ({ player, onShowPlayerDetails, onAddFriend }: PlayerCardProps) => {
  const getLevelColor = (level: number) => {
    if (level >= 9) return 'from-red-500 to-red-600';
    if (level >= 7) return 'from-purple-500 to-purple-600';
    if (level >= 5) return 'from-blue-500 to-blue-600';
    if (level >= 3) return 'from-green-500 to-green-600';
    return 'from-gray-500 to-gray-600';
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto min-w-0">
          <div className="text-lg sm:text-2xl font-bold text-orange-400 min-w-[2rem] sm:min-w-[3rem] flex-shrink-0">
            #{player.position}
          </div>
          
          <img
            src={player.avatar}
            alt={player.nickname}
            className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-orange-400 flex-shrink-0"
          />
          
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-lg font-semibold text-white truncate">{player.nickname}</h3>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
              <Badge className={`bg-gradient-to-r ${getLevelColor(player.level || 0)} text-white border-0 text-xs px-1 sm:px-2 py-0.5`}>
                Nivel {player.level}
              </Badge>
              <span className="text-orange-400 font-medium text-xs sm:text-sm">{player.elo} ELO</span>
            </div>
          </div>
        </div>

        <PlayerStats 
          wins={player.wins}
          winRate={player.winRate}
          hsRate={player.hsRate}
          kdRatio={player.kdRatio}
        />
        
        <div className="flex gap-1 sm:gap-2">
          <Button 
            size="sm"
            variant="outline"
            onClick={() => onShowPlayerDetails(player)}
            className="border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white text-xs px-2 sm:px-3 h-6 sm:h-8"
          >
            <span className="hidden sm:inline">Detalii</span>
            <span className="sm:hidden">Info</span>
          </Button>
          <Button 
            size="sm"
            variant="outline"
            onClick={() => onAddFriend(player)}
            className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white text-xs px-2 sm:px-3 h-6 sm:h-8"
          >
            <span className="hidden sm:inline">Adaugă</span>
            <span className="sm:hidden">+</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
