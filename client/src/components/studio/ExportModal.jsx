import React, { useState } from 'react';
import { Download, Sparkles, CheckCircle2, Film, AlertCircle, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
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
  style = {},
  aspectRatio = '9:16',
}) => {
  const [loading, setLoading] = useState(false);
  const [exportedResult, setExportedResult] = useState(null);
  const [error, setError] = useState(null);

  const content = UI_CONTENT.exportModal;

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
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && !loading && handleResetAndClose()}
      isDismissable={!loading}
    >
      <Dialog className="p-6 bg-[#18181B] text-white rounded-2xl border border-[#27272A] shadow-2xl flex flex-col gap-4 max-w-[500px] w-full outline-none font-sans select-none">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="text-left">
            <h3 className="text-base font-bold text-white leading-tight">
              {exportedResult ? content.successTitle : content.title}
            </h3>
            <p className="text-xs text-[#A1A1AA] mt-1">
              {exportedResult ? content.successSubtitle : content.description}
            </p>
          </div>
          <Button
            variant="quiet"
            onPress={() => !loading && handleResetAndClose()}
            aria-label="Close modal"
            className="w-7 h-7 p-0 text-[#A1A1AA] hover:text-white"
          >
            <X size={16} />
          </Button>
        </div>

        {exportedResult ? (
          // Success & Download Screen
          <div className="space-y-4 text-center py-2 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>

            <div className="space-y-0.5">
              <h4 className="font-bold text-sm text-white">{content.successTitle}</h4>
              <p className="text-xs text-[#A1A1AA]">
                {(exportedResult.sizeBytes / 1024 / 1024).toFixed(2)} MB • MP4 (H.264 / AAC)
              </p>
            </div>

            {/* Video Preview */}
            <div className="rounded-xl overflow-hidden border border-[#27272A] bg-black aspect-video max-h-44 mx-auto">
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
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-colors"
              >
                <Download size={15} />
                <span>{content.downloadButton}</span>
              </a>

              <Button variant="quiet" onPress={handleResetAndClose}>
                {content.doneButton}
              </Button>
            </div>
          </div>
        ) : (
          // Pre-Export Review Screen
          <div className="space-y-4 text-left">
            <div className="p-3.5 bg-[#242428] border border-[#2B2B32]/60 rounded-xl space-y-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Film size={13} className="text-[#A1A1AA]" />
                <span>{content.summaryTitle}</span>
              </h4>

              <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                <div className="text-[#A1A1AA]">{content.aspectRatioLabel}:</div>
                <div className="font-semibold text-white">{aspectRatio}</div>

                <div className="text-[#A1A1AA]">{content.durationLabel}:</div>
                <div className="font-normal text-white">{formatSeconds(videoMetadata?.duration || 12)}</div>

                <div className="text-[#A1A1AA]">{content.captionsCountLabel}:</div>
                <div className="font-semibold text-white">{subtitles.length} cues</div>

                <div className="text-[#A1A1AA]">{content.activePresetLabel}:</div>
                <div className="font-semibold text-white capitalize">{style.presetId || 'Custom'}</div>
              </div>
            </div>

            {/* Loading with UI ProgressBar */}
            {loading && (
              <div className="p-4 bg-[#242428] border border-[#2B2B32]/60 rounded-xl flex flex-col gap-2">
                <ProgressBar
                  isIndeterminate
                  label={content.renderingMessage}
                  className="w-full max-w-none text-xs font-semibold text-white"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs text-red-400">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272A]">
              <Button variant="quiet" onPress={onClose} isDisabled={loading}>
                {content.cancelButton}
              </Button>
              <Button
                variant="primary"
                onPress={handleExport}
                isDisabled={loading}
                className="gap-1.5 shadow-md shadow-indigo-500/20"
              >
                <Download size={13} />
                <span>{content.startButton}</span>
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </Modal>
  );
};

export default ExportModal;
