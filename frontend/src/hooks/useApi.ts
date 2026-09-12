import { useState, useCallback, useRef } from 'react';
import { MediaInfo, Platform, MediaType } from '@/types';
import { DownloadStatus, DownloadProgressData, DownloadCompleteData } from '@/components/DownloadProgress';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface AnalyzeResponseData {
  url: string;
  platform: Platform;
  media_type: MediaType;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  duration_string?: string;
  author?: string;
  upload_date?: string;
  view_count?: number;
  available_formats: Array<{
    id: string;
    label: string;
    format: string;
    quality: string;
    file_size?: string;
    available: boolean;
  }>;
}

function mapApiMediaInfo(apiData: AnalyzeResponseData): MediaInfo {
  return {
    url: apiData.url,
    platform: apiData.platform,
    mediaType: apiData.media_type,
    title: apiData.title,
    description: apiData.description,
    thumbnail: apiData.thumbnail,
    duration: apiData.duration,
    author: apiData.author,
    uploadDate: apiData.upload_date,
    availableFormats: apiData.available_formats.map(f => ({
      id: f.id,
      label: f.label,
      format: f.format as 'mp4' | 'webm' | 'mp3' | 'm4a' | 'wav' | 'jpg' | 'png' | 'webp',
      quality: f.quality,
      fileSize: f.file_size,
      available: f.available,
    })),
  };
}

export interface UseAnalyzeReturn {
  analyze: (url: string) => Promise<MediaInfo | null>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useAnalyze(): UseAnalyzeReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (url: string): Promise<MediaInfo | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      const result: ApiResponse<AnalyzeResponseData> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Analysis failed');
      }

      return mapApiMediaInfo(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return { analyze, isLoading, error, reset };
}

export interface UseDownloadStreamReturn {
  startDownload: (url: string, formatId: string, title: string) => void;
  cancelDownload: () => void;
  status: DownloadStatus;
  progress: DownloadProgressData;
  complete: DownloadCompleteData | null;
  error: string | null;
  statusMessage: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function useDownloadStream(): UseDownloadStreamReturn {
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [progress, setProgress] = useState<DownloadProgressData>({
    percent: 0,
    totalSize: '',
    speed: '',
    eta: '',
  });
  const [complete, setComplete] = useState<DownloadCompleteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const startDownload = useCallback(async (url: string, formatId: string, title: string) => {
    cleanup();
    setIsOpen(true);
    setStatus('starting');
    setProgress({ percent: 0, totalSize: '', speed: '', eta: '' });
    setComplete(null);
    setError(null);
    setStatusMessage('Preparing download...');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const params = new URLSearchParams({ url, format_id: formatId, title });
      const response = await fetch(`${API_BASE_URL}/api/download-stream?${params}`, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        let eventType = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);
              handleSSEEvent(eventType, data);
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled
        return;
      }
      const message = err instanceof Error ? err.message : 'Download failed';
      setStatus('error');
      setError(message);
      setStatusMessage(message);
    }
  }, [cleanup]);

  function handleSSEEvent(event: string, data: Record<string, unknown>) {
    switch (event) {
      case 'start':
        setStatus('downloading');
        setStatusMessage((data.message as string) || 'Starting download...');
        break;

      case 'downloading':
        setStatus('downloading');
        setStatusMessage(`Downloading: ${(data.destination as string) || 'video'}`);
        break;

      case 'progress':
        setStatus('downloading');
        setProgress({
          percent: (data.percent as number) || 0,
          totalSize: (data.totalSize as string) || '',
          speed: (data.speed as string) || '',
          eta: (data.eta as string) || '',
        });
        setStatusMessage(`Downloading at ${(data.speed as string) || '...'}`);
        break;

      case 'merging':
        setStatus('merging');
        setProgress(prev => ({ ...prev, percent: 100, speed: '', eta: '' }));
        setStatusMessage((data.message as string) || 'Merging video and audio...');
        break;

      case 'complete':
        setStatus('complete');
        setProgress(prev => ({ ...prev, percent: 100, speed: '', eta: '' }));
        setComplete({
          fileName: data.fileName as string,
          fileSize: data.fileSize as string | null,
          fileToken: data.fileToken as string,
        });
        setStatusMessage('Download ready! Click "Save File" to download.');
        break;

      case 'error':
        setStatus('error');
        setError((data.message as string) || 'Download failed');
        setStatusMessage((data.message as string) || 'Download failed');
        break;
    }
  }

  const cancelDownload = useCallback(() => {
    cleanup();
    setIsOpen(false);
    setStatus('idle');
    setProgress({ percent: 0, totalSize: '', speed: '', eta: '' });
    setComplete(null);
    setError(null);
    setStatusMessage('');
  }, [cleanup]);

  return {
    startDownload,
    cancelDownload,
    status,
    progress,
    complete,
    error,
    statusMessage,
    isOpen,
    setIsOpen,
  };
}
