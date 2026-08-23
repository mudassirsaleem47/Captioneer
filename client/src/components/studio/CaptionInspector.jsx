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
}) {
  const [activeTab, setActiveTab] = useState("captions");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRowId, setEditingRowId] = useState(null);
  const [editingText, setEditingText] = useState("");

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

      {/* 2. MAIN CAPTIONS PANEL CONTENT */}
      <section className="flex-1 h-full flex flex-col overflow-hidden">
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
      </section>
    </div>
  );
}

export default CaptionInspector;
