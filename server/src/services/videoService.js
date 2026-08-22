/**
 * Subtitle Burn-In and Video Export Service using FFmpeg
 */
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg, { getBestVideoEncoder } from '../config/ffmpeg.js';
import { config } from '../config/env.js';
import { AppError } from '../utils/appError.js';
import { logger } from '../utils/logger.js';
import { safeUnlink } from '../utils/fileCleanup.js';
import {
  generateAssSubtitleContent,
  writeSubtitleFile,
  normalizeSegments,
  srtToSegments,
} from './subtitleService.js';
import { getMediaMetadata } from './audioService.js';

/**
 * Escape file path for FFmpeg subtitle filter syntax
 * Colons, backslashes, square brackets, and single quotes need escaping
 * @param {string} rawPath
 * @returns {string}
 */
function escapeSubtitleFilterPath(rawPath) {
  return rawPath
    .replace(/\\/g, '/')
    .replace(/:/g, '\\:')
    .replace(/'/g, "'\\''")
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

/**
 * Hardcode / Burn subtitles onto a video using FFmpeg
 * @param {object} params
 * @param {string} params.videoPath - Path to source video file
 * @param {Array|string} params.subtitles - Array of segment objects OR raw SRT string OR subtitle file path
 * @param {object} [params.style={}] - Subtitle styling options
 * @param {string} [params.outputFormat='mp4'] - Export video format
 * @param {function} [params.onProgress] - Optional progress callback
 * @returns {Promise<{ exportPath: string, filename: string, duration: number, sizeBytes: number, format: string }>}
 */
export async function burnSubtitlesToVideo({
  videoPath,
  subtitles,
  style = {},
  outputFormat = 'mp4',
  onProgress,
}) {
  if (!fs.existsSync(videoPath)) {
    throw AppError.notFound(`Source video file not found: ${videoPath}`);
  }

  // Get source video metadata
  const metadata = await getMediaMetadata(videoPath);
  const videoWidth = metadata.width || 1920;
  const videoHeight = metadata.height || 1080;

  // Determine segments
  let segments = [];
  if (Array.isArray(subtitles)) {
    segments = normalizeSegments(subtitles);
  } else if (typeof subtitles === 'string') {
    if (fs.existsSync(subtitles)) {
      // Subtitles is a file path
      const fileContent = await fs.promises.readFile(subtitles, 'utf8');
      segments = srtToSegments(fileContent);
    } else {
      // Subtitles is raw SRT string
      segments = srtToSegments(subtitles);
    }
  }

  if (segments.length === 0) {
    throw AppError.badRequest('No valid subtitle segments provided for export.');
  }

  // Generate styled ASS subtitle file for high-precision FFmpeg rendering
  const assContent = generateAssSubtitleContent(segments, style, videoWidth, videoHeight);
  const tempAssFileName = `subtitles-${Date.now()}-${uuidv4().substring(0, 8)}.ass`;
  const tempAssPath = path.join(config.storage.tempDir, tempAssFileName);

  await writeSubtitleFile(tempAssPath, assContent);

  const exportFileName = `export-${Date.now()}-${uuidv4().substring(0, 8)}.${outputFormat}`;
  const exportPath = path.join(config.storage.exportDir, exportFileName);

  const bestEncoder = await getBestVideoEncoder();
  logger.info(`Burning subtitles onto video: ${path.basename(videoPath)} -> ${exportFileName} (Encoder: ${bestEncoder})`);

  // Escape ASS path for FFmpeg subtitles filter
  const escapedAssPath = escapeSubtitleFilterPath(tempAssPath);

  return new Promise((resolve, reject) => {
    const outputOptions = [
      `-vf subtitles='${escapedAssPath}'`,
      `-c:v ${bestEncoder}`,
      '-pix_fmt yuv420p',
      '-c:a aac',
      '-b:a 192k',
      '-movflags +faststart',
    ];

    if (bestEncoder === 'libx264') {
      outputOptions.push('-preset fast', '-crf 22');
    }

    let command = ffmpeg(videoPath)
      .outputOptions(outputOptions)
      .output(exportPath);

    command
      .on('start', (cmdLine) => {
        logger.debug(`FFmpeg subtitle burn-in command: ${cmdLine}`);
      })
      .on('progress', (progress) => {
        if (progress.percent && onProgress) {
          onProgress(Math.round(progress.percent));
        }
        if (progress.percent) {
          logger.debug(`Video export progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', async () => {
        // Clean up temporary ASS file
        await safeUnlink(tempAssPath);

        try {
          const stats = await fs.promises.stat(exportPath);
          logger.success(`Video exported successfully: ${exportFileName} (${stats.size} bytes)`);

          resolve({
            exportPath,
            filename: exportFileName,
            duration: metadata.duration,
            sizeBytes: stats.size,
            format: outputFormat,
          });
        } catch (statErr) {
          reject(AppError.internal(`Failed to read exported video file: ${statErr.message}`));
        }
      })
      .on('error', async (err) => {
        // Clean up temporary ASS file
        await safeUnlink(tempAssPath);
        // Clean up partial export if created
        await safeUnlink(exportPath);

        logger.error(`FFmpeg subtitle burn-in failed: ${err.message}`);
        reject(AppError.badRequest(`Failed to render subtitles on video: ${err.message}`));
      })
      .run();
  });
}
