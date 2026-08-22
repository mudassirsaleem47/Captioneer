import { useEffect } from 'react';

export function useKeyboardShortcuts({
  togglePlay,
  jumpSeconds,
  undo,
  redo,
  canUndo,
  canRedo,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Space: Play / Pause
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }

      // Left Arrow: -1s / -5s with Shift
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        jumpSeconds(e.shiftKey ? -5 : -1);
      }

      // Right Arrow: +1s / +5s with Shift
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        jumpSeconds(e.shiftKey ? 5 : 1);
      }

      // Ctrl+Z / Cmd+Z: Undo
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo && canUndo()) undo();
      }

      // Ctrl+Y / Cmd+Shift+Z: Redo
      if (
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z') ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        if (canRedo && canRedo()) redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, jumpSeconds, undo, redo, canUndo, canRedo]);
}
