
import { Badge } from "@/components/ui/badge";
import { Player } from "@/types/Player";
import { useLcryptApi } from "@/hooks/useLcryptApi";

interface PlayerHeaderProps {
  player: Player;
}

export const PlayerHeader = ({ player }: PlayerHeaderProps) => {
  const { data: lcryptData } = useLcryptApi(player.nickname);

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
      
      {/* Level and Today Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-400">{player.level}</div>
          <div className="text-gray-400 text-sm">Nivel</div>
          <Badge className={`mt-2 bg-gradient-to-r ${getLevelColor(player.level || 0)} text-white border-0 text-xs`}>
            Skill Level {player.level}
          </Badge>
          {lcryptData && (
            <div className="mt-2 flex items-center justify-center gap-1">
              <span className="text-lg">{lcryptData.country_flag}</span>
              <span className="text-sm text-gray-300">#{lcryptData.country_ranking}</span>
            </div>
          )}
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
          {lcryptData?.today ? (
            <>
              <div className="text-lg font-bold text-green-400">
                {lcryptData.today.win}W / {lcryptData.today.lose}L
              </div>
              <div className="text-gray-400 text-xs">Astăzi</div>
              <div className="text-sm text-blue-400 mt-1">
                ELO: {lcryptData.today.elo > 0 ? '+' : ''}{lcryptData.today.elo}
              </div>
              <div className="text-xs text-gray-500">
                {lcryptData.today.count} meciuri
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-blue-400">{player.elo}</div>
              <div className="text-gray-400 text-sm">ELO Points</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
