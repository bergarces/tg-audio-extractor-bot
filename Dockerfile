FROM oven/bun:alpine

RUN apk add --no-cache ffmpeg curl python3

RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
RUN chmod a+rx /usr/local/bin/yt-dlp

COPY package.json ./
COPY bun.lockb ./

RUN bun install --frozen-lockfile --production

COPY index.ts ./

CMD ["bun", "run", "index.ts"]