
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

interface MatchHeaderProps {
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  isWin: boolean | null;
}

export const MatchHeader = ({ 
  team1Name, 
  team2Name, 
  team1Score, 
  team2Score, 
  isWin 
}: MatchHeaderProps) => {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        {/* Team 1 */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-white mb-1">{team1Name}</div>
            <div className="text-slate-400 text-sm">Team</div>
          </div>
          <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-slate-400" />
          </div>
        </div>

        {/* Match Score & Status */}
        <div className="text-center px-8">
          <div className="flex items-center gap-4 mb-2">
            <div className={`text-4xl font-bold ${team1Score > team2Score ? 'text-green-400' : 'text-red-400'}`}>
              {team1Score}
            </div>
            <div className="text-2xl text-slate-400">:</div>
            <div className={`text-4xl font-bold ${team2Score > team1Score ? 'text-green-400' : 'text-red-400'}`}>
              {team2Score}
            </div>
          </div>
          <Badge className={`${
            isWin 
              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border-red-500/30'
          } border font-semibold px-4 py-1`}>
            {isWin ? 'VICTORY' : 'DEFEAT'}
          </Badge>
        </div>

        {/* Team 2 */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-slate-400" />
          </div>
          <div className="text-left">
            <div className="text-2xl font-bold text-white mb-1">{team2Name}</div>
            <div className="text-slate-400 text-sm">Team</div>
          </div>
        </div>
      </div>
    </div>
  );
};
