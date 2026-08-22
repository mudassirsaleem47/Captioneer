# Captioneer Backend

Production-ready automated video captioning and subtitle burn-in backend powered by **Node.js (Express)**, **FFmpeg**, and **Groq Cloud's Whisper API (`whisper-large-v3`)**.

---

## Features

- 🎙️ **High-Speed Transcription**: Integrates Groq Cloud API with `whisper-large-v3` for lightning-fast speech-to-text with verbose JSON timestamps and word-level granularity.
- 🎬 **Optimized Audio Extraction**: Uses FFmpeg to extract high-quality, lightweight (16kHz mono MP3/WAV) audio streams from virtually any video container (`mp4`, `mkv`, `mov`, `avi`, `webm`, `flv`, etc.).
- 📝 **Multi-Format Subtitle Engine**: Generates and parses standard `.srt`, WebVTT (`.vtt`), Advanced SubStation Alpha (`.ass`), and structured JSON segments.
- 🎨 **Custom Subtitle Burn-In**: Hardcodes custom styled subtitles (font family, font size, primary color, outline color, outline width, background box, shadow, alignment, vertical margins) directly into exported videos using hardware/software accelerated FFmpeg filters.
- 🧹 **Automatic Storage Cleanup**: Prevents disk storage leaks by immediately cleaning temporary audio files and periodically purging stale uploads and temporary files.
- 🛡️ **Production-Ready Architecture**: Modular layered structure (`controllers`, `routes`, `services`, `middlewares`, `utils`), centralized error handling, path traversal protection, security headers with `helmet`, CORS, and health checks.

---

## Directory Structure

```
Captioneer/
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── src/
│   ├── app.js                   # Express application configuration & middlewares
│   ├── server.js                # Server entrypoint, storage init, and graceful shutdown
│   ├── config/
│   │   ├── env.js               # Environment variables configuration & defaults
│   │   ├── ffmpeg.js            # FFmpeg & FFprobe configuration & encoder detection
│   │   └── groq.js              # Groq SDK client instance & connectivity tests
│   ├── controllers/
│   │   ├── transcribeController.js # Video & audio transcription handlers
│   │   ├── exportController.js     # Video subtitle burn-in & export handler
│   │   ├── downloadController.js   # Secure file download & media streaming handler
│   │   ├── subtitleController.js   # Format conversion (JSON <-> SRT <-> VTT)
│   │   └── healthController.js     # Health check verifying FFmpeg & Groq
│   ├── middlewares/
│   │   ├── errorMiddleware.js   # Centralized error handler & 404 handler
│   │   ├── uploadMiddleware.js  # Multer configuration with MIME & size validation
│   │   └── loggerMiddleware.js  # HTTP request logger
│   ├── routes/
│   │   ├── index.js             # Master API router
│   │   ├── transcribeRoutes.js  # /api/transcribe routes
│   │   ├── exportRoutes.js      # /api/export-video routes
│   │   ├── downloadRoutes.js    # /api/download/:type/:filename
│   │   ├── subtitleRoutes.js    # /api/subtitles/convert
│   │   └── healthRoutes.js      # /api/health
│   ├── services/
│   │   ├── audioService.js      # FFmpeg audio extraction & media probing
│   │   ├── groqService.js       # Groq Cloud Whisper API integration
│   │   ├── subtitleService.js   # SRT/VTT/ASS subtitle formatting & parsing
│   │   └── videoService.js      # Subtitle burn-in with custom styles & export
│   └── utils/
│       ├── appError.js          # Standardized AppError class
│       ├── constants.js         # Supported MIME types, default styles & alignments
│       ├── fileCleanup.js       # Auto-cleanup utility & periodic sweeps
│       ├── formatters.js        # Timestamp & hex-to-ASS color converters
│       └── logger.js            # Color-coded structured console logger
├── storage/
│   ├── uploads/                 # Uploaded source videos
│   ├── temp/                    # Extracted audio and temp subtitle files
│   └── exports/                 # Processed videos with burned subtitles
└── test/
    ├── test-pipeline.js         # Unit & audio/video processing tests
    └── test-api.js              # HTTP API endpoint integration tests
```

---

## Prerequisites

- **Node.js**: >= 18.0.0
- **FFmpeg & FFprobe**: Installed on your system PATH (`ffmpeg -version`)
- **Groq API Key**: Obtain a free API key from [Groq Cloud Console](https://console.groq.com/keys)

---

## Installation & Setup

1. **Clone or navigate to the repository:**
   ```bash
   cd /path/to/Captioneer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your credentials:
   ```ini
   PORT=5000
   NODE_ENV=development
   GROQ_API_KEY=gsk_your_actual_groq_api_key_here
   GROQ_WHISPER_MODEL=whisper-large-v3
   MAX_FILE_SIZE_MB=500
   TEMP_FILE_MAX_AGE_MINUTES=60
   CLEANUP_INTERVAL_MINUTES=30
   ```

4. **Run the Test Suite:**
   ```bash
   npm test
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```

   Or for production:
   ```bash
   npm start
   ```

---

## API Reference

### 1. Health Check
Verifies system FFmpeg binaries, version, and Groq API connectivity.

- **URL**: `GET /api/health`
- **Response**:
  ```json
  {
    "success": true,
    "service": "captioneer-backend",
    "timestamp": "2026-08-21T12:30:00.000Z",
    "uptimeSeconds": 120,
    "system": {
      "nodeVersion": "v22.23.1",
      "platform": "linux"
    },
    "dependencies": {
      "ffmpeg": {
        "status": "healthy",
        "version": "ffmpeg version n7.1.1...",
        "ffprobeVersion": "ffprobe version n7.1.1..."
      },
      "groq": {
        "status": "healthy",
        "isConfigured": true,
        "configuredModel": "whisper-large-v3",
        "message": "Groq API connection successful"
      }
    }
  }
  ```

---

### 2. Transcribe Video
Uploads a video file, extracts audio, calls Groq Whisper (`whisper-large-v3`), and returns structured segments and subtitle files.

- **URL**: `POST /api/transcribe`
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `video` (file, required): Video file (`.mp4`, `.mov`, `.webm`, `.mkv`, etc.)
  - `language` (text, optional): ISO language code (e.g. `en`, `es`, `fr`, `ur`, etc.)
  - `prompt` (text, optional): Context prompt to improve transcription accuracy
  - `temperature` (text/number, optional): Whisper temperature (default: `0.0`)
- **Example cURL**:
  ```bash
  curl -X POST http://localhost:5000/api/transcribe \
    -F "video=@my-video.mp4" \
    -F "language=en"
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Video transcribed successfully",
    "data": {
      "videoId": "1740140000000-86ddccf0-my_video.mp4",
      "video": {
        "originalName": "my-video.mp4",
        "filename": "1740140000000-86ddccf0-my_video.mp4",
        "duration": 42.5,
        "width": 1920,
        "height": 1080,
        "fps": 30,
        "sizeBytes": 15420100,
        "mimeType": "video/mp4",
        "videoUrl": "/api/download/uploads/1740140000000-86ddccf0-my_video.mp4"
      },
      "transcription": {
        "language": "en",
        "duration": 42.5,
        "text": "Hello world, welcome to Captioneer.",
        "segmentsCount": 2,
        "segments": [
          {
            "id": 1,
            "start": 0.0,
            "end": 2.5,
            "text": "Hello world,",
            "words": [
              { "word": "Hello", "start": 0.0, "end": 0.5 },
              { "word": "world,", "start": 0.6, "end": 1.2 }
            ]
          },
          {
            "id": 2,
            "start": 2.6,
            "end": 4.5,
            "text": "welcome to Captioneer."
          }
        ]
      },
      "subtitles": {
        "srt": "1\n00:00:00,000 --> 00:00:02,500\nHello world,\n\n2\n00:00:02,600 --> 00:00:04,500\nwelcome to Captioneer.\n",
        "vtt": "WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.500\nHello world,\n\n2\n00:00:02.600 --> 00:00:04.500\nwelcome to Captioneer.\n",
        "srtFilename": "subtitles-1740140000000-72b71b8a.srt",
        "vttFilename": "subtitles-1740140000000-72b71b8a.vtt",
        "srtDownloadUrl": "/api/download/subtitles/subtitles-1740140000000-72b71b8a.srt",
        "vttDownloadUrl": "/api/download/subtitles/subtitles-1740140000000-72b71b8a.vtt"
      }
    }
  }
  ```

---

### 3. Transcribe Direct Audio
Transcribes an audio file directly without video stream stripping.

- **URL**: `POST /api/transcribe/audio`
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `audio` (file, required): Audio file (`.mp3`, `.wav`, `.m4a`, `.ogg`, `.flac`)

---

### 4. Export Video with Burned Subtitles
Burns custom styled subtitles onto the video and renders a web-optimized MP4.

- **URL**: `POST /api/export-video`
- **Content-Type**: `application/json` (or `multipart/form-data`)
- **Payload Parameters**:
  - `videoId` (string, optional if uploading new video): Video identifier from previous `/api/transcribe`
  - `video` (file, optional if `videoId` provided): Upload a new video file
  - `subtitles` (array | string, required): Subtitle segments array `[{ id, start, end, text }]` OR raw SRT string
  - `style` (object, optional): Custom styling parameters (see Styling section below)
  - `stream` (boolean, optional): Set to `true` to stream the video directly in response
- **Example JSON Request**:
  ```bash
  curl -X POST http://localhost:5000/api/export-video \
    -H "Content-Type: application/json" \
    -d '{
      "videoId": "1740140000000-86ddccf0-my_video.mp4",
      "subtitles": [
        { "id": 1, "start": 0.0, "end": 2.5, "text": "Hello world" },
        { "id": 2, "start": 2.6, "end": 4.5, "text": "Welcome to Captioneer" }
      ],
      "style": {
        "fontName": "Arial",
        "fontSize": 26,
        "primaryColor": "#FFD700",
        "outlineColor": "#000000",
        "outlineWidth": 2.5,
        "alignment": "bottom-center",
        "marginV": 35,
        "bold": true
      }
    }'
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Video rendered and subtitles burned successfully",
    "data": {
      "exportFilename": "export-1740140000000-d7f67fe0.mp4",
      "duration": 42.5,
      "sizeBytes": 12840000,
      "format": "mp4",
      "downloadUrl": "/api/download/exports/export-1740140000000-d7f67fe0.mp4",
      "streamUrl": "/api/download/exports/export-1740140000000-d7f67fe0.mp4?stream=true",
      "appliedStyle": {
        "fontName": "Arial",
        "fontSize": 26,
        "primaryColor": "#FFD700",
        "outlineColor": "#000000",
        "outlineWidth": 2.5,
        "alignment": "bottom-center",
        "marginV": 35,
        "bold": true
      },
      "segmentsCount": 2
    }
  }
  ```

---

### 5. Subtitle Format Converter
Converts between JSON segments, SRT, and WebVTT strings.

- **URL**: `POST /api/subtitles/convert`
- **Content-Type**: `application/json`
- **Payload**:
  ```json
  {
    "subtitles": [
      { "id": 1, "start": 0.5, "end": 2.5, "text": "Example segment" }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "segmentsCount": 1,
      "segments": [
        { "id": 1, "start": 0.5, "end": 2.5, "text": "Example segment" }
      ],
      "srt": "1\n00:00:00,500 --> 00:00:02,500\nExample segment\n",
      "vtt": "WEBVTT\n\n1\n00:00:00.500 --> 00:00:02.500\nExample segment\n"
    }
  }
  ```

---

### 6. Secure Download & Stream Endpoint
Downloads or streams videos, exports, or subtitle files with path traversal security.

- **URL**: `GET /api/download/:type/:filename`
  - `:type`: `exports`, `uploads`, `subtitles`, or `temp`
  - `:filename`: filename (e.g. `export-1740140000000-d7f67fe0.mp4`)
  - Query parameter `?stream=true`: Returns inline stream with `Accept-Ranges` support for browser video players.

---

## Subtitle Styling Reference

When exporting videos, the `style` object allows full aesthetic customization:

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `fontName` | `string` | `"Arial"` | Font family (e.g. `"Arial"`, `"Roboto"`, `"Montserrat"`, `"Helvetica"`) |
| `fontSize` | `number` | `22` | Font size in points |
| `primaryColor` | `string` | `"#FFFFFF"` | Primary text color (Hex `#RRGGBB` or `#RRGGBBAA`) |
| `outlineColor` | `string` | `"#000000"` | Text outline border color (Hex) |
| `outlineWidth` | `number` | `2` | Border stroke width in pixels |
| `backColor` | `string` | `"#00000000"` | Background box or shadow color (Hex) |
| `shadow` | `number` | `1` | Shadow depth distance in pixels |
| `alignment` | `string` | `"bottom-center"` | Position: `"bottom-center"`, `"bottom-left"`, `"bottom-right"`, `"top-center"`, `"middle-center"`, etc. |
| `marginV` | `number` | `30` | Vertical offset from top/bottom edge in pixels |
| `marginH` | `number` | `20` | Horizontal margin in pixels |
| `bold` | `boolean` | `true` | Bold font weight |
| `italic` | `boolean` | `false` | Italic font style |
| `borderStyle` | `number` | `1` | `1` = Outline + Drop Shadow, `3` = Opaque Background Box |

---

## Storage & Maintenance

- **Immediate Temp Cleanup**: Extracted audio files (`storage/temp/audio-*.mp3`) and intermediate ASS subtitle files are safely removed immediately after processing.
- **Scheduled Background Sweeper**: Runs periodically (configured via `CLEANUP_INTERVAL_MINUTES`) to sweep any orphaned files older than `TEMP_FILE_MAX_AGE_MINUTES`.
- **Error Safe Cleanup**: If an upload or transcription step fails midway, any newly uploaded files are automatically unlinked to prevent storage leaks.

---

## License

MIT
