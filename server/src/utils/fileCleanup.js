/**
 * File cleanup utilities to prevent storage leaks and handle temporary files
 */
import fs from 'fs';
import path from 'path';
import { config } from '../config/env.js';
import { logger } from './logger.js';

/**
 * Initialize and ensure all storage directories exist on startup
 */
export function initStorageDirectories() {
  const dirs = [
    config.storage.uploadDir,
    config.storage.tempDir,
    config.storage.exportDir,
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created storage directory: ${dir}`);
    }
    // Ensure .gitkeep exists so empty directories are preserved in version control
    const gitkeepPath = path.join(dir, '.gitkeep');
    if (!fs.existsSync(gitkeepPath)) {
      try {
        fs.writeFileSync(gitkeepPath, '');
      } catch (err) {
        // Ignore gitkeep creation error if directory already has files
      }
    }
  }
}

/**
 * Safely delete a single file without throwing errors if it does not exist
 * @param {string} filePath - Absolute or relative file path
 * @returns {Promise<boolean>} - True if file was deleted, false otherwise
 */
export async function safeUnlink(filePath) {
  if (!filePath || typeof filePath !== 'string') return false;

  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      logger.debug(`Safely deleted file: ${filePath}`);
      return true;
    }
  } catch (error) {
    logger.warn(`Failed to delete file ${filePath}: ${error.message}`);
  }
  return false;
}

/**
 * Safely delete multiple files concurrently
 * @param {string[]} filePaths - Array of file paths to delete
 * @returns {Promise<number>} - Count of successfully deleted files
 */
export async function safeUnlinkMany(filePaths = []) {
  if (!Array.isArray(filePaths) || filePaths.length === 0) return 0;

  let deletedCount = 0;
  await Promise.all(
    filePaths.map(async (fp) => {
      const deleted = await safeUnlink(fp);
      if (deleted) deletedCount++;
    })
  );
  return deletedCount;
}

/**
 * Scan a directory and delete files older than maxAgeMinutes
 * @param {string} directoryPath - Directory to sweep
 * @param {number} maxAgeMinutes - Maximum file age in minutes
 * @returns {Promise<number>} - Number of cleaned files
 */
export async function cleanupStaleFiles(directoryPath, maxAgeMinutes = config.storage.tempFileMaxAgeMinutes) {
  if (!fs.existsSync(directoryPath)) return 0;

  const now = Date.now();
  const maxAgeMs = maxAgeMinutes * 60 * 1000;
  let deletedCount = 0;

  try {
    const files = await fs.promises.readdir(directoryPath);

    for (const file of files) {
      if (file === '.gitkeep') continue;

      const fullPath = path.join(directoryPath, file);
      try {
        const stats = await fs.promises.stat(fullPath);
        if (stats.isFile()) {
          const fileAgeMs = now - stats.mtimeMs;
          if (fileAgeMs > maxAgeMs) {
            await fs.promises.unlink(fullPath);
            deletedCount++;
            logger.debug(`Cleaned up stale file (${Math.round(fileAgeMs / 60000)}m old): ${file}`);
          }
        }
      } catch (fileErr) {
        logger.warn(`Error inspecting file ${fullPath} during cleanup: ${fileErr.message}`);
      }
    }
  } catch (dirErr) {
    logger.error(`Error reading directory ${directoryPath} for cleanup: ${dirErr.message}`);
  }

  return deletedCount;
}

/**
 * Run cleanup sweep across temp, uploads, and exports directories
 */
export async function runFullCleanup() {
  logger.info('Running storage maintenance and stale file cleanup...');
  const tempCleaned = await cleanupStaleFiles(config.storage.tempDir, config.storage.tempFileMaxAgeMinutes);
  const uploadsCleaned = await cleanupStaleFiles(config.storage.uploadDir, config.storage.tempFileMaxAgeMinutes * 2);
  const exportsCleaned = await cleanupStaleFiles(config.storage.exportDir, config.storage.tempFileMaxAgeMinutes * 3);

  const total = tempCleaned + uploadsCleaned + exportsCleaned;
  logger.info(`Cleanup completed. Removed ${total} stale files (Temp: ${tempCleaned}, Uploads: ${uploadsCleaned}, Exports: ${exportsCleaned}).`);
}

/**
 * Start periodic background cleanup timer
 * @returns {NodeJS.Timeout}
 */
export function startPeriodicCleanup() {
  const intervalMs = config.storage.cleanupIntervalMinutes * 60 * 1000;
  
  // Run once shortly after startup (after 10 seconds)
  setTimeout(() => {
    runFullCleanup().catch((err) => logger.error('Initial cleanup error:', err));
  }, 10000);

  const intervalId = setInterval(() => {
    runFullCleanup().catch((err) => logger.error('Scheduled cleanup error:', err));
  }, intervalMs);

  return intervalId;
}
