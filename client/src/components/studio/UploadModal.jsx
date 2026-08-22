import React, { useState, useRef } from 'react';
import { Upload, FileVideo, Sparkles, AlertCircle, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
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
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && !loading && onClose()}
      isDismissable={!loading}
    >
      <Dialog className="p-6 bg-[#18181B] text-white rounded-2xl border border-[#27272A] shadow-2xl flex flex-col gap-4 w-full outline-none select-none">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="text-left">
            <h3 className="text-base font-bold text-white leading-tight">{content.title}</h3>
            <p className="text-xs text-[#A1A1AA] mt-1">{content.description}</p>
          </div>
          <Button
            variant="quiet"
            onPress={() => !loading && onClose()}
            aria-label="Close modal"
            className="w-7 h-7 p-0 text-[#A1A1AA] hover:text-white"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#3F3F46] hover:border-indigo-500/80 bg-[#242428]/60 hover:bg-[#242428] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center group"
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
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <FileVideo size={20} />
              </div>
              <span className="text-sm font-semibold text-white">{selectedFile.name}</span>
              <span className="text-xs font-mono text-[#A1A1AA]">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-1.5">
              <div className="w-10 h-10 rounded-lg bg-[#242428] flex items-center justify-center text-[#A1A1AA] group-hover:text-indigo-400 transition-colors">
                <Upload size={20} />
              </div>
              <p className="text-sm font-semibold text-white">
                {content.dropzoneTitle}
              </p>
              <p className="text-xs text-[#A1A1AA]">
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

        {/* Loading message with UI ProgressBar */}
        {loading && (
          <div className="p-3.5 bg-[#242428] border border-[#3F3F46] rounded-xl flex flex-col gap-2">
            <ProgressBar
              isIndeterminate
              label={statusMessage}
              className="w-full max-w-none text-xs font-semibold text-white"
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-xs text-red-400">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272A]">
          <Button
            variant="quiet"
            onPress={onClose}
            isDisabled={loading}
          >
            {content.cancelButton}
          </Button>
          <Button
            variant="primary"
            onPress={handleSubmit}
            isDisabled={loading || !selectedFile}
            className="gap-1.5 shadow-md shadow-indigo-500/20"
          >
            <Sparkles size={13} />
            <span>{content.submitButton}</span>
          </Button>
        </div>
      </Dialog>
    </Modal>
  );
};

export default UploadModal;
