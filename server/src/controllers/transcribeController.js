/**
 * Transcribe Controller
 * Handles video and audio file transcription using FFmpeg and Groq Whisper API
 */
import path from 'path';
import { extractAudioFromVideo, getMediaMetadata } from '../services/audioService.js';
import { transcribeAudioWithGroq } from '../services/groqService.js';
import {
  segmentsToSrt,
  segmentsToVtt,
  writeSubtitleFile,
} from '../services/subtitleService.js';
import { safeUnlink } from '../utils/fileCleanup.js';
import { AppError } from '../utils/appError.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Handle POST /api/transcribe
 * Transcribe an uploaded video file
 */
export async function transcribeVideo(req, res, next) {
  let audioPath = null;

  try {
    const videoFile = req.file;
    if (!videoFile) {
      throw AppError.badRequest('No video file provided. Please upload a video in the "video" or "file" field.');
    }

    const {
      language,
      prompt,
      temperature,
    } = req.body;

    logger.info(`Received transcription request for video: ${videoFile.originalname} (${(videoFile.size / 1024 / 1024).toFixed(2)} MB)`);

    // 1. Probe video metadata
    const metadata = await getMediaMetadata(videoFile.path);

    // 2. Extract Whisper-optimized audio
    const extractionResult = await extractAudioFromVideo(videoFile.path, {
      format: 'mp3',
      sampleRate: 16000,
      channels: 1,
      bitrate: '64k',
    });
    audioPath = extractionResult.audioPath;

    // 3. Send audio to Groq Whisper
    const transcription = await transcribeAudioWithGroq(audioPath, {
      language,
      prompt,
      temperature: temperature !== undefined ? parseFloat(temperature) : 0.0,
      wordLevelTimestamps: true,
    });

    // 4. Generate SRT and VTT formats
    const srtContent = segmentsToSrt(transcription.segments);
    const vttContent = segmentsToVtt(transcription.segments);

    // 5. Persist subtitle files to storage for download
    const subtitleId = uuidv4().substring(0, 8);
    const srtFilename = `subtitles-${Date.now()}-${subtitleId}.srt`;
    const vttFilename = `subtitles-${Date.now()}-${subtitleId}.vtt`;

    const srtFilePath = path.join(config.storage.tempDir, srtFilename);
    const vttFilePath = path.join(config.storage.tempDir, vttFilename);

    await Promise.all([
      writeSubtitleFile(srtFilePath, srtContent),
      writeSubtitleFile(vttFilePath, vttContent),
    ]);

    // 6. Clean up temporary extracted audio file
    await safeUnlink(audioPath);
    audioPath = null;

    // 7. Return structured response
    res.status(200).json({
      success: true,
      message: 'Video transcribed successfully',
      data: {
        videoId: videoFile.filename,
        video: {
          originalName: videoFile.originalname,
          filename: videoFile.filename,
          duration: metadata.duration,
          width: metadata.width,
          height: metadata.height,
          fps: metadata.fps,
          sizeBytes: videoFile.size,
          mimeType: videoFile.mimetype,
          videoUrl: `/api/download/uploads/${videoFile.filename}`,
        },
        transcription: {
          language: transcription.language,
          duration: transcription.duration || metadata.duration,
          text: transcription.text,
          segmentsCount: transcription.segments.length,
          segments: transcription.segments,
        },
        subtitles: {
          srt: srtContent,
          vtt: vttContent,
          srtFilename,
          vttFilename,
          srtDownloadUrl: `/api/download/subtitles/${srtFilename}`,
          vttDownloadUrl: `/api/download/subtitles/${vttFilename}`,
        },
      },
    });
  } catch (error) {
    if (audioPath) {
      await safeUnlink(audioPath);
    }
    next(error);
  }
}

/**
 * Handle POST /api/transcribe/audio
 * Direct audio file transcription
 */
export async function transcribeAudio(req, res, next) {
  try {
    const audioFile = req.file;
    if (!audioFile) {
      throw AppError.badRequest('No audio file provided. Please upload an audio file.');
    }

    const { language, prompt, temperature } = req.body;

    logger.info(`Received transcription request for audio: ${audioFile.originalname}`);

    const metadata = await getMediaMetadata(audioFile.path);

    const transcription = await transcribeAudioWithGroq(audioFile.path, {
      language,
      prompt,
      temperature: temperature !== undefined ? parseFloat(temperature) : 0.0,
      wordLevelTimestamps: true,
    });

    const srtContent = segmentsToSrt(transcription.segments);
    const vttContent = segmentsToVtt(transcription.segments);

    const subtitleId = uuidv4().substring(0, 8);
    const srtFilename = `subtitles-${Date.now()}-${subtitleId}.srt`;
    const vttFilename = `subtitles-${Date.now()}-${subtitleId}.vtt`;

    const srtFilePath = path.join(config.storage.tempDir, srtFilename);
    const vttFilePath = path.join(config.storage.tempDir, vttFilename);

    await Promise.all([
      writeSubtitleFile(srtFilePath, srtContent),
      writeSubtitleFile(vttFilePath, vttContent),
    ]);

    // Clean up uploaded raw audio file
    await safeUnlink(audioFile.path);

    res.status(200).json({
      success: true,
      message: 'Audio transcribed successfully',
      data: {
        audio: {
          originalName: audioFile.originalname,
          duration: metadata.duration,
          sizeBytes: audioFile.size,
        },
        transcription: {
          language: transcription.language,
          duration: transcription.duration || metadata.duration,
          text: transcription.text,
          segmentsCount: transcription.segments.length,
          segments: transcription.segments,
        },
        subtitles: {
          srt: srtContent,
          vtt: vttContent,
          srtFilename,
          vttFilename,
          srtDownloadUrl: `/api/download/subtitles/${srtFilename}`,
          vttDownloadUrl: `/api/download/subtitles/${vttFilename}`,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
