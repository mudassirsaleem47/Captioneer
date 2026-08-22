import React, { useState, useRef } from 'react';
import {
  Upload,
  FileVideo,
  Sparkles,
  AlertCircle,
  Play,
  Film,
  Zap,
  Shield,
  Layers,
  Wand2,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Select, SelectItem } from '../ui/Select';
import { TextField } from '../ui/TextField';
import { ProgressBar } from '../ui/ProgressBar';
import { ProgressCircle } from '../ui/ProgressCircle';
import { uploadAndTranscribe } from '../../api';
import { UI_CONTENT } from '../../config/uiContent';

export function UploadScreen({ onUploadSuccess, onLoadDemo }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [language, setLanguage] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);

  const content = UI_CONTENT.uploadModal;
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select or drop a video file first.');
      return;
    }

    setLoading(true);
    setError(null);
    setProgressPercent(20);
    setStatusMessage(content.uploadingMessage);

    try {
      const localBlobUrl = URL.createObjectURL(selectedFile);

      // Simulate smooth progress animation while waiting for Whisper
      const progressTimer = setInterval(() => {
        setProgressPercent((prev) => {
          if (prev >= 85) {
            clearInterval(progressTimer);
            return 85;
          }
          return prev + 15;
        });
      }, 500);

      setStatusMessage(content.transcribingMessage);
      const response = await uploadAndTranscribe(selectedFile, {
        language: language || undefined,
        prompt: prompt || undefined,
      });

      clearInterval(progressTimer);
      setProgressPercent(100);
      setStatusMessage(content.completeMessage);

      const videoData = response.data.video;
      const transcription = response.data.transcription;

      setTimeout(() => {
        setLoading(false);
        onUploadSuccess({
          videoUrl: localBlobUrl,
          videoFile: selectedFile,
          metadata: {
            originalName: videoData.originalName,
            filename: videoData.filename,
            duration: videoData.duration,
            width: videoData.width,
            height: videoData.height,
            fps: videoData.fps,
            sizeBytes: videoData.sizeBytes,
            videoId: response.data.videoId,
          },
          subtitles: transcription.segments || [],
        });
      }, 500);
    } catch (err) {
      setError(err.message || 'Failed to transcribe video. Ensure server is running on port 5000.');
      setLoading(false);
      setProgressPercent(0);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0d0e13] text-[#f8fafc] flex flex-col justify-between p-6 sm:p-8 font-sans select-none overflow-y-auto">
      {/* 1. Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0099ff] text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Sparkles size={16} className="fill-white" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white">
              {UI_CONTENT.brand.name}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 ml-2 bg-white/5 text-neutral-400 rounded border border-white/10">
              {UI_CONTENT.brand.badge}
            </span>
          </div>
        </div>

        <Button
          variant="quiet"
          onPress={onLoadDemo}
          className="text-xs text-neutral-300 hover:text-white gap-1.5 border border-white/10"
        >
          <Play size={13} className="text-[#0099ff] fill-current" />
          <span>Open Demo Project</span>
        </Button>
      </header>

      {/* 2. Center Media Upload Card */}
      <main className="max-w-2xl w-full mx-auto my-8 bg-[#161822] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        {/* Glow backdrop behind card */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#0099ff]/15 blur-3xl pointer-events-none rounded-full" />

        <div className="text-center mb-6 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0099ff]/10 border border-[#0099ff]/30 text-[#0099ff] text-xs font-semibold mb-3">
            <Wand2 size={12} />
            <span>AI Powered Word-Level Transcription</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Upload Video to Add Captions
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-lg mx-auto">
            Drop your video file to auto-generate animated, styled captions with Groq Whisper Large v3.
          </p>
        </div>

        {/* Upload Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/15 hover:border-[#0099ff]/60 bg-[#12141c]/60 hover:bg-[#12141c] rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center group relative overflow-hidden"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex flex-col items-center space-y-3 z-10">
              <div className="w-14 h-14 rounded-2xl bg-[#0099ff]/10 border border-[#0099ff]/30 text-[#0099ff] flex items-center justify-center shadow-lg">
                <FileVideo size={28} />
              </div>
              <div>
                <span className="text-sm font-bold text-white block max-w-sm truncate">
                  {selectedFile.name}
                </span>
                <span className="text-xs font-mono text-neutral-400 mt-0.5 block">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to Transcribe
                </span>
              </div>
              <Button
                variant="quiet"
                size="sm"
                onPress={(e) => {
                  e?.stopPropagation?.();
                  setSelectedFile(null);
                }}
                className="text-xs text-red-400 hover:text-red-300 gap-1 mt-1"
              >
                <X size={13} />
                <span>Remove File</span>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3 z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 group-hover:border-[#0099ff]/40 text-neutral-400 group-hover:text-[#0099ff] group-hover:scale-105 flex items-center justify-center transition-all shadow-inner">
                <Upload size={26} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Drag & Drop video file here
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  or <span className="text-[#0099ff] font-semibold underline underline-offset-2">browse from your computer</span>
                </p>
              </div>
              <span className="text-[11px] text-neutral-500 font-mono">
                Supports MP4, MOV, WEBM, MKV, AVI (up to 500MB)
              </span>
            </div>
          )}
        </div>

        {/* Options Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 text-left">
          <Select
            label="Spoken Language"
            selectedKey={language || ''}
            onSelectionChange={(key) => setLanguage(key)}
            placeholder="Auto Detect Language"
          >
            {content.languages.map((l) => (
              <SelectItem key={l.value} id={l.value} textValue={l.label}>
                {l.label}
              </SelectItem>
            ))}
          </Select>

          <TextField
            label="Context Prompt (Optional)"
            placeholder="e.g. Brand names, acronyms, technical terms"
            value={prompt}
            onChange={setPrompt}
          />
        </div>

        {/* Progress Display */}
        {loading && (
          <div className="mt-5 p-4 bg-[#12141c] border border-white/10 rounded-xl space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-2">
                <Sparkles size={13} className="text-[#0099ff] animate-spin" />
                {statusMessage}
              </span>
              <span className="font-mono text-neutral-400">{progressPercent}%</span>
            </div>
            <ProgressBar aria-label="Transcription Progress" value={progressPercent} />
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mt-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-xs text-red-400">
            <AlertCircle size={15} className="shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-white/10">
          <Button
            variant="secondary"
            onPress={onLoadDemo}
            isDisabled={loading}
            className="text-xs"
          >
            <Play size={13} className="text-[#0099ff] fill-current" />
            <span>Use Sample Demo</span>
          </Button>

          <Button
            variant="primary"
            onPress={handleSubmit}
            isDisabled={loading || !selectedFile}
            isPending={loading}
            className="text-xs px-5 shadow-lg shadow-blue-500/25"
          >
            <Sparkles size={14} />
            <span>Start Transcribing Video</span>
          </Button>
        </div>
      </main>

      {/* 3. Feature Highlights Footer */}
      <footer className="max-w-4xl w-full mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-neutral-400 text-xs py-2">
        <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/[0.02]">
          <Zap size={16} className="text-yellow-400" />
          <span className="font-semibold text-white">Groq Whisper v3</span>
          <span className="text-[10px] text-neutral-500">Fast speech-to-text</span>
        </div>

        <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/[0.02]">
          <Sparkles size={16} className="text-[#0099ff]" />
          <span className="font-semibold text-white">Hormozi Styles</span>
          <span className="text-[10px] text-neutral-500">5+ Kinetic Presets</span>
        </div>

        <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/[0.02]">
          <Shield size={16} className="text-emerald-400" />
          <span className="font-semibold text-white">Safe Guides</span>
          <span className="text-[10px] text-neutral-500">TikTok / Reels / Shorts</span>
        </div>

        <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/[0.02]">
          <Film size={16} className="text-purple-400" />
          <span className="font-semibold text-white">FFmpeg Burn-in</span>
          <span className="text-[10px] text-neutral-500">Fast MP4 Video Export</span>
        </div>
      </footer>
    </div>
  );
}

export default UploadScreen;
