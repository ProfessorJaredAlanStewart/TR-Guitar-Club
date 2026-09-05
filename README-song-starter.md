## Song Starter (three pages, one script)

| File | What it is |
|---|---|
| `progressions.html` | The starter. Pick chords, move the capo, lock and spin, save, share. |
| `arrange.html` | Part two. Reads the same link and turns the progression into verse / chorus / bridge, parts for four players, and song searches. |
| `tuner.html` | Standalone tuner. Linked from the Song Starter hero. Worth adding to the nav on every page (one `<li>` each). |
| `songstarter.js` | The engine and every renderer, shared by all three. Each renderer checks whether its container is on the page and skips if not. |

All three pages use `site.css`, `site.js`, `hero.jpg`, `favicon.svg` and the two font files already at the repo root. No new dependencies.

**The link carries everything.** State (progression, chord family, capo fret, hands, mood, style, tempo, locks) is encoded in `#p=…`. Any link on a page marked `data-carry="…"` gets the current hash appended automatically, so "Make it a song" and "Back to the starter" keep the player's place. The shelf (localStorage) stores the same snapshot.

**Editing the progression bank.** Search `const BANK` in `songstarter.js`. Each entry:

```js
{d:['I','V','vi','IV'],          // degrees; lowercase = minor; bVII, iv, II etc. allowed
 m:['bright','bittersweet'],      // moods: bright sad bittersweet dreamy driving dark tense
 g:['pop','rock','worship'],      // styles: keys of STRUMS
 why:'One sentence, no theory words.',
 s:['Let It Be','No Woman No Cry']}   // each becomes an Ultimate Guitar search
```

Progressions starting on `i` are treated as minor-key and use the minor degree map (`DEG_MIN`). Apostrophes inside `why` must be written `\u2019`.

**Adding a chord shape.** Search `const SHAPES`. Frets run thick string to thin, `-1` muted, `0` open. `d` is which finger. Add `b: <fret>` for a barre. Anything missing falls back to a generated E-shape or A-shape barre.

**Adding a strum.** Search `const STRUMS`. Eight boxes per bar: `D` down, `u` up, `-` rest, `x` chuck, `B` bass note, `P` thumb, `p` fingers. Add the display name to `GENRE_LABEL`. With style left on "Standard strum", the pop pattern is always used.

**Theme.** Same `data-theme` attribute on `<html>` as every other page. All page-specific classes are prefixed `ss-` so nothing collides with `site.css`.

**Nav.** The three Song Starter pages already carry a "Tuner" nav item. To match on the other pages, add this line after the Song Starter item in `index.html`, `media.html`, `play-along.html` and `calendar.html`, and the same in each footer's Site list:

```html
<li><a href="tuner.html">Tuner</a></li>
```
