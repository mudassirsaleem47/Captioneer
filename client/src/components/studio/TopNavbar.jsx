import React from 'react';
import {
  Upload,
  Download,
  RotateCcw,
  RotateCw,
  Smartphone,
  Monitor,
  Square,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { UI_CONTENT } from '../../config/uiContent';

export const TopNavbar = ({
  aspectRatio,
  onAspectRatioChange,
  showSafeZones,
  onToggleSafeZones,
  projectName,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenUpload,
  onOpenExport,
}) => {
  const content = UI_CONTENT.topNavbar;

  const ratioIcons = {
    '9:16': <Smartphone size={13} />,
    '16:9': <Monitor size={13} />,
    '1:1': <Square size={13} />,
  };

  return (
    <header className="h-13 bg-surface border-b border-border/80 flex items-center justify-between px-4 z-30 select-none">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[6px] bg-primary text-white flex items-center justify-center shadow-sm">
            <Sparkles size={14} className="fill-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-text-primary">
            {UI_CONTENT.brand.name}
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 bg-surface-hover text-text-secondary rounded border border-border/60 hidden sm:inline-flex">
            {UI_CONTENT.brand.badge}
          </span>
        </div>

        <div className="h-4 w-px bg-border mx-1" />

        <span className="text-xs text-text-secondary max-w-[180px] truncate">
          {projectName || content.projectTitleFallback}
        </span>
      </div>

      {/* Center Controls: Aspect Ratio & Undo/Redo */}
      <div className="flex items-center gap-2">
        {/* Aspect Ratio Switcher */}
        <div className="flex items-center bg-main p-0.5 rounded-[8px] border border-border">
          {content.aspectRatios.map((item) => {
            const isActive = aspectRatio === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onAspectRatioChange(item.id)}
                title={item.description}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-[6px] transition-all cursor-pointer ${
                  isActive
                    ? 'bg-surface text-text-primary font-semibold shadow-sm'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                }`}
              >
                {ratioIcons[item.id]}
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="h-4 w-px bg-border mx-1" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title={content.undoTooltip}
            className="p-1.5 rounded-[6px] text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
          >
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title={content.redoTooltip}
            className="p-1.5 rounded-[6px] text-text-secondary hover:text-text-primary hover:bg-surface-hover disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
          >
            <RotateCw size={14} />
          </button>
        </div>

        {/* Safe Zones Toggle */}
        <Button
          variant={showSafeZones ? 'secondary' : 'outline'}
          size="sm"
          onClick={onToggleSafeZones}
          title={content.guidesTooltip}
          className="h-7 text-xs px-2 gap-1.5"
        >
          <ShieldAlert size={13} className="text-text-secondary" />
          <span className="hidden md:inline">{content.guidesButton}</span>
        </Button>
      </div>

      {/* Right Actions: Upload & Export */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenUpload}
        >
          <Upload size={13} />
          <span>{content.uploadButton}</span>
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenExport}
        >
          <Download size={13} />
          <span>{content.exportButton}</span>
        </Button>
      </div>
    </header>
  );
};
