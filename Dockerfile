FROM oven/bun:1.2

WORKDIR /app

ENV NODE_ENV=production
ENV SHELF_STATIC_DIR=/app/apps/web/dist

COPY . .

RUN bun install --frozen-lockfile
RUN bun run build

EXPOSE 3000

CMD ["bun", "apps/server/src/index.ts"]
