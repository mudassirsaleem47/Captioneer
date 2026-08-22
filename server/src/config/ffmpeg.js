/**
 * FFmpeg and FFprobe configuration & availability checks
 */
import ffmpeg from 'fluent-ffmpeg';
import { exec } from 'child_process';
import { promisify } from 'util';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

const execAsync = promisify(exec);

// Configure custom paths if provided in env
if (config.ffmpeg.ffmpegPath) {
  ffmpeg.setFfmpegPath(config.ffmpeg.ffmpegPath);
}

if (config.ffmpeg.ffprobePath) {
  ffmpeg.setFfprobePath(config.ffmpeg.ffprobePath);
}

let cachedBestEncoder = null;

/**
 * Detect the best available H.264/video encoder on the system
 * @returns {Promise<string>} e.g. 'libx264', 'libopenh264', 'h264_nvenc', 'h264_vaapi', 'mpeg4'
 */
export async function getBestVideoEncoder() {
  if (cachedBestEncoder) return cachedBestEncoder;

  try {
    const ffmpegCmd = config.ffmpeg.ffmpegPath || 'ffmpeg';
    const { stdout } = await execAsync(`${ffmpegCmd} -encoders`);

    // Priority preference for H.264 video encoders
    const preferredEncoders = [
      'libx264',
      'libopenh264',
      'h264_nvenc',
      'h264_qsv',
      'h264_vaapi',
      'h264_amf',
      'mpeg4',
    ];

    for (const enc of preferredEncoders) {
      if (stdout.includes(enc)) {
        cachedBestEncoder = enc;
        logger.debug(`Selected optimal video encoder: ${enc}`);
        return enc;
      }
    }
  } catch (err) {
    logger.warn(`Failed to probe encoders, falling back to libopenh264: ${err.message}`);
  }

  cachedBestEncoder = 'libopenh264';
  return cachedBestEncoder;
}

/**
 * Check if FFmpeg and FFprobe are available and get version info
 * @returns {Promise<{ available: boolean, ffmpegVersion?: string, ffprobeVersion?: string, encoder?: string, error?: string }>}
 */
export async function checkFFmpegAvailable() {
  try {
    const ffmpegCmd = config.ffmpeg.ffmpegPath || 'ffmpeg';
    const ffprobeCmd = config.ffmpeg.ffprobePath || 'ffprobe';

    const [ffmpegRes, ffprobeRes, bestEncoder] = await Promise.all([
      execAsync(`${ffmpegCmd} -version`),
      execAsync(`${ffprobeCmd} -version`),
      getBestVideoEncoder(),
    ]);

    const ffmpegFirstLine = ffmpegRes.stdout.split('\n')[0] || '';
    const ffprobeFirstLine = ffprobeRes.stdout.split('\n')[0] || '';

    return {
      available: true,
      ffmpegVersion: ffmpegFirstLine.trim(),
      ffprobeVersion: ffprobeFirstLine.trim(),
      bestVideoEncoder: bestEncoder,
    };
  } catch (error) {
    logger.error('FFmpeg / FFprobe availability check failed:', error.message);
    return {
      available: false,
      error: error.message,
    };
  }
}

export default ffmpeg;
