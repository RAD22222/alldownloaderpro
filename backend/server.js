import express from 'express';
import cors from 'cors';
import { spawn, execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';

const execFileAsync = promisify(execFile);
const app = express();
const PORT = 8000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Use Python module — works with system python3 (Render/Docker) or py (Windows)
const YT_DLP_CMD = process.platform === 'win32' ? 'py' : 'python3';
const YT_DLP_ARGS = ['-m', 'yt_dlp'];
const TEMP_DIR = path.join(__dirname, 'temp-downloads');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Clean up old files every 10 minutes
setInterval(() => {
  try {
    const files = fs.readdirSync(TEMP_DIR);
    const now = Date.now();
    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      const stat = fs.statSync(filePath);
      // Delete files older than 15 minutes
      if (now - stat.mtimeMs > 15 * 60 * 1000) {
        try { fs.unlinkSync(filePath); } catch {}
      }
    }
  } catch {}
}, 10 * 60 * 1000);

const COOKIES_DIR = path.join(__dirname, 'cookies');
if (!fs.existsSync(COOKIES_DIR)) {
  fs.mkdirSync(COOKIES_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());

// Store/Get YouTube cookies (Netscape format)
app.post('/api/cookies', (req, res) => {
  const { cookies } = req.body;
  if (!cookies) {
    return res.json({ success: false, error: 'Cookies are required' });
  }
  fs.writeFileSync(path.join(COOKIES_DIR, 'youtube.txt'), cookies, 'utf-8');
  res.json({ success: true });
});

app.get('/api/cookies', (req, res) => {
  const cookieFile = path.join(COOKIES_DIR, 'youtube.txt');
  if (fs.existsSync(cookieFile)) {
    res.json({ success: true, hasCookies: true });
  } else {
    res.json({ success: true, hasCookies: false });
  }
});

const PLATFORMS = {
  'youtube.com': 'youtube', 'youtu.be': 'youtube',
  'facebook.com': 'facebook', 'fb.com': 'facebook', 'fb.watch': 'facebook',
  'instagram.com': 'instagram',
  'tiktok.com': 'tiktok',
  'reddit.com': 'reddit', 'redd.it': 'reddit', 'v.redd.it': 'reddit',
  'pinterest.com': 'pinterest', 'pin.it': 'pinterest',
  'twitter.com': 'twitter', 'x.com': 'twitter',
  'vimeo.com': 'vimeo',
  'dailymotion.com': 'dailymotion', 'dai.ly': 'dailymotion',
};

function detectPlatform(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    for (const [domain, platform] of Object.entries(PLATFORMS)) {
      if (hostname.includes(domain)) return platform;
    }
  } catch {}
  return 'unknown';
}

function formatDuration(seconds) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return null;
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(1)} ${units[i]}`;
}

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_').slice(0, 100);
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', app: 'Universal Media Downloader', version: '1.0.0' });
});

// Analyze URL
app.post('/api/analyze', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.json({ success: false, error: 'URL is required' });
  }

  try { new URL(url); } catch {
    return res.json({ success: false, error: 'Invalid URL format' });
  }

  const platform = detectPlatform(url);

  // YouTube-specific flags to bypass bot detection
  const youtubeFlags = platform === 'youtube' ? [
    '--extractor-args', 'youtube:player_client=mweb,tv,web_creator',
    '--user-agent', 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
    '--no-check-certificates',
    '--encoding', 'utf-8',
  ] : [];

  // Add cookies for YouTube if available
  const cookieFile = path.join(COOKIES_DIR, 'youtube.txt');
  if (platform === 'youtube' && fs.existsSync(cookieFile)) {
    youtubeFlags.push('--cookies', cookieFile);
  }

  try {
    const { stdout } = await execFileAsync(YT_DLP_CMD, [
      ...YT_DLP_ARGS,
      ...youtubeFlags,
      '--dump-json', '--no-download', '--no-warnings', '--no-playlist', url,
    ], { timeout: 60000 });

    const info = JSON.parse(stdout);

    // Build formats from available format list
    const formats = [];
    const seenQualities = new Set();

    if (info.formats) {
      for (const fmt of info.formats) {
        if (fmt.vcodec !== 'none' && fmt.height) {
          const quality = `${fmt.height}p`;
          if (!seenQualities.has(quality)) {
            seenQualities.add(quality);
            // Find the best format for this quality to get filesize
            const matchingFormats = info.formats.filter(
              f => f.height === fmt.height && f.vcodec !== 'none'
            );
            const bestFormat = matchingFormats.reduce((best, f) =>
              (f.filesize || 0) > (best.filesize || 0) ? f : best
            );

            formats.push({
              id: `mp4-${fmt.height}`,
              label: fmt.height >= 1080 ? 'Full HD' : fmt.height >= 720 ? 'HD' : 'Standard',
              format: 'mp4',
              quality,
              file_size: formatFileSize(bestFormat.filesize || bestFormat.filesize_approx),
              available: true,
            });
          }
        }
      }
    }

    // Sort by quality descending
    formats.sort((a, b) => parseInt(b.quality) - parseInt(a.quality));

    // Add audio-only option
    formats.push({
      id: 'mp3',
      label: 'Audio Only',
      format: 'mp3',
      quality: '192kbps',
      file_size: null,
      available: true,
    });

    const limitedFormats = formats.slice(0, 10);

    let mediaType = 'video';
    if (info._type === 'audio') mediaType = 'audio';
    else if (info._type === 'photo') mediaType = 'image';

    res.json({
      success: true,
      data: {
        url,
        platform,
        media_type: mediaType,
        title: info.title || 'Unknown Title',
        description: info.description || null,
        thumbnail: info.thumbnail || info.thumbnails?.[info.thumbnails.length - 1]?.url || null,
        duration: info.duration || null,
        duration_string: formatDuration(info.duration),
        author: info.uploader || info.channel || null,
        upload_date: info.upload_date || null,
        view_count: info.view_count || null,
        available_formats: limitedFormats,
      },
    });
  } catch (err) {
    const message = err.stderr || err.message || 'Analysis failed';
    if (message.includes('Unsupported URL')) {
      return res.json({ success: false, error: 'This URL is not supported' });
    }
    if (message.includes('Video unavailable')) {
      return res.json({ success: false, error: 'This video is unavailable or private' });
    }
    res.json({ success: false, error: `Analysis failed: ${message.slice(0, 200)}` });
  }
});

// Streaming download with progress via SSE
app.get('/api/download-stream', (req, res) => {
  const { url, format_id, title } = req.query;

  if (!url || !format_id) {
    return res.status(400).json({ error: 'url and format_id are required' });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  function sendEvent(event, data) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  const outputId = crypto.randomBytes(8).toString('hex');
  const isMp3 = format_id === 'mp3';
  const ext = isMp3 ? 'mp3' : 'mp4';
  const safeTitle = sanitizeFilename(title || 'download');
  const outputFile = path.join(TEMP_DIR, `${outputId}.${ext}`);

  // YouTube-specific flags to bypass bot detection
  const platform2 = detectPlatform(url);
  const youtubeDownloadFlags = platform2 === 'youtube' ? [
    '--extractor-args', 'youtube:player_client=mweb,tv,web_creator',
    '--user-agent', 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
    '--no-check-certificates',
  ] : [];

  // Add cookies for YouTube if available
  const dlCookieFile = path.join(COOKIES_DIR, 'youtube.txt');
  if (platform2 === 'youtube' && fs.existsSync(dlCookieFile)) {
    youtubeDownloadFlags.push('--cookies', dlCookieFile);
  }

  let args;

  if (isMp3) {
    args = [
      '-f', 'bestaudio/best',
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '192K',
      '-o', outputFile,
      '--no-warnings',
      '--no-playlist',
      '--newline',
      url,
    ];
  } else {
    const height = format_id.replace('mp4-', '');
    args = [
      '-f', `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${height}]/best`,
      '--merge-output-format', 'mp4',
      '-o', outputFile,
      '--no-warnings',
      '--no-playlist',
      '--newline',
      url,
    ];
  }

  sendEvent('start', { message: 'Starting download...' });

  const proc = spawn(YT_DLP_CMD, [...YT_DLP_ARGS, ...youtubeDownloadFlags, ...args]);
  let lastProgress = 0;

  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      // Parse yt-dlp progress output: [download]  45.2% of  150.00MiB at  5.23MiB/s ETA 00:18
      const match = line.match(/\[download\]\s+([\d.]+)%\s+of\s+~?([\d.]+\w+)\s+at\s+([\d.]+\w+\/s)\s+ETA\s+([\d:]+)/);
      if (match) {
        const percent = parseFloat(match[1]);
        const totalSize = match[2];
        const speed = match[3];
        const eta = match[4];

        if (percent !== lastProgress) {
          lastProgress = percent;
          sendEvent('progress', {
            percent,
            totalSize,
            speed,
            eta,
          });
        }
        continue;
      }

      // Handle "already downloaded" case
      const alreadyMatch = line.match(/\[download\]\s+(.+)\s+has already been downloaded/);
      if (alreadyMatch) {
        sendEvent('progress', { percent: 100, totalSize: '?', speed: '0 B/s', eta: '00:00' });
        continue;
      }

      // Handle destination line
      const destMatch = line.match(/\[download\]\s+Destination:\s+(.+)/);
      if (destMatch) {
        sendEvent('downloading', { destination: path.basename(destMatch[1]) });
        continue;
      }

      // Handle merge line
      const mergeMatch = line.match(/\[Merger\]\s+Merging formats into/);
      if (mergeMatch) {
        sendEvent('merging', { message: 'Merging video and audio...' });
        continue;
      }
    }
  });

  proc.stderr.on('data', (data) => {
    const msg = data.toString();
    if (msg.includes('ERROR')) {
      sendEvent('error', { message: msg.trim().slice(0, 200) });
    }
  });

  proc.on('close', (code) => {
    if (code === 0) {
      // Find the actual output file (yt-dlp might add extension)
      let finalFile = outputFile;
      if (!fs.existsSync(outputFile)) {
        // Check for files with similar names
        const dir = TEMP_DIR;
        const files = fs.readdirSync(dir).filter(f => f.startsWith(outputId));
        if (files.length > 0) {
          finalFile = path.join(dir, files[0]);
        }
      }

      const stats = fs.existsSync(finalFile) ? fs.statSync(finalFile) : null;
      const fileName = `${safeTitle}.${ext}`;

      sendEvent('complete', {
        message: 'Download complete!',
        fileName,
        fileSize: stats ? formatFileSize(stats.size) : null,
        fileToken: outputId,
      });
    } else {
      sendEvent('error', { message: `Download failed with exit code ${code}` });
    }
    res.end();
  });

  proc.on('error', (err) => {
    sendEvent('error', { message: err.message });
    res.end();
  });

  // Handle client disconnect
  req.on('close', () => {
    proc.kill('SIGTERM');
  });
});

// Download file by token
app.get('/api/file/:token', (req, res) => {
  const { token } = req.params;
  const { filename } = req.query;

  try {
    const dir = TEMP_DIR;
    if (!fs.existsSync(dir)) {
      return res.status(404).json({ error: 'File not found or expired' });
    }

    const files = fs.readdirSync(dir).filter(f => f.startsWith(token));

    if (files.length === 0) {
      return res.status(404).json({ error: 'File not found or expired' });
    }

    const filePath = path.join(dir, files[0]);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found or expired' });
    }

    const stat = fs.statSync(filePath);
    const ext = path.extname(filePath);
    const downloadName = filename || `download${ext}`;

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

    // Clean up after download
    res.on('finish', () => {
      setTimeout(() => {
        try { fs.unlinkSync(filePath); } catch {}
      }, 10 * 60 * 1000);
    });
  } catch (err) {
    console.error('File serve error:', err);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
