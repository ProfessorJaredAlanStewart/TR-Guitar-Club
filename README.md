## Song Starter (`progressions.html`)

Single file. Uses `site.css`, `site.js`, `hero.jpg`, `favicon.svg` and the two font files already at the repo root. No new dependencies.

**What it does.** Picks a chord progression real songs use, in the key you choose, with the easiest fingerings that fit what the player can do. Plays it in the browser (synthesised, no samples). Lets the player lock chords and re-roll the rest, shows every capo position that keeps the same sounding key, derives a verse/pre-chorus/chorus/bridge, writes four parts for a room of players, saves favourites to the browser, and carries the whole state in the link so it can be texted. Built-in tuner uses the mic; nothing is recorded or uploaded.

**Editing the progression bank.** Search for `const BANK` in the file. Each entry:

```js
{d:['I','V','vi','IV'],          // degrees; lowercase = minor; bVII, iv, II etc. allowed
 m:['bright','bittersweet'],      // moods: bright sad bittersweet dreamy driving dark tense
 g:['pop','rock','worship'],      // styles (keys of STRUMS)
 why:'One sentence on why it works.',
 s:['Let It Be','No Woman No Cry']}   // songs; each becomes an Ultimate Guitar search
```

Progressions starting on `i` are treated as minor-key and use the minor degree map.

**Adding a chord shape.** Search for `const SHAPES`. Frets run thick string to thin, `-1` is muted, `0` is open. `d` is which finger. Add `b: <fret>` for a barre. Anything not in the table falls back to a generated E-shape or A-shape barre.

**Adding a strum.** Search for `const STRUMS`. Eight boxes per bar: `D` down, `u` up, `-` rest, `x` chuck, `B` bass note, `P` thumb, `p` fingers. Add the display name to `GENRE_LABEL`.

**Theme.** Same `data-theme` attribute on `<html>` as every other page. All page-specific classes are prefixed `ss-`, so nothing collides with `site.css`.
