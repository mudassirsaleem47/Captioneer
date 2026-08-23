import React, { useMemo } from 'react';

export const SubtitleOverlay = ({ activeCue, currentTime, style }) => {
  if (!activeCue) return null;

  const { text, words, start, end } = activeCue;

  // Split text into words if words array is not present or empty, and ensure timings exist
  const wordList = useMemo(() => {
    if (words && words.length > 0) {
      const hasTimings = words.every((w) => w.start !== undefined && w.end !== undefined);
      if (hasTimings) return words;

      const duration = Math.max(0.1, end - start);
      const step = duration / words.length;
      return words.map((w, idx) => ({
        ...w,
        start: start + idx * step,
        end: start + (idx + 1) * step,
      }));
    }

    const rawWords = (text || '').trim().split(/\s+/).filter(Boolean);
    const duration = Math.max(0.1, end - start);
    const step = duration / rawWords.length;

    return rawWords.map((w, idx) => ({
      word: w,
      start: start + idx * step,
      end: start + (idx + 1) * step,
    }));
  }, [text, words, start, end]);

  // Compute active word index
  const activeWordIndex = useMemo(() => {
    return wordList.findIndex(
      (w) => currentTime >= w.start && currentTime <= w.end
    );
  }, [wordList, currentTime]);

  // Style properties
  const {
    fontFamily = 'Montserrat',
    fontSize = 38,
    textColor = '#FFFFFF',
    activeWordColor = '#FFE600',
    strokeColor = '#000000',
    strokeWidth = 4,
    shadowColor = '#000000',
    shadowOffset = 3,
    uppercase = true,
    bold = true,
    italic = false,
    animationType = 'pop',
    positionY = 78,
    hasBox = false,
    boxBackground = 'rgba(0, 0, 0, 0.75)',
    boxPadding = 12,
    boxRadius = 12,
  } = style || {};

  // Build text stroke & shadow styles
  const strokeStyle = strokeWidth > 0
    ? `${strokeWidth}px ${strokeColor}`
    : 'none';

  const shadowStyle = shadowOffset > 0
    ? `${shadowOffset}px ${shadowOffset}px 0px ${shadowColor}`
    : 'none';

  return (
    <div
      className="absolute left-0 right-0 flex items-center justify-center px-6 pointer-events-none z-20 transition-all duration-75"
      style={{
        top: `${positionY}%`,
        transform: 'translateY(-50%)',
      }}
    >
      <div
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center max-w-[90%]"
        style={{
          fontFamily,
          fontSize: `${fontSize}px`,
          fontWeight: bold ? 800 : 500,
          fontStyle: italic ? 'italic' : 'normal',
          textTransform: uppercase ? 'uppercase' : 'none',
          backgroundColor: hasBox ? boxBackground : 'transparent',
          padding: hasBox ? `${boxPadding}px ${boxPadding * 1.5}px` : '0px',
          borderRadius: hasBox ? `${boxRadius}px` : '0px',
        }}
      >
        {wordList.map((item, idx) => {
          const isActive = idx === activeWordIndex;
          const isPast = idx < activeWordIndex;

          // Animation scale & transform based on type
          let transformStyle = 'scale(1)';
          let filterStyle = 'none';

          if (isActive) {
            if (animationType === 'pop') {
              transformStyle = 'scale(1.18) translateY(-2px)';
            } else if (animationType === 'bounce') {
              transformStyle = 'scale(1.15) translateY(-4px)';
            } else if (animationType === 'glow') {
              filterStyle = `drop-shadow(0 0 8px ${activeWordColor})`;
            } else if (animationType === 'slide') {
              transformStyle = 'translateY(-3px)';
            }
          }

          const currentColor = isActive
            ? activeWordColor
            : isPast
            ? textColor
            : `${textColor}CC`;

          return (
            <span
              key={idx}
              className="inline-block transition-transform duration-100 ease-out"
              style={{
                color: currentColor,
                WebkitTextStroke: strokeStyle,
                textShadow: shadowStyle,
                transform: transformStyle,
                filter: filterStyle,
                transformOrigin: 'center center',
              }}
            >
              {item.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
