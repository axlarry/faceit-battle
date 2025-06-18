
import { Badge } from "@/components/ui/badge";
import { Player } from "@/types/Player";
import { useLcryptApi } from "@/hooks/useLcryptApi";
import { ArrowUp, ArrowDown, Trophy, Target } from 'lucide-react';

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

  const renderEloChange = () => {
    if (!lcryptData?.today?.present) return null;
    
    let eloChange = lcryptData.today.elo;
    
    if (typeof eloChange === 'string') {
      eloChange = parseInt(eloChange);
    }
    
    const isPositive = eloChange > 0;
    const color = isPositive ? 'text-green-400' : 'text-red-400';
    const bgColor = isPositive ? 'bg-green-500/20' : 'bg-red-500/20';
    const LightningIcon = isPositive ? ArrowUp : ArrowDown;
    
    const displayValue = isPositive ? `+${eloChange}` : `${eloChange}`;
    
    return (
      <div className={`${bgColor} rounded-lg p-2 mt-2 border ${isPositive ? 'border-green-500/30' : 'border-red-500/30'} animate-pulse`}>
        <div className={`${color} text-lg font-bold flex items-center justify-center gap-2`}>
          <LightningIcon size={20} className={`${color} animate-bounce`} />
          <span>{displayValue} ELO</span>
        </div>
        <div className="text-gray-400 text-xs text-center mt-1">
          Schimbare astăzi
        </div>
      </div>
    );
  };

  const renderTodayStats = () => {
    if (!lcryptData?.today?.present) return null;
    
    const wins = lcryptData.today.win || 0;
    const losses = lcryptData.today.lose || 0;
    const totalGames = lcryptData.today.count || 0;
    const eloWin = lcryptData.today.elo_win || 0;
    const eloLose = lcryptData.today.elo_lose || 0;
    
    return (
      <div className="space-y-3">
        {/* Win/Loss Stats */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-bold text-lg">{wins}W</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-400 font-bold text-lg">{losses}L</span>
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* ELO Details */}
        {(eloWin > 0 || eloLose > 0) && (
          <div className="bg-[#1a1d21] rounded-lg p-2 space-y-1">
            {eloWin > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">ELO câștigat:</span>
                <span className="text-green-400 font-bold">+{eloWin}</span>
              </div>
            )}
            {eloLose > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">ELO pierdut:</span>
                <span className="text-red-400 font-bold">-{eloLose}</span>
              </div>
            )}
          </div>
        )}
        
        <div className="text-center">
          <div className="text-xs text-gray-500">
            Total: {totalGames} meciuri astăzi
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="text-center space-y-6">
      <img
        src={player.avatar}
        alt={player.nickname}
        className="w-28 h-28 rounded-full border-4 border-orange-400 mx-auto animate-fade-in"
      />
      <div>
        <h2 className="text-3xl font-bold text-white">{player.nickname}</h2>
        {player.position && (
          <p className="text-orange-400 font-medium text-lg">#{player.position} în clasament</p>
        )}
      </div>
      
      {/* Enhanced Level and Today Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Level Card - Enhanced with animations */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20 hover:border-orange-400/50 transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="text-orange-400 animate-pulse" size={20} />
            <div className="text-3xl font-bold text-orange-400">{player.level}</div>
          </div>
          <div className="text-gray-400 text-base mb-3">Skill Level</div>
          
          <Badge className={`bg-gradient-to-r ${getLevelColor(player.level || 0)} text-white border-0 text-sm px-3 py-1 animate-fade-in`}>
            Level {player.level}
          </Badge>
          
          {/* Country Stats */}
          {lcryptData && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-center gap-2 bg-[#1a1d21] rounded-lg p-2">
                <span className="text-2xl animate-bounce">{lcryptData.country_flag}</span>
                <div className="text-left">
                  <div className="text-orange-400 font-bold">#{lcryptData.country_ranking}</div>
                  <div className="text-xs text-gray-400">Rank țară</div>
                </div>
              </div>
              {lcryptData.region_ranking && (
                <div className="flex items-center justify-center gap-2 bg-[#1a1d21] rounded-lg p-2">
                  <Target className="text-blue-400" size={16} />
                  <div className="text-left">
                    <div className="text-blue-400 font-bold">#{lcryptData.region_ranking}</div>
                    <div className="text-xs text-gray-400">Rank regiune</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Today Stats Card - Enhanced with detailed ELO tracking */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20 hover:border-green-400/50 transition-all duration-300 transform hover:scale-105">
          {lcryptData?.today?.present ? (
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                <div className="text-gray-400 text-sm font-medium">Astăzi</div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
              </div>
              
              {renderTodayStats()}
              {renderEloChange()}
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-blue-400 animate-fade-in">{player.elo}</div>
              <div className="text-gray-400 text-base">ELO Points</div>
              <div className="mt-2 text-xs text-gray-500">
                Fără date pentru astăzi
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
