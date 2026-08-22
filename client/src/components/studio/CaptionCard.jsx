import React, { useState } from 'react';
import {
  Play,
  Trash2,
  Scissors,
  Merge,
  Clock,
} from 'lucide-react';
import { UI_CONTENT } from '../../config/uiContent';

function formatSeconds(secs) {
  if (isNaN(secs) || secs < 0) secs = 0;
  const mins = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  const ms = Math.floor((secs % 1) * 100);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(mins)}:${pad(s)}.${pad(ms)}`;
}

export const CaptionCard = ({
  subtitle,
  index,
  isActive,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onSplit,
  onMergeWithNext,
  onSeek,
  canMerge,
}) => {
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [startTimeInput, setStartTimeInput] = useState(String(subtitle.start));
  const [endTimeInput, setEndTimeInput] = useState(String(subtitle.end));

  const tooltips = UI_CONTENT.captionInspector.cardActions;

  const handleTimeSubmit = () => {
    const start = parseFloat(startTimeInput);
    const end = parseFloat(endTimeInput);
    if (!isNaN(start) && !isNaN(end) && end > start) {
      onUpdate(subtitle.id, { start, end });
    }
    setIsEditingTime(false);
  };

  return (
    <div
      onClick={() => onSelect(subtitle.id)}
      className={`group relative bg-surface border rounded-[8px] p-3 transition-colors duration-150 cursor-pointer ${
        isActive
          ? 'border-primary bg-surface-hover shadow-sm'
          : isSelected
          ? 'border-text-secondary/40 bg-surface-hover/50'
          : 'border-border hover:border-border-color'
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          {/* Cue Index */}
          <span className="text-[10px] font-mono text-text-secondary font-semibold">
            #{index + 1}
          </span>

          {/* Time Badge / Editor */}
          {isEditingTime ? (
            <div className="flex items-center gap-1 text-xs" onClick={(e) => e.stopPropagation()}>
              <input
                type="number"
                step="0.1"
                value={startTimeInput}
                onChange={(e) => setStartTimeInput(e.target.value)}
                className="w-11 bg-main border border-border text-text-primary text-[11px] rounded px-1 py-0.5"
              />
              <span className="text-text-secondary">→</span>
              <input
                type="number"
                step="0.1"
                value={endTimeInput}
                onChange={(e) => setEndTimeInput(e.target.value)}
                className="w-11 bg-main border border-border text-text-primary text-[11px] rounded px-1 py-0.5"
              />
              <button
                type="button"
                onClick={handleTimeSubmit}
                className="text-[10px] text-text-primary font-medium ml-1 bg-surface-hover px-1.5 py-0.5 rounded border border-border cursor-pointer hover:bg-border"
              >
                Done
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setStartTimeInput(String(subtitle.start));
                setEndTimeInput(String(subtitle.end));
                setIsEditingTime(true);
              }}
              title={tooltips.timeFormatTooltip}
              className="flex items-center gap-1 text-[11px] font-mono text-text-secondary hover:text-text-primary bg-main px-1.5 py-0.5 rounded border border-border hover:border-border-color transition-colors cursor-pointer"
            >
              <Clock size={10} className="text-text-secondary" />
              <span>
                {formatSeconds(subtitle.start)} - {formatSeconds(subtitle.end)}
              </span>
            </button>
          )}
        </div>

        {/* Actions Menu */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Jump to time */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSeek(subtitle.start);
            }}
            title={tooltips.jumpTooltip}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <Play size={12} />
          </button>

          {/* Split */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSplit(subtitle.id);
            }}
            title={tooltips.splitTooltip}
            className="p-1 rounded text-text-secondary hover:text-accent hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <Scissors size={12} />
          </button>

          {/* Merge */}
          {canMerge && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMergeWithNext(subtitle.id);
              }}
              title={tooltips.mergeTooltip}
              className="p-1 rounded text-text-secondary hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <Merge size={12} />
            </button>
          )}

          {/* Delete */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(subtitle.id);
            }}
            title={tooltips.deleteTooltip}
            className="p-1 rounded text-text-secondary hover:text-danger hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Editable Subtitle Textarea */}
      <textarea
        rows={2}
        value={subtitle.text}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onUpdate(subtitle.id, { text: e.target.value })}
        placeholder="Enter caption text..."
        className="w-full bg-transparent text-sm text-text-primary font-medium placeholder:text-text-secondary/50 focus:outline-none resize-none leading-relaxed border-none p-0"
      />
    </div>
  );
};
