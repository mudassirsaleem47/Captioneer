/**
 * Express Application Setup and Middleware Pipeline
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRouter from './routes/index.js';
import { requestLogger } from './middlewares/loggerMiddleware.js';
import { errorHandler, notFoundHandler } from './middlewares/errorMiddleware.js';
import { config } from './config/env.js';

const app = express();

// Security headers with permissive resource policy for media streaming
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
app.use(
  cors({
    origin: config.corsOrigin === '*' ? '*' : config.corsOrigin.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Disposition'],
  })
);

// Request body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// HTTP logging
app.use(requestLogger);

// Base / Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Captioneer API',
    description: 'Automated video captioning and subtitle burn-in backend powered by Groq Whisper and FFmpeg',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: 'GET /api/health',
      transcribe: 'POST /api/transcribe',
      transcribeAudio: 'POST /api/transcribe/audio',
      exportVideo: 'POST /api/export-video',
      convertSubtitles: 'POST /api/subtitles/convert',
      download: 'GET /api/download/:type/:filename',
    },
  });
});

// Mount main API router
app.use('/api', apiRouter);

// 404 Route Not Found Handler
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(errorHandler);

export default app;
