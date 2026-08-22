/**
 * Comprehensive Pipeline Test for Captioneer Backend
 * Tests subtitle conversion, FFmpeg audio extraction, and video subtitle burning
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  segmentsToSrt,
  segmentsToVtt,
  srtToSegments,
  vttToSegments,
  generateAssSubtitleContent,
  writeSubtitleFile,
} from '../src/services/subtitleService.js';
import { extractAudioFromVideo, getMediaMetadata } from '../src/services/audioService.js';
import { burnSubtitlesToVideo } from '../src/services/videoService.js';
import { initStorageDirectories, safeUnlink } from '../src/utils/fileCleanup.js';
import { checkFFmpegAvailable, getBestVideoEncoder } from '../src/config/ffmpeg.js';
import { config } from '../src/config/env.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('\n=============================================');
  console.log('  Running Captioneer Backend Unit & E2E Tests');
  console.log('=============================================\n');

  initStorageDirectories();

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Test Subtitle Services
  console.log('\n--- 1. Subtitle Parsing & Conversion Tests ---');
  const sampleSegments = [
    { id: 1, start: 1.25, end: 3.5, text: 'Hello, welcome to Captioneer!' },
    { id: 2, start: 4.0, end: 6.85, text: 'Automated video captions made simple.' },
  ];

  const srtOutput = segmentsToSrt(sampleSegments);
  assert(srtOutput.includes('00:00:01,250 --> 00:00:03,500'), 'segmentsToSrt formats timestamps correctly');
  assert(srtOutput.includes('Hello, welcome to Captioneer!'), 'segmentsToSrt includes subtitle text');

  const vttOutput = segmentsToVtt(sampleSegments);
  assert(vttOutput.startsWith('WEBVTT'), 'segmentsToVtt includes WEBVTT header');
  assert(vttOutput.includes('00:00:04.000 --> 00:00:06.850'), 'segmentsToVtt formats dot milliseconds');

  const parsedFromSrt = srtToSegments(srtOutput);
  assert(parsedFromSrt.length === 2, 'srtToSegments parses 2 segments correctly');
  assert(parsedFromSrt[0].text === 'Hello, welcome to Captioneer!', 'srtToSegments parsed text matches');
  assert(Math.abs(parsedFromSrt[0].start - 1.25) < 0.01, 'srtToSegments parsed start time matches');

  const parsedFromVtt = vttToSegments(vttOutput);
  assert(parsedFromVtt.length === 2, 'vttToSegments parses 2 segments correctly');

  const assContent = generateAssSubtitleContent(sampleSegments, {
    fontSize: 28,
    primaryColor: '#FFD700', // Gold
    outlineColor: '#000000',
    alignment: 'bottom-center',
  });
  assert(assContent.includes('[Script Info]'), 'generateAssSubtitleContent includes ASS header');
  assert(assContent.includes('Dialogue: 0,'), 'generateAssSubtitleContent includes Dialogue events');

  // 2. Test FFmpeg Availability
  console.log('\n--- 2. FFmpeg Binary & Media Tests ---');
  const ffmpegCheck = await checkFFmpegAvailable();
  assert(ffmpegCheck.available === true, 'FFmpeg and ffprobe are available on system');

  const bestEncoder = await getBestVideoEncoder();
  console.log(`Detected best video encoder: ${bestEncoder}`);

  // 3. Generate a synthetic 4-second MP4 test video with sine wave audio for testing
  const testVideoPath = path.join(config.storage.tempDir, 'test-sample-video.mp4');
  console.log(`\nGenerating synthetic test video with audio at: ${testVideoPath}`);

  try {
    // Generate a 4-second 640x360 test video with a 440Hz test beep audio stream
    await execAsync(
      `ffmpeg -y -f lavfi -i testsrc=duration=4:size=640x360:rate=30 -f lavfi -i sine=frequency=440:duration=4 -c:v ${bestEncoder} -pix_fmt yuv420p -c:a aac -shortest "${testVideoPath}"`
    );
    assert(fs.existsSync(testVideoPath), 'Synthetic test video generated successfully');

    // 4. Test Media Metadata Probing
    const meta = await getMediaMetadata(testVideoPath);
    assert(meta.hasAudio === true, 'getMediaMetadata detects audio stream');
    assert(meta.width === 640 && meta.height === 360, 'getMediaMetadata reads correct resolution');
    assert(meta.duration >= 3.9, 'getMediaMetadata reads correct duration');

    // 5. Test Audio Extraction (16kHz mono MP3)
    console.log('\n--- 3. Audio Extraction Service Tests ---');
    const extractRes = await extractAudioFromVideo(testVideoPath, {
      format: 'mp3',
      sampleRate: 16000,
      channels: 1,
      bitrate: '64k',
    });
    assert(fs.existsSync(extractRes.audioPath), 'Audio file extracted to temp storage');
    assert(extractRes.sizeBytes > 0, 'Extracted audio has non-zero byte size');

    // Clean up extracted audio
    await safeUnlink(extractRes.audioPath);
    assert(!fs.existsSync(extractRes.audioPath), 'safeUnlink successfully cleans temporary audio file');

    // 6. Test Subtitle Burning & Video Export
    console.log('\n--- 4. Video Subtitle Burn-In & Export Tests ---');
    const exportRes = await burnSubtitlesToVideo({
      videoPath: testVideoPath,
      subtitles: sampleSegments,
      style: {
        fontSize: 24,
        primaryColor: '#00FF00', // Green
        outlineColor: '#000000',
        outlineWidth: 2,
        alignment: 'bottom-center',
      },
      outputFormat: 'mp4',
    });

    assert(fs.existsSync(exportRes.exportPath), 'Exported video file created successfully');
    assert(exportRes.sizeBytes > 0, 'Exported video has non-zero byte size');
    assert(exportRes.duration >= 3.9, 'Exported video duration preserved');

    // Clean up test files
    await safeUnlink(testVideoPath);
    await safeUnlink(exportRes.exportPath);
    console.log('Cleaned up synthetic test files.');
  } catch (err) {
    console.error('Video test error:', err);
    assert(false, `Video processing test failed: ${err.message}`);
  }

  console.log('\n=============================================');
  console.log(`  Tests Completed: ${passed} passed, ${failed} failed`);
  console.log('=============================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
