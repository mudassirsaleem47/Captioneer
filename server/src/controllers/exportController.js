/**
 * Export Controller
 * Handles hardcoding / burning subtitles onto video and video export
 */
import path from 'path';
import fs from 'fs';
import { burnSubtitlesToVideo } from '../services/videoService.js';
import { srtToSegments, normalizeSegments } from '../services/subtitleService.js';
import { AppError } from '../utils/appError.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { safeUnlink } from '../utils/fileCleanup.js';

/**
 * Helper to safely parse JSON strings or return original object
 */
function parseIfJson(data) {
  if (!data) return null;
  if (typeof data === 'object') return data;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  return null;
}

/**
 * Handle POST /api/export-video
 * Burn subtitles onto video with custom styling
 */
export async function exportVideoWithSubtitles(req, res, next) {
  let tempUploadedVideo = null;
  let tempUploadedSubtitle = null;

  try {
    let videoPath = null;
    let videoFilename = null;

    // 1. Resolve source video file
    // Check if video was uploaded in this request
    if (req.file) {
      videoPath = req.file.path;
      videoFilename = req.file.filename;
      tempUploadedVideo = videoPath;
    } else if (req.files && req.files.video && req.files.video[0]) {
      videoPath = req.files.video[0].path;
      videoFilename = req.files.video[0].filename;
      tempUploadedVideo = videoPath;
    } else if (req.body.videoId || req.body.videoFilename) {
      const vidName = path.basename(req.body.videoId || req.body.videoFilename);
      const candidatePath = path.join(config.storage.uploadDir, vidName);

      if (!fs.existsSync(candidatePath)) {
        throw AppError.notFound(`Referenced video '${vidName}' not found in upload storage. Please re-upload.`);
      }

      videoPath = candidatePath;
      videoFilename = vidName;
    }

    if (!videoPath || !fs.existsSync(videoPath)) {
      throw AppError.badRequest('No video source provided. Supply "videoId" from a previous transcription or upload a video file.');
    }

    // 2. Resolve subtitles payload
    let subtitlesData = null;

    // Check if subtitle file was uploaded
    if (req.files && req.files.subtitles && req.files.subtitles[0]) {
      const subFile = req.files.subtitles[0];
      tempUploadedSubtitle = subFile.path;
      const content = await fs.promises.readFile(subFile.path, 'utf8');
      subtitlesData = srtToSegments(content);
    } else if (req.body.subtitles) {
      const parsed = parseIfJson(req.body.subtitles);
      if (Array.isArray(parsed)) {
        subtitlesData = normalizeSegments(parsed);
      } else if (typeof parsed === 'string') {
        subtitlesData = srtToSegments(parsed);
      }
    } else if (req.body.srtContent) {
      subtitlesData = srtToSegments(req.body.srtContent);
    } else if (req.body.srtFilename) {
      const cleanSubName = path.basename(req.body.srtFilename);
      const subFilePath = path.join(config.storage.tempDir, cleanSubName);
      if (!fs.existsSync(subFilePath)) {
        throw AppError.notFound(`Referenced subtitle file '${cleanSubName}' not found.`);
      }
      const fileContent = await fs.promises.readFile(subFilePath, 'utf8');
      subtitlesData = srtToSegments(fileContent);
    }

    if (!subtitlesData || subtitlesData.length === 0) {
      throw AppError.badRequest(
        'No subtitle segments provided. Provide "subtitles" (JSON array or SRT text), "srtContent", or "srtFilename".'
      );
    }

    // 3. Resolve styling parameters
    const rawStyle = parseIfJson(req.body.style) || {};
    const style = {
      fontName: req.body.fontName || rawStyle.fontName,
      fontSize: req.body.fontSize ? parseInt(req.body.fontSize, 10) : rawStyle.fontSize,
      primaryColor: req.body.primaryColor || rawStyle.primaryColor,
      outlineColor: req.body.outlineColor || rawStyle.outlineColor,
      outlineWidth: req.body.outlineWidth !== undefined ? parseFloat(req.body.outlineWidth) : rawStyle.outlineWidth,
      backColor: req.body.backColor || rawStyle.backColor,
      bold: req.body.bold !== undefined ? req.body.bold === 'true' || req.body.bold === true : rawStyle.bold,
      italic: req.body.italic !== undefined ? req.body.italic === 'true' || req.body.italic === true : rawStyle.italic,
      alignment: req.body.alignment || rawStyle.alignment,
      marginV: req.body.marginV !== undefined ? parseInt(req.body.marginV, 10) : rawStyle.marginV,
      shadow: req.body.shadow !== undefined ? parseInt(req.body.shadow, 10) : rawStyle.shadow,
      borderStyle: req.body.borderStyle !== undefined ? parseInt(req.body.borderStyle, 10) : rawStyle.borderStyle,
    };

    // Clean undefined style keys
    Object.keys(style).forEach((key) => style[key] === undefined && delete style[key]);

    logger.info(`Starting video export with burned subtitles for video: ${videoFilename}`);

    // 4. Burn subtitles into video
    const exportResult = await burnSubtitlesToVideo({
      videoPath,
      subtitles: subtitlesData,
      style,
      outputFormat: 'mp4',
    });

    // Clean up uploaded temporary subtitle file if one was uploaded in this request
    if (tempUploadedSubtitle) {
      await safeUnlink(tempUploadedSubtitle);
    }

    // 5. Check if user requested direct video streaming response
    const shouldStream = req.query.stream === 'true' || req.body.stream === true;
    if (shouldStream) {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `inline; filename="${exportResult.filename}"`);
      const readStream = fs.createReadStream(exportResult.exportPath);
      return readStream.pipe(res);
    }

    // 6. Return standard JSON response with download link
    res.status(200).json({
      success: true,
      message: 'Video rendered and subtitles burned successfully',
      data: {
        exportFilename: exportResult.filename,
        duration: exportResult.duration,
        sizeBytes: exportResult.sizeBytes,
        format: exportResult.format,
        downloadUrl: `/api/download/exports/${exportResult.filename}`,
        streamUrl: `/api/download/exports/${exportResult.filename}?stream=true`,
        appliedStyle: style,
        segmentsCount: subtitlesData.length,
      },
    });
  } catch (error) {
    if (tempUploadedSubtitle) {
      await safeUnlink(tempUploadedSubtitle);
    }
    next(error);
  }
}
