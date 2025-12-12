import React, { useState } from 'react';
import { Play, Film, Calendar, HardDrive, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Recording } from '@/types/streaming';
import { recordingsService } from '@/services/recordingsService';
import { format } from 'date-fns';
import { Player } from '@/types/Player';
import { getProxiedImageUrl, getLacurteBaseUrl } from '@/lib/discordProxy';

interface RecordingsListProps {
  recordings: Recording[];
  groupedRecordings: Record<string, Recording[]>;
  friends: Player[];
  onPlay: (recording: Recording) => void;
}

const formatDuration = (seconds?: number): string => {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const RecordingThumbnail = ({ recording, onClick }: { recording: Recording; onClick: () => void }) => {
  const [imageError, setImageError] = useState(false);
  const thumbnailUrl = recording.thumbnailUrl 
    ? `${getLacurteBaseUrl()}${recording.thumbnailUrl}`
    : null;

  return (
    <div 
      className="relative aspect-video bg-muted/50 rounded-lg overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      {thumbnailUrl && !imageError ? (
        <img 
          src={thumbnailUrl}
          alt={recording.filename}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/60">
          <Film className="text-muted-foreground/50" size={32} />
        </div>
      )}
      
      {/* Play overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
          <Play className="text-primary-foreground ml-1" size={20} fill="currentColor" />
        </div>
      </div>

      {/* Duration badge */}
      {recording.duration && (
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
          {formatDuration(recording.duration)}
        </div>
      )}

      {/* Size badge */}
      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
        {recordingsService.formatFileSize(recording.size)}
      </div>
    </div>
  );
};

export const RecordingsList = ({ recordings, groupedRecordings, friends, onPlay }: RecordingsListProps) => {
  const getFriend = (nickname: string) => 
    friends.find(f => f.nickname.toLowerCase() === nickname.toLowerCase());

  if (recordings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <Film className="text-muted-foreground" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Recordings Yet</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          Recordings will appear here when friends finish streaming.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedRecordings).map(([nickname, userRecordings]) => {
        const friend = getFriend(nickname);
        
        return (
          <div key={nickname} className="space-y-4">
            {/* User Header */}
            <div className="flex items-center gap-3">
              {friend?.avatar ? (
                <img 
                  src={getProxiedImageUrl(friend.avatar)} 
                  alt={nickname}
                  className="w-10 h-10 rounded-full border-2 border-border"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm font-bold">{nickname[0]?.toUpperCase()}</span>
                </div>
              )}
              <div>
                <span className="font-semibold text-foreground">{nickname}</span>
                <span className="text-muted-foreground text-sm ml-2">
                  {userRecordings.length} recording{userRecordings.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Recordings Grid with Thumbnails */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {userRecordings.slice(0, 8).map((recording) => (
                <div key={recording.id} className="space-y-2">
                  <RecordingThumbnail 
                    recording={recording} 
                    onClick={() => onPlay(recording)} 
                  />
                  <div className="flex items-center gap-2 text-muted-foreground text-xs px-1">
                    <Calendar size={12} />
                    {format(recording.date, 'MMM d, yyyy • HH:mm')}
                  </div>
                </div>
              ))}
            </div>
            
            {userRecordings.length > 8 && (
              <p className="text-muted-foreground text-sm text-center py-2">
                +{userRecordings.length - 8} more recordings
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
