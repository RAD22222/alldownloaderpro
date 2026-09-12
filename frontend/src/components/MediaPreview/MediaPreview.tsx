import React from 'react';
import { Download, Image, Clock, User, Calendar } from 'lucide-react';
import { MediaInfo } from '@/types';
import { formatDuration } from '@/utils/platforms';
import { PlatformBadge } from '@/components/PlatformBadge';
import { cn } from '@/utils/cn';
import styles from './MediaPreview.module.css';

export interface MediaPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  media: MediaInfo;
  onDownload?: (formatId: string) => void;
  onDownloadThumbnail?: () => void;
  selectedFormatId?: string | null;
}

export const MediaPreview = React.forwardRef<HTMLDivElement, MediaPreviewProps>(
  (
    {
      media,
      onDownload,
      onDownloadThumbnail,
      selectedFormatId,
      className,
      ...props
    },
    ref
  ) => {
    const selectedFormat = media.availableFormats.find(
      (f) => f.id === selectedFormatId
    );

    return (
      <div ref={ref} className={cn(styles.card, className)} {...props}>
        <div className={styles.content}>
          <div className={styles.thumbnailSection}>
            <div className={styles.thumbnail}>
              {media.thumbnail ? (
                <img
                  src={media.thumbnail}
                  alt={media.title}
                  className={styles.thumbnailImage}
                  loading="lazy"
                />
              ) : (
                <div className={styles.thumbnailPlaceholder}>
                  <Image size={48} />
                </div>
              )}

              {media.duration && (
                <span className={styles.durationBadge}>
                  {formatDuration(media.duration)}
                </span>
              )}
            </div>
          </div>

          <div className={styles.infoSection}>
            <div className={styles.header}>
              <div className={styles.headerContent}>
                <h2 className={styles.title}>{media.title}</h2>

                <div className={styles.meta}>
                  <PlatformBadge platform={media.platform} size="sm" />

                  <span className={styles.metaSeparator} />

                  <span className={styles.metaItem}>
                    <Clock size={14} />
                    {media.duration
                      ? formatDuration(media.duration)
                      : 'Unknown duration'}
                  </span>

                  {media.author && (
                    <>
                      <span className={styles.metaSeparator} />
                      <span className={styles.metaItem}>
                        <User size={14} />
                        {media.author}
                      </span>
                    </>
                  )}

                  {media.uploadDate && (
                    <>
                      <span className={styles.metaSeparator} />
                      <span className={styles.metaItem}>
                        <Calendar size={14} />
                        {media.uploadDate}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {media.description && (
              <p className={styles.description}>{media.description}</p>
            )}

            <div className={styles.actions}>
              {onDownload && (
                <button
                  type="button"
                  className={styles.downloadButton}
                  onClick={() => selectedFormatId && onDownload(selectedFormatId)}
                  disabled={!selectedFormatId || !selectedFormat?.available}
                >
                  <Download size={18} />
                  Download
                  {selectedFormat && ` (${selectedFormat.format.toUpperCase()})`}
                </button>
              )}

              {onDownloadThumbnail && (
                <button
                  type="button"
                  className={styles.thumbnailButton}
                  onClick={onDownloadThumbnail}
                >
                  <Image size={18} />
                  Thumbnail
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

MediaPreview.displayName = 'MediaPreview';
