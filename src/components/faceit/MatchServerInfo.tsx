
import { Trophy } from "lucide-react";

interface MatchServerInfoProps {
  gameMode: string;
  competitionName: string;
}

export const MatchServerInfo = ({ gameMode, competitionName }: MatchServerInfoProps) => {
  return (
    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700 text-center">
      <div className="flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-slate-400">Server:</span>
          <span className="text-white font-semibold">{gameMode}</span>
        </div>
        <div className="w-px h-4 bg-slate-600"></div>
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="text-slate-400">Competition:</span>
          <span className="text-white font-semibold">{competitionName}</span>
        </div>
      </div>
    </div>
  );
};
