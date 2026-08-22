/**
 * Subtitle Processing, Conversion, and Styling Service
 * Handles SRT, WebVTT, ASS (Advanced SubStation Alpha), and JSON formats
 */
import fs from 'fs';
import path from 'path';
import {
  secondsToSrtTime,
  secondsToVttTime,
  secondsToAssTime,
  timeStringToSeconds,
  hexToAssColor,
  normalizeAlignment,
} from '../utils/formatters.js';
import { DEFAULT_SUBTITLE_STYLE } from '../utils/constants.js';
import { AppError } from '../utils/appError.js';

/**
 * Standardize segments array structure
 * @param {Array} rawSegments
 * @returns {Array<{ id: number, start: number, end: number, text: string, words?: Array }>}
 */
export function normalizeSegments(rawSegments = []) {
  if (!Array.isArray(rawSegments)) {
    throw AppError.badRequest('Subtitles payload must be an array of segment objects');
  }

  return rawSegments.map((seg, index) => {
    const start = typeof seg.start === 'number' ? seg.start : timeStringToSeconds(seg.start || '0');
    const end = typeof seg.end === 'number' ? seg.end : timeStringToSeconds(seg.end || '0');
    const text = String(seg.text || '').trim();

    return {
      id: seg.id !== undefined ? seg.id : index + 1,
      start: Math.max(0, parseFloat(start.toFixed(3))),
      end: Math.max(start, parseFloat(end.toFixed(3))),
      text,
      words: Array.isArray(seg.words) ? seg.words : undefined,
    };
  }).filter((seg) => seg.text.length > 0);
}

/**
 * Convert subtitle segments array into standard SRT text format
 * @param {Array} segments
 * @returns {string}
 */
export function segmentsToSrt(segments) {
  const normalized = normalizeSegments(segments);

  return normalized
    .map((seg, idx) => {
      const id = idx + 1;
      const startTime = secondsToSrtTime(seg.start);
      const endTime = secondsToSrtTime(seg.end);
      const text = seg.text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      return `${id}\n${startTime} --> ${endTime}\n${text}\n`;
    })
    .join('\n');
}

/**
 * Convert subtitle segments array into standard WebVTT text format
 * @param {Array} segments
 * @returns {string}
 */
export function segmentsToVtt(segments) {
  const normalized = normalizeSegments(segments);

  const entries = normalized
    .map((seg, idx) => {
      const id = idx + 1;
      const startTime = secondsToVttTime(seg.start);
      const endTime = secondsToVttTime(seg.end);
      const text = seg.text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      return `${id}\n${startTime} --> ${endTime}\n${text}\n`;
    })
    .join('\n');

  return `WEBVTT\n\n${entries}`;
}

/**
 * Parse an SRT formatted string into structured JSON segment objects
 * @param {string} srtContent
 * @returns {Array<{ id: number, start: number, end: number, text: string }>}
 */
export function srtToSegments(srtContent) {
  if (!srtContent || typeof srtContent !== 'string') {
    return [];
  }

  const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const blocks = normalized.split(/\n\s*\n/);
  const segments = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;

    const lines = block.split('\n');
    let timeLineIndex = 0;

    // Check if first line is a numeric ID
    if (/^\d+$/.test(lines[0].trim()) && lines.length > 1) {
      timeLineIndex = 1;
    }

    const timeLine = lines[timeLineIndex];
    if (!timeLine || !timeLine.includes('-->')) {
      continue;
    }

    const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim().split(' ')[0]);
    const start = timeStringToSeconds(startStr);
    const end = timeStringToSeconds(endStr);
    const text = lines.slice(timeLineIndex + 1).join('\n').trim();

    if (text) {
      segments.push({
        id: segments.length + 1,
        start,
        end,
        text,
      });
    }
  }

  return segments;
}

/**
 * Parse a WebVTT formatted string into structured JSON segment objects
 * @param {string} vttContent
 * @returns {Array<{ id: number, start: number, end: number, text: string }>}
 */
export function vttToSegments(vttContent) {
  if (!vttContent || typeof vttContent !== 'string') {
    return [];
  }

  let clean = vttContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  // Strip WebVTT header & metadata
  clean = clean.replace(/^WEBVTT[^\n]*\n+/i, '');

  return srtToSegments(clean);
}

/**
 * Generate an Advanced SubStation Alpha (.ass) subtitle file with custom styling
 * for pixel-perfect burning via FFmpeg
 * @param {Array} segments
 * @param {object} [customStyle={}]
 * @param {number} [videoWidth=1920]
 * @param {number} [videoHeight=1080]
 * @returns {string} ASS format file contents
 */
export function generateAssSubtitleContent(
  segments,
  customStyle = {},
  videoWidth = 1920,
  videoHeight = 1080
) {
  const style = { ...DEFAULT_SUBTITLE_STYLE, ...customStyle };
  const normalized = normalizeSegments(segments);

  const fontName = style.fontName || 'Arial';
  const fontSize = parseInt(style.fontSize, 10) || 24;
  const primaryColor = hexToAssColor(style.primaryColor || '#FFFFFF');
  const secondaryColor = hexToAssColor(style.secondaryColor || '#000000');
  const outlineColor = hexToAssColor(style.outlineColor || '#000000');
  const backColor = hexToAssColor(style.backColor || '#00000000'); // Shadow / Box color
  const bold = style.bold ? -1 : 0; // In ASS: -1 = true, 0 = false
  const italic = style.italic ? -1 : 0;
  const underline = style.underline ? -1 : 0;
  const outline = typeof style.outlineWidth === 'number' ? style.outlineWidth : 2;
  const shadow = typeof style.shadow === 'number' ? style.shadow : 1;
  const alignment = normalizeAlignment(style.alignment);
  const marginL = parseInt(style.marginH, 10) || 20;
  const marginR = parseInt(style.marginH, 10) || 20;
  const marginV = parseInt(style.marginV, 10) || 30;
  const borderStyle = parseInt(style.borderStyle, 10) || 1; // 1 = outline + shadow, 3 = opaque box

  // ASS Header and Style definition
  const header = `[Script Info]
; Script generated by Captioneer Video Captioning Backend
ScriptType: v4.00+
PlayResX: ${videoWidth}
PlayResY: ${videoHeight}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${primaryColor},${secondaryColor},${outlineColor},${backColor},${bold},${italic},${underline},0,100,100,0,0,${borderStyle},${outline},${shadow},${alignment},${marginL},${marginR},${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const dialogueLines = normalized.map((seg) => {
    const startStr = secondsToAssTime(seg.start);
    const endStr = secondsToAssTime(seg.end);
    // Replace newlines with ASS \N line breaks
    const textStr = seg.text.replace(/\r\n|\r|\n/g, '\\N');

    return `Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,${textStr}`;
  });

  return header + dialogueLines.join('\n') + '\n';
}

/**
 * Save subtitle content (SRT, VTT, or ASS) to a designated file path
 * @param {string} filePath - Absolute path to write file
 * @param {string} content - Text content
 */
export async function writeSubtitleFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir, { recursive: true });
  }
  await fs.promises.writeFile(filePath, content, 'utf8');
  return filePath;
}
