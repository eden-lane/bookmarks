# Shelf

Shelf is a self-hosted saved-link manager with email/password session auth, nested folders, tags, full-text search, favicon storage, and a browser-extension-friendly API.

This Railway template deploys:

- Shelf web/API service from `eden-lane/shelf`
- Postgres for app data and sessions
- Redis for background enrichment jobs
- Meilisearch for saved-link search

After deployment, open the Shelf service URL and create the first account. Registration defaults to `first-user-only`, so signup closes automatically after the first user exists.

The app service serves the React frontend and API from the same origin, runs Drizzle migrations before startup, and exposes `/health` for Railway health checks.
