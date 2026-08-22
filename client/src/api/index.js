/**
 * Backend API Client
 */

/**
 * Upload video file and receive Groq Whisper transcription
 */
export async function uploadAndTranscribe(file, options = {}) {
  const formData = new FormData();
  formData.append('video', file);

  if (options.language) {
    formData.append('language', options.language);
  }
  if (options.prompt) {
    formData.append('prompt', options.prompt);
  }

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Upload failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Export video with hardcoded / burned subtitles via FFmpeg
 */
export async function exportVideo(params) {
  const { videoId, videoFile, subtitles, style } = params;

  // Map frontend style properties to backend format
  const backendStyle = {
    fontName: style.fontFamily,
    fontSize: Math.round(style.fontSize * 0.7),
    primaryColor: style.activeWordColor || style.textColor,
    outlineColor: style.strokeColor,
    outlineWidth: style.strokeWidth > 0 ? style.strokeWidth / 3 : 0,
    backColor: style.hasBox ? style.boxBackground : '#00000000',
    bold: style.bold,
    italic: style.italic,
    alignment: style.alignment === 'top' ? 'top-center' : style.alignment === 'middle' ? 'middle-center' : 'bottom-center',
    marginV: Math.round((100 - style.positionY) * 6),
    borderStyle: style.hasBox ? 3 : 1,
  };

  let body;
  let headers = {};

  if (videoFile) {
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('subtitles', JSON.stringify(subtitles));
    formData.append('style', JSON.stringify(backendStyle));
    body = formData;
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({
      videoId,
      subtitles,
      style: backendStyle,
    });
  }

  const response = await fetch('/api/export-video', {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Export failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Check backend system health
 */
export async function checkHealth() {
  const res = await fetch('/api/health');
  return res.json();
}
