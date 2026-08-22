import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { SubtitleOverlay } from './SubtitleOverlay';

export const VideoCanvas = ({
  videoRef,
  videoSrc,
  aspectRatio,
  showSafeZones,
  isPlaying,
  currentTime,
  activeCue,
  style,
  onTogglePlay,
  onTimeUpdate,
  onLoadedMetadata,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const aspectClasses = {
    '9:16': 'aspect-[9/16] max-h-[75vh]',
    '16:9': 'aspect-[16/9] max-h-[65vh] w-full max-w-3xl',
    '1:1': 'aspect-square max-h-[70vh]',
  };

  // Zoom limits
  const minZoom = 0.25;
  const maxZoom = 3.0;

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(maxZoom, parseFloat((prev + 0.2).toFixed(2))));
  }, [maxZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(minZoom, parseFloat((prev - 0.2).toFixed(2))));
  }, [minZoom]);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Wheel scroll to zoom in/out
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();

      // Scrolling up (negative deltaY) -> zoom in
      // Scrolling down (positive deltaY) -> zoom out
      const factor = e.deltaY < 0 ? 1.12 : 0.89;

      setZoom((prevZoom) => {
        let nextZoom = prevZoom * factor;
        if (nextZoom < minZoom) nextZoom = minZoom;
        if (nextZoom > maxZoom) nextZoom = maxZoom;
        return parseFloat(nextZoom.toFixed(2));
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [minZoom, maxZoom]);

  // Panning when dragging on canvas background
  const handleMouseDown = (e) => {
    if (e.button === 0 || e.button === 1) {
      if (
        e.target === containerRef.current ||
        e.target.dataset?.canvasBg === 'true' ||
        e.button === 1
      ) {
        e.preventDefault();
        setIsDragging(true);
        dragStartRef.current = {
          x: e.clientX - pan.x,
          y: e.clientY - pan.y,
        };
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  return (
    <main
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={(e) => {
        if (
          e.target === containerRef.current ||
          e.target.dataset?.canvasBg === 'true'
        ) {
          handleResetZoom();
        }
      }}
      className={`flex-1 h-full bg-main flex flex-col items-center justify-center p-4 relative overflow-hidden select-none ${
        isDragging ? 'cursor-grabbing' : zoom > 1 ? 'cursor-grab' : 'cursor-default'
      }`}
    >
      {/* Subtle Studio Canvas Grid */}
      <div
        data-canvas-bg="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]"
      />

      {/* Floating Zoom Controls (Top-Right) */}
      <div className="absolute top-4 right-4 z-40 flex items-center bg-surface/90 backdrop-blur-md border border-border rounded-lg shadow-premium px-1.5 py-1 gap-1 select-none">
        {/* Zoom Out Button */}
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoom <= minZoom}
          title="Zoom Out (Scroll Down)"
          className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ZoomOut size={14} />
        </button>

        {/* Zoom Percentage Label / Quick Reset */}
        <button
          type="button"
          onClick={handleResetZoom}
          title="Click to Reset Zoom (100%)"
          className="px-1.5 py-0.5 text-xs font-mono font-medium text-text-primary hover:text-primary transition-colors cursor-pointer min-w-[44px] text-center"
        >
          {Math.round(zoom * 100)}%
        </button>

        {/* Zoom In Button */}
        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoom >= maxZoom}
          title="Zoom In (Scroll Up)"
          className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ZoomIn size={14} />
        </button>

        <div className="h-3.5 w-px bg-border mx-0.5" />

        {/* Reset Button */}
        <button
          type="button"
          onClick={handleResetZoom}
          disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
          title="Reset Zoom & Position"
          className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* Video Frame */}
      <div
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
        }}
        className={`relative flex items-center justify-center rounded-2xl shadow-premium overflow-hidden border border-border bg-black group will-change-transform ${
          aspectClasses[aspectRatio] || aspectClasses['9:16']
        }`}
      >
        {/* HTML5 Native Video */}
        <video
          ref={videoRef}
          src={videoSrc}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          className="w-full h-full object-contain pointer-events-none"
          playsInline
          loop
        />

        {/* Live Kinetic Caption Layer */}
        <SubtitleOverlay
          activeCue={activeCue}
          currentTime={currentTime}
          style={style}
        />

        {/* Safe Zones Boundary Overlay (TikTok / Reels) */}
        {showSafeZones && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Top header safe area */}
            <div className="absolute top-0 left-0 right-0 h-[10%] border-b border-dashed border-red-500/40 flex items-start justify-center pt-2">
              <span className="text-[9px] font-mono text-red-400/80 bg-black/60 px-1.5 py-0.5 rounded">
                Top UI Safe Limit (10%)
              </span>
            </div>

            {/* Right action buttons zone */}
            <div className="absolute top-[20%] right-0 bottom-[20%] w-[16%] border-l border-dashed border-red-500/40 flex items-center justify-center">
              <span className="text-[9px] font-mono text-red-400/80 bg-black/60 px-1 py-0.5 rounded -rotate-90">
                Action Bar
              </span>
            </div>

            {/* Bottom title safe zone */}
            <div className="absolute bottom-0 left-0 right-0 h-[18%] border-t border-dashed border-red-500/40 flex items-end justify-center pb-2">
              <span className="text-[9px] font-mono text-red-400/80 bg-black/60 px-1.5 py-0.5 rounded">
                Bottom Caption Safe Zone (18%)
              </span>
            </div>
          </div>
        )}

        {/* Hover Click-to-Play Overlay */}
        <div
          onClick={onTogglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-30"
        >
          <div className="w-12 h-12 rounded-full bg-surface/90 backdrop-blur-sm border border-border flex items-center justify-center text-text-primary shadow-premium transform group-active:scale-95 transition-transform">
            {isPlaying ? (
              <Pause size={20} className="fill-current" />
            ) : (
              <Play size={20} className="fill-current ml-0.5" />
            )}
          </div>
        </div>
      </div>
    </main>
  );
};
