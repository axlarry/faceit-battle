
import { PlayerStatsRow } from "./PlayerStatsRow";

interface TeamPlayersSectionProps {
  players: any[];
  teamName: string;
  teamScore: number;
  teamColor: 'blue' | 'red';
}

export const TeamPlayersSection = ({ 
  players, 
  teamName, 
  teamScore, 
  teamColor 
}: TeamPlayersSectionProps) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-400',
    red: 'bg-red-500 text-red-400'
  };

  return (
    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 ${colorClasses[teamColor].split(' ')[0]} rounded-full`}></div>
        <h3 className="text-lg font-bold text-white">{teamName}</h3>
        <div className={`ml-auto text-2xl font-bold ${colorClasses[teamColor].split(' ')[1]}`}>
          {teamScore}
        </div>
      </div>
      <div className="space-y-2">
        {players.map((playerData, index) => (
          <PlayerStatsRow key={index} playerData={playerData} teamSide="left" />
        ))}
      </div>
    </div>
  );
};
