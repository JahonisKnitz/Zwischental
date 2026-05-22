// ═══════════════════════════════════════════
//  GAME STATE
// ═══════════════════════════════════════════
const G = {
  board: Array(9).fill(null),       // oberste Karte je Feld
  stacks: Array(9).fill(null),      // Array von Karten (unterste zuerst), null = kein Stack
  fortified: Array(9).fill(false),
  fortifiedNew: new Set(),
  boosted: Array(9).fill(false),
  plundered: Array(9).fill(false),  // geplündert: deaktiviert, zählt nicht bei Wertung
  entered: Array(9).fill(false),    // während aktuellem Überfall betreten (für fragile-Logik)
  barriers: new Set(),
  hand: [],
  barrierHand: 0,
  towerHand: 0,
  selectedHandIdx: -1,
  selectedBarrier: false,
  selectedTower: false,
  selectedKnight: false,
  selectedCellIdx: -1,
  selectedBarrierKey: null,
  score: 0,
  victoryPoints: 0,
  builtThisSeason: 0,  // max 5 pro Jahreszeit
  attackerOverride: null, // gesetzt wenn Champion Angreifer direkt überschreibt
  schildwall: null,    // Set von Schildwall-Zell-Indizes
  coins: 0,
  knights: 0,
  rathausLevel: 1,     // startet bei 1, max 6 — steigt wenn Karte unters Rathaus geschoben wird
  rathausStack: [],    // Karten die unters Rathaus geschoben wurden (max 5 zusätzlich)
  season: 0,
  phase: 1,
  mode: 'card',
};
G.board[4] = { ...RATHAUS };

// Kartenpools initialisieren (nach BUILDINGS + SPECIAL_BUILDINGS)
// buildSeasonPools() wird nach der Funktionsdefinition aufgerufen — siehe unten
//  Wird aktiviert wenn das echte Drafting implementiert wird.
//  Kartenpool je Jahreszeit wird später befüllt.
// ═══════════════════════════════════════════

// Handgröße je Jahreszeit: immer 6 Karten, 5 behalten, 1 weitergeben
// Zusammensetzung: normale Karten + Sonderkarten
const DRAFT_COMPOSITION = {
  0: { normal: 6, special: 0 },  // Winter:   6 + 0
  1: { normal: 5, special: 1 },  // Frühling: 5 + 1
  2: { normal: 4, special: 2 },  // Sommer:   4 + 2
  3: { normal: 3, special: 3 },  // Herbst:   3 + 3
};

// Karten-Pool je Jahreszeit — TODO: mit echten Karten befüllen
// Benötigt: Spieler + 2 Bots = 3 × 6 = 18 Karten pro Pool
const SEASON_CARD_POOL = {
  0: [],  // Winter   — 18+ normale Karten
  1: [],  // Frühling — 15+ normale, 3+ Sonderkarten
  2: [],  // Sommer   — 12+ normale, 6+ Sonderkarten
  3: [],  // Herbst   — 9+  normale, 9+ Sonderkarten
};

// ── Kartenpools befüllen ─────────────────────────────────────────
// Wird nach BUILDINGS und SPECIAL_BUILDINGS definiert
function buildSeasonPools() {
  SEASON_CARD_POOL[0] = BUILDINGS.filter(c => c.cat === 'winter').map(c => ({...c}));
  SEASON_CARD_POOL[1] = BUILDINGS.filter(c => c.cat === 'spring').map(c => ({...c}));
  SEASON_CARD_POOL[2] = BUILDINGS.filter(c => c.cat === 'summer').map(c => ({...c}));
  SEASON_CARD_POOL[3] = BUILDINGS.filter(c => c.cat === 'autumn').map(c => ({...c}));
}

// ═══════════════════════════════════════════
//  DRAFTING SYSTEM — 3 Spieler (1 Mensch + 2 Bots)
// ═══════════════════════════════════════════

// Draft-State
const DRAFT = {
  hands:      [],   // 3 Hände [Spieler, Bot1, Bot2]
  round:      0,    // 0..4 (5 Runden)
  direction:  1,    // +1 = links, -1 = rechts (wechselt jede Jahreszeit)
  active:     false,
};

/**
 * Startet ein neues Drafting für die aktuelle Jahreszeit.
 * Baut 3 Hände, zeigt die erste dem Spieler.
 */
function startDraft(season) {
  const comp       = DRAFT_COMPOSITION[season] || { normal: 6, special: 0 };
  const normalPool = [...SEASON_CARD_POOL[season]].sort(() => Math.random() - 0.5);
  const specialPool = [...SPECIAL_BUILDINGS].sort(() => Math.random() - 0.5);

  // 3 Hände à 6 Karten bauen
  DRAFT.hands = [[], [], []];
  let normalIdx  = 0;
  let specialIdx = 0;

  for (let p = 0; p < 3; p++) {
    // Normale Karten
    for (let n = 0; n < comp.normal; n++) {
      DRAFT.hands[p].push({...normalPool[normalIdx % normalPool.length]});
      normalIdx++;
    }
    // Sonderkarten
    for (let s = 0; s < comp.special; s++) {
      DRAFT.hands[p].push({...specialPool[specialIdx % specialPool.length], isSpecialOffer: true});
      specialIdx++;
    }
  }

  DRAFT.round     = 0;
  DRAFT.direction = season % 2 === 0 ? 1 : -1; // abwechselnde Richtung
  DRAFT.active    = true;

  // Spieler bekommt Hand 0
  G.hand = [...DRAFT.hands[0]];
  setHint(`Drafting — Runde 1/5 · Wähle eine Karte zum Behalten`, true);
  renderHand();
}

/**
 * Wird aufgerufen nachdem der Spieler eine Karte gewählt hat (placeCard).
 * Bots wählen zufällig, dann rotieren die Hände.
 */
function advanceDraft(playerPickedIdx) {
  if (!DRAFT.active) return;

  // Verbleibende Karten zurückschreiben (null-Slots raus)
  DRAFT.hands[0] = G.hand.filter(c => c !== null);

  // Bots ziehen zufällig
  for (let b = 1; b <= 2; b++) {
    if (DRAFT.hands[b].length > 0) {
      const pick = Math.floor(Math.random() * DRAFT.hands[b].length);
      DRAFT.hands[b].splice(pick, 1);
    }
  }

  DRAFT.round++;

  const el = document.getElementById('hand-cards');
  const outDir = DRAFT.direction === 1 ? -50 : 50;
  const inDir  = DRAFT.direction === 1 ?  50 : -50;

  // Slide-Out
  el.style.setProperty('--slide-to', `${outDir}px`);
  el.classList.add('slide-out');

  el.addEventListener('animationend', () => {
    el.classList.remove('slide-out');

    // Ende oder neue Hand?
    if (DRAFT.round >= 5 || DRAFT.hands[0].length === 0) {
      DRAFT.active = false;
      G.hand = [];
      renderHand();
      setHint('Karten gedraftet — tippe › für Rüsten', true);
      return;
    }

    // Rotieren
    const [h0, h1, h2] = DRAFT.hands;
    DRAFT.hands = DRAFT.direction === 1 ? [h2, h0, h1] : [h1, h2, h0];
    G.hand = [...DRAFT.hands[0]];

    // Slide-In
    el.style.setProperty('--slide-from', `${inDir}px`);
    renderHand(); // füllt el mit neuen Karten
    el.classList.add('slide-in');
    el.addEventListener('animationend', () => el.classList.remove('slide-in'), {once: true});

    const dir = DRAFT.direction === 1 ? '↻' : '↺';
    setHint(`Draft ${DRAFT.round + 1}/5 ${dir} — neue Hand`, true);
  }, {once: true});
}

function buildDraftHand(season) {
  // Wird beim Init aufgerufen — startet das Drafting
  startDraft(season);
  return G.hand;
}

// ═══════════════════════════════════════════
//  SOUND
// ═══════════════════════════════════════════
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new AudioCtx();
  return _audioCtx;
}

function playTone(freq, type, duration, gain=0.18, delay=0) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gn  = ctx.createGain();
    osc.connect(gn); gn.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gn.gain.setValueAtTime(0, ctx.currentTime + delay);
    gn.gain.linearRampToValueAtTime(gain, ctx.currentTime + delay + 0.01);
    gn.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.05);
  } catch(e) {}
}

const SFX = {
  build:    () => { playTone(320, 'sine', 0.12, 0.12); playTone(480, 'sine', 0.10, 0.08, 0.08); },
  upgrade:  () => { playTone(400, 'sine', 0.08); playTone(600, 'sine', 0.08, 0.1, 0.07); playTone(800, 'sine', 0.10, 0.1, 0.14); },
  discard:  () => { playTone(220, 'sine', 0.15, 0.1); playTone(180, 'sine', 0.12, 0.08, 0.1); },
  coin:     () => { playTone(880, 'sine', 0.08, 0.12); playTone(1100, 'sine', 0.07, 0.09, 0.06); },
  tower:    () => { playTone(150, 'sawtooth', 0.05, 0.08); playTone(280, 'sine', 0.12, 0.14, 0.06); playTone(420, 'sine', 0.10, 0.1, 0.13); },
  knight:   () => { playTone(440, 'square', 0.04, 0.08); playTone(660, 'sine', 0.10, 0.1, 0.08); },
  barrier:  () => { playTone(200, 'square', 0.06, 0.08); playTone(260, 'square', 0.05, 0.07, 0.05); },
  raidHit:  () => { playTone(120, 'sawtooth', 0.18, 0.2); playTone(90, 'sawtooth', 0.15, 0.15, 0.1); },
  raidBlock:() => { playTone(300, 'sine', 0.12, 0.15); playTone(400, 'sine', 0.10, 0.12, 0.1); },
  raidStart:() => { [80,100,120,140].forEach((f,i) => playTone(f,'sawtooth',0.3,0.15,i*0.12)); },
  season:   () => { [440,550,660,880].forEach((f,i) => playTone(f,'sine',0.2,0.1,i*0.1)); },
  scoring:  () => { [523,659,784,1047].forEach((f,i) => playTone(f,'sine',0.25,0.12,i*0.12)); },
  gameover: () => { [523,494,440,392].forEach((f,i) => playTone(f,'sine',0.4,0.15,i*0.2)); playTone(330,'sine',0.6,0.18,0.9); },
};
G.dice        = { yellow: 0, blue: 0, red: 0 };
G.diceDetails = { yellow: null, blue: null, red: null };
G.diceRolled  = false;
G.diceConcealed = new Set();

const DICE_COLORS = ['yellow', 'blue', 'red'];

// ── Tauschverhältnis — fest 2:1 ──
const RATIO = 2;
const VERSION = '0.9.2';

// ── Überfall-Mechaniken ──────────────────────────────────────────
// Angreifer-Anzahl Formeln (blau)
const ATTACKER_POOL = [
  { label: '5',              calc: ()  => 5 },
  { label: '3',              calc: ()  => 3 },
  { label: 'Jahr. × 2',      calc: ()  => (G.season + 1) * 2 },
  { label: '⚡ × 2',         calc: ()  => Math.max(1, G.rathausLevel) * 2 },
  { label: '🔵 + 3',         calc: ()  => G.dice.blue + 3 },
  { label: '4 + ✦',          calc: ()  => 4 + G.board.filter((c,i) => c && i!==4 && c.cat==='special' && !G.plundered[i]).length },
  { label: 'Σ niedrigste 2', calc: ()  => { const vals = [G.dice.yellow, G.dice.blue, G.dice.red].sort((a,b)=>a-b); return vals[0]+vals[1]; } },
  { label: '6',              calc: ()  => 6 },
];

// Zeigt die Angreiferzahl berechnet, oder '?' wenn verborgen
function getAttackerCount() {
  if (!G.attackBlue) return null;
  if (G.diceConcealed instanceof Set && G.diceConcealed.has('blue')) return null;
  return G.attackBlue.calc();
}

function getAttackerLabel() {
  if (!G.attackBlue) return '';
  if (G.diceConcealed instanceof Set && G.diceConcealed.has('blue')) return 'Verborgen';
  // Nach Champion-Überschreibung: direkt den Override-Wert zeigen
  if (G.attackerOverride !== null && G.attackerOverride !== undefined) {
    return `${G.attackBlue.label} → ${G.attackerOverride} Angreifer`;
  }
  const count = G.attackBlue.calc();
  return `${G.attackBlue.label} = ${count} Angreifer`;
}

// ── Angriffsrichtung ─────────────────────────────────────────────
// Grid-Position → Himmelsrichtung (idx 4 = Rathaus, kein Angriff)
const GRID_DIRECTION = { 0:'NW', 1:'N', 2:'NO', 3:'W', 5:'O', 6:'SW', 7:'S', 8:'SO' };
// Uhrzeigersinn-Reihenfolge der 8 Außenfelder
const CLOCKWISE_ORDER = [0, 1, 2, 5, 8, 7, 6, 3];

function calcAttackDirection() {
  // Gelber Bag gibt direkt einen startIdx (0–7) → alle 8 Richtungen möglich
  const yellowDraw = drawFromBag('yellow');
  const startIdx   = yellowDraw !== null ? yellowDraw : Math.floor(Math.random() * 8);
  DRAW_BAGS.yellow.lastIdx = startIdx; // merken für Ausschluss beim nächsten Refill
  G.dice.yellow = startIdx + 1;        // Würfelanzeige: 1–6 (Index 0–5)
  let startCell  = CLOCKWISE_ORDER[startIdx];
  // Laufrichtung: Index gerade → ↻, ungerade → ↺
  let clockwise  = startIdx % 2 === 0;

  // Fragile-Verteidigungskarten anwenden (für die Vorab-Anzeige korrekt)
  ({ startCell, clockwise } = applyFragileDefenses({ startCell, clockwise }));

  const direction = GRID_DIRECTION[startCell];
  return { startCell, direction, clockwise };
}

// ── Fragile Verteidigungskarten ───────────────────────────────────
// Werden in calcAttackDirection UND nach den Champion-Effekten angewendet,
// sodass sie Champions überschreiben können.
//   stadttor       → erzwingt Startfeld auf eigener Position
//   windrose_cw    → erzwingt Laufrichtung im Uhrzeigersinn
//   windrose_ccw   → erzwingt Laufrichtung gegen Uhrzeigersinn
function applyFragileDefenses({ startCell, clockwise }) {
  if (!G.board) return { startCell, clockwise };

  // Stadttor: Startfeld erzwingen (erste gefundene gewinnt bei mehreren)
  for (let i = 0; i < 9; i++) {
    if (i === 4) continue;
    const c = G.board[i];
    if (c && c.fragile && c.special_mechanic === 'force_start' && !G.plundered[i]) {
      startCell = i;
      break;
    }
  }

  // Windrose: Laufrichtung erzwingen
  // Bei Konflikt (beide Varianten gleichzeitig) gewinnt die erste gefundene
  for (let i = 0; i < 9; i++) {
    if (i === 4) continue;
    const c = G.board[i];
    if (!c || !c.fragile || G.plundered[i]) continue;
    if (c.special_mechanic === 'force_dir_cw')  { clockwise = true;  break; }
    if (c.special_mechanic === 'force_dir_ccw') { clockwise = false; break; }
  }

  return { startCell, clockwise };
}

// ── Champions (roter Würfel) ─────────────────────────────────────
const CHAMPION_POOL = [
  { id:'plus_red',        label: '+🔴 Angreifer',       desc: (v) => `+${v} zusätzliche Angreifer` },
  { id:'opposite_start',  label: 'Gegenrichtung',        desc: ()  => `Angriff startet gegenüber` },
  { id:'reverse_dir',     label: 'Richtung umkehren',    desc: ()  => `↻ wird ↺ und umgekehrt` },
  { id:'all_six',         label: '🟡🔵 auf 6',           desc: ()  => `Gelb und Blau werden auf 6 gesetzt` },
  { id:'ignore_barriers', label: 'Barrieren ignorieren', desc: ()  => `Erste 2 Barrieren ignoriert` },
  { id:'coward',          label: 'Ohne Anführer',        desc: ()  => `Kein Anführer` },
  { id:'all_hidden',      label: 'Alle verborgen',       desc: ()  => `Alle Überfallkarten bleiben verborgen` },
  { id:'all_one',         label: '🟡🔵 auf 1',           desc: ()  => `Gelb und Blau werden auf 1 gesetzt` },
  { id:'arsonist',        label: 'Brandstifter',         desc: ()  => `Mindestens 1 Karte wird immer deaktiviert` },
  { id:'switcher',        label: 'Wechselhafter Anführer',desc: ()  => `Gelb und Blau tauschen die Rollen` },
  { id:'vacationer',      label: 'Urlauber',             desc: ()  => `Sommer: −3 · Frühling/Herbst: +6` },
  { id:'volksaufstand',   label: 'Volksaufstand',        desc: ()  => `Führender Spieler: +1 Gebäude deaktiviert` },
];

G.attackDir      = null;
G.attackBlue     = null;
G.attackChampion = null;

// Shuffle-Bags für Überfall-Pools — keine Duplikate pro Durchlauf
const DRAW_BAGS = {
  yellow:   { pool: [], used: [], lastIdx: null }, // lastIdx: zuletzt gespielte Richtung (0–7)
  blue:     { pool: [], used: [] },
  champion: { pool: [], used: [] },
};

function refillBag(key) {
  const bag = DRAW_BAGS[key];
  if (key === 'yellow') {
    // Alle 8 Richtungsindizes außer der zuletzt gespielten
    const all = [0,1,2,3,4,5];
    const candidates = bag.lastIdx !== null
      ? all.filter(i => i !== bag.lastIdx)
      : all;
    bag.pool = candidates.sort(() => Math.random() - 0.5);
  } else {
    bag.pool = [...bag.used].sort(() => Math.random() - 0.5);
  }
  bag.used = [];
}

function drawFromBag(key) {
  const bag = DRAW_BAGS[key];
  if (bag.pool.length === 0) refillBag(key);
  if (bag.pool.length === 0) return null;
  const item = bag.pool.pop();
  bag.used.push(item);
  return item;
}

function initDrawBags() {
  // Gelber Bag: alle 8 Richtungsindizes, kein Ausschluss beim Start
  DRAW_BAGS.yellow.lastIdx = null;
  DRAW_BAGS.yellow.used    = [];
  DRAW_BAGS.yellow.pool    = [0,1,2,3,4,5].sort(() => Math.random() - 0.5);
  // Blaue Angreifer-Karten
  DRAW_BAGS.blue.used    = [...ATTACKER_POOL].sort(() => Math.random() - 0.5);
  DRAW_BAGS.blue.pool    = [];
  // Champions
  DRAW_BAGS.champion.used = [...CHAMPION_POOL].sort(() => Math.random() - 0.5);
  DRAW_BAGS.champion.pool = [];
}



function rollDice() {
  // Blau und Rot: freie Würfel (1-6)
  G.dice.blue = Math.ceil(Math.random() * 6);
  G.dice.red  = Math.ceil(Math.random() * 6);
  G.diceRolled = true;

  // Champion: aus Bag (keine Duplikate)
  G.attackChampion = drawFromBag('champion');
  if (!G.attackChampion) G.attackChampion = CHAMPION_POOL[0];

  // all_hidden: alle drei Würfel verborgen
  if (G.attackChampion.id === 'all_hidden') {
    G.diceConcealed = new Set(['yellow', 'blue', 'red']);
  } else {
    const maxVal = Math.max(...DICE_COLORS.map(c => G.dice[c]));
    G.diceConcealed = new Set(DICE_COLORS.filter(c => G.dice[c] === maxVal));
  }

  G.attackDir  = calcAttackDirection(); // setzt auch G.dice.yellow
  G.attackerOverride = null;

  // Angreifer: aus Bag (keine Duplikate)
  G.attackBlue = drawFromBag('blue');
  if (!G.attackBlue) G.attackBlue = ATTACKER_POOL[0];

  renderDice(true);
}

function revealDice() {
  G.diceConcealed = new Set();
  renderDice(false);
  renderAttackOrigin();
}

function revealWithDrama() {
  const concealed = G.diceConcealed instanceof Set ? [...G.diceConcealed] : [];
  const PULSE_COLORS = { yellow:'rgba(200,160,16,0.2)', blue:'rgba(42,88,144,0.2)', red:'rgba(144,24,40,0.2)' };
  const PULSE_TEXT   = { yellow:'#c8a010', blue:'#4a78b8', red:'#c03030' };

  function pulseSlot(col, times, onDone) {
    const slot = document.getElementById(`dice-${col}`);
    if (!slot) { if (onDone) onDone(); return; }
    let count = 0;
    slot.style.setProperty('--pulse-col', PULSE_COLORS[col]);
    slot.style.setProperty('--pulse-text-col', PULSE_TEXT[col]);
    function doPulse() {
      slot.classList.remove('pulsing');
      void slot.offsetWidth;
      slot.classList.add('pulsing');
      slot.addEventListener('animationend', () => {
        slot.classList.remove('pulsing');
        count++;
        if (count < times) {
          setTimeout(doPulse, 120);
        } else {
          if (onDone) onDone();
        }
      }, { once: true });
    }
    doPulse();
  }

  const yellowTimes = concealed.includes('yellow') ? 2 : 1;
  const blueTimes   = concealed.includes('blue')   ? 2 : 1;
  const redTimes    = concealed.includes('red')     ? 2 : 1;

  pulseSlot('yellow', yellowTimes, () => {
    if (concealed.includes('yellow')) {
      G.diceConcealed.delete('yellow');
      renderDice(false);
      setTimeout(() => pulseSlot('yellow', 2, () => {
        setTimeout(() => startBlue(), 320);
      }), 220);
    } else {
      setTimeout(() => startBlue(), 320);
    }
  });

  function startBlue() {
    pulseSlot('blue', blueTimes, () => {
      if (concealed.includes('blue')) {
        G.diceConcealed.delete('blue');
        renderDice(false);
        setTimeout(() => pulseSlot('blue', 2, () => {
          setTimeout(() => startRed(), 320);
        }), 220);
      } else {
        setTimeout(() => startRed(), 320);
      }
    });
  }

  function startRed() {
    pulseSlot('red', redTimes, () => {
      if (concealed.includes('red')) {
        G.diceConcealed.delete('red');
        renderDice(false);
        setTimeout(() => pulseSlot('red', 2, () => {
          setTimeout(() => doRaidDemo(), 800);
        }), 220);
      } else {
        setTimeout(() => doRaidDemo(), 800);
      }
    });
  }
}

function renderDice(animate) {
  const bar = document.getElementById('dice-bar');
  if (!bar) return;
  const wasHidden = !bar.classList.contains('visible');
  if (G.diceRolled) {
    bar.classList.add('visible');
  } else {
    bar.classList.remove('visible');
  }
  if (!G.diceRolled) {
    // Dice-Bar ausgeblendet — Barrieren neu positionieren
    requestAnimationFrame(() => renderBarriers());
    return;
  }
  if (wasHidden) {
    requestAnimationFrame(() => {
      renderBarriers();
      renderGroundGlows();
      renderAttackOrigin();
    });
  }

  DICE_COLORS.forEach(col => {
    const face   = document.getElementById(`df-${col}`);
    const detail = document.getElementById(`dd-${col}`);
    const slot   = document.getElementById(`dice-${col}`);
    if (!face || !detail || !slot) return;
    const val       = G.dice[col];
    const concealed = G.diceConcealed instanceof Set
      ? G.diceConcealed.has(col)
      : false;

    face.classList.remove('rolling');
    if (animate) {
      void face.offsetWidth;
      face.classList.add('rolling');
      face.addEventListener('animationend', () => face.classList.remove('rolling'), {once:true});
    }
    face.textContent = val;  // Würfelzahl immer sichtbar
    slot.classList.toggle('concealed', concealed);

    if (concealed) {
      detail.textContent = 'Angreifer verborgen';  // Würfel offen, Überfallkarte verborgen
    } else if (col === 'yellow') {
      if (G.attackDir) {
        const dirNames = { NW:'Nordwest', N:'Nord', NO:'Nordost', O:'Ost', SO:'Südost', S:'Süd', SW:'Südwest', W:'West' };
        const fullDir = dirNames[G.attackDir.direction] || G.attackDir.direction;
        const cwIcon  = G.attackDir.clockwise ? '↻' : '↺';
        detail.textContent = `${fullDir} ${cwIcon}`;
      } else {
        detail.textContent = '';
      }
    } else if (col === 'blue') {
      detail.textContent = G.attackBlue ? getAttackerLabel() : '';
    } else if (col === 'red') {
      if (G.attackChampion) {
        detail.textContent = G.attackChampion.desc(val);
      } else {
        detail.textContent = '';
      }
    }
  });
}
// ── Relative Punkte ───────────────────────────────────────────────
const DICE_SYMBOLS = { yellow:'🟡', blue:'🔵', red:'🔴' };
const RES_SYMBOLS  = { holz:'🪵', nahrung:'🌾', glas:'🫙' };

function calcCardPts(card) {
  if (!card || card.id === 'rathaus') return 0;
  const p = card.pts;
  if (typeof p === 'number') {
    // Versicherung: aktiv = 0 Punkte (Bonus +8 wird beim Plündern direkt gesetzt)
    if (card.special_mechanic === 'pts_if_plundered') {
      return 0;
    }
    // Kristallpalast: 15 wenn aktiv, 0 wenn deaktiviert
    if (card.special_mechanic === 'destroyable') {
      const idx = G.board.indexOf(card);
      return (idx >= 0 && G.plundered[idx]) ? 0 : p;
    }
    return p;
  }
  if (!p || !p.type) return 0;
  const dice = (G.diceRolled && G.dice) ? G.dice : { yellow:0, blue:0, red:0 };
  const prod  = calcProduction();
  switch (p.type) {
    case 'dice+':     return (dice[p.color] || 0) + (p.bonus   || 0);
    case 'dice*':     return (dice[p.color] || 0) * (p.factor  || 1);
    case 'dice+dice': return (dice[p.a]     || 0) + (dice[p.b] || 0);
    case 'res*':      return (prod[p.res]   || 0) * (p.factor  || 1);
    case 'inno*':     return (G.rathausLevel || 1) * (p.factor || 1);
    case 'def_sum':   return G.board.reduce((s,c,i) => c && i!==4 && !G.plundered[i] ? s + (c.def||0) + (G.boosted[i]||0) : s, 0);
    case 'deact*':    return G.plundered.filter(Boolean).length * (p.factor || 1);
    case 'season*':   return (G.season + 1) * (p.factor || 1);  // Jahreszeit × Faktor
    case 'blue*': {  // Handelsgilde: aktive blaue Karten (keine Ressource, nicht fragile, nicht special) × Faktor
      const count = G.board.filter((c, i) =>
        c && i !== 4 && !G.plundered[i] && !c.fragile && !c.res && c.cat !== 'special'
      ).length;
      return count * (p.factor || 1);
    }
    case 'dice_sum*': // Nebelbastei: (Würfel A + Würfel B) × Faktor
      return ((dice[p.a] || 0) + (dice[p.b] || 0)) * (p.factor || 1);
    case 'sonder_count': {                                        // Immobilienhändler: Sonderkarten × 2
      const count = G.board.filter((c,i) => c && i!==4 && c.cat==='special' && !G.plundered[i]).length;
      return count * 2;
    }
    default:          return 0;
  }
}

function formatPts(pts) {
  if (typeof pts === 'number') return String(pts);
  if (!pts || !pts.type) return '0';
  switch (pts.type) {
    case 'dice+':       return `${DICE_SYMBOLS[pts.color]}+${pts.bonus}`;
    case 'dice*':       return `${DICE_SYMBOLS[pts.color]}×${pts.factor}`;
    case 'dice+dice':   return `${DICE_SYMBOLS[pts.a]}+${DICE_SYMBOLS[pts.b]}`;
    case 'res*':        return `${RES_SYMBOLS[pts.res]}×${pts.factor}`;
    case 'inno*':       return `⚡×${pts.factor}`;
    case 'def_sum':     return `Σ🛡`;
    case 'deact*':      return `💀×${pts.factor}`;
    case 'season*':     return `Jahr.×${pts.factor}`;
    case 'blue*':       return `🔵×${pts.factor}`;
    case 'dice_sum*':   return `(${DICE_SYMBOLS[pts.a]}+${DICE_SYMBOLS[pts.b]})×${pts.factor}`;
    case 'sonder_count':return `✦×2`;
    default:            return '?';
  }
}

function calcProduction() {
  const prod = { holz: 0, nahrung: 0, glas: 0 };
  G.board.forEach((card, i) => {
    if (!card || i === 4) return;
    const plundered = G.plundered[i];
    const stackSize = (G.stacks[i] && G.stacks[i].length) || 1;
    // Rohstoffe zählen auch bei geplünderten Karten
    if (card.res === 'holz')    prod.holz    += stackSize;
    if (card.res === 'nahrung') prod.nahrung += stackSize;
    if (card.res === 'glas')    prod.glas    += stackSize;
    // Dual-Ressource
    if (card.special_mechanic === 'dual_res_nahrung') prod.nahrung += stackSize;
    if (card.special_mechanic === 'dual_res_holz')    prod.holz    += stackSize;
    if (card.special_mechanic === 'dual_res_glas')    prod.glas    += stackSize;
  });
  return prod;
}

function renderProductionPanel() {
  const panel = document.getElementById('production-panel');
  if (!panel) return;

  const prod = calcProduction();
  const hasAny = prod.holz > 0 || prod.nahrung > 0 || prod.glas > 0;

  const rows = [
    { key: 'holz',    icon: '🪵', label: 'Holz',    count: prod.holz,    conv: '÷3 = Barriere' },
    { key: 'nahrung', icon: '🌾', label: 'Nahrung', count: prod.nahrung, conv: '÷3 = Ritter'   },
    { key: 'glas',    icon: '🫙', label: 'Glas',    count: prod.glas,    conv: '÷3 = Münze'    },
  ];

  panel.innerHTML = '';

  rows.forEach(r => {
    const row = document.createElement('div');
    row.className = 'prod-row';
    row.dataset.key = r.key;

    const count = document.createElement('span');
    count.className = 'prod-count' + (r.count === 0 ? ' zero' : '');
    count.textContent = r.count;

    const icon = document.createElement('span');
    icon.className = 'prod-icon';
    icon.textContent = r.icon;

    row.appendChild(count);
    row.appendChild(icon);
    panel.appendChild(row);
  });

  // Umrechnungs-Preview am Ende
  if (hasAny) {
    const div = document.createElement('div');
    div.className = 'prod-divider';
    panel.appendChild(div);

    const barr = Math.floor(prod.holz / RATIO);
    const kn   = Math.floor(prod.nahrung / RATIO);
    const coin = Math.floor(prod.glas / RATIO);
    if (barr > 0 || kn > 0 || coin > 0) {
      const preview = document.createElement('div');
      preview.className = 'prod-conversion';
      const parts = [];
      if (barr > 0) parts.push(`${barr} 🪵→🛡`);
      if (kn   > 0) parts.push(`${kn} 🌾→⚔`);
      if (coin > 0) parts.push(`${coin} 🫙→<svg width="11" height="9" viewBox="0 0 16 12" style="vertical-align:middle"><ellipse cx="8" cy="9.5" rx="6" ry="2" fill="#8a6200" opacity="0.6"/><ellipse cx="8" cy="7.5" rx="6" ry="2.4" fill="#f0c030" stroke="#a07000" stroke-width="0.5"/><ellipse cx="7.5" cy="6.5" rx="3.5" ry="1.2" fill="#f8e060" opacity="0.7"/></svg>`);
      preview.textContent = parts.join('  ');
      panel.appendChild(preview);
    }
  }
}

// ── Automatische Umrechnung zu Beginn der Verteidigungsphase ──────
// ── Verteidigungs-Overlay ─────────────────────────────────────────
function showDefenseOverlay() {
  const overlay   = document.getElementById('defense-overlay');
  const rowsEl    = document.getElementById('do-rows');

  // Overlay antippen → schließen
  overlay.onclick = closeDefenseOverlay;

  const col = SEASON_COLORS[SEASON_KEYS[G.season]];
  const prod = calcProduction();

  const conversions = [
    { rawIcon:'🪵', rawLabel:'Holz',    rawTotal: prod.holz,
      defIcon:'🛡', defLabel:'Barrieren', defKey:'barrierHand', convert: RATIO },
    { rawIcon:'🌾', rawLabel:'Nahrung', rawTotal: prod.nahrung,
      defIcon:'⚔',  defLabel:'Ritter',    defKey:'knights',     convert: RATIO },
    { rawIcon:'🫙', rawLabel:'Glas',    rawTotal: prod.glas,
      defIcon:`<svg width="14" height="11" viewBox="0 0 16 12"><ellipse cx="8" cy="9.5" rx="6" ry="2" fill="#8a6200" opacity="0.6"/><ellipse cx="8" cy="7.5" rx="6" ry="2.4" fill="#f0c030" stroke="#a07000" stroke-width="0.5"/><ellipse cx="7.5" cy="6.5" rx="3.5" ry="1.2" fill="#f8e060" opacity="0.7"/></svg>`,
      defLabel:'Münzen', defKey:'coins', convert: RATIO },
  ];

  // Rows aufbauen — rechts NUR der Zuwachs (+N), darunter Gesamtbestand
  rowsEl.innerHTML = '';
  const rowEls = conversions.map((c, i) => {
    const gain = Math.floor(c.rawTotal / RATIO);
    const row  = document.createElement('div');
    row.className = 'do-row';

    row.innerHTML = `
      <div class="do-raw">
        <span class="do-raw-icon">${c.rawIcon}</span>
        <span class="do-raw-count" id="do-raw-${i}">${c.rawTotal}</span>
      </div>
      <span class="do-arrow">›</span>
      <div class="do-def" style="flex:1; display:flex; align-items:baseline; gap:6px;">
        <span class="do-def-icon">${c.defIcon}</span>
        <span class="do-def-count" id="do-def-${i}" style="color:${gain > 0 ? col : 'var(--ink-20)'};">
          ${gain > 0 ? '+' + gain : '0'}
        </span>
        <span id="do-total-${i}"
          style="font-family:'Cinzel',serif;font-size:0.85rem;color:var(--ink-40);transition:color 0.3s,font-weight 0.3s,font-size 0.3s;">
          ${c.defKey ? c.defLabel + ' (' + G[c.defKey] + ')' : ''}
        </span>
      </div>`;

    rowsEl.appendChild(row);
    return { row, gain, c };
  });

  // Zusätzlich: Turm-Zeile (kein Rohstoff, nur Inventar-Info)
  const towerRow = document.createElement('div');
  towerRow.className = 'do-row';
  towerRow.innerHTML = `
    <div class="do-raw" style="min-width:90px;justify-content:flex-end;">
      <span style="font-family:'Cinzel',serif;font-size:0.7rem;color:var(--ink-20);font-style:italic;">via Münzen</span>
    </div>
    <span class="do-arrow">›</span>
    <div class="do-def" style="flex:1; display:flex; align-items:baseline; gap:6px;">
      <span class="do-def-icon">♜</span>
      <span class="do-def-count" style="color:var(--ink-20);">—</span>
      <span style="font-family:'Cinzel',serif;font-size:0.85rem;color:var(--ink-40);">
        Türme (${G.towerHand})
      </span>
    </div>`;
  rowsEl.appendChild(towerRow);
  setTimeout(() => towerRow.classList.add('visible'), 150 + conversions.length * 180);
  document.querySelectorAll('.barrier-el').forEach(e => e.style.visibility = 'hidden');
  overlay.classList.add('show'); SFX.gameover();

  // Gestaffelt einblenden
  rowEls.forEach(({ row }, i) => {
    setTimeout(() => row.classList.add('visible'), 150 + i * 180);
  });

  // Animation: Rohstoff sinkt, Zuwachs-Zahl springt
  let animDone = 0;
  rowEls.forEach(({ gain, c }, i) => {

    if (gain === 0) { animDone++; checkAllDone(); return; }

    setTimeout(() => {
      let remaining = c.rawTotal;
      let gained    = 0;
      const rawEl   = document.getElementById(`do-raw-${i}`);
      const defEl   = document.getElementById(`do-def-${i}`);
      const totalEl = document.getElementById(`do-total-${i}`);

      const step = () => {
        if (gained >= gain) {
          rawEl.classList.add('depleting');
          if (c.defKey) G[c.defKey] += gain;
          if (totalEl && c.defKey) totalEl.textContent = `${c.defLabel} (${G[c.defKey]})`;
          defEl.classList.remove('tick'); void defEl.offsetWidth;
          defEl.classList.add('tick');
          animDone++;
          checkAllDone();
          return;
        }
        remaining -= 3;
        gained++;
        rawEl.textContent = Math.max(0, remaining);
        rawEl.classList.remove('tick'); void rawEl.offsetWidth;
        rawEl.classList.add('tick');

        defEl.textContent = '+' + gained;
        defEl.classList.remove('tick'); void defEl.offsetWidth;
        defEl.classList.add('tick');

        if (totalEl && c.defKey) totalEl.textContent = `${c.defLabel} (${G[c.defKey] + gained})`;

        setTimeout(step, 280);
      };
      step();
    }, 600 + i * 200);
  });

  function checkAllDone() {
    if (animDone < conversions.length) return;
    renderHand();
    setTimeout(() => closeDefenseOverlay(), 900);
  }
}


function closeDefenseOverlay() {
  const overlay = document.getElementById('defense-overlay');
  overlay.classList.remove('show');
  overlay.onclick = null;
  document.querySelectorAll('.barrier-el').forEach(e => e.style.visibility = '');
  renderHand();
  renderGrid();
  setHint('Platziere Barrieren, Türme und Ritter', true);
}

function doResourceConversion() {
  // Wird jetzt durch showDefenseOverlay ersetzt — leere Stub-Funktion
}
const PHASES = ['Gerüchte', 'Bauen', 'Rüsten', 'Überfall', 'Wertung'];
const SEASON_NAMES = ['Winter', 'Frühling', 'Sommer', 'Herbst'];
const SEASON_KEYS  = ['winter', 'spring', 'summer', 'autumn'];

function renderPhaseBar() {
  const seasonLabel = document.getElementById('phase-season-label');
  const dotsEl = document.getElementById('phase-dots');
  if (!seasonLabel || !dotsEl) return;

  const col = SEASON_COLORS[SEASON_KEYS[G.season]] || '#7a7060';
  const seasonRoman = ['I', 'II', 'III', 'IV'][G.season];

  seasonLabel.textContent = `J${seasonRoman} · ${SEASON_NAMES[G.season].toUpperCase()}`;
  seasonLabel.style.color = col;

  const winterPhases = [
    { name: 'Bauen',   idx: 1 },
    { name: 'Rüsten',  idx: 2 },
    { name: 'Wertung', idx: 4 },
  ];
  const allPhases = PHASES.map((name, idx) => ({ name, idx }));
  const visiblePhases = G.season === 0 ? winterPhases : allPhases;

  dotsEl.innerHTML = '';

  visiblePhases.forEach(({ name, idx }, pos) => {
    const isActive = idx === G.phase;
    const isRaid   = idx === 3; // Überfall

    if (pos > 0) {
      const conn = document.createElement('div');
      conn.className = 'phase-connector';
      dotsEl.appendChild(conn);
    }

    const item = document.createElement('div');
    item.className = 'phase-item';

    if (isActive) {
      // Aktive Phase: farbiger Punkt + Name
      const dot = document.createElement('div');
      dot.className = 'phase-dot active';
      dot.style.background = col;

      const label = document.createElement('div');
      label.className = 'phase-label active';
      label.textContent = name.toUpperCase();
      label.style.color = col;
      label.style.fontWeight = '700';

      item.appendChild(dot);
      item.appendChild(label);
    } else if (isRaid) {
      // Überfall: gekreuzte Schwerter als Symbol
      const sym = document.createElement('div');
      sym.className = 'phase-dot phase-dot-raid';
      sym.innerHTML = `<svg width="9" height="9" viewBox="0 0 9 9">
        <line x1="1" y1="1" x2="8" y2="8" stroke="rgba(18,14,10,0.28)" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="8" y1="1" x2="1" y2="8" stroke="rgba(18,14,10,0.28)" stroke-width="1.2" stroke-linecap="round"/>
      </svg>`;
      sym.style.background = 'transparent';
      sym.style.width = '9px';
      sym.style.height = '9px';
      item.appendChild(sym);
    } else {
      // Inaktive Phase: kleiner grauer Punkt, kein Label
      const dot = document.createElement('div');
      dot.className = 'phase-dot';
      dot.style.background = 'rgba(18,14,10,0.12)';
      item.appendChild(dot);
    }

    dotsEl.appendChild(item);
  });
}

// Fächerrichtung je Grid-Position: -1=links, +1=rechts
function getFanDirection(idx) {
  // Fächerrichtung: nach außen vom Zentrum (Rathaus = idx 4)
  // idx 7 (direkt unter Rathaus): nach unten fächern → translateY statt translateX
  const col = idx % 3;
  const row = Math.floor(idx / 3);
  if (idx === 7) return 'down';   // unter Rathaus → nach unten
  if (idx === 1) return 'up';     // über Rathaus → nach oben (falls relevant)
  return col === 0 ? -1 : 1;     // links=-1, rechts=+1
}

// Kann newCard auf existingCard gestapelt werden?
// Karten mit zwei Ressourcen sind bewusst stark und werden nicht gestapelt
// (weder als untere noch als obere Karte im Stack).
function isDualRes(card) {
  if (!card || !card.special_mechanic) return false;
  return card.special_mechanic === 'dual_res_nahrung'
      || card.special_mechanic === 'dual_res_holz'
      || card.special_mechanic === 'dual_res_glas';
}

function canUpgrade(existingIdx, newCard) {
  const existing = G.board[existingIdx];
  if (!existing) return false;
  if (existing.id === 'rathaus') return false;
  // Dual-Ressourcen-Karten können nicht gestapelt werden (weder unten noch oben)
  if (isDualRes(existing) || isDualRes(newCard)) return false;
  const stack = G.stacks[existingIdx];
  const stackSize = stack ? stack.length : 1;
  if (stackSize >= 3) return false;
  if (!existing.upgrade) return false;
  if (!existing.res || !newCard.res) return false;
  return existing.res === newCard.res;
}

// ── Fragile-Karten: nur eine Karte pro Mechanik-Gruppe in der Stadt ──
// Mechanik-Gruppen: Karten mit ähnlicher Wirkung gehören zur gleichen Gruppe.
// Beispiel: force_dir_cw und force_dir_ccw gehören beide zur Gruppe 'direction',
// weil beide die Richtung erzwingen — der Spieler kann nur eines wählen.
const FRAGILE_MECHANIC_GROUP = {
  force_start:    'start',
  force_dir_cw:   'direction',
  force_dir_ccw:  'direction',
  decoy:          'decoy',
};

// Sucht ob auf dem Brett bereits eine fragile-Karte aus derselben Gruppe existiert.
// `excludeIdx` wird ignoriert (für Replace-Prüfung).
// Karten ohne special_mechanic (z.B. Test-fragile w1/w2) werden nicht beschränkt.
function findFragileConflict(newCard, excludeIdx) {
  if (!newCard || !newCard.fragile) return -1;
  const mech = newCard.special_mechanic;
  if (!mech) return -1;
  const group = FRAGILE_MECHANIC_GROUP[mech];
  if (!group) return -1;
  for (let i = 0; i < 9; i++) {
    if (i === excludeIdx || i === 4) continue;
    const c = G.board[i];
    if (c && c.fragile && c.special_mechanic && FRAGILE_MECHANIC_GROUP[c.special_mechanic] === group) {
      return i;
    }
  }
  return -1;
}

// Decoy: prüft, ob die ausgewählte Karte auf die Ziel-Position gelegt werden darf
// Decoy darf NICHT auf: Rathaus (4), leere Felder, andere fragile-Karten
function canPlaceDecoy(targetIdx) {
  if (targetIdx === 4) return false;
  const target = G.board[targetIdx];
  if (!target) return false;          // Decoy braucht eine Karte zum Beschützen
  if (target.fragile) return false;    // nicht auf andere fragile-Karten
  return true;
}

// Zentrale Spielbarkeits-Prüfung für Hand-Karten.
// Gibt { playable: bool, reason: string, coinBypass: bool, coinCost: number } zurück.
// coinBypass: true wenn Karte zu teuer, aber mit Münzen spielbar
function getCardPlayability(card) {
  if (!card) return { playable: false, reason: '' };

  // Spezialkarte mit Würfelkosten — Rathaus-Level gibt Rabatt
  if (card.isSpecialOffer && card.diceColor && G.diceRolled) {
    const baseCost = G.dice[card.diceColor];
    const finalCost = Math.max(0, baseCost - discount);
    if (finalCost > 0 && G.coins < finalCost) {
      return {
        playable: false,
        reason: `Kostet ${finalCost} Münze${finalCost > 1 ? 'n' : ''} (Würfel ${baseCost} − Rathaus ${discount} = ${finalCost})`,
        coinBypass: false,
        coinCost: finalCost
      };
    }
    if (finalCost > 0) {
      return {
        playable: true,
        reason: `${finalCost} Münze${finalCost > 1 ? 'n' : ''} zahlen (Würfel ${baseCost} − Rathaus ${discount})`,
        coinBypass: true,
        coinCost: finalCost
      };
    }
    // finalCost === 0: kostenlos dank Rathaus-Rabatt
  }

  // Fragile-Karte: nur eine pro Mechanik-Gruppe in der Stadt
  if (card.fragile && card.special_mechanic) {
    const conflictIdx = findFragileConflict(card, -1);
    if (conflictIdx >= 0) {
      return { playable: false, reason: fragileConflictMessage(card.special_mechanic) };
    }
  }

  // Decoy: braucht mindestens eine Nicht-fragile-Karte auf dem Brett
  if (card.special_mechanic === 'decoy') {
    let hasTarget = false;
    for (let i = 0; i < 9; i++) {
      if (i === 4) continue;
      const b = G.board[i];
      if (b && !b.fragile) { hasTarget = true; break; }
    }
    if (!hasTarget) {
      return { playable: false, reason: 'Ablenkungsmanöver braucht eine Karte zum Beschützen' };
    }
  }

  return { playable: true, reason: '' };
}

function fragileConflictMessage(mech) {
  const group = FRAGILE_MECHANIC_GROUP[mech];
  if (group === 'start')     return 'Bereits ein Stadttor in der Stadt';
  if (group === 'direction') return 'Bereits eine Windrose in der Stadt';
  if (group === 'decoy')     return 'Bereits ein Ablenkungsmanöver in der Stadt';
  return 'Diese fragile Karte ist bereits in der Stadt';
}

// ── Boden-Glow hinter Karten ─────────────────────────────────────
// ── Jahreszeit-Partikel ─────────────────────────────────────────
let _seasonParticleInterval = null;

function startSeasonParticles(season) {
  stopSeasonParticles();
  if (season !== 0 && season !== 3) return; // nur Winter und Herbst
  const stage = document.getElementById('stage');
  _seasonParticleInterval = setInterval(() => {
    if (season === 0) spawnSnowflake(stage);
    else              spawnLeaf(stage);
  }, season === 0 ? 600 : 800);
}

function stopSeasonParticles() {
  if (_seasonParticleInterval) { clearInterval(_seasonParticleInterval); _seasonParticleInterval = null; }
  document.querySelectorAll('.season-particle').forEach(e => e.remove());
}

function spawnSnowflake(stage) {
  const el = document.createElement('div');
  el.className = 'season-particle';
  const size  = 3 + Math.random() * 4;
  const x     = 5 + Math.random() * 90;
  const dur   = 4 + Math.random() * 3;
  const drift = (Math.random() - 0.5) * 30;
  el.style.cssText = `position:absolute;top:-8px;left:${x}%;width:${size}px;height:${size}px;
    border-radius:50%;background:rgba(200,220,255,0.7);pointer-events:none;z-index:2;
    animation:snowFall ${dur}s linear forwards;--drift:${drift}px;`;
  stage.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

function spawnLeaf(stage) {
  const el = document.createElement('div');
  el.className = 'season-particle';
  const size  = 5 + Math.random() * 6;
  const x     = 5 + Math.random() * 90;
  const dur   = 3 + Math.random() * 3;
  const drift = (Math.random() - 0.5) * 60;
  const rot   = Math.random() * 720;
  const colors = ['rgba(180,80,20,0.5)','rgba(200,120,10,0.5)','rgba(150,60,10,0.4)','rgba(220,140,20,0.45)'];
  const col = colors[Math.floor(Math.random()*colors.length)];
  el.style.cssText = `position:absolute;top:-8px;left:${x}%;width:${size}px;height:${size*0.7}px;
    border-radius:50% 0 50% 0;background:${col};pointer-events:none;z-index:2;
    animation:leafFall ${dur}s ease-in forwards;--drift:${drift}px;--rot:${rot}deg;`;
  stage.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

function renderGroundGlows() {
  document.querySelectorAll('.ground-glow').forEach(e => e.remove());

  // Glows ans grid-wrap hängen (das jetzt fixed in der Viewport-Mitte ist),
  // damit sie immer mit dem Grid synchron sind.
  const anchor = document.getElementById('grid-wrap');
  if (!anchor) return;
  const anchorR = anchor.getBoundingClientRect();

  document.querySelectorAll('.cell.placed').forEach(cell => {
    const idx = parseInt(cell.dataset.idx);
    if (idx === 4 || G.plundered[idx]) return;

    const card = G.board[idx];
    if (!card) return;

    const col = card.cat === 'special' ? SEASON_COLORS[card.cat] : getCardTone(card);
    const hex = col.replace('#','');
    const r   = parseInt(hex.slice(0,2),16);
    const g   = parseInt(hex.slice(2,4),16);
    const b   = parseInt(hex.slice(4,6),16);

    const cr   = cell.getBoundingClientRect();
    const cx   = cr.left - anchorR.left + cr.width  / 2;
    const cy   = cr.top  - anchorR.top  + cr.height / 2;
    const size = cr.width * 2.8;

    const glow = document.createElement('div');
    glow.className = 'ground-glow';
    glow.style.cssText = `
      width: ${size}px;
      height: ${size * 0.7}px;
      left: ${cx}px;
      top:  ${cy + cr.height * 0.15}px;
      background: radial-gradient(ellipse at center,
        rgba(${r},${g},${b},0.32) 0%,
        rgba(${r},${g},${b},0.14) 35%,
        transparent 70%);
    `;
    anchor.appendChild(glow);
  });
}

function renderVP() {
  const el = document.getElementById('vp-value');
  if (el) el.textContent = G.victoryPoints || 0;
}

// ═══════════════════════════════════════════
//  RENDER
// ═══════════════════════════════════════════
function renderGrid(skipGlows) {
  const el = document.getElementById('grid');
  el.innerHTML = '';
  if (!skipGlows) document.querySelectorAll('.ground-glow').forEach(e => e.remove());
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.idx = i;

    if (i === 4) {
      cell.classList.add('rathaus');
      cell.innerHTML = makeCard(RATHAUS, 92, 128, true, G.score);
    } else if (G.board[i]) {
      cell.classList.add('placed');

      // Stack rendern: unterste Karten deutlicher nach außen fächern
      const stack = G.stacks[i];
      if (stack && stack.length > 1) {
        const fanDir = getFanDirection(i);
        stack.forEach((c, si) => {
          if (si === stack.length - 1) return; // oberste Karte normal
          const depth = stack.length - 1 - si; // 1 = direkt darunter
          const offset = depth * 10; // 10px pro Ebene — deutlicher als vorher
          let transform;
          if (fanDir === 'down') {
            transform = `translateY(${offset}px) rotate(${depth * 0.4}deg)`;
          } else if (fanDir === 'up') {
            transform = `translateY(-${offset}px) rotate(${-depth * 0.4}deg)`;
          } else {
            transform = `translateX(${offset * fanDir}px) rotate(${offset * fanDir * 0.18}deg)`;
          }
          const sub = document.createElement('div');
          sub.style.cssText = `position:absolute; inset:0; transform:${transform}; z-index:${si};`;
          sub.innerHTML = makeCard(c, 92, 128, false, undefined, false, false, G.plundered[i], false);
          cell.appendChild(sub);
        });
      }

      // Bodenlicht: Jahreszeit-Farbe des Gebäudes, sanft pulsierend
      if (!G.plundered[i]) {
        const card = G.board[i];
        // Glow-Farbe für späteres renderGroundGlows
        cell.dataset.glowCat = card.cat || '';
      } else {
        cell.classList.add('plundered-cell');
      }

      // Oberste Karte
      const topDiv = document.createElement('div');
      topDiv.style.cssText = 'position:absolute; inset:0; z-index:10;';
      topDiv.innerHTML = makeCard(G.board[i], 92, 128, false, undefined, G.fortified[i], G.boosted[i], G.plundered[i], !G.plundered[i]);
      // Sonderkarten: Premium-Shimmer
      if (G.board[i].cat === 'special' && !G.plundered[i]) {
        topDiv.className = 'cell-card special-card';
        topDiv.style.cssText = 'position:absolute; inset:0; z-index:10; border-radius:6px; overflow:hidden;';
      }
      cell.appendChild(topDiv);

      // Karten-Modus: belegte Felder als Upgrade/Replace-Target anzeigen
      if (G.mode === 'card' && G.selectedHandIdx >= 0 && G.selectedCellIdx < 0 && i !== 4) {
        cell.classList.add('upgrade-target');
        cell.addEventListener('click', () => onCellClick(i));
        cell.addEventListener('touchend', (e) => { e.preventDefault(); onCellClick(i); }, { passive: false });
      }
      if (G.mode === 'card' && G.selectedCellIdx === i) {
        cell.classList.add('upgrade-selected');
      }

      // Fragile-Konflikt: bestehende Karte aus gleicher Mechanik-Gruppe visuell markieren
      // (Ausnahme: wenn das Konfliktfeld selbst das Replace-Target ist, kein Konflikt)
      if (G.mode === 'card' && G.selectedHandIdx >= 0 && G.selectedCellIdx !== i) {
        const sel = G.hand[G.selectedHandIdx];
        if (sel && sel.fragile && sel.special_mechanic) {
          const selGroup = FRAGILE_MECHANIC_GROUP[sel.special_mechanic];
          const board = G.board[i];
          if (selGroup && board && board.fragile && board.special_mechanic &&
              FRAGILE_MECHANIC_GROUP[board.special_mechanic] === selGroup) {
            cell.classList.add('fragile-conflict');
          }
        }
      }

      // Turm-Modus
      if (G.mode === 'tower' && !G.fortified[i]) {
        cell.classList.add('tower-target');
        cell.addEventListener('click', () => onCellClick(i));
        cell.addEventListener('touchend', (e) => { e.preventDefault(); onCellClick(i); }, { passive: false });
      }
      if (G.mode === 'tower' && G.selectedCellIdx === i) {
        cell.classList.add('tower-selected');
      }

      // Ritter-Modus: alle bebauten Karten anwählbar (mehrfach erlaubt)
      if (G.mode === 'knight' && G.board[i] && i !== 4 && !G.plundered[i]) {
        cell.classList.add('knight-target');
        cell.addEventListener('click', () => onCellClick(i));
        cell.addEventListener('touchend', (e) => { e.preventDefault(); onCellClick(i); }, { passive: false });
      }

      // Befestigung: Steinquader-Overlay oben rechts
      if (G.fortified[i]) {
        const fort = document.createElement('div');
        fort.className = 'fortify-overlay';
        // Animate only when freshly placed
        if (G.fortifiedNew && G.fortifiedNew.has(i)) {
          fort.classList.add('animate');
          G.fortifiedNew.delete(i);
        }
        fort.innerHTML = makeFortifyStone();
        cell.appendChild(fort);
      }
    } else {
      cell.classList.add('empty');
      // Highlight nur solange noch kein Zielfeld gewählt
      if (G.selectedHandIdx >= 0 && G.selectedCellIdx < 0) cell.classList.add('highlight');
      if (G.selectedCellIdx === i) cell.classList.add('target');
      cell.innerHTML = '<div class="cell-plus">+</div>';
      cell.addEventListener('click', () => onCellClick(i));
      cell.addEventListener('touchend', (e) => { e.preventDefault(); onCellClick(i); }, { passive: false });
    }
    el.appendChild(cell);
  }

  // Barrieren nach dem Grid-Aufbau rendern
  renderBarriers();
  // Boden-Glow — nur wenn Board sich geändert hat
  if (!skipGlows) {
    requestAnimationFrame(() => requestAnimationFrame(() => renderGroundGlows()));
  }
  // Angriffsursprung-Markierung
  requestAnimationFrame(() => renderAttackOrigin());
}

// Schachturm (Rook) — ISO-Zylinder, steingrau, violette Krone
function makeHandTowerSVG() {
  const w = 22, h = 72;
  const cx = w / 2;
  // Proportionen: breiter unten, schlanker oben
  const baseR = 8, bodyR = 6, crownR = 7.5;
  const baseY = h - 6, bodyTop = 22, crownY = 14;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"
    viewBox="0 0 ${w} ${h}" overflow="visible"
    style="filter:drop-shadow(1px 2px 3px rgba(18,14,10,0.32)) drop-shadow(0 1px 1px rgba(18,14,10,0.18))">

    <!-- Basis (elliptische Grundfläche) -->
    <ellipse cx="${cx}" cy="${baseY}" rx="${baseR}" ry="${baseR*0.38}"
             fill="#5a5650" stroke="#2e2a28" stroke-width="0.7"/>

    <!-- Turmkörper — linke Hälfte dunkler, rechte heller -->
    <path d="M ${cx-bodyR} ${bodyTop} L ${cx-bodyR} ${baseY} Q ${cx} ${baseY+baseR*0.38} ${cx} ${baseY}
             L ${cx} ${bodyTop} Z"
          fill="#4e4a46" stroke="none"/>
    <path d="M ${cx} ${bodyTop} L ${cx} ${baseY}
             Q ${cx+bodyR} ${baseY-baseR*0.38} ${cx+bodyR} ${baseY}
             L ${cx+bodyR} ${bodyTop} Z"
          fill="#6a6560" stroke="none"/>
    <!-- Turmkörper Umriss -->
    <rect x="${cx-bodyR}" y="${bodyTop}" width="${bodyR*2}" height="${baseY-bodyTop}"
          fill="none" stroke="#2e2a28" stroke-width="0.7"/>
    <!-- Turmkörper Ellipse oben -->
    <ellipse cx="${cx}" cy="${bodyTop}" rx="${bodyR}" ry="${bodyR*0.38}"
             fill="#7a7670" stroke="#2e2a28" stroke-width="0.7"/>

    <!-- Halsring -->
    <ellipse cx="${cx}" cy="${crownY+6}" rx="${crownR-1}" ry="${(crownR-1)*0.38}"
             fill="#8a8680" stroke="#2e2a28" stroke-width="0.6"/>

    <!-- Krone — violette Oberseite (Befestigungsfarbe) -->
    <!-- Kronenkörper -->
    <rect x="${cx-crownR}" y="${crownY}" width="${crownR*2}" height="8"
          fill="#5a2d82" stroke="#2e1050" stroke-width="0.7" rx="0.5"/>
    <!-- Zinnen (3 Bögen) -->
    <rect x="${cx-crownR+1}" y="${crownY-5}" width="4" height="6"
          fill="#6a38a8" stroke="#2e1050" stroke-width="0.6" rx="0.5"/>
    <rect x="${cx-2}" y="${crownY-5}" width="4" height="6"
          fill="#6a38a8" stroke="#2e1050" stroke-width="0.6" rx="0.5"/>
    <rect x="${cx+crownR-5}" y="${crownY-5}" width="4" height="6"
          fill="#6a38a8" stroke="#2e1050" stroke-width="0.6" rx="0.5"/>
    <!-- Krone Ellipse oben -->
    <ellipse cx="${cx}" cy="${crownY}" rx="${crownR}" ry="${crownR*0.38}"
             fill="#7a40c0" stroke="#2e1050" stroke-width="0.7"/>
    <!-- Glanzpunkt oben -->
    <ellipse cx="${cx-1}" cy="${crownY-0.5}" rx="3" ry="1.2"
             fill="rgba(200,150,255,0.3)"/>

    <!-- Steinmaserung am Körper -->
    <line x1="${cx-bodyR+1}" y1="${bodyTop+12}" x2="${cx+bodyR-1}" y2="${bodyTop+11}"
          stroke="rgba(18,14,10,0.15)" stroke-width="0.5"/>
    <line x1="${cx-bodyR+1}" y1="${bodyTop+22}" x2="${cx+bodyR-1}" y2="${bodyTop+21}"
          stroke="rgba(18,14,10,0.12)" stroke-width="0.5"/>
  </svg>`;
}

function renderHand() {
  const el = document.getElementById('hand-cards');
  el.innerHTML = '';
  document.querySelectorAll('.discard-overlay').forEach(e => e.remove());

  const cardLocked = !isPhaseAllowed('card');

  const activeCards = G.hand.map((card, idx) => ({ card, idx })).filter(c => c.card);
  const n = activeCards.length;
  const getTilt = (pos, total) => total <= 1 ? 0 : (pos / (total - 1) - 0.5) * 5;

  activeCards.forEach(({ card, idx }, pos) => {
    const wrap = document.createElement('div');
    wrap.className = 'hand-card-wrap';

    const slot = document.createElement('div');
    // Spielbarkeit prüfen (nur wenn Bauen erlaubt)
    const playability = cardLocked ? null : getCardPlayability(card);
    const isUnplayable = playability && !playability.playable;
    const isCoinBypass = playability && playability.coinBypass;

    slot.className = 'hand-card'
      + (cardLocked ? ' used' : '')
      + (isUnplayable ? ' unplayable' : '')
      + (isCoinBypass ? ' coin-bypass' : '');
    if (isUnplayable) slot.title = playability.reason;
    if (isCoinBypass) slot.title = `🪙 ${playability.reason}`;
    const tilt = getTilt(pos, n);
    const lift = Math.abs(tilt) * 0.5;
    slot.style.transform = `rotate(${tilt}deg) translateY(${lift}px)`;
    if (idx === G.selectedHandIdx) {
      slot.classList.add('selected');
      slot.classList.remove('used');
      slot.classList.remove('unplayable');
      slot.classList.remove('coin-bypass');
      slot.style.transform = '';
    }
    slot.innerHTML = makeCard(card, 66, 92, false);
    if (card.cat === 'special') {
      slot.style.borderRadius = '6px';
      slot.style.overflow = 'hidden';
      slot.classList.add('cell-card', 'special-card');
    }
    if (!cardLocked) {
      slot.addEventListener('click', () => onHandClick(idx));
      slot.addEventListener('touchend', (e) => { e.preventDefault(); onHandClick(idx); }, { passive: false });
    }
    wrap.appendChild(slot);

    // Rathaus-Upgrade-Icon — sichtbar in Bauphase, 5-Aktionen-Limit beachten
    const canDiscard = G.phase === 1 && !cardLocked && G.builtThisSeason < 5 && idx === G.selectedHandIdx;
    const discardBtn = document.createElement('div');
    discardBtn.className = 'discard-btn' + (canDiscard ? ' visible' : '');
    const rathausMax = G.rathausLevel >= 6;
    discardBtn.title = rathausMax
      ? 'Rathaus auf Maximum (Level 6)'
      : `Rathaus upgraden → Level ${G.rathausLevel + 1} · +1 Münze`;
    discardBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="rgba(18,14,10,0.35)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="19" x2="12" y2="5"/>
      <polyline points="5 12 12 5 19 12"/>
    </svg>`;
    if (canDiscard) {
      discardBtn.addEventListener('click', (e) => { e.stopPropagation(); discardSelected(idx); });
      discardBtn.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); discardSelected(idx); }, {passive:false});
    }
    wrap.appendChild(discardBtn);
    el.appendChild(wrap);
  });

  renderResources();

  // Draft-Indikator
  const draftEl = document.getElementById('draft-indicator');
  if (draftEl) {
    if (DRAFT.active && G.phase === 1) {
      const dir = DRAFT.direction === 1 ? '↻' : '↺';
      draftEl.textContent = `Draft ${DRAFT.round + 1}/5 ${dir} · `;
      draftEl.style.color = 'var(--accent)';
    } else {
      draftEl.textContent = '';
    }
  }

  // Rathaus-Level-Anzeige im Label
  const discardHintEl = document.getElementById('discard-hint');
  if (discardHintEl) {
    if (G.phase === 1 && G.hand.some(c => c)) {
      const actionsLeft = 5 - G.builtThisSeason;
      const levelDots = '●'.repeat(G.rathausLevel - 1) + '○'.repeat(6 - G.rathausLevel);
      discardHintEl.innerHTML = `· ${actionsLeft} Aktionen · 🏛 ${levelDots}`;
    } else {
      discardHintEl.textContent = '';
    }
  }
}

function discardSelected(idx) {
  if (!G.hand[idx]) return;
  if (G.builtThisSeason >= 5) { showToast('Limit von 5 Aktionen erreicht'); return; }

  // Rathaus upgraden: Karte unter Rathaus schieben → sofort +1 Münze, Level +1 (max 6)
  // Max 5 Upgrades möglich (Level 1→6), danach einfaches Abwerfen ohne Effekt
  if (G.rathausLevel < 6) {
    G.rathausStack.push(G.hand[idx]);
    G.hand[idx] = null;
    G.builtThisSeason++;
    G.rathausLevel++;
    G.coins++;

    // Puff-Animation auf der selektierten Hand-Karte starten (vor clearSelection)
    const selectedSlot = document.querySelector('.hand-card.selected');
    if (selectedSlot) selectedSlot.classList.add('puff-out');

    G.hand = G.hand.filter(c => c !== null);
    clearSelection();
    SFX.coin && SFX.coin();
    spawnColoredFloat(4, '+1 <svg width="13" height="10" viewBox="0 0 16 12" style="vertical-align:middle"><ellipse cx="8" cy="9.5" rx="6" ry="2" fill="#8a6200" opacity="0.6"/><ellipse cx="8" cy="7.5" rx="6" ry="2.4" fill="#f0c030" stroke="#a07000" stroke-width="0.5"/><ellipse cx="7.5" cy="6.5" rx="3.5" ry="1.2" fill="#f8e060" opacity="0.7"/></svg>', '#c8900a');
    showToast(`Rathaus Level ${G.rathausLevel} · +1 Münze`);
    renderDefenseChips();
    renderGrid(true); // Rathaus-Level sofort aktualisieren

    // Hand erst nach Animation neu rendern
    setTimeout(() => {
      if (G.builtThisSeason >= 5) {
        DRAFT.active = false;
        G.hand = [];
        setHint('5 Aktionen — Bauphase beendet · › für Rüsten', true);
        renderHand();
      } else if (DRAFT.active) {
        G.hand = G.hand.filter(c => c !== null);
        advanceDraft(-1);
      } else {
        renderHand();
      }
      renderGrid(true);
    }, 350);
    return;
  } else {
    // Rathaus bereits max — einfach abwerfen (kein Münzgewinn)
    G.hand[idx] = null;
    G.builtThisSeason++;
    showToast('Rathaus bereits auf Maximum — Karte abgeworfen');
  }

  clearSelection();
  if (G.builtThisSeason >= 5) {
    DRAFT.active = false;
    G.hand = [];
    setHint('5 Aktionen — Bauphase beendet · › für Rüsten', true);
  } else if (DRAFT.active) {
    G.hand = G.hand.filter(c => c !== null);
    advanceDraft(-1);
    return;
  } else {
    // Hand kompaktieren — null-Lücken entfernen damit idx-Referenzen stimmen
    G.hand = G.hand.filter(c => c !== null);
  }
  renderHand();
  renderGrid(true);
}

function renderResources() {
  const row = document.getElementById('resource-row');
  if (!row) return;
  row.innerHTML = '';

  const prod = calcProduction();
  const defLocked = !isPhaseAllowed('barrier');

  // SVG-Icons (kompakt)
  const barrierIcon = `<svg width="8" height="14" viewBox="0 0 10 18">
    <rect x="1.5" y="0" width="7" height="16" rx="1" fill="#c4955a" stroke="#7a5020" stroke-width="0.7"/>
    <line x1="4" y1="2" x2="3.8" y2="14" stroke="#9a7040" stroke-width="0.4" opacity="0.6"/>
    <rect x="0.5" y="0.5" width="1.5" height="15" rx="0.4" fill="#7a5020" opacity="0.6"/>
    <rect x="1.5" y="-1" width="7" height="2" rx="0.6" fill="#e8b870" stroke="#7a5020" stroke-width="0.4"/>
  </svg>`;
  const knightIcon = `<svg width="10" height="13" viewBox="0 0 12 15">
    <path d="M1 1 L11 1 L11 8 Q11 14 6 15 Q1 14 1 8 Z" fill="#3a3530" stroke="#1a1510" stroke-width="0.7"/>
    <path d="M2.5 2 L9.5 2 L9.5 8 Q9.5 13 6 14 Q2.5 13 2.5 8 Z" fill="#5a5550" opacity="0.5"/>
  </svg>`;
  const coinIcon = `<svg width="14" height="11" viewBox="0 0 16 12">
    <!-- Schatten/Boden -->
    <ellipse cx="8" cy="9.5" rx="6" ry="2" fill="#8a6200" opacity="0.6"/>
    <!-- Münzkörper -->
    <ellipse cx="8" cy="7.5" rx="6" ry="2.4" fill="#c8920a"/>
    <ellipse cx="8" cy="7.5" rx="6" ry="2.4" fill="url(#cg)" stroke="#a07000" stroke-width="0.5"/>
    <!-- Glanzlicht oben -->
    <ellipse cx="7.5" cy="6.5" rx="3.5" ry="1.2" fill="#f8e060" opacity="0.7"/>
    <!-- Prägungsring -->
    <ellipse cx="8" cy="7.5" rx="4.2" ry="1.6" fill="none" stroke="#a07000" stroke-width="0.4" opacity="0.5"/>
    <defs>
      <radialGradient id="cg" cx="40%" cy="35%">
        <stop offset="0%" stop-color="#f0c030"/>
        <stop offset="100%" stop-color="#b07800"/>
      </radialGradient>
    </defs>
  </svg>`;
  const towerIcon = `<svg width="11" height="14" viewBox="0 0 14 18" style="overflow:visible">
    <rect x="0.5" y="0" width="3.5" height="4" rx="0.4" fill="var(--ink)"/>
    <rect x="5" y="0" width="3.5" height="4" rx="0.4" fill="var(--ink)"/>
    <rect x="9.5" y="0" width="3.5" height="4" rx="0.4" fill="var(--ink)"/>
    <rect x="0.5" y="3.5" width="12.5" height="2.5" rx="0.4" fill="var(--ink)"/>
    <rect x="1.5" y="6" width="10.5" height="7.5" rx="0.3" fill="var(--ink)"/>
    <rect x="0" y="13.5" width="13.5" height="3" rx="0.5" fill="var(--ink)"/>
    <rect x="2" y="9" width="9.5" height="1.5" rx="0.3" fill="#7a40c0" opacity="0.7"/>
  </svg>`;

  // Drei Rohstoff→Verteidigungs-Paare
  const pairs = [
    { rawKey:'holz',    rawIcon:'🪵', rawCount: prod.holz,    rawLabel:'Holz',
      defKey:'barrier', defIcon: barrierIcon, defCount: G.barrierHand,
      onClick: defLocked ? null : onBarrierHandClick, active: G.selectedBarrier },
    { rawKey:'nahrung', rawIcon:'🌾', rawCount: prod.nahrung, rawLabel:'Nahrung',
      defKey:'knights', defIcon: knightIcon,  defCount: G.knights,
      onClick: defLocked ? null : onKnightClick, active: G.selectedKnight },
    { rawKey:'glas',    rawIcon:'🫙', rawCount: prod.glas,    rawLabel:'Glas',
      defKey:'coins',   defIcon: coinIcon,    defCount: G.coins,
      onClick: null, active: false },
  ];

  const isBuildPhase   = G.phase === 1;
  const isDefensePhase = G.phase === 2;

  pairs.forEach(p => {
    const pair = document.createElement('div');
    const defAllowed = isPhaseAllowed(p.defKey);
    pair.className = 'res-pair';
    if (isBuildPhase)   pair.classList.add('dim-def');
    if (isDefensePhase) pair.classList.add('dim-raw');
    pair.dataset.rawKey = p.rawKey;
    pair.dataset.defKey = p.defKey;

    pair.innerHTML = `
      <div class="res-pair-raw">
        <span class="raw-icon">${p.rawIcon}</span>
        <span class="raw-count ${p.rawCount === 0 ? 'zero' : ''}">${p.rawCount}</span>
      </div>
      <span class="res-pair-arrow">›</span>
      <div class="res-pair-def">
        <span class="def-icon">${p.defIcon}</span>
        <span class="def-count ${p.defCount === 0 ? 'zero' : ''}">${p.defCount}</span>
      </div>`;

    if (p.onClick && p.defCount > 0 && defAllowed) {
      pair.style.cursor = 'pointer';
      pair.addEventListener('click', p.onClick);
      pair.addEventListener('touchend', (e) => { e.preventDefault(); p.onClick(); }, {passive:false});
    }
    if (p.active) pair.style.outline = '1.5px solid var(--accent)';
    row.appendChild(pair);
  });

  // Turm-Chip separat (Münzen → Turm, kein direkter Rohstoff)
  const towerPair = document.createElement('div');
  const towerAllowed = isPhaseAllowed('tower');
  towerPair.className = 'res-pair' + (isBuildPhase ? ' dim-def' : '');
  towerPair.dataset.defKey = 'tower';
  towerPair.innerHTML = `
    <div class="res-pair-raw">
      ${coinIcon}
      <span class="raw-count ${G.coins < 3 ? 'zero' : ''}" style="font-size:0.55rem;opacity:0.5">×3</span>
    </div>
    <span class="res-pair-arrow">›</span>
    <div class="res-pair-def">
      <span style="opacity:${G.coins >= RATIO ? '1' : '0.3'}">${towerIcon}</span>
    </div>`;
  // Turm-Chip: in Rüstphase direkt platzieren (3 Münzen → Turm auf Karte)
  // Kein Inventar mehr — Münzen werden direkt beim Platzieren abgezogen
  if (towerAllowed && G.coins >= RATIO) {
    towerPair.style.cursor = 'pointer';
    towerPair.title = `${RATIO} Münzen → Turm auf Karte platzieren`;
    towerPair.addEventListener('click', onTowerHandClick);
    towerPair.addEventListener('touchend', (e) => { e.preventDefault(); onTowerHandClick(); }, {passive:false});
  }
  if (G.selectedTower) towerPair.style.outline = '1.5px solid #5a2d82';
  row.appendChild(towerPair);
}

// Hochkante Barriere in der Hand — identisch zur vertikalen Barriere zwischen Karten
function makeHandBarrierSVG() {
  const w = 18, h = 72;
  const bw = 10, bh = 62;
  const x = (w - bw) / 2, y = (h - bh) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"
    viewBox="0 0 ${w} ${h}" overflow="visible"
    style="filter:drop-shadow(1px 2px 2px rgba(18,14,10,0.3)) drop-shadow(0 1px 1px rgba(18,14,10,0.18))">
    <!-- Brett-Körper -->
    <rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="1.5"
          fill="#c4955a" stroke="#7a5020" stroke-width="0.8"/>
    <!-- Holzmaserung (Längslinien) -->
    <line x1="${x + bw*0.28}" y1="${y+3}" x2="${x + bw*0.26}" y2="${y+bh-3}"
          stroke="#9a7040" stroke-width="0.5" opacity="0.6"/>
    <line x1="${x + bw*0.62}" y1="${y+3}" x2="${x + bw*0.64}" y2="${y+bh-3}"
          stroke="#9a7040" stroke-width="0.4" opacity="0.5"/>
    <!-- Linke Materialstärke -->
    <rect x="${x-1.5}" y="${y+1}" width="2" height="${bh-2}" rx="0.5"
          fill="#7a5020" opacity="0.65"/>
    <!-- Glanzlinie oben -->
    <line x1="${x+1}" y1="${y+1}" x2="${x+bw-1}" y2="${y+1}"
          stroke="rgba(255,255,255,0.32)" stroke-width="0.9"/>
    <!-- Oberkante (Stirnholz) -->
    <rect x="${x+0.5}" y="${y-1.5}" width="${bw-1}" height="2.5" rx="0.8"
          fill="#e8b870" stroke="#7a5020" stroke-width="0.5" opacity="0.9"/>
  </svg>`;
}

// ── Spalt-Zonen rendern ──────────────────────────────────────────
// Gültige Paare ohne Rathaus-Kanten
const VALID_BARRIER_PAIRS = [
  [0,1],[1,2],[6,7],[7,8],   // horizontal
  [0,3],[2,5],[3,6],[5,8],   // vertikal
];

function renderGapZones(active) {
  // Alte entfernen
  document.querySelectorAll('.gap-zone').forEach(e => e.remove());
  if (!active) return;

  const gridEl  = document.getElementById('grid');
  const cells   = gridEl.querySelectorAll('.cell');
  const appR    = document.getElementById('app').getBoundingClientRect();

  VALID_BARRIER_PAIRS.forEach(([a, b]) => {
    const key = BARRIER_KEY(a, b);
    if (G.barriers.has(key)) return; // schon belegt

    const rA = cells[a].getBoundingClientRect();
    const rB = cells[b].getBoundingClientRect();
    const isH = Math.abs(a - b) === 1;

    // Spalt-Mittelpunkt
    const cx = ((rA.left + rA.right)/2  + (rB.left + rB.right)/2)  / 2 - appR.left;
    const cy = ((rA.top  + rA.bottom)/2 + (rB.top  + rB.bottom)/2) / 2 - appR.top;

    // Treffzone: breiter als der sichtbare Spalt
    const zoneW = isH ? 20 : Math.min(rA.width, rB.width) * 0.7;
    const zoneH = isH ? Math.min(rA.height, rB.height) * 0.7 : 20;

    const zone = document.createElement('div');
    zone.className = 'gap-zone active';
    zone.style.cssText = `
      left:${(cx - zoneW/2).toFixed(1)}px;
      top:${(cy - zoneH/2).toFixed(1)}px;
      width:${zoneW.toFixed(1)}px;
      height:${zoneH.toFixed(1)}px;
    `;
    zone.innerHTML = '<div class="gap-inner"></div>';

    zone.addEventListener('click', () => onGapClick(key, a, b));
    zone.addEventListener('touchend', (e) => { e.preventDefault(); onGapClick(key, a, b); }, { passive: false });

    document.getElementById('app').appendChild(zone);
  });
}

function updateRathausScore() {
  const cell = document.querySelector('.cell.rathaus');
  if (cell) cell.innerHTML = makeCard(RATHAUS, 92, 128, true, G.score);
}

const PHASE_DESCRIPTIONS = [
  'Lausche den Gerüchten aus dem Tal…',
  'Baue deine Stadt aus',
  'Rüste deine Verteidigung · Barrieren, Ritter und Türme setzen',
  'Der Überfall beginnt!',
  'Zähle deine Siegpunkte',
];

const PHASE_ALLOWED = {
  0: ['coins'],
  1: ['card', 'coins'],
  2: ['barrier', 'tower', 'knights', 'coins'],
  3: ['coins'],
  4: ['coins'],
};

function isPhaseAllowed(action) {
  return (PHASE_ALLOWED[G.phase] || []).includes(action);
}

function renderPlaceRow() {
  const btnNext = document.getElementById('btn-next-phase');
  const col = SEASON_COLORS[SEASON_KEYS[G.season]];
  btnNext.style.setProperty('--phase-col', col);
  const hasSelection = G.selectedHandIdx >= 0 || G.selectedBarrier ||
                       G.selectedTower || G.selectedKnight || G.selectedCellIdx >= 0;
  btnNext.classList.toggle('ready', !hasSelection);
}

// Phasenwechsel mit Animation — vollständiger Jahreszeiten-Durchlauf
function advancePhase() {
  clearSelection();
  // Ernte-Overlay schließen falls noch offen
  const defOverlay = document.getElementById('defense-overlay');
  if (defOverlay && defOverlay.classList.contains('show')) {
    defOverlay.classList.remove('show');
    defOverlay.onclick = null;
  }

  let nextPhase  = G.phase + 1;
  let nextSeason = G.season;

  // Winter (J1) hat nur 3 Phasen: Bauen(1), Verteidigung(2), Wertung(4)
  // → nach Phase 2 direkt zu Phase 4 springen, Phase 3 (Überfall) überspringen
  if (G.season === 0 && nextPhase === 3) nextPhase = 4;

  // Nach Phase 4 (Wertung): nächste Jahreszeit
  if (nextPhase > 4) {
    nextSeason++;
    nextPhase = nextSeason === 0 ? 1 : 0;
  }
  // J1: Gerüchte überspringen
  if (nextSeason === 0 && nextPhase === 0) nextPhase = 1;

  // Spielende nach J4 Wertung
  if (nextSeason > 3) { showGameEnd(); return; }

  const col        = SEASON_COLORS[SEASON_KEYS[nextSeason]];
  const isNewSeason = nextSeason !== G.season;
  const overlay    = document.getElementById('phase-transition');
  const nameEl     = document.getElementById('pt-name');
  const subEl      = document.getElementById('pt-sub');
  const romanEl    = document.getElementById('pt-roman');
  const dividerEl  = document.getElementById('pt-divider');
  const shimmerEl  = overlay.querySelector('.pt-shimmer');

  if (isNewSeason) {
    // ── Jahreszeitenwechsel: deutlichere Behandlung ──
    overlay.classList.add('season-change');
    romanEl.textContent = `JAHRESZEIT ${['I','II','III','IV'][nextSeason]}`;
    nameEl.textContent  = SEASON_NAMES[nextSeason].toUpperCase();
    subEl.textContent   = 'beginnt';
    nameEl.style.color  = col;
    romanEl.style.color = col;

    // Trennlinie in Jahreszeit-Farbe
    dividerEl.style.background = col;

    // Schimmer: diagonaler Sweep in Jahreszeit-Farbe
    shimmerEl.style.background = `linear-gradient(
      105deg,
      transparent 0%,
      transparent 30%,
      ${col}22 45%,
      ${col}55 50%,
      ${col}22 55%,
      transparent 70%,
      transparent 100%
    )`;
    shimmerEl.style.backgroundSize = '300% 100%';
  } else {
    // ── Normaler Phasenwechsel: schlicht ──
    overlay.classList.remove('season-change');
    romanEl.textContent = '';
    dividerEl.style.background = 'transparent';
    shimmerEl.style.background = 'transparent';
    nameEl.textContent  = PHASES[nextPhase].toUpperCase();
    subEl.textContent   = PHASE_DESCRIPTIONS[nextPhase];
    nameEl.style.color  = col;
  }

  overlay.classList.add('show');

  setTimeout(() => {
    G.phase  = nextPhase;
    G.season = nextSeason;

    // Neue Jahreszeit: Würfel zurücksetzen
    if (isNewSeason) {
      G.diceRolled = false;
      G.diceConcealed = new Set();
      G.attackDir      = null;
      G.attackBlue     = null;
      G.attackChampion = null;
      document.querySelectorAll('.cell.attack-origin').forEach(c => c.classList.remove('attack-origin'));
      renderDice(false);
    }
    if (isNewSeason) {
      G.plundered = Array(9).fill(false);
      G.entered   = Array(9).fill(false);
      G.builtThisSeason = 0;
      G.bogenwacht = 0;
      G.schildwall = null;
      G.score = G.board.reduce((sum, card, i) =>
        card && i !== 4 ? sum + calcCardPts(card) : sum, 0);
      startSeasonParticles(nextSeason); SFX.season();
    }

    // Hand-Management — VOR renderHand()
    if (nextPhase === 1) {
      // Bauphase: Pool neu aufbauen + Hand ziehen, Baulimit zurücksetzen
      buildSeasonPools();
      G.hand = buildDraftHand(nextSeason);
      G.builtThisSeason = 0;
    } else if (nextPhase === 2) {
      // Rüsten: alte Karten weg, Hand leer
      G.hand = [];
    } else {
      // Gerüchte / Überfall / Wertung: Hand leer
      G.hand = [];
    }

    renderPhaseBar();
    renderPlaceRow();
    renderHand();
    renderGrid();

    // Dot-Wellen-Animation
    setTimeout(() => {
      const visibleIdx = getVisiblePhaseIndex(nextPhase, nextSeason);
      const dots = document.querySelectorAll('#phase-dots .phase-dot');
      if (dots[visibleIdx]) {
        dots[visibleIdx].classList.add('arriving');
        dots[visibleIdx].addEventListener('animationend',
          () => dots[visibleIdx].classList.remove('arriving'), {once:true});
      }
    }, 50);

    setHint(isNewSeason
      ? `${SEASON_NAMES[nextSeason]} beginnt — ${PHASE_DESCRIPTIONS[nextPhase]}`
      : PHASE_DESCRIPTIONS[nextPhase], false);

    // Gerüchte-Phase: Würfel werfen
    if (nextPhase === 0) {
      setTimeout(() => rollDice(), 400);
    }
    // Verteidigungsphase: Stadt lebt kurz auf, dann Ernte-Overlay
    if (nextPhase === 2) {
      setTimeout(() => animateCityAlive(), 100);
      setTimeout(() => showDefenseOverlay(), 1800);
    }
    // Überfall-Phase: Hintergrund-Fade und Würfel-Reveal gleichzeitig starten
    if (nextPhase === 3) {
      setTimeout(() => {
        // Fade-in beginnt mit dem Reveal — Dauer passend zur Sequenz
        const stage = document.getElementById('stage');
        document.getElementById('raid-overlay').classList.add('visible'); SFX.raidStart();
        spawnRaidAtmosphere(stage);
        // Würfel aufdecken
        revealWithDrama();
      }, 400);
    }
    // Wertungsphase: Punkte übertragen
    if (nextPhase === 4) {
      // Überfall-Atmosphäre aufräumen falls noch aktiv
      const raidOverlay = document.getElementById('raid-overlay');
      if (raidOverlay && raidOverlay.classList.contains('visible')) {
        stopRaidAtmosphere(document.getElementById('stage'));
        setTimeout(() => raidOverlay.classList.remove('visible'), 200);
      }
      setTimeout(() => doScoring(), 400);
    }

    setTimeout(() => {
      overlay.classList.remove('show');
      overlay.classList.remove('season-change');
    }, isNewSeason ? 2000 : 650);
  }, isNewSeason ? 1100 : 900);
}

// Winter zeigt nur 3 Phasen — visuelle Index-Berechnung für Dot-Animation
function getVisiblePhaseIndex(phase, season) {
  if (season === 0) {
    // Winter: Bauen=0, Verteidigung=1, Wertung=2
    return {1:0, 2:1, 4:2}[phase] ?? 0;
  }
  return phase;
}

function showGameEnd() {
  const overlay = document.getElementById('gameover-overlay');
  document.getElementById('go-score-num').textContent = G.victoryPoints;
  // Cover-Bild setzen
  const bg = overlay.querySelector('.go-bg');
  if (bg) bg.style.backgroundImage = "url('zwischental-splash.png')";
  const msgs = G.victoryPoints >= 60 ? 'Das Tal singt Lieder von diesem Bürgermeister.'
    : G.victoryPoints >= 40 ? 'Wiederaufgebaut. Wieder verteidigt. Wieder stolz.'
    : G.victoryPoints >= 25 ? 'Das Murmeltier blickt resigniert — aber es baut weiter.'
    : 'Die Horde war stärker. Nächstes Jahr wird besser.';
  document.getElementById('go-sub-text').textContent = msgs;
  overlay.classList.add('show');
}

// Score aus dem aktuellen Brettzustand neu berechnen.
// Identisch zur Logik in doScoringInternal, aber als Standalone nutzbar
// (z.B. nach Decoy-Aufdeckung, um G.score sofort konsistent zu halten).
function recomputeScoreFromBoard() {
  G.score = G.board.reduce((sum, card, i) => {
    if (!card || i === 4) return sum;
    if (G.plundered[i]) {
      // Versicherung: 8 Punkte wenn geplündert
      if (card.special_mechanic === 'pts_if_plundered') return sum + 8;
      return sum;
    }
    return sum + calcCardPts(card);
  }, 0);
}

// Wertungsphase: Score live aus aktiven Karten berechnen → Siegpunkte
function doScoring() {
  if (G.phase !== 4) return;

  // ── FRAGILE-Karten aufräumen, die in diesem Überfall betreten wurden ──
  // Sie werden komplett entfernt (nicht nur als plundered markiert) und
  // zählen damit nicht zur Wertung. Kleine Puff-Animation gibt Feedback.
  const fragileVictims = [];
  G.board.forEach((card, i) => {
    if (!card || i === 4) return;
    if (card.fragile && G.entered[i]) fragileVictims.push(i);
  });

  if (fragileVictims.length > 0) {
    const cellsAll = document.querySelectorAll('.cell');
    fragileVictims.forEach((idx, k) => {
      setTimeout(() => {
        const cell = cellsAll[idx];
        const card = G.board[idx];
        const isDecoy = card && card.special_mechanic === 'decoy';
        const stack   = G.stacks[idx];
        const hasUnderlying = isDecoy && stack && stack.length > 1;

        if (cell) {
          // Puff-Effekt: kleines weiches Wölkchen über der Zelle
          const puff = document.createElement('div');
          puff.className = 'fragile-puff';
          cell.appendChild(puff);
          cell.classList.add('fragile-vanishing');
          setTimeout(() => {
            if (hasUnderlying) {
              // Decoy: oberste Karte vom Stack entfernen, darunter liegende freilegen
              const newStack = stack.slice(0, -1);
              G.stacks[idx] = newStack;
              G.board[idx]  = { ...newStack[newStack.length - 1] };
              // Plünder-Status zurücksetzen — die freigelegte Karte ist NICHT
              // geplündert (der Decoy hat den Schaden absorbiert)
              G.plundered[idx] = false;
              G.boosted[idx]   = 0;
              cell.classList.remove('fragile-vanishing');
              puff.remove();
              // Score sofort neu berechnen, damit Rathaus die freigelegte Karte zeigt
              recomputeScoreFromBoard();
              renderGrid();
              updateRathausScore();
            } else {
              // Normale fragile-Karte (oder Decoy ohne Karte darunter): komplett entfernen
              G.board[idx]  = null;
              G.stacks[idx] = null;
              G.plundered[idx] = false;
              G.fortified[idx] = false;
              G.boosted[idx]   = 0;
              cell.classList.remove('fragile-vanishing');
              puff.remove();
              // Score sofort neu berechnen (Karte ist weg, Punkte abgezogen)
              recomputeScoreFromBoard();
              renderGrid();
              updateRathausScore();
            }
          }, 600);
        }
        const floatText = hasUnderlying ? '🎭 Aufgedeckt!' : '💨 Zerbrochen';
        spawnColoredFloat(idx, floatText, '#c8940a');
      }, k * 220);
    });

    // Wertung leicht verzögert starten, damit der Spieler die Puffs sieht
    setTimeout(() => doScoringInternal(), fragileVictims.length * 220 + 700);
    return;
  }

  doScoringInternal();
}

function doScoringInternal() {
  if (G.phase !== 4) return;

  // Live-Berechnung aus allen Karten:
  // - Aktive Karten: normale Punkte
  // - Geplünderte Versicherungen: 8 Punkte (das ist ihre Mechanik)
  // - Andere geplünderte Karten: 0 Punkte
  const points = G.board.reduce((sum, card, i) => {
    if (!card || i === 4) return sum;
    if (G.plundered[i]) {
      // Versicherung: 8 Punkte wenn geplündert
      if (card.special_mechanic === 'pts_if_plundered') return sum + 8;
      return sum;
    }
    return sum + calcCardPts(card);
  }, 0);

  // G.score synchronisieren
  G.score = points;
  updateRathausScore();

  if (points <= 0) {
    showToast('Keine aktiven Gebäude — 0 Punkte diese Runde');
    return;
  }

  const col = SEASON_COLORS[SEASON_KEYS[G.season]];

  // Float vom Rathaus aufsteigen lassen — zentriert auf der Karte
  const rathausCell = document.querySelector('.cell.rathaus');
  if (rathausCell) {
    const cr = rathausCell.getBoundingClientRect();
    const ar = document.getElementById('app').getBoundingClientRect();
    const fl = document.createElement('div');
    fl.className = 'transfer-float';
    fl.textContent = `+${points}`;
    fl.style.color = col;
    fl.style.left  = (cr.left - ar.left + cr.width/2 - 24) + 'px';
    fl.style.top   = (cr.top  - ar.top  + cr.height/2 - 12) + 'px';
    document.getElementById('app').appendChild(fl);
    fl.addEventListener('animationend', () => fl.remove());
  }

  // Wenn Float den Header fast erreicht hat: Header aufleuchten + VP erhöhen
  setTimeout(() => {
    // Ganzen Header in Jahreszeit-Farbe aufblinken
    const headerEl = document.querySelector('header');
    if (headerEl) {
      headerEl.style.setProperty('--flash-col', col + '33');
      headerEl.classList.remove('scoring-flash');
      void headerEl.offsetWidth;
      headerEl.classList.add('scoring-flash');
      headerEl.addEventListener('animationend',
        () => headerEl.classList.remove('scoring-flash'), {once:true});
    }

    // VP-Zahl aktualisieren + federn
    G.victoryPoints += points;
    // Münzen → Siegpunkte nur im Herbst (letzte Jahreszeit)
    const coinBonus = (G.season === 3) ? G.coins : 0;
    if (coinBonus > 0) G.victoryPoints += coinBonus;
    const vpEl = document.getElementById('vp-value');
    if (vpEl) {
      vpEl.textContent = G.victoryPoints;
      vpEl.style.setProperty('--season-col', col);
      vpEl.classList.remove('flash');
      void vpEl.offsetWidth;
      vpEl.classList.add('flash');
      vpEl.addEventListener('animationend', () => vpEl.classList.remove('flash'), {once:true});
    }

    if (coinBonus > 0) {
      SFX.scoring(); showToast(`+${points} Punkte · +${coinBonus} <svg width="11" height="9" viewBox="0 0 16 12" style="vertical-align:middle"><ellipse cx="8" cy="9.5" rx="6" ry="2" fill="#8a6200" opacity="0.6"/><ellipse cx="8" cy="7.5" rx="6" ry="2.4" fill="#f0c030" stroke="#a07000" stroke-width="0.5"/><ellipse cx="7.5" cy="6.5" rx="3.5" ry="1.2" fill="#f8e060" opacity="0.7"/></svg> = ${G.victoryPoints} gesamt`);
    } else {
      SFX.scoring(); showToast(`+${points} Siegpunkte gesichert`);
    }
  }, 1000); // Timing: wenn Float oben ankommt
}

// Demo-Überfall: 1–3 zufällige Karten werden geplündert, gestaffelt mit Animation
function doRaidDemo() { startRaidSequence(); }

function spawnRaidAtmosphere(stage) {
  const overlay = document.getElementById('raid-overlay');
  const positions = [
    { cls:'left',  left:'4%',  top:'30%', w:80,  h:120, colors:['rgba(220,80,20,0.5)','rgba(240,140,20,0.4)'] },
    { cls:'left',  left:'2%',  top:'60%', w:60,  h:90,  colors:['rgba(200,50,10,0.4)','rgba(220,100,20,0.35)'] },
    { cls:'right', left:'88%', top:'25%', w:90,  h:130, colors:['rgba(210,70,15,0.45)','rgba(240,130,20,0.4)'] },
    { cls:'right', left:'90%', top:'65%', w:55,  h:85,  colors:['rgba(200,40,10,0.35)','rgba(220,110,20,0.3)'] },
  ];
  positions.forEach((p, i) => {
    const fl = document.createElement('div');
    fl.className = `raid-flicker ${p.cls}`;
    fl.style.cssText = `left:${p.left};top:${p.top};width:${p.w}px;height:${p.h}px;
      background:radial-gradient(ellipse at center,${p.colors[0]} 0%,${p.colors[1]} 40%,transparent 75%);
      animation-delay:${i*0.3}s;`;
    overlay.appendChild(fl);
    setTimeout(() => fl.classList.add('visible'), 50);
  });

  let emberInterval = setInterval(() => {
    if (!document.getElementById('raid-overlay').classList.contains('visible')) { clearInterval(emberInterval); return; }
    // Mehrere Partikel gleichzeitig für mehr Dichte
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) spawnEmber(overlay);
  }, 180);
  stage._emberInterval = emberInterval;
}

function spawnEmber(container) {
  const ember = document.createElement('div');
  ember.className = 'ember';
  const isStreak = Math.random() > 0.6; // 40% Streifen statt Punkt
  const size   = isStreak ? (1 + Math.random() * 2) : (3 + Math.random() * 5);
  const height = isStreak ? (size * (4 + Math.random() * 6)) : size;
  const startX = 5 + Math.random() * 90;
  const drift  = (Math.random() - 0.5) * 60 + 'px';
  const dur    = 1.2 + Math.random() * 1.8;
  const delay  = Math.random() * 0.2;
  const bright = 0.7 + Math.random() * 0.3;
  const color  = Math.random() > 0.45
    ? `rgba(255,${120 + Math.random()*100|0},10,${bright})`
    : `rgba(220,${50  + Math.random()*80|0},5,${bright})`;
  ember.style.cssText = `
    width:${size}px; height:${height}px;
    border-radius:${isStreak ? '40%' : '50%'};
    left:${startX}%; bottom:${5 + Math.random()*35}%;
    background:${color};
    box-shadow: 0 0 ${size*2+2}px ${size}px ${color};
    --drift:${drift};
    animation: emberRise ${dur}s ${delay}s ease-out forwards;
  `;
  container.appendChild(ember);
  ember.addEventListener('animationend', () => ember.remove());
}

function stopRaidAtmosphere(stage) {
  clearInterval(stage._emberInterval);
  const overlay = document.getElementById('raid-overlay');
  overlay.querySelectorAll('.raid-flicker').forEach(e => {
    e.classList.remove('visible');
    e.classList.add('fading');
    setTimeout(() => e.remove(), 900);
  });
  overlay.querySelectorAll('.ember').forEach(e => e.remove());
}

function initAttackerBar(count) {
  const bar   = document.getElementById('attacker-bar');
  const slots = document.getElementById('dice-slots');
  // Würfel ausblenden, Progressbar einblenden
  if (slots) slots.style.display = 'none';
  bar.innerHTML = '';
  bar.style.display = 'flex';
  for (let i = 0; i < Math.min(count, 30); i++) {
    const dot = document.createElement('div');
    dot.className = 'attacker-dot';
    dot.id = `adot-${i}`;
    bar.appendChild(dot);
  }
  // Bei mehr als 30: Zahl anzeigen
  if (count > 30) {
    const lbl = document.createElement('span');
    lbl.style.cssText = `font-family:'Cinzel',serif;font-size:0.6rem;color:#2a5890;margin-left:4px;`;
    lbl.textContent = `+${count - 30}`;
    bar.appendChild(lbl);
  }
}

function spendAttackers(from, to) {
  for (let i = from - 1; i >= to; i--) {
    const dot = document.getElementById(`adot-${i}`);
    if (dot) setTimeout(() => dot.classList.add('spent'), (from - 1 - i) * 80);
  }
}

function clearAttackerBar() {
  const bar   = document.getElementById('attacker-bar');
  const slots = document.getElementById('dice-slots');
  bar.style.display = 'none';
  bar.innerHTML = '';
  // Würfel wieder einblenden
  if (slots) slots.style.display = '';
}

function setRaidActive(idx) {
  document.querySelectorAll('.cell.raid-active').forEach(c => c.classList.remove('raid-active'));
  if (idx !== null) {
    const cells = document.querySelectorAll('.cell');
    if (cells[idx]) cells[idx].classList.add('raid-active');
  }
}

function hasBarrier(a, b) {
  const key = `${Math.min(a,b)}-${Math.max(a,b)}`;
  return G.barriers && G.barriers.has(key);
}

// Schildwall: gibt +1 pro benachbarter Schildwall-Karte (stapelt sich)
function getSchildwallBonus(idx) {
  if (!G.schildwall || G.schildwall.size === 0) return 0;
  // Nachbarn im 3×3-Grid: horizontal/vertikal
  const neighbors = [idx-3, idx+3, idx-1, idx+1].filter(n => n >= 0 && n < 9 && n !== 4);
  let bonus = 0;
  for (const sw of G.schildwall) {
    if (neighbors.includes(sw) && G.board[sw] && !G.plundered[sw]) bonus++;
  }
  return bonus;
}

function startRaidSequence() {
  const stage = document.getElementById('stage');

  if (!G.attackDir || !G.attackBlue) {
    stopRaidAtmosphere(stage);
    document.getElementById('raid-overlay').classList.remove('visible');
    return;
  }

  // Neuer Überfall: Tracking welche Felder betreten wurden zurücksetzen
  G.entered = Array(9).fill(false);

  const { startCell, clockwise } = G.attackDir;
  let attackers = G.attackBlue.calc();

  // Bogenwacht: −2 Angreifer pro platzierter Bogenwacht-Karte
  if (G.bogenwacht && G.bogenwacht > 0) {
    attackers = Math.max(0, attackers - (G.bogenwacht * 2));
    setHint(`Bogenwacht −${G.bogenwacht * 2} Angreifer`, true);
  }

  // Champion-Effekte anwenden
  let effectiveStart    = startCell;
  let effectiveClockwise = clockwise;
  let ignoreBarriers    = 0;

  if (G.attackChampion) {
    const ch = G.attackChampion;
    const rv = G.dice.red;
    switch (ch.id) {
      case 'plus_red':
        attackers += rv;
        break;
      case 'opposite_start': {
        // Gegenüberliegende Position in CLOCKWISE_ORDER
        const ci = CLOCKWISE_ORDER.indexOf(startCell);
        effectiveStart = CLOCKWISE_ORDER[(ci + 4) % 8];
        break;
      }
      case 'reverse_dir':
        effectiveClockwise = !clockwise;
        break;
      case 'all_six':
        G.dice.yellow = 6;
        G.dice.blue   = 6;
        attackers = 6;
        effectiveClockwise = true; // 6 gerade → ↻
        G.attackerOverride = 6;
        G.attackDir = { ...G.attackDir, clockwise: true }; // Richtung aktualisieren
        renderDice(false);
        break;
      case 'all_one':
        G.dice.yellow = 1;
        G.dice.blue   = 1;
        attackers = 1;
        effectiveClockwise = false; // 1 ungerade → ↺
        G.attackerOverride = 1;
        G.attackDir = { ...G.attackDir, clockwise: false };
        renderDice(false);
        break;
      case 'ignore_barriers':
        ignoreBarriers = 2;
        break;
      case 'arsonist':
        // Mindestens 1 Karte wird deaktiviert — wird bei der Sequenz erzwungen
        break;
      case 'switcher':
        { const tmp = G.dice.yellow;
          G.dice.yellow = G.dice.blue;
          G.dice.blue   = tmp;
          attackers = G.attackBlue.calc();
          effectiveClockwise = (G.dice.yellow % 2 === 0);
          G.attackDir = { ...G.attackDir, clockwise: effectiveClockwise };
          G.attackerOverride = attackers;
          renderDice(false);
        }
        break;
      case 'vacationer':
        if (G.season === 2)      attackers = Math.max(0, attackers - 3); // Sommer
        else if (G.season === 1 || G.season === 3) attackers += 3;        // Frühling/Herbst
        break;
      case 'coward':
      case 'all_hidden':
      default:
        break;
    }
  }

  // Fragile Verteidigungskarten überschreiben Champion-Effekte
  // (stadttor, windrose_cw, windrose_ccw)
  const beforeStart    = effectiveStart;
  const beforeClockwise = effectiveClockwise;
  ({ startCell: effectiveStart, clockwise: effectiveClockwise } =
    applyFragileDefenses({ startCell: effectiveStart, clockwise: effectiveClockwise }));

  // Visuelle Rückmeldung wenn Fragile-Karten den Überfall ändern
  if (effectiveStart !== beforeStart) {
    showToast('🏰 Stadttor zieht den Angriff an!');
    // attackDir aktualisieren, damit attack-origin auf neuem Feld erscheint
    G.attackDir = { ...G.attackDir, startCell: effectiveStart, direction: GRID_DIRECTION[effectiveStart] };
  }
  if (effectiveClockwise !== beforeClockwise) {
    showToast(`🧭 Windrose erzwingt ${effectiveClockwise ? '↻' : '↺'}`);
    G.attackDir = { ...G.attackDir, clockwise: effectiveClockwise };
  }

  // Route berechnen mit effektiven Werten
  const startIdx = CLOCKWISE_ORDER.indexOf(effectiveStart);
  const route = [];
  for (let i = 0; i < 8; i++) {
    const pos = effectiveClockwise
      ? (startIdx + i) % 8
      : (startIdx - i + 8) % 8;
    route.push(CLOCKWISE_ORDER[pos]);
  }

  const raidRoute = route.filter(idx => G.board[idx] && idx !== 4);

  if (raidRoute.length === 0 || attackers <= 0) {
    clearAttackerBar();
    showToast('Die Stadt hält stand!');
    document.querySelectorAll('.cell.attack-origin').forEach(c => c.classList.remove('attack-origin'));
    setTimeout(() => { stopRaidAtmosphere(stage); setTimeout(() => document.getElementById('raid-overlay').classList.remove('visible'), 5000); }, 600);
    return;
  }

  const champHint = G.attackChampion && G.attackChampion.id !== 'coward' && G.attackChampion.id !== 'all_hidden'
    ? ` [${G.attackChampion.label}]` : '';
  setHint(`Angriff aus ${GRID_DIRECTION[effectiveStart] || '?'} ${effectiveClockwise ? '↻' : '↺'} · ${attackers} Angreifer${champHint}`, true);

  const totalAttackers = attackers;
  initAttackerBar(totalAttackers);
  let spentSoFar = 0;
  let barrierIgnoreLeft = ignoreBarriers;

  const steps = [];
  let prev = null;
  for (const idx of raidRoute) {
    if (attackers <= 0) break;

    // Barriere prüfen zwischen vorherigem und aktuellem Feld — auch wenn Felder leer sind
    if (prev !== null && hasBarrier(prev, idx)) {
      if (barrierIgnoreLeft > 0) {
        steps.push({ type: 'barrier', from: prev, to: idx, ignored: true });
        barrierIgnoreLeft--;
      } else {
        steps.push({ type: 'barrier', from: prev, to: idx, ignored: false });
        attackers--;
        if (attackers <= 0) { prev = idx; break; }
      }
    }

    prev = idx; // immer aktualisieren, auch bei leerem Feld

    const card = G.board[idx];
    if (!card) continue; // leeres Feld: Barriere wurde geprüft, Karte gibt es keine

    const schildwallBonus = getSchildwallBonus(idx);
    const def  = (card.def || 0) + (G.boosted[idx] || 0) + schildwallBonus;
    const hasTower = G.fortified[idx];
    const incoming = attackers;
    attackers = Math.max(0, attackers - def);
    const deactivate = incoming >= def && !hasTower;
    const blocked    = incoming >= def &&  hasTower;
    steps.push({ type: 'attack', idx, incoming, def, hasTower, deactivate, blocked, spent: Math.min(def, incoming) });
  }

  // Brandstifter: mindestens 1 Karte erzwingen wenn keine deaktiviert wurde
  if (G.attackChampion && G.attackChampion.id === 'arsonist') {
    const hasDeactivation = steps.some(s => s.type === 'attack' && s.deactivate);
    if (!hasDeactivation) {
      // Erste Angriffs-Karte erzwingen
      const firstAttack = steps.find(s => s.type === 'attack');
      if (firstAttack) {
        firstAttack.deactivate = true;
        firstAttack.forced = true;
      }
    }
  }

  const cells = document.querySelectorAll('.cell');
  let stepDelay = 0;

  steps.forEach((step, si) => {
    if (step.type === 'barrier') {
      setTimeout(() => {
        setRaidActive(step.to);
        const key = `${Math.min(step.from,step.to)}-${Math.max(step.from,step.to)}`;
        if (step.ignored) {
          setHint(`⛩ Barriere ignoriert — Champion!`, true);
          document.querySelectorAll('.barrier-el').forEach(b => {
            if (b.dataset.key === key) {
              b.style.filter = 'brightness(2) hue-rotate(270deg)';
              setTimeout(() => b.style.filter = '', 600);
            }
          });
        } else {
          setHint(`⛩ Barriere — 1 Angreifer gestoppt`, true);
          document.querySelectorAll('.barrier-el').forEach(b => {
            if (b.dataset.key === key) {
              b.style.filter = 'brightness(3) drop-shadow(0 0 6px #f0c030)';
              setTimeout(() => b.style.filter = '', 500);
            }
          });
          if (G.barriers) G.barriers.delete(key);
          setTimeout(() => renderBarriers(), 550);
          spendAttackers(totalAttackers - spentSoFar, totalAttackers - spentSoFar - 1);
          spentSoFar += 1;
        }
      }, stepDelay);
      stepDelay += 700;

    } else {
      // Outline auf Karte setzen
      setTimeout(() => setRaidActive(step.idx), stepDelay - 150 < 0 ? 0 : stepDelay - 150);

      setTimeout(() => {
        const { idx, incoming, def, deactivate, blocked, hasTower, spent } = step;

        // Karte wurde durchbrochen — relevant für fragile-Karten.
        // Bei blocked (Turm) oder hold (Verteidigung hält): nicht setzen,
        // denn dann hat sich die fragile-Wirkung nicht "ausgelöst".
        if (deactivate) G.entered[idx] = true;

        // Countdown: Punkte ausgeben
        spendAttackers(totalAttackers - spentSoFar, totalAttackers - spentSoFar - spent);
        spentSoFar += spent;

        const remaining = incoming - def;
        const forcedTxt = step.forced ? ' 🔥 Brandstifter!' : '';
        setHint(`${incoming} ⚔ → 🛡${def}${hasTower ? ' ♜' : ''} — ${deactivate ? 'Geplündert!' + (remaining > 0 ? ' ' + remaining + ' weiter' : ' Stopp') + forcedTxt : blocked ? 'Turm hält!' : 'Stadt hält!'}`, true);

        if (cells[idx]) {
          cells[idx].classList.add('plundering');
          cells[idx].addEventListener('animationend', () => cells[idx].classList.remove('plundering'), {once:true});
        }

        if (deactivate) {
          const hitCard = G.board[idx];
          const isDecoyWithUnderlying = hitCard && hitCard.special_mechanic === 'decoy'
            && G.stacks[idx] && G.stacks[idx].length > 1;

          if (isDecoyWithUnderlying) {
            // Decoy mit Karte darunter: NICHT plündern.
            // Karte bleibt aktiv (sichtbar), wird in der Wertung via fragile-Mechanik
            // aufgedeckt und die darunter liegende Karte wird dann gewertet.
            // G.entered[idx] ist bereits true → fragile-Logik greift später.
            G.boosted[idx] = 0;
            spawnColoredFloat(idx, '🎭 Abgelenkt!', '#c8940a');
            renderGrid();
          } else {
            G.plundered[idx] = true;
            G.boosted[idx] = 0;
            // Kristallpalast: wird zerstört (verschwindet komplett)
            if (hitCard && hitCard.special_mechanic === 'destroyable') {
              G.board[idx] = null;
              G.stacks[idx] = null;
              spawnColoredFloat(idx, '💎 Zerstört!', '#c8a010');
            }
            // Score-Update beim Plündern:
            // - Versicherung: gibt jetzt 8 Punkte (war vorher 0) → +8
            // - Andere Karten: verlieren ihre Punkte → −pts
            if (hitCard && hitCard.special_mechanic === 'pts_if_plundered') {
              G.score = G.score + 8;
              spawnColoredFloat(idx, '+8 💰 Versicherung!', '#3a8a3a');
            } else {
              G.score = Math.max(0, G.score - calcCardPts(G.board[idx] || {pts:0}));
              spawnColoredFloat(idx, `−${def}🛡`, '#c04040');
            }
            renderGrid();
            updateRathausScore();
          }
        } else if (blocked) {
          G.boosted[idx] = 0;
          spawnColoredFloat(idx, `♜ −${def}`, '#6a38a8');
          renderGrid();
        } else {
          if (G.boosted[idx]) { G.boosted[idx] = 0; renderGrid(); }
          spawnColoredFloat(idx, `🛡 +${def}`, '#3a8a3a');
        }
      }, stepDelay);
      stepDelay += 900;
    }
  });

  const deactivated = steps.filter(s => s.deactivate).length;
  setTimeout(() => {
    setRaidActive(null);
    clearAttackerBar();

    // Volksaufstand: nach dem Überfall eine weitere Karte deaktivieren
    if (G.attackChampion && G.attackChampion.id === 'volksaufstand') {
      const hits = Math.random() < 0.34;
      if (hits) {
        const routeOrder = [...Array(8)].map((_, i) => {
          const pos = effectiveClockwise
            ? (CLOCKWISE_ORDER.indexOf(effectiveStart) + i) % 8
            : (CLOCKWISE_ORDER.indexOf(effectiveStart) - i + 8) % 8;
          return CLOCKWISE_ORDER[pos];
        });
        const victim = routeOrder.find(idx => G.board[idx] && idx !== 4 && !G.plundered[idx]);
        if (victim !== undefined) {
          setTimeout(() => {
            G.plundered[victim] = true;
            G.score = Math.max(0, G.score - calcCardPts(G.board[victim]));
            renderGrid();
            updateRathausScore();
            const cells = document.querySelectorAll('.cell');
            if (cells[victim]) {
              cells[victim].classList.add('plundering');
              cells[victim].addEventListener('animationend', () => cells[victim].classList.remove('plundering'), {once:true});
            }
            spawnColoredFloat(victim, `👑 Volksaufstand!`, '#c04040');
            showToast('Volksaufstand — du warst führend!');
          }, 400);
        }
      } else {
        setTimeout(() => showToast('Volksaufstand — trifft einen Mitspieler'), 400);
      }
    }

    if (deactivated > 0) {
      showToast(`${deactivated} Gebäude geplündert!`);
    } else {
      showToast('Die Stadt hält stand!');
    }
    document.querySelectorAll('.cell.attack-origin').forEach(c => c.classList.remove('attack-origin'));
    setTimeout(() => {
      stopRaidAtmosphere(stage);
      setTimeout(() => document.getElementById('raid-overlay').classList.remove('visible'), 5000);
    }, 600);
  }, stepDelay + 300);
}  // end startRaidSequence

// Score Float mit optionaler Farbe
function spawnColoredFloat(cellIdx, text, color) {
  const cells = document.querySelectorAll('.cell');
  const cell  = cells[cellIdx];
  if (!cell) return;
  const cr = cell.getBoundingClientRect();
  const ar = document.getElementById('app').getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'score-float';
  el.innerHTML = text;
  el.style.color = color || 'var(--ink)';
  el.style.left  = (cr.left - ar.left + cr.width/2 - 16) + 'px';
  el.style.top   = (cr.top  - ar.top  + cr.height/2 - 10) + 'px';
  document.getElementById('app').appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

document.getElementById('go-restart').addEventListener('click', restartGame);
document.getElementById('go-restart').addEventListener('touchend', (e) => { e.preventDefault(); restartGame(); }, {passive:false});

function restartGame() {
  // State zurücksetzen
  G.board         = Array(9).fill(null);
  G.stacks        = Array(9).fill(null);
  G.fortified     = Array(9).fill(false);
  G.fortifiedNew  = new Set();
  G.boosted       = Array(9).fill(false);
  G.plundered     = Array(9).fill(false);
  G.entered       = Array(9).fill(false);
  G.barriers      = new Set();
  G.hand          = [];
  G.barrierHand   = 0;
  G.towerHand     = 0;
  G.score         = 0;
  G.victoryPoints = 0;
  G.builtThisSeason = 0;
  G.rathausLevel  = 1;
  G.rathausStack  = [];
  G.coins         = 0;
  G.knights       = 0;
  G.bogenwacht    = 0;
  G.schildwall    = null;
  G.season        = 0;
  G.phase         = 1;
  G.mode          = 'card';
  G.selectedHandIdx = G.selectedCellIdx = -1;
  G.selectedBarrier = G.selectedTower = G.selectedKnight = false;
  G.selectedBarrierKey = null;
  G.board[4] = { ...RATHAUS };

  G.dice        = { yellow: 0, blue: 0, red: 0 };
  G.diceDetails = { yellow: null, blue: null, red: null };
  G.diceRolled  = false;
  G.diceConcealed = new Set();
  G.attackDir      = null;
  G.attackBlue     = null;
  G.attackChampion = null;
  renderDice(false);
  document.querySelectorAll('.barrier-el, .gap-zone').forEach(e => e.remove());

  // Endbildschirm verstecken
  document.getElementById('gameover-overlay').classList.remove('show');
  buildSeasonPools();
  initDrawBags();
  dealHand();
  renderGrid();
  renderHand();
  renderPhaseBar();
  renderPlaceRow();
  renderVP();
  renderProductionPanel();
  setHint(PHASE_DESCRIPTIONS[G.phase], false);
  showToast('Neues Spiel gestartet');
  startSeasonParticles(G.season);
}

document.getElementById('btn-next-phase').addEventListener('click', advancePhase);
document.getElementById('btn-next-phase').addEventListener('touchend', (e) => { e.preventDefault(); advancePhase(); }, {passive:false});
function clearSelection() {
  G.selectedHandIdx    = -1;
  G.selectedBarrier    = false;
  G.selectedTower      = false;
  G.selectedKnight     = false;
  G.selectedCellIdx    = -1;
  G.selectedBarrierKey = null;
  G.mode = 'card';
  renderGapZones(false);
  renderPlaceRow();
  document.querySelectorAll('.cell-build-overlay').forEach(e => e.remove());
}

// Beschreibungen für Sonderkarten-Mechaniken
const SPECIAL_MECHANIC_DESC = {
  free_build:        'Kostenlos — zählt nicht zum Baulimit',
  minus2_attackers:  '−2 Angreifer vor dem Überfall',
  neighbor_defense:  'Nachbarkarten erhalten +1 Verteidigung',
  indestructible:    'Kann nie deaktiviert werden',
  reveal_red:        'Deckt roten Würfel (Champion) auf, wenn verborgen',
  reveal_yellow:     'Deckt gelben Würfel (Richtung) auf, wenn verborgen',
  reveal_blue:       'Deckt blauen Würfel (Angreifer) auf, wenn verborgen',
  direct_knight:     'Gibt sofort 2 Ritter beim Bau',
  direct_barrier:    'Gibt sofort 2 Barrieren beim Bau',
  direct_coins:          'Gibt sofort 2 Münzen beim Bau',
  direct_coins_seasonal: 'Gibt sofort Jahreszeit × 1 Münzen beim Bau',
  dual_res_nahrung:  'Produziert Holz UND Nahrung',
  dual_res_holz:     'Produziert Nahrung UND Holz',
  dual_res_glas:     'Produziert Holz UND Glas',
  destroyable:       '15 Punkte — wird bei Deaktivierung zerstört',
  pts_if_plundered:  '0 Punkte wenn aktiv · 8 Punkte wenn deaktiviert',
  season_pts:        'Punkte = Jahreszeit × 2 (max 8 in Herbst)',
  sonder_count:      'Punkte = Anzahl Sonderkarten auf dem Feld × 2',
};

function onHandClick(idx) {
  if (!isPhaseAllowed('card')) { showToast('Karten nur in der Bau-Phase'); return; }
  if (!G.hand[idx]) return;

  if (G.selectedBarrier) { clearSelection(); }
  if (G.selectedHandIdx === idx) {
    clearSelection();
    setHint('Wähle eine Karte aus deiner Hand');
  } else {
    clearSelection();
    G.selectedHandIdx = idx;
    G.mode = 'card';
    const card = G.hand[idx];
    // Unspielbare Karte: Grund als Hint anzeigen
    // (Auswahl bleibt erlaubt, damit der Spieler abwerfen oder draften kann)
    const playability = getCardPlayability(card);
    if (!playability.playable) {
      setHint(`⊘ ${playability.reason}`, true);
    } else if (playability.coinBypass) {
      setHint(`🪙 ${playability.reason} — Tippe ein Feld zum Bauen`, true);
    } else if (card && card.cat === 'special' && card.special_mechanic && SPECIAL_MECHANIC_DESC[card.special_mechanic]) {
      // Sonderkarte: Mechanik als Hint anzeigen
      setHint(`✦ ${SPECIAL_MECHANIC_DESC[card.special_mechanic]}`, true);
    } else {
      setHint('Tippe ein Feld zum Bauen', true);
    }
  }
  renderHand(); renderGrid(true);
}

function onBarrierHandClick() {
  if (!isPhaseAllowed('barrier')) { showToast('Barrieren nur in der Verteidigungs-Phase'); return; }
  if (G.barrierHand <= 0) return;
  if (G.selectedBarrier) {
    clearSelection();
    setHint('Wähle eine Karte aus deiner Hand');
    renderHand(); renderGrid(true);
    return;
  }
  clearSelection();
  G.selectedBarrier = true;
  G.mode = 'barrier';
  setHint('Tippe auf einen Spalt zwischen zwei Feldern', true);
  renderHand();
  renderGrid(true);
  setTimeout(() => renderGapZones(true), 50);
}

function onTowerHandClick() {
  if (!isPhaseAllowed('tower')) { showToast('Türme nur in der Verteidigungs-Phase'); return; }
  if (G.coins < RATIO) { showToast(`Nicht genug Münzen (${RATIO} benötigt)`); return; }
  if (G.selectedTower) { clearSelection(); setHint('Wähle eine Karte aus deiner Hand'); renderHand(); renderGrid(); return; }
  clearSelection();
  G.selectedTower = true;
  G.mode = 'tower';
  setHint(`Tippe ein Gebäude zum Befestigen (−${RATIO} Münzen)`, true);
  renderHand(); renderGrid(true);
}

function onKnightClick() {
  if (!isPhaseAllowed('knights')) { showToast('Ritter nur in der Verteidigungs-Phase'); return; }
  if (G.knights <= 0) return;
  if (G.selectedKnight && G.knights <= 0) { clearSelection(); renderHand(); renderGrid(); return; }
  clearSelection();
  G.selectedKnight = true;
  G.mode = 'knight';
  setHint('Tippe ein Gebäude für +1 Verteidigung', true);
  renderHand(); renderGrid(true);
}

function onCellClick(idx) {
  if (G.mode === 'barrier') return;

  if (G.mode === 'tower') {
    if (!G.board[idx] || idx === 4) { showToast('Nur auf Gebäude platzierbar'); return; }
    if (G.fortified[idx]) { showToast('Bereits befestigt'); return; }
    placeTower(idx); return;
  }

  if (G.mode === 'knight') {
    if (!G.board[idx] || idx === 4) { showToast('Nur auf Gebäude platzierbar'); return; }
    // Mehrere Ritter erlaubt
    placeKnight(idx); return;
  }

  if (G.selectedHandIdx < 0) { showToast('Zuerst eine Karte wählen'); return; }
  if (idx === 4) return;

  const selCard = G.hand[G.selectedHandIdx];
  if (!selCard) { showToast('Zuerst eine Karte wählen'); return; }

  // Spezialkarte: Würfelkosten minus Rathaus-Rabatt in Münzen zahlen
  if (selCard && selCard.isSpecialOffer && selCard.diceColor && G.diceRolled) {
    const baseCost  = G.dice[selCard.diceColor];
    const discount  = G.rathausLevel - 1;
    const finalCost = Math.max(0, baseCost - discount);
    if (finalCost > G.coins) {
      showToast(`Kostet ${finalCost} Münzen (fehlen ${finalCost - G.coins})`);
      return;
    }
    if (finalCost > 0) {
      G.coins -= finalCost;
      SFX.coin && SFX.coin();
      showToast(`${finalCost} Münze${finalCost > 1 ? 'n' : ''} gezahlt${discount > 0 ? ` (${discount} Rabatt durch Rathaus)` : ''}`);
      renderDefenseChips();
    }
  }

  // Fragile-Karten: nur eine pro Mechanik in der Stadt
  // Beim Ersetzen zählt die Karte am Zielfeld nicht mit
  if (selCard && selCard.fragile && selCard.special_mechanic) {
    const conflictIdx = findFragileConflict(selCard, idx);
    if (conflictIdx >= 0) {
      showToast(fragileConflictMessage(selCard.special_mechanic));
      return;
    }
  }

  // Decoy: spezielle Platzierungsregeln
  if (selCard && selCard.special_mechanic === 'decoy') {
    if (!G.board[idx]) {
      showToast('Ablenkungsmanöver braucht eine Karte zum Beschützen');
      return;
    }
    if (G.board[idx].fragile) {
      showToast('Ablenkungsmanöver nicht auf andere fragile Karten');
      return;
    }
  }

  // Zweiter Tap auf dasselbe Feld → sofort bauen
  if (G.selectedCellIdx === idx) {
    placeCard();
    return;
  }

  // Erster Tap: Feld auswählen + Overlay direkt auf der Zelle
  G.selectedCellIdx = idx;

  const newCard = G.hand[G.selectedHandIdx];
  let overlayClass = 'cell-build-overlay';
  let overlayText  = 'HIER BAUEN';

  if (G.board[idx]) {
    if (newCard.special_mechanic === 'decoy') {
      overlayClass += ' decoy-ol';
      overlayText   = '🎭 ABLENKEN';
      setHint('Nochmal tippen zum Ablenken', true);
    } else if (canUpgrade(idx, newCard)) {
      overlayClass += ' upgrade-ol';
      overlayText   = '⬆ UPGRADE';
      setHint('Nochmal tippen zum Upgraden', true);
    } else {
      overlayClass += ' replace-ol';
      overlayText   = '⚒ ERSETZEN';
      setHint('Nochmal tippen zum Ersetzen', true);
    }
  } else {
    setHint('Nochmal tippen zum Bauen', true);
  }

  renderGrid(true);

  // Overlay auf der Zelle
  const cells = document.querySelectorAll('.cell');
  const cell  = cells[idx];
  if (cell) {
    document.querySelectorAll('.cell-build-overlay').forEach(e => e.remove());
    const ov = document.createElement('div');
    ov.className = overlayClass;
    ov.innerHTML = `<span>${overlayText}</span>`;
    ov.addEventListener('click', (e) => { e.stopPropagation(); placeCard(); });
    ov.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); placeCard(); }, {passive:false});
    cell.appendChild(ov);
  }
}

function onGapClick(key, a, b) {
  if (!G.selectedBarrier) return;
  G.selectedBarrierKey = key;
  document.querySelectorAll('.gap-zone').forEach(z => z.classList.remove('target'));
  placeBarrier(key, a, b);
}

function placeCard() {
  if (G.selectedHandIdx < 0 || G.selectedCellIdx < 0) return;
  const newCard = G.hand[G.selectedHandIdx];
  if (!newCard) return;

  const targetIdx = G.selectedCellIdx;
  const existing  = G.board[targetIdx];

  // Fragile-Konflikt-Schutz: nur eine Karte pro Mechanik
  if (newCard.fragile && newCard.special_mechanic) {
    const conflictIdx = findFragileConflict(newCard, targetIdx);
    if (conflictIdx >= 0) {
      showToast(fragileConflictMessage(newCard.special_mechanic));
      clearSelection();
      renderGrid();
      return;
    }
  }

  G.hand[G.selectedHandIdx] = null;
  clearSelection();

  if (!existing) {
    // ── Leeres Feld: normal bauen ──
    G.board[targetIdx]  = { ...newCard };
    G.stacks[targetIdx] = [{ ...newCard }];
    G.score += calcCardPts(newCard);
    _animatePlace(targetIdx, 'build'); SFX.build();

  } else if (newCard.special_mechanic === 'decoy') {
    // ── Decoy: oben drauf legen, darunter liegende Karte(n) bleiben ──
    const oldPts = calcCardPts(G.board[targetIdx]);
    const baseStack = G.stacks[targetIdx] || [existing];
    G.stacks[targetIdx] = [...baseStack, { ...newCard }];
    G.board[targetIdx]  = { ...newCard };
    // Befestigung wird beim Drauflegen aufgehoben — sonst wäre
    // ein befestigtes+verdecktes Gebäude praktisch unzerstörbar
    G.fortified[targetIdx] = false;
    G.boosted[targetIdx]   = false;
    // Score: alte Karte raus, Decoy rein (niedrige Punkte)
    G.score = G.score - oldPts + calcCardPts(newCard);

    _animatePlace(targetIdx, 'build'); SFX.build();
    showToast('🎭 Ablenkungsmanöver — schützt die Karte darunter');

  } else if (canUpgrade(targetIdx, newCard)) {
    // ── Upgrade: gleiche Ressource, max 3 Karten ──
    const oldPts = calcCardPts(G.board[targetIdx]);
    G.board[targetIdx]  = { ...newCard };
    G.stacks[targetIdx] = [...(G.stacks[targetIdx] || [existing]), { ...newCard }];
    G.score = G.score - oldPts + calcCardPts(newCard);

    // Score-Differenz anzeigen
    const diff = calcCardPts(newCard) - oldPts;
    if (diff !== 0) spawnColoredFloat(targetIdx, `${diff >= 0 ? '+' : ''}${diff}`,
      diff >= 0 ? 'var(--ink)' : '#c04040');

    _animatePlace(targetIdx, 'upgrade'); SFX.upgrade();
    showToast(`Upgrade · Ressource ×${G.stacks[targetIdx].length}`);

  } else {
    // ── Ersetzen/Abriss: alte Karte weg, neue rein ──
    const oldPts = calcCardPts(G.board[targetIdx]);
    G.board[targetIdx]  = { ...newCard };
    G.stacks[targetIdx] = [{ ...newCard }];
    G.fortified[targetIdx] = false;
    G.boosted[targetIdx]   = false;
    G.score = G.score - oldPts + calcCardPts(newCard);

    _animatePlace(targetIdx, 'replace'); SFX.discard();
    showToast('Gebäude abgerissen und neu gebaut');
  }

  renderHand();
  renderGrid();
  updateRathausScore();
  renderProductionPanel();

  // Baulimit: max 5 Karten pro Jahreszeit
  G.builtThisSeason++;

  // ── Sonder-Mechaniken ────────────────────────────────────────
  const mech = newCard.special_mechanic;
  if (mech) {
    switch(mech) {
      case 'free_build':
        // Kostenlos — Baulimit nicht erhöhen
        G.builtThisSeason--;
        showToast('Freie Stadt — zählt nicht zum Baulimit!');
        break;
      case 'minus2_attackers':
        // Bogenwacht: −2 Angreifer wird beim Überfall angewendet (via G.bogenwacht)
        G.bogenwacht = (G.bogenwacht || 0) + 1;
        showToast('Bogenwacht — −2 Angreifer beim nächsten Überfall');
        break;
      case 'neighbor_defense':
        // Schildwall: Nachbarfelder +1 Verteidigung (gespeichert in G.schildwall)
        G.schildwall = G.schildwall || new Set();
        G.schildwall.add(targetIdx);
        showToast('Schildwall — Nachbarn erhalten +1 Verteidigung');
        renderGrid();
        break;
      case 'indestructible':
        // Ewige Bastion: automatisch mit Turm befestigen
        G.fortified[targetIdx] = true;
        showToast('Ewige Bastion — kann nie deaktiviert werden!');
        renderGrid();
        break;
      case 'reveal_red':
        if (G.diceConcealed && G.diceConcealed.has('red')) {
          G.diceConcealed.delete('red');
          renderDice(false);
          renderAttackOrigin();
          showToast('Spion des Rates — Champion aufgedeckt!');
        } else {
          showToast('Spion des Rates — Champion war bereits bekannt');
        }
        break;
      case 'reveal_yellow':
        if (G.diceConcealed && G.diceConcealed.has('yellow')) {
          G.diceConcealed.delete('yellow');
          renderDice(false);
          renderAttackOrigin();
          showToast('Fernkundschafter — Angriffsrichtung aufgedeckt!');
        } else {
          showToast('Fernkundschafter — Richtung war bereits bekannt');
        }
        break;
      case 'reveal_blue':
        if (G.diceConcealed && G.diceConcealed.has('blue')) {
          G.diceConcealed.delete('blue');
          renderDice(false);
          showToast('Zahlmeister — Angreiferzahl aufgedeckt!');
        } else {
          showToast('Zahlmeister — Angreifer war bereits bekannt');
        }
        break;
      case 'direct_knight':
        G.knights = (G.knights || 0) + 2;
        renderDefenseChips();
        showToast('Ritterburg — +2 Ritter sofort!');
        break;
      case 'direct_barrier':
        G.barrierHand = (G.barrierHand || 0) + 2;
        renderDefenseChips();
        showToast('Holzfestung — +2 Barrieren sofort!');
        break;
      case 'direct_coins':
        G.coins = (G.coins || 0) + 2;
        renderDefenseChips();
        SFX.coin && SFX.coin();
        showToast('Münzprägung — +2 Münzen sofort!');
        break;
      case 'direct_coins_seasonal': {
        const earned = G.season + 1; // Winter=1, Frühling=2, Sommer=3, Herbst=4
        G.coins = (G.coins || 0) + earned;
        renderDefenseChips();
        SFX.coin && SFX.coin();
        showToast(`Bankhaus — +${earned} Münzen (Jahreszeit ${earned})!`);
        break;
      }
      case 'force_start':
        // Stadttor: Startfeld wird auf diese Position erzwungen
        if (G.attackDir) {
          G.attackDir = { ...G.attackDir, startCell: targetIdx, direction: GRID_DIRECTION[targetIdx] };
          renderDice(false);
          renderAttackOrigin();
        }
        showToast('🏰 Stadttor — Überfall startet hier!');
        break;
      case 'force_dir_cw':
        // Windrose ↻: Laufrichtung erzwingen
        if (G.attackDir) {
          G.attackDir = { ...G.attackDir, clockwise: true };
          renderDice(false);
        }
        showToast('🧭 Windrose — Überfall läuft ↻');
        break;
      case 'force_dir_ccw':
        // Windrose ↺: Laufrichtung erzwingen
        if (G.attackDir) {
          G.attackDir = { ...G.attackDir, clockwise: false };
          renderDice(false);
        }
        showToast('🧭 Windrose — Überfall läuft ↺');
        break;
    }
  }

  if (G.builtThisSeason >= 5) {
    // Baulimit erreicht — Drafting beenden
    DRAFT.active = false;
    G.hand = [];
    renderHand();
    setHint('5 Gebäude errichtet — Bauphase beendet · › für Rüsten', true);
  } else if (DRAFT.active) {
    // Drafting: Bots ziehen, Hände rotieren
    advanceDraft(G.selectedHandIdx);
  }
}

function _animatePlace(idx, type) {
  setTimeout(() => {
    const cells = document.querySelectorAll('.cell');
    const cell  = cells[idx];
    if (!cell) return;
    cell.classList.add('just-placed');
    cell.addEventListener('animationend', () => cell.classList.remove('just-placed'), {once:true});
    spawnBurst(cell);
    if (type !== 'build' && calcCardPts(G.board[idx]) > 0) {
      spawnColoredFloat(idx, `+${formatPts(G.board[idx].pts)}`, 'var(--ink)');
    } else if (type === 'build' && calcCardPts(G.board[idx]) > 0) {
      spawnFloat(idx, `+${formatPts(G.board[idx].pts)}`);
    }
  }, 0);
}

function flashChip(key) {
  setTimeout(() => {
    const pair = document.querySelector(`[data-def-key="${key}"], [data-raw-key="${key}"]`);
    if (pair) {
      pair.classList.remove('converting');
      void pair.offsetWidth;
      pair.classList.add('converting');
      pair.addEventListener('animationend', () => pair.classList.remove('converting'), {once:true});
      const defCount = pair.querySelector('.def-count');
      if (defCount) {
        defCount.classList.remove('pop');
        void defCount.offsetWidth;
        defCount.classList.add('pop');
        defCount.addEventListener('animationend', () => defCount.classList.remove('pop'), {once:true});
      }
    }
  }, 40);
}

function placeTower(idx) {
  if (G.coins < 3 || !G.board[idx] || G.fortified[idx]) return;
  G.coins -= 3;
  G.fortified[idx] = true;
  G.fortifiedNew.add(idx);
  clearSelection();
  renderHand();
  renderGrid();
  renderResources();
  flashChip('tower');
  const cells = document.querySelectorAll('.cell');
  if (cells[idx]) spawnColorBurst(cells[idx], '#7a40c0'); SFX.tower();
  setHint(G.coins >= RATIO ? `Tippe ein Gebäude zum Befestigen (−${RATIO} Münzen)` : 'Nicht genug Münzen für weiteren Turm', G.coins >= RATIO);
  showToast(`Gebäude befestigt · noch ${G.coins} Münzen`);
  // Modus beenden wenn keine Münzen mehr
  if (G.coins < 3) { clearSelection(); G.mode = 'card'; renderGrid(); }
}

function placeKnight(idx) {
  if (G.knights <= 0 || !G.board[idx]) return;
  G.boosted[idx] = (G.boosted[idx] || 0) + 1;
  G.knights--;
  clearSelection();
  renderHand();
  renderGrid();
  flashChip('knights');
  const cells = document.querySelectorAll('.cell');
  if (cells[idx]) spawnColorBurst(cells[idx], '#44ee44'); SFX.knight();
  setHint('Wähle eine Karte aus deiner Hand');
  showToast('Verteidigung erhöht');
}

function placeBarrier(key, a, b) {
  G.barriers.add(key);
  G.barrierHand--;

  renderGapZones(false);
  clearSelection();
  renderHand();
  renderGrid();

  // Settle-Animation auf der neuen Barriere
  setTimeout(() => {
    const newBarriers = document.querySelectorAll('.barrier-el');
    newBarriers.forEach(b => {
      // Finde die passende anhand der Position — einfachste Methode: letztes Element
    });
    // Alle barrier-el nach dem letzten renderBarriers nochmal kurz animieren
    const allB = document.querySelectorAll('.barrier-el');
    if (allB.length > 0) {
      const last = allB[allB.length - 1];
      last.classList.add('just-placed');
      setTimeout(() => last.classList.remove('just-placed'), 500);
    }
  }, 30);

  setHint('Wähle eine Karte aus deiner Hand');
  showToast('🪵 Barriere errichtet!');
}

// ── Farbiger Burst — für Turm (violett) und Ritter (grün) ────────
function spawnColorBurst(cell, color) {
  const cr = cell.getBoundingClientRect();
  const ar = document.getElementById('app').getBoundingClientRect();
  const cx = cr.left - ar.left + cr.width / 2;
  const cy = cr.top  - ar.top  + cr.height / 2;

  const burst = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  burst.style.cssText = `
    position:absolute; pointer-events:none; z-index:200;
    width:${cr.width*2.4}px; height:${cr.width*2.4}px;
    left:${cx - cr.width*1.2}px; top:${cy - cr.width*1.2}px;
    overflow:visible;
  `;
  const vb = cr.width * 1.2;
  burst.setAttribute('viewBox', `${-vb} ${-vb} ${vb*2} ${vb*2}`);

  // Ring + 6 Strahlen in der gewählten Farbe
  let inner = `<circle cx="0" cy="0" r="${vb*0.18}" fill="none"
    stroke="${color}" stroke-width="${vb*0.04}" opacity="0.7">
    <animate attributeName="r" from="${vb*0.05}" to="${vb*0.75}" dur="0.45s" fill="freeze"/>
    <animate attributeName="opacity" from="0.7" to="0" dur="0.45s" fill="freeze"/>
    <animate attributeName="stroke-width" from="${vb*0.06}" to="${vb*0.01}" dur="0.45s" fill="freeze"/>
  </circle>`;

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x2 = Math.cos(a)*vb*0.65, y2 = Math.sin(a)*vb*0.65;
    inner += `<line x1="${(Math.cos(a)*vb*0.12).toFixed(1)}" y1="${(Math.sin(a)*vb*0.12).toFixed(1)}"
      x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
      stroke="${color}" stroke-width="${(vb*0.025).toFixed(1)}" stroke-linecap="round" opacity="0.8">
      <animate attributeName="opacity" from="0.8" to="0" dur="0.4s" fill="freeze"/>
    </line>`;
  }
  burst.innerHTML = inner;
  document.getElementById('app').appendChild(burst);
  setTimeout(() => burst.remove(), 480);
}

// ── Stadt lebt — nach der Bauphase ───────────────────────────────
// Gebäude mit Schornstein: Rauch aufsteigen lassen
const SMOKY_BUILDINGS = ['woodcutter', 'smithy', 'farmhouse', 'tavern', 'mill', 'granary'];

function animateCityAlive() {
  const cells = document.querySelectorAll('.cell.placed');
  const appEl = document.getElementById('app');
  const appR  = appEl.getBoundingClientRect();

  // 1. Goldener Glow — gestaffelt über alle Gebäude (außer Rathaus)
  cells.forEach((cell, i) => {
    if (cell.classList.contains('rathaus')) return;
    setTimeout(() => {
      cell.classList.remove('city-glow');
      void cell.offsetWidth;
      cell.classList.add('city-glow');
      cell.addEventListener('animationend', () =>
        cell.classList.remove('city-glow'), {once:true});
    }, i * 120);
  });

  // 2. Rauch — nach dem Glow, nur bei Gebäuden die einen Schornstein haben
  setTimeout(() => {
    cells.forEach((cell, i) => {
      const idx  = parseInt(cell.dataset.idx);
      const card = G.board[idx];
      if (!card || G.plundered[idx]) return;
      if (!SMOKY_BUILDINGS.includes(card.id)) return;

      const cr = cell.getBoundingClientRect();

      // 2–3 Rauchpuffs pro Gebäude, versetzt
      const puffCount = 2 + Math.floor(Math.random() * 2);
      for (let p = 0; p < puffCount; p++) {
        setTimeout(() => {
          const puff = document.createElement('div');
          puff.className = 'smoke-puff';
          const size = 6 + Math.random() * 6;
          const xOff = (Math.random() - 0.5) * 20;
          // Rauch kommt aus dem oberen Drittel der Karte
          const startX = cr.left - appR.left + cr.width  * 0.45 + xOff;
          const startY = cr.top  - appR.top  + cr.height * 0.22;
          puff.style.cssText = `
            width:${size}px; height:${size}px;
            left:${startX}px; top:${startY}px;
            --dur:${1.4 + Math.random() * 0.8}s;
            filter: blur(${1 + Math.random()}px);
          `;
          appEl.appendChild(puff);
          puff.addEventListener('animationend', () => puff.remove());
        }, p * 220 + Math.random() * 150);
      }
    });
  }, cells.length * 120 + 200); // startet wenn Glow-Welle fertig
}

// ── Burst-Effekt beim Platzieren ─────────
function spawnBurst(cell) {
  const cr = cell.getBoundingClientRect();
  const ar = document.getElementById('app').getBoundingClientRect();
  const cx = cr.left - ar.left + cr.width / 2;
  const cy = cr.top  - ar.top  + cr.height / 2;

  // SVG direkt im App-Container — nicht in der Karte
  const burst = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  burst.style.cssText = `
    position:absolute; pointer-events:none; z-index:200;
    width:${cr.width*2.4}px; height:${cr.width*2.4}px;
    left:${cx - cr.width*1.2}px; top:${cy - cr.width*1.2}px;
    overflow:visible;
  `;
  const vb = cr.width*1.2;
  burst.setAttribute('viewBox', `${-vb} ${-vb} ${vb*2} ${vb*2}`);

  // 8 Strahlen + expandierender Ring
  let inner = `<circle cx="0" cy="0" r="${vb*0.18}" fill="none"
    stroke="rgba(18,14,10,0.18)" stroke-width="${vb*0.04}">
    <animate attributeName="r" from="${vb*0.05}" to="${vb*0.85}"
      dur="0.5s" fill="freeze"/>
    <animate attributeName="opacity" from="0.5" to="0"
      dur="0.5s" fill="freeze"/>
    <animate attributeName="stroke-width" from="${vb*0.06}" to="${vb*0.01}"
      dur="0.5s" fill="freeze"/>
  </circle>`;

  for (let i=0;i<8;i++) {
    const a = (i/8)*Math.PI*2;
    const x1=Math.cos(a)*vb*0.12, y1=Math.sin(a)*vb*0.12;
    const x2=Math.cos(a)*vb*0.72, y2=Math.sin(a)*vb*0.72;
    inner += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}"
      x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
      stroke="rgba(18,14,10,0.35)" stroke-width="${(vb*0.025).toFixed(1)}"
      stroke-linecap="round">
      <animate attributeName="opacity" from="0.8" to="0" dur="0.45s" fill="freeze"/>
      <animate attributeName="x2" from="${(Math.cos(a)*vb*0.22).toFixed(1)}"
        to="${x2.toFixed(1)}" dur="0.3s" fill="freeze"/>
      <animate attributeName="y2" from="${(Math.sin(a)*vb*0.22).toFixed(1)}"
        to="${y2.toFixed(1)}" dur="0.3s" fill="freeze"/>
    </line>`;
  }
  burst.innerHTML = inner;
  document.getElementById('app').appendChild(burst);
  setTimeout(() => burst.remove(), 520);
}

// ── Score Float ──────────────────────────
function spawnFloat(cellIdx, text) {
  const cells = document.querySelectorAll('.cell');
  const cell = cells[cellIdx];
  if (!cell) return;
  const cr = cell.getBoundingClientRect();
  const ar = document.getElementById('app').getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'score-float';
  el.textContent = text;
  el.style.left = (cr.left - ar.left + cr.width/2 - 16) + 'px';
  el.style.top  = (cr.top  - ar.top  + cr.height/2 - 10) + 'px';
  document.getElementById('app').appendChild(el);
  el.addEventListener('animationend', ()=>el.remove());
}

function setHint(msg, active=false) {
  const el=document.getElementById('hint');
  el.textContent=msg; el.className=active?'active':'';
}
let _tt;
function showToast(msg) {
  const el=document.getElementById('toast');
  el.innerHTML=msg; el.classList.add('show');
  clearTimeout(_tt); _tt=setTimeout(()=>el.classList.remove('show'),2200);
}

// ═══════════════════════════════════════════
//  BEFESTIGUNG — kleiner Schachturm (ISO)
//  Niedrig, kompakt, klar erkennbar als Turm
// ═══════════════════════════════════════════
function makeFortifyStone() {
  const w = 40, h = 40;
  const cx = w/2, cy = h/2;
  const r = 17; // Chip-Radius

  // Schachturm-Silhouette, klein, weiß, zentriert auf dem Chip
  const tx = cx, ty = cy + 1; // Turm-Zentrum leicht nach unten
  const tw = 12, th = 14;     // Turm-Gesamtbreite/-höhe

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"
    viewBox="0 0 ${w} ${h}" overflow="visible"
    style="filter:drop-shadow(0 2px 4px rgba(18,14,10,0.35)) drop-shadow(0 1px 1px rgba(18,14,10,0.2))">

    <!-- Chip-Schatten -->
    <ellipse cx="${cx}" cy="${cy+2}" rx="${r}" ry="${r*0.3}"
             fill="rgba(18,14,10,0.2)"/>

    <!-- Chip-Körper — steingrau mit violettem Rand -->
    <circle cx="${cx}" cy="${cy}" r="${r}"
            fill="#3a3530" stroke="#5a2d82" stroke-width="1.8"/>
    <!-- Innerer Glanzring -->
    <circle cx="${cx}" cy="${cy}" r="${r-2.5}"
            fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
    <!-- Lichtreflex oben links -->
    <ellipse cx="${cx-4}" cy="${cy-6}" rx="5" ry="3"
             fill="rgba(255,255,255,0.1)" transform="rotate(-20,${cx},${cy})"/>

    <!-- Schachturm-Icon, weiß -->
    <!-- Sockel -->
    <rect x="${tx-tw/2}" y="${ty+th/2-2}" width="${tw}" height="3"
          rx="0.8" fill="rgba(255,255,255,0.9)"/>
    <!-- Körper -->
    <rect x="${tx-tw/2+1.5}" y="${ty-th/2+4}" width="${tw-3}" height="${th/2+1}"
          rx="0.5" fill="rgba(255,255,255,0.9)"/>
    <!-- Krone-Band -->
    <rect x="${tx-tw/2}" y="${ty-th/2+1}" width="${tw}" height="4"
          rx="0.5" fill="rgba(255,255,255,0.9)"/>
    <!-- Zinnen: 3 Zähne -->
    <rect x="${tx-tw/2}"        y="${ty-th/2-3}" width="3" height="4.5" rx="0.4" fill="rgba(255,255,255,0.9)"/>
    <rect x="${tx-1.5}"         y="${ty-th/2-3}" width="3" height="4.5" rx="0.4" fill="rgba(255,255,255,0.9)"/>
    <rect x="${tx+tw/2-3}"      y="${ty-th/2-3}" width="3" height="4.5" rx="0.4" fill="rgba(255,255,255,0.9)"/>
    <!-- Violetter Akzent-Streifen im Körper -->
    <rect x="${tx-tw/2+2}" y="${ty-1}" width="${tw-4}" height="1.5"
          rx="0.3" fill="rgba(140,80,220,0.6)"/>
  </svg>`;
}

// ═══════════════════════════════════════════
//  BARRIEREN — Holzpalisade zwischen Karten
// ═══════════════════════════════════════════

// Alle möglichen Nachbar-Paare im 3×3 Grid
// horizontal: 0-1,1-2, 3-4,4-5, 6-7,7-8
// vertikal:   0-3,1-4,2-5, 3-6,4-7,5-8
const BARRIER_KEY = (a, b) => `${Math.min(a,b)}-${Math.max(a,b)}`;

// ── Angriffsursprung-Markierung ──────────────────────────────────
function renderAttackOrigin() {
  // Alte Markierungen entfernen
  document.querySelectorAll('.cell.attack-origin').forEach(c => c.classList.remove('attack-origin'));

  if (!G.diceRolled || !G.attackDir) return;
  if (G.diceConcealed instanceof Set && G.diceConcealed.has('yellow')) return;

  const { startCell } = G.attackDir;
  const cells = document.querySelectorAll('.cell');
  if (cells[startCell]) cells[startCell].classList.add('attack-origin');
}

function renderBarriers() {
  // Alle alten Barriere-Elemente entfernen
  document.querySelectorAll('.barrier-el').forEach(e => e.remove());
  if (G.barriers.size === 0) return;

  const gridEl = document.getElementById('grid');
  const cells  = gridEl.querySelectorAll('.cell');
  const gridR  = gridEl.getBoundingClientRect();
  const appR   = document.getElementById('app').getBoundingClientRect();

  G.barriers.forEach(key => {
    const [a, b] = key.split('-').map(Number);
    const cellA = cells[a], cellB = cells[b];
    if (!cellA || !cellB) return;

    const rA = cellA.getBoundingClientRect();
    const rB = cellB.getBoundingClientRect();

    // Spalt-Mitte zwischen den beiden Karten
    const cx = ((rA.left + rA.right)/2 + (rB.left + rB.right)/2) / 2 - appR.left;
    const cy = ((rA.top  + rA.bottom)/2 + (rB.top  + rB.bottom)/2) / 2 - appR.top;

    // Horizontal oder vertikal?
    const isH = Math.abs(a - b) === 1; // horizontaler Nachbar

    const el = document.createElement('div');
    el.className = 'barrier-el';
    el.style.cssText = `position:absolute; pointer-events:none; z-index:49;
      left:${cx}px; top:${cy}px; transform:translate(-50%,-50%);`;
    el.innerHTML = makeBarrierSVG(isH);
    document.getElementById('app').appendChild(el);
  });
}

function makeBarrierSVG(isHorizontal) {
  if (isHorizontal) {
    // Horizontal-Nachbarn (links/rechts) → Barriere von OBEN sehen
    // Wirkt wie ein Brett das flach zwischen den Karten liegt
    const w = 14, h = 56;
    const bw = 10, bh = 48; // Brett-Breite und -Länge
    const x = (w-bw)/2, y = (h-bh)/2;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"
      viewBox="0 0 ${w} ${h}" overflow="visible"
      style="filter:drop-shadow(1px 2px 2px rgba(18,14,10,0.35)) drop-shadow(0 1px 1px rgba(18,14,10,0.2))">
      <!-- Draufsicht: flaches Brett -->
      <!-- Oberfläche -->
      <rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="1.5"
            fill="#c4955a" stroke="#7a5020" stroke-width="0.7"/>
      <!-- Holzmaserung (Längslinien) -->
      <line x1="${x+bw*0.3}" y1="${y+2}" x2="${x+bw*0.28}" y2="${y+bh-2}"
            stroke="#9a7040" stroke-width="0.5" opacity="0.6"/>
      <line x1="${x+bw*0.6}" y1="${y+2}" x2="${x+bw*0.62}" y2="${y+bh-2}"
            stroke="#9a7040" stroke-width="0.4" opacity="0.5"/>
      <!-- Linke Kante (Materialstärke) -->
      <rect x="${x-1.5}" y="${y+1}" width="2" height="${bh-2}" rx="0.5"
            fill="#7a5020" opacity="0.7"/>
      <!-- Glanzlinie oben -->
      <line x1="${x+1}" y1="${y+1}" x2="${x+bw-1}" y2="${y+1}"
            stroke="rgba(255,255,255,0.3)" stroke-width="0.8"/>
    </svg>`;
  } else {
    // Vertikal-Nachbarn (oben/unten) → Barriere von der SEITE sehen
    // Wirkt wie ein stehendes Brett das zwischen den Karten steckt
    const w = 56, h = 16;
    const bw = 48, bh = 11;
    const x = (w-bw)/2, y = (h-bh)/2;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"
      viewBox="0 0 ${w} ${h}" overflow="visible"
      style="filter:drop-shadow(0 2px 2px rgba(18,14,10,0.35)) drop-shadow(0 1px 1px rgba(18,14,10,0.2))">
      <!-- Seitenansicht: stehendes Brett -->
      <!-- Vorderfläche -->
      <rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="1"
            fill="#c4955a" stroke="#7a5020" stroke-width="0.7"/>
      <!-- Holzmaserung (waagerecht) -->
      <line x1="${x+2}" y1="${y+bh*0.35}" x2="${x+bw-2}" y2="${y+bh*0.32}"
            stroke="#9a7040" stroke-width="0.5" opacity="0.55"/>
      <line x1="${x+2}" y1="${y+bh*0.65}" x2="${x+bw-2}" y2="${y+bh*0.68}"
            stroke="#9a7040" stroke-width="0.4" opacity="0.45"/>
      <!-- Oberkante (Materialstärke) -->
      <rect x="${x+1}" y="${y-1.5}" width="${bw-2}" height="2" rx="0.5"
            fill="#e8b870" opacity="0.8"/>
      <!-- Glanzlinie -->
      <line x1="${x+1}" y1="${y+1}" x2="${x+bw-1}" y2="${y+1}"
            stroke="rgba(255,255,255,0.28)" stroke-width="0.7"/>
    </svg>`;
  }
}

// ═══════════════════════════════════════════
//  DEMO: Testbuttons zum Ausprobieren
// ═══════════════════════════════════════════
function addDemoControls() {
  // Demo-Controls nicht mehr nötig — Turm und Barriere sind in der Hand
}

function demoStyle() {
  return `background:transparent; border:1px solid rgba(18,14,10,0.18);
    border-radius:3px; padding:5px 10px; font-family:'Cinzel',serif;
    font-size:0.62rem; letter-spacing:0.08em; cursor:pointer; color:rgba(18,14,10,0.55);
    transition:background 0.15s;`;
}

// ═══════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════
function dealHand() {
  // Demo: nutzt buildDraftHand für die aktuelle Jahreszeit
  // Beim echten Drafting: buildDraftHand(G.season) aus dem SEASON_CARD_POOL ziehen
  G.hand = buildDraftHand(G.season);
}
buildSeasonPools();
initDrawBags();
dealHand(); renderGrid(); renderHand(); addDemoControls(); renderPhaseBar(); renderVP(); renderPlaceRow(); renderProductionPanel();
setHint(PHASE_DESCRIPTIONS[G.phase], false);

// Version anzeigen
const splashVersion = document.getElementById('splash-version');
const headerTitle   = document.getElementById('header-title');
if (splashVersion) splashVersion.textContent = `v${VERSION}`;
if (headerTitle)   headerTitle.textContent   = `Murmeltal v${VERSION}`;

// ── Rules Screen ────────────────────────────────────────────────
const rulesEl   = document.getElementById('rules-screen');
let rulesPage   = 0;

function renderRulesPage(idx) {
  const page = RULES_PAGES[idx];
  const pips = document.getElementById('rules-progress');
  pips.innerHTML = RULES_PAGES.map((_,i) =>
    `<div class="rules-pip${i === idx ? ' active' : ''}"></div>`
  ).join('');
  document.getElementById('rules-icon').textContent  = page.icon;
  document.getElementById('rules-title').textContent = page.title;
  document.getElementById('rules-body').innerHTML = page.sections.map(s => `
    <div>
      <div class="rules-section-heading">${s.heading}</div>
      <div class="rules-section-text">${s.text}</div>
    </div>
  `).join('');
  const back = document.getElementById('rules-back');
  const next = document.getElementById('rules-next');
  back.classList.toggle('ghost', idx === 0);
  const isLast = idx === RULES_PAGES.length - 1;
  next.textContent = isLast ? 'Los geht\'s ✦' : 'Weiter →';
  next.classList.toggle('primary', isLast);
}

function showRules() {
  rulesPage = 0;
  renderRulesPage(0);
  rulesEl.classList.add('active');
}

function dismissRules() {
  rulesEl.classList.remove('active');
  startSeasonParticles(G.season);
}

document.getElementById('rules-back').addEventListener('click', () => {
  if (rulesPage > 0) { rulesPage--; renderRulesPage(rulesPage); }
});
document.getElementById('rules-next').addEventListener('click', () => {
  if (rulesPage < RULES_PAGES.length - 1) {
    rulesPage++;
    renderRulesPage(rulesPage);
  } else {
    dismissRules();
  }
});

// ── Splash Screen ────────────────────────────────────────────────
const splashEl       = document.getElementById('splash-screen');
const splashStartBtn = document.getElementById('splash-start');

function dismissSplash() {
  splashEl.remove();
  showRules();
}
splashStartBtn.addEventListener('click', dismissSplash);
splashStartBtn.addEventListener('touchend', (e) => { e.preventDefault(); dismissSplash(); }, {passive:false});
