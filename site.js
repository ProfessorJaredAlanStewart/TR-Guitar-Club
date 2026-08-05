/* =========================================================
   Trinity River Guitar Club — site.js
   No dependencies. Every module bails out quietly if its
   markup isn't on the page, so one file serves every page.
   ========================================================= */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  // Palette values live in CSS custom properties so the theme layer drives the SVGs too.
  var tok = function (name, el) {
    var v = getComputedStyle(el || document.documentElement).getPropertyValue(name).trim();
    return v || '#888';
  };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Nav ---------- */
  (function nav() {
    var head = $('.site-head');
    var btn  = $('.nav__toggle');
    var list = $('.nav__links');

    if (head) {
      var onScroll = function () { head.classList.toggle('is-scrolled', window.scrollY > 16); };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    if (!btn || !list) return;

    var close = function () {
      btn.setAttribute('aria-expanded', 'false');
      list.classList.remove('is-open');
      document.body.classList.remove('no-scroll');
    };
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      list.classList.toggle('is-open', !open);
      document.body.classList.toggle('no-scroll', !open);
    });
    $$('a', list).forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', function () { if (window.innerWidth > 960) close(); });
  })();

  /* ---------- Reveal on scroll ---------- */
  (function reveal() {
    var els = $$('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Footer year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* =========================================================
     GALLERY + LIGHTBOX
     ========================================================= */
  (function gallery() {
    var grid = $('#gallery');
    var lb   = $('#lightbox');
    if (!grid || !lb) return;

    var img    = $('.lb__img', lb);
    var capEl  = $('.lb__foot', lb);
    var cntEl  = $('.lb__count', lb);
    var visible = [];
    var idx = 0;
    var lastFocus = null;

    var refresh = function () {
      visible = $$('.gal', grid).filter(function (b) { return !b.classList.contains('is-hidden'); });
    };

    var show = function (i) {
      if (!visible.length) return;
      idx = (i + visible.length) % visible.length;
      var btn = visible[idx];
      var full = btn.getAttribute('data-full');
      var cap  = btn.getAttribute('data-caption') || '';
      img.style.opacity = '0';
      var pre = new Image();
      pre.onload = function () { img.src = full; img.alt = cap; img.style.opacity = '1'; };
      pre.src = full;
      // fallback in case the browser cached it and onload is instant/late
      img.src = full; img.alt = cap; img.style.opacity = '1';
      capEl.textContent = cap;
      cntEl.textContent = (idx + 1) + ' / ' + visible.length;
      // preload neighbours
      [1, -1].forEach(function (d) {
        var n = visible[(idx + d + visible.length) % visible.length];
        if (n) { var p = new Image(); p.src = n.getAttribute('data-full'); }
      });
    };

    var open = function (btn) {
      refresh();
      lastFocus = btn;
      var i = visible.indexOf(btn);
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');
      show(i < 0 ? 0 : i);
      var close = $('.lb__close', lb); if (close) close.focus();
    };

    var close = function () {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');
      img.src = '';
      if (lastFocus) lastFocus.focus();
    };

    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('.gal');
      if (btn) open(btn);
    });

    $$('[data-lb-close]', lb).forEach(function (el) { el.addEventListener('click', close); });
    var prev = $('[data-lb-prev]', lb); if (prev) prev.addEventListener('click', function () { show(idx - 1); });
    var next = $('[data-lb-next]', lb); if (next) next.addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb__stage')) close(); });

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'ArrowLeft') show(idx - 1);
    });

    // swipe
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 48) show(idx + (dx < 0 ? 1 : -1));
      x0 = null;
    }, { passive: true });

    // filters
    var filters = $$('.filter');
    filters.forEach(function (f) {
      f.addEventListener('click', function () {
        var val = f.getAttribute('data-filter');
        filters.forEach(function (o) { o.setAttribute('aria-pressed', String(o === f)); });
        $$('.gal', grid).forEach(function (g) {
          g.classList.toggle('is-hidden', val !== 'all' && g.getAttribute('data-collection') !== val);
        });
        refresh();
        var live = $('#gallery-count');
        if (live) live.textContent = visible.length + ' photo' + (visible.length === 1 ? '' : 's');
      });
    });
    refresh();
    var live = $('#gallery-count');
    if (live) live.textContent = visible.length + ' photos';
  })();

  /* =========================================================
     CHORD DIAGRAMS  (rendered as inline SVG)
     frets: low-E → high-e, -1 = muted, 0 = open
     ========================================================= */
  var CHORDS = [
    // ---- open majors
    { n: 'C',       c: 'major', f: [-1,3,2,0,1,0],  d: [0,3,2,0,1,0] },
    { n: 'A',       c: 'major', f: [-1,0,2,2,2,0],  d: [0,0,1,2,3,0] },
    { n: 'G',       c: 'major', f: [3,2,0,0,0,3],   d: [2,1,0,0,0,3] },
    { n: 'E',       c: 'major', f: [0,2,2,1,0,0],   d: [0,2,3,1,0,0] },
    { n: 'D',       c: 'major', f: [-1,-1,0,2,3,2], d: [0,0,0,1,3,2] },
    { n: 'F',       c: 'major', f: [1,3,3,2,1,1],   d: [1,3,4,2,1,1], barre: { fret: 1, from: 0, to: 5 } },
    // ---- open minors
    { n: 'Am',      c: 'minor', f: [-1,0,2,2,1,0],  d: [0,0,2,3,1,0] },
    { n: 'Em',      c: 'minor', f: [0,2,2,0,0,0],   d: [0,2,3,0,0,0] },
    { n: 'Dm',      c: 'minor', f: [-1,-1,0,2,3,1], d: [0,0,0,2,3,1] },
    // ---- dominant sevenths
    { n: 'A7',      c: 'seventh', f: [-1,0,2,0,2,0], d: [0,0,2,0,3,0] },
    { n: 'B7',      c: 'seventh', f: [-1,2,1,2,0,2], d: [0,2,1,3,0,4] },
    { n: 'C7',      c: 'seventh', f: [-1,3,2,3,1,0], d: [0,3,2,4,1,0] },
    { n: 'D7',      c: 'seventh', f: [-1,-1,0,2,1,2], d: [0,0,0,2,1,3] },
    { n: 'E7',      c: 'seventh', f: [0,2,0,1,0,0],  d: [0,2,0,1,0,0] },
    { n: 'G7',      c: 'seventh', f: [3,2,0,0,0,1],  d: [3,2,0,0,0,1] },
    // ---- major 7 / minor 7
    { n: 'Cmaj7',   c: 'seven', f: [-1,3,2,0,0,0],  d: [0,3,2,0,0,0] },
    { n: 'Gmaj7',   c: 'seven', f: [3,2,0,0,0,2],   d: [3,2,0,0,0,1] },
    { n: 'Fmaj7',   c: 'seven', f: [-1,-1,3,2,1,0], d: [0,0,3,2,1,0] },
    { n: 'Amaj7',   c: 'seven', f: [-1,0,2,1,2,0],  d: [0,0,2,1,3,0] },
    { n: 'Dmaj7',   c: 'seven', f: [-1,-1,0,2,2,2], d: [0,0,0,1,1,1] },
    { n: 'Am7',     c: 'seven', f: [-1,0,2,0,1,0],  d: [0,0,2,0,1,0] },
    { n: 'Em7',     c: 'seven', f: [0,2,0,0,0,0],   d: [0,2,0,0,0,0] },
    { n: 'Dm7',     c: 'seven', f: [-1,-1,0,2,1,1], d: [0,0,0,2,1,1] },
    // ---- sus & add
    { n: 'Asus2',   c: 'color', f: [-1,0,2,2,0,0],  d: [0,0,1,2,0,0] },
    { n: 'Asus4',   c: 'color', f: [-1,0,2,2,3,0],  d: [0,0,1,2,3,0] },
    { n: 'Dsus2',   c: 'color', f: [-1,-1,0,2,3,0], d: [0,0,0,1,3,0] },
    { n: 'Dsus4',   c: 'color', f: [-1,-1,0,2,3,3], d: [0,0,0,1,2,3] },
    { n: 'Esus4',   c: 'color', f: [0,2,2,2,0,0],   d: [0,1,2,3,0,0] },
    { n: 'Cadd9',   c: 'color', f: [-1,3,2,0,3,0],  d: [0,2,1,0,3,0] },
    { n: 'G/B',     c: 'color', f: [-1,2,0,0,0,3],  d: [0,2,0,0,0,3], alias: 'walks the bass from G down to Am' },
    // ---- movable barre shapes
    { n: 'Bm',      c: 'barre', f: [-1,2,4,4,3,2],  d: [0,1,3,4,2,1], barre: { fret: 2, from: 1, to: 5 } },
    { n: 'F#m',     c: 'barre', f: [2,4,4,2,2,2],   d: [1,3,4,1,1,1], barre: { fret: 2, from: 0, to: 5 }, alias: 'Em shape, barred at fret 2' },
    { n: 'Bb',      c: 'barre', f: [-1,1,3,3,3,1],  d: [0,1,2,3,4,1], barre: { fret: 1, from: 1, to: 5 } },
    { n: 'Cm',      c: 'barre', f: [-1,3,5,5,4,3],  d: [0,1,3,4,2,1], base: 3, barre: { fret: 3, from: 1, to: 5 } },
    { n: 'Gm',      c: 'barre', f: [3,5,5,3,3,3],   d: [1,3,4,1,1,1], base: 3, barre: { fret: 3, from: 0, to: 5 } },
    { n: 'Fm',      c: 'barre', f: [1,3,3,1,1,1],   d: [1,3,4,1,1,1], barre: { fret: 1, from: 0, to: 5 } },
    // ---- power chords
    { n: 'E5',      c: 'power', f: [0,2,2,-1,-1,-1], d: [0,1,2,0,0,0] },
    { n: 'A5',      c: 'power', f: [-1,0,2,2,-1,-1], d: [0,0,1,2,0,0] },
    { n: 'D5',      c: 'power', f: [-1,-1,0,2,3,-1], d: [0,0,0,1,3,0] },
    { n: 'G5',      c: 'power', f: [3,5,5,-1,-1,-1], d: [1,3,4,0,0,0], base: 3 }
  ];

  function chordSVG(ch) {
    var S = 6, F = 5;                    // strings, frets shown
    var W = 118, H = 148;
    var padX = 19, padTop = 30, padBottom = 12;   // padX leaves room for the base-fret label
    var gw = W - padX * 2;               // grid width
    var gh = H - padTop - padBottom;
    var sx = gw / (S - 1);
    var fy = gh / F;
    var base = ch.base || 1;
    var ns = 'http://www.w3.org/2000/svg';
    var C = {
      nut:    tok('--dg-nut'),    fret: tok('--dg-fret'),  string: tok('--dg-string'),
      barre:  tok('--dg-barre'),  dot:  tok('--dg-dot'),   mute:   tok('--dg-mute'),
      open:   tok('--dg-open'),   fing: tok('--dg-finger')
    };
    var out = [];

    out.push('<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="' + ns + '" role="img" aria-label="' +
      ch.n + ' chord diagram">');

    // nut or base-fret marker
    if (base === 1) {
      out.push('<rect x="' + padX + '" y="' + (padTop - 5) + '" width="' + gw + '" height="5" rx="1.5" fill="' + C.nut + '"/>');
    } else {
      out.push('<text x="' + (padX - 7) + '" y="' + (padTop + fy * 0.68) + '" font-size="10" fill="' + C.nut + '" text-anchor="end" font-weight="700">' + base + '</text>');
    }

    // frets
    for (var i = 0; i <= F; i++) {
      out.push('<line x1="' + padX + '" y1="' + (padTop + i * fy) + '" x2="' + (padX + gw) +
        '" y2="' + (padTop + i * fy) + '" stroke="' + C.fret + '" stroke-width="1"/>');
    }
    // strings
    for (var s = 0; s < S; s++) {
      out.push('<line x1="' + (padX + s * sx) + '" y1="' + padTop + '" x2="' + (padX + s * sx) +
        '" y2="' + (padTop + gh) + '" stroke="' + C.string + '" stroke-width="1"/>');
    }

    // barre
    if (ch.barre) {
      var br = ch.barre.fret - base;
      var x1 = padX + ch.barre.from * sx, x2 = padX + ch.barre.to * sx;
      out.push('<rect x="' + (x1 - 6) + '" y="' + (padTop + br * fy + fy / 2 - 6) + '" width="' + (x2 - x1 + 12) +
        '" height="12" rx="6" fill="' + C.barre + '"/>');
    }

    // dots + open/muted markers
    for (var st = 0; st < S; st++) {
      var fr = ch.f[st];
      var x = padX + st * sx;
      if (fr === -1) {
        out.push('<g stroke="' + C.mute + '" stroke-width="1.6" stroke-linecap="round">' +
          '<line x1="' + (x - 3.6) + '" y1="' + (padTop - 15) + '" x2="' + (x + 3.6) + '" y2="' + (padTop - 8) + '"/>' +
          '<line x1="' + (x + 3.6) + '" y1="' + (padTop - 15) + '" x2="' + (x - 3.6) + '" y2="' + (padTop - 8) + '"/></g>');
      } else if (fr === 0) {
        out.push('<circle cx="' + x + '" cy="' + (padTop - 11.5) + '" r="3.6" fill="none" stroke="' + C.open + '" stroke-width="1.6"/>');
      } else {
        var rel = fr - base;
        var cy = padTop + rel * fy + fy / 2;
        var isBarre = ch.barre && ch.barre.fret === fr && st >= ch.barre.from && st <= ch.barre.to;
        if (!isBarre) {
          out.push('<circle cx="' + x + '" cy="' + cy + '" r="7" fill="' + C.dot + '"/>');
        }
        var fing = ch.d && ch.d[st];
        if (fing) out.push('<text x="' + x + '" y="' + (cy + 3.4) + '" font-size="9" font-weight="700" fill="' + C.fing + '" text-anchor="middle">' + fing + '</text>');
      }
    }
    out.push('</svg>');
    return out.join('');
  }

  (function renderChords() {
    var grid = $('#chordgrid');
    if (!grid) return;
    var paint = function () { grid.innerHTML = CHORDS.map(function (ch) {
      return '<div class="chordcard" data-cat="' + ch.c + '">' +
        '<div class="chordcard__name">' + ch.n + '</div>' +
        chordSVG(ch) +
        (ch.alias ? '<div class="chordcard__hint">' + ch.alias + '</div>' : '') +
      '</div>';
    }).join(''); };
    paint();
    window.addEventListener('trgc:theme', paint);

    var btns = $$('[data-chordfilter]');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-chordfilter');
        btns.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        $$('.chordcard', grid).forEach(function (c) {
          c.classList.toggle('is-hidden', v !== 'all' && c.getAttribute('data-cat') !== v);
        });
      });
    });
  })();

  /* =========================================================
     CIRCLE OF FIFTHS
     ========================================================= */
  var KEYS = [
    { maj:'C',  min:'Am',  pc:0,  sig:'no sharps, no flats',
      dia:['C','Dm','Em','F','G','Am','B°'] },
    { maj:'G',  min:'Em',  pc:7,  sig:'1 sharp — F♯',
      dia:['G','Am','Bm','C','D','Em','F♯°'] },
    { maj:'D',  min:'Bm',  pc:2,  sig:'2 sharps — F♯ C♯',
      dia:['D','Em','F♯m','G','A','Bm','C♯°'] },
    { maj:'A',  min:'F♯m', pc:9,  sig:'3 sharps — F♯ C♯ G♯',
      dia:['A','Bm','C♯m','D','E','F♯m','G♯°'] },
    { maj:'E',  min:'C♯m', pc:4,  sig:'4 sharps — F♯ C♯ G♯ D♯',
      dia:['E','F♯m','G♯m','A','B','C♯m','D♯°'] },
    { maj:'B',  min:'G♯m', pc:11, sig:'5 sharps — F♯ C♯ G♯ D♯ A♯',
      dia:['B','C♯m','D♯m','E','F♯','G♯m','A♯°'] },
    { maj:'G♭', min:'E♭m', pc:6,  sig:'6 flats — B♭ E♭ A♭ D♭ G♭ C♭  (= F♯, 6 sharps)',
      dia:['G♭','A♭m','B♭m','C♭','D♭','E♭m','F°'] },
    { maj:'D♭', min:'B♭m', pc:1,  sig:'5 flats — B♭ E♭ A♭ D♭ G♭',
      dia:['D♭','E♭m','Fm','G♭','A♭','B♭m','C°'] },
    { maj:'A♭', min:'Fm',  pc:8,  sig:'4 flats — B♭ E♭ A♭ D♭',
      dia:['A♭','B♭m','Cm','D♭','E♭','Fm','G°'] },
    { maj:'E♭', min:'Cm',  pc:3,  sig:'3 flats — B♭ E♭ A♭',
      dia:['E♭','Fm','Gm','A♭','B♭','Cm','D°'] },
    { maj:'B♭', min:'Gm',  pc:10, sig:'2 flats — B♭ E♭',
      dia:['B♭','Cm','Dm','E♭','F','Gm','A°'] },
    { maj:'F',  min:'Dm',  pc:5,  sig:'1 flat — B♭',
      dia:['F','Gm','Am','B♭','C','Dm','E°'] }
  ];
  var SHAPE_KEYS = [{ n:'C', pc:0 }, { n:'A', pc:9 }, { n:'G', pc:7 }, { n:'E', pc:4 }, { n:'D', pc:2 }];
  var OPEN_FRIENDLY = ['C','G','D','A','E','F','B♭'];

  (function circleOfFifths() {
    var svg = $('#cof');
    if (!svg) return;

    var NS = 'http://www.w3.org/2000/svg';
    var CX = 200, CY = 200;
    var R = { out: 192, mid: 138, in: 92, hub: 52 };
    var sel = 0;

    function pt(r, a) {
      var rad = (a - 90) * Math.PI / 180;
      return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
    }
    function seg(r1, r2, a1, a2) {
      var p1 = pt(r2, a1), p2 = pt(r2, a2), p3 = pt(r1, a2), p4 = pt(r1, a1);
      var large = (a2 - a1) > 180 ? 1 : 0;
      return 'M' + p1 + 'A' + r2 + ',' + r2 + ' 0 ' + large + ' 1 ' + p2 +
             'L' + p3 + 'A' + r1 + ',' + r1 + ' 0 ' + large + ' 0 ' + p4 + 'Z';
    }
    function el(tag, attrs, text) {
      var e = document.createElementNS(NS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      if (text != null) e.textContent = text;
      return e;
    }

    function draw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var step = 30;
      var C = {
        maj: tok('--cof-maj'), majCore: tok('--cof-maj-core'), majSel: tok('--cof-maj-sel'),
        min: tok('--cof-min'), minCore: tok('--cof-min-core'), minSel: tok('--cof-min-sel'),
        txt: tok('--cof-txt'), txtCore: tok('--cof-txt-core'), txtSel: tok('--cof-txt-sel'),
        txtMin: tok('--cof-txt-min'), hub: tok('--cof-hub'), hubLine: tok('--cof-hub-line'),
        hubLbl: tok('--cof-hub-lbl'), gap: tok('--cof-gap'), label: tok('--accent-label')
      };

      KEYS.forEach(function (k, i) {
        var a1 = i * step - 15, a2 = a1 + step, mid = a1 + step / 2;
        var rel = (i - sel + 12) % 12;
        // roles relative to selected key
        var role = rel === 0 ? 'I' : rel === 1 ? 'V' : rel === 11 ? 'IV' : '';
        var isCore = rel === 0 || rel === 1 || rel === 11;

        // ---- major ring
        var majFill = rel === 0 ? C.majSel : isCore ? C.majCore : C.maj;
        var g = el('g', { class: 'seg', role: 'button', tabindex: '0',
          'aria-label': 'Select the key of ' + k.maj + ' major' });
        g.appendChild(el('path', { d: seg(R.mid, R.out, a1, a2), fill: majFill, stroke: C.gap, 'stroke-width': '2' }));
        var mp = pt((R.mid + R.out) / 2, mid);
        g.appendChild(el('text', { x: mp[0], y: mp[1] + 7,
          'text-anchor': 'middle', 'font-size': rel === 0 ? '25' : '21',
          fill: rel === 0 ? C.txtSel : isCore ? C.txtCore : C.txt }, k.maj));
        g.addEventListener('click', function () { sel = i; draw(); readout(); });
        g.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sel = i; draw(); readout(); }
        });
        svg.appendChild(g);

        // ---- minor ring
        var minFill = rel === 0 ? C.minSel : isCore ? C.minCore : C.min;
        var gm = el('g', { class: 'seg', role: 'button', tabindex: '0',
          'aria-label': 'Select the relative key of ' + k.min });
        gm.appendChild(el('path', { d: seg(R.in, R.mid, a1, a2), fill: minFill, stroke: C.gap, 'stroke-width': '2' }));
        var np = pt((R.in + R.mid) / 2, mid);
        gm.appendChild(el('text', { x: np[0], y: np[1] + 5,
          'text-anchor': 'middle', 'font-size': '15',
          fill: rel === 0 ? C.txtSel : C.txtMin }, k.min));
        gm.addEventListener('click', function () { sel = i; draw(); readout(); });
        svg.appendChild(gm);

        // ---- degree label ring
        if (role) {
          var rp = pt(R.out + 14, mid);
          svg.appendChild(el('text', { x: rp[0], y: rp[1] + 5, 'text-anchor': 'middle',
            'font-size': '15', 'font-weight': '700', fill: C.label }, role));
        }
      });

      // hub
      svg.appendChild(el('circle', { cx: CX, cy: CY, r: R.hub, fill: C.hub, stroke: C.hubLine, 'stroke-width': '2' }));
      svg.appendChild(el('text', { x: CX, y: CY - 4, 'text-anchor': 'middle', 'font-size': '13',
        fill: C.hubLbl, 'letter-spacing': '2' }, 'KEY OF'));
      svg.appendChild(el('text', { x: CX, y: CY + 20, 'text-anchor': 'middle', 'font-size': '24',
        'font-weight': '800', fill: C.label }, KEYS[sel].maj));
    }

    function readout() {
      var k = KEYS[sel];
      var nums = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
      var keyEl = $('#cof-key'), sigEl = $('#cof-sig'), degEl = $('#cof-degrees'),
          proEl = $('#cof-progs'), capEl = $('#cof-capo');
      if (keyEl) keyEl.textContent = k.maj + ' major  /  ' + k.min;
      if (sigEl) sigEl.textContent = k.sig;
      if (degEl) degEl.innerHTML = k.dia.map(function (c, i) {
        return '<div class="degree"><div class="degree__num">' + nums[i] + '</div>' +
               '<div class="degree__chord">' + c + '</div></div>';
      }).join('');
      if (proEl) {
        var d = k.dia;
        var rows = [
          ['The four chords', [d[0], d[4], d[5], d[3]], 'I – V – vi – IV'],
          ['Sad-then-hopeful', [d[5], d[3], d[0], d[4]], 'vi – IV – I – V'],
          ['50s / doo-wop', [d[0], d[5], d[3], d[4]], 'I – vi – IV – V'],
          ['Blues (12 bar)', [d[0], d[3], d[4]], 'I – IV – V'],
          ['Jazz turnaround', [d[1], d[4], d[0]], 'ii – V – I'],
          ['Andalusian drop', [d[5], d[4], d[3], d[2]], 'vi – V – IV – iii']
        ];
        proEl.innerHTML = rows.map(function (r) {
          return '<div class="prog"><span class="prog__name">' + r[0] + '</span>' +
                 '<span class="prog__chords">' + r[1].join('  –  ') + '</span>' +
                 '<span class="prog__name" style="min-width:auto;opacity:.6">' + r[2] + '</span></div>';
        }).join('');
      }
      if (capEl) {
        if (OPEN_FRIENDLY.indexOf(k.maj) > -1 && k.maj !== 'B♭') {
          capEl.innerHTML = '<strong class="sand">No capo needed.</strong> ' + k.maj +
            ' sits right in the open chords — this is one of the friendliest keys on a guitar.';
        } else {
          var opts = SHAPE_KEYS.map(function (s) {
            return { n: s.n, c: (k.pc - s.pc + 12) % 12 };
          }).filter(function (o) { return o.c >= 1 && o.c <= 7; })
            .sort(function (a, b) { return a.c - b.c; }).slice(0, 3);
          capEl.innerHTML = opts.length
            ? '<strong class="sand">Capo trick:</strong> ' + opts.map(function (o) {
                return 'capo <b>' + o.c + '</b> and play <b>' + o.n + '</b> shapes';
              }).join(' · ') + '. Same sound, easier hands.'
            : 'This key wants barre chords. Build the shape from the low E or A string root.';
        }
      }
    }

    draw();
    readout();
    window.addEventListener('trgc:theme', draw);
  })();

  /* =========================================================
     CALENDAR — renders from window.TRGC_EVENTS
     ========================================================= */
  (function calendar() {
    var host = $('#events');
    if (!host || !window.TRGC_EVENTS) return;

    var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var today = new Date(); today.setHours(0, 0, 0, 0);

    var items = window.TRGC_EVENTS.slice().sort(function (a, b) {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date + 'T12:00:00') - new Date(b.date + 'T12:00:00');
    });

    host.innerHTML = items.map(function (e) {
      var past = false, dateBlock;
      if (e.date) {
        var d = new Date(e.date + 'T12:00:00');
        past = d < today;
        dateBlock = '<div class="event__mo">' + MONTHS[d.getMonth()] + '</div>' +
                    '<div class="event__dy">' + d.getDate() + '</div>';
      } else {
        dateBlock = '<div class="event__tba">Date<br>TBA</div>';
      }
      var cls = 'event' + (past ? ' event--past' : '') + (e.highlight && !past ? ' event--highlight' : '');
      return '<li class="' + cls + '">' +
        '<div class="event__date">' + dateBlock + '</div>' +
        '<div><div class="event__title">' + e.title +
          (e.badge ? '<span class="event__badge">' + e.badge + '</span>' : '') + '</div>' +
          '<div class="event__meta">' + (e.meta || '') + '</div></div>' +
      '</li>';
    }).join('');
  })();

  /* Expose the diagram renderer + chord library so the Progression Prepper
     can draw the same shapes students already see on Play Along. */
  window.TRGC = window.TRGC || {};
  window.TRGC.chordSVG = chordSVG;
  window.TRGC.CHORDS = CHORDS;

})();
