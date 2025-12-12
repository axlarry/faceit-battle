
import React from 'react';
import { Play, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StreamStatusBadge } from './StreamStatusBadge';
import { LiveStream } from '@/types/streaming';
import { Player } from '@/types/Player';
import { getProxiedImageUrl } from '@/lib/discordProxy';

interface LiveStreamCardProps {
  stream: LiveStream;
  friend?: Player;
  onWatch: (stream: LiveStream) => void;
}

export const LiveStreamCard = ({ stream, friend, onWatch }: LiveStreamCardProps) => {
  const rawAvatar = friend?.avatar || `https://ui-avatars.com/api/?name=${stream.nickname}&background=random`;
  const avatar = getProxiedImageUrl(rawAvatar);
  const level = friend?.level;

  return (
    <div className={`
      relative p-4 rounded-xl border transition-all duration-300
      ${stream.isLive 
        ? 'bg-gradient-to-br from-red-500/10 to-orange-500/5 border-red-500/30 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/10' 
        : 'bg-card/40 border-border/50 hover:border-border'
      }
    `}>
      {/* Avatar & Info */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <img 
            src={avatar} 
            alt={stream.nickname}
            className="w-12 h-12 rounded-full object-cover border-2 border-border"
          />
          {level && (
            <img
              src={`/faceit-icons/skill-level-${level}.png`}
              alt={`Level ${level}`}
              className="absolute -bottom-1 -right-1 w-5 h-5"
            />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground truncate">{stream.nickname}</h3>
          <div className="flex items-center gap-2">
            <StreamStatusBadge isLive={stream.isLive} size="sm" />
            {stream.isLive && stream.viewers > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users size={12} />
                {stream.viewers}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Watch Button */}
      {stream.isLive && (
        <Button 
          onClick={() => onWatch(stream)}
          className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-semibold"
          size="sm"
        >
          <Play size={16} className="mr-2" />
          Watch Stream
        </Button>
      )}

      {/* Live pulse effect */}
      {stream.isLive && (
        <div className="absolute top-2 right-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" />
          <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full" />
        </div>
      )}
    </div>
  );
};
