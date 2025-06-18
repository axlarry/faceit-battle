
interface LeaderboardHeaderProps {
  region: string;
}

export const LeaderboardHeader = ({ region }: LeaderboardHeaderProps) => {
  return (
    <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"></div>
      <span className="truncate">Clasament {region}</span>
    </h2>
  );
};
