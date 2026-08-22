/**
 * HTTP Request Logger Middleware
 */
import morgan from 'morgan';
import { logger } from '../utils/logger.js';

const stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

export const requestLogger = morgan(
  ':remote-addr - :method :url :status :response-time ms - :res[content-length]',
  { stream }
);
