/**
 * Download & Stream Routes
 */
import { Router } from 'express';
import { downloadFile } from '../controllers/downloadController.js';

const router = Router();

// GET /api/download/:type/:filename
router.get('/:type/:filename', downloadFile);

export default router;
