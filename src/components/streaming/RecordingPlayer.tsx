
import React, { useRef, useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, Volume2, VolumeX, Download, Share2, Play, Pause, Loader2, Clock } from 'lucide-react';
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

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const RecordingPlayer = ({ recording, isOpen, onClose }: RecordingPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
    };
  }, [isOpen]);

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
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="font-bold text-white">{recording.nickname}</span>
            <span className="text-white/60 text-sm">• Recording</span>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded-md">
              <Clock size={12} className="text-white/60" />
              <span className="text-white text-xs font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <span className="text-white/40 text-xs hidden sm:inline">
              {format(recording.date, 'MMM d, yyyy HH:mm')}
            </span>
            <span className="text-white/40 text-xs hidden sm:inline">
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
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <span className="text-white/80 text-sm">Se încarcă înregistrarea...</span>
              {bufferedPercent > 0 && (
                <div className="mt-3 w-48">
                  <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${bufferedPercent}%` }}
                    />
                  </div>
                  <span className="text-white/60 text-xs mt-1 block text-center">
                    {bufferedPercent.toFixed(0)}% încărcat
                  </span>
                </div>
              )}
            </div>
          )}
          
          <video
            ref={videoRef}
            src={recording.url}
            className="w-full h-full"
            controls
            playsInline
            muted={isMuted}
            preload="auto"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onWaiting={() => setIsLoading(true)}
            onCanPlay={() => setIsLoading(false)}
            onProgress={() => {
              if (videoRef.current && videoRef.current.buffered.length > 0 && videoRef.current.duration) {
                const buffered = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
                setBufferedPercent((buffered / videoRef.current.duration) * 100);
              }
            }}
            onLoadedMetadata={() => {
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
