
import React, { useState } from 'react';
import { RefreshCw, Radio, Film, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiveStreamCard } from './LiveStreamCard';
import { LiveStreamPlayer } from './LiveStreamPlayer';
import { RecordingPlayer } from './RecordingPlayer';
import { useLiveStreams } from '@/hooks/useLiveStreams';
import { useRecordings } from '@/hooks/useRecordings';
import { LiveStream, Recording } from '@/types/streaming';
import { Player } from '@/types/Player';
import { PasswordDialog } from '@/components/faceit/PasswordDialog';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { recordingsService } from '@/services/recordingsService';
import { getProxiedImageUrl, getLacurteBaseUrl } from '@/lib/discordProxy';

interface LiveStreamsTabProps {
  friends: Player[];
}

export const LiveStreamsTab = ({ friends }: LiveStreamsTabProps) => {
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [isRecordingPlayerOpen, setIsRecordingPlayerOpen] = useState(false);
  const [recordingToDelete, setRecordingToDelete] = useState<Recording | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const { 
    liveStreamsList, 
    liveCount,
    isLoading, 
    refresh 
  } = useLiveStreams({ friends });

  const {
    recordings,
    groupedRecordings,
    isLoading: isLoadingRecordings,
    refresh: refreshRecordings,
  } = useRecordings();

  const getFriend = (nickname: string) => 
    friends.find(f => f.nickname.toLowerCase() === nickname.toLowerCase());

  const handleWatch = (stream: LiveStream) => {
    setSelectedStream(stream);
    setIsPlayerOpen(true);
  };

  const handleClosePlayer = () => {
    setIsPlayerOpen(false);
    setSelectedStream(null);
  };

  const handlePlayRecording = (recording: Recording) => {
    setSelectedRecording(recording);
    setIsRecordingPlayerOpen(true);
  };

  const handleCloseRecordingPlayer = () => {
    setIsRecordingPlayerOpen(false);
    setSelectedRecording(null);
  };

  const handleDeleteRecording = (recording: Recording) => {
    setRecordingToDelete(recording);
    setIsPasswordDialogOpen(true);
  };

  const handleConfirmDelete = async (password: string) => {
    if (!recordingToDelete) return;

    try {
      const response = await fetch(`${getLacurteBaseUrl()}/delete-recording.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: recordingToDelete.filename,
          nickname: recordingToDelete.nickname,
          adminPassword: password
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Înregistrare ștearsă",
          description: `${recordingToDelete.nickname} - ${format(recordingToDelete.date, 'MMM d, HH:mm')}`,
        });
        refreshRecordings();
      } else {
        toast({
          title: "Eroare",
          description: result.error || "Nu s-a putut șterge înregistrarea",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge înregistrarea",
        variant: "destructive",
      });
    }

    setRecordingToDelete(null);
  };

  const handleRefreshAll = () => {
    refresh();
    refreshRecordings();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* Twitch-style Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-foreground">Live</h1>
          {liveCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white text-sm font-bold rounded-md">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              {liveCount} LIVE
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefreshAll}
          disabled={isLoading || isLoadingRecordings}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw size={16} className={(isLoading || isLoadingRecordings) ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* Content */}
      {isLoading && friends.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : friends.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-4">
            <Users className="text-muted-foreground" size={40} />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Niciun prieten adăugat</h2>
          <p className="text-muted-foreground max-w-md">
            Adaugă prieteni pentru a vedea când sunt live.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Live Streams Section - Twitch Style */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Radio className="text-red-500" size={20} />
              <h2 className="text-lg font-semibold text-foreground">
                Canale Live
              </h2>
            </div>

            {liveStreamsList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {liveStreamsList.map((stream) => (
                  <LiveStreamCard
                    key={stream.nickname}
                    stream={stream}
                    friend={getFriend(stream.nickname)}
                    onWatch={handleWatch}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center border border-border/50 rounded-xl bg-card/30">
                <Radio className="text-muted-foreground mx-auto mb-3" size={32} />
                <p className="text-muted-foreground">Nimeni nu este live acum</p>
              </div>
            )}
          </section>

          {/* Recordings Section - Twitch VOD Style */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Film className="text-purple-500" size={20} />
              <h2 className="text-lg font-semibold text-foreground">
                Înregistrări Recente
              </h2>
              {recordings.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  ({recordings.length})
                </span>
              )}
            </div>

            {isLoadingRecordings ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recordings.length === 0 ? (
              <div className="py-16 text-center border border-border/50 rounded-xl bg-card/30">
                <Film className="text-muted-foreground mx-auto mb-3" size={32} />
                <p className="text-muted-foreground">Nicio înregistrare disponibilă</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedRecordings).map(([nickname, userRecordings]) => {
                  const friend = getFriend(nickname);
                  
                  return (
                    <div key={nickname} className="space-y-3">
                      {/* Streamer Header */}
                      <div className="flex items-center gap-3">
                        {friend?.avatar ? (
                          <img 
                            src={getProxiedImageUrl(friend.avatar)} 
                            alt={nickname}
                            className="w-10 h-10 rounded-full border-2 border-purple-500/50"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border-2 border-purple-500/50">
                            <span className="text-sm font-bold text-purple-400">{nickname[0]?.toUpperCase()}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-foreground">{nickname}</span>
                          <p className="text-xs text-muted-foreground">
                            {userRecordings.length} înregistrări
                          </p>
                        </div>
                      </div>

                      {/* VOD Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {userRecordings.slice(0, 8).map((recording) => (
                          <div
                            key={recording.id}
                            className="group relative bg-card/50 rounded-lg border border-border/50 overflow-hidden hover:border-purple-500/50 transition-all cursor-pointer"
                            onClick={() => handlePlayRecording(recording)}
                          >
                            {/* Thumbnail placeholder */}
                            <div className="aspect-video bg-gradient-to-br from-purple-900/30 to-purple-600/10 flex items-center justify-center">
                              <Film className="text-purple-500/50" size={32} />
                              
                              {/* Play overlay */}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                                  <div className="w-0 h-0 border-l-[16px] border-l-white border-y-[10px] border-y-transparent ml-1" />
                                </div>
                              </div>

                              {/* Delete button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRecording(recording);
                                }}
                                className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={14} />
                              </Button>

                              {/* Duration badge */}
                              <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-xs text-white font-mono">
                                {recordingsService.formatFileSize(recording.size)}
                              </div>
                            </div>

                            {/* Info */}
                            <div className="p-3">
                              <p className="text-sm font-medium text-foreground truncate">
                                {format(recording.date, 'EEEE, d MMM')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(recording.date, 'HH:mm')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {userRecordings.length > 8 && (
                        <p className="text-sm text-muted-foreground pl-[52px]">
                          +{userRecordings.length - 8} mai multe
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Live Stream Player Modal */}
      <LiveStreamPlayer
        stream={selectedStream}
        isOpen={isPlayerOpen}
        onClose={handleClosePlayer}
      />

      {/* Recording Player Modal */}
      <RecordingPlayer
        recording={selectedRecording}
        isOpen={isRecordingPlayerOpen}
        onClose={handleCloseRecordingPlayer}
      />

      {/* Password Dialog for Delete */}
      <PasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => {
          setIsPasswordDialogOpen(false);
          setRecordingToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Șterge Înregistrare"
        description={recordingToDelete 
          ? `Ești sigur că vrei să ștergi înregistrarea de la ${recordingToDelete.nickname} din ${format(recordingToDelete.date, 'MMM d, HH:mm')}?`
          : 'Confirmare ștergere înregistrare'
        }
      />
    </div>
  );
};
