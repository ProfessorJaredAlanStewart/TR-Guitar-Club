/* ============================================================
   TRGC METRONOME — drop-in.
   Put <div id="trgc-metronome"></div> anywhere on a page and load
   this script. No dependencies, its own audio, styles itself.
   ============================================================ */
(function(){
  'use strict';
  const host = document.getElementById('trgc-metronome');
  if(!host) return;

  const css = `
  .mn{display:flex;flex-wrap:wrap;align-items:center;gap:14px 22px}
  .mn__go{min-width:112px}
  .mn__bpm{display:flex;align-items:center;gap:8px}
  .mn__bpm button{font:inherit;color:inherit;background:transparent;border:1px solid var(--line,#ccc);border-radius:999px;width:38px;height:38px;cursor:pointer;font-size:1.2rem;line-height:1}
  .mn__bpm button:hover{border-color:var(--crimson,#98002e)}
  .mn__num{font-family:var(--font-display,'Anton',sans-serif);font-size:2rem;min-width:3ch;text-align:center;line-height:1}
  .mn__lab{font-size:.78rem;opacity:.65;text-transform:uppercase;letter-spacing:.14em;font-family:var(--font-label,inherit)}
  .mn__range{width:150px;accent-color:var(--crimson,#98002e)}
  .mn__beats{display:flex;gap:6px;align-items:center}
  .mn__beats button{font:inherit;color:inherit;background:transparent;border:1px solid var(--line,#ccc);border-radius:999px;padding:5px 12px;cursor:pointer;font-size:.86rem}
  .mn__beats button[aria-pressed="true"]{background:var(--crimson,#98002e);border-color:var(--crimson,#98002e);color:#fff}
  .mn__lights{display:flex;gap:8px}
  .mn__lights i{width:16px;height:16px;border-radius:50%;background:var(--line,#ccc);display:block;transition:transform .05s,background .05s}
  .mn__lights i.on{background:var(--teal,#00788a);transform:scale(1.25)}
  .mn__lights i.on.acc{background:var(--crimson,#98002e)}
  .mn__tap{font:inherit;color:inherit;background:transparent;border:1px dashed var(--line,#ccc);border-radius:999px;padding:6px 14px;cursor:pointer;font-size:.86rem}
  .mn__tap:hover{border-color:var(--crimson,#98002e)}
  .mn__hint{flex-basis:100%;font-size:.84rem;opacity:.65;margin:0}
  @media (prefers-reduced-motion:reduce){.mn__lights i{transition:none}}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  let bpm = 80, beats = 4, running = false, ctx = null, timer = 0, nextT = 0, beatIdx = 0, taps = [];

  host.innerHTML = `
  <div class="mn">
    <button class="btn mn__go" type="button" id="mnGo" aria-label="Start the metronome">Start</button>
    <div class="mn__bpm">
      <button type="button" id="mnDown" aria-label="Slower">&minus;</button>
      <div><div class="mn__num" id="mnNum">${bpm}</div><div class="mn__lab">beats / min</div></div>
      <button type="button" id="mnUp" aria-label="Faster">+</button>
    </div>
    <input class="mn__range" type="range" id="mnRange" min="40" max="200" value="${bpm}" aria-label="Tempo">
    <div class="mn__beats" role="group" aria-label="Beats per bar">
      <span class="mn__lab">Count</span>
      <button type="button" data-b="4" aria-pressed="true">4</button>
      <button type="button" data-b="3" aria-pressed="false">3</button>
      <button type="button" data-b="2" aria-pressed="false">2</button>
    </div>
    <div class="mn__lights" id="mnLights" aria-hidden="true"></div>
    <button class="mn__tap" type="button" id="mnTap">Tap the tempo</button>
    <p class="mn__hint">Start slow enough that every chord change lands on the beat. Speed comes from clean, not from fast.</p>
  </div>`;

  const $ = id => host.querySelector('#' + id);
  const lights = $('mnLights');
  function drawLights(){
    lights.innerHTML = '';
    for(let i = 0; i < beats; i++) lights.appendChild(document.createElement('i'));
  }
  function setBpm(v){
    bpm = Math.max(40, Math.min(200, Math.round(v)));
    $('mnNum').textContent = bpm; $('mnRange').value = bpm;
  }
  function audio(){
    if(!ctx){ const AC = window.AudioContext || window.webkitAudioContext; ctx = new AC(); }
    if(ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function click(t, accent){
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = accent ? 1600 : 1050;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.28, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.09);
  }
  function flash(i, accent){
    const dots = lights.children;
    for(let k = 0; k < dots.length; k++) dots[k].className = '';
    if(dots[i]){ dots[i].className = 'on' + (accent ? ' acc' : ''); }
  }
  function schedule(){
    if(!running) return;
    const now = ctx.currentTime;
    while(nextT < now + 0.15){
      const accent = beatIdx % beats === 0;
      click(nextT, accent);
      const idx = beatIdx % beats, at = nextT;
      setTimeout(() => flash(idx, accent), Math.max(0, (at - ctx.currentTime) * 1000));
      nextT += 60 / bpm;
      beatIdx++;
    }
    timer = setTimeout(schedule, 40);
  }
  function start(){
    audio();
    running = true; beatIdx = 0; nextT = ctx.currentTime + 0.05;
    $('mnGo').textContent = 'Stop'; $('mnGo').setAttribute('aria-label', 'Stop the metronome');
    schedule();
  }
  function stop(){
    running = false; clearTimeout(timer);
    $('mnGo').textContent = 'Start'; $('mnGo').setAttribute('aria-label', 'Start the metronome');
    flash(-1);
  }

  $('mnGo').addEventListener('click', () => running ? stop() : start());
  $('mnDown').addEventListener('click', () => setBpm(bpm - 4));
  $('mnUp').addEventListener('click', () => setBpm(bpm + 4));
  $('mnRange').addEventListener('input', e => setBpm(+e.target.value));
  host.querySelectorAll('.mn__beats button').forEach(b => b.addEventListener('click', () => {
    beats = +b.dataset.b; beatIdx = 0;
    host.querySelectorAll('.mn__beats button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    drawLights();
  }));
  $('mnTap').addEventListener('click', () => {
    const t = performance.now();
    taps = taps.filter(x => t - x < 2500); taps.push(t);
    if(taps.length >= 2){
      const gaps = []; for(let i = 1; i < taps.length; i++) gaps.push(taps[i] - taps[i - 1]);
      setBpm(60000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length));
    }
  });
  window.addEventListener('pagehide', stop);
  drawLights();
})();
