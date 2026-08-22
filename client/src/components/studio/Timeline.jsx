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

// Realistic Audio Waveform Visualizer using Canvas
function AudioWaveformCanvas({ duration = 12, zoomFactor = 1, isHidden = false }) {
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

    // Number of bars based on width
    const barWidth = 2.5;
    const barGap = 1.5;
    const totalBars = Math.floor(width / (barWidth + barGap));
    const centerY = height / 2;

    // Speech pattern simulation matching speech cadences
    for (let i = 0; i < totalBars; i++) {
      const t = (i / totalBars) * duration;
      const x = i * (barWidth + barGap);

      // Speech burst frequencies
      const speechCadence =
        Math.sin(t * 3.5) * 0.4 +
        Math.sin(t * 8.2) * 0.3 +
        Math.cos(t * 1.8) * 0.25;
      
      const isVoiceBurst = Math.abs(speechCadence) > 0.15;
      const baseAmp = isVoiceBurst ? 0.35 + Math.random() * 0.55 : 0.08 + Math.random() * 0.12;

      // Peak amplitude in pixels
      const barHeight = Math.max(3, baseAmp * (height * 0.78));

      // Gradient color for audio bar
      const gradient = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2);
      gradient.addColorStop(0, '#34D399');
      gradient.addColorStop(0.5, '#10B981');
      gradient.addColorStop(1, '#059669');

      ctx.fillStyle = gradient;

      // Draw rounded bar
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
}

export function Timeline({
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
  const [selectedWordId, setSelectedWordId] = useState('word-4'); // Default selected 'important.'
  const [hiddenTracks, setHiddenTracks] = useState({ captions: false, video: false, audio: false });

  // Local word overrides for smooth real-time drag interaction
  const [draggedOverrides, setDraggedOverrides] = useState({});
  const [draggingBlockId, setDraggingBlockId] = useState(null);

  const trackContainerRef = useRef(null);
  const validDuration = Math.max(1, duration || 12);
  const zoomFactor = 1 + (zoomLevel / 100) * 2.5; // 1x to 3.5x

  const toggleTrackHidden = (trackKey) => {
    setHiddenTracks((prev) => ({ ...prev, [trackKey]: !prev[trackKey] }));
  };

  // Sample word items matching the design
  const defaultWordItems = useMemo(() => [
    { id: 'word-1', word: 'Language', start: 0.52, end: 1.15, text: 'Language' },
    { id: 'word-2', word: 'is', start: 1.2, end: 1.48, text: 'is' },
    { id: 'word-3', word: 'so', start: 1.52, end: 1.78, text: 'so' },
    { id: 'word-4', word: 'important.', start: 1.85, end: 2.45, text: 'important.' },
    { id: 'word-5', word: 'When', start: 2.6, end: 2.8, text: 'When' },
    { id: 'word-6', word: 'you', start: 2.82, end: 3.1, text: 'you' },
    { id: 'word-7', word: 'learn', start: 3.15, end: 3.55, text: 'learn' },
  ], []);

  // Compute words to render with real-time drag positions
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

  // Ruler timestamp marks
  const rulerMarks = useMemo(() => {
    const marks = [];
    const step = 0.52; // Matching 00:00.520 intervals from design
    for (let t = 0; t <= validDuration; t += step) {
      marks.push({
        time: t,
        leftPct: (t / validDuration) * 100,
        label: formatTimestamp(t),
      });
    }
    return marks;
  }, [validDuration]);

  // Click on timeline to seek
  const handleTrackClick = (e) => {
    if (!trackContainerRef.current) return;
    const rect = trackContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek?.(percent * validDuration);
  };

  // Playhead scrubber dragging
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

  // DRAGGABLE / MOVABLE TIMELINE BLOCK HANDLER
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

        // Magnet Snap to playhead or other blocks
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

      // Commit changes to parent state if subtitle exists
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

  return (
    <div className="w-full h-full bg-[#18181B] p-1.5 text-white select-none overflow-hidden rounded-2xl border border-[#27272A]/80 shadow-2xl font-sans flex gap-1.5">
      {/* LEFT SECTION: #242428 Card with rounded-[15px] */}
      <div className="w-40 bg-[#242428] rounded-[15px] flex flex-col shrink-0 overflow-hidden h-full">
        {/* Top: Mode Switcher Pill [ WORD | LINE ] */}
        <div className={`${isTimelineExpanded ? 'h-12' : 'h-10'} px-2 flex items-center justify-center border-b border-[#2B2B32]/60 transition-all duration-200`}>
          <div className="flex items-center bg-[#18181B] p-0.5 rounded-lg border border-[#2B2B32] w-full justify-center">
            <button
              type="button"
              onClick={() => setMode('WORD')}
              className={`flex-1 py-1 text-xs font-bold rounded-md transition-all cursor-pointer text-center ${
                mode === 'WORD'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              WORD
            </button>
            <button
              type="button"
              onClick={() => setMode('LINE')}
              className={`flex-1 py-1 text-xs font-bold rounded-md transition-all cursor-pointer text-center ${
                mode === 'LINE'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-[#8E8E93] hover:text-white'
              }`}
            >
              LINE
            </button>
          </div>
        </div>

        {/* Ruler Header Blank Spacer */}
        <div className={`${isTimelineExpanded ? 'h-8' : 'h-7'} border-b border-[#2B2B32]/60 transition-all duration-200`} />

        {/* Track 1 Header: Captions */}
        <div className={`${isTimelineExpanded ? 'h-16' : 'h-11'} px-3 flex items-center justify-between border-b border-[#2B2B32]/60 text-xs font-semibold text-white group transition-all duration-200`}>
          <div className="flex items-center gap-2">
            <span className="text-[#EAB308] italic font-serif font-bold text-sm">I</span>
            <span>Captions</span>
          </div>
          <TooltipTrigger delay={100}>
            <Button
              variant="quiet"
              onPress={() => toggleTrackHidden('captions')}
              aria-label={hiddenTracks.captions ? 'Show Captions Track' : 'Hide Captions Track'}
              className="w-6 h-6 p-0 text-[#A1A1AA] hover:text-white"
            >
              {hiddenTracks.captions ? <EyeOff size={13} className="text-[#71717A]" /> : <Eye size={13} />}
            </Button>
            <Tooltip placement="right">{hiddenTracks.captions ? 'Show Track' : 'Hide Track'}</Tooltip>
          </TooltipTrigger>
        </div>

        {/* Track 2 Header: Video 1 */}
        <div className={`${isTimelineExpanded ? 'h-15' : 'h-11'} px-3 flex items-center justify-between border-b border-[#2B2B32]/60 text-xs font-semibold text-white group transition-all duration-200`}>
          <div className="flex items-center gap-2">
            <Video size={13} className="text-[#0099FF]" />
            <span>Video 1</span>
          </div>
          <TooltipTrigger delay={100}>
            <Button
              variant="quiet"
              onPress={() => toggleTrackHidden('video')}
              aria-label={hiddenTracks.video ? 'Show Video Track' : 'Hide Video Track'}
              className="w-6 h-6 p-0 text-[#A1A1AA] hover:text-white"
            >
              {hiddenTracks.video ? <EyeOff size={13} className="text-[#71717A]" /> : <Eye size={13} />}
            </Button>
            <Tooltip placement="right">{hiddenTracks.video ? 'Show Track' : 'Hide Track'}</Tooltip>
          </TooltipTrigger>
        </div>

        {/* Track 3 Header: Audio 1 */}
        <div className={`${isTimelineExpanded ? 'h-15' : 'h-11'} px-3 flex items-center justify-between text-xs font-semibold text-white group transition-all duration-200`}>
          <div className="flex items-center gap-2">
            <Volume2 size={13} className="text-[#10B981]" />
            <span>Audio 1</span>
          </div>
          <TooltipTrigger delay={100}>
            <Button
              variant="quiet"
              onPress={() => toggleTrackHidden('audio')}
              aria-label={hiddenTracks.audio ? 'Show Audio Track' : 'Hide Audio Track'}
              className="w-6 h-6 p-0 text-[#A1A1AA] hover:text-white"
            >
              {hiddenTracks.audio ? <EyeOff size={13} className="text-[#71717A]" /> : <Eye size={13} />}
            </Button>
            <Tooltip placement="right">{hiddenTracks.audio ? 'Show Track' : 'Hide Track'}</Tooltip>
          </TooltipTrigger>
        </div>
      </div>

      {/* RIGHT MAIN SECTION: Toolbar + Tracks */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#18181B]">
        {/* 1. TOP TIMELINE TOOLBAR (Using UI Toolbar & Normal Button without variant) */}
        <Toolbar aria-label="Timeline Toolbar" className="h-12 px-4 border-b border-[#27272A] bg-[#18181B] flex items-center justify-between shrink-0">
          {/* Left Controls: + Word & Editing Tools & Toggles */}
          <div className="flex items-center gap-3">
            {/* + Word Button (Normal Button, no variant) */}
            <TooltipTrigger delay={100}>
              <Button
                onPress={onAddSubtitle}
                className="h-8 px-3 text-xs font-medium gap-1.5"
              >
                <Plus size={13} />
                <span>Word</span>
              </Button>
              <Tooltip placement="top">Add Word Cue</Tooltip>
            </TooltipTrigger>

            {/* Quick Editing Action Tools (Normal Buttons, no variant) */}
            <div className="flex items-center gap-1.5">
              <TooltipTrigger delay={100}>
                <Button
                  aria-label="Settings / Levels"
                  className="w-8 h-8 p-0"
                >
                  <SlidersHorizontal size={14} />
                </Button>
                <Tooltip placement="top">Track Settings</Tooltip>
              </TooltipTrigger>

              <TooltipTrigger delay={100}>
                <Button
                  onPress={() => onSplitSubtitle?.(selectedSubtitleId)}
                  aria-label="Split Cue"
                  className="w-8 h-8 p-0"
                >
                  <Scissors size={14} />
                </Button>
                <Tooltip placement="top">Split at Playhead</Tooltip>
              </TooltipTrigger>

              <TooltipTrigger delay={100}>
                <Button
                  onPress={() => onDeleteSubtitle?.(selectedSubtitleId)}
                  aria-label="Delete Cue"
                  className="w-8 h-8 p-0 text-red-400 hover:text-red-300"
                >
                  <Trash2 size={14} />
                </Button>
                <Tooltip placement="top">Delete Block</Tooltip>
              </TooltipTrigger>
            </div>

            <div className="h-4 w-px bg-[#27272A]" />

            {/* Magnet / Snap & Link ToggleButtons from UI */}
            <div className="flex items-center gap-1.5">
              <TooltipTrigger delay={100}>
                <ToggleButton
                  isSelected={isSnapActive}
                  onChange={setIsSnapActive}
                  aria-label="Toggle Magnet Snap"
                >
                  <Magnet size={14} />
                </ToggleButton>
                <Tooltip placement="top">Toggle Magnet Snap</Tooltip>
              </TooltipTrigger>

              <TooltipTrigger delay={100}>
                <ToggleButton
                  isSelected={isLinkActive}
                  onChange={setIsLinkActive}
                  aria-label="Link Tracks"
                >
                  <Link2 size={14} />
                </ToggleButton>
                <Tooltip placement="top">Link Tracks</Tooltip>
              </TooltipTrigger>
            </div>
          </div>

          {/* Right Side: Zoom Controls & Fullscreen Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <TooltipTrigger delay={100}>
                <Button
                  variant="quiet"
                  onPress={() => setZoomLevel((prev) => Math.max(0, prev - 15))}
                  aria-label="Zoom Out"
                  className="w-7 h-7 p-0 text-[#A1A1AA] hover:text-white"
                >
                  <ZoomOut size={14} />
                </Button>
                <Tooltip placement="top">Zoom Out</Tooltip>
              </TooltipTrigger>

              {/* UI Library Zoom Slider */}
              <div className="w-24 flex items-center [&_.react-aria-SliderOutput]:hidden [&_.react-aria-Label]:hidden">
                <Slider
                  aria-label="Zoom Level"
                  minValue={0}
                  maxValue={100}
                  value={zoomLevel}
                  onChange={setZoomLevel}
                />
              </div>

              <TooltipTrigger delay={100}>
                <Button
                  variant="quiet"
                  onPress={() => setZoomLevel((prev) => Math.min(100, prev + 15))}
                  aria-label="Zoom In"
                  className="w-7 h-7 p-0 text-[#A1A1AA] hover:text-white"
                >
                  <ZoomIn size={14} />
                </Button>
                <Tooltip placement="top">Zoom In</Tooltip>
              </TooltipTrigger>
            </div>

            <div className="h-4 w-px bg-[#27272A]" />

            <TooltipTrigger delay={100}>
              <Button
                variant="quiet"
                onPress={toggleExpand}
                aria-label={isTimelineExpanded ? 'Collapse Timeline' : 'Expand Timeline'}
                className="w-7 h-7 p-0 text-[#A1A1AA] hover:text-white"
              >
                {isTimelineExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
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
              style={{ width: `${zoomFactor * 100}%` }}
              className="min-w-full h-full relative flex flex-col cursor-pointer bg-[#18181B]"
            >
              {/* 1. Time Ruler */}
              <div className={`${isTimelineExpanded ? 'h-8' : 'h-7'} border-b border-[#27272A] relative select-none bg-[#18181B] transition-all duration-200`}>
                {rulerMarks.map((m, i) => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 flex flex-col items-start pointer-events-none"
                    style={{ left: `${m.leftPct}%` }}
                  >
                    <div className="w-px h-2 bg-[#3F3F46]" />
                    <span className="text-[10px] font-normal text-[#71717A] ml-1.5 -mt-0.5 select-none">
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* 2. Track 1: Captions / Movable & Draggable Word Blocks Lane */}
              <div className={`${isTimelineExpanded ? 'h-16' : 'h-11'} relative flex items-center px-1 transition-all duration-200 ${hiddenTracks.captions ? 'opacity-15 pointer-events-none' : 'opacity-100'}`}>
                {/* 3-Node Bottom Gradient Divider */}
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                {wordsToRender.map((wObj, idx) => {
                  const left = (wObj.start / validDuration) * 100;
                  const width = Math.max(3, ((wObj.end - wObj.start) / validDuration) * 100);
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
                      }}
                      className={`group/block absolute ${isTimelineExpanded ? 'top-2 bottom-2 py-1' : 'top-1 bottom-1 py-0.5'} rounded-[6px] px-2 flex flex-col justify-center select-none transition-shadow ${
                        isDragging
                          ? 'bg-[#9A8A4B] text-white border-2 border-indigo-400 shadow-xl shadow-indigo-500/30 z-30 cursor-grabbing scale-[1.02]'
                          : isSelected
                          ? 'bg-[#9A8A4B] text-white border-2 border-indigo-400 shadow-md shadow-indigo-500/20 z-10 cursor-grab ring-1 ring-indigo-400/40'
                          : 'bg-[#8F8044] hover:bg-[#9A8A4B] text-white border border-[#A69752] cursor-grab hover:shadow-sm'
                      }`}
                    >
                      {/* Left Resize Handle */}
                      <div
                        onMouseDown={(e) => handleBlockMouseDown(e, wObj, 'resize-left')}
                        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-w-resize opacity-0 group-hover/block:opacity-100 bg-white/40 hover:bg-white rounded-l-[4px] transition-opacity"
                        title="Drag to trim start"
                      />

                      {/* Content */}
                      <div className="flex items-center justify-between gap-1 overflow-hidden pointer-events-none">
                        <span className="text-xs font-bold truncate leading-tight">
                          {wObj.word}
                        </span>
                        <GripHorizontal size={10} className="text-white/40 shrink-0 opacity-0 group-hover/block:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-[9px] font-sans text-white/80 flex items-center gap-0.5 pointer-events-none">
                        <span className="italic font-serif text-[10px]">I</span> Text
                      </span>

                      {/* Right Resize Handle */}
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
              <div className={`${isTimelineExpanded ? 'h-15' : 'h-11'} relative flex items-center px-1 transition-all duration-200 ${hiddenTracks.video ? 'opacity-15 pointer-events-none' : 'opacity-100'}`}>
                {/* 3-Node Bottom Gradient Divider */}
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                <div className={`w-full ${isTimelineExpanded ? 'h-11' : 'h-8'} bg-[#3882B6] rounded-[4px] border border-[#4895CD] flex items-center px-2 shadow-xs cursor-default transition-all duration-200`} />
              </div>

              {/* 4. Track 3: Audio 1 Professional Waveform Lane */}
              <div className={`${isTimelineExpanded ? 'h-15' : 'h-11'} relative flex items-center px-1 bg-[#18181B] transition-all duration-200 ${hiddenTracks.audio ? 'opacity-15 pointer-events-none' : 'opacity-100'}`}>
                <div className={`w-full ${isTimelineExpanded ? 'h-11' : 'h-8'} bg-[#0D2E21] border border-[#144733] rounded-[4px] relative overflow-hidden flex items-center px-2 shadow-xs transition-all duration-200`}>
                  {/* High-Resolution Dynamic Audio Waveform */}
                  <div className="absolute inset-0 left-2 right-2 flex items-center pointer-events-none">
                    <AudioWaveformCanvas duration={validDuration} zoomFactor={zoomFactor} isHidden={hiddenTracks.audio} />
                  </div>
                </div>
              </div>

              {/* 5. Playhead Laser & Scrubber Needle (Static clean pill, no hover scale) */}
              <div
                style={{ left: `${progressPercent}%` }}
                className="absolute top-0 bottom-0 pointer-events-none z-30 -translate-x-1/2 flex flex-col items-center"
              >
                {/* Indigo Playhead Top Handle */}
                <div
                  onMouseDown={handlePlayheadMouseDown}
                  className="w-3.5 h-4 bg-indigo-500 rounded-t-sm rounded-b-md shadow-md pointer-events-auto cursor-ew-resize"
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
}

export default Timeline;
