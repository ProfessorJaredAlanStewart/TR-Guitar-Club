## Song Starter (three pages, two scripts)

| File | What it is |
|---|---|
| `progressions.html` | The starter, chord-first. Tap the chords you know; get the progressions you can play, the next chord to learn, what sounds good next, and what a capo does. |
| `arrange.html` | Part two. Reads the link from the starter and turns the progression into verse / chorus / bridge, parts for four players, and song searches. |
| `tuner.html` | Standalone tuner. Linked from the hero of every practice page. |
| `songstarter.js` | The data (progression bank, chord shapes, strums) plus the audio engine and diagram renderer. Loaded by all three pages. |
| `songfinder.js` | The chord-first logic for `progressions.html` only. Loads after `songstarter.js` and reuses its data and audio, so there is one bank to edit. |
| `metronome.js` | Drop-in metronome. Put `<div id="trgc-metronome"></div>` on any page and load the script. Used on `progressions.html` and `play-along.html`. |

`progressions.js` (old) is no longer referenced by any page and can be deleted.

**Editing the progression bank.** Search `const BANK` in `songstarter.js`. Each entry:

```js
{d:['I','V','vi','IV'],          // degrees; lowercase = minor; bVII, iv, II etc. allowed
 m:['bright','bittersweet'],      // moods (unused on the new starter, still used by arrange)
 g:['pop','rock','worship'],      // styles (same)
 why:'One sentence, no theory words.',
 s:['Let It Be','No Woman No Cry']}   // each becomes an Ultimate Guitar search
```

Progressions starting on `i` are treated as minor-key. Apostrophes inside `why` must be written `\u2019`. A progression whose sus/add9 chord has no open shape is hidden on the starter rather than shown as a plain major.

**Adding a chord shape.** Search `const SHAPES` in `songstarter.js`. Frets run thick string to thin, `-1` muted, `0` open. `d` is which finger. Add `b: <fret>` for a barre. To offer it on the picker, add its name to `OPEN`, `BARRE` or `EXTRA` at the top of `songfinder.js`.

**What the student's chords are stored as.** `localStorage` key `trgc.knownChords.v1`, this browser only. Nothing is uploaded.

**The link to arrange.** "Make it a song" carries `#p=…` in the same format `songstarter.js` already reads: progression index, shape key, capo fret, tempo. Locks are always empty now.

**Theme.** Same `data-theme` attribute on `<html>` as every other page. Starter classes are prefixed `sf-`, arrange/tuner classes `ss-`, metronome `mn`.
