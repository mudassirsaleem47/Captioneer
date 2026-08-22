import React, { useState } from 'react';
import { Download, Sparkles, CheckCircle2, Film, AlertCircle, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { exportVideo } from '../../api';
import { UI_CONTENT } from '../../config/uiContent';

function formatSeconds(secs) {
  if (isNaN(secs) || secs < 0) secs = 0;
  const mins = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  const ms = Math.floor((secs % 1) * 100);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(mins)}:${pad(s)}.${pad(ms)}`;
}

export const ExportModal = ({
  isOpen,
  onClose,
  videoMetadata,
  videoFile,
  subtitles,
  style,
  aspectRatio,
}) => {
  const [loading, setLoading] = useState(false);
  const [exportedResult, setExportedResult] = useState(null);
  const [error, setError] = useState(null);

  const content = UI_CONTENT.exportModal;

  if (!isOpen) return null;

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await exportVideo({
        videoId: videoMetadata?.videoId || videoMetadata?.filename,
        videoFile: videoFile || null,
        subtitles,
        style,
      });

      setExportedResult({
        downloadUrl: response.data.downloadUrl,
        streamUrl: response.data.streamUrl,
        sizeBytes: response.data.sizeBytes,
        filename: response.data.exportFilename,
      });
    } catch (err) {
      setError(err.message || 'Video export failed. Ensure the backend server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setExportedResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={() => !loading && handleResetAndClose()}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-[480px] bg-surface border border-border/80 rounded-2xl p-6 shadow-premium flex flex-col gap-4 z-10 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="text-left">
            <h3 className="text-base font-bold text-text-primary leading-tight">
              {exportedResult ? content.successTitle : content.title}
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              {exportedResult ? content.successSubtitle : content.description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => !loading && handleResetAndClose()}
            className="rounded-lg p-1 text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {exportedResult ? (
          // Success & Download Screen
          <div className="space-y-4 text-center py-2 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-success/10 border border-success/20 text-success mx-auto flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>

            <div className="space-y-0.5">
              <h4 className="font-bold text-sm text-text-primary">{content.successTitle}</h4>
              <p className="text-xs text-text-secondary">
                {(exportedResult.sizeBytes / 1024 / 1024).toFixed(2)} MB • MP4 (H.264 / AAC)
              </p>
            </div>

            {/* Video Preview */}
            <div className="rounded-xl overflow-hidden border border-border bg-black aspect-video max-h-44 mx-auto">
              <video
                src={exportedResult.streamUrl || exportedResult.downloadUrl}
                controls
                className="w-full h-full object-contain"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <a
                href={exportedResult.downloadUrl}
                download={exportedResult.filename}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[8px] bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-colors"
              >
                <Download size={15} />
                <span>{content.downloadButton}</span>
              </a>

              <Button variant="outline" size="md" onClick={handleResetAndClose}>
                {content.doneButton}
              </Button>
            </div>
          </div>
        ) : (
          // Pre-Export Review Screen
          <div className="space-y-4 text-left">
            <div className="p-3.5 bg-main border border-border rounded-xl space-y-2.5">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Film size={13} className="text-text-secondary" />
                <span>{content.summaryTitle}</span>
              </h4>

              <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                <div className="text-text-secondary">{content.aspectRatioLabel}:</div>
                <div className="font-semibold text-text-primary">{aspectRatio}</div>

                <div className="text-text-secondary">{content.durationLabel}:</div>
                <div className="font-mono text-text-primary">{formatSeconds(videoMetadata?.duration || 12)}</div>

                <div className="text-text-secondary">{content.captionsCountLabel}:</div>
                <div className="font-semibold text-text-primary">{subtitles.length} cues</div>

                <div className="text-text-secondary">{content.activePresetLabel}:</div>
                <div className="font-semibold text-text-primary capitalize">{style.presetId || 'Custom'}</div>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="p-4 bg-main border border-border rounded-xl flex flex-col items-center justify-center text-center space-y-1.5 animate-pulse">
                <Sparkles size={20} className="text-primary animate-spin" />
                <p className="text-sm font-bold text-text-primary">{content.renderingMessage}</p>
                <p className="text-xs text-text-secondary">{content.renderingSubtitle}</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-2 text-xs text-danger">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
                {content.cancelButton}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExport}
                disabled={loading}
              >
                <Download size={13} />
                <span>{content.startButton}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
