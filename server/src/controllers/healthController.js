/**
 * Health Controller
 * Performs system health verification including FFmpeg binaries and Groq API connectivity
 */
import { checkFFmpegAvailable } from '../config/ffmpeg.js';
import { testGroqConnection, isGroqConfigured } from '../config/groq.js';
import { config } from '../config/env.js';

/**
 * Handle GET /api/health
 */
export async function getHealthStatus(req, res, next) {
  try {
    const [ffmpegHealth, groqHealth] = await Promise.all([
      checkFFmpegAvailable(),
      testGroqConnection(),
    ]);

    const isHealthy = ffmpegHealth.available && groqHealth.ok;

    res.status(isHealthy ? 200 : 207).json({
      success: isHealthy,
      service: 'captioneer-backend',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memoryUsageMB: {
          rss: (process.memoryUsage().rss / 1024 / 1024).toFixed(2),
          heapUsed: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
        },
      },
      dependencies: {
        ffmpeg: {
          status: ffmpegHealth.available ? 'healthy' : 'unavailable',
          version: ffmpegHealth.ffmpegVersion || null,
          ffprobeVersion: ffmpegHealth.ffprobeVersion || null,
          error: ffmpegHealth.error || null,
        },
        groq: {
          status: groqHealth.ok ? 'healthy' : isGroqConfigured() ? 'error' : 'unconfigured',
          isConfigured: isGroqConfigured(),
          configuredModel: config.groq.whisperModel,
          message: groqHealth.message,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
