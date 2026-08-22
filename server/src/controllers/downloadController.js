/**
 * Download & Streaming Controller
 * Handles secure file downloading and streaming for videos, exports, and subtitles
 */
import path from 'path';
import fs from 'fs';
import { config } from '../config/env.js';
import { AppError } from '../utils/appError.js';

const TYPE_DIRECTORIES = {
  exports: config.storage.exportDir,
  uploads: config.storage.uploadDir,
  subtitles: config.storage.tempDir,
  temp: config.storage.tempDir,
};

const MIME_MAP = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
  '.webm': 'video/webm',
  '.srt': 'text/plain; charset=utf-8',
  '.vtt': 'text/vtt; charset=utf-8',
  '.ass': 'text/plain; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

/**
 * Handle GET /api/download/:type/:filename
 */
export async function downloadFile(req, res, next) {
  try {
    const { type, filename } = req.params;
    const baseDir = TYPE_DIRECTORIES[type];

    if (!baseDir) {
      throw AppError.badRequest(`Invalid download category '${type}'. Allowed: ${Object.keys(TYPE_DIRECTORIES).join(', ')}`);
    }

    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.resolve(baseDir, safeFilename);

    // Verify path is within baseDir
    if (!filePath.startsWith(baseDir)) {
      throw AppError.forbidden('Access denied: invalid file path');
    }

    if (!fs.existsSync(filePath)) {
      throw AppError.notFound(`Requested file '${safeFilename}' does not exist or has expired.`);
    }

    const stat = await fs.promises.stat(filePath);
    const ext = path.extname(safeFilename).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';
    const isStream = req.query.stream === 'true' || req.query.inline === 'true';

    // Support HTTP Range requests for video seeking in browsers
    const range = req.headers.range;
    if (range && contentType.startsWith('video/')) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Content-Disposition': isStream ? `inline; filename="${safeFilename}"` : `attachment; filename="${safeFilename}"`,
      });

      const fileStream = fs.createReadStream(filePath, { start, end });
      return fileStream.pipe(res);
    }

    // Normal full file download / inline display
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': contentType,
      'Content-Disposition': isStream ? `inline; filename="${safeFilename}"` : `attachment; filename="${safeFilename}"`,
    });

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
}
