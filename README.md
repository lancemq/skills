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
