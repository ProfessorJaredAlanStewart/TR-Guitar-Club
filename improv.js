/* ============================================================
   Trinity River Guitar Club — Improv a Solo
   Draws every fretboard on improv.html as inline SVG.
   No dependencies. Load with <script src="improv.js" defer>.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- music data ---------- */
  var NAMES_SHARP = ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  var NAMES_FLAT  = ['C','D♭','D','E♭','E','F','G♭','G','A♭','A','B♭','B'];
  var NAMES_BOTH  = ['C','C♯/D♭','D','D♯/E♭','E','F','F♯/G♭','G','G♯/A♭','A','A♯/B♭','B'];
  var KEY_LABELS  = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
  var TUNING = [4, 9, 2, 7, 11, 4];       // pitch classes, low E → high e
  var STRING_LABELS = ['E','A','D','G','B','e'];
  var MINOR_PENT = [0, 3, 5, 7, 10];      // 1 ♭3 4 5 ♭7
  var BLUE_MINOR = 6;                     // ♭5
  var INT_MINOR = {0:'1', 3:'♭3', 5:'4', 6:'♭5', 7:'5', 10:'♭7'};
  var INT_MAJOR = {0:'1', 2:'2', 3:'♭3', 4:'3', 7:'5', 9:'6'};
  var POS_COLORS = ['#00788a', '#0b4a91', '#7a5c14', '#6a3d9a', '#2e7d32'];
  var ROOT = '#98002e';
  var INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];

  function mod(n, m) { return ((n % m) + m) % m; }
  function noteAt(s, f) { return mod(TUNING[s] + f, 12); }

  /* ---------- svg helpers ---------- */
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent, x, y, s, attrs) {
    var t = el('text', Object.assign({x: x, y: y, 'text-anchor': 'middle', 'dominant-baseline': 'central'}, attrs || {}), parent);
    t.textContent = s;
    return t;
  }

  /* Generic horizontal neck.
     opts: {from, to, fw (fret width), sh (string gap), label (bool fret numbers), nut (bool)}
     returns {svg, x(f) center-x of fret slot, y(s) string y, g layers} */
  function neck(opts) {
    var from = opts.from, to = opts.to;
    var fw = opts.fw || 64, sh = opts.sh || 30;
    var padL = 46, padR = 22, padT = opts.top || 26, padB = opts.label === false ? 18 : 40;
    var slots = to - Math.max(from, 1) + 1;          // fretted slots drawn
    var openW = from === 0 ? fw * 0.9 : 0;           // space left of the nut for open notes
    var W = padL + openW + slots * fw + padR;
    var H = padT + sh * 5 + padB;
    var svg = el('svg', {viewBox: '0 0 ' + W + ' ' + H, width: '100%', role: 'img', 'class': 'fb'});
    svg.style.maxWidth = W + 'px';
    var nutX = padL + openW;
    var x = function (f) { return f === 0 ? padL + openW * 0.42 : nutX + (f - Math.max(from, 1) + 0.5) * fw; };
    var y = function (s) { return padT + (5 - s) * sh; };     // low E at bottom
    var board = el('g', {}, svg);
    // wood
    el('rect', {x: nutX, y: padT - 10, width: slots * fw, height: sh * 5 + 20, rx: 4, 'class': 'fb__wood'}, board);
    // inlays
    for (var f = Math.max(from, 1); f <= to; f++) {
      if (INLAYS.indexOf(f) > -1) el('circle', {cx: x(f), cy: padT + sh * 2.5, r: 5, 'class': 'fb__inlay'}, board);
      if (f === 12 || f === 24) {
        el('circle', {cx: x(f), cy: padT + sh * 1.5, r: 5, 'class': 'fb__inlay'}, board);
        el('circle', {cx: x(f), cy: padT + sh * 3.5, r: 5, 'class': 'fb__inlay'}, board);
      }
    }
    // frets
    for (f = Math.max(from, 1); f <= to; f++) {
      el('line', {x1: nutX + (f - Math.max(from, 1) + 1) * fw, y1: padT - 10, x2: nutX + (f - Math.max(from, 1) + 1) * fw, y2: padT + sh * 5 + 10, 'class': 'fb__fret'}, board);
    }
    // nut or leading fret
    el('rect', {x: nutX - (from === 0 ? 5 : 1), y: padT - 10, width: from === 0 ? 6 : 2, height: sh * 5 + 20, 'class': from === 0 ? 'fb__nut' : 'fb__fret'}, board);
    // strings
    for (var s = 0; s < 6; s++) {
      el('line', {x1: nutX - (from === 0 ? 5 : 0), y1: y(s), x2: nutX + slots * fw, y2: y(s), 'class': 'fb__string', 'stroke-width': (2.6 - s * 0.32).toFixed(2)}, board);
      txt(svg, 20, y(s), STRING_LABELS[s], {'class': 'fb__slabel'});
    }
    // fret numbers
    if (opts.label !== false) {
      for (f = Math.max(from, 1); f <= to; f++) txt(svg, x(f), H - 14, String(f), {'class': 'fb__fnum' + (INLAYS.indexOf(f) > -1 || f === 12 ? ' is-dot' : '')});
    }
    var bands = el('g', {}, svg);     // position highlight bands sit under dots
    var dots = el('g', {}, svg);
    return {svg: svg, x: x, y: y, fw: fw, sh: sh, nutX: nutX, padT: padT, bands: bands, dots: dots, W: W, H: H};
  }

  function dot(n, s, f, opts) {
    var g = el('g', {'class': 'fb__dot' + (opts.cls ? ' ' + opts.cls : '')}, n.dots);
    var r = opts.r || 11.5;
    var c = el('circle', {cx: n.x(f), cy: n.y(s), r: r}, g);
    if (opts.fill) c.setAttribute('fill', opts.fill);
    if (opts.stroke) { c.setAttribute('stroke', opts.stroke); c.setAttribute('stroke-width', 2); }
    if (opts.label) txt(g, n.x(f), n.y(s) + 0.5, opts.label, {'class': 'fb__dlabel', fill: opts.labelColor || '#fff', 'font-size': opts.label.length > 2 ? 9 : 11});
    if (opts.title) { var t = el('title', {}, g); t.textContent = opts.title; }
    return g;
  }

  /* ============================================================
     1. ROOT NOTES ON THE E AND A STRINGS
     ============================================================ */
  function buildRoots() {
    var host = document.getElementById('roots-neck');
    var picker = document.getElementById('roots-picker');
    if (!host) return;
    var selected = -1;   // pitch class

    function render() {
      host.innerHTML = '';
      var n = neck({from: 0, to: 12, fw: 78, sh: 36});
      // dim the four strings we're not talking about
      for (var s = 2; s < 6; s++) {
        el('rect', {x: n.nutX - 6, y: n.y(s) - n.sh * 0.45, width: 12 * n.fw + 8, height: n.sh * 0.9, 'class': 'fb__fade'}, n.bands);
      }
      for (s = 0; s < 2; s++) {
        for (var f = 0; f <= 12; f++) {
          var pc = noteAt(s, f);
          var natural = NAMES_SHARP[pc].length === 1;
          var isSel = selected === pc;
          var fill = isSel ? ROOT : (natural ? 'var(--text-strong)' : 'var(--surface)');
          var lc = isSel ? '#fff' : (natural ? 'var(--page-solid)' : 'var(--text-dim)');
          var label = natural ? NAMES_SHARP[pc] : NAMES_SHARP[pc].slice(1) === '♯' ? NAMES_SHARP[pc] + '\n' : NAMES_SHARP[pc];
          var g = dot(n, s, f, {
            r: natural ? 15 : 14, fill: fill, stroke: natural ? null : 'var(--line-hover)',
            label: natural ? NAMES_SHARP[pc] : '', labelColor: lc,
            title: NAMES_BOTH[pc] + ' — ' + STRING_LABELS[s] + ' string, fret ' + f,
            cls: (natural ? 'is-natural' : 'is-accidental') + (isSel ? ' is-sel' : '')
          });
          if (!natural) {
            // two-line label: sharp over flat
            txt(g, n.x(f), n.y(s) - 5.5, NAMES_SHARP[pc], {'class': 'fb__dlabel', fill: lc, 'font-size': 9.5});
            txt(g, n.x(f), n.y(s) + 6, NAMES_FLAT[pc], {'class': 'fb__dlabel', fill: lc, 'font-size': 9.5});
          }
          if (isSel) {
            Array.prototype.forEach.call(n.svg.querySelectorAll('.fb__fnum'), function (t) { if (t.textContent === String(f)) t.setAttribute('class', 'fb__fnum is-sel'); });
            if (f === 0) txt(n.svg, n.x(0), n.H - 14, 'open', {'class': 'fb__fnum is-sel'});
          }
        }
      }
      host.appendChild(n.svg);
    }

    // picker buttons
    if (picker) {
      var order = [4,5,6,7,8,9,10,11,0,1,2,3]; // E → D♯, the order they appear on the E string
      order.forEach(function (pc) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'filter filter--note'; b.textContent = NAMES_BOTH[pc];
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () {
          selected = selected === pc ? -1 : pc;
          Array.prototype.forEach.call(picker.children, function (c) { c.setAttribute('aria-pressed', 'false'); });
          if (selected > -1) b.setAttribute('aria-pressed', 'true');
          var out = document.getElementById('roots-readout');
          if (out) {
            if (selected < 0) out.textContent = 'Tap a note to light it up on both strings.';
            else {
              var fe = mod(pc - 4, 12), fa = mod(pc - 9, 12);
              out.innerHTML = '<b class="sand">' + NAMES_BOTH[pc] + '</b> lives at fret <b>' + fe + '</b> on the E string' + (fe === 0 ? ' (open)' : '') +
                ' and fret <b>' + fa + '</b> on the A string' + (fa === 0 ? ' (open)' : '') + '. Both repeat twelve frets higher.';
            }
          }
          render();
        });
        picker.appendChild(b);
      });
    }
    render();
  }

  /* ============================================================
     2. PENTATONIC — every position
     ============================================================ */
  function buildPent() {
    var full = document.getElementById('pent-full');
    var boxes = document.getElementById('pent-boxes');
    var keyRow = document.getElementById('pent-keys');
    var posRow = document.getElementById('pent-positions');
    if (!full || !boxes) return;

    var state = { key: 9, mode: 'minor', labels: 'dot', blue: false, pos: 0 }; // pos 0 = all

    /* scale math ------------------------------------------------ */
    function minorRoot() { return state.mode === 'minor' ? state.key : mod(state.key - 3, 12); }
    function scalePCs() {
      var m = minorRoot();
      var pcs = MINOR_PENT.map(function (i) { return mod(m + i, 12); });
      if (state.blue) pcs.push(mod(m + BLUE_MINOR, 12));
      return pcs;
    }
    function isBlue(pc) { return state.blue && pc === mod(minorRoot() + BLUE_MINOR, 12); }
    function isRoot(pc) { return pc === state.key; }
    function intervalOf(pc) {
      var off = mod(pc - state.key, 12);
      return (state.mode === 'minor' ? INT_MINOR : INT_MAJOR)[off] || '';
    }
    function labelFor(pc) {
      if (state.labels === 'name') return NAMES_SHARP[pc].replace('♯', '♯');
      if (state.labels === 'int') return intervalOf(pc);
      return isRoot(pc) ? 'R' : '';
    }
    /* The five positions. On every string, position p uses the p-th consecutive
       pair of scale notes counting from the first one at or above the low-E root fret.
       That single rule generates the standard five boxes in any key. */
    function positions() {
      var m = minorRoot();
      var r = mod(m - 4, 12);                 // minor root fret on low E
      var pcs = scalePCs();
      var core = MINOR_PENT.map(function (i) { return mod(m + i, 12); }); // positions are built on the 5 core notes
      var perString = [];
      for (var s = 0; s < 6; s++) {
        var fr = [];
        for (var f = 0; f <= 27; f++) if (core.indexOf(noteAt(s, f)) > -1) fr.push(f);
        perString.push(fr);
      }
      var out = [];
      for (var p = 0; p < 5; p++) {
        var notes = [], min = 99, max = -1;
        for (s = 0; s < 6; s++) {
          var fr = perString[s];
          var i0 = 0; while (fr[i0] < r) i0++;
          var a = fr[i0 + p], b = fr[i0 + p + 1];
          notes.push([s, a]); notes.push([s, b]);
          min = Math.min(min, a, b); max = Math.max(max, a, b);
        }
        // Keep everything on a 0–15 fret map: drop an octave when a box runs off the end.
        var shift = 0;
        while (max + shift > 15) shift -= 12;
        notes = notes.map(function (n) { return [n[0], n[1] + shift]; });
        var pos = {n: p + 1, notes: notes, min: min + shift, max: max + shift, color: POS_COLORS[p]};
        // blue notes inside this box's window, one per string where it lands
        if (state.blue) {
          var blueNotes = [];
          var bpc = mod(m + BLUE_MINOR, 12);
          for (s = 0; s < 6; s++) {
            var lo = notes[s * 2][1], hi = notes[s * 2 + 1][1];
            for (f = lo; f <= hi; f++) if (noteAt(s, f) === bpc) blueNotes.push([s, f]);
          }
          pos.blue = blueNotes;
        }
        out.push(pos);
      }
      return out;
    }

    /* full-neck view --------------------------------------------- */
    function renderFull() {
      full.innerHTML = '';
      var n = neck({from: 0, to: 15, fw: 66, sh: 33});
      var poss = positions();
      var pcs = scalePCs();
      var sel = state.pos;
      // bands
      poss.forEach(function (p) {
        var active = sel === 0 || sel === p.n;
        var x1 = p.min === 0 ? n.nutX - n.fw * 0.9 : n.nutX + (p.min - 1) * n.fw;
        var x2 = n.nutX + p.max * n.fw;
        var rect = el('rect', {x: x1 + 2, y: n.padT - 16, width: x2 - x1 - 4, height: n.sh * 5 + 32, rx: 8, fill: p.color, 'class': 'fb__band' + (active ? '' : ' is-off')}, n.bands);
        var t = el('title', {}, rect); t.textContent = 'Position ' + p.n;
        txt(n.svg, (x1 + x2) / 2, 11, 'POS ' + p.n, {'class': 'fb__bandlbl' + (active ? '' : ' is-off'), fill: p.color});
      });
      // membership lookup: which positions contain [s,f]
      var member = {};
      poss.forEach(function (p) {
        p.notes.concat(p.blue || []).forEach(function (nf) { var k = nf[0] + ':' + nf[1]; (member[k] = member[k] || []).push(p.n); });
      });
      for (var s = 0; s < 6; s++) {
        for (var f = 0; f <= 15; f++) {
          var pc = noteAt(s, f);
          if (pcs.indexOf(pc) < 0) continue;
          var k = s + ':' + f, inSel = sel === 0 ? !!member[k] : (member[k] || []).indexOf(sel) > -1;
          var root = isRoot(pc), blue = isBlue(pc);
          var fill = root ? ROOT : blue ? 'var(--surface)' : (sel ? POS_COLORS[sel - 1] : 'var(--text-strong)');
          var stroke = blue ? (root ? null : 'var(--text-strong)') : null;
          var lab = labelFor(pc);
          dot(n, s, f, {
            fill: fill, stroke: stroke, label: lab, labelColor: blue ? 'var(--text-strong)' : '#fff',
            r: 12.5, cls: (inSel ? '' : 'is-faint') + (root ? ' is-root' : ''),
            title: NAMES_BOTH[pc] + (root ? ' (root)' : blue ? ' (blue note)' : '') + ' — fret ' + f
          });
        }
      }
      full.appendChild(n.svg);
      var cap = document.getElementById('pent-caption');
      if (cap) {
        var keyName = KEY_LABELS[state.key] + ' ' + state.mode;
        cap.innerHTML = sel === 0
          ? '<b class="sand">' + keyName + ' pentatonic</b>, whole neck. Crimson dots are the root (' + KEY_LABELS[state.key] + '). Shaded bands are the five positions; where two bands touch, the notes belong to both.'
          : '<b class="sand">Position ' + sel + '</b> of ' + keyName + ' pentatonic, frets ' + poss[sel - 1].min + '–' + poss[sel - 1].max + '. Every other scale note is faded so you can see where this box sits.';
      }
    }

    /* the five boxes ---------------------------------------------- */
    function renderBoxes() {
      boxes.innerHTML = '';
      var poss = positions();
      poss.forEach(function (p) {
        var card = document.createElement('div');
        card.className = 'posbox' + (state.pos === p.n ? ' is-sel' : '');
        card.style.setProperty('--pc', p.color);
        var h = document.createElement('div'); h.className = 'posbox__head';
        h.innerHTML = '<span class="posbox__num">' + p.n + '</span><span class="posbox__title">Position ' + p.n + (p.n === 1 ? ' <span class="posbox__tag">the box</span>' : '') + '</span><span class="posbox__frets">frets ' + p.min + '–' + p.max + '</span>';
        card.appendChild(h);
        var from = Math.max(0, p.min - (p.min === 0 ? 0 : 0));
        var to = Math.max(p.max, p.min + 3);
        if (p.min > 0 && to - p.min < 4) to = p.min + 4 - 1; // at least 4 slots wide
        var n = neck({from: from === 0 ? 0 : from, to: to, fw: 54, sh: 28});
        // faint dots for scale notes in window that aren't in this box (helps show overlap)
        var pcs = scalePCs();
        var inBox = {};
        p.notes.concat(p.blue || []).forEach(function (nf) { inBox[nf[0] + ':' + nf[1]] = true; });
        for (var s = 0; s < 6; s++) for (var f = from; f <= to; f++) {
          var pc = noteAt(s, f);
          if (pcs.indexOf(pc) < 0) continue;
          var k = s + ':' + f;
          var root = isRoot(pc), blue = isBlue(pc);
          if (inBox[k]) {
            dot(n, s, f, {fill: root ? ROOT : blue ? 'var(--surface)' : p.color, stroke: blue && !root ? 'var(--text-strong)' : null,
              label: labelFor(pc), labelColor: blue && !root ? 'var(--text-strong)' : '#fff', r: 11,
              title: NAMES_BOTH[pc] + (root ? ' (root)' : '') + ' — fret ' + f});
          } else {
            dot(n, s, f, {fill: 'var(--text-faint)', r: 5, cls: 'is-ghost', title: NAMES_BOTH[pc] + ' (next box) — fret ' + f});
          }
        }
        var wrap = document.createElement('div'); wrap.className = 'posbox__neck'; wrap.appendChild(n.svg);
        card.appendChild(wrap);
        card.addEventListener('click', function () { setPos(state.pos === p.n ? 0 : p.n); });
        boxes.appendChild(card);
      });
    }

    function setPos(p) {
      state.pos = p;
      if (posRow) Array.prototype.forEach.call(posRow.querySelectorAll('[data-pos]'), function (b) {
        b.setAttribute('aria-pressed', String(Number(b.getAttribute('data-pos')) === p));
      });
      renderFull(); renderBoxes();
    }
    function renderAll() { renderFull(); renderBoxes(); updateKeyLine(); }

    function updateKeyLine() {
      var line = document.getElementById('pent-keyline');
      if (!line) return;
      var m = minorRoot(), M = mod(m + 3, 12);
      var r = mod(state.key - 4, 12);
      if (state.mode === 'minor') {
        line.innerHTML = '<b>' + KEY_LABELS[state.key] + ' minor pentatonic</b> — notes ' + MINOR_PENT.map(function (i) { return NAMES_SHARP[mod(m + i, 12)]; }).join(' · ') +
          '. Position 1 starts at fret <b>' + r + '</b> on the low E string. Same shapes give you <b>' + KEY_LABELS[M] + ' major</b> pentatonic; just treat ' + KEY_LABELS[M] + ' as home.';
      } else {
        line.innerHTML = '<b>' + KEY_LABELS[state.key] + ' major pentatonic</b> — notes ' + [0,2,4,7,9].map(function (i) { return NAMES_SHARP[mod(state.key + i, 12)]; }).join(' · ') +
          '. These are the exact same shapes as <b>' + KEY_LABELS[m] + ' minor</b> pentatonic, three frets lower than ' + KEY_LABELS[state.key] + ' minor would sit. The root moved; your fingers didn\'t.';
      }
    }

    /* controls ------------------------------------------------------- */
    if (keyRow) {
      KEY_LABELS.forEach(function (lab, pc) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'filter filter--note'; b.textContent = lab;
        b.setAttribute('data-key', pc); b.setAttribute('aria-pressed', String(pc === state.key));
        b.addEventListener('click', function () {
          state.key = pc;
          Array.prototype.forEach.call(keyRow.children, function (c) { c.setAttribute('aria-pressed', String(Number(c.getAttribute('data-key')) === pc)); });
          renderAll();
        });
        keyRow.appendChild(b);
      });
    }
    if (posRow) {
      Array.prototype.forEach.call(posRow.querySelectorAll('[data-pos]'), function (b) {
        b.addEventListener('click', function () { setPos(Number(b.getAttribute('data-pos'))); });
      });
    }
    var modeRow = document.getElementById('pent-mode');
    if (modeRow) Array.prototype.forEach.call(modeRow.querySelectorAll('[data-mode]'), function (b) {
      b.addEventListener('click', function () {
        state.mode = b.getAttribute('data-mode');
        Array.prototype.forEach.call(modeRow.querySelectorAll('[data-mode]'), function (c) { c.setAttribute('aria-pressed', String(c === b)); });
        renderAll();
      });
    });
    var labRow = document.getElementById('pent-labels');
    if (labRow) Array.prototype.forEach.call(labRow.querySelectorAll('[data-labels]'), function (b) {
      b.addEventListener('click', function () {
        state.labels = b.getAttribute('data-labels');
        Array.prototype.forEach.call(labRow.querySelectorAll('[data-labels]'), function (c) { c.setAttribute('aria-pressed', String(c === b)); });
        renderAll();
      });
    });
    var blue = document.getElementById('pent-blue');
    if (blue) blue.addEventListener('change', function () { state.blue = blue.checked; renderAll(); });

    renderAll();
  }

  /* ============================================================
     3. BENDING — the classic bends inside the A minor box
     ============================================================ */
  function buildBends() {
    var host = document.getElementById('bend-neck');
    if (!host) return;
    var n = neck({from: 5, to: 10, fw: 76, sh: 40, top: 30});
    var box = [[0,5],[0,8],[1,5],[1,7],[2,5],[2,7],[3,5],[3,7],[4,5],[4,8],[5,5],[5,8]];
    box.forEach(function (nf) {
      var pc = noteAt(nf[0], nf[1]);
      dot(n, nf[0], nf[1], {fill: pc === 9 ? ROOT : 'var(--text-strong)', label: pc === 9 ? 'R' : NAMES_SHARP[pc], r: 12.5});
    });
    // numbered to match the list under the diagram
    var bends = [
      {s: 3, f: 7, to: 9},      // 1  D → E, whole
      {s: 4, f: 8, to: 10},     // 2  G → A, whole
      {s: 5, f: 8, to: 10},     // 3  C → D, whole
      {s: 1, f: 5, to: 6},      // 4  D → E♭, half (blue note)
      {s: 3, f: 5, to: 5.4}     // 5  C, quarter curl
    ];
    var defs = el('defs', {}, n.svg);
    var m = el('marker', {id: 'bend-arrow', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse'}, defs);
    el('path', {d: 'M0 0 L10 5 L0 10 z', fill: ROOT}, m);
    var arrows = el('g', {}, n.svg);
    bends.forEach(function (b, i) {
      var x1 = n.x(b.f), y0 = n.y(b.s);
      var x2 = n.nutX + (b.to - 5 + 0.5) * n.fw;
      var whole = b.to % 1 === 0;
      if (whole) el('circle', {cx: x2, cy: y0, r: 12.5, fill: 'none', stroke: ROOT, 'stroke-width': 2, 'stroke-dasharray': '4 3'}, arrows);
      // shallow arc riding just above the string, ending at the target
      var bow = whole ? 14 : 9;
      var d = b.to - b.f < 0.5
        ? 'M' + (x1 + 10) + ' ' + (y0 - 9) + ' q 9 -14 24 -12'
        : 'M' + (x1 + 13) + ' ' + (y0 - 3) + ' Q ' + ((x1 + x2) / 2) + ' ' + (y0 - bow - 6) + ' ' + (x2 - (whole ? 14 : 4)) + ' ' + (y0 - 4);
      el('path', {d: d, fill: 'none', stroke: ROOT, 'stroke-width': 2.4, 'marker-end': 'url(#bend-arrow)'}, arrows);
      // numbered badge, upper-left of the source note
      var curl = b.to - b.f < 0.5; var bx = x1 - 15, by = curl ? y0 + 16 : y0 - 16;
      el('circle', {cx: bx, cy: by, r: 8, fill: 'var(--surface)', stroke: ROOT, 'stroke-width': 1.8}, arrows);
      txt(arrows, bx, by + 0.5, String(i + 1), {'class': 'fb__dlabel', fill: ROOT, 'font-size': 10});
    });
    host.appendChild(n.svg);
  }

  /* pitch-vs-time curves for the bend vocabulary */
  function buildCurves() {
    var host = document.getElementById('bend-curves');
    if (!host) return;
    var shapes = [
      {name: 'Bend & hold', how: 'Push up to the target and sit there. The vocal equivalent of sliding into a note and holding it.',
        path: 'M8 70 L30 70 C 40 70, 46 30, 60 30 L150 30'},
      {name: 'Scoop', how: 'Start a hair flat and arrive at pitch fast. Nearly every blues singer does this on the first word of a line.',
        path: 'M8 46 C 20 46, 22 30, 34 30 L150 30'},
      {name: 'Release', how: 'Pick the bent note, then let it fall back. Sounds like a sigh, or the end of a sung phrase.',
        path: 'M8 30 L60 30 C 75 30, 80 70, 96 70 L150 70'},
      {name: 'Pre-bend', how: 'Bend silently first, then pick. The listener only hears the release. Cries.',
        path: 'M8 30 L70 30 C 80 30, 84 70, 96 70 L150 70', pre: true},
      {name: 'Vibrato', how: 'Tiny, even bends at the end of a held note. Slow and wide is bluesy; fast and narrow is nervous.',
        path: 'M8 70 L50 70 C 60 70, 64 30, 76 30 C 82 30, 82 40, 88 40 C 94 40, 94 30, 100 30 C 106 30, 106 40, 112 40 C 118 40, 118 30, 124 30 C 130 30, 130 40, 136 40 C 142 40, 142 32, 150 32'},
      {name: 'Unison bend', how: 'Fret a note on one string and bend the string below it up until the two match. Thick, aggressive, very rock.',
        path: 'M8 30 L150 30 M8 70 L30 70 C 40 70, 46 30, 60 30 L150 30', two: true}
    ];
    shapes.forEach(function (sh) {
      var card = document.createElement('div'); card.className = 'curve';
      var svg = el('svg', {viewBox: '0 0 160 92', 'class': 'curve__svg', 'aria-hidden': 'true'}, card);
      el('line', {x1: 8, y1: 30, x2: 152, y2: 30, 'class': 'curve__target'}, svg);
      el('line', {x1: 8, y1: 70, x2: 152, y2: 70, 'class': 'curve__start'}, svg);
      txt(svg, 156, 30, '▲', {'class': 'curve__lbl', 'text-anchor': 'end', 'font-size': 7});
      el('path', {d: sh.path, 'class': 'curve__path' + (sh.pre ? ' is-pre' : '')}, svg);
      if (sh.pre) el('path', {d: 'M8 70 L8 30', 'class': 'curve__path is-silent'}, svg);
      var h = document.createElement('h4'); h.className = 'curve__name'; h.textContent = sh.name; card.appendChild(h);
      var p = document.createElement('p'); p.className = 'curve__how'; p.textContent = sh.how; card.appendChild(p);
      host.appendChild(card);
    });
  }

  /* ============================================================
     4. PHRASING — a 12-bar phrase map
     ============================================================ */
  function buildPhraseMap() {
    var host = document.getElementById('phrase-map');
    if (!host) return;
    var W = 1000, H = 156, x0 = 30, bw = (W - 60) / 12;
    var svg = el('svg', {viewBox: '0 0 ' + W + ' ' + H, width: '100%', role: 'img', 'class': 'pmap'}, host);
    svg.style.maxWidth = W + 'px';
    var chords = ['A7','A7','A7','A7','D7','D7','A7','A7','E7','D7','A7','E7'];
    for (var i = 0; i < 12; i++) {
      el('rect', {x: x0 + i * bw, y: 34, width: bw, height: 70, 'class': 'pmap__bar' + (i % 4 === 0 ? ' is-four' : '')}, svg);
      txt(svg, x0 + i * bw + bw / 2, 22, chords[i], {'class': 'pmap__chord'});
      txt(svg, x0 + i * bw + bw / 2, 118, String(i + 1), {'class': 'pmap__num'});
    }
    // phrases: [startBar (0-based, fractional), lengthBars, kind]
    var phr = [[0, 1.5, 'call'], [2, 1.5, 'answer'], [4, 1.5, 'call'], [6, 1.5, 'answer'], [8, 2.5, 'build'], [10.5, 1.5, 'land']];
    var colors = {call: '#00788a', answer: '#0b4a91', build: '#98002e', land: '#7a5c14'};
    phr.forEach(function (p) {
      var x = x0 + p[0] * bw + 3, w = p[1] * bw - 6;
      el('rect', {x: x, y: 46, width: w, height: 46, rx: 8, fill: colors[p[2]], 'class': 'pmap__phrase'}, svg);
      txt(svg, x + w / 2, 69, p[2] === 'land' ? 'land on the root' : p[2], {'class': 'pmap__plbl'});
    });
    // rests
    [[1.5, 0.5], [3.5, 0.5], [5.5, 0.5], [7.5, 0.5]].forEach(function (r) {
      txt(svg, x0 + (r[0] + r[1] / 2) * bw, 69, '𝄽', {'class': 'pmap__rest'});
    });
    txt(svg, W / 2, 146, 'One chorus of a 12-bar blues in A. Short sentence, breath, answer. Say more only at the end.', {'class': 'pmap__cap'});
  }

  /* ============================================================
     boot
     ============================================================ */
  function boot() {
    buildRoots(); buildPent(); buildBends(); buildCurves(); buildPhraseMap();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
