import React, { useState, useCallback } from 'react';
import { Search, X, Loader2, Globe } from 'lucide-react';
import { Platform } from '@/types';
import { detectPlatform, validateUrl, platforms } from '@/utils/platforms';
import { cn } from '@/utils/cn';
import styles from './UrlInput.module.css';

export interface UrlInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  error?: string;
}

export const UrlInput = React.forwardRef<HTMLDivElement, UrlInputProps>(
  ({ onSubmit, isLoading = false, disabled = false, error, className, ...props }, ref) => {
    const [url, setUrl] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [detectedPlatform, setDetectedPlatform] = useState<Platform | null>(null);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setUrl(value);

      if (value.trim()) {
        const platform = detectPlatform(value);
        setDetectedPlatform(platform !== 'unknown' ? platform : null);
      } else {
        setDetectedPlatform(null);
      }
    }, []);

    const handleClear = useCallback(() => {
      setUrl('');
      setDetectedPlatform(null);
    }, []);

    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        e.preventDefault();

        if (!url.trim() || isLoading || disabled) return;

        const validation = validateUrl(url);
        if (!validation.valid) return;

        onSubmit(url);
      },
      [url, isLoading, disabled, onSubmit]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          handleSubmit(e);
        }
      },
      [handleSubmit]
    );

    const validation = url.trim() ? validateUrl(url) : { valid: true };
    const canSubmit = url.trim() && validation.valid && !isLoading && !disabled;

    return (
      <div ref={ref} className={cn(styles.container, className)} {...props}>
        <form onSubmit={handleSubmit}>
          <div
            className={cn(
              styles.inputWrapper,
              isFocused && styles['inputWrapper--focused'],
              error && styles['inputWrapper--error'],
              isLoading && styles['inputWrapper--loading']
            )}
          >
            <div
              className={cn(
                styles.platformIndicator,
                detectedPlatform && styles['platformIndicator--detected']
              )}
            >
              {detectedPlatform ? (
                <span>{platforms[detectedPlatform].name.charAt(0)}</span>
              ) : (
                <Globe size={20} />
              )}
            </div>

            <input
              type="text"
              className={styles.input}
              value={url}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="Paste your media URL here..."
              disabled={isLoading || disabled}
              aria-label="Media URL"
              aria-invalid={!!error}
              aria-describedby={error ? 'url-error' : undefined}
              autoComplete="url"
              spellCheck={false}
            />

            <div className={styles.actions}>
              {url && !isLoading && (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={handleClear}
                  aria-label="Clear URL"
                >
                  <X size={18} />
                </button>
              )}

              <button
                type="submit"
                className={cn(
                  styles.submitButton,
                  isLoading && styles['submitButton--loading']
                )}
                disabled={!canSubmit}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className={styles.spinner} />
                    Analyzing
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    Analyze
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {(error || (url.trim() && !validation.valid)) && (
          <div
            id="url-error"
            className={cn(styles.hint, styles.errorHint)}
            role="alert"
          >
            {error || validation.error}
          </div>
        )}

        {!error && !url.trim() && (
          <div className={styles.hint}>
            Supports YouTube, Instagram, TikTok, Facebook, Reddit, and more
          </div>
        )}

        <div className={styles.platforms}>
          <span className={styles.platformsLabel}>Supported:</span>
          <div className={styles.platformIcons}>
            {Object.entries(platforms)
              .filter(([key]) => key !== 'unknown')
              .slice(0, 8)
              .map(([key, config]) => (
                <span
                  key={key}
                  className={styles.platformIcon}
                  title={config.name}
                >
                  {config.name.charAt(0)}
                </span>
              ))}
          </div>
        </div>
      </div>
    );
  }
);

UrlInput.displayName = 'UrlInput';
