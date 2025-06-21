
import React, { useEffect } from 'react';
import { useDiscord } from '@/contexts/DiscordContext';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users } from 'lucide-react';

interface DiscordActivityStatusProps {
  currentSection?: string;
  livePlayersCount?: number;
  totalFriendsCount?: number;
}

export const DiscordActivityStatus = ({ 
  currentSection = 'FRIENDS',
  livePlayersCount = 0,
  totalFriendsCount = 0
}: DiscordActivityStatusProps) => {
  const { isInDiscord, updateActivity, auth } = useDiscord();

  useEffect(() => {
    if (!isInDiscord) return;

    const activity = {
      state: `${currentSection} - ${totalFriendsCount} prieteni`,
      details: livePlayersCount > 0 ? `${livePlayersCount} joacă live` : 'Monitorizează statistici',
      timestamps: {
        start: Date.now()
      },
      assets: {
        large_image: 'faceit_logo',
        large_text: 'LaCurte.ro Faceit Tools',
        small_image: livePlayersCount > 0 ? 'live_icon' : 'stats_icon',
        small_text: livePlayersCount > 0 ? 'Live matches' : 'Viewing stats'
      }
    };

    updateActivity(activity);
  }, [currentSection, livePlayersCount, totalFriendsCount, isInDiscord, updateActivity]);

  if (!isInDiscord) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-[#5865f2]/10 border border-[#5865f2]/20 rounded-lg">
      <MessageSquare className="w-4 h-4 text-[#5865f2]" />
      <span className="text-[#5865f2] text-sm font-medium">Discord Activity</span>
      {auth?.user && (
        <Badge variant="outline" className="border-[#5865f2]/30 text-[#5865f2] text-xs">
          {auth.user.username}
        </Badge>
      )}
    </div>
  );
};
