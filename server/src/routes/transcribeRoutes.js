/**
 * Transcription Routes
 */
import { Router } from 'express';
import { transcribeVideo, transcribeAudio } from '../controllers/transcribeController.js';
import { uploadVideo, uploadAudio } from '../middlewares/uploadMiddleware.js';

const router = Router();

// POST /api/transcribe - Upload and transcribe video
router.post(
  '/',
  uploadVideo.single('video'),
  transcribeVideo
);

// Alternative route for field named 'file'
router.post(
  '/file',
  uploadVideo.single('file'),
  transcribeVideo
);

// POST /api/transcribe/audio - Direct audio file upload and transcribe
router.post(
  '/audio',
  uploadAudio.single('audio'),
  transcribeAudio
);

export default router;
