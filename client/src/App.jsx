import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { CaptionInspector } from './components/studio/CaptionInspector';
import { Timeline } from './components/studio/Timeline';
import { VideoPlayer } from './components/studio/VideoPlayer';
import { PropertiesPanel } from './components/studio/PropertiesPanel';

const INITIAL_SUBTITLES = [
  {
    id: 'cue-1',
    start: 0.0,
    end: 1.5,
    text: 'Language is',
    words: [
      { word: 'Language', isHighlighted: true },
      { word: 'is', isHighlighted: false },
    ],
  },
  {
    id: 'cue-2',
    start: 1.5,
    end: 2.2,
    text: 'so',
    words: [{ word: 'so', isHighlighted: true }],
  },
  {
    id: 'cue-3',
    start: 2.2,
    end: 3.5,
    text: 'important.',
    words: [{ word: 'important.', isHighlighted: false }],
  },
  {
    id: 'cue-4',
    start: 3.5,
    end: 5.0,
    text: 'When you learn the',
    words: [
      { word: 'When', isHighlighted: false },
      { word: 'you', isHighlighted: false },
      { word: 'learn', isHighlighted: true },
      { word: 'the', isHighlighted: false },
    ],
  },
  {
    id: 'cue-5',
    start: 5.0,
    end: 6.2,
    text: 'other language,',
    words: [
      { word: 'other', isHighlighted: false },
      { word: 'language,', isHighlighted: false },
    ],
  },
  {
    id: 'cue-6',
    start: 6.2,
    end: 7.8,
    text: "it's easy for you",
    words: [
      { word: "it's", isHighlighted: false },
      { word: 'easy', isHighlighted: true },
      { word: 'for', isHighlighted: false },
      { word: 'you', isHighlighted: false },
    ],
  },
  {
    id: 'cue-7',
    start: 7.8,
    end: 9.0,
    text: 'to communicate,',
    words: [
      { word: 'to', isHighlighted: false },
      { word: 'communicate,', isHighlighted: false },
    ],
  },
  {
    id: 'cue-8',
    start: 9.0,
    end: 10.5,
    text: 'easy to understand,',
    words: [
      { word: 'easy', isHighlighted: true },
      { word: 'to', isHighlighted: false },
      { word: 'understand,', isHighlighted: false },
    ],
  },
];

export default function App() {
  const [projectName, setProjectName] = useState('Untitled Project');
  const [subtitles, setSubtitles] = useState(INITIAL_SUBTITLES);
  const [activeSubtitleId, setActiveSubtitleId] = useState(null);
  const [currentTime, setCurrentTime] = useState(1.85);
  const [isPlaying, setIsPlaying] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('9:16'); // '9:16' | '16:9' | '1:1'
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);

  const handleUpdateSubtitle = useCallback((id, updates) => {
    setSubtitles((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const handleAddSubtitle = useCallback(() => {
    const newId = `cue-${Date.now()}`;
    const newCue = {
      id: newId,
      text: 'New caption line',
      words: [
        { word: 'New', isHighlighted: false },
        { word: 'caption', isHighlighted: true },
        { word: 'line', isHighlighted: false },
      ],
    };
    setSubtitles((prev) => [...prev, newCue]);
  }, []);

  const handleDeleteSubtitle = useCallback((id) => {
    setSubtitles((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleSplitSubtitle = useCallback((id) => {
    setSubtitles((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const cue = prev[idx];
      const words = cue.words || (cue.text || '').split(' ').map((w) => ({ word: w, isHighlighted: false }));
      if (words.length <= 1) return prev;
      const mid = Math.floor(words.length / 2);
      const first = {
        id: cue.id,
        text: words.slice(0, mid).map((w) => w.word).join(' '),
        words: words.slice(0, mid),
      };
      const second = {
        id: `cue-${Date.now()}`,
        text: words.slice(mid).map((w) => w.word).join(' '),
        words: words.slice(mid),
      };
      const next = [...prev];
      next.splice(idx, 1, first, second);
      return next;
    });
  }, []);

  const handleMergeSubtitles = useCallback((firstId, secondId) => {
    setSubtitles((prev) => {
      const first = prev.find((s) => s.id === firstId);
      const second = prev.find((s) => s.id === secondId);
      if (!first || !second) return prev;
      const merged = {
        id: firstId,
        start: Math.min(first.start, second.start),
        end: Math.max(first.end, second.end),
        text: `${first.text} ${second.text}`,
        words: [...(first.words || []), ...(second.words || [])],
      };
      return prev.filter((s) => s.id !== secondId).map((s) => (s.id === firstId ? merged : s));
    });
  }, []);

  const isReelsLayout = aspectRatio === '9:16';

  return (
    <div className="h-screen w-screen bg-[#09090B] text-white flex flex-col font-sans select-none overflow-hidden justify-between">
      {/* 1. Clean Top Header */}
      <Header
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onHome={() => console.log('Home clicked')}
        onImport={() => console.log('Import clicked')}
        onExport={() => console.log('Export clicked')}
      />

      {/* 2. Main Studio Workspace Layout */}
      {isReelsLayout ? (
        /* ==================== REELS VERTICAL 9:16 LAYOUT ==================== */
        <main className="flex-1 min-h-0 px-4 pb-3 relative overflow-hidden bg-[#09090B] flex gap-3 items-stretch">
          {/* Left Column: [Caption Inspector (Top)] + [Timeline (Bottom)] */}
          <div className="flex-1 min-w-0 h-full flex flex-col gap-3">
            {/* Top: Caption Inspector */}
            <div className="flex-1 min-h-0 h-full flex flex-col">
              <CaptionInspector
                subtitles={subtitles}
                activeSubtitleId={activeSubtitleId}
                onSelectSubtitle={setActiveSubtitleId}
                onAddSubtitle={handleAddSubtitle}
                onUpdateSubtitle={handleUpdateSubtitle}
                onDeleteSubtitle={handleDeleteSubtitle}
                onSplitSubtitle={handleSplitSubtitle}
                onMergeSubtitles={handleMergeSubtitles}
              />
            </div>

            {/* Bottom: Timeline */}
            <div className="flex-1 min-h-0 h-full flex flex-col">
              <Timeline
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={12}
                subtitles={subtitles}
                activeSubtitleId={activeSubtitleId}
                onTogglePlay={() => setIsPlaying((p) => !p)}
                onSeek={setCurrentTime}
                onSelectSubtitle={setActiveSubtitleId}
                onUpdateSubtitle={handleUpdateSubtitle}
                onAddSubtitle={handleAddSubtitle}
                onSplitSubtitle={handleSplitSubtitle}
                onDeleteSubtitle={handleDeleteSubtitle}
                isExpanded={isTimelineExpanded}
                onToggleExpand={() => setIsTimelineExpanded((p) => !p)}
              />
            </div>
          </div>

          {/* Center Column: Tall Video Player */}
          <div className="w-[460px] xl:w-[500px] 2xl:w-[540px] h-full shrink-0 flex flex-col">
            <VideoPlayer
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={12}
              subtitles={subtitles}
              activeSubtitleId={activeSubtitleId}
              aspectRatio={aspectRatio}
              onAspectRatioChange={setAspectRatio}
              onTogglePlay={() => setIsPlaying((p) => !p)}
              onSeek={setCurrentTime}
            />
          </div>

          {/* Right Column: Properties Panel */}
          <PropertiesPanel />
        </main>
      ) : (
        /* ==================== YOUTUBE / SQUARE 16:9 / 1:1 LAYOUT ==================== */
        <main className="flex-1 min-h-0 px-4 pb-3 relative overflow-hidden bg-[#09090B] flex gap-3 items-stretch">
          {/* Left & Center Area: [Caption Inspector + Player] on Top, [Wide Timeline] on Bottom */}
          <div className="flex-1 min-w-0 h-full flex flex-col gap-3">
            {/* Top Row: Caption Inspector (Left) + Player (Right) */}
            <div className="flex-1 min-h-0 flex gap-3 items-stretch">
              <div className="w-[600px] xl:w-[680px] h-full shrink-0 flex flex-col">
                <CaptionInspector
                  subtitles={subtitles}
                  activeSubtitleId={activeSubtitleId}
                  onSelectSubtitle={setActiveSubtitleId}
                  onAddSubtitle={handleAddSubtitle}
                  onUpdateSubtitle={handleUpdateSubtitle}
                  onDeleteSubtitle={handleDeleteSubtitle}
                  onSplitSubtitle={handleSplitSubtitle}
                  onMergeSubtitles={handleMergeSubtitles}
                />
              </div>

              <div className="flex-1 h-full min-h-0 flex flex-col">
                <VideoPlayer
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={12}
                  subtitles={subtitles}
                  activeSubtitleId={activeSubtitleId}
                  aspectRatio={aspectRatio}
                  onAspectRatioChange={setAspectRatio}
                  onTogglePlay={() => setIsPlaying((p) => !p)}
                  onSeek={setCurrentTime}
                />
              </div>
            </div>

            {/* Bottom Row: Wide Timeline */}
            <div className="h-72 shrink-0 flex flex-col">
              <Timeline
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={12}
                subtitles={subtitles}
                activeSubtitleId={activeSubtitleId}
                onTogglePlay={() => setIsPlaying((p) => !p)}
                onSeek={setCurrentTime}
                onSelectSubtitle={setActiveSubtitleId}
                onUpdateSubtitle={handleUpdateSubtitle}
                onAddSubtitle={handleAddSubtitle}
                onSplitSubtitle={handleSplitSubtitle}
                onDeleteSubtitle={handleDeleteSubtitle}
                isExpanded={isTimelineExpanded}
                onToggleExpand={() => setIsTimelineExpanded((p) => !p)}
              />
            </div>
          </div>

          {/* Right Column: Properties Panel */}
          <PropertiesPanel />
        </main>
      )}
    </div>
  );
}
