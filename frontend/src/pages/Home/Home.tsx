import { useState, useCallback } from 'react';
import { Zap, Shield, Globe } from 'lucide-react';
import { MediaInfo, ProcessingStep } from '@/types';
import { UrlInput } from '@/components/UrlInput';
import { MediaPreview } from '@/components/MediaPreview';
import { FormatSelector } from '@/components/FormatSelector';
import { ProcessingIndicator } from '@/components/ProcessingIndicator';
import { ErrorAlert } from '@/components/ErrorAlert';
import { DownloadProgress } from '@/components/DownloadProgress';
import { useAnalyze, useDownloadStream } from '@/hooks/useApi';
import styles from './Home.module.css';

const processingSteps = [
  { id: 'validating' as ProcessingStep, label: 'Validating URL', description: 'Checking URL format' },
  { id: 'detecting' as ProcessingStep, label: 'Detecting platform', description: 'Identifying the source' },
  { id: 'analyzing' as ProcessingStep, label: 'Analyzing media', description: 'Extracting information' },
  { id: 'retrieving' as ProcessingStep, label: 'Retrieving details', description: 'Getting available formats' },
  { id: 'preparing' as ProcessingStep, label: 'Preparing download', description: 'Setting up options' },
];

export function Home() {
  const [currentStep, setCurrentStep] = useState<ProcessingStep>('validating');
  const [progress, setProgress] = useState(0);
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [selectedFormatId, setSelectedFormatId] = useState<string | null>(null);

  const { analyze, isLoading: isAnalyzing, error: analyzeError, reset: resetAnalysis } = useAnalyze();
  const {
    startDownload,
    cancelDownload,
    status: downloadStatus,
    progress: downloadProgress,
    complete: downloadComplete,
    error: downloadError,
    statusMessage: downloadStatusMessage,
    isOpen: isDownloadOpen,
  } = useDownloadStream();

  const simulateProgress = useCallback(async () => {
    const steps: ProcessingStep[] = ['validating', 'detecting', 'analyzing', 'retrieving', 'preparing'];

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i]);
      setProgress((i + 1) * 20);
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  }, []);

  const handleSubmit = useCallback(async (url: string) => {
    const progressPromise = simulateProgress();
    const result = await analyze(url);
    await progressPromise;

    if (result) {
      setMediaInfo(result);
      setSelectedFormatId(result.availableFormats[0]?.id || null);
      setProgress(100);
    }
  }, [analyze, simulateProgress]);

  const handleDownload = useCallback(() => {
    if (!mediaInfo || !selectedFormatId) return;
    startDownload(mediaInfo.url, selectedFormatId, mediaInfo.title);
  }, [mediaInfo, selectedFormatId, startDownload]);

  const handleRetryDownload = useCallback(() => {
    if (!mediaInfo || !selectedFormatId) return;
    startDownload(mediaInfo.url, selectedFormatId, mediaInfo.title);
  }, [mediaInfo, selectedFormatId, startDownload]);

  const handleDownloadThumbnail = useCallback(() => {
    if (mediaInfo?.thumbnail) {
      const link = document.createElement('a');
      link.href = mediaInfo.thumbnail;
      link.download = `${mediaInfo.title.replace(/[^a-z0-9]/gi, '_')}_thumbnail.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [mediaInfo]);

  const handleRetry = useCallback(() => {
    resetAnalysis();
    setMediaInfo(null);
    setSelectedFormatId(null);
    setProgress(0);
  }, [resetAnalysis]);

  const error = analyzeError;

  const selectedFormat = mediaInfo?.availableFormats.find(f => f.id === selectedFormatId);
  const formatLabel = selectedFormat
    ? `${selectedFormat.label} • ${selectedFormat.format.toUpperCase()} • ${selectedFormat.quality}`
    : '';

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          <span className={styles.heroHighlight}>Paste.</span> Analyze. <span className={styles.heroHighlight}>Download.</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Retrieve media from YouTube, Instagram, TikTok, and more.
          Just paste a URL and we&apos;ll handle the rest.
        </p>
      </section>

      <section className={styles.inputSection}>
        <UrlInput
          onSubmit={handleSubmit}
          isLoading={isAnalyzing}
          error={error || undefined}
        />
      </section>

      {isAnalyzing && (
        <section className={styles.processingSection}>
          <div className={styles.processingCard}>
            <ProcessingIndicator
              steps={processingSteps}
              currentStep={currentStep}
              progress={progress}
            />
          </div>
        </section>
      )}

      {error && !isAnalyzing && (
        <section className={styles.errorSection}>
          <ErrorAlert
            variant="error"
            title="Analysis Failed"
            message={error}
            onRetry={handleRetry}
          />
        </section>
      )}

      {mediaInfo && !isAnalyzing && (
        <>
          <section className={styles.resultsSection}>
            <MediaPreview
              media={mediaInfo}
              onDownload={handleDownload}
              onDownloadThumbnail={handleDownloadThumbnail}
              selectedFormatId={selectedFormatId}
            />
          </section>

          <section className={styles.formatSection}>
            <FormatSelector
              formats={mediaInfo.availableFormats}
              selectedFormatId={selectedFormatId}
              mediaType={mediaInfo.mediaType}
              onChange={setSelectedFormatId}
            />
          </section>
        </>
      )}

      {!mediaInfo && !isAnalyzing && !error && (
        <section className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <Globe size={24} />
            </div>
            <h3 className={styles.featureTitle}>Universal Support</h3>
            <p className={styles.featureDescription}>
              Works with YouTube, Instagram, TikTok, Facebook, Reddit, and many more platforms.
            </p>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <Zap size={24} />
            </div>
            <h3 className={styles.featureTitle}>Fast Analysis</h3>
            <p className={styles.featureDescription}>
              Quickly analyzes URLs and provides available download options in seconds.
            </p>
          </div>

          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <Shield size={24} />
            </div>
            <h3 className={styles.featureTitle}>Secure & Private</h3>
            <p className={styles.featureDescription}>
              Only retrieves media you own or have permission to download.
            </p>
          </div>
        </section>
      )}

      <DownloadProgress
        isOpen={isDownloadOpen}
        title={mediaInfo?.title || ''}
        formatLabel={formatLabel}
        status={downloadStatus}
        progress={downloadProgress}
        complete={downloadComplete}
        error={downloadError}
        statusMessage={downloadStatusMessage}
        onClose={cancelDownload}
        onRetry={handleRetryDownload}
      />
    </div>
  );
}
