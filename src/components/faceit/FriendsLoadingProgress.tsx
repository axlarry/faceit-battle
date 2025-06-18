
import React from 'react';
import { Progress } from "@/components/ui/progress";

interface FriendsLoadingProgressProps {
  isLoading: boolean;
  progress: number;
  friendsCount: number;
}

export const FriendsLoadingProgress = React.memo(({ 
  isLoading, 
  progress, 
  friendsCount 
}: FriendsLoadingProgressProps) => {
  if (!isLoading || friendsCount === 0) {
    return null;
  }

  return (
    <div className="mb-4 space-y-2">
      <div className="flex justify-between text-sm text-[#9f9f9f]">
        <span>Se încarcă datele ELO...</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
});

FriendsLoadingProgress.displayName = 'FriendsLoadingProgress';
