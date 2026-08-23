/**
 * Groq Cloud Whisper Transcription Service
 */
import fs from 'fs';
import path from 'path';
import { getGroqClient, isGroqConfigured } from '../config/groq.js';
import { config } from '../config/env.js';
import { AppError } from '../utils/appError.js';
import { logger } from '../utils/logger.js';
import { normalizeSegments } from './subtitleService.js';

const GROQ_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB limit

/**
 * Transcribe an audio file using Groq Cloud's Whisper API (whisper-large-v3)
 * @param {string} audioFilePath - Absolute path to extracted audio file (MP3/WAV)
 * @param {object} [options={}] - Transcription options
 * @param {string} [options.language] - Optional ISO language code (e.g. 'en', 'es', 'fr')
 * @param {string} [options.prompt] - Optional context prompt to guide spelling & jargon
 * @param {number} [options.temperature=0.0] - Sampling temperature (0.0 to 1.0)
 * @param {boolean} [options.wordLevelTimestamps=true] - Whether to request word-level granularity
 * @returns {Promise<{ text: string, segments: Array, language: string, duration: number, words?: Array }>}
 */
export async function transcribeAudioWithGroq(audioFilePath, options = {}) {
  if (!fs.existsSync(audioFilePath)) {
    throw AppError.notFound(`Audio file not found for transcription: ${audioFilePath}`);
  }

  if (!isGroqConfigured()) {
    throw AppError.badRequest(
      'GROQ_API_KEY is not configured on the server. Please set a valid GROQ_API_KEY in your .env file.'
    );
  }

  const stats = await fs.promises.stat(audioFilePath);
  if (stats.size > GROQ_MAX_FILE_SIZE_BYTES) {
    throw AppError.payloadTooLarge(
      `Audio file exceeds Groq 25MB limit (${(stats.size / 1024 / 1024).toFixed(2)} MB). Please upload a shorter video or compress further.`
    );
  }

  const {
    language,
    prompt,
    temperature = 0.0,
    wordLevelTimestamps = true,
  } = options;

  const groq = getGroqClient();
  const model = config.groq.whisperModel || 'whisper-large-v3';

  logger.info(`Sending audio to Groq Whisper (${model}) for transcription... (${(stats.size / 1024).toFixed(1)} KB)`);

  const fileStream = fs.createReadStream(audioFilePath);

  const requestPayload = {
    file: fileStream,
    model,
    response_format: 'verbose_json',
    temperature: typeof temperature === 'number' ? temperature : 0.0,
  };

  let finalPrompt = prompt || '';
  if (language && typeof language === 'string' && language.trim().length > 0) {
    const langCode = language.trim().toLowerCase();
    if (langCode === 'roman-urdu') {
      requestPayload.language = 'ur';
      const romanUrduPrompt = 'Transcribe this Urdu audio into Roman Urdu using English/Latin script (e.g. kya haal hai, kaise ho, shukriya, bohot acha). Do not use Urdu/Arabic script.';
      finalPrompt = finalPrompt ? `${finalPrompt}. ${romanUrduPrompt}` : romanUrduPrompt;
    } else {
      requestPayload.language = langCode;
    }
  }

  if (finalPrompt && typeof finalPrompt === 'string' && finalPrompt.trim().length > 0) {
    requestPayload.prompt = finalPrompt.trim();
  }

  if (wordLevelTimestamps) {
    requestPayload.timestamp_granularities = ['segment', 'word'];
  }

  const startTime = Date.now();

  try {
    const response = await groq.audio.transcriptions.create(requestPayload);
    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(2);

    logger.success(`Groq transcription completed in ${elapsedSeconds}s!`);

    // Process raw response segments
    const rawSegments = response.segments || [];
    const normalized = normalizeSegments(
      rawSegments.map((seg, idx) => ({
        id: seg.id !== undefined ? seg.id : idx + 1,
        start: seg.start,
        end: seg.end,
        text: seg.text,
        words: seg.words || undefined,
      }))
    );

    // If segments array was empty (short audio without explicit segment breakdown), fallback to whole text
    if (normalized.length === 0 && response.text && response.text.trim().length > 0) {
      normalized.push({
        id: 1,
        start: 0.0,
        end: parseFloat(response.duration || 0) || 5.0,
        text: response.text.trim(),
      });
    }

    return {
      text: response.text ? response.text.trim() : '',
      segments: normalized,
      language: response.language || (language || 'auto-detected'),
      duration: parseFloat(response.duration || 0),
      words: response.words || undefined,
    };
  } catch (error) {
    logger.error('Groq Whisper API call failed:', error.message);

    if (error.status === 401) {
      throw AppError.unauthorized('Invalid Groq API key. Please check your GROQ_API_KEY environment variable.');
    } else if (error.status === 429) {
      throw new AppError('Groq API rate limit exceeded. Please try again in a few moments.', 429);
    } else if (error.status >= 400 && error.status < 500) {
      throw AppError.badRequest(`Groq Whisper transcription error: ${error.message}`);
    }

    throw AppError.internal(`Groq Cloud service error: ${error.message}`);
  }
}
