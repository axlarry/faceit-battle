
import { Trophy, Globe } from "lucide-react";

interface LeaderboardHeaderProps {
  region: string;
}

export const LeaderboardHeader = ({ region }: LeaderboardHeaderProps) => {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300">
          <Trophy size={20} className="text-white" />
        </div>
      </div>
      
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
          Clasament {region}
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Globe size={14} />
          <span>Global Leaderboard</span>
        </div>
      </div>
    </div>
  );
};
