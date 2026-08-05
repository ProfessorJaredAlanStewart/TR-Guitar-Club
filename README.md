# Trinity River Guitar Club — website

Static site. No build step, no framework, no dependencies. Four HTML files, one CSS file,
one JS file. If you can edit a text file you can edit this site.

---

## Putting it online

Upload the **contents** of this folder (not the folder itself) to your host, so that
`index.html` sits at the web root.

| Host | How |
|---|---|
| **Netlify** (easiest, free) | Go to app.netlify.com → drag this folder onto the drop zone. Add `trinityriverguitarclub.com` under Domain settings. |
| **Cloudflare Pages** (free) | Create a project → Direct Upload → drop the folder. |
| **GitHub Pages** (free) | Push to a repo → Settings → Pages → deploy from `main`, root. |
| **Traditional web host** | FTP the contents into `public_html/`. |

**Both domains.** Point `.com` and `.org` at the same host, then set one as primary and
301-redirect the other. Every host above does this in its dashboard. Pick the `.com` as
primary — the canonical tags and sitemap already reference it. If you'd rather lead with
`.org`, find-and-replace `trinityriverguitarclub.com` across the four HTML files and
`sitemap.xml`.

Local preview: `python3 -m http.server 8000` in this folder, then open `localhost:8000`.
(Open `index.html` directly and the web fonts won't load — browsers block that over `file://`.)

---

## Editing the things you'll actually want to change

### Add an event to the calendar

Bottom of `calendar.html`, in the `window.TRGC_EVENTS` block:

```js
{
  date: "2026-10-29",                    // or null for TBA
  title: "Trick or Treat at TCC",
  meta: "Atrium · 5–8 PM · costumes required",
  badge: "Annual",                       // optional small tag
  highlight: true                        // optional gold accent bar
}
```

Past events grey out on their own. Order doesn't matter — the list sorts itself.

**Meeting times** live in three places if they ever change: `calendar.html` (the two
`.recur__item` blocks), the footer of all four pages, and `assets/docs/trgc-meetings.ics`.

### Add photos to the gallery

1. Drop a full-size image into `assets/img/gallery/`
2. Drop a smaller version (about 760px on the long edge) into `assets/img/thumbs/` with the **same filename**
3. Copy any `<button class="gal">` block in `media.html` and point it at the new files

The `data-collection` attribute is what the filter buttons match on. Reusing `strumalong`
or `halloween` puts it in an existing filter; a new value needs a matching filter button
added above the gallery.

Not sure how to make the thumbnail? Skip step 2 and point `src` at the full-size file —
it'll just load slower.

### Add a video

In `media.html`, replace the placeholder card with a copy of the YouTube card above it and
swap the video ID in the iframe `src`. Use `youtube-nocookie.com` as it does now.

### Add a chord chart or tab

Drop the PDF in `assets/docs/`, then copy a row in the "Song sheets & downloads" list in
`play-along.html` and point it at the file.

### Add a chord to the chord library

`assets/js/site.js`, in the `CHORDS` array. Frets run low-E to high-e, `-1` is muted,
`0` is open. The `d` array is which finger goes where.

```js
{ n: 'Amaj9', c: 'color', f: [-1,0,4,4,0,0], d: [0,0,1,2,0,0] },
```

The diagram draws itself. Categories: `major` `minor` `seventh` `seven` `color` `barre` `power`.

---

## What's on each page

**index.html** — the club's story, purpose, founders and advisers, the thank-you to
Dr. Sean Madison and the administration, member quotes, and links to the constitution.

**media.html** — 31-photo gallery with a lightbox (click, arrow keys, swipe, Esc), filters by
event, the Collegian video, and links to both news stories.

**play-along.html** — 40 chord diagrams drawn as SVG, an interactive Circle of Fifths that
gives you the seven chords, key signature, six progressions and capo positions for any key,
a guide to reading TAB, eight practice tips, and the downloads list.

**calendar.html** — the two standing meetings, a downloadable `.ics`, the events list, and
how a semester runs.

**Contact** is a `mailto:` to jared.stewart@tccd.edu in the nav, footer, and several buttons.
Find-and-replace that address across the four HTML files if it ever changes.

---

## Changing the colour scheme

The palette is a swappable theme layer. Open any page and change one attribute on the
opening `<html>` tag:

```html
<html lang="en" data-theme="split">
```

Four options, all built in and all checked for text contrast:

| Value | What it looks like |
|---|---|
| `split` | **Current.** Light pages, dark hero photo band and dark footer. |
| `daylight` | Light all the way through, including the footer. Brightest. |
| `charcoal` | Dark, but a warm charcoal rather than near-black. |
| `midnight` | The original near-black. |

Change it on all four HTML files to keep the site consistent. Nothing else needs to move —
the chord diagrams and Circle of Fifths read their colours from the same tokens, so they
re-skin automatically. Individual colours live in the THEME LAYER block at the top of
`assets/css/site.css`.

## Two things worth knowing

**Chord diagrams and the Circle of Fifths are original SVG, not the images you sent.** The
chord poster you uploaded is copyrighted (© DVN Products LLC) and the Circle of Fifths image
appeared to be someone else's artwork, so publishing either on a live site would have been a
problem. The versions here are drawn from scratch in code — which also made them responsive,
filterable, and in the Circle's case interactive. Every fingering was checked against standard
voicings.

**A few quotes need attribution.** Quotes pulled from the Collegian video are credited to
"Club member" / "Club officer" / "Club sponsor" because the transcript doesn't name who is
speaking. The one on the homepage credited to "Club sponsor" is either you or Hal — worth
fixing. Quotes credited to Hal Macias by name came from the Club Corner article, where he's
named directly.

---

## Files

```
index.html · media.html · play-along.html · calendar.html
robots.txt · sitemap.xml
assets/
  css/site.css          all styling, organised in numbered sections
  js/site.js            nav, reveals, lightbox, chords, circle of fifths, calendar
  fonts/                Anton, Bebas Neue, Inter — self-hosted, no Google Fonts request
  img/gallery/          full-size photos (lightbox)
  img/thumbs/           small photos (grid)
  img/hero.jpg, story-*.jpg, favicon.svg
  docs/                 constitution (PDF + Word), TAB guide, meetings .ics
```

Fonts are self-hosted on purpose — the site loads no third-party resources except the
YouTube embed, so it works on locked-down campus networks and doesn't leak visitor data
to anyone.
