import React, { useEffect, useRef, useState, memo } from 'react';
import Hls from 'hls.js';
import { Play, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MiniStreamPlayerProps {
  streamUrl: string;
  nickname: string;
  onClick: () => void;
}

export const MiniStreamPlayer = memo(({ streamUrl, nickname, onClick }: MiniStreamPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    const video = videoRef.current;
    setIsLoading(true);
    setHasError(false);

    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: true,
        liveSyncDuration: 3,
        liveMaxLatencyDuration: 10,
        maxBufferLength: 10,
        maxMaxBufferLength: 20,
        enableWorker: true,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(() => {
          // Autoplay blocked, that's fine for mini player
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setHasError(true);
          setIsLoading(false);
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(() => {});
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  if (hasError) {
    return null;
  }

  return (
    <div 
      className={cn(
        "relative aspect-video w-full rounded-lg overflow-hidden cursor-pointer",
        "bg-black/80 group transition-all duration-200",
        "hover:ring-2 hover:ring-primary/50"
      )}
      onClick={onClick}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        muted
        playsInline
        autoPlay
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Play overlay on hover */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-10 h-10 rounded-full bg-primary/80 flex items-center justify-center">
          <Play size={20} className="text-primary-foreground ml-0.5" />
        </div>
      </div>

      {/* Muted indicator */}
      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-xs text-muted-foreground flex items-center gap-1">
        <Volume2 size={12} className="opacity-50" />
      </div>

      {/* Live indicator */}
      <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 rounded text-xs font-bold text-white flex items-center gap-1">
        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        LIVE
      </div>

      {/* Nickname */}
      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-xs font-medium text-white truncate max-w-[70%]">
        {nickname}
      </div>
    </div>
  );
});

MiniStreamPlayer.displayName = 'MiniStreamPlayer';
