# Agent instructions (grateful-dead-iverse)

## What this repository is

**Grateful Dead-iverse** is a public **markdown corpus**: thousands of `.md` files describing Grateful Dead **shows** and **songs**, kept in git for review, diffs, and community corrections. The live catalog is [deadiverse.com](https://deadiverse.com). Each file’s front matter `id` and `permalink` tie it to a post on that site.

The canonical artifact is **`data/`** (text + YAML). A read-only static viewer lives in **`site/`** (Astro); it is not deadiverse.com and does not include jukebox, auth, or crowd features. Export/import automation lives in the **private Bandiverse** plugin (`docs/markdown-corpus.md` on the operator side); do not assume that doc path exists in this clone.

Human-oriented overview: **[README.md](README.md)**. Contribution rules and file format: **[CONTRIBUTING.md](CONTRIBUTING.md)**. Static site plan: **[docs/plans/2026-10-07-static-site.md](docs/plans/2026-10-07-static-site.md)**.

## Layout

| Path | Role |
| --- | --- |
| `data/shows/YYYY/MM/{name}.md` | One show; `name` is usually `YYYY-MM-DD` or `YYYY-MM-DDa` when multiple shows share a date |
| `data/songs/{slug}.md` | One song; filename slug matches `name` in front matter and `song-post` entries in setlists |
| `reports/export-manifest.json` | Snapshot metadata and full file list from last bulk export |
| `reports/duplicate-show-candidates.json` | Same band + date groups—starting point for duplicate-show work |
| `reports/duplicate-song-candidates.json` | Similar titles / duplicate slugs—starting point for duplicate-song work |
| `scripts/` | Node helpers (`bump-modified-gmt.mjs`, `zip-changed.mjs`) |
| `site/` | Astro static site: build-time loader, performance index, deploy to Cloudflare |
| `docs/plans/` | Feature plans (e.g. static site) |
| `.githooks/pre-commit` | Optional hook to bump `modified_gmt` on staged corpus files |

Show bodies often link to songs with relative paths like `../../../../songs/{slug}.md`.

## File shape (summary)

Every corpus file: YAML **front matter** between `---` lines, then a Markdown **body**.

### Shows

- **Setlist truth:** front matter **`setlist:`** (YAML array of `entry_type`: `note`, `song-post`, `song-text`, etc.).
- **Do not** “fix” a setlist by editing only the body **`## Setlist`** section—that block is for human browsing; importers read **`setlist:`** in YAML.
- **Show notes:** body **`## Notes`** (prose).
- **`links:`** — external URLs (`setlist_fm`, `archive_org` as list, `other` with `label`/`url`). See CONTRIBUTING.
- **`merge_into` / `merge_from`** — optional; mark duplicate show posts for maintainer merge (only one key; file `id` must be one of the pair). See CONTRIBUTING.

### Songs

- Structured fields in front matter: `title`, `band`, `contributors` (`musicians` slugs per row), `links`, `chords_source_url`, `also_known_as`, `stats`, `embeds`, etc.
- Body sections: **`## Lyrics`**, **`## Lyric annotations`**, **`## Notes`**, **`## Chord sheet`** (plain text).
- Do not add long performance histories to song files; performances belong in show setlists.

### Identifiers and timestamps

- **`id`** — WordPress post ID on deadiverse.com. **Do not change** unless a maintainer explicitly requests it.
- **`modified_gmt`** — ISO-8601 UTC (e.g. `2026-10-07T18:45:54+00:00`). Bulk import on the site uses this to detect changed files. After editing corpus markdown, bump it (or use `npm run bump-modified-gmt` / the pre-commit hook).
- **`schema_version`** — corpus format version (currently `1` on exports).
- **`band`** on shows is usually `the-grateful-dead`.

## How to work in this repo (agents)

1. **Start from `reports/`** when hunting duplicates or scope (manifest file list, duplicate JSON).
2. **Prefer small, sourced edits**—one show or song per change when possible; cite setlist.fm, tapes, or official sources in PR text.
3. **Edit YAML for setlists and links**; edit body sections for lyrics and notes.
4. **Keep slugs consistent:** `song-post` `name` must match an existing `data/songs/{slug}.md` when linking to the catalog.
5. **Avoid drive-by reformats** of unrelated files, mass quote/style changes across the corpus, or re-export-scale diffs unless asked.
6. **Lyrics:** factual typo fixes may be OK; respect copyright—see CONTRIBUTING.

## Node tooling

Requires Node ≥ 18. From repo root:

- `npm install`
- `npm run bump-modified-gmt -- data/shows/...md`
- `npm run zip-changed` — ZIP paths under `data/` that differ from `origin/main` (for maintainer bulk import)
- `npm run hooks:install` — enable `.githooks/pre-commit`

Details: CONTRIBUTING § Repository tooling.

## Static site (`site/`)

When working on the viewer:

- Build **setlists from YAML** `setlist:`; do not parse body `## Setlist` for UI.
- At build time, compute **song → shows** from all `song-post` entries; merge with song `stats.play_count` / `stats.first_played` when exported.
- URL shape: `/shows/{year}/{month}/{name}/`, `/songs/{slug}/`.
- Style using **dv-child** tokens (cream/teal/orange palette)—reference monorepo `dv-child/theme.json`, not full Bandiverse plugin CSS.
- Do not commit `site/dist/`; Cloudflare builds from `main`.

Local dev: `cd site && npm install && npm run dev`, or from repo root `npm run site:dev` (see `site/README.md`).

## Related systems (out of repo)

- **deadiverse.com** — published site (source of truth for what visitors see).
- **Bandiverse plugin** (private) — markdown export/import, merge UI, bulk ZIP import; matches files by `id` and compares `modified_gmt` to post modified time.

When unsure about importer behavior or merge semantics, describe the intended data fix in the PR and avoid adding merge keys unless the task is explicitly duplicate resolution.
