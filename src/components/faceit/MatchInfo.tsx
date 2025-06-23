import { 
  Map, 
  Clock, 
  Calendar, 
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { formatDate, formatMatchDuration } from "@/utils/matchUtils";

interface MatchInfoProps {
  mapName: string;
  startedAt: number;
  finishedAt: number;
  eloChange: any;
}

export const MatchInfo = ({ mapName, startedAt, finishedAt, eloChange }: MatchInfoProps) => {
  return (
    <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-700">
      <div className="flex items-center gap-2">
        <Map className="w-4 h-4 text-orange-400" />
        <div>
          <div className="text-slate-400 text-xs">Map</div>
          <div className="text-white font-semibold">{mapName}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-blue-400" />
        <div>
          <div className="text-slate-400 text-xs">Date</div>
          <div className="text-white font-semibold text-sm">{formatDate(startedAt)}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-green-400" />
        <div>
          <div className="text-slate-400 text-xs">Duration</div>
          <div className="text-white font-semibold">{formatMatchDuration(startedAt, finishedAt)}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {eloChange && typeof eloChange.elo_change === 'number' ? (
          eloChange.elo_change > 0 ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : eloChange.elo_change < 0 ? (
            <TrendingDown className="w-4 h-4 text-red-400" />
          ) : (
            <Minus className="w-4 h-4 text-slate-400" />
          )
        ) : (
          <Minus className="w-4 h-4 text-slate-400" />
        )}
        <div>
          <div className="text-slate-400 text-xs">ELO Change</div>
          <div className={`font-semibold ${
            eloChange && typeof eloChange.elo_change === 'number' ? (
              eloChange.elo_change > 0 ? 'text-green-400' : 
              eloChange.elo_change < 0 ? 'text-red-400' : 'text-slate-400'
            ) : 'text-slate-400'
          }`}>
            {eloChange && typeof eloChange.elo_change === 'number' ? (
              `${eloChange.elo_change > 0 ? '+' : ''}${eloChange.elo_change}`
            ) : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};
