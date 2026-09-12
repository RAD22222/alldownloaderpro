import { Platform, MediaType, PlatformConfig } from '@/types';

export const platforms: Record<Platform, PlatformConfig> = {
  youtube: {
    name: 'YouTube',
    icon: 'youtube',
    color: '#FF0000',
    domains: ['youtube.com', 'youtu.be'],
  },
  facebook: {
    name: 'Facebook',
    icon: 'facebook',
    color: '#1877F2',
    domains: ['facebook.com', 'fb.com', 'fb.watch'],
  },
  instagram: {
    name: 'Instagram',
    icon: 'instagram',
    color: '#E4405F',
    domains: ['instagram.com'],
  },
  tiktok: {
    name: 'TikTok',
    icon: 'music',
    color: '#000000',
    domains: ['tiktok.com'],
  },
  reddit: {
    name: 'Reddit',
    icon: 'reddit',
    color: '#FF4500',
    domains: ['reddit.com', 'redd.it', 'v.redd.it'],
  },
  pinterest: {
    name: 'Pinterest',
    icon: 'pin',
    color: '#BD081C',
    domains: ['pinterest.com', 'pin.it'],
  },
  twitter: {
    name: 'X (Twitter)',
    icon: 'twitter',
    color: '#000000',
    domains: ['twitter.com', 'x.com', 't.co'],
  },
  vimeo: {
    name: 'Vimeo',
    icon: 'vimeo',
    color: '#1AB7EA',
    domains: ['vimeo.com', 'player.vimeo.com'],
  },
  dailymotion: {
    name: 'Dailymotion',
    icon: 'play',
    color: '#0066DC',
    domains: ['dailymotion.com', 'dai.ly'],
  },
  unknown: {
    name: 'Unknown',
    icon: 'globe',
    color: '#64748B',
    domains: [],
  },
};

export function detectPlatform(url: string): Platform {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace('www.', '');

    for (const [platform, config] of Object.entries(platforms)) {
      if (platform === 'unknown') continue;
      if (config.domains.some((domain) => hostname.includes(domain))) {
        return platform as Platform;
      }
    }
  } catch {
    // Invalid URL
  }

  return 'unknown';
}

export function detectMediaType(url: string, platform: Platform): MediaType {
  const lowerUrl = url.toLowerCase();

  if (platform === 'youtube' || platform === 'vimeo' || platform === 'dailymotion') {
    return 'video';
  }

  if (lowerUrl.includes('/reels/') || lowerUrl.includes('/stories/') || lowerUrl.includes('/shorts/')) {
    return 'video';
  }

  if (lowerUrl.includes('/photos/') || lowerUrl.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    return 'image';
  }

  if (lowerUrl.includes('/status/') || lowerUrl.includes('/post/')) {
    return 'video';
  }

  return 'video';
}

export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url.trim()) {
    return { valid: false, error: 'Please enter a URL' };
  }

  try {
    const parsed = new URL(url);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL must start with http:// or https://' };
    }

    if (!parsed.hostname) {
      return { valid: false, error: 'Invalid URL format' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function getMediaTypeLabel(type: MediaType): string {
  const labels: Record<MediaType, string> = {
    video: 'Video',
    audio: 'Audio',
    image: 'Image',
    unknown: 'Media',
  };
  return labels[type];
}

export function getMediaTypeIcon(type: MediaType): string {
  const icons: Record<MediaType, string> = {
    video: 'video',
    audio: 'music',
    image: 'image',
    unknown: 'file',
  };
  return icons[type];
}
