/**
 * Master API Router
 */
import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import transcribeRoutes from './transcribeRoutes.js';
import exportRoutes from './exportRoutes.js';
import downloadRoutes from './downloadRoutes.js';
import subtitleRoutes from './subtitleRoutes.js';

const router = Router();

// Mount API sub-routes
router.use('/health', healthRoutes);
router.use('/transcribe', transcribeRoutes);
router.use('/export-video', exportRoutes);
router.use('/download', downloadRoutes);
router.use('/subtitles', subtitleRoutes);

export default router;
