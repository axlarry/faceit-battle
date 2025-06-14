
import { Badge } from "@/components/ui/badge";
import { Player } from "@/types/Player";

interface PlayerHeaderProps {
  player: Player;
}

export const PlayerHeader = ({ player }: PlayerHeaderProps) => {
  const getLevelColor = (level: number) => {
    if (level >= 9) return 'from-red-500 to-red-600';
    if (level >= 7) return 'from-purple-500 to-purple-600';
    if (level >= 5) return 'from-blue-500 to-blue-600';
    if (level >= 3) return 'from-green-500 to-green-600';
    return 'from-gray-500 to-gray-600';
  };

  return (
    <div className="text-center space-y-4">
      <img
        src={player.avatar}
        alt={player.nickname}
        className="w-20 h-20 rounded-full border-4 border-orange-400 mx-auto"
      />
      <div>
        <h2 className="text-2xl font-bold text-white">{player.nickname}</h2>
        {player.position && (
          <p className="text-orange-400 font-medium">#{player.position} în clasament</p>
        )}
      </div>
      
      {/* Level and ELO Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-400">{player.level}</div>
          <div className="text-gray-400 text-sm">Nivel</div>
          <Badge className={`mt-2 bg-gradient-to-r ${getLevelColor(player.level || 0)} text-white border-0 text-xs`}>
            Skill Level {player.level}
          </Badge>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{player.elo}</div>
          <div className="text-gray-400 text-sm">ELO Points</div>
        </div>
      </div>
    </div>
  );
};
