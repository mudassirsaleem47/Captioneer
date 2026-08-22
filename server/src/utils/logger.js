/**
 * Structured console logger with color-coding and timestamp formatting
 */

const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

const getTimestamp = () => new Date().toISOString();

export const logger = {
  info: (message, meta = '') => {
    console.log(
      `${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.blue}${colors.bold}[INFO]${colors.reset} ${message}`,
      meta ? meta : ''
    );
  },

  success: (message, meta = '') => {
    console.log(
      `${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.green}${colors.bold}[SUCCESS]${colors.reset} ${message}`,
      meta ? meta : ''
    );
  },

  warn: (message, meta = '') => {
    console.warn(
      `${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.yellow}${colors.bold}[WARN]${colors.reset} ${message}`,
      meta ? meta : ''
    );
  },

  error: (message, error = null) => {
    console.error(
      `${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.red}${colors.bold}[ERROR]${colors.reset} ${message}`,
      error ? error : ''
    );
  },

  debug: (message, meta = '') => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `${colors.dim}[${getTimestamp()}]${colors.reset} ${colors.magenta}${colors.bold}[DEBUG]${colors.reset} ${message}`,
        meta ? meta : ''
      );
    }
  },
};
