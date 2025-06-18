
import { Trophy } from "lucide-react";
import { useState } from "react";

export const Header = () => {
  const [faceitIconError, setFaceitIconError] = useState(false);

  const handleFaceitIconError = () => {
    console.error('Failed to load Faceit icon from: /icons/faceit_icon.svg');
    setFaceitIconError(true);
  };

  return (
    <div className="relative bg-[#1a1d21] border-b border-[#2a2f36]">
      <div className="absolute inset-0 bg-gradient-to-r from-[#ff6500]/10 via-transparent to-[#ff6500]/10"></div>
      <div className="relative z-10 container mx-auto px-2 sm:px-4 py-3 sm:py-4 md:py-6 lg:py-8 max-w-7xl">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3 md:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-[#ff6500] rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
              <Trophy className="text-white w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#ff6500] flex items-center gap-2 sm:gap-3 md:gap-4">
              FACEIT
              {!faceitIconError ? (
                <img 
                  src="/icons/faceit_icon.svg" 
                  alt="Faceit" 
                  className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14"
                  onError={handleFaceitIconError}
                  onLoad={() => console.log('✅ Faceit icon loaded successfully from /icons/faceit_icon.svg')}
                />
              ) : null}
            </h1>
          </div>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[#b3b3b3] font-medium">
            Clasament Global cu Prieteni
          </p>
        </div>
      </div>
    </div>
  );
};
