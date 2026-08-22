import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

export const PropertiesPanel = React.memo(function PropertiesPanel() {
  return (
    <div className="w-80 2xl:w-96 h-full min-h-0 bg-[#18181B] p-1.5 text-white select-none overflow-hidden rounded-2xl border border-[#27272A]/80 shadow-2xl flex flex-col shrink-0">
      {/* Header */}
      <div className="h-12 px-4 bg-[#242428] rounded-[15px] border border-[#2B2B32]/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wide">
          <SlidersHorizontal size={14} className="text-indigo-400" />
          <span>Properties</span>
        </div>
      </div>

      {/* Empty Body Content Container */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center text-center opacity-30 gap-2">
          <SlidersHorizontal size={28} className="text-[#A1A1AA]" />
          <span className="text-xs font-medium text-[#A1A1AA]">
            Properties Panel
          </span>
        </div>
      </div>
    </div>
  );
});
