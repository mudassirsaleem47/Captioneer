/**
 * Server Entrypoint
 */
import app from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { initStorageDirectories, startPeriodicCleanup } from './utils/fileCleanup.js';
import { checkFFmpegAvailable } from './config/ffmpeg.js';
import { isGroqConfigured } from './config/groq.js';

async function bootstrap() {
  logger.info('==========================================');
  logger.info('  Starting Captioneer Backend Server...   ');
  logger.info('==========================================');

  // 1. Ensure storage directories exist
  initStorageDirectories();

  // 2. Verify FFmpeg installation
  const ffmpegStatus = await checkFFmpegAvailable();
  if (ffmpegStatus.available) {
    logger.success(`FFmpeg detected: ${ffmpegStatus.ffmpegVersion}`);
    logger.success(`FFprobe detected: ${ffmpegStatus.ffprobeVersion}`);
  } else {
    logger.warn('FFmpeg or FFprobe was not found in PATH! Video processing will fail.');
    logger.warn(`Error detail: ${ffmpegStatus.error}`);
  }

  // 3. Check Groq API configuration
  if (isGroqConfigured()) {
    logger.success(`Groq Whisper transcription configured (Model: ${config.groq.whisperModel})`);
  } else {
    logger.warn('GROQ_API_KEY is not configured! Set it in your .env file to enable Whisper transcription.');
  }

  // 4. Start background file maintenance & cleanup
  const cleanupTimer = startPeriodicCleanup();
  logger.info(`Stale file auto-cleanup enabled (every ${config.storage.cleanupIntervalMinutes}m, max file age: ${config.storage.tempFileMaxAgeMinutes}m)`);

  // 5. Start HTTP Server
  const server = app.listen(config.port, config.host, () => {
    logger.success(`Captioneer backend running on http://${config.host}:${config.port} [${config.env}]`);
    logger.info(`Health check available at http://localhost:${config.port}/api/health`);
  });

  // 6. Graceful Shutdown Handlers
  const gracefulShutdown = (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    clearInterval(cleanupTimer);

    server.close(() => {
      logger.success('HTTP server closed. Exiting process.');
      process.exit(0);
    });

    // Force close if it takes too long
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Fatal error during application startup:', err);
  process.exit(1);
});
