/* ============================================================
   SONG FINDER — progressions.html
   Chord-first. The student taps the shapes they know; the page
   answers: what can I play, what chord next, what does a capo do.

   Runs AFTER songstarter.js and reuses its data and engine:
   SHAPES, BANK, resolve(), shapeFor(), diagram(), STRUMS,
   audio(), strike(), click(), stopAll(), toast(), pretty().
   Nothing here is duplicated on purpose: edit the bank or a
   chord shape in songstarter.js and both pages change.
   ============================================================ */
(function(){
'use strict';
if(!document.getElementById('sfPicker')) return;

const q  = s => document.querySelector(s);
const qa = s => Array.from(document.querySelectorAll(s));

/* ---------- which shapes to offer ---------- */
const OPEN  = ['G','C','D','Em','Am','E','A','Dm','D7','A7','E7','G7','C7','B7'];
const BARRE = ['F','Bm','B','F#m','Fm','Cm','Gm','A#','D#','G#','G#m','C#m','A#m','F7'];
const EXTRA = ['Cadd9','Cmaj7','Fmaj7','Dsus2','Dsus4','Asus2','Asus4','Esus4','Csus2','Em7','Am7','Dm7','Dmaj7','Amaj7','Emaj7','Gmaj7','Bm7','F#m7','C#m7'];
const STARTER = ['G','C','D','Em'];

/* Guitar players say F#m, C#m, G#m but Bb, Eb, Ab. */
const FLATS = {'A#':'B\u266d','D#':'E\u266d','G#':'A\u266d','C#':'D\u266d'};
function nice(name){
  const m = name.match(/^([A-G]#?)(.*)$/); if(!m) return name;
  const [, root, rest] = m;
  const minor = /^m(?!aj)/.test(rest);
  if(root.length === 1) return name;
  if(minor && (root === 'F#' || root === 'C#' || root === 'G#')) return name;
  if(root === 'F#') return name;
  return (FLATS[root] || root) + rest;
}
function parse(name){
  const m = name.match(/^([A-G]#?)(.*)$/);
  const root = PC.indexOf(m[1]);
  const rest = m[2];
  const minor = /^m(?!aj)/.test(rest);
  return {root, minor, rest};
}

/* ---------- state ---------- */
const KEY = 'trgc.knownChords.v1';
let known = new Set();
try{ const s = JSON.parse(localStorage.getItem(KEY) || '[]'); s.forEach(n => SHAPES[n] && known.add(n)); }catch(e){}
let results = [];           // playable progressions
let active  = null;         // the one shown in detail
let capo    = 0;
let bpm     = 96;
let nextFrom = null;        // chord chosen in "what sounds good next"
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(Array.from(known))); }catch(e){} }

/* ============================================================
   1. THE PICKER
   ============================================================ */
function chordButton(name){
  const sh = Object.assign({name}, SHAPES[name]);
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'sf-chord'; b.dataset.n = name;
  b.setAttribute('aria-pressed', String(known.has(name)));
  b.innerHTML = `<b>${nice(name)}</b>${diagram(sh, 'sm')}${sh.b ? '<small>barre</small>' : ''}`;
  b.addEventListener('click', () => {
    if(known.has(name)) known.delete(name); else known.add(name);
    b.setAttribute('aria-pressed', String(known.has(name)));
    save(); update();
  });
  return b;
}
function buildPicker(){
  const p = q('#sfPicker'); OPEN.forEach(n => p.appendChild(chordButton(n)));
  const m = q('#sfPickerBarre'); BARRE.forEach(n => m.appendChild(chordButton(n)));
  const x = q('#sfPickerExtra'); EXTRA.forEach(n => x.appendChild(chordButton(n)));
  q('#sfStarter').addEventListener('click', () => { STARTER.forEach(n => known.add(n)); syncPicker(); save(); update(); });
  q('#sfClear').addEventListener('click', () => { known.clear(); syncPicker(); save(); update(); });
}
function syncPicker(){ qa('.sf-chord').forEach(b => b.setAttribute('aria-pressed', String(known.has(b.dataset.n)))); }

/* ============================================================
   2. WHAT CAN I PLAY
   ============================================================ */
function playableWith(set){
  const out = [], seen = new Set();
  BANK.forEach((p, pi) => {
    for(let pc = 0; pc < 12; pc++){
      const v = resolve(p, pc, pc);
      const names = v.chords.map(c => c.played);
      if(!names.every(n => set.has(n))) continue;
      // a sus/add9 chord we have no open shape for degrades to plain major; that card would be a lie
      if(v.chords.some(c => COLOUR[c.quality] && !c.played.endsWith(SUFFIX[c.quality]))) continue;
      // two-chord loops: G-D and D-G are the same practice for a beginner, show one
      const sig = names.length === 2 ? names.slice().sort().join('|') : names.join('|');
      if(seen.has(sig)) continue;
      seen.add(sig);
      out.push({p, pi, pc, v, names, distinct: new Set(names).size});
    }
  });
  out.sort((a, b) => a.distinct - b.distinct || a.v.worst - b.v.worst || a.pi - b.pi);
  return out;
}

function songLink(s){
  return `<a href="https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(s)}" target="_blank" rel="noopener">${s}</a>`;
}

function renderSongs(){
  results = playableWith(known);
  const box = q('#sfSongs'); box.innerHTML = '';
  const n = known.size;
  q('#sfCount').textContent = n === 0 ? 'No chords picked yet.' : n === 1 ? 'You know 1 chord.' : `You know ${n} chords.`;

  if(!results.length){
    q('#sfEmpty').hidden = false;
    q('#sfEmpty').textContent = n < 2
      ? 'Tap at least two chords above and this list fills in.'
      : 'Those chords do not belong to one family yet. Look at "Learn one more chord" below: one shape usually opens the door.';
    active = null; renderDetail(); renderLearn(); return;
  }
  q('#sfEmpty').hidden = true;
  q('#sfSongsHead').textContent = results.length === 1 ? '1 progression you can play right now' : `${results.length} progressions you can play right now`;

  if(!active || !results.some(r => r.names.join('|') === active.names.join('|'))) active = results[0];

  results.forEach(r => {
    const card = document.createElement('article');
    card.className = 'sf-card' + (r === active ? ' is-active' : '');
    const L = costLabel(r.v.worst);
    card.innerHTML = `
      <div class="sf-card__chords">${r.names.map(n => `<span>${nice(n)}</span>`).join('')}</div>
      <p class="sf-card__why">${r.p.why}</p>
      <p class="sf-card__meta"><span class="sf-tag sf-tag--${L.k}">changes: ${L.t}</span><span class="sf-tag">${r.distinct} chord${r.distinct > 1 ? 's' : ''}</span></p>
      <p class="sf-card__songs">${(r.p.s || []).map(songLink).join(' \u00b7 ')}</p>
      <div class="sf-card__act">
        <button class="btn btn--sm" type="button" data-play>Play it</button>
        <button class="btn btn--sm btn--ghost" type="button" data-open>Fingerings &amp; strum</button>
      </div>`;
    card.querySelector('[data-play]').addEventListener('click', () => { setActive(r, false); play(r, 0); });
    card.querySelector('[data-open]').addEventListener('click', () => { setActive(r, true); });
    box.appendChild(card);
  });
  renderDetail(); renderLearn(); renderCapo();
}

function setActive(r, scroll){
  active = r;
  qa('.sf-card').forEach((c, i) => c.classList.toggle('is-active', results[i] === r));
  renderDetail(); renderCapo();
  if(scroll) q('#sfDetail').scrollIntoView({behavior:'smooth', block:'start'});
}

/* ---------- detail: fingerings, strum, transport ---------- */
function renderDetail(){
  const d = q('#sfDetail');
  if(!active){ d.hidden = true; return; }
  d.hidden = false;
  q('#sfDetailChords').textContent = active.names.map(nice).join('  \u2192  ');
  q('#sfDetailWhy').textContent = active.p.why;

  const row = q('#sfDiagrams'); row.innerHTML = '';
  active.v.chords.forEach((c, i) => {
    const el = document.createElement('div'); el.className = 'sf-diagram'; el.dataset.i = i;
    el.innerHTML = `<div class="sf-diagram__name">${nice(c.played)}</div>${diagram(c.shape)}<div class="sf-diagram__note">${c.shape.note || fingerText(c.shape)}</div>`;
    row.appendChild(el);
  });

  const st = STRUMS.pop;
  const sbox = q('#sfStrum'); sbox.innerHTML = '';
  st.p.forEach((sym, i) => {
    const b = document.createElement('b'); b.dataset.i = i;
    if(i % 2 === 0) b.classList.add('beat');
    if(sym === 'D'){ b.classList.add('down'); b.textContent = '\u2193'; }
    else if(sym === 'u'){ b.classList.add('up'); b.textContent = '\u2191'; }
    else { b.classList.add('rest'); b.textContent = '\u00b7'; }
    sbox.appendChild(b);
  });

  // carry the pick to the arrange page in the same link format songstarter.js reads
  const snap = {p:active.pi, s:active.pc, f:capo, h:'any', c:1, m:'any', g:'any', l:'any', b:bpm, x:{}};
  let hash = '';
  try{ hash = '#p=' + btoa(unescape(encodeURIComponent(JSON.stringify(snap)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }catch(e){}
  qa('[data-carry]').forEach(a => a.href = a.dataset.carry + hash);
}

/* ============================================================
   LEARN ONE MORE CHORD
   ============================================================ */
function renderLearn(){
  const box = q('#sfLearn'); box.innerHTML = '';
  const base = playableWith(known).length;
  const cands = OPEN.concat(BARRE).filter(n => !known.has(n));
  const scored = cands.map(n => {
    const s = new Set(known); s.add(n);
    return {n, gain: playableWith(s).length - base, barre: !!SHAPES[n].b};
  }).filter(x => x.gain > 0)
    .sort((a, b) => (b.gain - a.gain) || (a.barre - b.barre))
    .slice(0, 3);

  if(!scored.length){
    box.innerHTML = `<p class="dim mb0">${known.size ? 'You have the shapes that matter. Everything left is polish.' : 'Tap a chord or two above and this will tell you which one to learn next.'}</p>`;
    return;
  }
  scored.forEach((x, i) => {
    const sh = Object.assign({name:x.n}, SHAPES[x.n]);
    const el = document.createElement('div'); el.className = 'sf-learn';
    el.innerHTML = `${diagram(sh)}<div class="sf-learn__t"><b>${nice(x.n)}</b><span>${i === 0 ? 'Best next step. ' : ''}Opens ${x.gain} more progression${x.gain > 1 ? 's' : ''}${x.barre ? '. It is a barre chord, so give it a week.' : '.'}</span>
      <button class="btn btn--sm btn--ghost" type="button">I can play it</button></div>`;
    el.querySelector('button').addEventListener('click', () => { known.add(x.n); syncPicker(); save(); update(); toast(nice(x.n) + ' added. Look what opened up.'); });
    box.appendChild(el);
  });
}

/* ============================================================
   3. WHAT SOUNDS GOOD NEXT
   ============================================================ */
function suggestionsFor(name){
  const {root, minor} = parse(name);
  const r = n => (root + n) % 12;
  if(!minor) return [
    {pc:r(5),  qual:'maj', role:'The calm one',       why:'One step away from home. The most common move on the instrument. Nothing pulls, nothing pushes.'},
    {pc:r(7),  qual:'maj', role:'The pull home',      why:`Leans hard back toward ${nice(name)}. Play it, then ${nice(name)} again, and you will hear the landing.`},
    {pc:r(9),  qual:'min', role:'The sad cousin',     why:`Shares two of its three notes with ${nice(name)}, so it sounds close but darker. This is the chord that makes pop songs ache.`},
    {pc:r(2),  qual:'min', role:'The softener',       why:'Gentler than the sad cousin. It usually hands off to the pull-home chord next.'},
    {pc:r(10), qual:'maj', role:'The rock move',      why:'One whole step down. Not sad, just gritty. Sweet Home Alabama lives here.'}
  ];
  return [
    {pc:r(3),  qual:'maj', role:'The happy twin',     why:`Same notes as ${nice(name)}, brighter mood. Minor songs lean on this to breathe.`},
    {pc:r(8),  qual:'maj', role:'The lift',           why:'Climbs out of the minor without leaving the key. Big and open.'},
    {pc:r(10), qual:'maj', role:'The climb',          why:'One more step up. Driving. Zombie and Numb ride this.'},
    {pc:r(5),  qual:'min', role:'Deeper in',          why:'Both chords minor. Blues in a minor key, and most of flamenco.'},
    {pc:r(7),  qual:'maj', role:'The tense one',      why:`Major on purpose. It pulls back to ${nice(name)} hard. Hold it a beat too long.`}
  ];
}

function renderNext(){
  const from = q('#sfNextFrom'); from.innerHTML = '';
  const list = Array.from(known).filter(n => /^[A-G]#?(m)?$/.test(n));   // plain majors and minors only
  if(!list.length){
    q('#sfNext').innerHTML = '<p class="dim mb0">Pick a major or minor chord above first.</p>';
    return;
  }
  if(!nextFrom || !known.has(nextFrom)) nextFrom = list[0];
  list.forEach(n => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'sf-chip';
    b.textContent = nice(n); b.setAttribute('aria-pressed', String(n === nextFrom));
    b.addEventListener('click', () => { nextFrom = n; renderNext(); });
    from.appendChild(b);
  });

  const box = q('#sfNext'); box.innerHTML = '';
  const fromShape = shapeFor(parse(nextFrom).root, parse(nextFrom).minor ? 'min' : 'maj');
  suggestionsFor(nextFrom).forEach(s => {
    const sh = shapeFor(s.pc, s.qual);
    const have = known.has(sh.name);
    const el = document.createElement('div'); el.className = 'sf-next' + (have ? ' have' : '');
    el.innerHTML = `
      <div class="sf-next__pair"><span>${nice(nextFrom)}</span><i>\u2192</i><span>${nice(sh.name)}</span></div>
      <div class="sf-next__body">
        <b>${s.role}</b>
        <p>${s.why}</p>
        <p class="sf-next__tag">${have ? 'You already know this one.' : (sh.b ? 'A barre chord. Worth it, but not today.' : 'An open shape you have not picked yet.')}</p>
      </div>
      <div class="sf-next__act">${diagram(sh, 'sm')}<button class="btn btn--sm btn--ghost" type="button">Hear it</button></div>`;
    el.querySelector('button').addEventListener('click', () => playPair(fromShape, sh));
    box.appendChild(el);
  });
}

/* ============================================================
   4. THE CAPO
   ============================================================ */
function renderCapoChips(){
  const box = q('#sfCapoFrets'); box.innerHTML = '';
  for(let f = 0; f <= 7; f++){
    const b = document.createElement('button'); b.type = 'button'; b.className = 'sf-fret';
    b.setAttribute('aria-pressed', String(f === capo));
    b.innerHTML = f === 0 ? '<span>no</span><b>capo</b>' : `<span>fret</span><b>${f}</b>`;
    b.addEventListener('click', () => { capo = f; renderCapoChips(); renderCapo(); renderDetail(); });
    box.appendChild(b);
  }
}
function renderCapo(){
  const line = q('#sfCapoLine'), tbl = q('#sfCapoTable tbody');
  const shift = (name, f) => { const p = parse(name); return nice(PC[(p.root + f) % 12] + p.rest); };

  if(active){
    const played = active.names.map(nice).join(' \u00b7 ');
    const heard  = active.names.map(n => shift(n, capo)).join(' \u00b7 ');
    const keyName = nice(PC[(active.pc + capo) % 12]) + (isMinorProg(active.p) ? ' minor' : ' major');
    line.innerHTML = capo === 0
      ? `Your fingers play <b>${played}</b>. No capo, so that is exactly what the room hears. Key of <b>${keyName}</b>.`
      : `Your fingers still play <b>${played}</b>. The capo on fret ${capo} raises every chord ${capo} half step${capo > 1 ? 's' : ''}, so the room hears <b>${heard}</b>. Key of <b>${keyName}</b>. Same shapes, same song, higher.`;
    q('#sfCapoHear').hidden = false;
    q('#sfCapoHear').textContent = capo === 0 ? 'Hear it (no capo)' : `Hear it with the capo on fret ${capo}`;
  } else {
    line.innerHTML = capo === 0
      ? 'No capo. Every shape sounds like its name.'
      : `Capo on fret ${capo}: every shape you know now sounds ${capo} half step${capo > 1 ? 's' : ''} higher than its name. The table shows what each one becomes.`;
    q('#sfCapoHear').hidden = true;
  }

  tbl.innerHTML = '';
  const list = Array.from(known);
  if(!list.length){ tbl.innerHTML = '<tr><td colspan="2" class="dim">Pick some chords above and this fills in.</td></tr>'; return; }
  list.forEach(n => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${nice(n)}</td><td>${capo ? shift(n, capo) : nice(n)}</td>`;
    tbl.appendChild(tr);
  });
}

/* ============================================================
   AUDIO — uses the engine in songstarter.js
   ============================================================ */
let sfPlaying = false, marks = [], raf = 0, endAt = 0, lastReq = null;

function stopMine(){
  sfPlaying = false; marks = []; cancelAnimationFrame(raf);
  stopAll();
  qa('.sf-diagram').forEach(d => d.classList.remove('playing'));
  qa('#sfStrum b').forEach(b => b.classList.remove('hit'));
  qa('.sf-card').forEach(c => c.classList.remove('is-playing'));
  const pb = q('#sfPlay'); if(pb) pb.textContent = 'Play';
  const ch = q('#sfCapoHear'); if(ch) ch.classList.remove('is-playing');
}

function play(r, capoFret){
  audio(); if(ctx.state === 'suspended') ctx.resume();
  stopMine();
  sfPlaying = true; lastReq = {r, capoFret};
  q('#sfPlay').textContent = 'Stop';
  if(capoFret) q('#sfCapoHear').classList.add('is-playing');
  const idx = results.indexOf(r);
  if(idx >= 0) qa('.sf-card')[idx].classList.add('is-playing');

  const beat = 60 / bpm, eighth = beat / 2, pat = STRUMS.pop.p;
  let t = ctx.currentTime + 0.1;
  if(q('#sfCountin').checked){ for(let i = 0; i < 4; i++) click(t + i * beat, i === 0); t += 4 * beat; }
  const metro = q('#sfClick').checked;
  for(let rep = 0; rep < 2; rep++){
    r.v.chords.forEach((c, ci) => {
      const bar = t; marks.push({at:bar, slot:ci});
      pat.forEach((sym, si) => {
        const at = bar + si * eighth;
        if(sym !== '-') strike(c.shape, capoFret, at, sym);
        if(metro && si % 2 === 0) click(at, si === 0);
        marks.push({at, cell:si});
      });
      t += eighth * 8;
    });
  }
  endAt = t;
  const tick = () => {
    if(!sfPlaying) return;
    const now = ctx.currentTime;
    if(now > endAt){ if(q('#sfLoop').checked){ play(r, capoFret); } else stopMine(); return; }
    for(let i = marks.length - 1; i >= 0; i--){
      const m = marks[i];
      if(m.at <= now && !m.done && now - m.at < 0.12){
        m.done = true;
        if(m.slot !== undefined) qa('.sf-diagram').forEach(d => d.classList.toggle('playing', +d.dataset.i === m.slot));
        if(m.cell !== undefined) qa('#sfStrum b').forEach(b => b.classList.toggle('hit', +b.dataset.i === m.cell));
      }
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

function playPair(a, b){
  audio(); if(ctx.state === 'suspended') ctx.resume();
  stopMine();
  const beat = 60 / 88, eighth = beat / 2, pat = STRUMS.pop.p;
  let t = ctx.currentTime + 0.1;
  [a, b, a, b].forEach(sh => {
    pat.forEach((sym, si) => { if(sym !== '-') strike(sh, 0, t + si * eighth, sym); });
    t += eighth * 8;
  });
}

/* ============================================================
   WIRING
   ============================================================ */
function update(){ renderSongs(); renderNext(); renderCapo(); }

buildPicker();
renderCapoChips();
q('#sfPlay').addEventListener('click', () => sfPlaying ? stopMine() : (active && play(active, 0)));
q('#sfCapoHear').addEventListener('click', () => sfPlaying ? stopMine() : (active && play(active, capo)));
q('#sfBpm').addEventListener('input', e => {
  bpm = +e.target.value; q('#sfBpmOut').textContent = bpm;
  if(sfPlaying && lastReq) play(lastReq.r, lastReq.capoFret);
});
document.addEventListener('keydown', e => {
  if(e.target && e.target.matches && e.target.matches('input,select,textarea,button')) return;
  if(e.code === 'Space' && active){ e.preventDefault(); sfPlaying ? stopMine() : play(active, 0); }
});
window.addEventListener('pagehide', stopMine);
update();
})();
