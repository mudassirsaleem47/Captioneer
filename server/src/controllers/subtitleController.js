/**
 * Subtitle Converter Controller
 * Allows conversion between JSON segments, SRT, and WebVTT without video processing
 */
import {
  segmentsToSrt,
  segmentsToVtt,
  srtToSegments,
  vttToSegments,
  normalizeSegments,
} from '../services/subtitleService.js';
import { AppError } from '../utils/appError.js';

/**
 * Handle POST /api/subtitles/convert
 */
export async function convertSubtitles(req, res, next) {
  try {
    const { subtitles, srt, vtt } = req.body;

    let segments = [];

    if (Array.isArray(subtitles)) {
      segments = normalizeSegments(subtitles);
    } else if (typeof srt === 'string') {
      segments = srtToSegments(srt);
    } else if (typeof vtt === 'string') {
      segments = vttToSegments(vtt);
    } else if (typeof subtitles === 'string') {
      segments = srtToSegments(subtitles);
    } else {
      throw AppError.badRequest('Please provide "subtitles" (array/string), "srt" (string), or "vtt" (string).');
    }

    const srtOutput = segmentsToSrt(segments);
    const vttOutput = segmentsToVtt(segments);

    res.status(200).json({
      success: true,
      data: {
        segmentsCount: segments.length,
        segments,
        srt: srtOutput,
        vtt: vttOutput,
      },
    });
  } catch (error) {
    next(error);
  }
}
