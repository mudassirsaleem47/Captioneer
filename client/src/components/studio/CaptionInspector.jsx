import React, { useState, useMemo } from "react";
import {
  Captions as CaptionsIcon,
  Type,
  Folder,
  Search,
  Settings,
  ChevronDown,
  LayoutGrid,
  Plus,
  Trash2,
  Scissors,
  Merge,
  Sparkles,
  Check,
  EllipsisVertical,
  X,
  Clock,
} from "lucide-react";
import { Button } from "../ui/Button";
import {
  Menu,
  MenuItem,
  MenuTrigger,
  MenuSection,
  MenuSeparator,
} from "../ui/Menu";
import { TextField } from "../ui/TextField";
import { Tooltip, TooltipTrigger } from "../ui/Tooltip";

export function CaptionInspector({
  subtitles = [],
  activeSubtitleId,
  selectedSubtitleId,
  onSelectSubtitle,
  onAddSubtitle,
  onUpdateSubtitle,
  onDeleteSubtitle,
  onSplitSubtitle,
  onMergeSubtitles,
  onSeek,
  style = {},
  onStyleChange,
}) {
  const [activeTab, setActiveTab] = useState("captions");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRowId, setEditingRowId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const [uploadedFonts, setUploadedFonts] = useState([]);
  const [playingSoundUrl, setPlayingSoundUrl] = useState(null);
  const audioRef = React.useRef(null);

  const togglePlaySound = (url) => {
    if (audioRef.current) {
      if (playingSoundUrl === url) {
        audioRef.current.pause();
        setPlayingSoundUrl(null);
      } else {
        audioRef.current.src = url;
        audioRef.current.play().catch(() => {});
        setPlayingSoundUrl(url);
      }
    }
  };

  React.useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fredoka+One&family=Playfair+Display:ital,wght@0,700;1,700&family=Bebas+Neue&family=Outfit:wght@700;800&family=Anton&family=Rubik:wght@700;900&family=Montserrat:wght@700;800;900&family=Inter:wght@700;800&display=swap";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const handleFontUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fontName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-]/g, "_");
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const buffer = event.target.result;
        const fontFace = new FontFace(fontName, buffer);
        await fontFace.load();
        document.fonts.add(fontFace);

        setUploadedFonts((prev) => [
          ...prev,
          { label: `${file.name} (Uploaded)`, value: fontName },
        ]);

        onStyleChange?.({ fontFamily: fontName });
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("Font loading error:", err);
    }
  };

  // Sample default lines if empty
  const defaultSampleSubtitles = useMemo(
    () => [
      {
        id: "cue-1",
        start: 0.0,
        end: 1.5,
        text: "Language is",
        words: [
          { word: "Language", isHighlighted: true },
          { word: "is", isHighlighted: false },
        ],
      },
      {
        id: "cue-2",
        start: 1.5,
        end: 2.2,
        text: "so",
        words: [{ word: "so", isHighlighted: true }],
      },
      {
        id: "cue-3",
        start: 2.2,
        end: 3.5,
        text: "important.",
        words: [{ word: "important.", isHighlighted: false }],
      },
      {
        id: "cue-4",
        start: 3.5,
        end: 5.0,
        text: "When you learn the",
        words: [
          { word: "When", isHighlighted: false },
          { word: "you", isHighlighted: false },
          { word: "learn", isHighlighted: true },
          { word: "the", isHighlighted: false },
        ],
      },
      {
        id: "cue-5",
        start: 5.0,
        end: 6.2,
        text: "other language,",
        words: [
          { word: "other", isHighlighted: false },
          { word: "language,", isHighlighted: false },
        ],
      },
      {
        id: "cue-6",
        start: 6.2,
        end: 7.8,
        text: "it's easy for you",
        words: [
          { word: "it's", isHighlighted: false },
          { word: "easy", isHighlighted: true },
          { word: "for", isHighlighted: false },
          { word: "you", isHighlighted: false },
        ],
      },
      {
        id: "cue-7",
        start: 7.8,
        end: 9.0,
        text: "to communicate,",
        words: [
          { word: "to", isHighlighted: false },
          { word: "communicate,", isHighlighted: false },
        ],
      },
      {
        id: "cue-8",
        start: 9.0,
        end: 10.5,
        text: "easy to understand,",
        words: [
          { word: "easy", isHighlighted: true },
          { word: "to", isHighlighted: false },
          { word: "understand,", isHighlighted: false },
        ],
      },
    ],
    [],
  );

  const items = subtitles.length > 0 ? subtitles : defaultSampleSubtitles;

  // Filtered by search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((s) => s.text?.toLowerCase().includes(q));
  }, [items, searchQuery]);

  // Toggle word highlight
  const handleToggleWordHighlight = (cueId, wordIndex, e) => {
    e.stopPropagation();
    const cue = items.find((s) => s.id === cueId);
    if (!cue) return;

    let words =
      cue.words ||
      cue.text.split(/\s+/).map((w) => ({ word: w, isHighlighted: false }));
    const updatedWords = words.map((w, idx) => {
      if (idx === wordIndex) {
        return { ...w, isHighlighted: !w.isHighlighted };
      }
      return w;
    });

    onUpdateSubtitle?.(cueId, { words: updatedWords });
  };

  // Start editing text inline
  const handleStartEdit = (cue, e) => {
    e?.stopPropagation?.();
    setEditingRowId(cue.id);
    setEditingText(cue.text || "");
  };

  // Save text edit
  const handleSaveEdit = (cueId) => {
    const trimmed = editingText.trim();
    if (trimmed) {
      const words = trimmed
        .split(/\s+/)
        .map((w) => ({ word: w, isHighlighted: false }));
      onUpdateSubtitle?.(cueId, { text: trimmed, words });
    }
    setEditingRowId(null);
  };

  // Auto Highlight Keywords Tool Action
  const handleAutoHighlight = () => {
    items.forEach((cue) => {
      const words = (
        cue.words || cue.text.split(/\s+/).map((w) => ({ word: w }))
      ).map((w, idx) => {
        // Highlight first word or words > 4 characters
        const isKey = w.word.length > 4 || idx === 0;
        return { ...w, isHighlighted: isKey };
      });
      onUpdateSubtitle?.(cue.id, { words });
    });
  };

  // Clear Highlights Tool Action
  const handleClearHighlights = () => {
    items.forEach((cue) => {
      const words = (
        cue.words || cue.text.split(/\s+/).map((w) => ({ word: w }))
      ).map((w) => ({
        ...w,
        isHighlighted: false,
      }));
      onUpdateSubtitle?.(cue.id, { words });
    });
  };

  return (
    <div className="flex h-full w-full bg-[#18181B] p-1.5 pr-0 text-white select-none shadow-2xl overflow-hidden rounded-2xl">
      <nav className="w-11 h-full bg-[#242428] flex flex-col items-center py-3 gap-2.5 shrink-0 rounded-[15px]">
        {/* Captions Tab */}
        <TooltipTrigger delay={100}>
          <Button
            type="button"
            onPress={() => setActiveTab("captions")}
            aria-label="Captions"
            className={`w-8 h-8 p-0 rounded-lg flex items-center justify-center transition-all ${
              activeTab === "captions"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-[#A1A1AA] hover:bg-white/5 hover:text-white"
            }`}
          >
            <CaptionsIcon size={16} />
          </Button>
          <Tooltip placement="right">Captions</Tooltip>
        </TooltipTrigger>

        {/* Custom Fonts Tab */}
        <TooltipTrigger delay={100}>
          <Button
            type="button"
            onPress={() => setActiveTab("fonts")}
            aria-label="Custom Fonts"
            className={`w-8 h-8 p-0 rounded-lg flex items-center justify-center transition-all ${
              activeTab === "fonts"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-[#A1A1AA] hover:bg-white/5 hover:text-white"
            }`}
          >
            <Type size={16} />
          </Button>
          <Tooltip placement="right">Custom Fonts</Tooltip>
        </TooltipTrigger>

        {/* Library Tab */}
        <TooltipTrigger delay={100}>
          <Button
            type="button"
            onPress={() => setActiveTab("library")}
            aria-label="Library"
            className={`w-8 h-8 p-0 rounded-lg flex items-center justify-center transition-all ${
              activeTab === "library"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-[#A1A1AA] hover:bg-white/5 hover:text-white"
            }`}
          >
            <Folder size={16} />
          </Button>
          <Tooltip placement="right">Library</Tooltip>
        </TooltipTrigger>
      </nav>

      {/* 2. MAIN PANEL CONTENT */}
      <section className="flex-1 h-full flex flex-col overflow-hidden">
        {activeTab === "captions" && (
          <>
            {/* Top Header */}
            <header className="h-11 px-3 flex items-center justify-between shrink-0 gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight shrink-0">
                Captions
              </h2>

              {/* Right Tools: Search & Caption Tools Dropdown */}
              <div className="flex items-center gap-1.5 min-w-0">

                <TooltipTrigger delay={100}>
                  <Button onPress={onAddSubtitle} className="w-7 h-7 p-0 flex items-center justify-center rounded-md">
                    <Plus size={13} />
                  </Button>
                  <Tooltip placement="bottom">Add Caption</Tooltip>
                </TooltipTrigger>

                {/* Animated Width Search Container */}
                <div
                  style={{
                    width: showSearch ? '160px' : '0px',
                    opacity: showSearch ? 1 : 0,
                    transition: 'width 240ms cubic-bezier(0.23, 1, 0.32, 1), opacity 200ms ease-out',
                    willChange: 'width, opacity',
                  }}
                  className="overflow-hidden flex items-center py-1.5 px-0.5"
                >
                  <TextField
                    aria-label="Search transcripts"
                    placeholder="Search captions..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    autoFocus={showSearch}
                    onBlur={() => {
                      setShowSearch(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setShowSearch(false);
                        setSearchQuery('');
                      }
                    }}
                    className="w-full"
                  />
                </div>

                {/* Search Icon Button */}
                <TooltipTrigger delay={100}>
                  <Button
                    onPress={() => {
                      setShowSearch((prev) => !prev);
                      if (showSearch) setSearchQuery('');
                    }}
                    aria-label="Search Captions"
                    className="w-7 h-7 p-0 flex items-center justify-center rounded-md"
                  >
                    <Search size={13} />
                  </Button>
                  <Tooltip placement="bottom">Search</Tooltip>
                </TooltipTrigger>

                {/* Caption Tools Dropdown Menu from UI */}
                <MenuTrigger>
                  <Button className="w-7 h-7 p-0 flex items-center justify-center rounded-md">
                    <EllipsisVertical size={13} className="text-[#A1A1AA]" />
                  </Button>
                  <Menu
                    onAction={(key) => {
                      if (key === "add") onAddSubtitle?.();
                      if (key === "highlight") handleAutoHighlight();
                      if (key === "clear") handleClearHighlights();
                    }}
                  >
                    <MenuItem id="add">
                      Add New Caption Line
                    </MenuItem>
                    <MenuItem id="highlight">
                      Auto-Highlight Keywords
                    </MenuItem>
                    <MenuItem id="clear">
                      Clear All Highlights
                    </MenuItem>
                  </Menu>
                </MenuTrigger>
              </div>
            </header>

            {/* 3. CAPTIONS TRANSCRIPT ROWS LIST */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredItems.map((cue, index) => {
                const isEditingThis = editingRowId === cue.id;
                const wordsList =
                  cue.words && cue.words.length > 0
                    ? cue.words
                    : (cue.text || "")
                        .split(/\s+/)
                        .filter(Boolean)
                        .map((w) => ({ word: w, isHighlighted: false }));

                const actualIndex = items.findIndex((s) => s.id === cue.id);
                const canMerge = actualIndex < items.length - 1;

                const isActiveRow = activeSubtitleId === cue.id || selectedSubtitleId === cue.id;

                return (
                  <div
                    key={cue.id || index}
                    onClick={() => {
                      onSelectSubtitle?.(cue.id);
                      if (cue.start !== undefined) onSeek?.(cue.start);
                    }}
                    className={`relative group px-3.5 py-1.5 flex items-center justify-between gap-2.5 transition-all duration-150 cursor-pointer ${
                      isActiveRow
                        ? "bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent"
                        : "hover:bg-gradient-to-r hover:from-transparent hover:via-indigo-500/5 hover:to-transparent"
                    }`}
                  >
                    {/* 3-Node Bottom Gradient Border: Left Dark Transparent -> Center White -> Right Dark Transparent */}
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                    {/* Left: Row Index Badge (Highlighted on Active without border) */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span
                        className={`w-5 h-5 text-center text-[10px] font-mono font-semibold shrink-0 rounded-full flex items-center justify-center transition-all ${
                          isActiveRow
                            ? "text-indigo-300 bg-indigo-500/20"
                            : "text-[#71717A]"
                        }`}
                      >
                        {index + 1}
                      </span>

                      {/* Center: Caption Text / Word Chips */}
                      {isEditingThis ? (
                        <div
                          className="flex items-center gap-2 flex-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <TextField
                            aria-label="Edit caption text"
                            value={editingText}
                            onChange={setEditingText}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(cue.id);
                              if (e.key === "Escape") setEditingRowId(null);
                            }}
                            autoFocus
                            className="flex-1"
                          />
                          <Button
                            variant="quiet"
                            onPress={() => handleSaveEdit(cue.id)}
                            className="w-7 h-7 p-0 text-indigo-400 hover:text-indigo-300 shrink-0"
                          >
                            <Check size={14} />
                          </Button>
                        </div>
                      ) : (
                        <div
                          onDoubleClick={(e) => handleStartEdit(cue, e)}
                          className="flex flex-wrap items-center gap-1 text-xs leading-normal"
                        >
                          {wordsList.map((wObj, wIdx) => {
                            const wordText =
                              typeof wObj === "string" ? wObj : wObj.word;
                            const isHigh =
                              typeof wObj === "object" ? wObj.isHighlighted : false;

                            return (
                              <span
                                key={wIdx}
                                onClick={(e) =>
                                  handleToggleWordHighlight(cue.id, wIdx, e)
                                }
                                title="Click to toggle word highlight"
                                className={`transition-all select-none ${
                                  isHigh
                                    ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 rounded px-1.5 py-0.5 font-medium shadow-xs hover:bg-indigo-500/25 hover:scale-105"
                                    : "text-[#E4E4E7] font-normal px-1 py-0.5 rounded hover:bg-white/5 hover:text-white"
                                }`}
                              >
                                {wordText}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right: Actions Menu Trigger */}
                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MenuTrigger>
                        <Button
                          variant="quiet"
                          aria-label="Caption row actions"
                          className="w-6 h-6 p-0 text-[#71717A] hover:text-white rounded-md hover:bg-white/5 opacity-60 group-hover:opacity-100 transition-opacity"
                        >
                          <EllipsisVertical size={15} />
                        </Button>
                        <Menu
                          onAction={(key) => {
                            if (key === "edit") handleStartEdit(cue);
                            if (key === "split") onSplitSubtitle?.(cue.id);
                            if (key === "merge" && canMerge) {
                              const nextId = items[actualIndex + 1]?.id;
                              if (nextId) onMergeSubtitles?.(cue.id, nextId);
                            }
                            if (key === "delete") onDeleteSubtitle?.(cue.id);
                            if (key === "seek") onSeek?.(cue.start || 0);
                          }}
                        >
                          <MenuItem id="edit">Edit Caption Text</MenuItem>
                          <MenuItem id="seek">Jump Playhead to Timestamp</MenuItem>
                          <MenuItem id="split">Split Caption Here</MenuItem>
                          {canMerge && (
                            <MenuItem id="merge">Merge with Next Line</MenuItem>
                          )}
                          <MenuItem id="delete" destructive>
                            Delete Line
                          </MenuItem>
                        </Menu>
                      </MenuTrigger>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === "fonts" && (
          <div className="flex-1 flex flex-col overflow-hidden p-3.5 space-y-4.5 text-left">
            <header className="h-9 shrink-0 flex items-center justify-between border-b border-[#27272A] pb-2">
              <h2 className="text-sm font-bold text-white tracking-tight">Custom Font Studio</h2>
              <span className="text-[10px] text-[#A1A1AA]">Register dynamic fonts</span>
            </header>

            {/* Font Upload Box */}
            <div className="border border-dashed border-[#27272A] rounded-xl p-4 text-center bg-[#242428]/40 hover:bg-[#242428]/60 transition-colors relative cursor-pointer group">
              <input
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                onChange={handleFontUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                <Type size={18} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-white">Upload TTF, OTF, or WOFF</span>
                <span className="text-[10px] text-[#71717A]">Drag font file here or browse</span>
              </div>
            </div>

            {/* Fonts list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider block mb-1">Available Fonts</span>
              {[
                { label: 'Montserrat (Viral Bold)', value: 'Montserrat' },
                { label: 'Inter (Clean Modern)', value: 'Inter' },
                { label: 'Impact (Punchy Heavy)', value: 'Impact' },
                { label: 'Rubik (Rounded)', value: 'Rubik' },
                { label: 'Fredoka One (Playful)', value: 'Fredoka One' },
                { label: 'Playfair Display (Serif)', value: 'Playfair Display' },
                { label: 'Bebas Neue (Viral Condensed)', value: 'Bebas Neue' },
                { label: 'Outfit (Sleek Outline)', value: 'Outfit' },
                { label: 'Anton (Extra Thick)', value: 'Anton' },
                ...uploadedFonts
              ].map((f) => {
                const isSelected = style?.fontFamily === f.value;
                const activeCue = subtitles.find(s => s.id === activeSubtitleId) || subtitles[0] || { text: 'Viral Pop!' };
                return (
                  <div
                    key={f.value}
                    onClick={() => onStyleChange?.({ fontFamily: f.value })}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/5'
                        : 'border-[#27272A] bg-[#242428]/45 hover:border-[#3f3f46] hover:bg-[#242428]'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10.5px] font-bold text-white">{f.label}</span>
                      <span
                        className="text-lg font-bold tracking-wide mt-1"
                        style={{
                          fontFamily: f.value,
                          color: style?.activeWordColor || '#FFE600',
                          textShadow: `1px 1px 0px ${style?.strokeColor || '#000'}`,
                        }}
                      >
                        {activeCue.text.split(' ')[0] || 'PREVIEW'}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check size={11} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "library" && (
          <div className="flex-1 flex flex-col overflow-hidden p-3.5 space-y-4.5 text-left">
            <header className="h-9 shrink-0 flex items-center justify-between border-b border-[#27272A] pb-2">
              <h2 className="text-sm font-bold text-white tracking-tight">Media & Asset Library</h2>
              <span className="text-[10px] text-[#A1A1AA]">Manage templates</span>
            </header>

            {/* Video metadata card */}
            <div className="bg-[#242428]/40 border border-[#27272A] rounded-xl p-3.5 flex flex-col gap-2">
              <span className="text-[9px] font-bold text-[#71717A] uppercase tracking-wider">Active Video</span>
              <div className="flex items-center justify-between">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate max-w-[180px]">captioneer_demo_video.mp4</span>
                  <span className="text-[10px] text-[#A1A1AA]">Duration: 12s</span>
                </div>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 font-mono px-2 py-0.5 rounded-md shrink-0">
                  1080x1920 (9:16)
                </span>
              </div>
            </div>

            {/* Sound FX section */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider block">Sound FX Previews</span>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-0.5 custom-scrollbar">
                {[
                  { name: 'Cinematic Swoosh', duration: '1.2s', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
                  { name: 'Keyboard Typing', duration: '2.5s', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
                  { name: 'Bell Ding', duration: '0.8s', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
                ].map((sound) => (
                  <div key={sound.name} className="flex items-center justify-between p-2.5 bg-[#242428]/35 border border-[#27272A] rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-white">{sound.name}</span>
                      <span className="text-[9px] text-[#71717A]">{sound.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        onPress={() => togglePlaySound(sound.url)}
                        className="py-1 px-2.5 text-[10px] font-bold rounded-md bg-[#242428] hover:bg-[#2b2b32]"
                      >
                        {playingSoundUrl === sound.url ? 'Stop' : 'Listen'}
                      </Button>
                      <Button
                        onPress={() => alert(`Added ${sound.name} audio marker at current timestamp!`)}
                        className="py-1 px-2 text-[10px] font-bold rounded-md bg-indigo-600 text-white"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Animated Stickers section */}
            <div className="space-y-2 flex-1 min-h-0 flex flex-col">
              <span className="text-[10px] font-bold text-[#71717A] uppercase tracking-wider block">Stickers & Graphics</span>
              <div className="grid grid-cols-3 gap-2 overflow-y-auto custom-scrollbar flex-1 pr-0.5">
                {['🔥 Fire', '😎 Cool', '✨ Glow', '🚨 Alert', '🔔 Sub', '😮 Wow'].map(sticker => (
                  <button
                    key={sticker}
                    onClick={() => alert(`Added ${sticker} graphic overlay to project!`)}
                    className="p-3 bg-[#242428]/50 border border-[#27272A] hover:border-indigo-500 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer hover:bg-[#242428]"
                  >
                    {sticker}
                  </button>
                ))}
              </div>
            </div>

            <audio ref={audioRef} onEnded={() => setPlayingSoundUrl(null)} />
          </div>
        )}
      </section>
    </div>
  );
}

export default CaptionInspector;
