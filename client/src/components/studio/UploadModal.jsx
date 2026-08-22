import React, { useState, useRef } from 'react';
import { Upload, FileVideo, Sparkles, AlertCircle, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select, SelectItem } from '../ui/Select';
import { TextField } from '../ui/TextField';
import { uploadAndTranscribe } from '../../api';
import { UI_CONTENT } from '../../config/uiContent';

export const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [language, setLanguage] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState(null);

  const content = UI_CONTENT.uploadModal;
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

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
      setError('Please select a video file to upload.');
      return;
    }

    setLoading(true);
    setError(null);
    setStatusMessage(content.uploadingMessage);

    try {
      // 1. Create a local preview object URL for immediate browser playback
      const localBlobUrl = URL.createObjectURL(selectedFile);

      // 2. Call backend Groq transcription endpoint
      setStatusMessage(content.transcribingMessage);
      const response = await uploadAndTranscribe(selectedFile, {
        language: language || undefined,
        prompt: prompt || undefined,
      });

      const videoData = response.data.video;
      const transcription = response.data.transcription;

      setStatusMessage(content.completeMessage);

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
        onClose();
      }, 400);
    } catch (err) {
      setError(err.message || 'Failed to transcribe video.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={() => !loading && onClose()}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-[480px] bg-surface border border-border/80 rounded-2xl p-6 shadow-premium flex flex-col gap-4 z-10 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="text-left">
            <h3 className="text-base font-bold text-text-primary leading-tight">{content.title}</h3>
            <p className="text-xs text-text-secondary mt-1">{content.description}</p>
          </div>
          <button
            type="button"
            onClick={() => !loading && onClose()}
            className="rounded-lg p-1 text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border hover:border-primary/60 bg-main/50 hover:bg-main rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex flex-col items-center space-y-1.5">
              <div className="w-10 h-10 rounded-lg bg-surface-hover flex items-center justify-center text-text-primary">
                <FileVideo size={20} />
              </div>
              <span className="text-sm font-semibold text-text-primary">{selectedFile.name}</span>
              <span className="text-xs font-mono text-text-secondary">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-1.5">
              <div className="w-10 h-10 rounded-lg bg-surface-hover flex items-center justify-center text-text-secondary group-hover:text-primary transition-colors">
                <Upload size={20} />
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {content.dropzoneTitle}
              </p>
              <p className="text-xs text-text-secondary">
                {content.dropzoneSubtitle} • {content.supportedFormatsHint}
              </p>
            </div>
          )}
        </div>

        {/* Form Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          {/* Custom Select Dropdown for Language */}
          <Select
            label={content.languageLabel}
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
            label={content.promptLabel}
            placeholder={content.promptPlaceholder}
            value={prompt}
            onChange={setPrompt}
          />
        </div>

        {/* Loading message */}
        {loading && (
          <div className="p-3 bg-main border border-border rounded-[8px] flex items-center gap-2 text-xs text-text-primary animate-pulse">
            <Sparkles size={14} className="animate-spin text-primary shrink-0" />
            <span className="font-medium">{statusMessage}</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-danger/10 border border-danger/20 rounded-[8px] flex items-center gap-2 text-xs text-danger">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {content.cancelButton}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={loading || !selectedFile}
          >
            <Sparkles size={13} />
            <span>{content.submitButton}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
