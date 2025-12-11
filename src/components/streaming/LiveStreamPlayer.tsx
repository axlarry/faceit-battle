

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { X, Maximize2, Minimize2, Volume2, VolumeX, RefreshCw, Users, Share2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { LiveStream } from '@/types/streaming';
import { toast } from '@/hooks/use-toast';

interface LiveStreamPlayerProps {
  stream: LiveStream | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LiveStreamPlayer = ({ stream, isOpen, onClose }: LiveStreamPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [watchDuration, setWatchDuration] = useState(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Format duration as HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start/stop duration timer
  useEffect(() => {
    if (isOpen && !isLoading && !error) {
      setWatchDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setWatchDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isOpen, isLoading, error]);

  const handleShare = async () => {
    if (stream?.streamUrl) {
      try {
        await navigator.clipboard.writeText(stream.streamUrl);
        toast({
          title: "Link copied!",
          description: "Stream link copied to clipboard",
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

  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node) {
      setVideoReady(true);
    }
  }, []);

  // Reset videoReady when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setVideoReady(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !stream?.streamUrl || !videoReady || !videoRef.current) return;

    console.log('🎬 Initializing HLS player with URL:', stream.streamUrl);
    
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

      console.log('📺 HLS: Loading source...');
      hls.loadSource(stream.streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_LOADING, () => {
        console.log('📡 HLS: Manifest loading...');
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('✅ HLS: Manifest parsed successfully');
        setIsLoading(false);
        video.play().catch(console.error);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error('❌ HLS Error:', {
          type: data.type,
          details: data.details,
          fatal: data.fatal,
          url: data.url,
        });
        if (data.fatal) {
          setError(`Stream error: ${data.details}`);
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
  }, [isOpen, stream?.streamUrl, videoReady]);

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
            {!isLoading && !error && (
              <span className="flex items-center gap-1 text-white/60 text-sm font-mono">
                <Clock size={14} />
                {formatDuration(watchDuration)}
              </span>
            )}
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
              onClick={handleShare}
              className="text-white hover:bg-white/20"
              title="Share stream link"
            >
              <Share2 size={18} />
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
            ref={setVideoRef}
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
