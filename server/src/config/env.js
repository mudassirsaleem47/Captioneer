/**
 * Environment configuration loader and validator
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT, 10) || 5000,
  host: process.env.HOST || '0.0.0.0',
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Groq API
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    whisperModel: process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3',
  },

  // Storage
  storage: {
    rootDir: ROOT_DIR,
    uploadDir: path.resolve(ROOT_DIR, process.env.UPLOAD_DIR || 'storage/uploads'),
    tempDir: path.resolve(ROOT_DIR, process.env.TEMP_DIR || 'storage/temp'),
    exportDir: path.resolve(ROOT_DIR, process.env.EXPORT_DIR || 'storage/exports'),
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 500,
    tempFileMaxAgeMinutes: parseInt(process.env.TEMP_FILE_MAX_AGE_MINUTES, 10) || 60,
    cleanupIntervalMinutes: parseInt(process.env.CLEANUP_INTERVAL_MINUTES, 10) || 30,
  },

  // FFmpeg overrides
  ffmpeg: {
    ffmpegPath: process.env.FFMPEG_PATH || null,
    ffprobePath: process.env.FFPROBE_PATH || null,
  },
};
