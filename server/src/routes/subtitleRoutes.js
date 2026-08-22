/**
 * Subtitle Converter Routes
 */
import { Router } from 'express';
import { convertSubtitles } from '../controllers/subtitleController.js';

const router = Router();

// POST /api/subtitles/convert
router.post('/convert', convertSubtitles);

export default router;
