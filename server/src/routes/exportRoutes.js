/**
 * Video Export Routes
 */
import { Router } from 'express';
import { exportVideoWithSubtitles } from '../controllers/exportController.js';
import { uploadExportMedia } from '../middlewares/uploadMiddleware.js';

const router = Router();

// POST /api/export-video
// Handles JSON body OR multipart form upload with fields 'video' and/or 'subtitles'
router.post(
  '/',
  uploadExportMedia.fields([
    { name: 'video', maxCount: 1 },
    { name: 'subtitles', maxCount: 1 },
  ]),
  exportVideoWithSubtitles
);

export default router;
