
import React from 'react';
import { Users } from 'lucide-react';
import { StreamStatusBadge } from './StreamStatusBadge';
import { MiniStreamPlayer } from './MiniStreamPlayer';
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
      relative rounded-xl border transition-all duration-300 overflow-hidden
      ${stream.isLive 
        ? 'bg-gradient-to-br from-red-500/10 to-orange-500/5 border-red-500/30 hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/10' 
        : 'bg-card/40 border-border/50 hover:border-border p-4'
      }
    `}>
      {/* Mini Video Player for Live Streams */}
      {stream.isLive && stream.streamUrl && (
        <MiniStreamPlayer
          streamUrl={stream.streamUrl}
          nickname={stream.nickname}
          onClick={() => onWatch(stream)}
        />
      )}

      {/* Offline Card - shows avatar */}
      {!stream.isLive && (
        <>
          <div className="flex items-center gap-3">
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
              <StreamStatusBadge isLive={stream.isLive} size="sm" />
            </div>
          </div>
        </>
      )}

      {/* Viewer count overlay for live streams */}
      {stream.isLive && stream.viewers > 0 && (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded text-xs text-white flex items-center gap-1">
          <Users size={12} />
          {stream.viewers}
        </div>
      )}
    </div>
  );
};
