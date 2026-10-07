# Site fixture corpus (dev only)

These files are **not** imported into the public markdown corpus indexes (`data/shows/`, `data/songs/`). They exist so the Astro site can be checked against **every field and body section the renderer supports**.

Most real export files are **sparse**: many songs only have title, band, stats, and lyrics—without chord sheets, song notes, lyric annotations, or rich `links`. That is expected. The fixtures intentionally include optional keys (contributors, `chords_source_url`, `also_known_as`, `embeds`, HTML notes, every setlist `entry_type`, etc.) so you can confirm layout and cards when data *is* present.

When running `npm run dev` in `site/`, use the **Fixtures** link in the header or open:

- [/dev/fixture-show/](/dev/fixture-show/) — show field showcase
- [/dev/fixture-song/](/dev/fixture-song/) — song field showcase

Production builds (`npm run build`) omit `/dev/*` routes and the header link.
