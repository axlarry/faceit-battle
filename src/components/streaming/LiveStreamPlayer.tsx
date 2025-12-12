import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import Hls from 'hls.js';
import { X, Maximize2, Minimize2, Volume2, VolumeX, RefreshCw, Users, Share2, Clock, Play, Pause, Radio, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { LiveStream } from '@/types/streaming';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useStreamViewerTracking, useStreamViewerCount } from '@/hooks/useStreamViewerTracking';

interface LiveStreamPlayerProps {
  stream: LiveStream | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LiveStreamPlayer = memo(({ stream, isOpen, onClose }: LiveStreamPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [watchDuration, setWatchDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  
  // DVR state
  const [currentTime, setCurrentTime] = useState(0);
  const [bufferEnd, setBufferEnd] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [liveEdge, setLiveEdge] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time viewer tracking using Supabase Presence
  useStreamViewerTracking(stream?.nickname || null, isOpen && !!stream?.streamUrl);
  const realtimeViewerCount = useStreamViewerCount(isOpen && stream?.nickname ? stream.nickname : null);

  // Format time as HH:MM:SS or MM:SS
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Format time behind live
  const formatBehindLive = (seconds: number): string => {
    if (seconds < 5) return '';
    if (seconds < 60) return `-${Math.floor(seconds)}s`;
    if (seconds < 3600) return `-${Math.floor(seconds / 60)}m`;
    return `-${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  // Show controls temporarily
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isDragging) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying, isDragging]);

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

  // Update time state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Check if we're at live edge (within 5 seconds)
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBufferEnd(bufferedEnd);
        setLiveEdge(bufferedEnd);
        setIsLive(bufferedEnd - video.currentTime < 5);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [videoReady]);

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
      setCurrentTime(0);
      setBufferEnd(0);
      setIsLive(true);
    }
  }, [isOpen]);

  // Initialize HLS with DVR-friendly config
  useEffect(() => {
    if (!isOpen || !stream?.streamUrl || !videoReady || !videoRef.current) return;

    console.log('🎬 Initializing HLS player with DVR mode:', stream.streamUrl);
    
    setIsLoading(true);
    setError(null);

    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({
        // DVR-friendly configuration
        lowLatencyMode: false,
        liveSyncDuration: 3,
        liveMaxLatencyDuration: Infinity, // Allow seeking anywhere in buffer
        liveDurationInfinity: true,
        backBufferLength: 3600, // Keep 1 hour of back buffer
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        enableWorker: true,
        // Better mobile performance
        maxBufferHole: 0.5,
        fragLoadingTimeOut: 20000,
        manifestLoadingTimeOut: 10000,
      });

      console.log('📺 HLS: Loading source with DVR mode...');
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

  const toggleFullscreen = async () => {
    try {
      // Try video element fullscreen first (works better in Discord/iframes)
      const video = videoRef.current;
      const container = document.querySelector('.live-player-container') as HTMLElement;
      
      if (!document.fullscreenElement) {
        // Try video element first for better iframe/Discord compatibility
        if (video && 'webkitEnterFullscreen' in video) {
          // iOS Safari
          (video as any).webkitEnterFullscreen();
          setIsFullscreen(true);
        } else if (video?.requestFullscreen) {
          await video.requestFullscreen();
          setIsFullscreen(true);
        } else if (container?.requestFullscreen) {
          await container.requestFullscreen();
          setIsFullscreen(true);
        } else if ((video as any)?.webkitRequestFullscreen) {
          (video as any).webkitRequestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen not available:', err);
      // Fallback: maximize the dialog instead
      setIsFullscreen(!isFullscreen);
    }
  };

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (!newMuted && volume === 0) {
        setVolume(50);
        videoRef.current.volume = 0.5;
      }
    }
  }, [volume]);

  const handleVolumeChange = useCallback((newVolume: number[]) => {
    if (videoRef.current) {
      const vol = newVolume[0];
      setVolume(vol);
      videoRef.current.volume = vol / 100;
      setIsMuted(vol === 0);
    }
  }, []);

  const handleVolumeHover = useCallback((show: boolean) => {
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
    if (show) {
      setShowVolumeSlider(true);
    } else {
      volumeTimeoutRef.current = setTimeout(() => {
        setShowVolumeSlider(false);
      }, 300);
    }
  }, []);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const goToLive = () => {
    if (videoRef.current && bufferEnd > 0) {
      videoRef.current.currentTime = bufferEnd - 1;
      videoRef.current.play();
    }
  };

  const seek = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, bufferEnd));
      videoRef.current.currentTime = newTime;
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current || bufferEnd <= 0) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = percent * bufferEnd;
  };

  const handleProgressDrag = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!progressRef.current || !videoRef.current || bufferEnd <= 0) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    videoRef.current.currentTime = percent * bufferEnd;
  }, [bufferEnd]);

  // Handle double-tap for mobile seek
  const handleVideoTap = (e: React.TouchEvent | React.MouseEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const clientX = 'touches' in e ? e.changedTouches[0].clientX : e.clientX;
      const tapX = clientX - rect.left;
      const isLeftSide = tapX < rect.width / 2;
      
      seek(isLeftSide ? -10 : 10);
      
      // Show seek indicator
      toast({
        title: isLeftSide ? "⏪ -10s" : "⏩ +10s",
      });
    } else {
      // Single tap - show/hide controls
      showControlsTemporarily();
    }
    
    lastTapRef.current = now;
  };

  const retry = () => {
    if (hlsRef.current && stream?.streamUrl) {
      setIsLoading(true);
      setError(null);
      hlsRef.current.loadSource(stream.streamUrl);
    }
  };

  const progressPercent = bufferEnd > 0 ? (currentTime / bufferEnd) * 100 : 0;
  const behindLiveSeconds = bufferEnd - currentTime;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-5xl w-[95vw] md:w-[90vw] p-0 bg-black border-border overflow-hidden" 
        aria-describedby={undefined}
      >
        <VisuallyHidden>
          <DialogTitle>Live Stream - {stream?.nickname}</DialogTitle>
        </VisuallyHidden>
        
        <div 
          className="live-player-container relative aspect-video bg-black select-none"
          onMouseMove={showControlsTemporarily}
          onTouchStart={handleVideoTap}
          onClick={(e) => {
            // Only trigger on direct click, not on controls
            if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'VIDEO') {
              showControlsTemporarily();
            }
          }}
        >
          {/* Video Element - No native controls */}
          <video
            ref={setVideoRef}
            className="w-full h-full cursor-pointer"
            playsInline
            muted={isMuted}
            onClick={togglePlayPause}
          />

          {/* Top Controls Overlay */}
          <div 
            className={cn(
              "absolute top-0 left-0 right-0 z-10 p-3 md:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-300",
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="font-bold text-white text-sm md:text-base">{stream?.nickname}</span>
                
                {/* Live/Behind indicator */}
                {isLive ? (
                  <span className="text-red-400 text-xs md:text-sm font-medium">• LIVE</span>
                ) : (
                  <span className="text-yellow-400 text-xs md:text-sm font-mono">
                    {formatBehindLive(behindLiveSeconds)}
                  </span>
                )}
                
                {!isLoading && !error && (
                  <span className="hidden sm:flex items-center gap-1 text-white/60 text-xs md:text-sm font-mono">
                    <Clock size={12} className="md:w-3.5 md:h-3.5" />
                    {formatTime(watchDuration)}
                  </span>
                )}
                
                {realtimeViewerCount > 0 && (
                  <span className="flex items-center gap-1 text-white/60 text-xs md:text-sm">
                    <Users size={12} className="md:w-3.5 md:h-3.5" />
                    {realtimeViewerCount}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1 md:gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="text-white hover:bg-white/20 h-8 w-8 md:h-9 md:w-9"
                  title="Share stream link"
                >
                  <Share2 size={16} className="md:w-[18px] md:h-[18px]" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/20 h-8 w-8 md:h-9 md:w-9"
                >
                  <X size={18} className="md:w-5 md:h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Center Play/Pause Button (shown when paused or on tap) */}
          {!isLoading && !error && !isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/50 flex items-center justify-center">
                <Play size={32} className="text-white md:w-10 md:h-10 ml-1" />
              </div>
            </div>
          )}

          {/* Bottom Controls */}
          <div 
            className={cn(
              "absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300",
              showControls ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            {/* Progress Bar */}
            <div 
              ref={progressRef}
              className="px-3 md:px-4 py-2 cursor-pointer group"
              onClick={handleProgressClick}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
              onTouchMove={handleProgressDrag}
            >
              <div className="relative h-1 md:h-1.5 bg-white/30 rounded-full overflow-hidden group-hover:h-2 transition-all">
                {/* Buffered */}
                <div 
                  className="absolute inset-y-0 left-0 bg-white/50 rounded-full"
                  style={{ width: '100%' }}
                />
                {/* Progress */}
                <div 
                  className="absolute inset-y-0 left-0 bg-red-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
                {/* Scrubber */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 bg-red-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `calc(${progressPercent}% - 6px)` }}
                />
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between px-3 md:px-4 pb-3 md:pb-4">
              <div className="flex items-center gap-1 md:gap-2">
                {/* Play/Pause */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlayPause}
                  className="text-white hover:bg-white/20 h-10 w-10 md:h-9 md:w-9"
                >
                  {isPlaying ? (
                    <Pause size={20} className="md:w-5 md:h-5" />
                  ) : (
                    <Play size={20} className="md:w-5 md:h-5 ml-0.5" />
                  )}
                </Button>

                {/* Skip Back */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => seek(-10)}
                  className="text-white hover:bg-white/20 h-10 w-10 md:h-9 md:w-9"
                  title="Back 10 seconds"
                >
                  <SkipBack size={18} className="md:w-[18px] md:h-[18px]" />
                </Button>

                {/* Skip Forward */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => seek(10)}
                  className="text-white hover:bg-white/20 h-10 w-10 md:h-9 md:w-9"
                  title="Forward 10 seconds"
                >
                  <SkipForward size={18} className="md:w-[18px] md:h-[18px]" />
                </Button>

                {/* Volume with Slider */}
                <div 
                  className="relative flex items-center"
                  onMouseEnter={() => handleVolumeHover(true)}
                  onMouseLeave={() => handleVolumeHover(false)}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20 h-10 w-10 md:h-9 md:w-9"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX size={18} className="md:w-5 md:h-5" />
                    ) : (
                      <Volume2 size={18} className="md:w-5 md:h-5" />
                    )}
                  </Button>
                  
                  {/* Desktop Volume Slider */}
                  <div 
                    className={cn(
                      "hidden md:flex absolute left-full ml-2 items-center bg-black/80 rounded-lg px-3 py-2 transition-all duration-200",
                      showVolumeSlider ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"
                    )}
                    onMouseEnter={() => handleVolumeHover(true)}
                    onMouseLeave={() => handleVolumeHover(false)}
                  >
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="w-24"
                    />
                    <span className="text-white/70 text-xs ml-2 w-8 text-right">
                      {isMuted ? 0 : volume}%
                    </span>
                  </div>
                </div>

                {/* Time Display */}
                <span className="text-white/80 text-xs md:text-sm font-mono ml-2">
                  {formatTime(currentTime)} / {formatTime(bufferEnd)}
                </span>
              </div>

              <div className="flex items-center gap-1 md:gap-2">
                {/* Go to Live Button */}
                {!isLive && (
                  <Button
                    variant="ghost"
                    onClick={goToLive}
                    className="text-white hover:bg-white/20 h-8 md:h-9 px-2 md:px-3 gap-1 md:gap-1.5 text-xs md:text-sm"
                  >
                    <Radio size={14} className="text-red-500 md:w-4 md:h-4" />
                    <span className="text-red-400 font-medium">LIVE</span>
                  </Button>
                )}

                {/* Fullscreen */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20 h-10 w-10 md:h-9 md:w-9"
                >
                  {isFullscreen ? <Minimize2 size={18} className="md:w-5 md:h-5" /> : <Maximize2 size={18} className="md:w-5 md:h-5" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-white text-sm md:text-base">Loading stream...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="flex flex-col items-center gap-4 text-center p-6">
                <span className="text-red-400 text-base md:text-lg">{error}</span>
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
});

LiveStreamPlayer.displayName = 'LiveStreamPlayer';
