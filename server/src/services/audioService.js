/**
 * Audio Extraction and Processing Service using FFmpeg
 */
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import ffmpeg from '../config/ffmpeg.js';
import { config } from '../config/env.js';
import { AppError } from '../utils/appError.js';
import { logger } from '../utils/logger.js';

/**
 * Get detailed video/audio file metadata using ffprobe
 * @param {string} filePath - Absolute path to media file
 * @returns {Promise<{ duration: number, width: number, height: number, fps: number, hasAudio: boolean, format: string, size: number }>}
 */
export function getMediaMetadata(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return reject(AppError.notFound(`File not found at path: ${filePath}`));
    }

    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        logger.error(`ffprobe failed for ${filePath}:`, err.message);
        return reject(AppError.badRequest(`Failed to probe media file: ${err.message}`));
      }

      const format = metadata.format || {};
      const streams = metadata.streams || [];

      const videoStream = streams.find((s) => s.codec_type === 'video');
      const audioStream = streams.find((s) => s.codec_type === 'audio');

      // Calculate FPS safely
      let fps = 30;
      if (videoStream && videoStream.r_frame_rate) {
        const parts = videoStream.r_frame_rate.split('/');
        if (parts.length === 2 && parseFloat(parts[1]) > 0) {
          fps = Math.round(parseFloat(parts[0]) / parseFloat(parts[1]));
        } else if (parts.length === 1) {
          fps = Math.round(parseFloat(parts[0]));
        }
      }

      resolve({
        duration: parseFloat(format.duration || videoStream?.duration || audioStream?.duration || 0),
        width: videoStream ? parseInt(videoStream.width, 10) : 0,
        height: videoStream ? parseInt(videoStream.height, 10) : 0,
        fps: isNaN(fps) ? 30 : fps,
        hasAudio: Boolean(audioStream),
        audioCodec: audioStream ? audioStream.codec_name : null,
        videoCodec: videoStream ? videoStream.codec_name : null,
        formatName: format.format_name || 'unknown',
        size: parseInt(format.size || 0, 10),
      });
    });
  });
}

/**
 * Extract audio from a video file, converting it into a Whisper-optimized 16kHz mono MP3
 * @param {string} videoPath - Path to input video file
 * @param {object} [options={}] - Extraction options
 * @param {string} [options.format='mp3'] - Output format ('mp3' or 'wav')
 * @param {number} [options.sampleRate=16000] - Sample rate in Hz (16000 is optimal for Whisper)
 * @param {number} [options.channels=1] - Audio channels (1 = mono)
 * @param {string} [options.bitrate='64k'] - Audio bitrate for MP3
 * @returns {Promise<{ audioPath: string, duration: number, sizeBytes: number }>}
 */
export async function extractAudioFromVideo(videoPath, options = {}) {
  const {
    format = 'mp3',
    sampleRate = 16000,
    channels = 1,
    bitrate = '64k',
  } = options;

  if (!fs.existsSync(videoPath)) {
    throw AppError.notFound(`Video file not found: ${videoPath}`);
  }

  // Probe file first to verify audio stream exists
  const metadata = await getMediaMetadata(videoPath);
  if (!metadata.hasAudio) {
    throw AppError.badRequest(
      'The uploaded video has no detectable audio track. Captions cannot be generated.'
    );
  }

  const outputFileName = `audio-${Date.now()}-${uuidv4().substring(0, 8)}.${format}`;
  const outputAudioPath = path.join(config.storage.tempDir, outputFileName);

  logger.info(`Extracting audio from ${path.basename(videoPath)} -> ${outputFileName} (16kHz mono ${format.toUpperCase()})`);

  return new Promise((resolve, reject) => {
    let command = ffmpeg(videoPath)
      .noVideo()
      .audioFrequency(sampleRate)
      .audioChannels(channels);

    if (format === 'mp3') {
      command = command
        .audioCodec('libmp3lame')
        .audioBitrate(bitrate)
        .format('mp3');
    } else if (format === 'wav') {
      command = command
        .audioCodec('pcm_s16le')
        .format('wav');
    }

    command
      .output(outputAudioPath)
      .on('start', (cmdLine) => {
        logger.debug(`FFmpeg extraction command: ${cmdLine}`);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          logger.debug(`Audio extraction progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', async () => {
        try {
          const stats = await fs.promises.stat(outputAudioPath);
          logger.success(`Audio extraction complete: ${outputFileName} (${stats.size} bytes)`);
          resolve({
            audioPath: outputAudioPath,
            audioFilename: outputFileName,
            duration: metadata.duration,
            sizeBytes: stats.size,
          });
        } catch (statErr) {
          reject(AppError.internal(`Failed to read extracted audio file: ${statErr.message}`));
        }
      })
      .on('error', (err) => {
        logger.error(`FFmpeg audio extraction error: ${err.message}`);
        reject(AppError.badRequest(`Failed to extract audio from video: ${err.message}`));
      })
      .run();
  });
}
