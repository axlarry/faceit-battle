
import React from 'react';
import { Play, Film, Calendar, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Recording } from '@/types/streaming';
import { recordingsService } from '@/services/recordingsService';
import { format } from 'date-fns';
import { Player } from '@/types/Player';
import { getProxiedImageUrl } from '@/lib/discordProxy';

interface RecordingsListProps {
  recordings: Recording[];
  groupedRecordings: Record<string, Recording[]>;
  friends: Player[];
  onPlay: (recording: Recording) => void;
}

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
    <div className="space-y-6">
      {Object.entries(groupedRecordings).map(([nickname, userRecordings]) => {
        const friend = getFriend(nickname);
        
        return (
          <div key={nickname} className="space-y-3">
            {/* User Header */}
            <div className="flex items-center gap-3">
              {friend?.avatar ? (
                <img 
                  src={getProxiedImageUrl(friend.avatar)} 
                  alt={nickname}
                  className="w-8 h-8 rounded-full border border-border"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs font-bold">{nickname[0]?.toUpperCase()}</span>
                </div>
              )}
              <span className="font-semibold text-foreground">{nickname}</span>
              <span className="text-muted-foreground text-sm">
                ({userRecordings.length} recording{userRecordings.length !== 1 ? 's' : ''})
              </span>
            </div>

            {/* Recordings Grid */}
            <div className="grid gap-2 pl-11">
              {userRecordings.slice(0, 5).map((recording) => (
                <div
                  key={recording.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:border-border transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar size={14} />
                      {format(recording.date, 'MMM d, HH:mm')}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <HardDrive size={14} />
                      {recordingsService.formatFileSize(recording.size)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onPlay(recording)}
                    className="gap-2 text-primary hover:text-primary"
                  >
                    <Play size={14} />
                    Play
                  </Button>
                </div>
              ))}
              {userRecordings.length > 5 && (
                <p className="text-muted-foreground text-sm text-center py-2">
                  +{userRecordings.length - 5} more recordings
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
