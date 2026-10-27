import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  joinFrontMatter,
  replaceTopLevelKey,
  splitFrontMatter,
  upsertLinkKey,
} from '../scripts/lib/corpus-front-matter-patch.mjs';

const EXPORT_STYLE = `---
schema_version: 1
name: '1990-02-25'
venue:
  name: 'Oakland Coliseum Arena'
  country: 'United States'
setlist:
  -
    entry_type: note
    notes: 'Set 1'
  -
    entry_type: song-post
    title: 'Touch of Grey'
modified_gmt: '2026-05-28T23:03:40+00:00'
links:
  setlist_fm: 'https://www.setlist.fm/setlist/grateful-dead/1990/example.html'
---
`;

test('replaceTopLevelKey preserves export quoting and setlist layout', () => {
  const { fm, body } = splitFrontMatter(EXPORT_STYLE);
  const nextFm = replaceTopLevelKey(fm, 'modified_gmt', '2026-10-08T20:00:00+00:00');
  const out = joinFrontMatter(nextFm, body);
  assert.match(out, /name: '1990-02-25'/);
  assert.match(out, /name: 'Oakland Coliseum Arena'/);
  assert.match(out, /notes: 'Set 1'/);
  assert.match(out, /title: 'Touch of Grey'/);
  assert.match(out, /^\s+-$\n/m);
  assert.match(out, /modified_gmt: '2026-10-08T20:00:00\+00:00'/);
  assert.doesNotMatch(out, /modified_gmt: '2026-05-28/);
});

test('upsertLinkKey adds quoted link without reformatting setlist', () => {
  const { fm, body } = splitFrontMatter(EXPORT_STYLE);
  const nextFm = upsertLinkKey(fm, 'relisten', 'https://relisten.net/grateful-dead/1990/2/25');
  const out = joinFrontMatter(nextFm, body);
  assert.match(out, /relisten: 'https:\/\/relisten\.net\/grateful-dead\/1990\/2\/25'/);
  assert.match(out, /notes: 'Set 1'/);
});
