
import { Trophy } from "lucide-react";

export const Header = () => {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-red-600/20 to-orange-600/20 backdrop-blur-sm"></div>
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <Trophy className="text-white" size={32} />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-orange-400 bg-clip-text text-transparent">
              FACEIT
            </h1>
          </div>
          <p className="text-xl text-gray-300 font-light">
            Clasament Global cu Prieteni
          </p>
        </div>
      </div>
    </div>
  );
};
