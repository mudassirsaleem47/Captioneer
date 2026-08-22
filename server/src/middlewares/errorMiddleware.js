/**
 * Centralized Error Handling Middlewares
 */
import multer from 'multer';
import { AppError } from '../utils/appError.js';
import { logger } from '../utils/logger.js';
import { safeUnlink } from '../utils/fileCleanup.js';
import { config } from '../config/env.js';

/**
 * 404 Route Not Found Handler
 */
export function notFoundHandler(req, res, next) {
  next(AppError.notFound(`Endpoint not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Global Error Handler Middleware
 */
export async function errorHandler(err, req, res, next) {
  // If a file was uploaded as part of the request, clean it up on failure to prevent storage leaks
  if (req.file && req.file.path) {
    await safeUnlink(req.file.path);
  }
  if (req.files) {
    if (Array.isArray(req.files)) {
      for (const f of req.files) {
        if (f.path) await safeUnlink(f.path);
      }
    } else if (typeof req.files === 'object') {
      for (const field of Object.keys(req.files)) {
        for (const f of req.files[field]) {
          if (f.path) await safeUnlink(f.path);
        }
      }
    }
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // Handle Multer specific errors
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      message = `Uploaded file exceeds size limit of ${config.storage.maxFileSizeMB}MB`;
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Unexpected form field: '${err.field}'. Check your upload parameter names.`;
    } else {
      message = `File upload error: ${err.message}`;
    }
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON body in request';
  }

  // Log error
  if (statusCode >= 500) {
    logger.error(`[${statusCode}] ${req.method} ${req.originalUrl} - ${message}`, err.stack);
  } else {
    logger.warn(`[${statusCode}] ${req.method} ${req.originalUrl} - ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    status: `${statusCode}`.startsWith('4') ? 'fail' : 'error',
    statusCode,
    message,
    ...(details && { details }),
    ...(config.env === 'development' && {
      stack: err.stack,
    }),
  });
}
