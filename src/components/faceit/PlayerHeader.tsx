
import { Badge } from "@/components/ui/badge";
import { Player } from "@/types/Player";
import { useLcryptApi } from "@/hooks/useLcryptApi";
import { ArrowUp, ArrowDown } from 'lucide-react';

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
    if (!lcryptData?.today?.elo || lcryptData.today.elo === 0) return null;
    
    // Handle both string and number values for ELO change
    let eloChange = lcryptData.today.elo;
    
    // If it's a string like "+30" or "-43", parse it
    if (typeof eloChange === 'string') {
      eloChange = parseInt(eloChange);
    }
    
    const isPositive = eloChange > 0;
    const color = isPositive ? 'text-green-500' : 'text-red-500';
    const LightningIcon = isPositive ? ArrowUp : ArrowDown;
    
    // Format the ELO display correctly
    const displayValue = isPositive ? `+${eloChange}` : `${eloChange}`;
    
    return (
      <div className={`${color} text-base font-bold flex items-center gap-1 mt-1`}>
        <LightningIcon size={16} className={color} />
        <span>{displayValue} today</span>
      </div>
    );
  };

  return (
    <div className="text-center space-y-6">
      <img
        src={player.avatar}
        alt={player.nickname}
        className="w-28 h-28 rounded-full border-4 border-orange-400 mx-auto"
      />
      <div>
        <h2 className="text-3xl font-bold text-white">{player.nickname}</h2>
        {player.position && (
          <p className="text-orange-400 font-medium text-lg">#{player.position} în clasament</p>
        )}
      </div>
      
      {/* Level and Today Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-orange-400">{player.level}</div>
          <div className="text-gray-400 text-base">Nivel</div>
          <Badge className={`mt-2 bg-gradient-to-r ${getLevelColor(player.level || 0)} text-white border-0 text-sm px-3 py-1`}>
            Skill Level {player.level}
          </Badge>
          {lcryptData && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-xl">{lcryptData.country_flag}</span>
              <span className="text-base text-gray-300">#{lcryptData.country_ranking}</span>
            </div>
          )}
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          {lcryptData?.today ? (
            <>
              <div className="text-xl font-bold text-green-400">
                {lcryptData.today.win}W / {lcryptData.today.lose}L
              </div>
              <div className="text-gray-400 text-sm">Astăzi</div>
              {renderEloChange()}
              <div className="text-sm text-gray-500 mt-1">
                {lcryptData.today.count} meciuri
              </div>
            </>
          ) : (
            <>
              <div className="text-3xl font-bold text-blue-400">{player.elo}</div>
              <div className="text-gray-400 text-base">ELO Points</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
