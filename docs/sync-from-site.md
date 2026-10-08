# Sync from site export (Phase 2)

Pulls the published markdown corpus ZIP from deadiverse.com (or another Bandiverse site with **scheduled export** enabled) and opens a rolling PR on branch `bot/site-sync`.

## Site side

- Feature: `corpus_export_schedule` on the WordPress site.
- Public metadata: `https://<domain>/wp-content/uploads/bandiverse/exports/export-<domain>-latest.json`
- That JSON includes `content_hash`, `zip_url`, `zip_sha256`, `zip_bytes`, and `generated_at`.

## Repository configuration

| Name | Type | Example |
| --- | --- | --- |
| `EXPORT_LATEST_URL` | Variable | `https://deadiverse.com/wp-content/uploads/bandiverse/exports/export-deadiverse.com-latest.json` |
| `CORPUS_SYNC_TOKEN` | Secret | Fine-grained PAT or GitHub App token with **contents** + **pull requests** on this repo |

`CORPUS_SYNC_TOKEN` is required for `peter-evans/create-pull-request` — pushes with the default `GITHUB_TOKEN` do not trigger other workflows.

Optional: `MAX_EXPORT_ZIP_BYTES` (default 600MB) when running the script locally or in CI.

## Workflow

- **`.github/workflows/sync-from-site.yml`** — daily schedule, `workflow_dispatch` (`force`), and `repository_dispatch` (`site-export`, for a future site ping).
- **`scripts/sync-from-export.mjs`** — download, verify, validate zip paths, apply with `modified_gmt` guard.

## Local dry run

```bash
npm ci
node scripts/sync-from-export.mjs \
  --latest-url 'https://deadiverse.com/wp-content/uploads/bandiverse/exports/export-deadiverse.com-latest.json' \
  --dry-run
```

## Guards

- **Zip paths:** only `data/shows/**.md`, `data/songs/*.md`, `reports/*.json`, `README-export.md` (no zip-slip).
- **Repo newer than incoming file:** keep repo copy; listed as *pending import* in the job summary.
- **File missing from export:** delete from repo unless repo `modified_gmt` is after export `generated_at` (unmerged repo edit).
- **Skip PR:** if only `reports/` (and export readme) change, no data PR is opened.

## Tests

```bash
npm test
```

Plan: [bandiverse#809](https://github.com/circlecube/bandiverse/issues/809).
