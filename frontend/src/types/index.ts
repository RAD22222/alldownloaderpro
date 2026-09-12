export interface MediaInfo {
  url: string;
  platform: Platform;
  mediaType: MediaType;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  author?: string;
  uploadDate?: string;
  availableFormats: DownloadFormat[];
}

export type Platform =
  | 'youtube'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'reddit'
  | 'pinterest'
  | 'twitter'
  | 'vimeo'
  | 'dailymotion'
  | 'unknown';

export type MediaType = 'video' | 'audio' | 'image' | 'unknown';

export interface DownloadFormat {
  id: string;
  label: string;
  format: 'mp4' | 'webm' | 'mp3' | 'm4a' | 'wav' | 'jpg' | 'png' | 'webp';
  quality: string;
  fileSize?: string;
  available: boolean;
}

export type JobStatus =
  | 'idle'
  | 'analyzing'
  | 'retrieving'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired';

export interface Job {
  id: string;
  url: string;
  status: JobStatus;
  progress: number;
  mediaInfo?: MediaInfo;
  error?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface PlatformConfig {
  name: string;
  icon: string;
  color: string;
  domains: string[];
}

export type ProcessingStep =
  | 'validating'
  | 'detecting'
  | 'analyzing'
  | 'retrieving'
  | 'preparing';
