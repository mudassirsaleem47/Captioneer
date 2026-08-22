/**
 * API Integration Tests for Captioneer Backend
 */
import http from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import app from '../src/app.js';
import { initStorageDirectories, safeUnlink } from '../src/utils/fileCleanup.js';
import { config } from '../src/config/env.js';
import { getBestVideoEncoder } from '../src/config/ffmpeg.js';

const execAsync = promisify(exec);

async function runApiTests() {
  console.log('\n=============================================');
  console.log('  Running Captioneer API Endpoint Tests');
  console.log('=============================================\n');

  initStorageDirectories();

  let server;
  const testPort = 5999;
  const baseUrl = `http://127.0.0.1:${testPort}`;

  await new Promise((resolve) => {
    server = http.createServer(app).listen(testPort, '127.0.0.1', resolve);
  });

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

  try {
    // 1. Test Root Info Endpoint
    const rootRes = await fetch(`${baseUrl}/`);
    const rootData = await rootRes.json();
    assert(rootRes.status === 200, 'GET / returns 200 OK');
    assert(rootData.name === 'Captioneer API', 'GET / returns API metadata');

    // 2. Test Health Endpoint
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 || healthRes.status === 207, 'GET /api/health returns valid status');
    assert(healthData.dependencies.ffmpeg.status === 'healthy', 'Health check verifies FFmpeg binary');

    // 3. Test Subtitle Conversion Endpoint
    const convertRes = await fetch(`${baseUrl}/api/subtitles/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subtitles: [
          { id: 1, start: 0.5, end: 2.5, text: 'Hello World' },
          { id: 2, start: 3.0, end: 5.0, text: 'Captioneer API Test' },
        ],
      }),
    });
    const convertData = await convertRes.json();
    assert(convertRes.status === 200, 'POST /api/subtitles/convert returns 200');
    assert(convertData.data.srt.includes('00:00:00,500 --> 00:00:02,500'), 'Subtitle converter generates valid SRT');
    assert(convertData.data.vtt.includes('WEBVTT'), 'Subtitle converter generates valid VTT');

    // 4. Test 404 Route Not Found
    const notFoundRes = await fetch(`${baseUrl}/api/non-existent-route`);
    assert(notFoundRes.status === 404, 'Non-existent route returns 404');

    // 5. Test Video Export via API with uploaded video and subtitle payload
    const bestEncoder = await getBestVideoEncoder();
    const tempVideoName = `api-test-video-${Date.now()}.mp4`;
    const tempVideoPath = path.join(config.storage.uploadDir, tempVideoName);

    // Create small sample video directly in uploadDir to simulate prior transcription upload
    await execAsync(
      `ffmpeg -y -f lavfi -i testsrc=duration=2:size=320x240:rate=30 -f lavfi -i sine=frequency=440:duration=2 -c:v ${bestEncoder} -pix_fmt yuv420p -c:a aac -shortest "${tempVideoPath}"`
    );

    const exportRes = await fetch(`${baseUrl}/api/export-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: tempVideoName,
        subtitles: [
          { id: 1, start: 0.2, end: 1.8, text: 'Burned Captions Test' },
        ],
        style: {
          fontSize: 20,
          primaryColor: '#FFFF00',
          alignment: 'bottom-center',
        },
      }),
    });

    const exportData = await exportRes.json();
    assert(exportRes.status === 200, 'POST /api/export-video returns 200');
    assert(Boolean(exportData.data.downloadUrl), 'Export response includes downloadUrl');
    assert(Boolean(exportData.data.exportFilename), 'Export response includes exportFilename');

    // 6. Test Download Endpoint for exported video
    const downloadRes = await fetch(`${baseUrl}${exportData.data.downloadUrl}`);
    assert(downloadRes.status === 200, 'GET /api/download/exports/:filename returns 200');
    assert(downloadRes.headers.get('content-type') === 'video/mp4', 'Download header has video/mp4 Content-Type');

    // Clean up created files
    await safeUnlink(tempVideoPath);
    await safeUnlink(path.join(config.storage.exportDir, exportData.data.exportFilename));
  } catch (err) {
    console.error('API test failed with error:', err);
    assert(false, `API test failure: ${err.message}`);
  } finally {
    server.close();
  }

  console.log('\n=============================================');
  console.log(`  API Tests Completed: ${passed} passed, ${failed} failed`);
  console.log('=============================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runApiTests().catch((err) => {
  console.error('API runner fatal error:', err);
  process.exit(1);
});
