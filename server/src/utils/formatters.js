/**
 * Utility functions for time, timestamp, and color formatting
 */
import { SUBTITLE_ALIGNMENTS } from './constants.js';

/**
 * Format seconds into SRT timestamp format: HH:MM:SS,mmm
 * @param {number} totalSeconds
 * @returns {string} e.g. "00:01:23,456"
 */
export function secondsToSrtTime(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    totalSeconds = 0;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);

  const pad = (num, size = 2) => String(num).padStart(size, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
}

/**
 * Format seconds into WebVTT timestamp format: HH:MM:SS.mmm
 * @param {number} totalSeconds
 * @returns {string} e.g. "00:01:23.456"
 */
export function secondsToVttTime(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    totalSeconds = 0;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);

  const pad = (num, size = 2) => String(num).padStart(size, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`;
}

/**
 * Format seconds into ASS subtitle timestamp format: H:MM:SS.cc (centiseconds)
 * @param {number} totalSeconds
 * @returns {string} e.g. "0:01:23.45"
 */
export function secondsToAssTime(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    totalSeconds = 0;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centiseconds = Math.floor(((totalSeconds - Math.floor(totalSeconds)) * 100));

  const pad = (num, size = 2) => String(num).padStart(size, '0');

  return `${hours}:${pad(minutes)}:${pad(seconds)}.${pad(centiseconds, 2)}`;
}

/**
 * Parse SRT/VTT timestamp to float seconds
 * Supports "HH:MM:SS,mmm", "HH:MM:SS.mmm", "MM:SS.mmm"
 * @param {string} timestampStr
 * @returns {number}
 */
export function timeStringToSeconds(timestampStr) {
  if (!timestampStr || typeof timestampStr !== 'string') return 0;

  const normalized = timestampStr.trim().replace(',', '.');
  const parts = normalized.split(':');

  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }

  const sec = parseFloat(normalized);
  return isNaN(sec) ? 0 : sec;
}

/**
 * Convert Hex Color (#RRGGBB or #RRGGBBAA or #RGB) to ASS &HAABBGGRR& format
 * In ASS, color channels are ordered as Alpha, Blue, Green, Red.
 * @param {string} hexColor - e.g. "#FFFFFF", "#FF0000", "#FF000080"
 * @param {number} [overrideAlpha=null] - Optional alpha 0-255 (0 = opaque, 255 = fully transparent in ASS)
 * @returns {string} - e.g. "&H00FFFFFF&"
 */
export function hexToAssColor(hexColor, overrideAlpha = null) {
  if (!hexColor || typeof hexColor !== 'string') {
    return '&H00FFFFFF&';
  }

  let clean = hexColor.trim().replace(/^#/, '');

  // Handle shorthand #RGB -> #RRGGBB
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }

  let r = 'FF', g = 'FF', b = 'FF', a = '00';

  if (clean.length >= 6) {
    r = clean.substring(0, 2);
    g = clean.substring(2, 4);
    b = clean.substring(4, 6);
  }

  if (clean.length === 8) {
    // Hex alpha: FF is opaque in CSS hex, but in ASS 00 is opaque and FF is transparent
    const hexAlpha = parseInt(clean.substring(6, 8), 16);
    const assAlpha = 255 - hexAlpha;
    a = assAlpha.toString(16).padStart(2, '0').toUpperCase();
  }

  if (overrideAlpha !== null) {
    const assAlpha = Math.max(0, Math.min(255, overrideAlpha));
    a = assAlpha.toString(16).padStart(2, '0').toUpperCase();
  }

  return `&H${a}${b}${g}${r}&`.toUpperCase();
}

/**
 * Convert alignment name or number to valid ASS alignment integer (1-9)
 * @param {string|number} alignment
 * @returns {number}
 */
export function normalizeAlignment(alignment) {
  if (typeof alignment === 'number' && alignment >= 1 && alignment <= 9) {
    return alignment;
  }

  if (typeof alignment === 'string') {
    const key = alignment.toLowerCase().trim();
    if (SUBTITLE_ALIGNMENTS[key]) {
      return SUBTITLE_ALIGNMENTS[key];
    }
  }

  return 2; // Default: Bottom-Center
}

/**
 * Format bytes into human-readable string (e.g. "12.4 MB")
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
