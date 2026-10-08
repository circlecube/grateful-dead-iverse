# Contributing

Thank you for helping improve the corpus. This document explains the file format and how to propose changes via GitHub.

## Pull requests

1. **Fork** this repository and create a branch for your change.
2. **Keep changes focused**—one logical fix per PR when possible (e.g. one show’s setlist, one song’s lyrics typo).
3. **Describe what you changed** and cite a source when you can (recording, setlist.fm, liner notes, official lyrics, etc.).
4. **Leave `id` values unchanged** unless a maintainer has directed you—they tie each file to the matching entry on deadiverse.com.
5. Open the PR against the default branch; maintainers will review and merge when appropriate.

We may ask for revisions or decline changes that are unsupported, speculative, or conflict with established sources.

## Reports (good places to start)

The `reports/` directory is regenerated when the corpus is refreshed. It does not replace the show and song files, but it is a useful map for finding work:

| File | What it contains |
| --- | --- |
| `reports/export-manifest.json` | When the snapshot was built, how many shows/songs are included, and a full list of `data/` paths |
| `reports/duplicate-show-candidates.json` | Groups of **shows** that share the same band and calendar date—often different venue names, sometimes the same setlist fingerprint. Each entry lists post `id`, date, venue, and `permalink` |
| `reports/duplicate-song-candidates.json` | Pairs (or small groups) of **songs** with similar titles and different slugs (e.g. `good-lovin` vs `good-lovin-2`) |

Browse duplicate reports before opening a PR if you suspect two files describe the same show or the same song under different names. Use the `id` and file paths from the report to open the matching `.md` files under `data/shows/` or `data/songs/`.

## Resolving duplicate shows and songs (`merge_into` / `merge_from`)

Sometimes two front-matter `id` values point at what should be **one** show or song on deadiverse.com (duplicate posts). Maintainers resolve that with optional merge keys in **show or song** front matter. Only **one** of these keys may appear in a file, and the file’s own `id` must be one of the two posts involved.

| Key | Meaning |
| --- | --- |
| `merge_into: <keeper_id>` | **This file’s `id` is the duplicate** (will be retired). `<keeper_id>` is the post that survives. |
| `merge_from: <duplicate_id>` | **This file’s `id` is the keeper** (survives). `<duplicate_id>` is the other post to retire. |

Example—the duplicate show file should be folded into the canonical show:

```yaml
id: 12345
merge_into: 67890
```

Example—the canonical show file absorbs the other post:

```yaml
id: 67890
merge_from: 12345
```

In both cases the post that is retired is always the **duplicate**, not “whichever id you did not type.” Pick the keeper using duplicate reports, permalinks, and sources; put the **best** setlist, notes, and links on the keeper’s file. After a merge is completed on the site, merge keys should be removed from front matter and the duplicate’s markdown file is usually deleted from the corpus.

If you are unsure which id should survive, open a PR that explains the conflict and links to sources—maintainers can add merge keys when applying the change.

## External links (`links`)

Shows and songs both use a top-level **`links:`** block in front matter. Keys are normalized site types where possible; anything else goes under **`other`** with a human-readable **`label`** and **`url`**.

### Show `links`

Common keys (each is normally a single URL string):

- `setlist_fm` — setlist.fm page for this show  
- `archive_org` — Internet Archive listen/watch URLs (may be a **list** when several sources exist)  
- `relisten`, `dead_net`, `jerrybase`, `jerrygarcia_com`, `etreedb`, `herbibot`, `elgoose`, `concert_archives` — other catalog or fan sites when present  

Shows may also include **`setlist_fm_id`** (the setlist.fm slug fragment) beside `links.setlist_fm`.

Custom or one-off URLs use **`other`**:

```yaml
links:
  setlist_fm: 'https://www.setlist.fm/setlist/...'
  other:
    - label: 'gdsets.com (1995-12-02)'
      url: 'https://gdsets.com/grateful-dead.htm#1995'
```

PRs that add or fix sources (archive.org, setlist.fm, etc.) are welcome when you can cite the correct page.

### Song `links`

Song links use the same idea with song-oriented types, for example:

- `wikipedia`, `songfacts`, `ultimate_guitar`, `songsterr`, `reddit` — one URL each when present  
- `other` — list of `{ label, url }` (Dead.net articles, YouTube features, etc.)

```yaml
links:
  other:
    - label: "Greatest Stories Ever Told: Truckin'"
      url: 'https://www.dead.net/features/greatest-stories-ever-told/...'
```

**`chords_source_url`** is separate from `links`: it attributes the chord/tab source used on deadiverse.com and may also appear as an Ultimate Guitar (or similar) entry in `links` when the site stores both.

## File format

Every `.md` file begins with YAML front matter between `---` lines, followed by a Markdown body.

### Show files (`data/shows/YYYY/MM/{name}.md`)

**Front matter**

| Key | Role |
| --- | --- |
| `id` | Stable show identifier (matches deadiverse.com)—do not change casually |
| `name` | File basename (`1977-05-08`, `1977-05-08a`, …) |
| `date` | Show date `YYYY-MM-DD` |
| `band` | Performing band slug (e.g. `the-grateful-dead`) |
| `venue` | At least `name`; may include city, country, etc. |
| `setlist` | **Setlist to correct in PRs**—list of structured entries (see below) |
| `links` | External links—see [External links](#external-links-links) |
| `merge_into` / `merge_from` | Optional; resolving duplicate show posts—see [Resolving duplicates](#resolving-duplicate-shows-and-songs-merge_into--merge_from) |
| `permalink` | Public URL on deadiverse.com (reference) |
| `modified_gmt` | Timestamp from the last published snapshot (ISO-8601 UTC); optional to update when you edit |

**Setlist entries** in YAML use `entry_type`, for example:

- `note` — set label (e.g. “Set 1”) in `notes`
- `song-post` — catalog song: `title`, `name` (slug), `id`
- `song-text` — title-only or one-off slot (optional fields such as cover artist)

**Markdown body**

- **`## Setlist`** — readable numbered list with links to song files, for browsing in git/GitHub. **When fixing a setlist, edit front matter `setlist:`**, not only this section—the body list may be regenerated on the next snapshot.
- **`## Notes`** — free-text show notes.

### Song files (`data/songs/{slug}.md`)

**Front matter**

| Key | Role |
| --- | --- |
| `id` | Stable song identifier (matches deadiverse.com) |
| `name` | Slug / filename (e.g. `black-throated-wind`) |
| `title` | Display title |
| `band` | Billed artist slug(s), often a list |
| `contributors` | Credits: `musicians` (slugs), `credit_type`, optional `credit_note` |
| `links` | External links—see [External links](#external-links-links) |
| `merge_into` / `merge_from` | Optional; resolving duplicate song posts—see [Resolving duplicates](#resolving-duplicate-shows-and-songs-merge_into--merge_from) |
| `chords_source_url` | Attribution URL for chord/tab source |
| `also_known_as` | Alternate titles |
| `musicbrainz_recording_mbid` | MusicBrainz recording ID when present |
| `stats` | Play counts and first-played references (snapshot) |
| `embeds` | Embedded media references when present |

**Markdown body**

- **`## Lyrics`** — plain text; paragraph breaks = blank lines
- **`## Lyric annotations`** — optional commentary
- **`## Notes`** — song notes
- **`## Chord sheet`** — chord sheet text when present

Keep long performance histories out of song files; performances belong under `data/shows/`.

## Editing tips

- Prefer **small, verifiable** fixes (wrong song in a set, typo in a title, broken slug in YAML).
- For setlists, change **`setlist:` in YAML** and keep song `name` slugs consistent with `data/songs/{slug}.md` filenames.

## Repository tooling (Node)

This repo includes a small **Node** toolchain (`package.json`) for `modified_gmt` and packaging changes for import.

**One-time setup:**

```bash
npm install
npm run hooks:install   # optional: auto-bump modified_gmt on commit
chmod +x .githooks/pre-commit
```

With hooks enabled, each commit that stages files under `data/shows/` or `data/songs/` updates **`modified_gmt`** in front matter to the current UTC time (used by deadiverse bulk import to detect changed files). Large mechanical re-exports may use `git commit --no-verify` if timestamps already came from the site.

**Commands:**

| Command | Purpose |
| --- | --- |
| `npm run bump-modified-gmt -- data/songs/example.md` | Set `modified_gmt` on specific files |
| `npm run zip-changed` | ZIP show/song files that differ from `origin/main` (layout: `data/...` for bulk import) |
| `npm run zip-changed -- --include-uncommitted` | Include uncommitted edits vs `HEAD` |
| `npm run zip-changed -- --base main --output dist/my.zip` | Custom base ref and output path |

Output ZIPs are written under `dist/` by default (gitignored). Upload via **Bandiverse → Settings → Markdown corpus → Import markdown ZIP (bulk)** on the site.

## Static site (`site/`)

A read-only **Astro** app in **`site/`** renders `data/` for the web (see [site/README.md](site/README.md). **Cloudflare Pages** deploys from `main` when connected (build root: `site`, output: `dist`). Set build env **`SITE_URL`** to your production URL (e.g. `https://grateful.deadiverse.com`) so canonical links, Open Graph, and `sitemap-index.xml` use the correct origin. CI: `.github/workflows/site.yml`.

| Change type | Where to edit |
| --- | --- |
| Setlists, lyrics, links, metadata | `data/` (this contributing guide) |
| Layout, styling, routes, build logic | `site/` |

**Preview a PR locally** (once `site/` exists):

```bash
cd site
npm install
npm run dev
```

The dev server reads `../data`. Fix data in `data/`; fix how it displays in `site/`.

## Copyright

**Setlists and factual metadata** (dates, venues, song order) are the main focus of community fixes.

**Lyrics** and other creative text may be protected by copyright. Only submit wording you have the right to share, or corrections that are clearly factual (e.g. spelling aligned with a published official lyric). Maintainers may decline lyric changes that raise licensing concerns.
