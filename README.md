# Universal Media Downloader

A web application for downloading media from various platforms including YouTube, Instagram, TikTok, and more.

## Project Structure

```
├── backend/           # Node.js Express server
│   ├── server.js      # Main server file
│   ├── package.json
│   └── node_modules/
│
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── styles/
│   │   ├── types/
│   │   └── utils/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── prd.md             # Product Requirements Document
└── README.md
```

## Getting Started

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Make sure Python and yt-dlp are installed:
   ```bash
   pip install yt-dlp
   ```

4. Start the server:
   ```bash
   npm start
   ```

The API will be available at http://localhost:8000

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at http://localhost:3001

## API Endpoints

### Health Check
```
GET /api/health
```

### Analyze URL
```
POST /api/analyze
Body: { "url": "https://youtube.com/watch?v=..." }
```

### Download with Progress (SSE)
```
GET /api/download-stream?url=...&format_id=mp4-1080&title=...
```

### Download File
```
GET /api/file/:token?filename=download.mp4
```

## Supported Platforms

- YouTube
- Facebook
- Instagram
- TikTok
- Reddit
- Pinterest
- X (Twitter)
- Vimeo
- Dailymotion

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, CSS Modules
- **Backend**: Node.js, Express, yt-dlp (Python)
- **Progress**: Server-Sent Events (SSE)

## Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy dist/ folder
```

### Backend (Railway/Render/Fly.io)
```bash
cd backend
# Deploy entire folder
# Make sure Python and yt-dlp are available in the environment
```
