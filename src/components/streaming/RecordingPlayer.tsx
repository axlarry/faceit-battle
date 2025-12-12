
import React, { useRef, useState } from 'react';
import { X, Maximize2, Minimize2, Volume2, VolumeX, Download, Share2, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Recording } from '@/types/streaming';
import { recordingsService } from '@/services/recordingsService';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface RecordingPlayerProps {
  recording: Recording | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RecordingPlayer = ({ recording, isOpen, onClose }: RecordingPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const cyclePlaybackSpeed = () => {
    const speeds = [0.5, 1, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const handleDownload = () => {
    if (recording) {
      window.open(recording.url, '_blank');
    }
  };

  const handleShare = async () => {
    if (recording) {
      try {
        await navigator.clipboard.writeText(recording.url);
        toast({
          title: "Link copied!",
          description: "Recording link copied to clipboard",
        });
      } catch {
        toast({
          title: "Failed to copy",
          description: "Could not copy link to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  if (!recording) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 bg-black border-border overflow-hidden" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Recording - {recording.nickname}</DialogTitle>
        </VisuallyHidden>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="font-bold text-white">{recording.nickname}</span>
            <span className="text-white/60 text-sm">• Recording</span>
            <span className="text-white/40 text-xs">
              {format(recording.date, 'MMM d, yyyy HH:mm')}
            </span>
            <span className="text-white/40 text-xs">
              ({recordingsService.formatFileSize(recording.size)})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={cyclePlaybackSpeed}
              className="text-white hover:bg-white/20 text-xs px-2"
            >
              {playbackSpeed}x
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="text-white hover:bg-white/20"
            >
              <Share2 size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="text-white hover:bg-white/20"
            >
              <Download size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            src={recording.url}
            className="w-full h-full"
            controls
            playsInline
            muted={isMuted}
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedMetadata={() => {
              // Start playing as soon as metadata is loaded
              if (videoRef.current) {
                videoRef.current.play().catch(() => {});
              }
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
