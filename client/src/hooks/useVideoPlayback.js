import { useRef, useState, useEffect, useCallback } from 'react';

export function useVideoPlayback({ subtitles = [], onTimeChange }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(12);
  const [activeCue, setActiveCue] = useState(null);

  // Time update listener
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    if (onTimeChange) onTimeChange(time);

    // Find active subtitle cue
    const found = subtitles.find(
      (sub) => time >= sub.start && time <= sub.end
    );
    setActiveCue(found || null);
  }, [subtitles, onTimeChange]);

  const handleLoadedMetadata = useCallback(() => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    if (!isNaN(dur) && dur > 0) {
      setDuration(dur);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const seekTo = useCallback((seconds) => {
    if (!videoRef.current) return;
    const target = Math.max(0, Math.min(duration, seconds));
    videoRef.current.currentTime = target;
    setCurrentTime(target);
  }, [duration]);

  const jumpSeconds = useCallback((delta) => {
    if (!videoRef.current) return;
    seekTo(videoRef.current.currentTime + delta);
  }, [seekTo]);

  return {
    videoRef,
    isPlaying,
    currentTime,
    duration,
    activeCue,
    togglePlay,
    seekTo,
    jumpSeconds,
    handleTimeUpdate,
    handleLoadedMetadata,
    setIsPlaying,
  };
}
