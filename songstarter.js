/* ============================================================
   SONG STARTER — engine
   Everything runs in the browser. No network, no storage beyond
   this device's localStorage.
   ============================================================ */
'use strict';

const PC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const FLAT = {'C#':'D\u266d','D#':'E\u266d','F#':'F#','G#':'A\u266d','A#':'B\u266d'};
const OPEN_MIDI = [40,45,50,55,59,64];           // E2 A2 D3 G3 B3 E4

const pcOf = n => PC.indexOf(n);
const SHARP_KEYS = [7,2,9,4,11,6];          // G D A E B F# spell their accidentals as sharps
let spellFlats = true;                       // set per render from the key the room hears
const keyUsesFlats = pc => !SHARP_KEYS.includes(((pc % 12) + 12) % 12);
const pretty = (n, flats) => {
  const useFlats = (flats === undefined) ? spellFlats : flats;
  return String(n).replace(/^([A-G]#)/, m => (useFlats && FLAT[m]) ? FLAT[m] : m);
};

/* ---------- chord shapes ----------
   f = frets low-E..high-e (-1 muted, 0 open)
   d = finger per string (0 none, 1 index .. 4 pinky)
   b = barre fret if the index finger lies flat                */
const SHAPES = {
  'C':      {f:[-1,3,2,0,1,0], d:[0,3,2,0,1,0]},
  'Cadd9':  {f:[-1,3,2,0,3,0], d:[0,3,2,0,4,0], note:'Anchor grip'},
  'Cmaj7':  {f:[-1,3,2,0,0,0], d:[0,3,2,0,0,0]},
  'C7':     {f:[-1,3,2,3,1,0], d:[0,3,2,4,1,0]},
  'Csus2':  {f:[-1,3,0,0,3,3], d:[0,2,0,0,3,4]},
  'Cm':     {f:[-1,3,5,5,4,3], d:[0,1,3,4,2,1], b:3},
  'C#m':    {f:[-1,4,6,6,5,4], d:[0,1,3,4,2,1], b:4},
  'C#m7':   {f:[-1,4,6,4,5,4], d:[0,1,3,1,2,1], b:4},
  'D':      {f:[-1,-1,0,2,3,2], d:[0,0,0,1,3,2]},
  'Dm':     {f:[-1,-1,0,2,3,1], d:[0,0,0,2,3,1]},
  'Dm7':    {f:[-1,-1,0,2,1,1], d:[0,0,0,2,1,1]},
  'D7':     {f:[-1,-1,0,2,1,2], d:[0,0,0,2,1,3]},
  'Dmaj7':  {f:[-1,-1,0,2,2,2], d:[0,0,0,1,1,1]},
  'Dsus2':  {f:[-1,-1,0,2,3,0], d:[0,0,0,1,2,0]},
  'Dsus4':  {f:[-1,-1,0,2,3,3], d:[0,0,0,1,2,3]},
  'D#':     {f:[-1,6,8,8,8,6], d:[0,1,2,3,4,1], b:6},
  'E':      {f:[0,2,2,1,0,0], d:[0,2,3,1,0,0]},
  'Em':     {f:[0,2,2,0,0,0], d:[0,2,3,0,0,0]},
  'Em7':    {f:[0,2,0,0,0,0], d:[0,2,0,0,0,0]},
  'E7':     {f:[0,2,0,1,0,0], d:[0,2,0,1,0,0]},
  'Emaj7':  {f:[0,2,1,1,0,0], d:[0,3,1,2,0,0]},
  'Esus4':  {f:[0,2,2,2,0,0], d:[0,1,2,3,0,0]},
  'F':      {f:[1,3,3,2,1,1], d:[1,3,4,2,1,1], b:1},
  'Fmaj7':  {f:[-1,-1,3,2,1,0], d:[0,0,3,2,1,0], note:'No barre'},
  'Fm':     {f:[1,3,3,1,1,1], d:[1,3,4,1,1,1], b:1},
  'F7':     {f:[1,3,1,2,1,1], d:[1,3,1,2,1,1], b:1},
  'F#m':    {f:[2,4,4,2,2,2], d:[1,3,4,1,1,1], b:2},
  'F#m7':   {f:[2,4,2,2,2,2], d:[1,3,1,1,1,1], b:2},
  'F#':     {f:[2,4,4,3,2,2], d:[1,3,4,2,1,1], b:2},
  'G':      {f:[3,2,0,0,0,3], d:[2,1,0,0,0,3]},
  'G4':     {f:[3,2,0,0,3,3], d:[2,1,0,0,3,4], name:'G', note:'Anchor grip'},
  'G7':     {f:[3,2,0,0,0,1], d:[3,2,0,0,0,1]},
  'Gmaj7':  {f:[3,2,0,0,0,2], d:[3,2,0,0,0,1]},
  'Gm':     {f:[3,5,5,3,3,3], d:[1,3,4,1,1,1], b:3},
  'G#':     {f:[4,6,6,5,4,4], d:[1,3,4,2,1,1], b:4},
  'G#m':    {f:[4,6,6,4,4,4], d:[1,3,4,1,1,1], b:4},
  'A':      {f:[-1,0,2,2,2,0], d:[0,0,1,2,3,0]},
  'Am':     {f:[-1,0,2,2,1,0], d:[0,0,2,3,1,0]},
  'Am7':    {f:[-1,0,2,0,1,0], d:[0,0,2,0,1,0]},
  'A7':     {f:[-1,0,2,0,2,0], d:[0,0,2,0,3,0]},
  'Amaj7':  {f:[-1,0,2,1,2,0], d:[0,0,2,1,3,0]},
  'Asus2':  {f:[-1,0,2,2,0,0], d:[0,0,1,2,0,0]},
  'Asus4':  {f:[-1,0,2,2,3,0], d:[0,0,1,2,3,0]},
  'A#':     {f:[-1,1,3,3,3,1], d:[0,1,2,3,4,1], b:1},
  'A#m':    {f:[-1,1,3,3,2,1], d:[0,1,3,4,2,1], b:1},
  'B':      {f:[-1,2,4,4,4,2], d:[0,1,2,3,4,1], b:2},
  'Bm':     {f:[-1,2,4,4,3,2], d:[0,1,3,4,2,1], b:2},
  'Bm7':    {f:[-1,2,4,2,3,2], d:[0,1,3,1,2,1], b:2},
  'B7':     {f:[-1,2,1,2,0,2], d:[0,2,1,3,0,4]}
};

/* barre fallback for anything not in the library */
const E_SHAPE = {maj:[0,2,2,1,0,0],min:[0,2,2,0,0,0],'7':[0,2,0,1,0,0],m7:[0,2,0,0,0,0],maj7:[0,2,1,1,0,0]};
const A_SHAPE = {maj:[-1,0,2,2,2,0],min:[-1,0,2,2,1,0],'7':[-1,0,2,0,2,0],m7:[-1,0,2,0,1,0],maj7:[-1,0,2,1,2,0]};
const E_FING  = {maj:[0,3,4,2,1,1],min:[0,3,4,1,1,1],'7':[0,3,1,2,1,1],m7:[0,3,1,1,1,1],maj7:[0,4,2,3,1,1]};
const A_FING  = {maj:[0,1,2,3,4,1],min:[0,1,3,4,2,1],'7':[0,1,3,1,4,1],m7:[0,1,3,1,2,1],maj7:[0,1,3,2,4,1]};

function buildBarre(rootPc, quality){
  const eFret = ((rootPc - 4) % 12 + 12) % 12;
  const aFret = ((rootPc - 9) % 12 + 12) % 12;
  const useA = (aFret > 0 && aFret <= 5) || (eFret === 0);
  const base = useA ? aFret : (eFret === 0 ? 12 : eFret);
  const tpl  = useA ? A_SHAPE[quality] : E_SHAPE[quality];
  const fing = useA ? A_FING[quality]  : E_FING[quality];
  if(!tpl) return null;
  return {f: tpl.map(v => v < 0 ? -1 : v + base), d: fing.slice(), b: base};
}

const SUFFIX = {maj:'', min:'m', '7':'7', m7:'m7', maj7:'maj7', sus4:'sus4', sus2:'sus2', add9:'add9'};

const COLOUR = {sus4:1, sus2:1, add9:1};

function shapeFor(rootPc, quality){
  const nm = PC[rootPc] + (SUFFIX[quality] ?? '');
  if(SHAPES[nm]) return Object.assign({name:nm}, SHAPES[nm]);
  // a colour chord we have no open voicing for degrades to plain major,
  // name and all, rather than showing a diagram that is a lie
  if(COLOUR[quality]) return shapeFor(rootPc, 'maj');
  const b = buildBarre(rootPc, quality);
  return b ? Object.assign({name:nm}, b) : Object.assign({name:nm}, SHAPES['C']);
}

/* ---------- degrees ---------- */
const DEG = {
  'I':   {s:0,  q:'maj'},  'Imaj7':{s:0, q:'maj7'}, 'I7':{s:0,q:'7'},
  'ii':  {s:2,  q:'min'},  'ii7': {s:2,  q:'m7'},   'II':{s:2,q:'maj'},
  'iii': {s:4,  q:'min'},  'III': {s:4,  q:'maj'},
  'IV':  {s:5,  q:'maj'},  'IVmaj7':{s:5,q:'maj7'}, 'iv':{s:5,q:'min'},
  'V':   {s:7,  q:'maj'},  'V7':  {s:7,  q:'7'},    'v':{s:7,q:'min'},
  'vi':  {s:9,  q:'min'},  'vi7': {s:9,  q:'m7'},   'VI':{s:9,q:'maj'},
  'bIII':{s:3,  q:'maj'},  'bVI': {s:8,  q:'maj'},  'bVII':{s:10,q:'maj'},
  'Isus4':{s:0, q:'sus4'}, 'Iadd9':{s:0, q:'add9'}
};

/* minor-tonic progressions get their own map */
const DEG_MIN = {
  'i':   {s:0,  q:'min'},  'i7':  {s:0,  q:'m7'},
  'ii':  {s:2,  q:'min'},  'III': {s:3,  q:'maj'},
  'iv':  {s:5,  q:'min'},  'IV':  {s:5,  q:'maj'},
  'v':   {s:7,  q:'min'},  'V':   {s:7,  q:'maj'},  'V7':{s:7,q:'7'},
  'VI':  {s:8,  q:'maj'},  'bVI': {s:8,  q:'maj'},
  'VII': {s:10, q:'maj'},  'bVII':{s:10, q:'maj'}
};

const GUITAR_KEYS     = ['C','G','D','A','E'];    // keys with real open shapes
const GUITAR_KEYS_MIN = ['A','E','D','B'];        // open-shape minor tonics

/* ---------- transition cost ----------
   The wall for a beginner is the change, not the chord.        */
function transitionCost(a, b){
  let cost = 0;
  const aBar = !!a.b, bBar = !!b.b;
  if(bBar) cost += 2.4;
  if(aBar && bBar && Math.abs(a.b - b.b) > 0) cost += 1.2;
  if(!aBar && bBar) cost += 1.4;

  let shared = 0, moved = 0, placed = 0;
  for(let s = 0; s < 6; s++){
    const af = a.f[s], bf = b.f[s];
    if(bf > 0) placed++;
    if(af > 0 && bf > 0){
      if(af === bf && a.d[s] === b.d[s]) shared++;
      else moved += Math.abs(af - bf);
    } else if(bf > 0){ moved += 1; }
  }
  cost += moved * 0.34;
  cost -= shared * 1.15;
  if(placed === 0) cost -= 0.6;
  const spanA = fretSpan(a), spanB = fretSpan(b);
  if(spanB >= 4) cost += 0.8;
  if(Math.abs(spanA - spanB) >= 3) cost += 0.4;
  return Math.max(0, cost);
}
function fretSpan(c){
  const on = c.f.filter(v => v > 0);
  return on.length ? Math.max(...on) - Math.min(...on) + 1 : 0;
}
function costLabel(c){
  if(c < 1.6) return {k:'easy', t:'easy'};
  if(c < 3.4) return {k:'mod',  t:'takes practice'};
  return {k:'hard', t:'hard'};
}

/* ---------- progression bank ----------
   Every one of these is load-bearing in real songs.            */
const BANK = [
  {d:['I','V'],            m:['bright','driving'],  g:['pop','rock','punk','country','worship'],
   why:'Two chords. One feels like home, the other feels like leaving. Back and forth between them is already a song.',
   s:['Iko Iko','Achy Breaky Heart','Jambalaya']},
  {d:['I','IV'],           m:['bright','dreamy'],   g:['rock','indie','folk','worship'],
   why:'Two chords that both feel calm. Nothing is pulling you anywhere, so it floats. Good when you want to sing a lot of words over not much.',
   s:['Jane Says','Feelin\u2019 Alright','Beast of Burden']},
  {d:['vi','IV'],          m:['sad','dreamy'],      g:['indie','pop','metal'],
   why:'A sad chord and a happy chord taking turns. Wistful, not miserable.',
   s:['Stay With Me','Africa (chorus)']},
  {d:['i','bVII'],         m:['dark','driving'],    g:['rock','metal','blues'],
   why:'A minor chord, then the chord one whole step below it. It never lands anywhere, which is exactly why it sounds tough.',
   s:['Sunshine of Your Love','Cocaine']},
  {d:['I','bVII'],         m:['driving','dark'],    g:['rock','punk','metal','blues'],
   why:'A major chord and the one a whole step below it. Nothing sad about it, just gritty. Sounds like a highway.',
   s:['Franklin\u2019s Tower','Fire on the Mountain']},
  {d:['I','V','vi','IV'],  m:['bright','bittersweet'], g:['pop','rock','worship','country','punk'],
   why:'The four chords behind hundreds of hits. The third one is minor and arrives like a small surprise; the fourth lifts you back out.',
   s:['Let It Be','Don\u2019t Stop Believin\u2019','With or Without You','No Woman No Cry']},
  {d:['vi','IV','I','V'],  m:['sad','bittersweet'], g:['pop','rock','indie'],
   why:'The same four chords, started on the minor one. That one change makes the whole loop feel sad instead of hopeful.',
   s:['Grenade','Zombie','Complicated']},
  {d:['I','IV','V'],       m:['bright','driving'],  g:['blues','rock','country','punk','bluegrass'],
   why:'Three chords and the truth. Nearly every blues song and half of all country songs use only these.',
   s:['Twist and Shout','La Bamba','Wild Thing']},
  {d:['I','vi','IV','V'],  m:['bright','bittersweet'], g:['pop','rock','country'],
   why:'The 1950s slow-dance loop. The minor chord comes second, and that is what makes it sound like an oldie.',
   s:['Stand By Me','Every Breath You Take','Perfect']},
  {d:['ii','V','I'],       m:['bittersweet','dreamy'], g:['jazz','bossa','pop'],
   why:'Jazz in three chords. Each one leans harder on the next until the last one lands. Play it round and round.',
   s:['Autumn Leaves','Fly Me to the Moon']},
  {d:['I','V','vi','iii','IV','I','IV','V'], m:['bright','bittersweet'], g:['classical','pop','worship'],
   why:'Pachelbel\u2019s Canon. Eight chords whose low notes walk down a staircase and back up. Longer than it looks, so take it slow.',
   s:['Canon in D','Basket Case','Let It Go']},
  {d:['vi','V','IV','V'],  m:['sad','tense'],       g:['rock','metal','indie'],
   why:'Starts on the sad chord and keeps circling it. The last two chords promise to land and never do. Tense on purpose.',
   s:['All Along the Watchtower']},
  {d:['I','iii','IV','V'], m:['bright','dreamy'],   g:['pop','folk','worship'],
   why:'The second chord is the gentlest way to leave the first. It barely feels like a change, but the mood shifts.',
   s:['Crocodile Rock']},
  {d:['I','IV','vi','V'],  m:['bright','driving'],  g:['pop','rock','punk','worship'],
   why:'The same family as the big four, reordered so the sad chord comes late and hits harder.',
   s:['She Will Be Loved','Take On Me']},
  {d:['IV','I','V','vi'],  m:['bittersweet','dreamy'], g:['indie','pop','folk'],
   why:'Starts mid-thought. It feels like the song was already going before you walked in.',
   s:['Umbrella','Boulevard of Broken Dreams']},
  {d:['I','bVII','IV','I'], m:['driving','bright'], g:['rock','country','blues'],
   why:'Sweet Home Alabama. The second chord is one whole step below the first, and that one move is the whole southern-rock sound.',
   s:['Sweet Home Alabama','Sympathy for the Devil']},
  {d:['I','V','IV'],       m:['driving','bright'],  g:['rock','punk','country'],
   why:'The Louie Louie loop. Three chords, and the second one is the furthest from home, so the third one feels like coming back instead of leaving.',
   s:['Louie Louie','Twist and Shout']},
  {d:['vi','iii','IV','I'], m:['sad','dreamy'],     g:['indie','folk','jazz'],
   why:'Two sad chords in a row before the light comes back. Patient. Do not rush the third one.',
   s:['Someone Like You']},
  {d:['I','iv'],           m:['bittersweet','dark'], g:['indie','folk','jazz','worship'],
   why:'A happy chord, then its minor neighbour. That second chord is the saddest sound you can make in a happy key. One change and the room goes quiet.',
   s:['Creep (the turn)','In My Life']},
  {d:['I','III','IV','iv'], m:['bittersweet','tense'], g:['rock','indie','metal'],
   why:'Creep. The second chord sounds slightly wrong for a moment, then the last one turns minor and the whole thing collapses. Beautifully.',
   s:['Creep','Space Oddity']},
  {d:['I','V','bVII','IV'], m:['driving','bright'], g:['rock','country','folk'],
   why:'Wagon Wheel with a twist. The third chord is a step below where you started. It slips in between two bright chords and you barely notice until it is gone.',
   s:['Wagon Wheel','Ramblin\u2019 Man']},
  {d:['i','VI','III','VII'], m:['dark','sad'],      g:['metal','rock','indie'],
   why:'Four chords that all belong to the minor key. Nothing exotic in it, and it still sounds like weather coming in.',
   s:['Zombie','Numb']},
  {d:['i','iv','v'],       m:['dark','sad'],        g:['blues','metal','flamenco','classical'],
   why:'The blues, but sad. All three chords are minor, which is what keeps it from sounding hopeful.',
   s:['The Thrill Is Gone']},
  {d:['i','bVI','bVII','i'], m:['dark','driving'],  g:['metal','rock'],
   why:'Minor, then two steps up, then back down to where you started. An old flamenco move that metal borrowed.',
   s:['Stairway (the turn)','Hit the Road Jack']},
  {d:['i','bVII','bVI','V'], m:['dark','tense'],    g:['flamenco','metal','classical','rock'],
   why:'Walks down four steps. The last chord is major, which makes you expect a landing that never comes. Hit the Road Jack.',
   s:['Hit the Road Jack','Sultans of Swing (feel)']},
  {d:['I','vi','ii','V'],  m:['bittersweet','dreamy'], g:['jazz','bossa','pop','worship'],
   why:'Heart and Soul. Four chords that go round in a circle and never get stuck anywhere.',
   s:['Blue Moon','Heart and Soul']},
  {d:['Imaj7','IVmaj7'],   m:['dreamy','bittersweet'], g:['bossa','jazz','indie','latin'],
   why:'Two dreamy chords and nothing else. Nowhere to land, so it hangs in the air. Bossa nova lives here.',
   s:['Girl from Ipanema (feel)','Wave']},
  {d:['ii7','V7','Imaj7','vi7'], m:['dreamy','bittersweet'], g:['jazz','bossa','latin'],
   why:'A jazz turnaround. Three chords that lean into a landing, then a fourth that sends you back to the top.',
   s:['Autumn Leaves','Take the A Train']},
  {d:['I','I7','IV','iv'], m:['bittersweet','bright'], g:['blues','jazz','folk','country'],
   why:'The first chord grows a seventh, which drags you to the second. Then the last one goes minor and takes it all back.',
   s:['Something','Bad Moon (feel)']},
  {d:['I','V','ii','IV'],  m:['bright','driving'],  g:['pop','indie','folk'],
   why:'The big four with the third chord swapped for a different minor one. Same softness, slightly different colour.',
   s:['Save Tonight']},
  {d:['I','IV','I','V'],   m:['bright','driving'],  g:['bluegrass','country','folk','blues'],
   why:'The bluegrass shuffle. You come home twice as often as anywhere else, which is what makes it danceable.',
   s:['Wagon Wheel','Man of Constant Sorrow']},
  {d:['vi','IV','I','V','vi','IV','II','V'], m:['bittersweet','tense'], g:['pop','rock'],
   why:'The sad loop twice, but the second time through, the third chord goes major. It lifts the whole thing.',
   s:['Grenade','Africa']},
  {d:['I','Isus4','I','IV'], m:['bright','dreamy'], g:['rock','folk','worship','country'],
   why:'Free Fallin\u2019. The second chord is just the first one with one finger added. Add it, hold it a beat too long, take it away.',
   s:['Free Fallin\u2019','Pinball Wizard']},
  {d:['Iadd9','V','vi','IV'], m:['dreamy','bright'], g:['indie','worship','pop'],
   why:'The big four, but the first chord has one extra note in it. More air, and on guitar it is often the easier shape.',
   s:['Wonderwall (feel)','Boulevard']},
  {d:['I','V','vi','V'],   m:['bright','bittersweet'], g:['country','pop','worship'],
   why:'Country Roads. The second chord comes back after the minor one, wrapping it. Easy to sing over.',
   s:['Take Me Home, Country Roads']},
  {d:['vi','V','I'],       m:['bittersweet','driving'], g:['rock','indie','pop'],
   why:'Three chords climbing out of the minor. Short enough to play twice a bar.',
   s:['Hey Soul Sister (feel)']},
  {d:['I','II','IV','I'],  m:['bright','tense'],    g:['rock','folk','country'],
   why:'Eight Days a Week. The second chord is major where you expect minor. It sounds wrong for one beat and then it sounds like the Beatles.',
   s:['Eight Days a Week','Hey Good Lookin\u2019']},
  {d:['i','v','bVI','bVII'], m:['dark','sad'],      g:['metal','rock','classical'],
   why:'Minor and bleak for two chords, then two chords climb back up, defiant. House of the Rising Sun feel.',
   s:['House of the Rising Sun (feel)']},
  {d:['I','vi','iii','IV'], m:['bittersweet','dreamy'], g:['jazz','indie','pop'],
   why:'Each chord shares two notes with the one before, so it barely moves and still travels. Fly Me to the Moon.',
   s:['Fly Me to the Moon']},
  {d:['I','IV','ii','V'],  m:['bright','bittersweet'], g:['jazz','bossa','country','worship'],
   why:'A gentler jazz turn. The second chord softens things before the third one pulls you round to the top.',
   s:['Blue Bayou']}
];
/* ============================================================
   STRUM PATTERNS
   8 slots per bar (eighth notes). D down, u up, x chuck, - rest
   ============================================================ */
const STRUMS = {
  pop:      {name:'Down, down-up, up-down-up', p:['D','-','D','u','-','u','D','u'], bpm:96,  note:'The one everybody learns. Keep your hand moving on the rests.'},
  rock:     {name:'Down, then down-up, down-up, down-up', p:['D','-','D','u','D','u','D','u'], bpm:120, note:'A long first stroke, then steady down-up. Rest the side of your hand on the low strings for grit.'},
  punk:     {name:'Fast, even down-up',         p:['D','u','D','u','D','u','D','u'], bpm:168, note:'Every stroke the same weight. Punk records often use all downstrokes, but learn it alternating first: same speed, half the effort, and your upstroke gets a workout.'},
  metal:    {name:'Chug on the low strings',   p:['D','x','D','x','D','D','x','D'], bpm:140, note:'Palm mute everything, hit only the bottom three strings.'},
  country:  {name:'Bass note, then strum',     p:['B','-','D','u','B','-','D','u'], bpm:104, note:'B is the root note alone. Alternate root and fifth if you can find it.'},
  bluegrass:{name:'Boom-chuck',                p:['B','-','x','-','B','-','x','-'], bpm:132, note:'Bass note, muted chop. The chop is the snare drum.'},
  folk:     {name:'Down, down-up, down-up',    p:['D','-','D','u','-','u','D','-'], bpm:88,  note:'Lighter than pop. Let the low string ring under it.'},
  indie:    {name:'Fingerpicked, thumb steady',p:['P','p','P','p','P','p','P','p'], bpm:82,  note:'Thumb on the root, fingers on the top three. P is thumb.'},
  blues:    {name:'Shuffle',                   p:['D','-','u','D','-','u','D','u'], bpm:92,  note:'Swing the eighths. Long-short, long-short.'},
  jazz:     {name:'Four to the bar',           p:['D','-','D','-','D','-','D','-'], bpm:132, note:'Four short downstrokes, no ring, no upstrokes on purpose. This is the one style where all-down is the point: it is the drummer\'s job you are doing.'},
  bossa:    {name:'Thumb and syncopated top',  p:['P','-','p','P','-','p','-','p'], bpm:126, note:'Thumb on beats, fingers off them. The gap is the groove.'},
  latin:    {name:'Syncopated, accent the and',p:['D','-','-','u','D','u','-','u'], bpm:112, note:'Accent the upbeats. The downbeat can be silent.'},
  worship:  {name:'Open, ringing eighths',     p:['D','-','D','u','D','-','D','u'], bpm:76,  note:'Let everything ring. Nothing muted, nothing rushed.'},
  flamenco: {name:'Rasgueado feel',            p:['D','u','u','D','-','u','D','u'], bpm:118, note:'Roll your fingers out across the strings instead of picking.'},
  classical:{name:'Arpeggiated',               p:['P','p','p','P','p','p','P','p'], bpm:72,  note:'One string at a time, low to high. Never strum.'}
};
const GENRE_LABEL = {pop:'Pop',rock:'Rock',punk:'Punk',metal:'Metal',country:'Country',bluegrass:'Bluegrass',
  folk:'Folk',indie:'Indie',blues:'Blues',jazz:'Jazz',bossa:'Bossa nova',latin:'Latin',worship:'Worship',
  flamenco:'Flamenco',classical:'Classical'};

const MOODS = ['bright','sad','bittersweet','dreamy','driving','dark','tense'];

/* ============================================================
   RESOLVE a progression into playable chords
   ============================================================ */
function isMinorProg(p){ return p.d.some(x => x === 'i' || x === 'i7'); }

function degreeInfo(prog, deg){
  const map = isMinorProg(prog) ? DEG_MIN : DEG;
  return map[deg] || DEG[deg] || {s:0, q:'maj'};
}

/* soundingKey = what the audience hears. shapeKey = what your hands play. */
function resolve(prog, soundingKeyPc, shapeKeyPc){
  const capo = ((soundingKeyPc - shapeKeyPc) % 12 + 12) % 12;
  const chords = prog.d.map(deg => {
    const info = degreeInfo(prog, deg);
    const shapeRoot = (shapeKeyPc + info.s) % 12;
    const soundRoot = (soundingKeyPc + info.s) % 12;
    const sh = shapeFor(shapeRoot, info.q);
    return {
      deg, shape: sh,
      played: sh.name,
      sounding: PC[soundRoot] + (SUFFIX[info.q] ?? ''),
      quality: info.q,
      rootPc: shapeRoot
    };
  });
  let worst = 0, costs = [];
  for(let i = 0; i < chords.length; i++){
    const a = chords[i].shape, b = chords[(i + 1) % chords.length].shape;
    const c = chords.length > 1 ? transitionCost(a, b) : 0;
    costs.push(c);
    if(c > worst) worst = c;
  }
  const barres = chords.filter(c => c.shape.b).length;
  return {capo, chords, costs, worst, barres, shapeKeyPc, soundingKeyPc};
}

/* every capo position that keeps the same sounding key */
function capoOptions(prog, soundingKeyPc, allowCapo, minor){
  const pool = minor ? GUITAR_KEYS_MIN : GUITAR_KEYS;
  const out = [];
  for(const k of pool){
    const pc = pcOf(k);
    const capo = ((soundingKeyPc - pc) % 12 + 12) % 12;
    if(capo > 7) continue;                 // past 7 it gets silly and thin
    if(!allowCapo && capo !== 0) continue;
    out.push(resolve(prog, soundingKeyPc, pc));
  }
  if(!out.length) out.push(resolve(prog, soundingKeyPc, soundingKeyPc));
  return out.sort((a, b) => a.worst - b.worst);
}

const HAND_CAP = {open:1.9, some:3.6, any:99};

function pickVoicing(prog, soundingKeyPc, allowCapo, hands){
  const opts = capoOptions(prog, soundingKeyPc, allowCapo, isMinorProg(prog));
  const cap = HAND_CAP[hands];
  const fits = opts.filter(o => o.worst <= cap && (hands !== 'open' || o.barres === 0));
  return (fits[0] || opts[0]);
}

/* ============================================================
   SONG FORM — the chorus is built from the verse, not invented
   ============================================================ */
function deriveForm(prog){
  const v = prog.d.slice();
  const minor = isMinorProg(prog);
  let chorus;
  if(v.length >= 4){
    // rotate so the section opens on the brightest chord available
    const target = minor ? 'VI' : 'IV';
    const at = v.indexOf(target);
    chorus = at > 0 ? v.slice(at).concat(v.slice(0, at)) : v.slice(1).concat(v.slice(0, 1));
  } else {
    chorus = v.concat(minor ? ['VI','VII'] : ['IV','V']);
  }
  const pre    = minor ? ['iv','V'] : ['ii','V'];
  const bridge = minor ? ['VI','III','VII','i'] : ['vi','iii','IV','V'];
  return [
    {lab:'Verse',      d:v,      note:'Where you are now. Play it twice before anything changes.'},
    {lab:'Pre-chorus', d:pre,    note:'Two bars that refuse to resolve. Sit on the last chord one beat too long.'},
    {lab:'Chorus',     d:chorus, note:'Your verse, re-entered from a different door. Same chords, higher voice.'},
    {lab:'Bridge',     d:bridge, note:'Go here once, around two thirds through, then never again.'}
  ];
}

/* ============================================================
   PARTS FOR THE ROOM
   ============================================================ */
const PENTA_MIN = [[0,3],[0,2],[0,2],[0,2],[0,3],[0,3]];   // frets rel. to root, low->high

function bandParts(prog, voicing, soundingKeyPc){
  const minor = isMinorProg(prog);
  const g1 = voicing;

  // second guitar: a different shape key, ideally 4-7 frets up, same sounding chords
  const pool = capoOptions(prog, soundingKeyPc, true, minor)
    .filter(o => o.capo !== g1.capo)
    .sort((a, b) => (Math.abs(b.capo - g1.capo) - Math.abs(a.capo - g1.capo)) || (a.worst - b.worst));
  const g2 = pool.find(o => o.capo > g1.capo) || pool[0] || g1;

  // lead: minor pentatonic of the relative minor (or the tonic, in a minor key)
  const leadRootPc = minor ? soundingKeyPc : (soundingKeyPc + 9) % 12;
  const lowEFret = ((leadRootPc - 4) % 12 + 12) % 12;

  return {
    g1, g2,
    bass: g1.chords.map(c => pretty(c.sounding.replace(/(maj7|m7|sus4|sus2|add9|m|7)$/,''))),
    lead: {
      root: pretty(PC[leadRootPc]),
      fret: lowEFret === 0 ? 12 : lowEFret,
      name: pretty(PC[leadRootPc]) + ' minor pentatonic',
      targets: g1.chords.map(c => pretty(c.sounding))
    }
  };
}

/* which open-shape keys make sense for this progression */
function allowedShapes(minor){ return minor ? GUITAR_KEYS_MIN : GUITAR_KEYS; }
/* ============================================================
   STATE
   The model a beginner actually holds: you pick the SHAPES you
   know, you put the capo somewhere, and that decides what key
   the room hears.   sounding = shapes + capo
   ============================================================ */
const state = {
  progIdx: 5,
  shapePc: 7,           // the open shapes you play (G)
  capo: 0,              // fret the capo is on, 0 = none
  hands: 'open',
  capoOk: true,
  mood: 'any',
  genre: 'any',
  len: 'any',
  locks: {},            // slot index -> played chord name (the shape on the card)
  bpm: 96
};
let voicing = null, band = null, prog = null;

const soundingPc = () => (state.shapePc + state.capo) % 12;

const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

function toast(msg){
  const t = $('#ss-toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(t._x); t._x = setTimeout(() => t.classList.remove('show'), 2600);
}

/* if the progression flips major/minor, snap to a legal shape key and
   keep the room hearing the same key if a capo position allows it */
function normalizeShape(p){
  const pool = allowedShapes(isMinorProg(p)).map(pcOf);
  if(pool.includes(state.shapePc)) return;
  const target = soundingPc();
  let best = null;
  for(const sp of pool){
    const capo = ((target - sp) % 12 + 12) % 12;
    if(capo <= 7 && (state.capoOk || capo === 0) && (best === null || capo < best.capo)) best = {sp, capo};
  }
  if(best){ state.shapePc = best.sp; state.capo = best.capo; }
  else { state.shapePc = pool[0]; state.capo = 0; }
}

/* ---------- candidate filtering ---------- */
function matchesFilters(p){
  if(state.len !== 'any'){
    const n = +state.len;
    if(n === 5 ? p.d.length < 5 : p.d.length !== n) return false;
  }
  if(state.mood  !== 'any' && !p.m.includes(state.mood))  return false;
  if(state.genre !== 'any' && !p.g.includes(state.genre)) return false;
  return true;
}

function voicingFor(p){
  // same shapes and capo the player has now; the tool never moves the capo behind their back
  const pool = allowedShapes(isMinorProg(p)).map(pcOf);
  let sp = state.shapePc, capo = state.capo;
  if(!pool.includes(sp)){
    const target = soundingPc();
    sp = pool.map(x => ({x, c: ((target - x) % 12 + 12) % 12})).filter(o => o.c <= 7).sort((a, b) => a.c - b.c)[0]?.x ?? pool[0];
    capo = ((target - sp) % 12 + 12) % 12;
  }
  return resolve(p, (sp + capo) % 12, sp);
}

function playableUnder(p){
  const v = voicingFor(p);
  if(state.hands === 'open' && v.barres > 0) return false;
  return v.worst <= HAND_CAP[state.hands] + 0.9;
}

function lockScore(p){
  const keys = Object.keys(state.locks);
  if(!keys.length) return 0;
  const v = voicingFor(p);
  let hits = 0;
  for(const k of keys){
    const i = +k;
    if(v.chords[i] && v.chords[i].played === state.locks[k]) hits++;
  }
  return hits;
}

function spin(){
  let pool = BANK.filter(matchesFilters);
  if(!pool.length) pool = BANK.slice();
  const fit = pool.filter(playableUnder);
  if(fit.length) pool = fit;
  else toast('Nothing in the bank fits ' + pretty(PC[state.shapePc]) + ' shapes with those hand settings. Showing the closest.');

  const lockKeys = Object.keys(state.locks);
  if(lockKeys.length){
    const scored = pool.map(p => ({p, s: lockScore(p)}));
    const best = Math.max(...scored.map(x => x.s));
    pool = scored.filter(x => x.s === best).map(x => x.p);
    if(best < lockKeys.length) toast('Kept ' + best + ' of your locked chords. Nothing in the bank held them all.');
  }
  const current = BANK[state.progIdx];
  const others  = pool.filter(p => p !== current);
  const from    = others.length ? others : pool;
  const pick    = from[Math.floor(Math.random() * from.length)];
  state.progIdx = BANK.indexOf(pick);
  render();
}

const LOCK_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/></svg>';
const LOCK_ON  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';

/* ============================================================
   CHORD DIAGRAM
   ============================================================ */
function diagram(sh, size){
  const sx = size === 'sm' ? 11 : 15, fy = size === 'sm' ? 14 : 19;
  const x0 = 14, y0 = 22, W = x0 * 2 + sx * 5, H = y0 + fy * 5 + 14;
  const on = sh.f.filter(v => v > 0);
  const hi = on.length ? Math.max(...on) : 0;
  const lo = on.length ? Math.min(...on) : 1;
  const base = hi > 5 ? lo : 1;
  const X = i => x0 + i * sx, Y = r => y0 + (r - 0.5) * fy;

  let g = '';
  for(let j = 0; j <= 5; j++){
    const w = (j === 0 && base === 1) ? 3.4 : 1;
    g += `<line x1="${x0}" y1="${y0 + j * fy}" x2="${x0 + sx * 5}" y2="${y0 + j * fy}" stroke="currentColor" stroke-width="${w}" opacity="${j === 0 && base === 1 ? .9 : .28}"/>`;
  }
  for(let i = 0; i < 6; i++)
    g += `<line x1="${X(i)}" y1="${y0}" x2="${X(i)}" y2="${y0 + fy * 5}" stroke="currentColor" stroke-width="1" opacity=".28"/>`;

  if(base > 1)
    g += `<text x="${x0 - 5}" y="${Y(1) + 4}" font-size="10" text-anchor="end" fill="currentColor" opacity=".65">${base}</text>`;

  if(sh.b){
    const row = sh.b - base + 1;
    const first = sh.f.findIndex(v => v === sh.b);
    const last  = 5 - sh.f.slice().reverse().findIndex(v => v === sh.b);
    if(row >= 1 && row <= 5 && first >= 0)
      g += `<rect x="${X(first) - 5}" y="${Y(row) - 5.5}" width="${X(last - 1) - X(first) + 10}" height="11" rx="5.5" fill="currentColor" opacity=".92"/>`;
  }

  for(let i = 0; i < 6; i++){
    const f = sh.f[i];
    if(f === -1){
      g += `<text x="${X(i)}" y="${y0 - 6}" font-size="11" text-anchor="middle" fill="currentColor" opacity=".55">\u00d7</text>`;
    } else if(f === 0){
      g += `<circle cx="${X(i)}" cy="${y0 - 9}" r="3.6" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".65"/>`;
    } else {
      const row = f - base + 1;
      if(row < 1 || row > 5) continue;
      if(sh.b && f === sh.b){
        if(sh.d[i]) g += `<text x="${X(i)}" y="${Y(row) + 3.2}" font-size="8.5" text-anchor="middle" fill="var(--ss-dot-text,#fff)">${sh.d[i]}</text>`;
        continue;
      }
      g += `<circle cx="${X(i)}" cy="${Y(row)}" r="5.4" fill="currentColor"/>`;
      if(sh.d[i]) g += `<text x="${X(i)}" y="${Y(row) + 3.2}" font-size="8.5" text-anchor="middle" fill="var(--ss-dot-text,#fff)">${sh.d[i]}</text>`;
    }
  }
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${sh.name} fingering">${g}</svg>`;
}

function fingerText(sh){
  const parts = [];
  for(let i = 0; i < 6; i++){
    if(sh.f[i] === -1) parts.push('x');
    else parts.push(String(sh.f[i]));
  }
  return parts.join(' ');
}

/* ============================================================
   RENDER
   ============================================================ */
function render(){
  prog = BANK[state.progIdx];
  const minor = isMinorProg(prog);
  normalizeShape(prog);
  spellFlats = keyUsesFlats(soundingPc());
  voicing = resolve(prog, soundingPc(), state.shapePc);
  band = bandParts(prog, voicing, soundingPc());

  let dropped = 0;
  for(const k of Object.keys(state.locks)){
    const c = voicing.chords[+k];
    if(!c || c.played !== state.locks[k]){ delete state.locks[k]; dropped++; }
  }
  if(dropped) toast('Locks cleared: the shapes on screen changed.');

  renderReadout();
  renderSlots();
  renderDetail();
  renderCapoTable();
  renderForm();
  renderBand();
  renderSongs();
  syncShapeChips();
  const sk = pretty(PC[soundingPc()]) + (minor ? ' minor' : ' major');
  const line = pretty(PC[state.shapePc]) + (minor ? 'm' : '') + ' family'
    + ' \u00b7 ' + (state.capo ? 'capo ' + state.capo : 'no capo') + ' \u00b7 sounds in ' + sk
    + ' \u00b7 ' + voicing.chords.map(c => pretty(c.played)).join(' ');
  $$('.ss-state').forEach(el => el.textContent = line);
  const kh = $('#keyHint');
  if(kh) kh.textContent = minor
    ? 'This progression starts on a minor chord, so these are minor keys.'
    : 'Singing along and it sits too high or low? Change this.';
  writeHash();
  $$('[data-carry]').forEach(a => { a.href = a.dataset.carry + location.hash; });
}

function renderReadout(){
  if(!$('#capoRuler')) return;
  const minor = isMinorProg(prog);
  const sh = pretty(PC[state.shapePc]) + (minor ? 'm' : '');
  const so = pretty(PC[soundingPc()]) + (minor ? ' minor' : ' major');
  $('#readShapes').textContent = sh + ' family';
  $('#readCapo').textContent = state.capo ? 'capo on fret ' + state.capo : 'no capo';
  $('#readSound').textContent = so;
  const fam = familyChords(state.shapePc, minor).join(', ');
  $('#readSentence').textContent = state.capo
    ? 'Your fingers are making ' + sh + '-family chords (' + fam + '). The capo on fret ' + state.capo + ' raises every one of them ' + state.capo + ' half step' + (state.capo > 1 ? 's' : '') + ', so what the room hears is ' + so + '.'
    : 'Your fingers are making ' + sh + '-family chords (' + fam + '). No capo, so that is exactly what the room hears: ' + so + '.';

  // the ruler: one button per fret, labelled with the key it would sound in
  const r = $('#capoRuler'); r.innerHTML = '';
  for(let f = 0; f <= 7; f++){
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ss-fret';
    b.dataset.f = f;
    b.setAttribute('aria-pressed', String(f === state.capo));
    b.disabled = (!state.capoOk && f !== 0);
    const kp = (state.shapePc + f) % 12;
    const key = pretty(PC[kp], keyUsesFlats(kp)) + (minor ? 'm' : '');
    b.innerHTML = `<span class="ss-fret__n">${f === 0 ? 'none' : f}</span><span class="ss-fret__k">${key}</span>`;
    b.setAttribute('aria-label', (f === 0 ? 'No capo' : 'Capo on fret ' + f) + ', sounds in ' + key);
    b.addEventListener('click', () => { state.capo = f; render(); });
    r.appendChild(b);
  }
}

function familyChords(shapePc, minor){
  const degs = minor ? ['i','iv','v','VI'] : ['I','IV','V','vi'];
  const map  = minor ? DEG_MIN : DEG;
  return degs.map(dg => {
    const info = map[dg];
    return pretty(shapeFor((shapePc + info.s) % 12, info.q).name, keyUsesFlats(shapePc));
  });
}

function syncShapeChips(){
  if(!$('#cShape')) return;
  const minor = isMinorProg(prog);
  const box = $('#cShape'); box.innerHTML = '';
  allowedShapes(minor).forEach(k => {
    const pc = pcOf(k);
    const fam = familyChords(pc, minor);
    const hasBarre = fam.some(n => { const sh = SHAPES[n.replace('\u266d','#').replace(/^([A-G])\u266d/,'$1#')] ; return sh && sh.b; });
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ss-chip ss-chip--fam';
    b.setAttribute('aria-pressed', String(pc === state.shapePc));
    b.setAttribute('aria-label', pretty(k) + (minor ? ' minor' : '') + ' family: ' + fam.join(', '));
    b.innerHTML = `<b>${pretty(k, keyUsesFlats(pc))}${minor ? 'm' : ''}</b><small>${fam.join(' \u00b7 ')}</small>`;
    b.addEventListener('click', () => { state.shapePc = pc; render(); });
    box.appendChild(b);
  });
}

function renderSlots(){
  if(!$('#slots')) return;
  const box = $('#slots'); box.innerHTML = '';
  voicing.chords.forEach((c, i) => {
    const locked = state.locks[i] === c.played;
    const el = document.createElement('div');
    el.className = 'ss-slot'; el.setAttribute('role', 'listitem');
    el.dataset.locked = locked; el.dataset.i = i;
    el.innerHTML =
      `<div class="ss-deg">${c.deg}</div>
       <div class="ss-name">${pretty(c.played)}</div>
       <div class="ss-bars">${state.capo ? 'sounds like ' + pretty(c.sounding) : 'sounds as written'}</div>
       <button class="ss-lock" aria-pressed="${locked}" aria-label="${locked ? 'Unlock' : 'Lock'} ${pretty(c.played)}" title="${locked ? 'Locked. Spin will keep this chord.' : 'Lock this chord so Spin keeps it.'}">${locked ? LOCK_ON : LOCK_OFF}</button>`;
    el.querySelector('.ss-lock').addEventListener('click', () => {
      if(state.locks[i]) delete state.locks[i]; else state.locks[i] = c.played;
      renderSlots(); writeHash();
    });
    box.appendChild(el);
  });

  const bt = $('#between'); bt.innerHTML = '';
  voicing.chords.forEach((c, i) => {
    const nxt = voicing.chords[(i + 1) % voicing.chords.length];
    const L = costLabel(voicing.costs[i]);
    const s = document.createElement('span');
    s.className = 'ss-chg-' + L.k;
    const last = i === voicing.chords.length - 1;
    s.innerHTML = voicing.chords.length > 1
      ? `${pretty(c.played)}\u2009\u2192\u2009${pretty(nxt.played)}${last ? ' (back to the top)' : ''} <b>${L.t}</b>` : '';
    bt.appendChild(s);
  });
}

function renderDetail(){
  if(!$('#chords')) return;
  const L = costLabel(voicing.worst);
  const m = $('#ss-meter'); m.className = 'ss-meter ' + (L.k === 'easy' ? '' : L.k);
  m.querySelector('.ss-bar i').style.width = Math.min(100, 18 + voicing.worst * 20) + '%';
  $('#meterLab').textContent = `Hardest change: ${L.t}` + (voicing.barres ? ` (${voicing.barres} barre chord${voicing.barres > 1 ? 's' : ''})` : ', no barre chords');
  $('#whyLine').textContent = prog.why;

  const row = $('#chords'); row.innerHTML = '';
  voicing.chords.forEach(c => {
    const d = document.createElement('div');
    d.className = 'ss-chordcard';
    d.innerHTML = `<div class="ss-cdeg">${c.deg}</div><div class="ss-cname">${pretty(c.played)}</div>`
      + diagram(c.shape) + `<div class="ss-cnote">${c.shape.note || fingerText(c.shape)}</div>`;
    row.appendChild(d);
  });

  const gk = state.genre === 'any' ? guessGenre() : state.genre;
  currentGenreKey = gk;
  const st = STRUMS[gk];
  $('#strumName').textContent = '\u00b7 ' + st.name;
  $('#strumNote').textContent = st.note;
  const sbox = $('#strum'); sbox.innerHTML = '';
  st.p.forEach((sym, i) => {
    const b = document.createElement('b');
    b.dataset.i = i;
    if(i % 2 === 0) b.classList.add('beat');
    if(sym === 'D' || sym === 'B' || sym === 'P'){ b.classList.add('down'); b.textContent = sym === 'D' ? '\u2193' : sym; }
    else if(sym === 'u' || sym === 'p'){ b.classList.add('up'); b.textContent = sym === 'u' ? '\u2191' : sym; }
    else if(sym === 'x'){ b.classList.add('mute'); b.textContent = '\u00d7'; }
    else { b.classList.add('rest'); b.textContent = '\u00b7'; }
    sbox.appendChild(b);
  });
  const LEG = {
    'D':'<b>\u2193</b>downstroke, all the strings',
    'u':'<b>\u2191</b>upstroke, just the top three or four',
    '-':'<b>\u00b7</b>keep your hand swinging, miss the strings',
    'x':'<b>\u00d7</b>chuck: relax your fretting hand and hit the dead strings for a click',
    'B':'<b>B</b>bass note only, the thickest string in the shape',
    'P':'<b>P</b>thumb plucks the bass string',
    'p':'<b>p</b>fingers pluck the top three strings together'
  };
  const seen = Array.from(new Set(st.p));
  $('#strumLegend').innerHTML = seen.map(k => `<span>${LEG[k] || ''}</span>`).join('')
    + '<span><b style="border:0;color:var(--ss-accent)">\u25cf</b>dot under a box = a beat you count out loud</span>';
}

function guessGenre(){
  return 'pop';   // the standard down, down-up, up-down-up: the first strum everybody learns
}

function renderCapoTable(){
  if(!$('#capoTable')) return;
  const minor = isMinorProg(prog);
  const tb = $('#capoTable tbody'); tb.innerHTML = '';
  $('#capoTableKey').textContent = pretty(PC[soundingPc()]) + (minor ? ' minor' : ' major');
  const opts = capoOptions(prog, soundingPc(), true, minor);
  opts.sort((a, b) => a.capo - b.capo).forEach(o => {
    const L = costLabel(o.worst);
    const here = o.shapeKeyPc === state.shapePc && o.capo === state.capo;
    const tr = document.createElement('tr');
    if(here) tr.className = 'reco';
    tr.innerHTML = `<td>${pretty(PC[o.shapeKeyPc])}${minor ? 'm' : ''} family</td>
      <td>${o.capo === 0 ? 'No capo' : 'Fret ' + o.capo}</td>
      <td>${o.chords.map(c => pretty(c.played)).join('  ')}</td>
      <td>${L.t}${o.barres ? ' \u00b7 ' + o.barres + ' barre' : ''}</td>
      <td>${here ? '<span class="dim">on screen</span>' : '<button class="btn btn--sm btn--ghost">Use this</button>'}</td>`;
    const btn = tr.querySelector('button');
    if(btn) btn.addEventListener('click', () => {
      state.shapePc = o.shapeKeyPc; state.capo = o.capo; render();
      if($('#starter').scrollIntoView) $('#starter').scrollIntoView({behavior:'smooth', block:'start'});
    });
    tb.appendChild(tr);
  });
}

function renderForm(){
  if(!$('#form')) return;
  const box = $('#form'); box.innerHTML = '';
  deriveForm(prog).forEach(sec => {
    const chords = sec.d.map(deg => {
      const info = degreeInfo(prog, deg);
      return pretty(PC[(soundingPc() + info.s) % 12] + (SUFFIX[info.q] ?? ''));
    });
    const r = document.createElement('div');
    r.className = 'ss-formrow';
    r.innerHTML = `<div class="ss-lab">${sec.lab}</div>
      <div><div class="ss-progline">${chords.join('  \u00b7  ')}<em>${sec.d.join('  ')}</em></div>
      <p class="ss-why" style="font-size:.85rem;color:var(--ink-3);margin:2px 0 0">${sec.note}</p></div>`;
    box.appendChild(r);
  });
}

function renderBand(){
  if(!$('#band')) return;
  const box = $('#band'); box.innerHTML = '';
  const parts = [
    {tag:'GTR 1', cls:'', title:'Whoever is least sure',
     line: band.g1.chords.map(c => pretty(c.played)).join('  \u00b7  '),
     why: (band.g1.capo ? 'Capo on fret ' + band.g1.capo + '. ' : 'No capo. ') + 'The easiest shapes that land in this key. Strum the pattern above, or just hit each chord once on the change.'},
    {tag:'GTR 2', cls:'g2', title:'Whoever has a capo',
     line: band.g2.chords.map(c => pretty(c.played)).join('  \u00b7  '),
     why: (band.g2.capo ? 'Capo on fret ' + band.g2.capo + '. ' : 'No capo. ') + 'These are the same chords the room hears, just made with different shapes higher up the neck. Two guitars playing identical shapes fight over the same notes; put one of them here and the sound opens up.'},
    {tag:'LOW', cls:'bass', title:'Bass, or a low-tuned guitar',
     line: band.bass.join('  \u00b7  '),
     why:'One note per chord: the root, which is the note the chord is named after. Find it on the thickest two strings, play it on beat 1, and leave the rest alone. Silence is part of the job.'},
    {tag:'LEAD', cls:'lead', title:'Whoever wants to solo',
     line: band.lead.name + ' \u00b7 box starts at fret ' + band.lead.fret,
     why:'Any dot in the box below sounds fine over any of these chords, so wander. When the chord changes, try to land on the note it is named after: ' + band.lead.targets.join(', ') + '. Gold dots are home.'}
  ];
  parts.forEach(p => {
    const d = document.createElement('div');
    d.className = 'panel panel--outline ss-part';
    d.innerHTML = `<h3><span class="ss-tag ${p.cls}">${p.tag}</span> ${p.title}</h3>
      <div class="ss-line">${p.line}</div><p class="ss-why">${p.why}</p>`;
    box.appendChild(d);
  });
  const fb = document.createElement('div');
  fb.className = 'panel panel--outline ss-part';
  fb.innerHTML = `<h3><span class="ss-tag lead">BOX</span> ${band.lead.name}</h3>
    <p class="ss-why">Drawn like TAB: thickest string at the bottom, numbers along the base are frets. Each dot is a place to press. Gold dots are the root. Start on the lowest gold dot and walk up through every dot in order, then back down. That is the whole scale.</p>`
    + pentaSVG(band.lead.fret);
  box.appendChild(fb);
}

function pentaSVG(startFret){
  const sx = 46, fy = 26, x0 = 34, y0 = 22, W = x0 + sx * 4 + 24, H = y0 + fy * 5 + 20;
  let g = '';
  for(let i = 0; i < 6; i++){
    const y = y0 + i * fy;
    g += `<line x1="${x0}" y1="${y}" x2="${x0 + sx * 4}" y2="${y}" stroke="currentColor" opacity=".3"/>`;
  }
  for(let j = 0; j <= 4; j++){
    const x = x0 + j * sx;
    g += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y0 + fy * 5}" stroke="currentColor" opacity=".22"/>`;
    if(j < 4) g += `<text x="${x + sx / 2}" y="${y0 + fy * 5 + 14}" font-size="10" text-anchor="middle" fill="currentColor" opacity=".55">${startFret + j}</text>`;
  }
  PENTA_MIN.forEach((frets, s) => {
    const y = y0 + (5 - s) * fy;   // string 0 = low E, drawn at the bottom
    frets.forEach(f => {
      const x = x0 + (f + 0.5) * sx;
      const isRoot = (s === 0 && f === 0) || (s === 2 && f === 2) || (s === 5 && f === 0);
      g += `<circle cx="${x}" cy="${y}" r="8" fill="${isRoot ? 'var(--gold)' : 'currentColor'}" opacity="${isRoot ? 1 : .82}"/>`;
    });
  });
  ['E','A','D','G','B','e'].forEach((n, s) => {
    g += `<text x="${x0 - 8}" y="${y0 + (5 - s) * fy + 3.5}" font-size="10" text-anchor="end" fill="currentColor" opacity=".6">${n}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:360px;margin-top:8px" role="img" aria-label="Pentatonic box starting at fret ${startFret}">${g}</svg>`;
}

function renderSongs(){
  if(!$('#songs')) return;
  const box = $('#songs'); box.innerHTML = '';
  (prog.s || []).forEach(s => {
    const a = document.createElement('a');
    a.href = 'https://www.ultimate-guitar.com/search.php?search_type=title&value=' + encodeURIComponent(s);
    a.target = '_blank'; a.rel = 'noopener';
    a.innerHTML = s + ' <i>\u2197</i>';
    box.appendChild(a);
  });
}

/* ============================================================
   SHELF + SHARING
   ============================================================ */
const SHELF_KEY = 'trgc.songstarter.v3';

function readShelf(){
  try { return JSON.parse(localStorage.getItem(SHELF_KEY) || '[]'); }
  catch(e){ return []; }
}
function writeShelf(list){
  try { localStorage.setItem(SHELF_KEY, JSON.stringify(list.slice(0, 40))); }
  catch(e){ toast('This browser will not let the page save. The link still works.'); }
}
function renderShelf(){
  if(!$('#shelf')) return;
  const box = $('#shelf'); const list = readShelf(); box.innerHTML = '';
  if(!list.length){
    box.innerHTML = '<div class="ss-empty">Nothing kept yet. When something sounds right, hit <b>Keep this one</b> and it will wait here for you.</div>';
    return;
  }
  list.forEach((it, idx) => {
    const d = document.createElement('div');
    d.className = 'ss-shelfitem';
    d.innerHTML = `<span class="ss-nm">${it.n}</span><span class="ss-mt">${it.k}${it.c ? ' \u00b7 capo ' + it.c : ''}</span>
      <button class="btn btn--sm btn--ghost" data-a="load">Load</button><button class="btn btn--sm btn--ghost" data-a="del" aria-label="Remove">Remove</button>`;
    d.querySelector('[data-a=load]').addEventListener('click', () => { applyState(it.s); toast('Loaded.'); });
    d.querySelector('[data-a=del]').addEventListener('click', () => {
      const l = readShelf(); l.splice(idx, 1); writeShelf(l); renderShelf();
    });
    box.appendChild(d);
  });
}
function keepCurrent(){
  const list = readShelf();
  const rec = {
    n: voicing.chords.map(c => pretty(c.sounding)).join(' '),
    k: pretty(PC[soundingPc()]) + (isMinorProg(prog) ? 'm' : ''),
    c: state.capo,
    s: snapshot()
  };
  if(list.some(x => x.n === rec.n && x.k === rec.k)){ toast('Already on the shelf.'); return; }
  list.unshift(rec); writeShelf(list); renderShelf(); toast('Kept. It stays on this device.');
}

function snapshot(){
  return {p:state.progIdx, s:state.shapePc, f:state.capo, h:state.hands, c:state.capoOk ? 1 : 0,
          m:state.mood, g:state.genre, l:state.len, b:state.bpm, x:state.locks};
}
function applyState(s){
  if(!s) return;
  state.progIdx = s.p ?? state.progIdx;
  state.shapePc = s.s ?? state.shapePc;
  state.capo    = s.f ?? state.capo;
  state.hands   = s.h || state.hands;
  state.capoOk  = s.c !== 0;
  state.mood    = s.m || 'any';
  state.genre   = s.g || 'any';
  state.len     = s.l || 'any';
  state.bpm     = s.b || 96;
  state.locks   = s.x || {};
  syncControls();
  render();
}
function writeHash(){
  try {
    const enc = btoa(unescape(encodeURIComponent(JSON.stringify(snapshot()))))
      .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    history.replaceState(null, '', '#p=' + enc);
  } catch(e){ /* not fatal */ }
}
function readHash(){
  const m = location.hash.match(/#p=(.+)$/);
  if(!m) return null;
  try {
    const b = m[1].replace(/-/g,'+').replace(/_/g,'/');
    return JSON.parse(decodeURIComponent(escape(atob(b))));
  } catch(e){ return null; }
}
/* ============================================================
   AUDIO — plucked string by Karplus-Strong, rendered once per
   note into a buffer and cached. No samples, no libraries.
   ============================================================ */
let ctx = null, master = null;
const bufCache = new Map();

function audio(){
  if(ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.85;
  const soft = ctx.createBiquadFilter();
  soft.type = 'lowpass'; soft.frequency.value = 5200;
  master.connect(soft); soft.connect(ctx.destination);
  return ctx;
}

function pluckBuffer(midi){
  if(bufCache.has(midi)) return bufCache.get(midi);
  const sr = ctx.sampleRate;
  const freq = 440 * Math.pow(2, (midi - 69) / 12);
  const N = Math.max(2, Math.round(sr / freq));
  const len = Math.floor(sr * 2.4);
  const buf = ctx.createBuffer(1, len, sr);
  const y = buf.getChannelData(0);

  // noise burst, low-passed so it reads as flesh on a wound string
  let last = 0;
  for(let i = 0; i < N; i++){
    const n = Math.random() * 2 - 1;
    last = last * 0.62 + n * 0.38;
    y[i] = last;
  }
  const damp = midi > 60 ? 0.494 : 0.4975;      // higher strings die faster
  for(let i = N; i < len; i++){
    y[i] = (y[i - N] + y[i - N + 1]) * damp * (1 - 0.00002);
  }
  // fade the tail so nothing clicks when it is cut off
  const f = Math.floor(sr * 0.12);
  for(let i = len - f; i < len; i++) y[i] *= (len - i) / f;

  bufCache.set(midi, buf);
  return buf;
}

function note(midi, t, gain, dur){
  const src = ctx.createBufferSource();
  src.buffer = pluckBuffer(midi);
  const g = ctx.createGain();
  g.gain.value = gain;
  if(dur){
    g.gain.setValueAtTime(gain, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  src.connect(g); g.connect(master);
  src.start(t);
  src.stop(t + (dur || 2.3));
  live.push(src);
}

function chuck(t){
  const dur = 0.09, sr = ctx.sampleRate;
  const b = ctx.createBuffer(1, Math.floor(sr * dur), sr);
  const d = b.getChannelData(0);
  for(let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) * 0.5;
  const s = ctx.createBufferSource(); s.buffer = b;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 1.1;
  const g = ctx.createGain(); g.gain.value = 0.5;
  s.connect(f); f.connect(g); g.connect(master); s.start(t); live.push(s);
}

function click(t, accent){
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.value = accent ? 1500 : 1000;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(accent ? 0.3 : 0.16, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.08);
  live.push(o);
}

/* strum one shape */
function strike(shape, capo, t, sym){
  const idx = [0,1,2,3,4,5].filter(i => shape.f[i] >= 0);
  if(!idx.length) return;
  const midiOf = i => OPEN_MIDI[i] + shape.f[i] + capo;

  if(sym === 'B' || sym === 'P'){
    note(midiOf(idx[0]), t, 0.85, sym === 'P' ? 1.6 : 0.9);
    if(sym === 'P' && idx.length > 1) note(midiOf(idx[1]), t + 0.004, 0.28, 1.4);
    return;
  }
  if(sym === 'p'){
    const top = idx.slice(-3);
    top.forEach((s, k) => note(midiOf(s), t + k * 0.022, 0.5 - k * 0.05, 1.2));
    return;
  }
  if(sym === 'x'){ chuck(t); return; }

  const down = (sym === 'D');
  const order = down ? idx : idx.slice().reverse();
  const use = down ? order : order.slice(0, Math.min(4, order.length));
  const spread = down ? 0.014 : 0.010;
  use.forEach((s, k) => {
    const v = (down ? 0.62 : 0.42) * (1 - k * 0.035) * (0.94 + Math.random() * 0.12);
    note(midiOf(s), t + k * spread, Math.max(0.12, v), down ? 1.9 : 1.3);
  });
}

/* ---------- transport ---------- */
let live = [], playing = false, marks = [], rafId = 0;

function stopAll(){
  playing = false;
  live.forEach(s => { try{ s.stop(); }catch(e){} });
  live = []; marks = [];
  cancelAnimationFrame(rafId);
  $$('.ss-slot').forEach(s => s.classList.remove('playing'));
  $$('.ss-strum b').forEach(b => b.classList.remove('hit'));
  const pb = $('#playBtn');
  if(pb){ pb.textContent = 'Play'; pb.setAttribute('aria-label', 'Play the progression'); }
}

function play(skipCount){
  audio();
  if(ctx.state === 'suspended') ctx.resume();
  stopAll();
  playing = true;
  $('#playBtn').textContent = 'Stop';
  $('#playBtn').setAttribute('aria-label', 'Stop');

  const bpm = state.bpm;
  const beat = 60 / bpm, eighth = beat / 2;
  const gk = state.genre === 'any' ? currentGenreKey : state.genre;
  const pat = STRUMS[gk].p;
  const metro = !!($('#metro') && $('#metro').checked);
  let t = ctx.currentTime + 0.12;

  if($('#countin') && $('#countin').checked && !skipCount){
    for(let i = 0; i < 4; i++){ click(t + i * beat, i === 0); }
    t += 4 * beat;
  }

  const REPEATS = 4;
  const chords = voicing.chords;
  for(let r = 0; r < REPEATS; r++){
    chords.forEach((c, ci) => {
      const barStart = t;
      marks.push({at: barStart, slot: ci});
      pat.forEach((sym, si) => {
        const at = barStart + si * eighth;
        if(sym !== '-') strike(c.shape, voicing.capo, at, sym);
        if(metro && si % 2 === 0) click(at, si === 0);
        marks.push({at, cell: si});
      });
      t += eighth * 8;
    });
  }
  const endAt = t;

  const tick = () => {
    if(!playing) return;
    const now = ctx.currentTime;
    if(now > endAt){
      if($('#loopchk') && $('#loopchk').checked){ play(true); return; }
      stopAll(); return;
    }
    for(let i = marks.length - 1; i >= 0; i--){
      const m = marks[i];
      if(m.at <= now && !m.done && now - m.at < 0.12){
        m.done = true;
        if(m.slot !== undefined){
          $$('.ss-slot').forEach(s => s.classList.toggle('playing', +s.dataset.i === m.slot));
        }
        if(m.cell !== undefined){
          $$('.ss-strum b').forEach(b => b.classList.toggle('hit', +b.dataset.i === m.cell));
        }
      }
    }
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

/* ============================================================
   TUNER — autocorrelation, mic stays in the browser
   ============================================================ */
let tuning = false, tstream = null;
const STRING_NAMES = ['E','A','D','G','B','e'];

function noteFromFreq(f){
  const midi = 69 + 12 * Math.log2(f / 440);
  const near = Math.round(midi);
  return {name: PC[((near % 12) + 12) % 12], cents: Math.round((midi - near) * 100), midi: near};
}

function autocorrelate(buf, sr){
  let rms = 0;
  for(let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / buf.length);
  if(rms < 0.01) return -1;

  let r1 = 0, r2 = buf.length - 1;
  const thres = 0.2;
  for(let i = 0; i < buf.length / 2; i++) if(Math.abs(buf[i]) < thres){ r1 = i; break; }
  for(let i = 1; i < buf.length / 2; i++) if(Math.abs(buf[buf.length - i]) < thres){ r2 = buf.length - i; break; }
  const b = buf.slice(r1, r2), n = b.length;
  const c = new Float32Array(n).fill(0);
  for(let lag = 0; lag < n; lag++)
    for(let i = 0; i < n - lag; i++) c[lag] += b[i] * b[i + lag];

  let d = 0; while(d < n - 1 && c[d] > c[d + 1]) d++;
  let max = -1, pos = -1;
  for(let i = d; i < n; i++) if(c[i] > max){ max = c[i]; pos = i; }
  if(pos <= 0) return -1;
  const x1 = c[pos - 1], x2 = c[pos], x3 = c[pos + 1] || 0;
  const a = (x1 + x3 - 2 * x2) / 2, bb = (x3 - x1) / 2;
  const T = a ? pos - bb / (2 * a) : pos;
  return sr / T;
}

async function toggleTuner(){
  const btn = $('#ss-tunerBtn');
  if(tuning){
    tuning = false;
    if(tstream) tstream.getTracks().forEach(t => t.stop());
    btn.textContent = 'Turn on the tuner';
    $('#ss-tunerNote').textContent = '\u2014';
    return;
  }
  try{
    tstream = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false, noiseSuppression:false, autoGainControl:false}});
  }catch(e){
    toast('No microphone access. Check the browser permission for this site.');
    return;
  }
  audio();
  if(ctx.state === 'suspended') ctx.resume();
  const src = ctx.createMediaStreamSource(tstream);
  const an = ctx.createAnalyser(); an.fftSize = 2048;
  src.connect(an);
  const data = new Float32Array(an.fftSize);
  tuning = true;
  btn.textContent = 'Turn off the tuner';

  const loop = () => {
    if(!tuning) return;
    an.getFloatTimeDomainData(data);
    const f = autocorrelate(data, ctx.sampleRate);
    if(f > 55 && f < 1400){
      const n = noteFromFreq(f);
      $('#ss-tunerNote').textContent = pretty(n.name);
      $('#ss-tunerCents').textContent = (n.cents === 0 ? 'In tune' : (n.cents > 0 ? '+' : '') + n.cents + ' cents')
        + ' \u00b7 ' + f.toFixed(1) + ' Hz';
      const pin = $('#ss-tunerPin');
      pin.style.left = Math.max(2, Math.min(98, 50 + n.cents * 0.9)) + '%';
      pin.classList.toggle('intune', Math.abs(n.cents) <= 4);
      const si = OPEN_MIDI.indexOf(n.midi);
      $$('#ss-tunerStrings b').forEach((b, i) => b.classList.toggle('on', i === si));
    }
    requestAnimationFrame(loop);
  };
  loop();
}

/* ============================================================
   CONTROLS
   ============================================================ */
let currentGenreKey = 'pop';

const on = (sel, ev, fn) => { const el = $(sel); if(el) el.addEventListener(ev, fn); return el; };

function chipGroup(sel, items, get, set){
  const box = $(sel); if(!box) return; box.innerHTML = '';
  items.forEach(it => {
    const b = document.createElement('button');
    b.className = 'ss-chip'; b.type = 'button';
    b.textContent = it.label; b.dataset.v = it.v;
    b.setAttribute('aria-pressed', String(get() === it.v));
    b.addEventListener('click', () => {
      set(it.v);
      Array.from(box.children).forEach(c => c.setAttribute('aria-pressed', String(c.dataset.v === String(it.v))));
      render();
    });
    box.appendChild(b);
  });
}

function syncControls(){
  if(!$('#cLen')) return;
  $$('#cLen .ss-chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.v === String(state.len))));
  $$('#cHands .ss-chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.v === state.hands)));
  $$('#cCapo .ss-chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.v === String(state.capoOk))));
  $$('#cMood .ss-chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.v === state.mood)));
  $('#cGenre').value = state.genre;
  $('#cKey').value = String(soundingPc());
  $('#bpm').value = state.bpm; $('#bpmOut').textContent = state.bpm;
}

function buildControls(){
  chipGroup('#cLen', [
    {label:'Any', v:'any'}, {label:'2', v:'2'}, {label:'3', v:'3'}, {label:'4', v:'4'}, {label:'5+', v:'5'}
  ], () => state.len, v => state.len = v);

  chipGroup('#cHands', [
    {label:'Open chords only', v:'open'}, {label:'A barre or two', v:'some'}, {label:'Anything', v:'any'}
  ], () => state.hands, v => state.hands = v);

  chipGroup('#cCapo', [
    {label:'I have a capo', v:'true'}, {label:'I do not', v:'false'}
  ], () => String(state.capoOk), v => { state.capoOk = (v === 'true'); if(!state.capoOk) state.capo = 0; });

  chipGroup('#cMood', [{label:'Surprise me', v:'any'}].concat(
    MOODS.map(m => ({label: m[0].toUpperCase() + m.slice(1), v:m}))
  ), () => state.mood, v => state.mood = v);

  const g = $('#cGenre');
  if(g){ g.innerHTML = '<option value="any">Standard strum (learn this first)</option>' +
    Object.keys(STRUMS).map(k => `<option value="${k}">${GENRE_LABEL[k]}</option>`).join('');
  g.addEventListener('change', () => {
    state.genre = g.value;
    if(state.genre !== 'any'){ state.bpm = STRUMS[state.genre].bpm; $('#bpm').value = state.bpm; $('#bpmOut').textContent = state.bpm; }
    render();
  }); }

  const k = $('#cKey');
  if(k){ k.innerHTML = [7,0,2,9,4,5,10,3,11,8,1,6]
    .map(pc => `<option value="${pc}">${pretty(PC[pc])}</option>`).join('');
  k.addEventListener('change', () => {
    // the helper direction: "make it sound in X" -> pick shapes + capo that get there easiest
    const target = +k.value;
    const v = pickVoicing(prog, target, state.capoOk, state.hands);
    state.shapePc = v.shapeKeyPc; state.capo = v.capo;
    render();
    const minor = isMinorProg(prog);
    toast('To sound in ' + pretty(PC[target]) + (minor ? ' minor' : '') + ': play the ' + pretty(PC[v.shapeKeyPc]) + (minor ? 'm' : '') + ' family'
      + (v.capo ? ' with the capo on fret ' + v.capo + '.' : ', no capo.'));
  }); }

  on('#bpm', 'input', e => {
    state.bpm = +e.target.value; $('#bpmOut').textContent = state.bpm;
    if(playing){ play(true); }
  });

  on('#playBtn', 'click', () => playing ? stopAll() : play());
  on('#spinBtn', 'click', () => { const was = playing; stopAll(); spin(); if(was) play(); });
  on('#unlockBtn', 'click', () => { state.locks = {}; renderSlots(); writeHash(); });

  on('#easierBtn', 'click', () => {
    const minor = isMinorProg(prog);
    const opts = capoOptions(prog, soundingPc(), state.capoOk, minor);
    const better = opts.find(o => o.worst < voicing.worst - 0.2);
    if(better){
      state.shapePc = better.shapeKeyPc; state.capo = better.capo; render();
      toast('Same key the room hears. Now the ' + pretty(PC[better.shapeKeyPc]) + (minor ? 'm' : '') + ' family' + (better.capo ? ' with the capo on fret ' + better.capo + '.' : ' with no capo.'));
    } else {
      toast('This is already the easiest way to sound in ' + pretty(PC[soundingPc()]) + (minor ? ' minor' : '') + (state.capoOk ? '.' : ' without a capo.'));
    }
  });

  on('#keepBtn', 'click', keepCurrent);
  $$('.ss-print').forEach(b => b.addEventListener('click', () => window.print()));
  $$('.ss-share').forEach(b => b.addEventListener('click', async () => {
    writeHash();
    try{ await navigator.clipboard.writeText(location.href); toast('Link copied. Send it to whoever needs to play this.'); }
    catch(e){ toast('Copy the address bar. The whole progression is in the link.'); }
  }));

  if($('#ss-tunerStrings')) $('#ss-tunerStrings').innerHTML = STRING_NAMES.map(n => `<b>${n}</b>`).join('');
  on('#ss-tunerBtn', 'click', toggleTuner);

  if($('#slots')) document.addEventListener('keydown', e => {
    if(e.target && e.target.matches && e.target.matches('input,select,textarea')) return;
    if(e.code === 'Space'){ e.preventDefault(); playing ? stopAll() : play(); }
    if(e.key === 'r' || e.key === 'R'){ spin(); }
    if(e.key === 'ArrowUp'   && state.capoOk && state.capo < 7){ state.capo++; render(); }
    if(e.key === 'ArrowDown' && state.capo > 0){ state.capo--; render(); }
  });
}

/* ============================================================
   INIT
   ============================================================ */
(function init(){
  buildControls();
  const engineOnPage = !!($('#slots') || $('#form') || $('#band'));
  if(engineOnPage){
    const fromLink = readHash();
    if(fromLink){ applyState(fromLink); }
    else {
      state.progIdx = BANK.findIndex(p => p.d.length === 4 && p.m.includes('bright'));
      if(state.progIdx < 0) state.progIdx = 0;
      syncControls();
      render();
    }
    currentGenreKey = guessGenre();
    renderShelf();
  }
  window.addEventListener('pagehide', stopAll);
})();
