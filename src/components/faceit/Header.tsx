
import { Trophy } from "lucide-react";

export const Header = () => {
  return (
    <div className="relative bg-[#1a1d21] border-b border-[#2a2f36]">
      <div className="absolute inset-0 bg-gradient-to-r from-[#ff6500]/10 via-transparent to-[#ff6500]/10"></div>
      <div className="relative z-10 container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 md:gap-4 mb-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-[#ff6500] rounded-xl flex items-center justify-center shadow-lg">
              <Trophy className="text-white w-6 h-6 md:w-8 md:h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-[#ff6500]">
              FACEIT
            </h1>
          </div>
          <p className="text-lg md:text-xl text-[#b3b3b3] font-medium">
            Clasament Global cu Prieteni
          </p>
        </div>
      </div>
    </div>
  );
};
