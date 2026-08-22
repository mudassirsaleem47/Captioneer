import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Tv,
  Smartphone,
  Square,
  UploadCloud,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import {
  Menu,
  MenuItem,
  MenuTrigger,
} from '../ui/Menu';
import { Tooltip, TooltipTrigger } from '../ui/Tooltip';

function formatTimestamp(secs) {
  if (isNaN(secs) || secs < 0) secs = 0;
  const mins = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  const ms = Math.floor((secs % 1) * 1000);
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${pad(mins)}:${pad(s)}.${pad(ms, 3)}`;
}

export const VideoPlayer = React.memo(function VideoPlayer({
  isPlaying,
  currentTime = 0,
  duration = 12,
  subtitles = [],
  activeSubtitleId,
  onTogglePlay,
  onSeek,
  onTimeUpdate,
  onDurationChange,
  videoSrc = null,
  onUploadVideo,
  aspectRatio: controlledAspectRatio,
  onAspectRatioChange,
}) {
  const playerContainerRef = useRef(null);
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localAspectRatio, setLocalAspectRatio] = useState('9:16');
  const aspectRatio = controlledAspectRatio || localAspectRatio;
  const setAspectRatio = (val) => {
    setLocalAspectRatio(val);
    onAspectRatioChange?.(val);
  };
  const [isMuted, setIsMuted] = useState(false);

  const validDuration = Math.max(1, duration || 12);

  // Sync HTML5 video play/pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying, videoSrc]);

  // Sync HTML5 video seeking
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    if (Math.abs(video.currentTime - currentTime) > 0.25) {
      video.currentTime = currentTime;
    }
  }, [currentTime, videoSrc]);

  // Sync mute
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
    }
  }, [isMuted]);

  // Fullscreen toggle handler using HTML5 Fullscreen API
  const handleToggleFullscreen = useCallback(() => {
    const container = playerContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, []);

  // Seeking on ProgressBar click/drag
  const handleProgressSeek = (e) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek?.(pct * validDuration);
  };

  const handleProgressMouseDown = (e) => {
    e.preventDefault();
    handleProgressSeek(e);

    const onMouseMove = (moveEvent) => {
      handleProgressSeek(moveEvent);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Active cue at currentTime
  const activeCue = useMemo(() => {
    if (activeSubtitleId) {
      const found = subtitles.find((s) => s.id === activeSubtitleId);
      if (found) return found;
    }
    return (
      subtitles.find((s) => currentTime >= s.start && currentTime <= s.end) ||
      subtitles[0] ||
      null
    );
  }, [subtitles, currentTime, activeSubtitleId]);

  const handleSkip = (delta) => {
    const next = Math.max(0, Math.min(validDuration, currentTime + delta));
    onSeek?.(next);
  };

  const aspectClassMap = {
    '9:16': 'aspect-[9/16] h-full max-h-[calc(100%-5rem)]',
    '16:9': 'aspect-[16/9] w-full max-w-[90%] max-h-[calc(100%-5rem)]',
    '1:1': 'aspect-square h-full max-h-[calc(100%-5rem)]',
  };

  return (
    <div
      ref={playerContainerRef}
      className={`flex-1 h-full min-h-0 bg-[#18181B] p-1.5 text-white select-none overflow-hidden rounded-2xl border border-[#27272A]/80 shadow-2xl flex flex-col justify-between transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none p-4 bg-black' : ''
      }`}
    >
      {/* 1. TOP VIDEO PREVIEW CANVAS */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center relative overflow-hidden my-1">
        {/* Aspect Ratio Bounded Frame */}
        <div
          onClick={videoSrc ? onTogglePlay : onUploadVideo}
          className={`relative rounded-[15px] bg-black border border-[#27272A] shadow-2xl overflow-hidden flex items-center justify-center cursor-pointer group transition-all ${
            aspectClassMap[aspectRatio] || aspectClassMap['9:16']
          }`}
        >
          {/* Subtle Ambient Video Gradient / Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#000000]/40 to-[#000000]/90 pointer-events-none" />

          {/* HTML5 Native Video / Upload Placeholder */}
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              onTimeUpdate={(e) => {
                if (isPlaying) onTimeUpdate?.(e.currentTarget.currentTime);
              }}
              onLoadedMetadata={(e) => {
                if (e.currentTarget.duration) {
                  onDurationChange?.(e.currentTarget.duration);
                }
              }}
              className="w-full h-full object-contain pointer-events-none"
              playsInline
              loop
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-3 group-hover:scale-105 transition-transform">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                <UploadCloud size={28} className="text-indigo-400" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-white tracking-tight">
                  Click to Import Video
                </span>
                <span className="text-xs text-[#71717A]">
                  MP4, WebM, or MOV formats
                </span>
              </div>
            </div>
          )}

          {/* Kinetic Active Subtitles Overlay */}
          {activeCue && (
            <div className="absolute bottom-12 left-4 right-4 z-20 flex flex-col items-center justify-center pointer-events-none text-center">
              <div className="flex flex-wrap items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-2xl">
                {activeCue.words && activeCue.words.length > 0 ? (
                  activeCue.words.map((w, wIdx) => {
                    const wordStr = typeof w === 'string' ? w : w.word;
                    const isHigh = typeof w === 'object' ? w.isHighlighted : false;
                    return (
                      <span
                        key={wIdx}
                        className={`text-base font-extrabold tracking-tight transition-all duration-150 ${
                          isHigh
                            ? 'text-indigo-400 scale-110 drop-shadow-[0_2px_10px_rgba(99,102,241,0.5)]'
                            : 'text-white'
                        }`}
                      >
                        {wordStr}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-base font-extrabold text-white tracking-tight">
                    {activeCue.text}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Hover Play/Pause Overlay Indicator (Only when video uploaded) */}
          {videoSrc && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
              <div className="w-12 h-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg transform group-active:scale-90 transition-transform">
                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. BOTTOM PLAYER CONTROLS CONTAINER WITH UI PROGRESSBAR */}
      <div className="bg-[#242428] rounded-[15px] border border-[#2B2B32]/60 flex flex-col shrink-0 overflow-hidden shadow-lg">
        {/* Design System UI ProgressBar for Video Playback Control */}
        <div
          ref={progressBarRef}
          onMouseDown={handleProgressMouseDown}
          className="w-full px-3 pt-2.5 pb-0.5 cursor-pointer select-none"
        >
          <ProgressBar
            aria-label="Video playback progress"
            minValue={0}
            maxValue={validDuration}
            value={currentTime}
            className="w-full max-w-none"
          />
        </div>

        {/* Playback Controls Row */}
        <div className="h-12 px-4 flex items-center justify-between gap-3">
          {/* Left Side: Current Timestamp & Duration */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#A1A1AA] select-none">
            <span className="text-white font-semibold">{formatTimestamp(currentTime)}</span>
            <span>/</span>
            <span>{formatTimestamp(validDuration)}</span>
          </div>

          {/* Center: Playback Transport Buttons */}
          <div className="flex items-center gap-2">
            {/* Skip Back 5s */}
            <TooltipTrigger delay={100}>
              <Button
                variant="quiet"
                onPress={() => handleSkip(-5)}
                aria-label="Skip backward 5 seconds"
                className="w-8 h-8 p-0 text-[#A1A1AA] hover:text-white"
              >
                <RotateCcw size={15} />
              </Button>
              <Tooltip placement="top">Back 5s</Tooltip>
            </TooltipTrigger>

            {/* Play / Pause Main Button */}
            <TooltipTrigger delay={100}>
              <Button
                onPress={onTogglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="w-9 h-9 p-0 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-md shadow-indigo-500/25"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </Button>
              <Tooltip placement="top">{isPlaying ? 'Pause (Space)' : 'Play (Space)'}</Tooltip>
            </TooltipTrigger>

            {/* Skip Forward 5s */}
            <TooltipTrigger delay={100}>
              <Button
                variant="quiet"
                onPress={() => handleSkip(5)}
                aria-label="Skip forward 5 seconds"
                className="w-8 h-8 p-0 text-[#A1A1AA] hover:text-white"
              >
                <RotateCw size={15} />
              </Button>
              <Tooltip placement="top">Forward 5s</Tooltip>
            </TooltipTrigger>
          </div>

          {/* Right Side: Aspect Ratio, Volume & Fullscreen */}
          <div className="flex items-center gap-1.5">
            {/* Aspect Ratio Menu */}
            <MenuTrigger>
              <Button
                variant="quiet"
                aria-label="Change aspect ratio"
                className="h-8 px-2 text-xs font-medium text-[#A1A1AA] hover:text-white rounded-lg gap-1.5"
              >
                {aspectRatio === '9:16' && <Smartphone size={13} />}
                {aspectRatio === '16:9' && <Tv size={13} />}
                {aspectRatio === '1:1' && <Square size={13} />}
                <span>{aspectRatio}</span>
              </Button>
              <Menu
                onAction={(key) => setAspectRatio(String(key))}
                aria-label="Select Aspect Ratio"
              >
                <MenuItem id="9:16">9:16 (TikTok / Reels)</MenuItem>
                <MenuItem id="16:9">16:9 (YouTube / Landscape)</MenuItem>
                <MenuItem id="1:1">1:1 (Square)</MenuItem>
              </Menu>
            </MenuTrigger>

            <div className="h-4 w-px bg-[#2B2B32]" />

            {/* Volume Mute Toggle */}
            <TooltipTrigger delay={100}>
              <Button
                variant="quiet"
                onPress={() => setIsMuted((prev) => !prev)}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="w-8 h-8 p-0 text-[#A1A1AA] hover:text-white"
              >
                {isMuted ? <VolumeX size={15} className="text-red-400" /> : <Volume2 size={15} />}
              </Button>
              <Tooltip placement="top">{isMuted ? 'Unmute' : 'Mute'}</Tooltip>
            </TooltipTrigger>

            {/* Fullscreen Player Toggle */}
            <TooltipTrigger delay={100}>
              <Button
                variant="quiet"
                onPress={handleToggleFullscreen}
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                className="w-8 h-8 p-0 text-[#A1A1AA] hover:text-white"
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </Button>
              <Tooltip placement="top">{isFullscreen ? 'Exit Fullscreen (ESC)' : 'Fullscreen'}</Tooltip>
            </TooltipTrigger>
          </div>
        </div>
      </div>
    </div>
  );
});

export default VideoPlayer;
