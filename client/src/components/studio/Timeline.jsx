import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Plus,
  SlidersHorizontal,
  Scissors,
  Trash2,
  Magnet,
  Link2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Video,
  Volume2,
  Type,
  Sparkles,
  Eye,
  EyeOff,
  GripHorizontal,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';
import { ToggleButton } from '../ui/ToggleButton';
import { Toolbar } from '../ui/Toolbar';
import { Tooltip, TooltipTrigger } from '../ui/Tooltip';

function formatTimestamp(secs) {
  if (isNaN(secs) || secs < 0) secs = 0;
  const mins = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  const ms = Math.floor((secs % 1) * 1000);
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  return `${pad(mins)}:${pad(s)}.${pad(ms, 3)}`;
}

// Realistic Audio Waveform Visualizer using Canvas (Memoized to prevent redraw on playback ticks)
const AudioWaveformCanvas = React.memo(function AudioWaveformCanvas({ duration = 12, zoomFactor = 1, isHidden = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    if (isHidden) return;

    const barWidth = 2.5;
    const barGap = 1.5;
    const totalBars = Math.floor(width / (barWidth + barGap));
    const centerY = height / 2;

    for (let i = 0; i < totalBars; i++) {
      const t = (i / totalBars) * duration;
      const x = i * (barWidth + barGap);

      const speechCadence =
        Math.sin(t * 3.5) * 0.4 +
        Math.sin(t * 8.2) * 0.3 +
        Math.cos(t * 1.8) * 0.25;
      
      const isVoiceBurst = Math.abs(speechCadence) > 0.15;
      const baseAmp = isVoiceBurst ? 0.35 + Math.random() * 0.55 : 0.08 + Math.random() * 0.12;

      const barHeight = Math.max(3, baseAmp * (height * 0.78));

      const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2);
      gradient.addColorStop(0, '#34D399');
      gradient.addColorStop(0.5, '#10B981');
      gradient.addColorStop(1, '#059669');

      ctx.fillStyle = gradient;

      ctx.beginPath();
      const radius = 1.2;
      const top = centerY - barHeight / 2;
      ctx.roundRect(x, top, barWidth, barHeight, radius);
      ctx.fill();
    }
  }, [duration, zoomFactor, isHidden]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ width: '100%', height: '100%' }}
    />
  );
});

export const Timeline = React.memo(function Timeline({
  isPlaying,
  currentTime = 0,
  duration = 12,
  subtitles = [],
  activeSubtitleId,
  selectedSubtitleId,
  onTogglePlay,
  onSeek,
  onSelectSubtitle,
  onUpdateSubtitle,
  onAddSubtitle,
  onSplitSubtitle,
  onDeleteSubtitle,
  isExpanded,
  onToggleExpand,
}) {
  const [localExpanded, setLocalExpanded] = useState(false);
  const isTimelineExpanded = isExpanded !== undefined ? isExpanded : localExpanded;
  const toggleExpand = onToggleExpand || (() => setLocalExpanded((p) => !p));

  const [mode, setMode] = useState('WORD'); // 'WORD' | 'LINE'
  const [zoomLevel, setZoomLevel] = useState(50); // 0 to 100
  const [isSnapActive, setIsSnapActive] = useState(true);
  const [isLinkActive, setIsLinkActive] = useState(true);
  const [selectedWordId, setSelectedWordId] = useState('word-4');
  const [hiddenTracks, setHiddenTracks] = useState({ captions: false, video: false, audio: false });

  const [draggedOverrides, setDraggedOverrides] = useState({});
  const [draggingBlockId, setDraggingBlockId] = useState(null);

  const trackContainerRef = useRef(null);
  const validDuration = Math.max(1, duration || 12);
  const zoomFactor = 1 + (zoomLevel / 100) * 2.5;

  const toggleTrackHidden = (trackKey) => {
    setHiddenTracks((prev) => ({ ...prev, [trackKey]: !prev[trackKey] }));
  };

  const defaultWordItems = useMemo(() => [
    { id: 'word-1', word: 'Language', start: 0.52, end: 1.15, text: 'Language' },
    { id: 'word-2', word: 'is', start: 1.2, end: 1.48, text: 'is' },
    { id: 'word-3', word: 'so', start: 1.52, end: 1.78, text: 'so' },
    { id: 'word-4', word: 'important.', start: 1.85, end: 2.45, text: 'important.' },
    { id: 'word-5', word: 'When', start: 2.6, end: 2.8, text: 'When' },
    { id: 'word-6', word: 'you', start: 2.82, end: 3.1, text: 'you' },
    { id: 'word-7', word: 'learn', start: 3.15, end: 3.55, text: 'learn' },
  ], []);

  const wordsToRender = useMemo(() => {
    if (mode === 'WORD') {
      const allWords = [];
      subtitles.forEach((sub) => {
        if (sub.words && sub.words.length > 0) {
          sub.words.forEach((w, wIdx) => {
            const wordId = `${sub.id}-w-${wIdx}`;
            const override = draggedOverrides[wordId];
            allWords.push({
              id: wordId,
              word: typeof w === 'string' ? w : w.word,
              start: override?.start !== undefined ? override.start : (w.start !== undefined ? w.start : sub.start + wIdx * 0.4),
              end: override?.end !== undefined ? override.end : (w.end !== undefined ? w.end : sub.start + (wIdx + 1) * 0.4),
              subId: sub.id,
              wordIndex: wIdx,
            });
          });
        } else {
          const split = (sub.text || '').split(/\s+/).filter(Boolean);
          const dur = (sub.end - sub.start) / (split.length || 1);
          split.forEach((w, wIdx) => {
            const wordId = `${sub.id}-w-${wIdx}`;
            const override = draggedOverrides[wordId];
            allWords.push({
              id: wordId,
              word: w,
              start: override?.start !== undefined ? override.start : sub.start + wIdx * dur,
              end: override?.end !== undefined ? override.end : sub.start + (wIdx + 1) * dur,
              subId: sub.id,
              wordIndex: wIdx,
            });
          });
        }
      });
      return allWords.length > 0 ? allWords : defaultWordItems;
    }
    return subtitles.length > 0 ? subtitles : defaultWordItems;
  }, [mode, subtitles, defaultWordItems, draggedOverrides]);

  const progressPercent = Math.min(100, Math.max(0, (currentTime / validDuration) * 100));

  const rulerMarks = useMemo(() => {
    let step = 2;
    if (zoomFactor >= 3) step = 0.5;
    else if (zoomFactor >= 1.8) step = 1;
    else step = 2;

    const marks = [];
    for (let t = 0; t <= validDuration + 0.001; t += step) {
      marks.push({
        time: t,
        leftPct: (t / validDuration) * 100,
        label: formatTimestamp(t),
      });
    }
    return marks;
  }, [validDuration, zoomFactor]);

  const handleTrackClick = (e) => {
    if (!trackContainerRef.current) return;
    const rect = trackContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek?.(percent * validDuration);
  };

  const handlePlayheadMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const onMouseMove = (moveEvent) => {
      if (!trackContainerRef.current) return;
      const rect = trackContainerRef.current.getBoundingClientRect();
      const clickX = moveEvent.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, clickX / rect.width));
      onSeek?.(percent * validDuration);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleBlockMouseDown = (e, item, action = 'move') => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedWordId(item.id);
    if (item.subId) onSelectSubtitle?.(item.subId);
    setDraggingBlockId(item.id);

    const startClientX = e.clientX;
    const initialStart = item.start;
    const initialEnd = item.end;
    const blockDuration = initialEnd - initialStart;

    const onMouseMove = (moveEvent) => {
      if (!trackContainerRef.current) return;
      const containerRect = trackContainerRef.current.getBoundingClientRect();
      const deltaX = moveEvent.clientX - startClientX;
      const deltaTime = (deltaX / containerRect.width) * validDuration;

      let newStart = initialStart;
      let newEnd = initialEnd;

      if (action === 'move') {
        newStart = Math.max(0, Math.min(validDuration - blockDuration, initialStart + deltaTime));
        newEnd = newStart + blockDuration;

        if (isSnapActive) {
          const snapThreshold = 0.08;
          if (Math.abs(newStart - currentTime) < snapThreshold) {
            newStart = currentTime;
            newEnd = newStart + blockDuration;
          }
        }
      } else if (action === 'resize-left') {
        newStart = Math.max(0, Math.min(initialEnd - 0.1, initialStart + deltaTime));
      } else if (action === 'resize-right') {
        newEnd = Math.max(initialStart + 0.1, Math.min(validDuration, initialEnd + deltaTime));
      }

      setDraggedOverrides((prev) => ({
        ...prev,
        [item.id]: { start: newStart, end: newEnd },
      }));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      setDraggingBlockId(null);

      setDraggedOverrides((latest) => {
        const finalOverride = latest[item.id];
        if (finalOverride && item.subId) {
          const sub = subtitles.find((s) => s.id === item.subId);
          if (sub && sub.words && item.wordIndex !== undefined) {
            const updatedWords = [...sub.words];
            updatedWords[item.wordIndex] = {
              ...updatedWords[item.wordIndex],
              start: finalOverride.start,
              end: finalOverride.end,
            };
            onUpdateSubtitle?.(item.subId, { words: updatedWords });
          } else if (sub) {
            onUpdateSubtitle?.(item.subId, {
              start: finalOverride.start,
              end: finalOverride.end,
            });
          }
        }
        return latest;
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Memoized Tracks Content to completely skip DOM diffing during 60fps playhead movements
  const tracksContent = useMemo(() => {
    return (
      <>
        {/* 1. Time Ruler */}
        <div className={`${isTimelineExpanded ? 'h-7' : 'h-6'} border-b border-[#27272A] relative select-none bg-[#18181B] transition-all duration-200`}>
          {rulerMarks.map((m, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 flex flex-col items-start pointer-events-none"
              style={{ left: `${m.leftPct}%` }}
            >
              <div className="w-px h-2 bg-[#3F3F46]" />
              <span className="text-[9px] font-normal text-[#71717A] ml-1.5 -mt-0.5 select-none whitespace-nowrap">
                {m.label}
              </span>
            </div>
          ))}
        </div>

        {/* 2. Track 1: Captions / Movable & Draggable Word Blocks Lane */}
        <div className={`${isTimelineExpanded ? 'h-12' : 'h-9'} relative flex items-center px-1 transition-all duration-200 ${hiddenTracks.captions ? 'opacity-15 pointer-events-none' : 'opacity-100'}`}>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {wordsToRender.map((wObj, idx) => {
            const left = (wObj.start / validDuration) * 100;
            const width = Math.max(3.5, ((wObj.end - wObj.start) / validDuration) * 100);
            const isSelected = selectedWordId === wObj.id || (activeSubtitleId && wObj.subId === activeSubtitleId) || (selectedSubtitleId && wObj.subId === selectedSubtitleId);
            const isDragging = draggingBlockId === wObj.id;

            return (
              <div
                key={wObj.id || idx}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => handleBlockMouseDown(e, wObj, 'move')}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  minWidth: '46px',
                }}
                className={`group/block absolute ${isTimelineExpanded ? 'top-1 bottom-1 py-0.5' : 'top-0.5 bottom-0.5 py-0'} rounded px-1.5 flex flex-col justify-center select-none transition-shadow ${
                  isDragging
                    ? 'bg-[#9A8A4B] text-white border-2 border-indigo-400 shadow-xl shadow-indigo-500/30 z-30 cursor-grabbing scale-[1.02]'
                    : isSelected
                    ? 'bg-[#9A8A4B] text-white border-2 border-indigo-400 shadow-md shadow-indigo-500/20 z-10 cursor-grab ring-1 ring-indigo-400/40'
                    : 'bg-[#8F8044] hover:bg-[#9A8A4B] text-white border border-[#A69752] cursor-grab hover:shadow-sm'
                }`}
              >
                <div
                  onMouseDown={(e) => handleBlockMouseDown(e, wObj, 'resize-left')}
                  className="absolute left-0 top-0 bottom-0 w-1.5 cursor-w-resize opacity-0 group-hover/block:opacity-100 bg-white/40 hover:bg-white rounded-l-[4px] transition-opacity"
                  title="Drag to trim start"
                />

                <div className="flex items-center justify-between gap-1 overflow-hidden pointer-events-none">
                  <span className="text-[11px] font-bold truncate leading-tight">
                    {wObj.word}
                  </span>
                  <GripHorizontal size={10} className="text-white/40 shrink-0 opacity-0 group-hover/block:opacity-100 transition-opacity" />
                </div>
                <span className="text-[8px] font-sans text-white/80 flex items-center gap-0.5 pointer-events-none truncate">
                  <span className="italic font-serif text-[9px]">I</span> Text
                </span>

                <div
                  onMouseDown={(e) => handleBlockMouseDown(e, wObj, 'resize-right')}
                  className="absolute right-0 top-0 bottom-0 w-1.5 cursor-e-resize opacity-0 group-hover/block:opacity-100 bg-white/40 hover:bg-white rounded-r-[4px] transition-opacity"
                  title="Drag to trim end"
                />
              </div>
            );
          })}
        </div>

        {/* 3. Track 2: Video 1 Lane */}
        <div className={`${isTimelineExpanded ? 'h-10' : 'h-8'} relative flex items-center px-1 transition-all duration-200 ${hiddenTracks.video ? 'opacity-15 pointer-events-none' : 'opacity-100'}`}>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          <div className={`w-full ${isTimelineExpanded ? 'h-8' : 'h-6'} bg-[#3882B6] rounded-[4px] border border-[#4895CD] flex items-center px-2 shadow-xs cursor-default transition-all duration-200`} />
        </div>

        {/* 4. Track 3: Audio 1 Professional Waveform Lane */}
        <div className={`${isTimelineExpanded ? 'h-10' : 'h-8'} relative flex items-center px-1 bg-[#18181B] transition-all duration-200 ${hiddenTracks.audio ? 'opacity-15 pointer-events-none' : 'opacity-100'}`}>
          <div className={`w-full ${isTimelineExpanded ? 'h-8' : 'h-6'} bg-[#0D2E21] border border-[#144733] rounded-[4px] relative overflow-hidden flex items-center px-2 shadow-xs transition-all duration-200`}>
            <div className="absolute inset-0 left-2 right-2 flex items-center pointer-events-none">
              <AudioWaveformCanvas duration={validDuration} zoomFactor={zoomFactor} isHidden={hiddenTracks.audio} />
            </div>
          </div>
        </div>
      </>
    );
  }, [
    rulerMarks,
    wordsToRender,
    isTimelineExpanded,
    hiddenTracks,
    validDuration,
    selectedWordId,
    activeSubtitleId,
    selectedSubtitleId,
    draggingBlockId,
    zoomFactor,
  ]);

  return (
    <div className="w-full h-full bg-[#18181B] p-1.5 text-white select-none overflow-hidden rounded-2xl border border-[#27272A]/80 shadow-2xl font-sans flex gap-1.5">
      {/* LEFT SECTION: #242428 Card with rounded-[15px] */}
      <div className="w-30 bg-[#242428] rounded-[15px] flex p-1.5 flex-col shrink-0 overflow-hidden h-full">
        {/* Top: Mode Switcher Pill [ WORD | LINE ] */}
        <div className={`${isTimelineExpanded ? 'h-10' : 'h-8'} px-1 flex items-center justify-center border-b border-[#2B2B32]/60 transition-all duration-200`}>
          <div className="flex items-center bg-[#18181B] p-0.5 rounded-lg border border-[#2B2B32] w-full justify-center">
            <Button
              variant={mode === 'WORD' ? 'primary' : 'quiet'}
              onPress={() => setMode('WORD')}
              className="flex-1 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer text-center"
            >
              WORD
            </Button>
            <Button
              variant={mode === 'LINE' ? 'primary' : 'quiet'}
              onPress={() => setMode('LINE')}
              className="flex-1 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer text-center"
            >
              LINE
            </Button>
          </div>
        </div>

        {/* Ruler Header Blank Spacer */}
        <div className={`${isTimelineExpanded ? 'h-7' : 'h-6'} border-b border-[#2B2B32]/60 transition-all duration-200`} />

        {/* Track 1 Header: Captions */}
        <div className={`${isTimelineExpanded ? 'h-12' : 'h-9'} px-2 flex items-center justify-between border-b border-[#2B2B32]/60 text-[11px] font-semibold text-white group transition-all duration-200`}>
          <div className="flex items-center gap-1.5">
            <span className="text-[#EAB308] italic font-serif font-bold text-xs">I</span>
            <span>Captions</span>
          </div>
          <button
            type="button"
            onClick={() => toggleTrackHidden('captions')}
            className="text-[#71717A] hover:text-white transition-colors cursor-pointer p-0.5"
            title={hiddenTracks.captions ? 'Show track' : 'Hide track'}
          >
            {hiddenTracks.captions ? <EyeOff size={11} className="text-red-400" /> : <Eye size={11} />}
          </button>
        </div>

        {/* Track 2 Header: Video 1 */}
        <div className={`${isTimelineExpanded ? 'h-10' : 'h-8'} px-2 flex items-center justify-between border-b border-[#2B2B32]/60 text-[11px] font-semibold text-white group transition-all duration-200`}>
          <div className="flex items-center gap-1.5">
            <Video size={12} className="text-[#3882B6]" />
            <span>Video 1</span>
          </div>
          <button
            type="button"
            onClick={() => toggleTrackHidden('video')}
            className="text-[#71717A] hover:text-white transition-colors cursor-pointer p-0.5"
            title={hiddenTracks.video ? 'Show track' : 'Hide track'}
          >
            {hiddenTracks.video ? <EyeOff size={11} className="text-red-400" /> : <Eye size={11} />}
          </button>
        </div>

        {/* Track 3 Header: Audio 1 */}
        <div className={`${isTimelineExpanded ? 'h-10' : 'h-8'} px-2 flex items-center justify-between text-[11px] font-semibold text-white group transition-all duration-200`}>
          <div className="flex items-center gap-1.5">
            <Volume2 size={12} className="text-[#10B981]" />
            <span>Audio 1</span>
          </div>
          <button
            type="button"
            onClick={() => toggleTrackHidden('audio')}
            className="text-[#71717A] hover:text-white transition-colors cursor-pointer p-0.5"
            title={hiddenTracks.audio ? 'Show track' : 'Hide track'}
          >
            {hiddenTracks.audio ? <EyeOff size={11} className="text-red-400" /> : <Eye size={11} />}
          </button>
        </div>
      </div>

      {/* RIGHT SECTION: Multi-Track Timeline & Toolbar */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#18181B]">
        {/* 1. TOP HORIZONTAL TOOLBAR */}
        <Toolbar
          aria-label="Timeline Editing Tools"
          className="h-9 w-full bg-[#18181B] px-2 flex items-center justify-between shrink-0 border-b border-[#27272A]"
        >
          {/* Left Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="quiet"
              onPress={() => onAddSubtitle?.()}
              aria-label="Add Word"
              className="h-7 px-2 text-[11px] font-semibold text-white hover:bg-white/5 rounded-md gap-1 flex items-center"
            >
              <Plus size={12} />
              <span>Word</span>
            </Button>

            <TooltipTrigger delay={100}>
              <Button
                variant="quiet"
                aria-label="Filter Properties"
                className="w-7 h-7 p-0 text-[#A1A1AA] hover:text-white flex items-center justify-center rounded-md"
              >
                <SlidersHorizontal size={13} />
              </Button>
              <Tooltip placement="top">Track Filters</Tooltip>
            </TooltipTrigger>

            <TooltipTrigger delay={100}>
              <Button
                variant="quiet"
                onPress={() => {
                  if (activeSubtitleId) onSplitSubtitle?.(activeSubtitleId);
                }}
                aria-label="Split Segment (S)"
                className="w-7 h-7 p-0 text-[#A1A1AA] hover:text-white flex items-center justify-center rounded-md"
              >
                <Scissors size={13} />
              </Button>
              <Tooltip placement="top">Split Segment (S)</Tooltip>
            </TooltipTrigger>

            <TooltipTrigger delay={100}>
              <Button
                variant="quiet"
                onPress={() => {
                  if (activeSubtitleId) onDeleteSubtitle?.(activeSubtitleId);
                }}
                aria-label="Delete Segment"
                className="w-7 h-7 p-0 text-[#A1A1AA] hover:text-red-400 flex items-center justify-center rounded-md"
              >
                <Trash2 size={13} />
              </Button>
              <Tooltip placement="top">Delete Block</Tooltip>
            </TooltipTrigger>

            <div className="h-3.5 w-px bg-[#27272A] mx-0.5" />

            <TooltipTrigger delay={100}>
              <ToggleButton
                isSelected={isSnapActive}
                onChange={setIsSnapActive}
                aria-label="Snap to Edges (N)"
                className="w-7 h-7 p-0 rounded-md text-[#A1A1AA] data-selected:bg-indigo-600 data-selected:text-white flex items-center justify-center"
              >
                <Magnet size={13} />
              </ToggleButton>
              <Tooltip placement="top">Magnet Snap (N)</Tooltip>
            </TooltipTrigger>

            <TooltipTrigger delay={100}>
              <ToggleButton
                isSelected={isLinkActive}
                onChange={setIsLinkActive}
                aria-label="Link Selection (L)"
                className="w-7 h-7 p-0 rounded-md text-[#A1A1AA] data-selected:bg-indigo-600 data-selected:text-white flex items-center justify-center"
              >
                <Link2 size={13} />
              </ToggleButton>
              <Tooltip placement="top">Link Tracks (L)</Tooltip>
            </TooltipTrigger>
          </div>

          {/* Right Actions: Zoom & Expand */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1">
              <TooltipTrigger delay={100}>
                <Button
                  variant="quiet"
                  onPress={() => setZoomLevel((z) => Math.max(0, z - 15))}
                  aria-label="Zoom Out"
                  className="w-6 h-6 p-0 text-[#A1A1AA] hover:text-white flex items-center justify-center rounded-md"
                >
                  <ZoomOut size={12} />
                </Button>
                <Tooltip placement="top">Zoom Out (-)</Tooltip>
              </TooltipTrigger>

              <div className="w-20">
                <Slider
                  aria-label="Timeline Zoom"
                  minValue={0}
                  maxValue={100}
                  value={zoomLevel}
                  onChange={(val) => setZoomLevel(Number(val))}
                  className="w-full"
                />
              </div>

              <TooltipTrigger delay={100}>
                <Button
                  variant="quiet"
                  onPress={() => setZoomLevel((z) => Math.min(100, z + 15))}
                  aria-label="Zoom In"
                  className="w-6 h-6 p-0 text-[#A1A1AA] hover:text-white flex items-center justify-center rounded-md"
                >
                  <ZoomIn size={12} />
                </Button>
                <Tooltip placement="top">Zoom In (+)</Tooltip>
              </TooltipTrigger>
            </div>

            <div className="h-3.5 w-px bg-[#27272A] mx-0.5" />

            <TooltipTrigger delay={100}>
              <Button
                variant="quiet"
                onPress={toggleExpand}
                aria-label={isTimelineExpanded ? 'Collapse Timeline' : 'Expand Timeline'}
                className="w-6 h-6 p-0 text-[#A1A1AA] hover:text-white flex items-center justify-center rounded-md"
              >
                {isTimelineExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </Button>
              <Tooltip placement="top">{isTimelineExpanded ? 'Collapse Timeline' : 'Expand Timeline'}</Tooltip>
            </TooltipTrigger>
          </div>
        </Toolbar>

        {/* 2. MULTI-TRACK TIMELINE BODY */}
        <div className="flex flex-1 min-h-0 w-full overflow-hidden bg-[#18181B] transition-all duration-200">
          {/* Scrollable Tracks Area */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden relative custom-scrollbar bg-[#18181B]">
            <div
              ref={trackContainerRef}
              onClick={handleTrackClick}
              style={{ width: `${Math.max(100, zoomFactor * 100)}%`, minWidth: `${Math.max(650, validDuration * 60 * zoomFactor)}px` }}
              className="h-full relative flex flex-col cursor-pointer bg-[#18181B]"
            >
              {tracksContent}

              {/* 5. Playhead Laser & Scrubber Needle (Static clean pill, no hover scale, hardware accelerated) */}
              <div
                style={{ left: `${progressPercent}%`, willChange: 'left' }}
                className="absolute top-0 bottom-0 pointer-events-none z-30 -translate-x-1/2 flex flex-col items-center"
              >
                {/* Indigo Playhead Top Handle */}
                <div
                  onMouseDown={handlePlayheadMouseDown}
                  className="w-3.5 h-4 bg-indigo-500 shadow-md pointer-events-auto cursor-ew-resize"
                  style={{clipPath: "polygon(0% 0%, 100% 0%, 100% 60%, 50% 100%, 0% 60%)"}}  
                />
                {/* Laser Vertical Guideline */}
                <div className="w-[1.5px] flex-1 bg-indigo-500 shadow-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Timeline;