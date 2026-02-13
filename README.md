# skills

## Vercel Cron

This project includes two Vercel Cron triggers:

- Daily health check
  - Path: `/api/cron/daily-skill-health`
  - Schedule: `0 3 * * *` (daily 03:00)
- Source discovery and full crawl
  - Path: `/api/cron/discover-sources`
  - Schedule: `0 3 */3 * *` (every 3 days at 03:00)

Config file: `/Users/maqi/code/skills/vercel.json`

### Required Environment Variable

Set in Vercel Project Settings:

- `CRON_SECRET`: random secret string used by the cron route.

When `CRON_SECRET` is set, the handler validates:

- `Authorization: Bearer <CRON_SECRET>`

### Important

Vercel Functions are ephemeral and cannot persist changes to local repo files (`data/skills.json`, `data/skills.db`) directly.

For real skills sync persistence, use one of:

1. Dispatch a GitHub Actions workflow from `/api/cron/discover-sources` and commit updates back to the repo.
2. Write synced data to external storage (DB/Blob), then render from that source.

### Current Cron Sync Behavior

Daily health (`/api/cron/daily-skill-health`) does:

1. Check all skills links.
2. Mark invalid skills:
   - `is_active: false` when link is bad (404/410 or unavailable)
3. Attempt to enrich missing detail fields from source pages.
4. Update verification/timeline fields:
   - `link_status`, `verified_at`, `updated_at`
5. Persist updated skills and sources metadata to Blob.

Discovery crawl (`/api/cron/discover-sources`) does:

1. Discover new source candidates from GitHub search.
2. Merge new sources into existing sources list.
3. Crawl all sources and collect skill links.
4. Add new skills and update changed links.
5. Persist merged skills/sources to Blob.

This means daily updates are persisted outside ephemeral runtime.

### Frontend default behavior for invalid skills

Skills with `is_active: false` are hidden by default in homepage lists and favorites.

## UI Additions

- `skill-detail.html`: dedicated skill detail page (capability, install, usage example, source link).
- Homepage weekly modules:
  - `This Week -> New Skills`
  - `This Week -> Updated Skills`

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
