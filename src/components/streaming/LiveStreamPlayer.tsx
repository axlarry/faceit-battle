
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { X, Maximize2, Minimize2, Volume2, VolumeX, RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { LiveStream } from '@/types/streaming';

interface LiveStreamPlayerProps {
  stream: LiveStream | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LiveStreamPlayer = ({ stream, isOpen, onClose }: LiveStreamPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !stream?.streamUrl || !videoRef.current) return;

    setIsLoading(true);
    setError(null);

    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: true,
        liveSyncDuration: 3,
        liveMaxLatencyDuration: 10,
        liveDurationInfinity: true,
        enableWorker: true,
      });

      hls.loadSource(stream.streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(console.error);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError('Stream connection lost. The streamer may have gone offline.');
          setIsLoading(false);
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = stream.streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(console.error);
      });
    } else {
      setError('Your browser does not support HLS playback.');
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isOpen, stream?.streamUrl]);

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

  const retry = () => {
    if (hlsRef.current && stream?.streamUrl) {
      setIsLoading(true);
      setError(null);
      hlsRef.current.loadSource(stream.streamUrl);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 bg-black border-border overflow-hidden" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Live Stream - {stream?.nickname}</DialogTitle>
        </VisuallyHidden>
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="font-bold text-white">{stream?.nickname}</span>
            <span className="text-white/60 text-sm">• LIVE</span>
            {stream && stream.viewers > 0 && (
              <span className="flex items-center gap-1 text-white/60 text-sm">
                <Users size={14} />
                {stream.viewers}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
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
            className="w-full h-full"
            controls
            playsInline
            muted={isMuted}
          />

          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-white">Connecting to stream...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="flex flex-col items-center gap-4 text-center p-6">
                <span className="text-red-400 text-lg">{error}</span>
                <Button onClick={retry} variant="outline" className="gap-2">
                  <RefreshCw size={16} />
                  Retry
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
