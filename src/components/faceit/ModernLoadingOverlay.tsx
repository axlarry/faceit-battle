
import React from 'react';
import { LoaderCircle } from 'lucide-react';

interface ModernLoadingOverlayProps {
  isLoading: boolean;
  progress: number;
  friendsCount: number;
}

export const ModernLoadingOverlay = React.memo(({ 
  isLoading, 
  progress, 
  friendsCount 
}: ModernLoadingOverlayProps) => {
  if (!isLoading || friendsCount === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
      <div className="text-center space-y-4">
        {/* Cerc de încărcare animat */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-gray-600"></div>
          <div 
            className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"
            style={{
              background: `conic-gradient(from 0deg, transparent ${360 - (progress * 3.6)}deg, #f97316 ${360 - (progress * 3.6)}deg)`
            }}
          ></div>
          <LoaderCircle 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-orange-400 animate-spin" 
            size={24} 
          />
        </div>
        
        {/* Text și progres */}
        <div className="space-y-2">
          <p className="text-white font-medium">Se încarcă datele ELO...</p>
          <div className="text-orange-400 text-sm font-bold">
            {Math.round(progress)}%
          </div>
          <p className="text-gray-300 text-xs">
            Optimizând pentru {friendsCount} prieteni
          </p>
        </div>
      </div>
    </div>
  );
});

ModernLoadingOverlay.displayName = 'ModernLoadingOverlay';
