/**
 * Application constants and default configurations
 */

export const ALLOWED_VIDEO_EXTENSIONS = [
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.webm',
  '.flv',
  '.wmv',
  '.m4v',
  '.ts',
  '.ogv',
];

export const ALLOWED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/webm',
  'video/x-flv',
  'video/x-ms-wmv',
  'video/x-m4v',
  'video/mp2t',
  'video/ogg',
  'application/octet-stream', // Some browsers send binary stream
];

export const ALLOWED_AUDIO_EXTENSIONS = [
  '.mp3',
  '.wav',
  '.m4a',
  '.ogg',
  '.aac',
  '.flac',
  '.wma',
];

export const ALLOWED_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/x-pn-wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/ogg',
  'audio/aac',
  'audio/flac',
  'audio/x-flac',
];

export const ALLOWED_SUBTITLE_EXTENSIONS = ['.srt', '.vtt', '.json'];

export const DEFAULT_WHISPER_MODEL = 'whisper-large-v3';

export const SUBTITLE_ALIGNMENTS = {
  'bottom-left': 1,
  'bottom-center': 2,
  'bottom-right': 3,
  'middle-left': 4,
  'middle-center': 5,
  'middle-right': 6,
  'top-left': 7,
  'top-center': 8,
  'top-right': 9,
};

export const DEFAULT_SUBTITLE_STYLE = {
  fontName: 'Arial',
  fontSize: 22,
  primaryColor: '#FFFFFF', // White
  outlineColor: '#000000', // Black
  outlineWidth: 2,
  backColor: '#00000000', // Transparent background box by default
  bold: true,
  italic: false,
  underline: false,
  shadow: 1,
  alignment: 'bottom-center',
  marginV: 30, // Vertical margin from edge in pixels
  marginH: 20, // Horizontal margin
  borderStyle: 1, // 1 = outline with shadow, 3 = opaque box
};
