import { ensureDevIdentity, type DevIdentity } from "@bookmarks/api/identity";
import { createApp } from "./app";
import { BookmarkEnrichmentWorker, RedisBookmarkEnrichmentQueue } from "./bookmarkEnrichmentQueue";
import { createRuntimeClients } from "./clients";
import { getConfig } from "./config";

const config = getConfig();
const clients = createRuntimeClients({
  databaseUrl: config.databaseUrl,
  redisUrl: config.redisUrl,
  meilisearchUrl: config.meilisearchUrl
});

let currentUser: DevIdentity | undefined;

if (config.authMode === "dev") {
  currentUser = await ensureDevIdentity(clients.pool);
  console.log(
    `Dev identity ready: ${currentUser.email} (${currentUser.userId}) in ${currentUser.organizationSlug}`
  );
}

const app = createApp({
  bookmarkEnrichmentQueue: new RedisBookmarkEnrichmentQueue(clients.redis),
  dependencies: clients,
  currentUser
});
const bookmarkEnrichmentWorker = new BookmarkEnrichmentWorker({
  db: clients.db,
  redis: clients.redis
});

bookmarkEnrichmentWorker.start();

Bun.serve({
  port: config.port,
  fetch: app.fetch
});

console.log(`API listening on http://localhost:${config.port}`);

const shutdown = async () => {
  await bookmarkEnrichmentWorker.stop();
  await clients.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
