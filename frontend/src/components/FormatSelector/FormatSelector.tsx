import React from 'react';
import { Video, Music, Image, File } from 'lucide-react';
import { DownloadFormat, MediaType } from '@/types';
import { cn } from '@/utils/cn';
import styles from './FormatSelector.module.css';

export interface FormatSelectorProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  formats: DownloadFormat[];
  selectedFormatId: string | null;
  mediaType: MediaType;
  onChange: (formatId: string) => void;
  label?: string;
}

const mediaTypeIcons: Record<MediaType, React.ElementType> = {
  video: Video,
  audio: Music,
  image: Image,
  unknown: File,
};

export const FormatSelector = React.forwardRef<HTMLDivElement, FormatSelectorProps>(
  (
    {
      formats,
      selectedFormatId,
      mediaType,
      onChange,
      label = 'Select format',
      className,
      ...props
    },
    ref
  ) => {
    const MediaIcon = mediaTypeIcons[mediaType];

    return (
      <div ref={ref} className={cn(styles.container, className)} {...props}>
        <label className={styles.label}>{label}</label>

        <div className={styles.options} role="radiogroup" aria-label={label}>
          {formats.map((format) => (
            <div
              key={format.id}
              className={cn(
                styles.option,
                selectedFormatId === format.id && styles['option--selected'],
                !format.available && styles['option--disabled']
              )}
              onClick={() => format.available && onChange(format.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  format.available && onChange(format.id);
                }
              }}
              role="radio"
              aria-checked={selectedFormatId === format.id}
              aria-disabled={!format.available}
              tabIndex={format.available ? 0 : -1}
            >
              <div className={styles.radio}>
                <div className={styles.radioInner} />
              </div>

              <div className={styles.optionIcon}>
                <MediaIcon size={16} />
              </div>

              <div className={styles.optionContent}>
                <div className={styles.optionLabel}>{format.label}</div>
                <div className={styles.optionDescription}>
                  {format.format.toUpperCase()} • {format.quality}
                </div>
              </div>

              <div className={styles.optionMeta}>
                {format.fileSize && (
                  <span className={styles.fileSize}>{format.fileSize}</span>
                )}
                {!format.available && (
                  <span className={styles.unavailableBadge}>Unavailable</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

FormatSelector.displayName = 'FormatSelector';
