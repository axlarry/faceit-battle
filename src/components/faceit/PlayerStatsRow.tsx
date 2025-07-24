
import { Star } from "lucide-react";
import { getKDA } from "@/utils/playerDataUtils";
import { getKDRatio, getHeadshotPercentage, getADR } from "@/utils/statsUtils";

interface PlayerStatsRowProps {
  playerData: any;
  teamSide: 'left' | 'right';
}

export const PlayerStatsRow = ({ playerData, teamSide }: PlayerStatsRowProps) => {
  const kda = getKDA(playerData.stats);
  
  return (
    <div className={`flex items-center py-3 px-4 bg-slate-800/50 rounded-lg border border-slate-700/50 ${
      playerData.isCurrentPlayer ? 'ring-2 ring-orange-500/50 bg-orange-500/10' : ''
    }`}>
      {/* Player Info */}
      <div className="flex items-center gap-3 min-w-[180px]">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
          playerData.isCurrentPlayer 
            ? 'bg-orange-500 text-white' 
            : 'bg-slate-600 text-slate-200'
        }`}>
          {playerData.nickname.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className={`font-semibold text-sm flex items-center gap-1 ${
            playerData.isCurrentPlayer ? 'text-orange-400' : 'text-white'
          }`}>
            {playerData.nickname}
            {playerData.isCurrentPlayer && <Star className="w-3 h-3 fill-orange-400" />}
          </div>
          <div className="text-xs text-slate-400">
            Level {playerData.skill_level || '-'}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 ml-auto text-xs">
        <div className="text-center">
          <div className="text-slate-400 mb-1">K/D</div>
          <div className="text-white font-semibold">{getKDRatio(playerData.stats)}</div>
        </div>
        <div className="text-center">
          <div className="text-slate-400 mb-1">K</div>
          <div className="text-green-400 font-semibold">{kda.kills}</div>
        </div>
        <div className="text-center">
          <div className="text-slate-400 mb-1">A</div>
          <div className="text-blue-400 font-semibold">{kda.assists}</div>
        </div>
        <div className="text-center">
          <div className="text-slate-400 mb-1">D</div>
          <div className="text-red-400 font-semibold">{kda.deaths}</div>
        </div>
        <div className="text-center">
          <div className="text-slate-400 mb-1">HS%</div>
          <div className="text-purple-400 font-semibold">{getHeadshotPercentage(playerData.stats)}%</div>
        </div>
        <div className="text-center">
          <div className="text-slate-400 mb-1">ADR</div>
          <div className="text-yellow-400 font-semibold">{getADR(playerData.stats)}</div>
        </div>
      </div>
    </div>
  );
};
