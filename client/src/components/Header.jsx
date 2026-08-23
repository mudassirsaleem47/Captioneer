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
    <header className="h-11 w-full bg-[#09090B] px-3 flex items-center justify-between select-none">
      {/* Left: Home Icon + Viewpoint Sliding Track */}
      <div className="flex items-center gap-2">

        <div className="h-3 w-px bg-[#27272A]" />

        {/* Viewport Window (At a time only one slide is visible, passing like a car) */}
        <div className="relative overflow-hidden h-8 w-[240px] flex items-center">
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
            className="absolute inset-y-0 left-0 right-0 flex items-center gap-1 px-1.5 rounded-md hover:bg-[#18181B] cursor-pointer"
            title="Click to rename"
          >
            <span className="text-xs font-semibold text-white max-w-[190px] truncate">
              {projectName}
            </span>
            <Button
              variant="quiet"
              onPress={() => setIsEditing(true)}
              aria-label="Edit project name"
              className="w-5 h-5 p-0 text-[#71717A] hover:text-white transition-colors shrink-0"
            >
              <Pencil size={10} />
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
            className="absolute inset-y-0 left-0 right-0 flex items-center gap-1.5 px-0.5"
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
              className="w-7 h-7 p-0 text-emerald-400 hover:text-emerald-300 transition-colors shrink-0"
            >
              <Check size={13} />
            </Button>
          </div>
        </div>
      </div>

      {/* Right: Import & Export Buttons */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          onPress={onImport}
          className="h-7 px-2.5 text-xs font-semibold gap-1 rounded-md shrink-0 flex items-center"
        >
          <Download size={13} />
          <span>Import</span>
        </Button>

        <Button
          variant="primary"
          onPress={onExport}
          className="h-7 px-2.5 text-xs font-semibold gap-1 rounded-md shrink-0 flex items-center"
        >
          <Upload size={13} />
          <span>Export</span>
        </Button>
      </div>
    </header>
  );
});

export default Header;
