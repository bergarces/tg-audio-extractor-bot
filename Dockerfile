FROM oven/bun:alpine

COPY package.json ./
COPY bun.lockb ./

RUN bun install --frozen-lockfile --production

COPY src/ ./

CMD ["bun", "run", "index.ts"]