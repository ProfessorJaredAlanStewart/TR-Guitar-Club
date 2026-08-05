# Trinity River Guitar Club — website

Static site. No build step, no framework, no dependencies.

**Everything lives in the repo root on purpose.** GitHub's browser uploader strips folder
structure, which flattened the site and collided the gallery/thumbnail images (they share
filenames by design). Rather than keep fighting it, the site is built flat: every file sits
at the top level with a unique name, so a flat upload is the *correct* upload.

| Files | What they are |
|---|---|
| `index.html` `media.html` `play-along.html` `calendar.html` | the four pages |
| `site.css` | all styling |
| `site.js` | nav, lightbox, chord diagrams, circle of fifths, calendar |
| `*.woff2` | self-hosted fonts (Anton, Bebas Neue, Inter) |
| `strum-*.jpg` `hween-*.jpg` | full-size gallery photos (open in the lightbox) |
| `t-strum-*.jpg` `t-hween-*.jpg` | thumbnails — the `t-` prefix keeps them from colliding |
| `hero.jpg` `story-*.jpg` `favicon.svg` | page imagery |
| `trgc-constitution.pdf/.docx` `how-to-read-guitar-tab.pdf` `trgc-meetings.ics` | documents |
| `CNAME` | the custom domain. **Do not delete this.** |

---

## Editing

### Add an event to the calendar
Bottom of `calendar.html`, in `window.TRGC_EVENTS`:
```js
{ date: "2026-10-29", title: "Trick or Treat at TCC",
  meta: "Atrium · 5–8 PM", badge: "Annual", highlight: true }
```
`date: null` shows as TBA. Past events grey out automatically; the list sorts itself.

### Add a photo
1. Upload the full-size image as `something.jpg`
2. Upload a ~640px version as `t-something.jpg`
3. Copy a `<button class="gal">` block in `media.html` and point both paths at it

Skipping step 2 works — point `src` at the full-size file; it just loads slower.

### Add a chord chart or tab
Upload the PDF, then copy a row in the "Song sheets & downloads" list in `play-along.html`.

### Add a video
In `media.html`, copy the YouTube card and swap the video ID.

### Change the colour scheme
One attribute on the `<html>` tag of each of the four pages:
```html
<html lang="en" data-theme="daylight">
```
`daylight` (current) · `split` · `charcoal` · `midnight`. All contrast-checked.

Do **not** lighten `--scrim-1/2/3` or `--scrim-side` in `site.css` — that text sits on a
photo, not on the page, and lightening it makes the headline unreadable.

### Contact address
`jared.stewart@tccd.edu` appears in the nav, footer and several buttons of all four pages.
Find-and-replace if it changes.

---

## Two things worth knowing

**The chord diagrams and Circle of Fifths are original SVG.** The chord poster supplied was
copyrighted (© DVN Products LLC) and the Circle of Fifths image appeared to be someone
else's artwork, so both were rebuilt from scratch in code — which also made them responsive
and interactive. Every fingering was checked against standard voicings.

**Some quotes need attribution.** Quotes from the Collegian video are credited to
"Club member" / "Club officer" / "Club sponsor" because the transcript doesn't name the
speaker. Quotes credited to Hal Macias by name came from the Club Corner article.
