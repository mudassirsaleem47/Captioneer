/**
 * Groq Cloud SDK Client configuration and health verification
 */
import Groq from 'groq-sdk';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let groqClient = null;

/**
 * Get or initialize Groq SDK client instance
 * @returns {Groq}
 */
export function getGroqClient() {
  if (!groqClient) {
    if (!config.groq.apiKey || config.groq.apiKey === 'your_groq_api_key_here' || config.groq.apiKey.trim() === '') {
      logger.warn('GROQ_API_KEY is not set or using placeholder. Transcription endpoints will fail unless a valid key is provided.');
    }
    
    groqClient = new Groq({
      apiKey: config.groq.apiKey,
    });
  }
  return groqClient;
}

/**
 * Check if Groq API key is populated
 * @returns {boolean}
 */
export function isGroqConfigured() {
  return Boolean(
    config.groq.apiKey &&
    config.groq.apiKey.trim() !== '' &&
    !config.groq.apiKey.includes('your_groq_api_key_here')
  );
}

/**
 * Test connectivity to Groq API
 * @returns {Promise<{ ok: boolean, message: string, models?: string[] }>}
 */
export function testGroqConnection() {
  return new Promise((resolve) => {
    if (!isGroqConfigured()) {
      return resolve({
        ok: false,
        message: 'GROQ_API_KEY is missing or invalid in environment.',
      });
    }

    const client = getGroqClient();
    client.models.list()
      .then((modelsList) => {
        const whisperModel = modelsList.data?.find(m => m.id.includes('whisper'));
        resolve({
          ok: true,
          message: 'Groq API connection successful',
          availableWhisperModel: whisperModel?.id || config.groq.whisperModel,
        });
      })
      .catch((err) => {
        resolve({
          ok: false,
          message: `Groq API connection failed: ${err.message}`,
        });
      });
  });
}
