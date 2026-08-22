/**
 * Multer File Upload Configuration and Middleware
 */
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';
import {
  ALLOWED_VIDEO_EXTENSIONS,
  ALLOWED_VIDEO_MIME_TYPES,
  ALLOWED_AUDIO_EXTENSIONS,
  ALLOWED_AUDIO_MIME_TYPES,
  ALLOWED_SUBTITLE_EXTENSIONS,
} from '../utils/constants.js';
import { AppError } from '../utils/appError.js';

// Custom disk storage with unique sanitized file names
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.storage.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 30);
    const uniqueId = uuidv4().substring(0, 8);
    cb(null, `${Date.now()}-${uniqueId}-${sanitizedBase}${ext}`);
  },
});

/**
 * Filter for video files only
 */
function videoFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  const isExtAllowed = ALLOWED_VIDEO_EXTENSIONS.includes(ext);
  const isMimeAllowed = ALLOWED_VIDEO_MIME_TYPES.includes(mime);

  if (isExtAllowed || isMimeAllowed) {
    return cb(null, true);
  }

  cb(
    AppError.badRequest(
      `Unsupported video format '${ext}'. Supported formats: ${ALLOWED_VIDEO_EXTENSIONS.join(', ')}`
    )
  );
}

/**
 * Filter for audio files only
 */
function audioFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  const isExtAllowed = ALLOWED_AUDIO_EXTENSIONS.includes(ext);
  const isMimeAllowed = ALLOWED_AUDIO_MIME_TYPES.includes(mime);

  if (isExtAllowed || isMimeAllowed) {
    return cb(null, true);
  }

  cb(
    AppError.badRequest(
      `Unsupported audio format '${ext}'. Supported formats: ${ALLOWED_AUDIO_EXTENSIONS.join(', ')}`
    )
  );
}

/**
 * Filter for media files (video or audio)
 */
function mediaFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  const isVideo = ALLOWED_VIDEO_EXTENSIONS.includes(ext) || ALLOWED_VIDEO_MIME_TYPES.includes(mime);
  const isAudio = ALLOWED_AUDIO_EXTENSIONS.includes(ext) || ALLOWED_AUDIO_MIME_TYPES.includes(mime);

  if (isVideo || isAudio) {
    return cb(null, true);
  }

  cb(
    AppError.badRequest(
      `Unsupported media format '${ext}'. Please upload a valid video or audio file.`
    )
  );
}

const maxBytes = config.storage.maxFileSizeMB * 1024 * 1024;

export const uploadVideo = multer({
  storage,
  limits: { fileSize: maxBytes },
  fileFilter: videoFileFilter,
});

export const uploadAudio = multer({
  storage,
  limits: { fileSize: maxBytes },
  fileFilter: audioFileFilter,
});

export const uploadMedia = multer({
  storage,
  limits: { fileSize: maxBytes },
  fileFilter: mediaFileFilter,
});

// For export endpoint: supports optional video file and optional subtitle file upload
export const uploadExportMedia = multer({
  storage,
  limits: { fileSize: maxBytes },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isVideo = ALLOWED_VIDEO_EXTENSIONS.includes(ext) || ALLOWED_VIDEO_MIME_TYPES.includes(file.mimetype.toLowerCase());
    const isSubtitle = ALLOWED_SUBTITLE_EXTENSIONS.includes(ext);

    if (isVideo || isSubtitle) {
      return cb(null, true);
    }
    cb(AppError.badRequest(`Unsupported file format for field '${file.fieldname}': ${ext}`));
  },
});
