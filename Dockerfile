FROM node:20-slim

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --break-system-packages yt-dlp

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/ .

ENV PYTHON=python3
ENV NODE_ENV=production

EXPOSE 8000

CMD ["node", "server.js"]
