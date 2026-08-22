import React, { useState, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Tv,
  Smartphone,
  Square,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';
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

export function VideoPlayer({
  isPlaying,
  currentTime = 0,
  duration = 12,
  subtitles = [],
  activeSubtitleId,
  onTogglePlay,
  onSeek,
  videoSrc = null,
  aspectRatio: controlledAspectRatio,
  onAspectRatioChange,
}) {
  const [localAspectRatio, setLocalAspectRatio] = useState('9:16');
  const aspectRatio = controlledAspectRatio || localAspectRatio;
  const setAspectRatio = (val) => {
    setLocalAspectRatio(val);
    onAspectRatioChange?.(val);
  };
  const [isMuted, setIsMuted] = useState(false);

  const validDuration = Math.max(1, duration || 12);

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
    '9:16': 'aspect-[9/16] h-full max-h-[calc(100%-4.5rem)]',
    '16:9': 'aspect-[16/9] w-full max-w-[90%] max-h-[calc(100%-4.5rem)]',
    '1:1': 'aspect-square h-full max-h-[calc(100%-4.5rem)]',
  };

  return (
    <div className="flex-1 h-full min-h-0 bg-[#18181B] p-1.5 text-white select-none overflow-hidden rounded-2xl flex flex-col justify-between">
      {/* 1. TOP VIDEO PREVIEW CANVAS */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center relative overflow-hidden my-1">
        {/* Aspect Ratio Bounded Frame */}
        <div
          onClick={onTogglePlay}
          className={`relative rounded-[15px] bg-black border border-[#27272A] shadow-2xl overflow-hidden flex items-center justify-center cursor-pointer group transition-all ${
            aspectClassMap[aspectRatio] || aspectClassMap['9:16']
          }`}
        >
          {/* Subtle Ambient Video Gradient / Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#000000]/40 to-[#000000]/90 pointer-events-none" />

          {/* Simulated Video Placeholder Scene */}
          {videoSrc ? (
            <video
              src={videoSrc}
              className="w-full h-full object-cover pointer-events-none"
              playsInline
              loop
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 pointer-events-none gap-2">
              <Sparkles size={32} className="text-indigo-400 animate-pulse" />
              <span className="text-xs font-medium text-[#A1A1AA] tracking-wider uppercase">
                Video Preview
              </span>
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

          {/* Hover Play/Pause Overlay Indicator */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
            <div className="w-12 h-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg transform group-active:scale-90 transition-transform">
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </div>
          </div>
        </div>
      </div>

      {/* 2. BOTTOM PLAYER CONTROLS CONTAINER */}
      <div className="h-14 px-4 bg-[#242428] rounded-[15px] border border-[#2B2B32]/60 flex items-center justify-between shrink-0 gap-3">
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
              aria-label="Fullscreen player"
              className="w-8 h-8 p-0 text-[#A1A1AA] hover:text-white"
            >
              <Maximize2 size={14} />
            </Button>
            <Tooltip placement="top">Fullscreen</Tooltip>
          </TooltipTrigger>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
