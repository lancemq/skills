# skills

## Vercel Cron

This project includes a daily Vercel Cron trigger:

- Path: `/api/cron/sync-skills`
- Schedule: `0 3 * * *` (daily 03:00)
- Config file: `/Users/maqi/code/skills/vercel.json`

### Required Environment Variable

Set in Vercel Project Settings:

- `CRON_SECRET`: random secret string used by the cron route.

When `CRON_SECRET` is set, the handler validates:

- `Authorization: Bearer <CRON_SECRET>`

### Important

Vercel Functions are ephemeral and cannot persist changes to local repo files (`data/skills.json`, `data/skills.db`) directly.

For real skills sync persistence, use one of:

1. Dispatch a GitHub Actions workflow from `/api/cron/sync-skills` and commit updates back to the repo.
2. Write synced data to external storage (DB/Blob), then render from that source.

### Current Cron Sync Behavior

`/api/cron/sync-skills` now does:

1. Pull skills from configured sources (README/API-based).
2. Merge with existing skills dataset.
3. Add new skills and update changed detail links.
4. Persist merged dataset to Vercel Blob:
   - `skills-data/skills-<timestamp>.json`
   - `skills-data/latest.json`
5. Update homepage metadata in Blob:
   - `sources-data/sources-<timestamp>.json`
   - `sources-data/latest.json` (includes refreshed `last_updated`)

This means daily updates are persisted outside ephemeral runtime.

## Vercel Blob Storage For `skills.db`

The site now loads database in this order:

1. `/api/skills` (Vercel Blob-backed JSON skills)
1. `/api/skills-db` (Vercel Blob-backed)
1. `data/skills.db` (local fallback)

### Blob Route

- Path: `/api/skills`
- Behavior:
  - If `SKILLS_JSON_BLOB_URL` is set, redirect to this URL.
  - Else if `BLOB_READ_WRITE_TOKEN` is set, auto-discover latest blob under `skills-data/`.

- Path: `/api/sources`
- Behavior:
  - If `SOURCES_META_BLOB_URL` is set, redirect to this URL.
  - Else if `BLOB_READ_WRITE_TOKEN` is set, auto-discover latest blob under `sources-data/`.

- Path: `/api/skills-db`
- Behavior:
  - If `SKILLS_DB_BLOB_URL` is set, redirect to this URL.
  - Else if `BLOB_READ_WRITE_TOKEN` is set, auto-discover latest blob under `skills-db/`.
  - Else return 404 and frontend falls back to local `data/skills.db`.

### Upload Local DB To Blob

1. Install dependencies:
   - `npm install`
2. Set token:
   - `export BLOB_READ_WRITE_TOKEN=...`
3. Upload:
   - `npm run blob:upload-db`

This will upload:

- `skills-db/skills-<timestamp>.db` (versioned backup)
- `skills-db/latest.db` (stable latest pointer)
