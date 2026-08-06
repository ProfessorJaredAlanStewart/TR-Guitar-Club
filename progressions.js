/* =========================================================
   Trinity River Guitar Club — Song Starter
   No dependencies. Runs entirely in the browser: no server,
   no API, no audio files. Bails out quietly if its markup
   isn't on the page.

   Three parts:
     1. THEORY   — degrees, keys, voicings, capo search
     2. LIBRARY  — curated progressions (never generated from
                   rules at runtime: every entry is something
                   that works in a real song)
     3. UI       — the form, the result card, the player
   ========================================================= */
(function () {
  'use strict';

  var root = document.getElementById('prep');
  if (!root) return;

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ======================================================
     1. THEORY
     ====================================================== */

  var SHARP = ['C','C\u266F','D','D\u266F','E','F','F\u266F','G','G\u266F','A','A\u266F','B'];
  var FLAT  = ['C','D\u266D','D','E\u266D','E','F','G\u266D','G','A\u266D','A','B\u266D','B'];

  // Keys conventionally written with flats. Everything else gets sharps.
  var FLATKEYS = { '5major':1, '10major':1, '3major':1, '8major':1, '1major':1,
                   '2minor':1, '7minor':1, '0minor':1, '5minor':1, '10minor':1 };

  function noteName(pc, tonic, mode) {
    return (FLATKEYS[tonic + mode] ? FLAT : SHARP)[((pc % 12) + 12) % 12];
  }

  // quality -> how the chord is spelled and what it sounds like
  var QUAL = {
    maj:   { suffix: '',      tones: [0,4,7]      },
    min:   { suffix: 'm',     tones: [0,3,7]      },
    dom7:  { suffix: '7',     tones: [0,4,7,10]   },
    maj7:  { suffix: 'maj7',  tones: [0,4,7,11]   },
    min7:  { suffix: 'm7',    tones: [0,3,7,10]   },
    sus2:  { suffix: 'sus2',  tones: [0,2,7]      },
    sus4:  { suffix: 'sus4',  tones: [0,5,7]      },
    add9:  { suffix: 'add9',  tones: [0,4,7,14]   },
    pow:   { suffix: '5',     tones: [0,7]        }
  };

  function chordName(pc, qual, tonic, mode) {
    return noteName(pc, tonic, mode) + QUAL[qual].suffix;
  }

  /* ---- voicings -------------------------------------------------------
     f  = fret per string, low E first. -1 is muted, 0 is open.
     d  = finger per string (0 = none).
     lvl: 0 open · 1 movable but no barre · 2 barre.
     Every open voicing below is a shape the club already teaches on the
     Play Along page, so the diagrams match what students have seen.      */

  var OPEN = {
    '0maj':  { f:[-1,3,2,0,1,0],   d:[0,3,2,0,1,0] },
    '2maj':  { f:[-1,-1,0,2,3,2],  d:[0,0,0,1,3,2] },
    '4maj':  { f:[0,2,2,1,0,0],    d:[0,2,3,1,0,0] },
    '7maj':  { f:[3,2,0,0,0,3],    d:[2,1,0,0,0,3] },
    '9maj':  { f:[-1,0,2,2,2,0],   d:[0,0,1,2,3,0] },

    '9min':  { f:[-1,0,2,2,1,0],   d:[0,0,2,3,1,0] },
    '4min':  { f:[0,2,2,0,0,0],    d:[0,2,3,0,0,0] },
    '2min':  { f:[-1,-1,0,2,3,1],  d:[0,0,0,2,3,1] },

    '9dom7': { f:[-1,0,2,0,2,0],   d:[0,0,2,0,3,0] },
    '11dom7':{ f:[-1,2,1,2,0,2],   d:[0,2,1,3,0,4] },
    '0dom7': { f:[-1,3,2,3,1,0],   d:[0,3,2,4,1,0] },
    '2dom7': { f:[-1,-1,0,2,1,2],  d:[0,0,0,2,1,3] },
    '4dom7': { f:[0,2,0,1,0,0],    d:[0,2,0,1,0,0] },
    '7dom7': { f:[3,2,0,0,0,1],    d:[3,2,0,0,0,1] },

    '0maj7': { f:[-1,3,2,0,0,0],   d:[0,3,2,0,0,0] },
    '7maj7': { f:[3,2,0,0,0,2],    d:[3,2,0,0,0,1] },
    '5maj7': { f:[-1,-1,3,2,1,0],  d:[0,0,3,2,1,0] },
    '9maj7': { f:[-1,0,2,1,2,0],   d:[0,0,2,1,3,0] },
    '2maj7': { f:[-1,-1,0,2,2,2],  d:[0,0,0,1,1,1] },

    '9min7': { f:[-1,0,2,0,1,0],   d:[0,0,2,0,1,0] },
    '4min7': { f:[0,2,0,0,0,0],    d:[0,2,0,0,0,0] },
    '2min7': { f:[-1,-1,0,2,1,1],  d:[0,0,0,2,1,1] },

    '9sus2': { f:[-1,0,2,2,0,0],   d:[0,0,1,2,0,0] },
    '2sus2': { f:[-1,-1,0,2,3,0],  d:[0,0,0,1,3,0] },
    '9sus4': { f:[-1,0,2,2,3,0],   d:[0,0,1,2,3,0] },
    '2sus4': { f:[-1,-1,0,2,3,3],  d:[0,0,0,1,2,3] },
    '4sus4': { f:[0,2,2,2,0,0],    d:[0,1,2,3,0,0] },
    '0add9': { f:[-1,3,2,0,3,0],   d:[0,2,1,0,3,0] },
    '7add9': { f:[3,-1,0,2,0,3],   d:[2,0,0,1,0,3] }
  };

  // Movable shapes. root string 5 = low E (index 0), 4 = A (index 1).
  // 'rel' is fret offset from the barre; the root fret is added at build time.
  var MOVABLE = {
    maj:  [ { rs:0, rel:[0,2,2,1,0,0], d:[1,3,4,2,1,1], barre:[0,5], lvl:2 },
            { rs:1, rel:[-1,0,2,2,2,0], d:[0,1,2,3,4,1], barre:[1,5], lvl:2 } ],
    min:  [ { rs:0, rel:[0,2,2,0,0,0], d:[1,3,4,1,1,1], barre:[0,5], lvl:2 },
            { rs:1, rel:[-1,0,2,2,1,0], d:[0,1,3,4,2,1], barre:[1,5], lvl:2 } ],
    dom7: [ { rs:0, rel:[0,2,0,1,0,0], d:[1,3,1,2,1,1], barre:[0,5], lvl:2 },
            { rs:1, rel:[-1,0,2,0,2,0], d:[0,1,3,1,4,1], barre:[1,5], lvl:2 } ],
    min7: [ { rs:0, rel:[0,2,0,0,0,0], d:[1,3,1,1,1,1], barre:[0,5], lvl:2 },
            { rs:1, rel:[-1,0,2,0,1,0], d:[0,1,3,1,2,1], barre:[1,5], lvl:2 } ],
    maj7: [ { rs:0, rel:[0,2,1,1,0,0], d:[1,3,2,4,1,1], barre:[0,5], lvl:2 },
            { rs:1, rel:[-1,0,2,1,2,0], d:[0,1,3,2,4,1], barre:[1,5], lvl:2 } ],
    sus4: [ { rs:0, rel:[0,2,2,2,0,0], d:[1,2,3,4,1,1], barre:[0,5], lvl:2 },
            { rs:1, rel:[-1,0,2,2,3,0], d:[0,1,2,3,4,1], barre:[1,5], lvl:2 } ],
    sus2: [ { rs:1, rel:[-1,0,2,2,0,0], d:[0,1,3,4,1,1], barre:[1,5], lvl:2 } ],
    add9: [ { rs:1, rel:[-1,0,2,4,2,0], d:[0,1,2,4,3,1], barre:[1,5], lvl:2 } ],
    // power chords need two fingers and no barre — easy at any fret
    pow:  [ { rs:0, rel:[0,2,2,-1,-1,-1], d:[1,3,4,0,0,0], lvl:1 },
            { rs:1, rel:[-1,0,2,2,-1,-1], d:[0,1,3,4,0,0], lvl:1 } ]
  };

  var OPEN_PC = [4, 9, 2, 7, 11, 4];         // pitch class of each open string
  var OPEN_MIDI = [40, 45, 50, 55, 59, 64];  // E2 A2 D3 G3 B3 E4

  /* Best voicing for a pitch class + quality.
     Open shapes win; otherwise the lowest playable movable shape wins. */
  function voice(pc, qual) {
    pc = ((pc % 12) + 12) % 12;
    var key = pc + qual;
    if (OPEN[key]) {
      return { f: OPEN[key].f.slice(), d: OPEN[key].d.slice(), base: 1, lvl: 0 };
    }
    var shapes = MOVABLE[qual] || MOVABLE.maj;
    var best = null;
    for (var i = 0; i < shapes.length; i++) {
      var sh = shapes[i];
      var fret = ((pc - OPEN_PC[sh.rs]) % 12 + 12) % 12;
      if (fret === 0) fret = 12;             // open handled above; 12 keeps it playable
      if (fret > 9) continue;                // anything past 9 is an awkward reach
      var cand = build(sh, fret);
      if (!best || fret < best.fret) { best = { v: cand, fret: fret }; }
    }
    if (!best) {                             // fall back to the lowest of any shape
      var sh2 = shapes[0];
      var f2 = ((pc - OPEN_PC[sh2.rs]) % 12 + 12) % 12 || 12;
      best = { v: build(sh2, f2), fret: f2 };
    }
    return best.v;
  }

  function build(sh, fret) {
    var f = sh.rel.map(function (r) { return r === -1 ? -1 : r + fret; });
    var v = { f: f, d: sh.d.slice(), base: fret > 1 ? fret : 1, lvl: sh.lvl };
    if (sh.barre) v.barre = { fret: fret, from: sh.barre[0], to: sh.barre[1] };
    return v;
  }

  /* ---- how hard is this progression in this key? ---- */
  function costOf(prog, tonic) {
    var barres = 0, worst = 0;
    for (var i = 0; i < prog.chords.length; i++) {
      var c = prog.chords[i];
      var v = voice(tonic + c.deg, c.q);
      if (v.lvl === 2) barres++;
      if (v.lvl > worst) worst = v.lvl;
    }
    return { barres: barres, worst: worst };
  }

  // Keys guitarists reach for first, in order. Used to break ties.
  var KEY_PREF = [7, 0, 2, 9, 4, 5, 10, 3, 11, 8, 1, 6];

  function pickKey(prog, maxLvl, spread) {
    var scored = KEY_PREF.map(function (t, i) {
      var c = costOf(prog, t);
      // the +i is a mild nudge toward the keys guitarists actually use
      return { tonic: t, score: (c.worst > maxLvl ? 100 : 0) + c.barres * 10 + i, cost: c };
    }).sort(function (a, b) { return a.score - b.score; });

    // Always returning the single best key means "pick for me" hands back G
    // nearly every time. Pick at random from the keys that are effectively tied.
    if (spread) {
      var floor = scored[0].score;
      var tied = scored.filter(function (s) { return s.score <= floor + 4; });
      return tied[Math.floor(Math.random() * tied.length)];
    }
    return scored[0];
  }

  /* ---- capo: find a position where every shape is open ----
     A capo at fret N means you finger the shapes of the key N semitones
     BELOW the key you actually hear. That is the whole trick, and it is
     the single biggest unlock for someone who cannot barre yet.          */
  function findCapo(prog, soundingTonic) {
    for (var c = 1; c <= 7; c++) {
      var shapeTonic = ((soundingTonic - c) % 12 + 12) % 12;
      if (costOf(prog, shapeTonic).worst === 0) {
        return { fret: c, shapeTonic: shapeTonic };
      }
    }
    return null;
  }

  /* ======================================================
     2. LIBRARY
     Every progression is one that shows up in real songs.
     deg = semitones above the tonic. q = quality.
     bars = which chord plays in each bar of the loop.
     ====================================================== */

  var I = function (q) { return { deg: 0,  q: q || 'maj', rn: 'I'    }; };
  var D  = function (deg, q, rn) { return { deg: deg, q: q, rn: rn }; };

  var LIB = [
    /* ---------- major, bright ---------- */
    { id:'axis', name:'The Four Chords', mode:'major', n:4,
      chords:[D(0,'maj','I'), D(7,'maj','V'), D(9,'min','vi'), D(5,'maj','IV')],
      bars:[0,1,2,3], moods:['bright','bittersweet'], genres:['pop','rock','worship','indie','punk','country','bluegrass'],
      songs:['Wagon Wheel — Old Crow Medicine Show','Let It Be — The Beatles','With or Without You — U2','Don’t Stop Believin’ — Journey'],
      tip:'Swap the last chord for a IV–V push in the final bar and it lifts straight back to the top.' },

    { id:'sensitive', name:'The Sad One', mode:'major', n:4,
      chords:[D(9,'min','vi'), D(5,'maj','IV'), D(0,'maj','I'), D(7,'maj','V')],
      bars:[0,1,2,3], moods:['sad','bittersweet'], genres:['pop','rock','indie'],
      songs:['Zombie — The Cranberries','Save Tonight — Eagle-Eye Cherry','Self Esteem — The Offspring'],
      tip:'Same four chords as The Four Chords, just started on the vi. Starting note changes everything.' },

    { id:'doowop', name:'Doo-Wop', mode:'major', n:4,
      chords:[D(0,'maj','I'), D(9,'min','vi'), D(5,'maj','IV'), D(7,'maj','V')],
      bars:[0,1,2,3], moods:['bright','bittersweet'], genres:['pop','rock','country'],
      songs:['Stand By Me — Ben E. King','Every Breath You Take — The Police','Earth Angel — The Penguins'],
      tip:'Make the V a dominant 7 in the last bar. It pulls harder back to the I.' },

    { id:'onefourfive', name:'Three Chords and the Truth', mode:'major', n:3,
      chords:[D(0,'maj','I'), D(5,'maj','IV'), D(7,'maj','V')],
      bars:[0,0,1,2], moods:['bright'], genres:['folk','country','rock','blues','pop','latin'],
      songs:['Guantanamera — Joseíto Fernández','Twist and Shout — The Beatles','La Bamba — Ritchie Valens','Wild Thing — The Troggs'],
      tip:'The oldest trick there is. Learn it in G, C and D and you can sit in with almost anybody.' },

    { id:'fifties-lift', name:'The Lift', mode:'major', n:4,
      chords:[D(5,'maj','IV'), D(0,'maj','I'), D(7,'maj','V'), D(9,'min','vi')],
      bars:[0,1,2,3], moods:['bright','bittersweet'], genres:['pop','indie','worship'],
      songs:['Umbrella — Rihanna'],
      tip:'Landing on the vi instead of the I leaves the loop feeling unfinished, which is why it loops so well.' },

    { id:'g-run', name:'Bluegrass Backbone', mode:'major', n:3,
      chords:[D(0,'maj','I'), D(5,'maj','IV'), D(7,'dom7','V7')],
      bars:[0,0,1,0,0,2,0,0], moods:['bright','driving'], genres:['bluegrass','country','folk'],
      songs:['Man of Constant Sorrow — traditional'],
      tip:'Eight bars, not four. Hit the V7 hard and let the run walk you back down to the I.' },

    { id:'i-iv', name:'Two Chords, One Groove', mode:'major', n:2,
      chords:[D(0,'maj','I'), D(5,'maj','IV')],
      bars:[0,0,1,1], moods:['bright'], genres:['rock','folk','worship','country','pop'],
      songs:['Born in the U.S.A. — Bruce Springsteen'],
      tip:'Two chords is a real answer. Spend the effort you saved on the strum instead.' },

    { id:'i-v', name:'Two Chords, Country', mode:'major', n:2,
      chords:[D(0,'maj','I'), D(7,'maj','V')],
      bars:[0,0,1,1], moods:['bright'], genres:['country','folk','bluegrass','classical'],
      songs:['Achy Breaky Heart — Billy Ray Cyrus','Jambalaya — Hank Williams'],
      tip:'Add the boom-chick bass and this carries a whole song by itself.' },

    { id:'skynyrd', name:'Southern Turnaround', mode:'major', n:3,
      chords:[D(7,'maj','V'), D(5,'maj','IV'), D(0,'maj','I')],
      bars:[0,1,2,2], moods:['bright','driving'], genres:['rock','country','blues'],
      songs:['Sweet Home Alabama — Lynyrd Skynyrd','Can’t You See — The Marshall Tucker Band'],
      tip:'Starting on the V is what gives this its roll. Fair warning: players argue about whether this is really V–IV–I in G or I–♭VII–IV in D. Both readings are defensible and your fingers do not care.' },

    { id:'mixo', name:'Rock Descent', mode:'major', n:3,
      chords:[D(0,'maj','I'), D(10,'maj','♭VII'), D(5,'maj','IV')],
      bars:[0,1,2,0], moods:['driving','bright'], genres:['rock','blues'],
      songs:['Sweet Child O’ Mine — Guns N’ Roses','Sympathy for the Devil — The Rolling Stones'],
      tip:'That ♭VII is borrowed from outside the key. It is what makes this sound like rock and not folk.' },

    { id:'creep', name:'The Borrowed Ache', mode:'major', n:4,
      chords:[D(0,'maj','I'), D(4,'maj','III'), D(5,'maj','IV'), D(5,'min','iv')],
      bars:[0,1,2,3], moods:['bittersweet','sad'], genres:['rock','indie'],
      songs:['Creep — Radiohead'],
      tip:'The whole trick is bar four: the major IV turns minor. One note moves. It guts you.' },

    { id:'canon', name:'The Canon', mode:'major', n:5,
      chords:[D(0,'maj','I'), D(7,'maj','V'), D(9,'min','vi'), D(4,'min','iii'),
              D(5,'maj','IV'), D(0,'maj','I')],
      bars:[0,1,2,3,4,5,4,1], moods:['bright','bittersweet','dreamy'], genres:['pop','classical','indie'],
      songs:['Canon in D — Pachelbel'],
      tip:'Eight bars. The famous descending line everybody hums is the TOP voice, not the bass — the bass leaps around underneath it. Play it slowly and listen high.' },

    /* ---------- major, jazzy ---------- */
    { id:'ii-v-i', name:'ii–V–I', mode:'major', n:3,
      chords:[D(2,'min7','ii7'), D(7,'dom7','V7'), D(0,'maj7','Imaj7')],
      bars:[0,1,2,2], moods:['dreamy','bittersweet'], genres:['jazz','bossa'],
      songs:['Autumn Leaves — jazz standard','Fly Me to the Moon — jazz standard'],
      tip:'The engine of nearly every jazz standard. Learn it in one key, then move it by fourths.' },

    { id:'bossa-vamp', name:'Bossa Vamp', mode:'major', n:2,
      chords:[D(0,'maj7','Imaj7'), D(2,'dom7','II7')],
      bars:[0,0,1,1], moods:['dreamy'], genres:['bossa','jazz'],
      songs:['The Girl from Ipanema — Antônio Carlos Jobim'],
      tip:'That second chord is a MAJOR II, not the minor ii you would expect. Jobim turns it into a minor ii later in the tune — that switch is the whole charm.' },

    /* ---------- major, dreamy ---------- */
    { id:'maj7-float', name:'Floating', mode:'major', n:2,
      chords:[D(0,'maj7','Imaj7'), D(5,'maj7','IVmaj7')],
      bars:[0,0,1,1], moods:['dreamy'], genres:['indie','jazz','worship'],
      songs:[],
      tip:'No V chord anywhere, so nothing ever resolves. That is the point.' },

    { id:'sus-drone', name:'Open Air', mode:'major', n:3,
      chords:[D(0,'sus2','Isus2'), D(5,'maj','IV'), D(0,'maj','I')],
      bars:[0,0,1,2], moods:['dreamy','bright'], genres:['indie','worship','folk'],
      songs:[],
      tip:'Try it in D or A, where the sus2 shapes let the open high strings ring through every chord.' },

    /* ---------- minor ---------- */
    { id:'andalusian', name:'Andalusian Cadence', mode:'minor', n:4,
      chords:[D(0,'min','i'), D(10,'maj','♭VII'), D(8,'maj','♭VI'), D(7,'maj','V')],
      bars:[0,1,2,3], moods:['tense','sad'], genres:['flamenco','rock','blues','latin'],
      songs:['Hit the Road Jack — Ray Charles','Sultans of Swing — Dire Straits','Stray Cat Strut — Stray Cats'],
      tip:'That last chord is a MAJOR V in a minor key. Borrowed from harmonic minor, and it is what makes this sound Spanish.' },

    { id:'minor-axis', name:'Minor Four Chords', mode:'minor', n:4,
      chords:[D(0,'min','i'), D(8,'maj','♭VI'), D(3,'maj','♭III'), D(10,'maj','♭VII')],
      bars:[0,1,2,3], moods:['sad','driving','dark'], genres:['rock','pop','indie','punk'],
      songs:['Numb — Linkin Park','Californication — Red Hot Chili Peppers'],
      tip:'Exactly the same four chords as The Four Chords in the relative major. Start somewhere else, get a different song.' },

    { id:'watchtower', name:'The Watchtower', mode:'minor', n:3,
      chords:[D(0,'min','i'), D(10,'maj','♭VII'), D(8,'maj','♭VI')],
      bars:[0,1,2,1], moods:['dark','driving'], genres:['rock','folk','blues'],
      songs:['All Along the Watchtower — Bob Dylan','Stairway to Heaven (outro) — Led Zeppelin'],
      tip:'Down and back up. The climb back through the ♭VII is what keeps it turning.' },

    { id:'aeolian-drive', name:'Minor Drive', mode:'minor', n:3,
      chords:[D(0,'pow','i5'), D(8,'pow','♭VI5'), D(10,'pow','♭VII5')],
      bars:[0,0,1,2], moods:['driving','dark'], genres:['punk','rock','metal'],
      songs:[],
      tip:'Power chords have no third, so they are neither major nor minor. Distortion likes that.' },

    { id:'dorian-vamp', name:'Dorian Vamp', mode:'minor', n:2,
      chords:[D(0,'min7','i7'), D(5,'dom7','IV7')],
      bars:[0,0,1,1], moods:['dreamy','driving'], genres:['latin','blues','jazz','rock'],
      songs:['Oye Como Va — Tito Puente, popularised by Santana','Evil Ways — Santana'],
      tip:'A MAJOR IV under a minor i. That raised sixth is the Dorian sound, and it is why this grooves instead of moping.' },

    { id:'minor-iv-v', name:'Minor Ache', mode:'minor', n:3,
      chords:[D(0,'min','i'), D(5,'min','iv'), D(7,'maj','V')],
      bars:[0,0,1,2], moods:['sad','tense'], genres:['folk','blues','rock','latin'],
      songs:[],
      tip:'Try the V as a dominant 7. In a minor key it is the sharpest tool you have.' },

    { id:'rising-sun', name:'The Rising Sun', mode:'minor', n:5,
      chords:[D(0,'min','i'), D(3,'maj','♭III'), D(5,'maj','IV'), D(8,'maj','♭VI'), D(7,'dom7','V7')],
      bars:[0,1,2,3,0,1,4,0], moods:['sad','dark','tense'], genres:['folk','blues','rock'],
      songs:['House of the Rising Sun — traditional'],
      tip:'Eight bars, and the surprise is bar three: a MAJOR IV in a minor key. Everybody plays this one wrong the first time by making it minor.' },

    { id:'minor-descent', name:'The Descent', mode:'minor', n:4,
      chords:[D(0,'min','i'), D(10,'maj','♭VII'), D(8,'maj','♭VI'), D(7,'dom7','V7')],
      bars:[0,1,2,3], moods:['dark','tense','sad'], genres:['rock','classical','metal'],
      songs:[],
      tip:'The roots walk straight down — whole step, whole step, half step — and that last half step into the V7 is what makes it feel inevitable. Play the low roots alone first and you will hear the line.' },

    /* ---------- blues ---------- */
    { id:'blues12', name:'12-Bar Blues', mode:'major', n:3,
      chords:[D(0,'dom7','I7'), D(5,'dom7','IV7'), D(7,'dom7','V7')],
      bars:[0,0,0,0,1,1,0,0,2,1,0,2], moods:['driving','bright'], genres:['blues','rock'],
      songs:['Johnny B. Goode — Chuck Berry','Hound Dog — Big Mama Thornton','Pride and Joy — Stevie Ray Vaughan'],
      tip:'Twelve bars, three chords, a hundred years of music. The last bar is the turnaround — it sends you back to bar one.' },

    { id:'blues12-quick', name:'12-Bar, Quick Change', mode:'major', n:3,
      chords:[D(0,'dom7','I7'), D(5,'dom7','IV7'), D(7,'dom7','V7')],
      bars:[0,1,0,0,1,1,0,0,2,1,0,2], moods:['driving','bright'], genres:['blues','rock'],
      songs:['Sweet Home Chicago — Robert Johnson','Crossroads (verses) — Cream'],
      tip:'Bar two jumps early to the IV. Same form, more forward motion. Most blues players default to this one.' },

    { id:'blues-minor', name:'Minor Blues', mode:'minor', n:3,
      chords:[D(0,'min7','i7'), D(5,'min7','iv7'), D(7,'dom7','V7'), D(8,'maj7','♭VImaj7')],
      bars:[0,0,0,0,1,1,0,0,3,2,0,2], moods:['dark','sad'], genres:['blues','jazz','rock'],
      songs:['The Thrill Is Gone — B.B. King'],
      tip:'Minor blues wants space. Play fewer notes and let the V7 do the work.' },

    { id:'blues8', name:'8-Bar Blues', mode:'major', n:3,
      chords:[D(0,'dom7','I7'), D(5,'dom7','IV7'), D(7,'dom7','V7')],
      bars:[0,2,1,1,0,2,0,2], moods:['bright','driving','bittersweet'], genres:['blues','folk','country'],
      songs:['Key to the Highway — Big Bill Broonzy'],
      tip:'Shorter form, same feel. Good for when a twelve-bar is more room than the song needs.' },

    /* ---------- country / folk ---------- */
    { id:'country-153', name:'The Country Pivot', mode:'major', n:4,
      chords:[D(0,'maj','I'), D(0,'dom7','I7'), D(5,'maj','IV'), D(7,'maj','V')],
      bars:[0,0,1,1,2,2,3,3], moods:['bright'], genres:['country','folk','bluegrass','blues'],
      songs:[],
      tip:'Turning the I into a dominant 7 in bar three is the oldest move in country and gospel. That one flatted note leans the whole thing toward the IV before you get there.' },

    { id:'folk-vi-iv', name:'Campfire', mode:'major', n:4,
      chords:[D(0,'maj','I'), D(5,'maj','IV'), D(9,'min','vi'), D(7,'maj','V')],
      bars:[0,1,2,3], moods:['bright','bittersweet'], genres:['folk','pop','worship','country'],
      songs:[],
      tip:'In G this is G C Em D — four open shapes, no stretch anywhere. The best first progression to memorise.' },

    /* ---------- punk / driving ---------- */
    { id:'punk-axis', name:'Three Chords, Loud', mode:'major', n:3,
      chords:[D(0,'pow','I5'), D(5,'pow','IV5'), D(7,'pow','V5')],
      bars:[0,0,1,1,2,2,0,0], moods:['driving','bright'], genres:['punk','rock','metal'],
      songs:['Blitzkrieg Bop — Ramones'],
      tip:'All down-strokes, no exceptions. Your forearm will complain. That is the sound.' },

    { id:'punk-minor', name:'Basement Show', mode:'minor', n:4,
      chords:[D(0,'pow','i5'), D(5,'pow','iv5'), D(8,'pow','♭VI5'), D(10,'pow','♭VII5')],
      bars:[0,1,2,3], moods:['driving','dark'], genres:['punk','metal','rock'],
      songs:[],
      tip:'Move one shape up and down the low strings. Nothing here needs a barre.' },

    /* ---------- worship / open ---------- */
    { id:'worship-1546', name:'Sunday Morning', mode:'major', n:4,
      chords:[D(0,'maj','I'), D(7,'maj','V'), D(5,'maj','IV'), D(9,'min','vi')],
      bars:[0,1,2,3], moods:['bright','dreamy'], genres:['worship','pop','indie'],
      songs:[],
      tip:'Capo up and play it in G shapes. Most worship sets live in this neighbourhood — usually one rotation away from it.' },

    { id:'add9-shimmer', name:'Shimmer', mode:'major', n:4,
      chords:[D(0,'add9','Iadd9'), D(7,'maj','V'), D(9,'min7','vi7'), D(5,'maj7','IVmaj7')],
      bars:[0,1,2,3], moods:['dreamy','bittersweet'], genres:['indie','worship','pop'],
      songs:[],
      tip:'Change as little as possible between shapes. In C and G you can leave your ring finger parked on the B string through most of the loop, and that held note is what makes it shimmer.' },

    /* ---------- expansion: vamps, cycles and the missing corners ---------- */
    { id:'phrygian', name:'The Half-Step', mode:'minor', n:2,
      chords:[D(0,'min','i'), D(1,'maj','♭II')],
      bars:[0,0,1,1], moods:['dark','tense','driving'], genres:['flamenco','metal','punk','latin'],
      songs:[],
      tip:'One chord, then the chord a half step up. Palm-muted on the low strings it is metal; on nylon it is flamenco — though a flamenco player would usually make the home chord MAJOR (E to F, not Em to F).' },

    { id:'power-climb', name:'The Climb', mode:'minor', n:5,
      chords:[D(0,'pow','i5'), D(3,'pow','♭III5'), D(5,'pow','iv5'), D(8,'pow','♭VI5'), D(10,'pow','♭VII5')],
      bars:[0,0,1,2,3,4,0,0], moods:['driving','dark'], genres:['punk','metal','rock'],
      songs:[],
      tip:'Five power chords, one shape. Slide it around the low strings and let the amp do the rest. No barres, no stretches, all momentum.' },

    { id:'rhythm-changes', name:'The Turnaround', mode:'major', n:4,
      chords:[D(0,'maj','I'), D(9,'min7','vi7'), D(2,'min7','ii7'), D(7,'dom7','V7')],
      bars:[0,1,2,3], moods:['bright','bittersweet'], genres:['jazz','bossa','pop'],
      songs:['Heart and Soul — Hoagy Carmichael','Blue Moon — Rodgers & Hart'],
      tip:'The endless loop of the swing era — it lands back on the I just in time to leave again. Half of early rock and roll borrowed it whole.' },

    { id:'full-circle', name:'Full Circle', mode:'major', n:5,
      chords:[D(4,'min7','iii7'), D(9,'min7','vi7'), D(2,'min7','ii7'), D(7,'dom7','V7'), D(0,'maj7','Imaj7')],
      bars:[0,1,2,3,4,4,2,3], moods:['bittersweet','dreamy'], genres:['jazz','bossa'],
      songs:[],
      tip:'Each root falls a fifth to the next — the strongest pull in harmony, four times in a row. Learn it in C, where every chord is an open shape.' },

    { id:'minor-two', name:'The Slow Ache', mode:'minor', n:2,
      chords:[D(0,'min','i'), D(8,'maj','♭VI')],
      bars:[0,0,1,1], moods:['sad','dreamy'], genres:['indie','pop','rock'],
      songs:[],
      tip:'Two chords under half of modern sad-pop. Try it in E minor — Em to C — and let the open strings ring across both.' },

    { id:'fifties-two', name:'Slow Dance', mode:'major', n:2,
      chords:[D(0,'maj','I'), D(9,'min','vi')],
      bars:[0,0,1,1], moods:['bittersweet','sad'], genres:['pop','folk'],
      songs:[],
      tip:'Major to its relative minor and back — the slow-dance sway. The two chords share two notes, so the change is a lean, not a jump.' },

    { id:'country-turn', name:'The Nashville Turn', mode:'major', n:5,
      chords:[D(0,'maj','I'), D(0,'dom7','I7'), D(5,'maj','IV'), D(5,'min','iv'), D(7,'maj','V')],
      bars:[0,1,2,3,0,4,0,0], moods:['bittersweet','bright'], genres:['country','folk','bluegrass'],
      songs:[],
      tip:'The I7 leans you toward the IV, then the iv aches you back home. Play it in A and every chord is an open shape.' },

    { id:'lonesome', name:'The Lonesome Vamp', mode:'major', n:2,
      chords:[D(0,'maj','I'), D(7,'dom7','V7')],
      bars:[0,0,1,1], moods:['sad','bittersweet'], genres:['country','folk','bluegrass'],
      songs:[],
      tip:'The same two chords as a hoedown — the only difference is tempo. Drop it under 80 BPM and it turns into every front-porch lament ever written.' },

    { id:'spy-vamp', name:'The Spy Vamp', mode:'minor', n:2,
      chords:[D(0,'min','i'), D(7,'dom7','V7')],
      bars:[0,0,1,0], moods:['tense','dark'], genres:['pop','rock','jazz','indie'],
      songs:[],
      tip:'Minor home chord, major V7 that never quite resolves. Three bars of i to one of V7 keeps the ground unstable — the soundtrack-of-suspicion sound.' },

    { id:'gospel-lift', name:'The Gospel Lift', mode:'major', n:4,
      chords:[D(0,'maj','I'), D(4,'min','iii'), D(5,'maj','IV'), D(7,'maj','V')],
      bars:[0,1,2,3], moods:['bright'], genres:['worship','pop','classical'],
      songs:[],
      tip:'The iii is the quiet hero: it walks the top of the chord up a step before the IV arrives, so the whole loop feels like it is climbing.' },

    { id:'passamezzo', name:'The Old Frame', mode:'minor', n:4,
      chords:[D(0,'min','i'), D(10,'maj','♭VII'), D(3,'maj','♭III'), D(7,'maj','V')],
      bars:[0,1,0,3,2,1,0,3], moods:['dark','bittersweet'], genres:['classical','folk','flamenco'],
      songs:[],
      tip:'A Renaissance dance frame — five hundred years old and it still works. In A minor every chord is open: Am, G, C, E.' },

    { id:'cadencia', name:'The Cadence', mode:'minor', n:3,
      chords:[D(8,'maj','♭VI'), D(7,'maj','V'), D(0,'min','i')],
      bars:[0,1,2,2], moods:['tense','dark'], genres:['flamenco','classical','metal'],
      songs:[],
      tip:'The tail of the Andalusian cadence, pulled home to the i instead of hanging on the V. That ♭VI-to-V half-step fall is the most dramatic two-chord move in the book.' },

    { id:'axis-plus', name:'The Long Way Home', mode:'major', n:5,
      chords:[D(0,'maj','I'), D(7,'maj','V'), D(9,'min','vi'), D(4,'min','iii'), D(5,'maj','IV')],
      bars:[0,1,2,3,4,0,4,1], moods:['dreamy','bittersweet','bright'], genres:['pop','indie','worship'],
      songs:[],
      tip:'The Canon\u2019s opening in pop clothing. The iii is the one chord beginners skip — it is what makes bar four feel like dusk.' },

    { id:'minor-jazz', name:'The Blue Room', mode:'minor', n:2,
      chords:[D(0,'min7','i7'), D(5,'min7','iv7')],
      bars:[0,0,1,1], moods:['sad','dark'], genres:['jazz','blues','latin','bossa'],
      songs:[],
      tip:'Two minor sevenths a fourth apart. Am7 to Dm7 is the easiest version on the instrument — Am7 is two fingers, Dm7 a small first-finger barre — and the whole thing smoulders.' },

    { id:'mixo-two', name:'The Backdoor', mode:'major', n:2,
      chords:[D(0,'maj','I'), D(10,'maj','♭VII')],
      bars:[0,0,1,1], moods:['bright','driving'], genres:['rock','blues','country'],
      songs:[],
      tip:'Major chord, then the major chord a whole step down. It is the sound of classic rock idling at a green light. Try D to C, or A to G.' }
  ];

  /* ======================================================
     3. UI
     ====================================================== */

  var MOODS = [
    { v:'any',         l:'Surprise me' },
    { v:'bright',      l:'Bright / happy' },
    { v:'sad',         l:'Sad' },
    { v:'bittersweet', l:'Bittersweet' },
    { v:'dreamy',      l:'Dreamy / floaty' },
    { v:'driving',     l:'Driving / angry' },
    { v:'dark',        l:'Dark / tense' },
    { v:'tense',       l:'Tense' }
  ];

  var GENRES = [
    { v:'any', l:'Leave it open' }, { v:'pop', l:'Pop' }, { v:'rock', l:'Rock' },
    { v:'blues', l:'Blues' }, { v:'country', l:'Country' }, { v:'bluegrass', l:'Bluegrass' },
    { v:'folk', l:'Folk' }, { v:'indie', l:'Indie / alt' }, { v:'punk', l:'Punk' },
    { v:'metal', l:'Metal' }, { v:'jazz', l:'Jazz' }, { v:'bossa', l:'Bossa nova' },
    { v:'latin', l:'Latin' }, { v:'worship', l:'Worship' }, { v:'flamenco', l:'Flamenco' },
    { v:'classical', l:'Classical' }
  ];

  // genre -> feel. Slots are eighth notes: D down, U up, B bass note only.
  var FEEL = {
    pop:      { name:'All-purpose',   slots:['D','','D','U','','U','D','U'], bpm:[92,120] },
    rock:     { name:'Straight eights',slots:['D','','D','','D','','D',''],  bpm:[112,148] },
    folk:     { name:'Folk drive',    slots:['D','D','U','','U','D','U',''], bpm:[100,132] },
    country:  { name:'Boom-chick',    slots:['B','','D','','B','','D',''],   bpm:[96,140] },
    bluegrass:{ name:'Boom-chick, fast',slots:['B','','D','','B','','D',''], bpm:[132,180] },
    blues:    { name:'Shuffle',       slots:['D','','U','D','','U','D','U'], bpm:[76,104], swing:true },
    punk:     { name:'All down-strokes',slots:['D','D','D','D','D','D','D','D'], bpm:[160,200] },
    metal:    { name:'All down-strokes',slots:['D','D','D','D','D','D','D','D'], bpm:[140,180] },
    indie:    { name:'Loose eights',  slots:['D','','D','U','','U','D',''],  bpm:[88,124] },
    jazz:     { name:'Comp on 2 and 4',slots:['','','D','','','','D',''],    bpm:[100,140], swing:true },
    bossa:    { name:'Bossa',         slots:['D','','U','','','U','D',''],   bpm:[112,136] },
    latin:    { name:'Bossa',         slots:['D','','U','','','U','D',''],   bpm:[104,132] },
    worship:  { name:'Open and slow', slots:['D','','','U','','U','D',''],   bpm:[68,92] },
    flamenco: { name:'Driving triplets',slots:['D','U','D','','D','U','D','U'], bpm:[120,160] },
    classical:{ name:'Arpeggio',      arp:true, bpm:[64,88] },
    any:      { name:'All-purpose',   slots:['D','','D','U','','U','D','U'], bpm:[92,120] }
  };

  /* ---- form state ----
     DEFAULTS is the single source of truth: the markup's initial
     aria-pressed values and reset() both have to agree with it. */
  var DEFAULTS = { n:'any', skill:'open', capo:'yes', mood:'any', genre:'any', key:'auto' };
  var state = {};
  Object.keys(DEFAULTS).forEach(function (k) { state[k] = DEFAULTS[k]; });
  var current = null;

  /* ---- filtering ---- */
  function matches(p) {
    if (state.mood !== 'any' && p.moods.indexOf(state.mood) < 0) return false;
    if (state.genre !== 'any' && p.genres.indexOf(state.genre) < 0) return false;
    if (state.n !== 'any') {
      var want = parseInt(state.n, 10);
      if (want === 5) { if (p.n < 5) return false; }
      else if (p.n !== want) return false;
    }
    return true;
  }

  function playableIn(p) {
    // can this be made to work under the student's skill + capo answer?
    var maxLvl = state.skill === 'open' ? 0 : (state.skill === 'some' ? 2 : 2);
    var key = state.key === 'auto' ? pickKey(p, maxLvl) : { tonic: parseInt(state.key, 10) };
    var cost = costOf(p, key.tonic);
    if (state.skill === 'any') return true;
    if (cost.worst === 0) return true;
    if (state.skill === 'some' && cost.barres <= 2) return true;
    if (state.capo === 'yes' && findCapo(p, key.tonic)) return true;
    return false;
  }

  function pool() {
    var m = LIB.filter(matches);
    var ok = m.filter(playableIn);
    return { list: ok.length ? ok : m, relaxed: ok.length === 0 && m.length > 0, empty: m.length === 0 };
  }

  /* ---- build the result ---- */
  function resolve(p) {
    var maxLvl = state.skill === 'open' ? 0 : 2;
    var tonic = state.key === 'auto' ? pickKey(p, maxLvl, true).tonic : parseInt(state.key, 10);
    var capo = null, shapeTonic = tonic;
    var cost = costOf(p, tonic);

    if (state.capo === 'yes' && cost.worst > 0 &&
        (state.skill === 'open' || (state.skill === 'some' && cost.barres > 2))) {
      capo = findCapo(p, tonic);
      if (capo) shapeTonic = capo.shapeTonic;
    }

    var feel = FEEL[state.genre] || FEEL[p.genres[0]] || FEEL.any;
    var bpm = Math.round((feel.bpm[0] + feel.bpm[1]) / 2);

    var chords = p.chords.map(function (c) {
      var soundPc = (tonic + c.deg) % 12;
      var shapePc = (shapeTonic + c.deg) % 12;
      return {
        rn: c.rn,
        q: c.q,
        sounds: chordName(soundPc, c.q, tonic, p.mode),
        shape: chordName(shapePc, c.q, shapeTonic, p.mode),
        v: voice(shapePc, c.q)
      };
    });

    return { p: p, tonic: tonic, shapeTonic: shapeTonic, capo: capo,
             chords: chords, feel: feel, bpm: bpm, mode: p.mode };
  }

  /* ---- rendering ---- */
  function diagram(ch) {
    if (window.TRGC && window.TRGC.chordSVG) {
      return window.TRGC.chordSVG({ n: ch.shape, f: ch.v.f, d: ch.v.d,
                                    base: ch.v.base, barre: ch.v.barre });
    }
    return '';
  }

  function strumRow(feel) {
    if (feel.arp) return '<div class="strum__arp">Arpeggio &mdash; pick the strings one at a time, low to high</div>';
    return '<div class="strum__row">' + feel.slots.map(function (s, i) {
      var lab = s === 'B' ? '↓' : (s === 'D' ? '↓' : (s === 'U' ? '↑' : '·'));
      var cls = 'strum__hit' + (s ? ' is-on' : '') + (s === 'B' ? ' is-bass' : '') +
                (i % 2 === 0 ? ' is-beat' : '');
      return '<div class="' + cls + '"><span>' + lab + '</span>' +
             '<em>' + (i % 2 === 0 ? (i / 2 + 1) : '&amp;') + '</em></div>';
    }).join('') + '</div>';
  }

  function render(r) {
    current = r;
    var p = r.p;
    var keyLabel = noteName(r.tonic, r.tonic, r.mode) + (r.mode === 'minor' ? ' minor' : ' major');

    var seq = p.bars.map(function (i) { return r.chords[i].shape; });
    var uniq = [];
    r.chords.forEach(function (c) { if (uniq.indexOf(c.shape) < 0) uniq.push(c.shape); });

    var html = '';
    html += '<div class="pcard">';

    html += '<div class="pcard__top">';
    html += '<div><p class="eyebrow eyebrow--plain">' + p.moods[0] + ' · ' + p.genres.slice(0,2).join(', ') + '</p>';
    html += '<h3 class="display d3 mb0">' + p.name + '</h3></div>';
    html += '<div class="pcard__key"><span>Key of</span><strong>' + keyLabel + '</strong></div>';
    html += '</div>';

    if (r.capo) {
      html += '<div class="capo"><strong>Capo ' + r.capo.fret + '</strong> ' +
        'Play the shapes below (' + noteName(r.shapeTonic, r.shapeTonic, r.mode) +
        (r.mode === 'minor' ? ' minor' : ' major') + ') and it sounds in ' + keyLabel + '. ' +
        'No barre chords needed.</div>';
    }

    // the loop
    html += '<div class="ploop">' + p.bars.map(function (i, b) {
      return '<div class="ploop__bar"><span class="ploop__rn">' + r.chords[i].rn + '</span>' +
             '<span class="ploop__ch">' + r.chords[i].shape + '</span>' +
             '<span class="ploop__n">' + (b + 1) + '</span></div>';
    }).join('') + '</div>';

    // roman numeral line
    html += '<p class="pcard__rn">' + p.chords.map(function (c) { return c.rn; }).join(' – ') +
            '<span class="dim"> in ' + keyLabel + '</span></p>';

    // player
    html += '<div class="player">';
    html += '<button type="button" class="btn btn--sm" id="pplay">Play it</button>';
    html += '<div class="player__tempo"><label for="pbpm">Tempo</label>' +
            '<input type="range" id="pbpm" min="50" max="200" value="' + r.bpm + '">' +
            '<output id="pbpmv">' + r.bpm + '</output><span class="dim">BPM</span></div>';
    html += '</div>';

    // strum
    html += '<div class="strum"><h4>' + r.feel.name + '</h4>' + strumRow(r.feel) + '</div>';

    // diagrams
    html += '<div class="pchords">' + r.chords.map(function (c) {
      var lvl = c.v.lvl === 0 ? 'open' : (c.v.lvl === 1 ? 'two fingers' : 'barre');
      return '<figure class="pchord' + (c.v.lvl === 2 ? ' is-barre' : '') + '">' +
             '<figcaption>' + c.shape + '<em>' + c.rn + '</em></figcaption>' +
             diagram(c) + '<span class="pchord__lvl">' + lvl + '</span></figure>';
    }).join('') + '</div>';

    // songs + tip
    if (p.songs.length) {
      // Each song links straight to an Ultimate Guitar search for it, so
      // "hear it in" is also "go play it". Attribution suffixes and
      // parentheticals only pollute the search query, so they're stripped.
      html += '<div class="psongs"><h4>Hear it in &mdash; tap a song for its chords</h4><ul>' +
        p.songs.map(function (s) {
          var q = s.replace(/\s*\([^)]*\)/g, '')
                   .replace(/\s+\u2014\s+(traditional|jazz standard).*$/i, '')
                   .replace(/\s+\u2014\s+/g, ' ')
                   .replace(/,\s*popularised by.*$/i, '').trim();
          return '<li><a href="https://www.ultimate-guitar.com/search.php?search_type=title&value=' +
                 encodeURIComponent(q) + '" target="_blank" rel="noopener">' + s + '</a></li>';
        }).join('') + '</ul></div>';
    }
    if (p.tip) html += '<p class="ptip"><strong>Try this:</strong> ' + p.tip + '</p>';

    html += '<div class="pcard__acts">';
    html += '<button type="button" class="btn btn--sm btn--ghost" id="pagain">Another one</button>';
    html += '<button type="button" class="btn btn--sm btn--ghost" id="pcopy">Copy link</button>';
    html += '<button type="button" class="btn btn--sm btn--ghost" id="pprint">Print</button>';
    html += '<button type="button" class="btn btn--sm btn--ghost pcard__reset" id="pstart">Start over</button>';
    html += '</div>';

    html += '</div>';

    // A redraw throws away the old Play button, so the transport has to be
    // reset too — otherwise the new button inherits playing===true and the
    // first click on it is swallowed as a stop.
    stopAll();

    var out = $('#prep-out');
    out.innerHTML = html;
    out.hidden = false;

    // Keep the URL current so Copy link and reload both work, but REPLACE
    // rather than push: assigning location.hash adds a history entry per draw,
    // so a student who hit "Another one" ten times needed ten Backs to leave.
    var link = '#p=' + p.id + '&k=' + r.tonic + '&g=' + state.genre;
    if (history.replaceState) history.replaceState(null, '', link);
    else location.hash = link;

    $('#pplay').addEventListener('click', function () { play(r, parseInt($('#pbpm').value, 10)); });
    $('#pbpm').addEventListener('input', function () { $('#pbpmv').value = this.value; });
    $('#pagain').addEventListener('click', function () { go(); });
    $('#pstart').addEventListener('click', reset);
    $('#pprint').addEventListener('click', function () { window.print(); });
    $('#pcopy').addEventListener('click', function (e) {
      var url = location.href;
      var done = function () { e.target.textContent = 'Copied'; setTimeout(function () { e.target.textContent = 'Copy link'; }, 1600); };
      if (navigator.clipboard) { navigator.clipboard.writeText(url).then(done, done); } else { done(); }
    });
  }

  /* ---- start over ---- */
  function reset() {
    stopAll();                                   // nothing should still be ringing
    Object.keys(DEFAULTS).forEach(function (k) { state[k] = DEFAULTS[k]; });

    $$('[data-field]', root).forEach(function (group) {
      var field = group.getAttribute('data-field');
      $$('button[data-v]', group).forEach(function (btn) {
        btn.setAttribute('aria-pressed',
          btn.getAttribute('data-v') === DEFAULTS[field] ? 'true' : 'false');
      });
    });
    if (keySel) keySel.value = DEFAULTS.key;

    lastId = null;
    current = null;
    var out = $('#prep-out');
    out.innerHTML = '';
    out.hidden = true;

    // drop the deep link without pushing a history entry, so Back still leaves
    // the page instead of walking through every progression they drew
    if (history.replaceState) {
      history.replaceState(null, '', location.pathname + location.search);
    }

    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // focus was on a button that no longer exists; hand it somewhere sensible
    var first = $('.opts button', root);
    if (first) { try { first.focus({ preventScroll: true }); } catch (err) { first.focus(); } }
  }

  /* ---- the draw ---- */
  var lastId = null;
  function go() {
    var res = pool();
    if (res.empty) {
      $('#prep-out').innerHTML = '<div class="pcard pcard--none"><h3 class="display d4">Nothing matches that combination.</h3>' +
        '<p class="dim">Try setting the genre back to <em>Leave it open</em>, or the mood to <em>Surprise me</em>.</p>' +
        '<div class="pcard__acts pcard__acts--center"><button type="button" class="btn btn--sm" id="pstart">Start over</button></div></div>';
      $('#prep-out').hidden = false;
      $('#pstart').addEventListener('click', reset);
      return;
    }
    var list = res.list;
    if (list.length > 1 && lastId) {
      var f = list.filter(function (p) { return p.id !== lastId; });
      if (f.length) list = f;
    }
    var pick = list[Math.floor(Math.random() * list.length)];
    lastId = pick.id;
    var r = resolve(pick);
    render(r);
    if (res.relaxed) {
      var note = document.createElement('p');
      note.className = 'prelax';
      note.innerHTML = 'Heads up: nothing in that mood and genre fits your chord answer perfectly, ' +
        'so this one may ask for a barre. Turn the capo answer on, or pick <em>Leave it open</em>.';
      $('#prep-out').firstChild.insertBefore(note, $('#prep-out').firstChild.firstChild);
    }
    // Only scroll if the new card is not already where the reader is looking.
    // "Another one" lives at the bottom of the card, so scrolling every time
    // made a redraw feel like the page had reloaded.
    var box = $('#prep-out').getBoundingClientRect();
    if (box.top < 0 || box.top > window.innerHeight * 0.6) {
      $('#prep-out').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ---- audio: Karplus-Strong plucked string, built on the fly ---- */
  var actx = null, cache = {};

  function ks(freq, dur) {
    var sr = actx.sampleRate;
    var N = Math.max(2, Math.round(sr / freq));
    var len = Math.ceil(sr * dur);
    var buf = actx.createBuffer(1, len, sr);
    var d = buf.getChannelData(0);
    for (var i = 0; i < N && i < len; i++) d[i] = Math.random() * 2 - 1;
    // decay chosen so the string dies away over `dur` rather than a fixed rate
    var decay = Math.pow(0.0008, N / len);
    for (var n = N; n < len; n++) d[n] = decay * 0.5 * (d[n - N] + d[n - N + 1]);
    // fade the tail so nothing clicks
    var fade = Math.min(len, Math.floor(sr * 0.05));
    for (var k = 0; k < fade; k++) d[len - 1 - k] *= k / fade;
    return buf;
  }

  function bufFor(midi) {
    if (!cache[midi]) cache[midi] = ks(440 * Math.pow(2, (midi - 69) / 12), 3.4);
    return cache[midi];
  }

  var playing = false, bus = null, sources = [], playTimer = null, gen = 0;

  /* Actually stop. Ramp the bus down over 60 ms so it does not click, then
     stop every source we scheduled. Bumping `gen` invalidates any pending
     end-of-playback timer so it cannot reset a newer playback's button. */
  function stopAll() {
    gen++;
    if (playTimer) { clearTimeout(playTimer); playTimer = null; }
    if (bus && actx) {
      var now = actx.currentTime, dyingBus = bus, dyingSources = sources;
      try {
        dyingBus.gain.cancelScheduledValues(now);
        dyingBus.gain.setValueAtTime(dyingBus.gain.value, now);
        dyingBus.gain.linearRampToValueAtTime(0.0001, now + 0.06);
      } catch (err) { /* node already gone */ }
      setTimeout(function () {
        dyingSources.forEach(function (s) { try { s.stop(); } catch (err) {} });
        try { dyingBus.disconnect(); } catch (err) {}
      }, 90);
    }
    bus = null; sources = []; playing = false;
    var btn = document.getElementById('pplay');
    if (btn) btn.textContent = 'Play it';
  }

  function play(r, bpm) {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      actx = new AC();
    }
    if (actx.state === 'suspended') actx.resume();
    if (playing) { stopAll(); return; }
    stopAll();                          // kill any tail still ringing from the last card
    var myGen = gen;

    var feel = r.feel;
    var beat = 60 / bpm;                 // quarter note
    var eighth = beat / 2;
    var swing = feel.swing ? eighth * 0.34 : 0;
    var t0 = actx.currentTime + 0.12;
    var master = actx.createGain();
    master.gain.value = 0.5;
    var lp = actx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 4200;
    master.connect(lp); lp.connect(actx.destination);
    bus = master; sources = [];

    var t = t0;
    r.p.bars.forEach(function (ci) {
      var v = r.chords[ci].v;
      if (feel.arp) {
        var live = [];
        for (var s = 0; s < 6; s++) if (v.f[s] >= 0) live.push(s);
        for (var e = 0; e < 8; e++) {
          var st = live[e % live.length];
          pluck(st, v.f[st], t + e * eighth, 0.5, master);
        }
      } else {
        feel.slots.forEach(function (hit, e) {
          if (!hit) return;
          var at = t + e * eighth + (feel.swing && e % 2 === 1 ? swing : 0);
          strum(v, hit, at, master);
        });
      }
      t += beat * 4;
    });

    playing = true;
    $('#pplay').textContent = 'Stop';
    playTimer = setTimeout(function () {
      if (myGen !== gen) return;        // a newer playback owns the button now
      playing = false;
      var b = document.getElementById('pplay');
      if (b) b.textContent = 'Play it';
    }, (t - actx.currentTime) * 1000 + 200);
  }

  function strum(v, kind, at, dest) {
    var live = [];
    for (var s = 0; s < 6; s++) if (v.f[s] >= 0) live.push(s);
    if (!live.length) return;

    if (kind === 'B') {                     // bass note only, for boom-chick
      pluck(live[0], v.f[live[0]], at, 0.85, dest);
      return;
    }
    var order = kind === 'U' ? live.slice().reverse() : live;
    var spread = kind === 'U' ? 0.010 : 0.016;
    var gain = kind === 'U' ? 0.45 : 0.7;
    // up-strokes usually catch only the top strings
    if (kind === 'U') order = order.slice(0, Math.max(3, order.length - 2));
    order.forEach(function (s, i) {
      pluck(s, v.f[s], at + i * spread, gain, dest);
    });
  }

  function pluck(stringIdx, fret, at, gain, dest) {
    if (fret < 0) return;
    var midi = OPEN_MIDI[stringIdx] + fret;
    var src = actx.createBufferSource();
    src.buffer = bufFor(midi);
    var g = actx.createGain();
    g.gain.value = gain * (0.85 + Math.random() * 0.3);
    src.connect(g); g.connect(dest);
    sources.push(src);
    try { src.start(at); } catch (err) { /* scheduled in the past; skip */ }
  }

  /* ---- wire the form ---- */
  $$('[data-field]', root).forEach(function (group) {
    var field = group.getAttribute('data-field');
    group.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-v]');
      if (!b) return;
      state[field] = b.getAttribute('data-v');
      $$('button[data-v]', group).forEach(function (x) {
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
    });
  });

  var keySel = $('#pkey');
  if (keySel) keySel.addEventListener('change', function () { state.key = this.value; });

  $('#prep-go').addEventListener('click', go);

  /* ---- deep link ---- */
  (function fromHash() {
    var h = location.hash.replace(/^#/, '');
    if (!h) return;
    var q = {};
    h.split('&').forEach(function (kv) { var a = kv.split('='); q[a[0]] = a[1]; });
    var p = LIB.filter(function (x) { return x.id === q.p; })[0];
    if (!p) return;
    if (q.g) state.genre = q.g;
    if (q.k) state.key = q.k;
    lastId = p.id;
    render(resolve(p));
  })();

})();
