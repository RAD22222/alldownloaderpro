
import { X, Download, Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import styles from './DownloadProgress.module.css';

export type DownloadStatus = 'idle' | 'starting' | 'downloading' | 'merging' | 'complete' | 'error';

export interface DownloadProgressData {
  percent: number;
  totalSize: string;
  speed: string;
  eta: string;
}

export interface DownloadCompleteData {
  fileName: string;
  fileSize: string | null;
  fileToken: string;
}

export interface DownloadProgressProps {
  isOpen: boolean;
  title: string;
  formatLabel: string;
  status: DownloadStatus;
  progress: DownloadProgressData;
  complete: DownloadCompleteData | null;
  error: string | null;
  statusMessage: string;
  onClose: () => void;
  onRetry?: () => void;
}

const API_BASE = 'http://localhost:8000';

export function DownloadProgress({
  isOpen,
  title,
  formatLabel,
  status,
  progress,
  complete,
  error: _error,
  statusMessage,
  onClose,
  onRetry,
}: DownloadProgressProps) {
  if (!isOpen) return null;

  const isComplete = status === 'complete';
  const isError = status === 'error';
  const isDownloading = status === 'downloading' || status === 'merging';

  function handleDownload() {
    if (!complete?.fileToken) return;
    const a = document.createElement('a');
    a.href = `${API_BASE}/api/file/${complete.fileToken}?filename=${encodeURIComponent(complete.fileName)}`;
    a.download = complete.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={cn(
              styles.headerIcon,
              isComplete && styles['headerIcon--success'],
              isError && styles['headerIcon--error']
            )}>
              {isComplete ? <Check size={20} /> : isError ? <AlertCircle size={20} /> : <Loader2 size={20} className={styles.spinner} />}
            </div>
            <div>
              <div className={styles.headerTitle}>
                {isComplete ? 'Download Ready' : isError ? 'Download Failed' : 'Downloading'}
              </div>
              <div className={styles.headerSubtitle}>{title}</div>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {(isDownloading || status === 'starting') && (
            <>
              <div className={styles.progressContainer}>
                <div className={styles.progressHeader}>
                  <span className={styles.progressPercent}>{Math.round(progress.percent)}%</span>
                  <span className={styles.progressLabel}>{formatLabel}</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={cn(styles.progressFill, isComplete && styles['progressFill--complete'])}
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              </div>

              <div className={styles.stats}>
                <div className={styles.stat}>
                  <div className={styles.statValue}>{progress.speed || '—'}</div>
                  <div className={styles.statLabel}>Speed</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statValue}>{progress.eta || '—'}</div>
                  <div className={styles.statLabel}>ETA</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statValue}>{progress.totalSize || '—'}</div>
                  <div className={styles.statLabel}>Size</div>
                </div>
              </div>
            </>
          )}

          {statusMessage && (
            <div className={cn(
              styles.statusMessage,
              isComplete ? styles['statusMessage--success'] :
              isError ? styles['statusMessage--error'] :
              styles['statusMessage--info']
            )}>
              {isComplete ? <Check size={16} /> : isError ? <AlertCircle size={16} /> : <Loader2 size={16} className={styles.spinner} />}
              {statusMessage}
            </div>
          )}

          {complete?.fileName && (
            <div className={styles.fileName}>
              {complete.fileName}
              {complete.fileSize && ` — ${complete.fileSize}`}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {isComplete && (
            <button className={styles.downloadButton} onClick={handleDownload}>
              <Download size={18} />
              Save File
            </button>
          )}
          {isError && onRetry && (
            <button className={styles.downloadButton} onClick={onRetry}>
              <Loader2 size={18} />
              Retry
            </button>
          )}
          <button className={styles.cancelButton} onClick={onClose}>
            {isComplete || isError ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
