import React, { useState, useEffect } from 'react';
import { Home, Pencil, Check, Upload, Download } from 'lucide-react';
import { Button } from './ui/Button';
import { TextField } from './ui/TextField';

export const Header = React.memo(function Header({
  projectName = 'Untitled Project',
  onProjectNameChange,
  onHome,
  onImport,
  onExport,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(projectName);

  useEffect(() => {
    setName(projectName);
  }, [projectName]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (trimmed) {
      onProjectNameChange?.(trimmed);
    } else {
      setName(projectName);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setName(projectName);
      setIsEditing(false);
    }
  };

  return (
    <header className="h-14 w-full bg-[#09090B] px-4 flex items-center justify-between select-none">
      {/* Left: Home Icon + Viewpoint Sliding Track */}
      <div className="flex items-center gap-3">

        <div className="h-4 w-px bg-[#27272A]" />

        {/* Viewport Window (At a time only one slide is visible, passing like a car) */}
        <div className="relative overflow-hidden h-10 w-[300px] flex items-center">
          {/* SLIDE 1: Text Title + Pencil (Slides out to Left when Editing) */}
          <div
            onClick={() => setIsEditing(true)}
            style={{
              transform: isEditing ? 'translateX(-100%)' : 'translateX(0%)',
              opacity: isEditing ? 0 : 1,
              pointerEvents: isEditing ? 'none' : 'auto',
              transition: 'transform 260ms cubic-bezier(0.23, 1, 0.32, 1), opacity 200ms ease-out',
              willChange: 'transform, opacity',
            }}
            className="absolute inset-y-0 left-0 right-0 flex items-center gap-1.5 px-2 rounded-md hover:bg-[#18181B] cursor-pointer"
            title="Click to rename"
          >
            <span className="text-sm font-semibold text-white max-w-[240px] truncate">
              {projectName}
            </span>
            <Button
              variant="quiet"
              onPress={() => setIsEditing(true)}
              aria-label="Edit project name"
              className="w-6 h-6 p-0 text-[#71717A] hover:text-white transition-colors shrink-0"
            >
              <Pencil size={11} />
            </Button>
          </div>

          {/* SLIDE 2: Input + Check Button (Slides in from Right when Editing) */}
          <div
            style={{
              transform: isEditing ? 'translateX(0%)' : 'translateX(100%)',
              opacity: isEditing ? 1 : 0,
              pointerEvents: isEditing ? 'auto' : 'none',
              transition: 'transform 260ms cubic-bezier(0.23, 1, 0.32, 1), opacity 200ms ease-out',
              willChange: 'transform, opacity',
            }}
            className="absolute inset-y-0 left-0 right-0 flex items-center gap-2 px-0.5"
          >
            <div className="flex-1 py-0.5">
              <TextField
                aria-label="Project name"
                value={name}
                onChange={setName}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                className="w-full"
              />
            </div>
            <Button
              variant="quiet"
              onPress={handleSave}
              aria-label="Save project name"
              className="w-8 h-8 p-0 text-emerald-400 hover:text-emerald-300 transition-colors shrink-0"
            >
              <Check size={15} />
            </Button>
          </div>
        </div>
      </div>

      {/* Right: Import & Export Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          onPress={onImport}
          className="gap-1.5"
        >
          <Download size={14} />
          <span>Import</span>
        </Button>

        <Button
          variant="primary"
          onPress={onExport}
          className="gap-1.5"
        >
          <Upload size={14} />
          <span>Export</span>
        </Button>
      </div>
    </header>
  );
});

export default Header;
