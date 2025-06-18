
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
    <div className="bg-[#2a2f36] rounded-lg p-4 border border-[#3a4048] shadow-lg">
      <div className="flex items-center justify-center space-x-4">
        {/* Cerc de încărcare animat */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-gray-600"></div>
          <div 
            className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"
            style={{
              background: `conic-gradient(from 0deg, transparent ${360 - (progress * 3.6)}deg, #f97316 ${360 - (progress * 3.6)}deg)`
            }}
          ></div>
          <LoaderCircle 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-orange-400 animate-spin" 
            size={20} 
          />
        </div>
        
        {/* Text și progres */}
        <div className="space-y-1">
          <p className="text-white font-medium text-sm">Se încarcă datele ELO...</p>
          <div className="flex items-center space-x-2">
            <div className="text-orange-400 text-sm font-bold">
              {Math.round(progress)}%
            </div>
            <span className="text-gray-300 text-xs">
              ({friendsCount} prieteni)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

ModernLoadingOverlay.displayName = 'ModernLoadingOverlay';
