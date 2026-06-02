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
  handIdx:    0,    // welche der 3 Original-Hände gerade beim Spieler liegt (0/1/2)
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
  DRAFT.direction = season % 2 === 0 ? 1 : -1;
  DRAFT.active    = true;
  DRAFT.handIdx   = 0;

  // Spieler bekommt Hand 0
  G.hand = [...DRAFT.hands[0]];
  setHint(`Drafting — Runde 1/5 · Wähle eine Karte zum Behalten`, true);
  setHandColor(0);
  renderHand();
}

/**
 * Wird aufgerufen nachdem der Spieler eine Karte gewählt hat (placeCard).
 * Bots wählen zufällig, dann rotieren die Hände.
 */
function advanceDraft() {
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
      setHandColor(-1);
      renderHand();
      setHint('Karten gedraftet — tippe › für Rüsten', true);
      return;
    }

    // Rotieren
    const [h0, h1, h2] = DRAFT.hands;
    DRAFT.hands = DRAFT.direction === 1 ? [h2, h0, h1] : [h1, h2, h0];
    DRAFT.handIdx = (DRAFT.handIdx + (DRAFT.direction === 1 ? 2 : 1)) % 3;
    G.hand = [...DRAFT.hands[0]];

    // Slide-In
    el.style.setProperty('--slide-from', `${inDir}px`);
    setHandColor(DRAFT.handIdx);
    renderHand();
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
const VERSION = '0.9.63';

// ── Außenkanten-System für Barrieren ──────────────────────────────
// 12 Außenkanten am 3×3-Grid: jedes Randfeld hat 1 (Kante) oder 2 (Ecke) Außenkanten.
// Schlüssel-Format: "${cellIdx}-${edge}" mit edge ∈ {N,O,S,W}
//   Eckfelder (0,2,6,8): 2 Kanten
//   Kantenfelder (1,3,5,7): 1 Kante
//   Mitte (4 = Rathaus): keine Außenkanten
const CELL_OUTER_EDGES = {
  0: ['N','W'],
  1: ['N'],
  2: ['N','O'],
  3: ['W'],
  4: [],
  5: ['O'],
  6: ['S','W'],
  7: ['S'],
  8: ['S','O'],
};
const EDGE_KEY = (idx, edge) => `${idx}-${edge}`;
// Alle 12 Edge-Keys vorberechnet
const ALL_EDGE_KEYS = [];
for (let i = 0; i < 9; i++) {
  for (const e of CELL_OUTER_EDGES[i]) ALL_EDGE_KEYS.push(EDGE_KEY(i, e));
}

// Ist diese Karte barrikadiert (alle Außenkanten geschützt)?
function isBarricaded(idx) {
  const edges = CELL_OUTER_EDGES[idx];
  if (!edges || edges.length === 0) return false; // Rathaus
  if (!G.barriers || G.barriers.size === 0) return false;
  return edges.every(e => G.barriers.has(EDGE_KEY(idx, e)));
}

// ── Überfall-Mechaniken ──────────────────────────────────────────
// Angreifer-Anzahl Formeln (blau)
const ATTACKER_POOL = [
  { id:'A1', label: '7',              calc: ()  => 7 },
  { id:'A2', label: '5 + Max',        calc: ()  => 5 + Math.max(G.dice.yellow, G.dice.blue, G.dice.red) },
  { id:'A3', label: 'Jahr. + 🔵',      calc: ()  => (G.season + 1) + G.dice.blue },
  { id:'A4', label: '6 + ⚡',         calc: ()  => 6 + G.rathausLevel },
  { id:'A5', label: '🔵 + 3',         calc: ()  => G.dice.blue + 3 },
  { id:'A6', label: '4 + ✦',          calc: ()  => 4 + G.board.filter((c,i) => c && i!==4 && c.cat==='special' && !G.plundered[i]).length },
  { id:'A7', label: '🔵 + 🟡', calc: ()  => G.dice.blue + G.dice.yellow },
  { id:'A8', label: '6',              calc: ()  => 6 },
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

// Sucht ab gewürfeltem Startfeld in Laufrichtung das erste nicht-barrikadierte Außenfeld.
// Wenn alle 8 barrikadiert sind: gibt null zurück → Angriff fällt aus.
// Mit ignoreBarriers=true werden Barrikaden ignoriert (Champion-Effekt).
function resolveStartCell(rawStartCell, clockwise, ignoreBarriers = false) {
  if (ignoreBarriers) return rawStartCell;
  const startIdx = CLOCKWISE_ORDER.indexOf(rawStartCell);
  if (startIdx < 0) return rawStartCell;
  for (let i = 0; i < 8; i++) {
    const pos = clockwise ? (startIdx + i) % 8 : (startIdx - i + 8) % 8;
    const cell = CLOCKWISE_ORDER[pos];
    if (!isBarricaded(cell)) return cell;
  }
  return null; // alle barrikadiert
}

function calcAttackDirection() {
  // Richtungskarte aus dem Bag — unabhängig vom gelben Würfel
  const dirCard      = drawFromBag('yellow');
  DRAW_BAGS.yellow.lastIdx = dirCard.gridIdx;
  const rawStartCell = dirCard.gridIdx;
  // Laufrichtung: gelber Würfelwert gerade → ↻, ungerade → ↺
  let clockwise = G.dice.yellow % 2 === 0;

  // Barrikaden-Resolve: erstes nicht-barrikadiertes Außenfeld in Laufrichtung
  // (Champion ignore_barriers wird erst beim Raid berücksichtigt)
  let startCell = resolveStartCell(rawStartCell, clockwise, false);

  // Fragile-Verteidigungskarten (Stadttor sticht Barriere!) — anwenden auf das resolvierte Feld
  ({ startCell, clockwise } = applyFragileDefenses({ startCell, clockwise }));

  const direction = startCell !== null ? GRID_DIRECTION[startCell] : null;
  return { startCell, direction, clockwise, rawStartCell };
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
  { id:'C1',  label: '+🔴 Angreifer',        desc: (v) => `+${v} zusätzliche Angreifer` },
  { id:'C2',  label: 'Gegenrichtung',         desc: ()  => `Angriff startet gegenüber` },
  { id:'C3',  label: 'Richtung umkehren',     desc: ()  => `↻ wird ↺ und umgekehrt` },
  { id:'C4',  label: '🟡🔵 auf 6',            desc: ()  => `Gelb und Blau werden auf 6 gesetzt` },
  { id:'C5',  label: 'Barrieren ignorieren',  desc: ()  => `Barrikaden wirkungslos — Start am gewürfelten Feld` },
  { id:'C6',  label: 'Ohne Anführer',         desc: ()  => `Kein Anführer` },
  { id:'C7',  label: 'Alle verborgen',        desc: ()  => `Alle Überfallkarten bleiben verborgen` },
  { id:'C8',  label: '🟡🔵 auf 1',            desc: ()  => `Gelb und Blau werden auf 1 gesetzt` },
  { id:'C9',  label: 'Brandstifter',          desc: ()  => `Mindestens 1 Karte wird immer deaktiviert` },
  { id:'C10', label: 'Wechselhafter Anführer',desc: ()  => `Gelb und Blau tauschen die Rollen` },
  { id:'C11', label: 'Urlauber',              desc: ()  => `Sommer: −3 · Frühling/Herbst: +6` },
  { id:'C12', label: 'Volksaufstand',         desc: ()  => `Führender Spieler: +1 Gebäude deaktiviert` },
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
    // Alle 8 Richtungskarten außer der zuletzt gespielten (gridIdx)
    const candidates = bag.lastIdx !== null
      ? DIRECTION_POOL.filter(d => d.gridIdx !== bag.lastIdx)
      : [...DIRECTION_POOL];
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
  // Gelber Bag: alle 8 Richtungskarten aus DIRECTION_POOL
  DRAW_BAGS.yellow.lastIdx = null;
  DRAW_BAGS.yellow.used    = [];
  DRAW_BAGS.yellow.pool    = [...DIRECTION_POOL].sort(() => Math.random() - 0.5);
  // Blaue Angreifer-Karten
  DRAW_BAGS.blue.used    = [...ATTACKER_POOL].sort(() => Math.random() - 0.5);
  DRAW_BAGS.blue.pool    = [];
  // Champions
  DRAW_BAGS.champion.used = [...CHAMPION_POOL].sort(() => Math.random() - 0.5);
  DRAW_BAGS.champion.pool = [];
}



function rollDice() {
  // Alle drei Würfel unabhängig 1–6
  G.dice.yellow = Math.ceil(Math.random() * 6);
  G.dice.blue   = Math.ceil(Math.random() * 6);
  G.dice.red    = Math.ceil(Math.random() * 6);
  G.diceRolled  = true;

  // Champion: aus Bag (keine Duplikate)
  G.attackChampion = drawFromBag('champion');
  if (!G.attackChampion) G.attackChampion = CHAMPION_POOL[0];

  // Richtung: Bag-Karte unabhängig; gelber Würfelwert bestimmt Drehrichtung
  G.attackDir = calcAttackDirection();

  // all_hidden: alle drei Würfel verborgen
  if (G.attackChampion.id === 'C7') {
    G.diceConcealed = new Set(['yellow', 'blue', 'red']);
  } else {
    const maxVal = Math.max(...DICE_COLORS.map(c => G.dice[c]));
    G.diceConcealed = new Set(DICE_COLORS.filter(c => G.dice[c] === maxVal));
  }

  // Z21 (Fernkundschafter) / Z22 (Zahlmeister): liegen sie auf dem Brett,
  // wird der entsprechende verborgene Würfel sofort aufgedeckt.
  const boardCards = G.board.filter((c, i) => c && i !== 4 && !G.plundered[i]);
  if (boardCards.some(c => c.special_mechanic === 'reveal_yellow')) {
    G.diceConcealed.delete('yellow');
  }
  if (boardCards.some(c => c.special_mechanic === 'reveal_blue')) {
    G.diceConcealed.delete('blue');
  }

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

// ══════════════════════════════════════════════════════
//  KARTEN-BESCHREIBUNGEN (müssen vor makeCardBack stehen)
// ══════════════════════════════════════════════════════
const CARD_DESC_FALLBACK = {
  decoy:              'Zieht Angreifer auf sich — schützt alle anderen Gebäude.',
  force_start:        'Überfall startet immer an dieser Position.',
  force_dir_cw:       'Überfall läuft immer mit dem Uhrzeigersinn.',
  force_dir_ccw:      'Überfall läuft immer gegen den Uhrzeigersinn.',
  dual_res_nahrung:   'Produziert Holz und Nahrung.',
  dual_res_holz:      'Produziert Nahrung und Holz.',
  dual_res_glas:      'Produziert 2× Glas.',
  schutzpatronin:     'Solange aktiv haben alle fragilen Gebäude Verteidigung 2 und werden nicht zerstört.',
  direct_knight:      'Gibt sofort +2 Ritter beim Bau.',
  direct_barrier:     'Gibt sofort +2 Barrieren beim Bau.',
  direct_coins:       'Gibt sofort +2 Münzen beim Bau.',
  direct_coins_seasonal: 'Gibt Münzen je nach Jahreszeit beim Bau.',
  minus2_attackers:   '−2 Angreifer vor dem Überfall.',
  neighbor_defense:   'Nachbarn erhalten +1 Verteidigung.',
  neighbor_defense_2: 'Nachbarn erhalten +2 Verteidigung.',
  zwillingsturm:      'Verdoppelt die Siegpunkte aller direkt angrenzenden Gebäude.',
  indestructible:     'Kann nie geplündert werden.',
  destroyable:        '15 Punkte — wird bei Deaktivierung zerstört.',
  pts_if_plundered:   '0 Punkte wenn aktiv · 8 Punkte wenn geplündert.',
  season_pts:         'Punkte steigen je Jahreszeit: 0 · 4 · 8 · 12.',
  sonder_count:       'Punkte = Anzahl aktiver Sonderkarten × 2.',
  reveal_yellow:      'Angriffsrichtung ist immer sichtbar, solange die Karte liegt.',
  reveal_blue:        'Angreiferzahl ist immer sichtbar, solange die Karte liegt.',
  reveal_red:         'Champion ist immer sichtbar, solange die Karte liegt.',
  free_build:         'Kostenlos bauen — zählt nicht zum Baulimit.',
};
const CARD_DESC_BY_ID = {
  Z1:  'Punkte = roter Würfel × 3.',
  Z3:  'Punkte = Rathaus-Level × 2.',
  Z4:  'Punkte = Summe aller Verteidigungswerte in der Stadt.',
  Z5:  'Punkte = Anzahl geplünderter Gebäude × 3.',
  Z9:  'Punkte = Glas-Produktion × 3.',
  Z13: 'Punkte = roter Würfel + 7.',
  Z14: 'Punkte = (blauer + gelber Würfel) × 2.',
  Z26: 'Punkte = Anzahl aktiver Rohstoffgebäude × 2.',
  Z33: '48 Punkte — aber nur wenn als einziges Gebäude nicht geplündert.',
};

// ══════════════════════════════════════════════════════
//  KARTEN-RÜCKSEITE
// ══════════════════════════════════════════════════════
function getCardTypeColor(card) {
  if (card.cat === 'special') return '#8a3a9a';
  if (card.fragile)           return '#b07810';
  if (card.res)               return '#5a8a3a';
  return '#3a6a9a';
}

function makeCardBack(card) {
  const col = getCardTypeColor(card);
  const isSpecial = card.cat === 'special';

  // Pts formula in words
  const p = card.pts;
  let formula = '';
  if (p && typeof p === 'object') {
    const diceNames = {yellow:'gelber Würfel',blue:'blauer Würfel',red:'roter Würfel'};
    const resNames  = {holz:'Holz',nahrung:'Nahrung',glas:'Glas'};
    switch(p.type) {
      case 'dice+':      formula = `${p.bonus||0} + ${diceNames[p.color]||p.color} Punkte`; break;
      case 'dice*':      formula = `${p.factor} Punkte pro ${diceNames[p.color]||p.color}`; break;
      case 'res*':       formula = `${p.factor} Punkte pro ${resNames[p.res]||p.res}`; break;
      case 'dice_sum*':  formula = `${p.factor} Punkte pro (blauer + gelber Würfel)`; break;
      case 'deact*':     formula = `${p.factor} Punkte pro geplündertem Gebäude`; break;
      case 'def_sum':    formula = 'Punkte = Summe aller Verteidigungswerte'; break;
      case 'inno*':      formula = `${p.factor} Punkte pro Rathaus-Level`; break;
      case 'sonder_count': formula = `${p.factor} Punkte pro Sonderkarte`; break;
      case 'sole_survivor': formula = `${p.value} Punkte — nur wenn als einziges nicht geplündert`; break;
      case 'season_table': formula = 'Punkte je Jahreszeit: ' + (p.table||[]).join(' / '); break;
    }
  }

  const desc = (card.special_mechanic
    ? CARD_DESC_FALLBACK[card.special_mechanic]
    : CARD_DESC_BY_ID[card.id]) || '';

  // Tags
  const tags = [];
  if (card.res)         tags.push(`<span class="cfb-tag cfb-tag-${card.res}">${card.res}</span>`);
  if (card.fragile)     tags.push(`<span class="cfb-tag cfb-tag-fragile">Einmalig</span>`);
  if (card.upgrade)     tags.push(`<span class="cfb-tag cfb-tag-upgrade">Stapelbar</span>`);
  if (isSpecial)        tags.push(`<span class="cfb-tag cfb-tag-special">Sonder</span>`);

  const ptsStr = typeof card.pts === 'number' ? card.pts : (card.pts?.type ? '~' : '?');

  const shieldSVG = `<svg width="11" height="13" viewBox="0 0 14 16"><path d="M7 1 L13 3.5 L13 8 Q13 13 7 15 Q1 13 1 8 L1 3.5 Z" fill="#6a4a2a" opacity="0.75"/></svg>`;
  const starSVG   = `<svg width="12" height="12" viewBox="0 0 16 16"><polygon points="8,1 10.2,5.8 15.5,6.2 11.5,9.8 12.8,15 8,12.2 3.2,15 4.5,9.8 0.5,6.2 5.8,5.8" fill="${col}" opacity="0.85"/></svg>`;

  let resStat = '';
  if (card.res) {
    const resIcons = {holz:'res-holz.png',nahrung:'res-nahrung.png',glas:'res-glas.png'};
    const resEmoji = {holz:'🪵',nahrung:'🌾',glas:'🫙'};
    resStat = `<div class="cfb-stat">
      <div class="cfb-stat-icon"><img src="${resIcons[card.res]}" onerror="this.style.display='none'" style="max-height:12px;object-fit:contain;"></div>
      <div class="cfb-stat-val" style="font-size:0.7rem;color:#5a8a3a">×1</div>
    </div>`;
  }

  return `<div class="cfb-wrap${isSpecial ? ' is-special' : ''}" style="--card-type-col:${col}">
    <div class="cfb-header">
      <div class="cfb-name">${card.name}</div>
      <div class="cfb-id">${card.id}</div>
    </div>
    <div class="cfb-stats">
      <div class="cfb-stat">
        <div class="cfb-stat-icon">${starSVG}</div>
        <div class="cfb-stat-val" style="color:${col}">${ptsStr}</div>
      </div>
      <div class="cfb-stat">
        <div class="cfb-stat-icon">${shieldSVG}</div>
        <div class="cfb-stat-val">${card.def}</div>
      </div>
      ${resStat}
    </div>
    <div class="cfb-body">
      ${formula ? `<div class="cfb-formula">${formula}</div>` : ''}
      ${desc    ? `<div class="cfb-desc">${desc}</div>` : ''}
      ${tags.length ? `<div class="cfb-tags">${tags.join('')}</div>` : ''}
    </div>
  </div>`;
}

// Wrap a card element in a flip container
function wrapWithFlip(frontHTML, card) {
  return `<div class="card-flip" data-card-id="${card.id}">
    <div class="card-flip-front">${frontHTML}</div>
    <div class="card-flip-back">${makeCardBack(card)}</div>
  </div>`;
}

// Check if element should use display-swap (grid or hand — both have broken preserve-3d)
function isInGrid(el) { return !!el.closest('#grid') || !!el.closest('#hand-cards'); }

// Flip forward (show back side)
function flipCard(flipEl) {
  if (!flipEl || flipEl.dataset.flipped === '1') return;
  flipEl.classList.remove('animating-flip', 'animating-unflip');
  void flipEl.offsetWidth;
  flipEl.classList.add('animating-flip');
  // Swap at halfway point (225ms = half of 450ms)
  setTimeout(() => { flipEl.dataset.flipped = '1'; }, 225);
  setTimeout(() => { flipEl.classList.remove('animating-flip'); }, 450);
}

// Flip back (show front side)
function unflipCard(flipEl) {
  if (!flipEl || flipEl.dataset.flipped !== '1') return;
  flipEl.classList.remove('animating-flip', 'animating-unflip');
  void flipEl.offsetWidth;
  flipEl.classList.add('animating-unflip');
  setTimeout(() => { flipEl.dataset.flipped = '0'; }, 225);
  setTimeout(() => { flipEl.classList.remove('animating-unflip'); }, 450);
}

// Toggle
function toggleCardFlip(flipEl) {
  if (!flipEl) return;
  if (flipEl.dataset.flipped === '1') unflipCard(flipEl);
  else flipCard(flipEl);
}

// Reset all flipped cards in a container
function resetFlips(container) {
  container?.querySelectorAll('.card-flip[data-flipped="1"]').forEach(el => {
    if (el._autoFlipTimer) { clearTimeout(el._autoFlipTimer); el._autoFlipTimer = null; }
    unflipCard(el);
  });
}

// ══════════════════════════════════════════════════════
//  LORE SENTENCE GENERATOR
// ══════════════════════════════════════════════════════
const LORE_INTROS = [
  'Die Raben kreisen über dem Tal —',
  'Nebel zieht durchs Bergland, und man flüstert:',
  'Ein Bote reitet atemlos ins Tor —',
  'Die Wächter auf dem Turm raunt einander zu:',
  'Schlechte Nachrichten erreichen die Stadt —',
  'Ein unheiliges Schweigen liegt über dem Tal —',
];
const LORE_MIDDLES = ['nähern sich dem Tal','rücken heran','bedrohen die Stadt','ziehen auf die Mauern zu','marschieren auf das Tor'];
const LORE_ADJECTIVES = [
  'beutehungrige','gierige','diebische','räuberische','hinterlistige',
  'verschlagene','habgierige','plündernde','dreiste','lauernde',
  'hungrige','durchtriebene','freche','unersättliche','heimtückische',
];
const LORE_CREATURES = [
  'Eichhörnchen','Dachse','Füchse','Marder','Wiesel','Ratten',
  'Krähen','Hamster','Biber','Igel','Frösche','Otter',
  'Hasen','Mäuse','Sperlinge',
];
const LORE_CREATURE_SG = {
  'Eichhörnchen':'Eichhörnchen','Dachse':'Dachs','Füchse':'Fuchs',
  'Marder':'Marder','Wiesel':'Wiesel','Ratten':'Ratte',
  'Krähen':'Krähe','Hamster':'Hamster','Biber':'Biber','Igel':'Igel',
  'Frösche':'Frosch','Otter':'Otter','Hasen':'Hase','Mäuse':'Maus','Sperlinge':'Sperling',
};
const LORE_GROUPS = ['eine Horde','eine Bande','ein Trupp','eine Meute','ein Schwarm','eine Sippe'];

function loreRnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function loreBuildSegments(concealedSet) {
  const isY = concealedSet.has('yellow');
  const isB = concealedSet.has('blue');
  const isR = concealedSet.has('red');

  const dirNames = { NW:'Nordwest', N:'Nord', NO:'Nordost', O:'Ost', SO:'Südost', S:'Süd', SW:'Südwest', W:'West' };
  const fullDir  = G.attackDir ? (dirNames[G.attackDir.direction] || G.attackDir.direction) : '?';
  const cw       = G.attackDir ? G.attackDir.clockwise : true;
  const count    = G.attackBlue ? G.attackBlue.calc() : 0;

  const dirSeg = isY
    ? [{ text: 'aus unbekannter Richtung', cls: 'key-dir', wasConcealed: true }]
    : [
        { text: 'aus dem', cls: '' },
        { text: fullDir, cls: 'key-dir' },
        { text: cw ? ', mit dem Uhrzeigersinn,' : ', gegen den Uhrzeigersinn,', cls: '' },
      ];

  // Zufällige Begriffe einmalig pro Jahreszeit würfeln und speichern
  if (!_aoLorePick) {
    _aoLorePick = {
      adj:      loreRnd(LORE_ADJECTIVES),
      creature: loreRnd(LORE_CREATURES),
      group:    loreRnd(LORE_GROUPS),
      intro:    loreRnd(LORE_INTROS),
      middle:   loreRnd(LORE_MIDDLES),
    };
  }
  const { adj, creature, group, intro, middle } = _aoLorePick;

  const attSeg = isB
    ? [{ text: 'eine unbekannte Anzahl Feinde', cls: 'key-count', wasConcealed: true }]
    : count === 1
      ? [
          { text: 'ein einziger', cls: '' },
          { text: adj.replace(/e$/, 'er'), cls: 'key-count' },
          { text: LORE_CREATURE_SG[creature] || creature, cls: 'key-count' },
        ]
      : [
          { text: group, cls: '' },
          { text: 'von', cls: '' },
          { text: String(count), cls: 'key-count' },
          { text: adj, cls: 'key-count' },
          { text: creature, cls: 'key-count' },
        ];

  let champSeg;
  if (isR) {
    champSeg = [{ text: 'Der Anführer verbirgt sein Gesicht im Schatten.', cls: 'key-champ', wasConcealed: true }];
  } else if (G.attackChampion && G.attackChampion.id === 'C6') {
    champSeg = [{ text: 'Sie reiten ohne Anführer.', cls: '' }];
  } else if (G.attackChampion) {
    champSeg = [
      { text: 'Ihr Anführer trägt das Zeichen:', cls: '' },
      { text: G.attackChampion.label + '.', cls: 'key-champ' },
      { text: G.attackChampion.desc(G.dice.red) + '.', cls: '' },
    ];
  } else {
    champSeg = [];
  }

  return [
    { text: intro, cls: '' },
    ...dirSeg,
    ...attSeg,
    { text: middle + '.', cls: '' },
    ...champSeg,
  ];
}

function loreRender(segments) {
  const el = document.getElementById('ao-lore-text');
  if (!el) return;
  el.innerHTML = segments.map((s, i) => {
    const cls = ['lw', s.cls || '', s.wasConcealed ? 'concealed-word' : ''].filter(Boolean).join(' ');
    return `<span class="${cls}" data-i="${i}">${s.text}</span> `;
  }).join('');
  const div = document.getElementById('ao-lore-divider');
  if (div) div.classList.add('visible');
  // Animate all visible words in sequence
  [...el.querySelectorAll('.lw:not(.concealed-word)')].forEach((span, i) => {
    span.style.opacity = '0';
    setTimeout(() => {
      span.style.opacity = '';
      span.classList.add('animating');
      span.addEventListener('animationend', () => span.classList.remove('animating'), { once: true });
    }, i * 65);
  });
}

function loreReveal() {
  const el = document.getElementById('ao-lore-text');
  if (!el) return;
  const toReveal = [...el.querySelectorAll('.lw.concealed-word')].map(s => parseInt(s.dataset.i));
  if (toReveal.length === 0) return;
  const newSegs = loreBuildSegments(new Set());
  el.innerHTML = newSegs.map((s, i) => {
    const wasCon = toReveal.includes(i);
    const cls = ['lw', s.cls || '', wasCon ? 'concealed-word' : ''].filter(Boolean).join(' ');
    return `<span class="${cls}" data-i="${i}">${s.text}</span> `;
  }).join('');
  toReveal.forEach((idx, order) => {
    setTimeout(() => {
      const span = el.querySelector(`[data-i="${idx}"]`);
      if (!span) return;
      span.classList.remove('concealed-word');
      span.classList.add('animating');
      span.addEventListener('animationend', () => span.classList.remove('animating'), { once: true });
    }, 180 + order * 160);
  });
}

// ══════════════════════════════════════════════════════
//  ATTACK OVERLAY CONTROLLER
// ══════════════════════════════════════════════════════
let _aoPhase = 'idle';
let _aoLorePick = null; // Gespeicherte Zufallsbegriffe für stabile Lore innerhalb einer Jahreszeit

function showAttackOverlay(phase) {
  const overlay = document.getElementById('attack-overlay');
  const label   = document.getElementById('ao-phase-label');
  const btn     = document.getElementById('ao-btn');
  if (!overlay) return;

  label.textContent = phase === 0 ? 'Gerüchte' : 'Überfall';

  if (phase === 0) {
    // Gerüchte: Reset, Spieler würfelt selbst
    _aoPhase = 'rumour';
    ['yellow','blue','red'].forEach(c => {
      const f = document.getElementById(`ao-face-${c}`);
      const col = document.getElementById(`ao-col-${c}`);
      if (f) f.textContent = '—';
      col?.classList.remove('concealed');
      document.getElementById(`ao-cube-${c}`)?.classList.remove('rolling');
    });
    const lore = document.getElementById('ao-lore-text');
    if (lore) lore.innerHTML = '';
    const div = document.getElementById('ao-lore-divider');
    if (div) div.classList.remove('visible');
    btn.textContent = '⚔ Würfeln';
    btn.className = 'ao-btn roll';
    btn.disabled = false;

  } else {
    // Überfall: zeige gespeicherten Zustand aus Gerüchtephase
    _aoPhase = 'reveal';
    aoSyncDiceFaces();
    // Lore-Satz wiederherstellen (gleicher Stand wie beim Verlassen der Gerüchtephase)
    const lore = document.getElementById('ao-lore-text');
    if (lore && lore.innerHTML === '') {
      // Fallback falls Lore noch nicht gerendert war
      const segs = loreBuildSegments(G.diceConcealed);
      loreRender(segs);
    }
    const div = document.getElementById('ao-lore-divider');
    if (div) div.classList.add('visible');
    btn.textContent = '👁 Aufdecken';
    btn.className = 'ao-btn reveal';
    btn.disabled = false;
  }

  overlay.classList.add('visible');
}

function hideAttackOverlay() {
  const overlay = document.getElementById('attack-overlay');
  if (overlay) overlay.classList.remove('visible');
}

function aoSyncDiceFaces() {
  ['yellow','blue','red'].forEach(c => {
    const faceEl = document.getElementById(`ao-face-${c}`);
    const colEl  = document.getElementById(`ao-col-${c}`);
    if (faceEl) faceEl.textContent = G.dice[c];
    const isConc = G.diceConcealed instanceof Set && G.diceConcealed.has(c);
    colEl?.classList.toggle('concealed', isConc);
  });
}

function handleAttackOverlayBtn() {
  const btn = document.getElementById('ao-btn');

  if (_aoPhase === 'rumour') {
    // Würfeln
    rollDice();
    btn.textContent = '…';
    btn.disabled = true;

    ['yellow','blue','red'].forEach((c, i) => {
      const faceEl = document.getElementById(`ao-face-${c}`);
      if (faceEl) faceEl.textContent = G.dice[c];
      const cube = document.getElementById(`ao-cube-${c}`);
      setTimeout(() => {
        cube.classList.remove('rolling');
        void cube.offsetWidth;
        cube.classList.add('rolling');
        setTimeout(() => cube.classList.remove('rolling'), 950);
      }, i * 130);
    });

    setTimeout(() => {
      aoSyncDiceFaces();
      const segs = loreBuildSegments(G.diceConcealed);
      loreRender(segs);
      // Nach dem Würfeln: Schließen-Button — Bauphase beginnt
      btn.textContent = '✓ Schließen';
      btn.className = 'ao-btn close';
      btn.disabled = false;
      _aoPhase = 'close';
    }, 1100);

  } else if (_aoPhase === 'close') {
    // Overlay schließen → Phasenwechsel automatisch auslösen
    hideAttackOverlay();
    advancePhase();

  } else if (_aoPhase === 'reveal') {
    // Aufdecken
    btn.disabled = true;
    revealDice();
    aoSyncDiceFaces();
    loreReveal();

    setTimeout(() => {
      btn.textContent = '⚔ Angriff starten';
      btn.className = 'ao-btn start';
      btn.disabled = false;
      _aoPhase = 'start';
    }, 900);

  } else if (_aoPhase === 'start') {
    // Overlay schließen und Raid starten
    hideAttackOverlay();
    const stage = document.getElementById('stage');
    document.getElementById('raid-overlay').classList.add('visible');
    SFX.raidStart();
    spawnRaidAtmosphere(stage);
    startRaidSequence();
  }
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
    face.textContent = val;
    slot.classList.toggle('concealed', concealed);

    if (concealed) {
      if (col === 'yellow') detail.textContent = 'Richtung verborgen';
      else if (col === 'blue') detail.textContent = 'Angreifer verborgen';
      else if (col === 'red')  detail.textContent = 'Champion verborgen';
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
    case 'def_sum':   return G.board.reduce((s,c,i) => c && i!==4 ? s + (c.def||0) + (G.boosted[i]||0) : s, 0);
    case 'deact*':    return G.plundered.filter(Boolean).length * (p.factor || 1);
    case 'season*':   return (G.season + 1) * (p.factor || 1);  // Jahreszeit × Faktor
    case 'season_table': return (p.table || [0,0,0,0])[G.season] || 0; // feste Werte je Jahreszeit
    case 'blue*': {  // Handelszentrum: aktive Rohstoffkarten × Faktor
      const count = G.board.filter((c, i) =>
        c && i !== 4 && !G.plundered[i] && c.res
      ).length;
      return count * (p.factor || 1);
    }
    case 'dice_sum*': // Nebelbastei: (Würfel A + Würfel B) × Faktor
      return ((dice[p.a] || 0) + (dice[p.b] || 0)) * (p.factor || 1);
    case 'sonder_count': {                                        // Immobilienhändler: Sonderkarten × 2
      const count = G.board.filter((c,i) => c && i!==4 && c.cat==='special' && !G.plundered[i]).length;
      return count * 2;
    }
    case 'sole_survivor': {                                       // Schwarze Kathedrale: 48 Pkt wenn als einzige nicht deaktiviert
      const activeCount = G.board.filter((c,i) => c && i!==4 && !G.plundered[i]).length;
      return activeCount === 1 ? (p.value || 48) : 0;
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
    case 'season_table': return `${(pts.table||[]).join('/')}✦`;
    case 'blue*':       return `🔵×${pts.factor}`;
    case 'dice_sum*':   return `(${DICE_SYMBOLS[pts.a]}+${DICE_SYMBOLS[pts.b]})×${pts.factor}`;
    case 'sonder_count':return `✦×2`;
    case 'sole_survivor':return `☩48`;
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
      if (barr > 0) parts.push(`${barr} <img src="res-holz.png" width="14" height="14" style="vertical-align:middle">→<img src="def-barriere.png" width="12" height="14" style="vertical-align:middle">`);
      if (kn   > 0) parts.push(`${kn} <img src="res-nahrung.png" width="14" height="14" style="vertical-align:middle">→<img src="def-ritter.png" width="13" height="14" style="vertical-align:middle">`);
      if (coin > 0) parts.push(`${coin} <img src="res-glas.png" width="14" height="14" style="vertical-align:middle">→<img src="res-muenze.png" width="14" height="14" style="vertical-align:middle">`);
      preview.innerHTML = parts.join('  ');
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
    { rawIcon:`<img src="res-holz.png"    width="22" height="22" style="vertical-align:middle;object-fit:contain;">`, rawLabel:'Holz',    rawTotal: prod.holz,
      defIcon:`<img src="def-barriere.png" width="18" height="22" style="vertical-align:middle;object-fit:contain;">`, defLabel:'Barrieren', defKey:'barrierHand', convert: RATIO },
    { rawIcon:`<img src="res-nahrung.png" width="22" height="22" style="vertical-align:middle;object-fit:contain;">`, rawLabel:'Nahrung', rawTotal: prod.nahrung,
      defIcon:`<img src="def-ritter.png"   width="20" height="22" style="vertical-align:middle;object-fit:contain;">`, defLabel:'Ritter',    defKey:'knights',     convert: RATIO },
    { rawIcon:`<img src="res-glas.png"    width="22" height="22" style="vertical-align:middle;object-fit:contain;">`, rawLabel:'Glas',    rawTotal: prod.glas,
      defIcon:`<img src="res-muenze.png"   width="22" height="22" style="vertical-align:middle;object-fit:contain;">`, defLabel:'Münzen',    defKey:'coins',       convert: RATIO },
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
      <span class="do-def-icon"><img src="def-turm.png" width="16" height="22" style="vertical-align:middle;object-fit:contain;"></span>
      <span class="do-def-count" style="color:var(--ink-20);">—</span>
      <span style="font-family:'Cinzel',serif;font-size:0.85rem;color:var(--ink-40);">
        Türme (${G.towerHand})
      </span>
    </div>`;
  rowsEl.appendChild(towerRow);
  setTimeout(() => towerRow.classList.add('visible'), 150 + conversions.length * 180);
  document.querySelectorAll('.edge-barrier').forEach(e => e.style.visibility = 'hidden');
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
  document.querySelectorAll('.edge-barrier').forEach(e => e.style.visibility = '');
  renderHand();
  renderGrid();
  setHint('Barrieren, Türme und Ritter setzen', true);
}

function doResourceConversion() {
  // Wird jetzt durch showDefenseOverlay ersetzt — leere Stub-Funktion
}
const PHASES = ['Gerüchte', 'Bauen', 'Rüsten', 'Überfall', 'Wertung'];
const SEASON_NAMES = ['Winter', 'Frühling', 'Sommer', 'Herbst'];
const SEASON_KEYS  = ['winter', 'spring', 'summer', 'autumn'];

function renderPhaseBar() {
  const seasonLabel = document.getElementById('phase-season-label');
  const dotsEl      = document.getElementById('phase-dots');
  if (!seasonLabel || !dotsEl) return;

  const col         = SEASON_COLORS[SEASON_KEYS[G.season]] || '#7a7060';
  const seasonRoman = ['I', 'II', 'III', 'IV'][G.season];

  seasonLabel.textContent = `${SEASON_NAMES[G.season]}`;
  seasonLabel.style.color = col;

  const winterPhases = [
    { name: 'Bauen',    idx: 1 },
    { name: 'Rüsten',   idx: 2 },
    { name: 'Wertung',  idx: 4 },
  ];
  const allPhases    = PHASES.map((name, idx) => ({ name, idx }));
  const visiblePhases = G.season === 0 ? winterPhases : allPhases;
  const currentPos   = visiblePhases.findIndex(p => p.idx === G.phase);
  const total        = visiblePhases.length;
  const phaseName    = visiblePhases[currentPos]?.name || PHASES[G.phase];

  // Kompakt: Phasenname fett + Fortschritt daneben
  dotsEl.innerHTML = `
    <span class="phase-label active" style="color:${col};font-weight:700;">${phaseName.toUpperCase()}</span>
    <span class="phase-progress" style="color:rgba(18,14,10,0.3);font-size:0.62rem;letter-spacing:0.08em;margin-left:5px;">${currentPos + 1}/${total}</span>
  `;
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
  if (stackSize >= 6) return false;
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
// Sonderkarten brauchen minLevel — fehlende Level kosten je 1 Münze.
function getCardPlayability(card) {
  if (!card) return { playable: false, reason: '' };

  // Sonderkarte: Slot-Kapazität prüfen (Rathaus Level = max. Sonderkarten auf dem Feld)
  if (card.cat === 'special') {
    const sonderCount = G.board.filter((c, i) =>
      c && i !== 4 && c.cat === 'special' && !G.plundered[i]
      && c.special_mechanic !== 'free_build'
    ).length;
    if (sonderCount >= G.rathausLevel) {
      return {
        playable: false,
        reason: `Rathaus Level ${G.rathausLevel} erlaubt nur ${G.rathausLevel} Sonderkarte${G.rathausLevel > 1 ? 'n' : ''} — Rathaus upgraden für mehr Slots`,
        coinBypass: false,
        coinCost: 0,
      };
    }
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

    // Barrikadiert-Markierung (alle Außenkanten geschützt)
    if (isBarricaded(i)) {
      cell.classList.add('barricaded');
      if (G.phase === 2) cell.classList.add('barricaded-strong');
    }

    if (i === 4) {
      cell.classList.add('rathaus');
      cell.innerHTML = makeCard(RATHAUS, 130, 182, true, G.score);
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
          sub.innerHTML = makeCard(c, 130, 182, false, undefined, false, false, G.plundered[i], false);
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

      // Oberste Karte — Schildwall-Bonus in der Anzeige berücksichtigen
      const topDiv = document.createElement('div');
      topDiv.style.cssText = 'position:absolute; inset:0; z-index:10;';
      const swBonus = !G.plundered[i] ? getSchildwallBonus(i) : 0;
      const renderCard = swBonus > 0
        ? { ...G.board[i], def: (G.board[i].def || 0) + swBonus }
        : G.board[i];
      const renderBoosted = G.boosted[i] || (swBonus > 0 ? swBonus : false);
      const frontHTML = makeCard(renderCard, 130, 182, false, undefined, G.fortified[i], renderBoosted, G.plundered[i], !G.plundered[i]);
      topDiv.innerHTML = wrapWithFlip(frontHTML, G.board[i]);
      // Sonderkarten: Premium-Shimmer
      if (G.board[i].cat === 'special' && !G.plundered[i]) {
        topDiv.className = 'cell-card special-card';
        topDiv.style.cssText = 'position:absolute; inset:0; z-index:10; border-radius:6px; overflow:visible;';
      }
      cell.appendChild(topDiv);

      // Click-Handler immer registrieren (für Flip + Karte platzieren)
      cell.addEventListener('pointerup', (e) => { e.preventDefault(); onCellClick(i); });

      // Karten-Modus: belegte Felder als Upgrade/Replace-Target anzeigen
      if (G.mode === 'card' && G.selectedHandIdx >= 0 && i !== 4) {
        cell.classList.add('upgrade-target');
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

// 3 dezente Farben für die 3 Draft-Hände
const HAND_COLORS = ['#c07830', '#4a7fb5', '#5a9a5a'];

function setHandColor(handIndex) {
  const area  = document.getElementById('hand-area');
  const label = document.getElementById('hand-id');
  if (!area || !label) return;
  if (handIndex < 0 || !DRAFT.active) {
    area.style.setProperty('--hand-color', 'transparent');
    label.textContent = '';
    return;
  }
  const col = HAND_COLORS[handIndex % 3];
  area.style.setProperty('--hand-color', col);
  label.textContent = `Hand ${handIndex + 1} · `;
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
      + (isCoinBypass ? ' coin-bypass' : '')
      + (isUnplayable && card.cat === 'special' ? ' special-slot-full' : '');
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
    slot.innerHTML = wrapWithFlip(makeCard(card, 66, 92, false), card);
    if (card.cat === 'special') {
      slot.style.borderRadius = '6px';
      slot.style.overflow = 'hidden';
      slot.classList.add('cell-card', 'special-card');
    }
    if (!cardLocked) {
      slot.addEventListener('pointerup', (e) => {
        e.preventDefault();
        onHandClick(idx);
      });
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
      const sonderOnBoard = G.board.filter((c, i) => c && i !== 4 && c.cat === 'special' && !G.plundered[i]).length;
      const sonderMax = G.rathausLevel;
      let pipHtml = '';
      for (let i = 0; i < sonderMax; i++) {
        pipHtml += `<span class="sonder-slot-pip${i < sonderOnBoard ? ' filled' : ''}">✦</span>`;
      }
      discardHintEl.innerHTML = `· ${actionsLeft} Aktionen · 🏛 ${levelDots}<span class="sonder-slots">${pipHtml}</span>`;
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
    renderResources();
    renderGrid(true); // Rathaus-Level sofort aktualisieren

    // Hand erst nach Animation neu rendern
    setTimeout(() => {
      if (G.builtThisSeason >= 5) {
        DRAFT.active = false;
        G.hand = [];
        setHint('5 Aktionen verbraucht · › weiter', true);
        renderHand();
      } else if (DRAFT.active) {
        G.hand = G.hand.filter(c => c !== null);
        advanceDraft();
      } else {
        renderHand();
      }
      renderGrid(true);

      // Slot-Unlock: Sonderkarten in der Hand kurz aufleuchten lassen
      setTimeout(() => {
        document.querySelectorAll('.hand-card.special-card').forEach(el => {
          el.classList.add('slot-unlocked');
          setTimeout(() => el.classList.remove('slot-unlocked'), 950);
        });
      }, 80);
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
    setHint('5 Aktionen verbraucht · › weiter', true);
  } else if (DRAFT.active) {
    G.hand = G.hand.filter(c => c !== null);
    advanceDraft();
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
  const barrierIcon = `<img src="def-barriere.png" width="10" height="16" style="vertical-align:middle;object-fit:contain;">`;
  const knightIcon  = `<img src="def-ritter.png"   width="12" height="16" style="vertical-align:middle;object-fit:contain;">`;
  const coinIcon    = `<img src="res-muenze.png"    width="16" height="16" style="vertical-align:middle;object-fit:contain;">`;
  const towerIcon   = `<img src="def-turm.png"      width="12" height="16" style="vertical-align:middle;object-fit:contain;">`;

  // Drei Rohstoff→Verteidigungs-Paare
  const pairs = [
    { rawKey:'holz',    rawIcon:`<img src="res-holz.png"    width="18" height="18" style="vertical-align:middle;object-fit:contain;">`, rawCount: prod.holz,    rawLabel:'Holz',
      defKey:'barrier', defIcon: barrierIcon, defCount: G.barrierHand,
      onClick: defLocked ? null : onBarrierHandClick, active: G.selectedBarrier },
    { rawKey:'nahrung', rawIcon:`<img src="res-nahrung.png" width="18" height="18" style="vertical-align:middle;object-fit:contain;">`, rawCount: prod.nahrung, rawLabel:'Nahrung',
      defKey:'knights', defIcon: knightIcon,  defCount: G.knights,
      onClick: defLocked ? null : onKnightClick, active: G.selectedKnight },
    { rawKey:'glas',    rawIcon:`<img src="res-glas.png"    width="18" height="18" style="vertical-align:middle;object-fit:contain;">`, rawCount: prod.glas,    rawLabel:'Glas',
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
      <span class="raw-count ${G.coins < RATIO ? 'zero' : ''}" style="font-size:0.55rem;opacity:0.5">×${RATIO}</span>
    </div>
    <span class="res-pair-arrow">›</span>
    <div class="res-pair-def">
      <span style="opacity:${G.coins >= RATIO ? '1' : '0.3'}">${towerIcon}</span>
    </div>`;
  // Turm-Chip: in Rüstphase direkt platzieren (2 Münzen → Turm auf Karte)
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
// ── Edge-Zonen rendern (Außenkanten-Barrieren) ────────────────────
// Pixel-Versatz nach außen (wie weit vorgelagert von der Zelle)
const EDGE_OFFSET = 8;

// Berechnet Position und Ausrichtung einer Edge-Zone relativ zum #app-Element
function edgeZoneGeometry(cellRect, appR, edge) {
  // Vorgelagerte Zone: rect deutlich außerhalb der Zelle
  const cx = (cellRect.left + cellRect.right) / 2 - appR.left;
  const cy = (cellRect.top + cellRect.bottom) / 2 - appR.top;
  const w  = cellRect.width;
  const h  = cellRect.height;
  // Wir machen Trefferzonen größer als die sichtbare Barriere
  const longSide  = Math.round(w * 0.8);
  const shortSide = 22;
  switch (edge) {
    case 'N': return { left: cx - longSide/2,  top: cellRect.top - appR.top - shortSide - EDGE_OFFSET, width: longSide, height: shortSide, isH: true };
    case 'S': return { left: cx - longSide/2,  top: cellRect.bottom - appR.top + EDGE_OFFSET,           width: longSide, height: shortSide, isH: true };
    case 'W': return { left: cellRect.left - appR.left - shortSide - EDGE_OFFSET, top: cy - longSide/2, width: shortSide, height: longSide, isH: false };
    case 'O': return { left: cellRect.right - appR.left + EDGE_OFFSET,            top: cy - longSide/2, width: shortSide, height: longSide, isH: false };
  }
  return null;
}

function renderEdgeZones(active) {
  // Alte entfernen
  document.querySelectorAll('.edge-zone').forEach(e => e.remove());
  if (!active) return;

  const gridEl = document.getElementById('grid');
  const cells  = gridEl.querySelectorAll('.cell');
  const appR   = document.getElementById('app').getBoundingClientRect();

  for (let idx = 0; idx < 9; idx++) {
    const edges = CELL_OUTER_EDGES[idx];
    if (!edges || edges.length === 0) continue;
    const cell = cells[idx];
    if (!cell) continue;
    const rC = cell.getBoundingClientRect();

    for (const edge of edges) {
      const key = EDGE_KEY(idx, edge);
      if (G.barriers.has(key)) continue; // schon belegt

      const geo = edgeZoneGeometry(rC, appR, edge);
      if (!geo) continue;

      const zone = document.createElement('div');
      zone.className = 'edge-zone active';
      zone.dataset.edgeKey = key;
      zone.style.cssText = `
        left:${geo.left.toFixed(1)}px;
        top:${geo.top.toFixed(1)}px;
        width:${geo.width.toFixed(1)}px;
        height:${geo.height.toFixed(1)}px;
      `;
      zone.innerHTML = '<div class="edge-inner"></div>';

      zone.addEventListener('click', () => onEdgeClick(key, idx, edge));
      zone.addEventListener('touchend', (e) => { e.preventDefault(); onEdgeClick(key, idx, edge); }, { passive: false });

      document.getElementById('app').appendChild(zone);
    }
  }
}

function updateRathausScore() {
  const cell = document.querySelector('.cell.rathaus');
  if (cell) cell.innerHTML = makeCard(RATHAUS, 130, 182, true, G.score);
}

const PHASE_HINTS = [
  'Würfle um den Überfall zu erkunden',
  'Karte wählen, dann Feld antippen',
  'Barrieren, Ritter und Türme setzen',
  'Überfall läuft…',
  '',
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
  const btnWrap = document.getElementById('btn-next-wrap');
  const col = SEASON_COLORS[SEASON_KEYS[G.season]];
  btnNext.style.setProperty('--phase-col', col);
  const hasSelection = G.selectedHandIdx >= 0 || G.selectedBarrier ||
                       G.selectedTower || G.selectedKnight || G.selectedCellIdx >= 0;
  const isReady = !hasSelection;
  btnNext.classList.toggle('ready', isReady);
  if (btnWrap) btnWrap.classList.toggle('ready', isReady);

  // Show next phase name when ready
  const labelEl = document.getElementById('btn-next-label');
  if (labelEl) {
    const winterPhases = [null,1,2,null,4];
    const allPhases = [0,1,2,3,4];
    const phaseNames = ['Gerüchte','Bauen','Rüsten','Überfall','Wertung'];
    let nextPhase = G.phase + 1;
    if (G.season === 0 && nextPhase === 3) nextPhase = 4;
    if (nextPhase > 4) nextPhase = 0;
    labelEl.textContent = isReady ? (phaseNames[nextPhase] || '›') : '›';
  }
}

// Phasenwechsel mit Animation — vollständiger Jahreszeiten-Durchlauf
function advancePhase() {
  // Guard: nicht auslösen während Übergang animiert (show + noch nicht faded out)
  // Aber: wenn das Overlay seit > 2.5s sichtbar ist → Notfall-Dismiss
  const overlay = document.getElementById('phase-transition');
  if (overlay && overlay.classList.contains('show')) {
    const showTime = parseInt(overlay.dataset.showTime || '0');
    if (Date.now() - showTime < 3000) return;
    // Notfall: Overlay manuell schließen
    overlay.classList.remove('show');
    overlay.classList.remove('season-change');
  }
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
  const ptOverlay  = document.getElementById('phase-transition');
  const nameEl     = document.getElementById('pt-name');
  const subEl      = document.getElementById('pt-sub');
  const romanEl    = document.getElementById('pt-roman');
  const dividerEl  = document.getElementById('pt-divider');
  const shimmerEl  = ptOverlay.querySelector('.pt-shimmer');

  if (isNewSeason) {
    // ── Jahreszeitenwechsel: deutlichere Behandlung ──
    ptOverlay.classList.add('season-change');
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
    ptOverlay.classList.remove('season-change');
    romanEl.textContent = '';
    dividerEl.style.background = 'transparent';
    shimmerEl.style.background = 'transparent';
    nameEl.textContent  = PHASES[nextPhase].toUpperCase();
    subEl.textContent   = '';
    nameEl.style.color  = col;
  }

  ptOverlay.dataset.showTime = Date.now();
  ptOverlay.classList.add('show');

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
      _aoLorePick  = null; // Neue Jahreszeit → neuer Lore-Satz
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
    const phaseHint = PHASE_HINTS[nextPhase];
    setHint(isNewSeason
      ? (phaseHint ? `${SEASON_NAMES[nextSeason]} — ${phaseHint}` : SEASON_NAMES[nextSeason])
      : (phaseHint || ''), false);

    // Gerüchte-Phase: Overlay öffnen — Spieler würfelt selbst
    if (nextPhase === 0) {
      setTimeout(() => showAttackOverlay(0), 400);
    }
    // Verteidigungsphase: Stadt lebt kurz auf, dann Ernte-Overlay
    if (nextPhase === 2) {
      setTimeout(() => animateCityAlive(), 100);
      setTimeout(() => showDefenseOverlay(), 1800);
    }
    // Überfall-Phase: Overlay mit Aufdecken-Button
    if (nextPhase === 3) {
      setTimeout(() => showAttackOverlay(3), 400);
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

  }, isNewSeason ? 1100 : 900);

  // Overlay-Remove separat — absolutes Timing damit kein innerer Timer
  // eine spätere Animation abschießen kann
  setTimeout(() => {
    ptOverlay.classList.remove('show');
    ptOverlay.classList.remove('season-change');
  }, isNewSeason ? 2800 : 1400);
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
  if (bg) bg.style.backgroundImage = "url('splash.png')";
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
// Zwillingsturm: prüft ob Karte an Index i einen aktiven Zwillingsturm als Nachbar hat
function getZwillingsturmMultiplier(i) {
  const neighbors = [i-3, i+3, i-1, i+1].filter(n => n >= 0 && n < 9 && n !== 4);
  return neighbors.some(n => {
    const c = G.board[n];
    return c && !G.plundered[n] && c.special_mechanic === 'zwillingsturm';
  }) ? 2 : 1;
}

function recomputeScoreFromBoard() {
  G.score = G.board.reduce((sum, card, i) => {
    if (!card || i === 4) return sum;
    if (G.plundered[i]) {
      if (card.special_mechanic === 'pts_if_plundered') return sum + 8;
      return sum;
    }
    // Zwillingsturm selbst zählt normal (keine Selbstverdopplung)
    const mult = (card.special_mechanic === 'zwillingsturm') ? 1 : getZwillingsturmMultiplier(i);
    return sum + calcCardPts(card) * mult;
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
    if (card.fragile && G.entered[i] && !hasSchutzpatronin()) fragileVictims.push(i);
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

  const col = SEASON_COLORS[SEASON_KEYS[G.season]];
  const cells = document.querySelectorAll('.cell');

  // Berechne Punkte je Karte
  const cardPoints = G.board.map((card, i) => {
    if (!card || i === 4) return 0;
    if (G.plundered[i]) {
      return card.special_mechanic === 'pts_if_plundered' ? 8 : 0;
    }
    return calcCardPts(card);
  });
  const points = cardPoints.reduce((s, p) => s + p, 0);
  G.score = points;
  updateRathausScore();

  if (points <= 0) {
    showToast('Keine aktiven Gebäude — 0 Punkte diese Runde');
    return;
  }

  // ── Schritt 1: Overlays je Karte gestaffelt einblenden ─────────
  const scoringCells = [];
  cardPoints.forEach((pts, i) => {
    if (!G.board[i] || i === 4 || pts === 0) return;
    scoringCells.push({ i, pts });
  });

  scoringCells.forEach(({ i, pts }, order) => {
    const cell = cells[i];
    if (!cell) return;
    setTimeout(() => {
      const ov = document.createElement('div');
      ov.className = 'cell-score-overlay';
      ov.dataset.cellIdx = i;

      const ptsEl = document.createElement('div');
      ptsEl.className = 'cso-pts';
      ptsEl.style.color = col;
      ptsEl.textContent = `+${pts}`;

      const lbl = document.createElement('div');
      lbl.className = 'cso-label';
      lbl.textContent = G.board[i]?.name || '';

      ov.appendChild(ptsEl);
      ov.appendChild(lbl);
      cell.appendChild(ov);

      // Trigger transition
      requestAnimationFrame(() => requestAnimationFrame(() => ov.classList.add('visible')));
    }, order * 250);
  });

  const revealDuration = scoringCells.length * 250 + 1800;

  // ── Schritt 2: Overlays wegfliegen + Transfer-Float ─────────────
  setTimeout(() => {
    // Alle Overlays wegfliegen lassen
    document.querySelectorAll('.cell-score-overlay').forEach((ov, k) => {
      setTimeout(() => {
        ov.classList.add('fly-out');
        ov.addEventListener('animationend', () => ov.remove(), { once: true });
      }, k * 120);
    });

    // Transfer-Float vom Rathaus
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

    // VP + Header-Flash nach Float-Ankunft
    setTimeout(() => {
      const headerEl = document.querySelector('header');
      if (headerEl) {
        headerEl.style.setProperty('--flash-col', col + '33');
        headerEl.classList.remove('scoring-flash');
        void headerEl.offsetWidth;
        headerEl.classList.add('scoring-flash');
        headerEl.addEventListener('animationend',
          () => headerEl.classList.remove('scoring-flash'), { once: true });
      }
      G.victoryPoints += points;
      const coinBonus = (G.season === 3) ? G.coins : 0;
      if (coinBonus > 0) G.victoryPoints += coinBonus;
      const vpEl = document.getElementById('vp-value');
      if (vpEl) {
        vpEl.textContent = G.victoryPoints;
        vpEl.style.setProperty('--season-col', col);
        vpEl.classList.remove('flash');
        void vpEl.offsetWidth;
        vpEl.classList.add('flash');
        vpEl.addEventListener('animationend', () => vpEl.classList.remove('flash'), { once: true });
      }
      if (coinBonus > 0) {
        SFX.scoring(); showToast(`+${points} Punkte · +${coinBonus} Münzen = ${G.victoryPoints} gesamt`);
      } else {
        SFX.scoring(); showToast(`+${points} Siegpunkte gesichert`);
      }
    }, 1000);
  }, revealDuration);
}

// Demo-Überfall: 1–3 zufällige Karten werden geplündert, gestaffelt mit Animation
function doRaidDemo() { startRaidSequence(); }

function spawnRaidAtmosphere(stage) {
  const overlay = document.getElementById('raid-overlay');

  // Canvas für Risse — über dem Grid, pointer-events: none
  const canvas = document.createElement('canvas');
  canvas.id = 'raid-crack-canvas';
  canvas.style.cssText = `
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    pointer-events: none; z-index: 50;
    opacity: 0; transition: opacity 0.8s ease;
  `;
  stage.appendChild(canvas);
  setTimeout(() => { canvas.style.opacity = '1'; }, 50);

  const W = stage.offsetWidth  || 400;
  const H = stage.offsetHeight || 500;
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const cracks = [];
  const waves  = [];
  stage._raidCracks = cracks;
  stage._raidWaves  = waves;

  let animFrame;
  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    // Schockwellen
    waves.forEach((w, wi) => {
      const p   = w.age / w.maxAge;
      const op  = Math.max(0, (1 - p) * 0.55);
      const r   = w.maxR * p;
      ctx.beginPath();
      ctx.arc(w.x, w.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,210,160,${op})`;
      ctx.lineWidth   = 2.5 * (1 - p) + 0.3;
      ctx.stroke();
      w.age++;
      if (w.age >= w.maxAge) waves.splice(wi, 1);
    });

    // Risse
    cracks.forEach((ck, ci) => {
      const prog   = Math.min(1, ck.age / 45);
      const fadeStart = ck.maxAge - 50;
      const fade   = ck.age > fadeStart ? Math.max(0, 1 - (ck.age - fadeStart) / 50) : 1;
      const visible = Math.max(2, Math.floor(prog * ck.pts.length));
      ctx.beginPath();
      ctx.moveTo(ck.pts[0].x, ck.pts[0].y);
      for (let i = 1; i < visible; i++) ctx.lineTo(ck.pts[i].x, ck.pts[i].y);
      ctx.strokeStyle = `rgba(255,240,200,${0.55 * fade})`;
      ctx.lineWidth = 1.2; ctx.stroke();
      ctx.strokeStyle = `rgba(20,10,4,${0.5 * fade})`;
      ctx.lineWidth = 0.4; ctx.stroke();
      ck.age++;
      if (ck.age >= ck.maxAge) cracks.splice(ci, 1);
    });

    animFrame = requestAnimationFrame(drawFrame);
  }
  drawFrame();
  stage._raidAnimFrame = animFrame;
  stage._raidCanvas    = canvas;
  stage._raidCtx       = ctx;
  stage._raidW         = W;
  stage._raidH         = H;
}

// Riss von einem Kartenmittelpunkt aus spawnen
function spawnRaidCrack(stage, cellIdx) {
  const cracks = stage._raidCracks;
  const waves  = stage._raidWaves;
  if (!cracks) return;

  // Mittelpunkt der Zelle berechnen
  const grid = document.getElementById('grid');
  const cells = grid?.querySelectorAll('.cell');
  const cell  = cells?.[cellIdx];
  if (!cell) return;
  const stageR = stage.getBoundingClientRect();
  const cellR  = cell.getBoundingClientRect();
  const ox = cellR.left - stageR.left + cellR.width  / 2;
  const oy = cellR.top  - stageR.top  + cellR.height / 2;

  // Schockwelle
  waves.push({ x: ox, y: oy, r: 0, maxR: Math.max(cellR.width, 80), age: 0, maxAge: 40 });

  // 3–5 Rissäste
  const numArms = 3 + Math.floor(Math.random() * 3);
  for (let a = 0; a < numArms; a++) {
    const angle   = (a / numArms) * Math.PI * 2 + Math.random() * 0.6;
    const segs    = 3 + Math.floor(Math.random() * 4);
    let x = ox, y = oy;
    const pts = [{ x, y }];
    let dir = angle;
    for (let s = 0; s < segs; s++) {
      dir += (Math.random() - 0.5) * 0.7;
      const len = 18 + Math.random() * 28;
      x += Math.cos(dir) * len;
      y += Math.sin(dir) * len;
      pts.push({ x, y });
      // Nebenast
      if (Math.random() > 0.55) {
        const branchDir = dir + (Math.random() - 0.5) * 1.4;
        const bLen = 10 + Math.random() * 18;
        cracks.push({
          pts: [
            { x, y },
            { x: x + Math.cos(branchDir) * bLen, y: y + Math.sin(branchDir) * bLen },
          ],
          age: 0, maxAge: 120 + Math.floor(Math.random() * 60),
        });
      }
    }
    cracks.push({ pts, age: 0, maxAge: 160 + Math.floor(Math.random() * 80) });
  }
}

function stopRaidAtmosphere(stage) {
  // Animation stoppen
  if (stage._raidAnimFrame) cancelAnimationFrame(stage._raidAnimFrame);

  // Canvas ausblenden + entfernen
  const canvas = stage._raidCanvas;
  if (canvas) {
    canvas.style.opacity = '0';
    canvas.style.transition = 'opacity 1.2s ease';
    setTimeout(() => canvas.remove(), 1300);
  }

  // Overlay-Reste (alte Flicker falls vorhanden)
  const overlay = document.getElementById('raid-overlay');
  overlay.querySelectorAll('.raid-flicker, .ember').forEach(e => e.remove());

  // Refs aufräumen
  delete stage._raidCracks;
  delete stage._raidWaves;
  delete stage._raidCanvas;
  delete stage._raidAnimFrame;
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

// Schildwall: gibt +1 (+2 bei neighbor_defense_2) pro benachbarter Schildwall-Karte
function getSchildwallBonus(idx) {
  if (!G.schildwall || G.schildwall.size === 0) return 0;
  // Nur echte Nachbarn: vertikal ±3, horizontal ±1 nur in gleicher Zeile
  const row = Math.floor(idx / 3);
  const neighbors = [
    idx - 3,                                          // oben
    idx + 3,                                          // unten
    (idx - 1 >= 0 && Math.floor((idx-1)/3) === row) ? idx-1 : -1,  // links (gleiche Zeile)
    (idx + 1 <  9 && Math.floor((idx+1)/3) === row) ? idx+1 : -1,  // rechts (gleiche Zeile)
  ].filter(n => n >= 0 && n < 9 && n !== 4);
  let bonus = 0;
  for (const sw of G.schildwall) {
    if (neighbors.includes(sw) && G.board[sw] && !G.plundered[sw]) {
      const mech = G.board[sw].special_mechanic;
      bonus += (mech === 'neighbor_defense_2') ? 2 : 1;
    }
  }
  return bonus;
}

// Schutzpatronin (Z7): prüft ob eine aktive Karte mit 'schutzpatronin'-Mechanik auf dem Feld liegt
function hasSchutzpatronin() {
  return G.board.some((c, i) => c && i !== 4 && !G.plundered[i] && c.special_mechanic === 'schutzpatronin');
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

  const { startCell, clockwise, rawStartCell } = G.attackDir;
  let attackers = G.attackBlue.calc();

  // Bogenwacht: −2 Angreifer pro platzierter Bogenwacht-Karte
  if (G.bogenwacht && G.bogenwacht > 0) {
    attackers = Math.max(0, attackers - (G.bogenwacht * 2));
    setHint(`Bogenwacht −${G.bogenwacht * 2} Angreifer`, true);
  }

  // Champion-Effekte anwenden
  let effectiveStart    = startCell;
  let effectiveClockwise = clockwise;
  let ignoreBarriers    = false;

  if (G.attackChampion) {
    const ch = G.attackChampion;
    const rv = G.dice.red;
    switch (ch.id) {
      case 'C1':
        attackers += rv;
        break;
      case 'C2': {
        // Gegenüberliegende Position in CLOCKWISE_ORDER (relativ zur ROHEN Startposition)
        const baseCell = rawStartCell != null ? rawStartCell : startCell;
        const ci = CLOCKWISE_ORDER.indexOf(baseCell);
        const oppositeRaw = CLOCKWISE_ORDER[(ci + 4) % 8];
        // Auf Barrikaden anwenden (außer ignore_barriers — wird unten ohnehin separat behandelt)
        effectiveStart = resolveStartCell(oppositeRaw, effectiveClockwise, false);
        break;
      }
      case 'C3':
        effectiveClockwise = !clockwise;
        // Bei umgekehrter Laufrichtung muss Startfeld neu resolved werden (vom rohen Würfelfeld)
        if (rawStartCell != null) {
          effectiveStart = resolveStartCell(rawStartCell, effectiveClockwise, false);
        }
        break;
      case 'C4':
        G.dice.yellow = 6;
        G.dice.blue   = 6;
        attackers = G.attackBlue.calc();
        G.attackerOverride = attackers;
        effectiveClockwise = true; // 6 gerade → ↻
        G.attackDir = { ...G.attackDir, clockwise: true };
        renderDice(false);
        break;
      case 'C8':
        G.dice.yellow = 1;
        G.dice.blue   = 1;
        attackers = G.attackBlue.calc();
        G.attackerOverride = attackers;
        effectiveClockwise = false; // 1 ungerade → ↺
        G.attackDir = { ...G.attackDir, clockwise: false };
        renderDice(false);
        break;
      case 'C5':
        // Champion durchbricht die Front: Angriff startet am gewürfelten Feld,
        // egal ob barrikadiert (Barrieren bleiben physisch bestehen, sind aber wirkungslos)
        ignoreBarriers = true;
        if (rawStartCell != null) {
          effectiveStart = rawStartCell;
        }
        break;
      case 'C9':
        // Mindestens 1 Karte wird deaktiviert — wird bei der Sequenz erzwungen
        break;
      case 'C10':
        { const tmp = G.dice.yellow;
          G.dice.yellow = G.dice.blue;
          G.dice.blue   = tmp;
          attackers = G.attackBlue.calc();
          effectiveClockwise = (G.dice.yellow % 2 === 0);
          // Neue gelb-Anzeige bedeutet auch neuen rohen Startpunkt: yellow-1 ist Index in CLOCKWISE_ORDER
          const newRawStart = CLOCKWISE_ORDER[(G.dice.yellow - 1) % 8];
          effectiveStart = resolveStartCell(newRawStart, effectiveClockwise, false);
          G.attackDir = { ...G.attackDir, clockwise: effectiveClockwise, rawStartCell: newRawStart };
          G.attackerOverride = attackers;
          renderDice(false);
        }
        break;
      case 'C11':
        if (G.season === 2)      attackers = Math.max(0, attackers - 3); // Sommer
        else if (G.season === 1 || G.season === 3) attackers += 3;        // Frühling/Herbst
        break;
      case 'C6':
      case 'C7':
      default:
        break;
    }
  }

  // Fragile Verteidigungskarten überschreiben Champion-Effekte
  // (stadttor sticht auch Barrikaden, windrose dreht Richtung)
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

  // Alle 8 Außenfelder barrikadiert — Angriff fällt komplett aus.
  // (Kann nicht passieren bei Stadttor oder ignore_barriers Champion, die haben effectiveStart bereits gesetzt.)
  if (effectiveStart === null) {
    clearAttackerBar();
    showToast('🛡 Die Stadt ist uneinnehmbar — kein Angriff!');
    setHint('🛡 Vollständig barrikadiert — kein Angriff möglich', true);
    document.querySelectorAll('.cell.attack-origin').forEach(c => c.classList.remove('attack-origin'));
    setTimeout(() => { stopRaidAtmosphere(stage); setTimeout(() => document.getElementById('raid-overlay').classList.remove('visible'), 5000); }, 600);
    return;
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

  const champHint = G.attackChampion && G.attackChampion.id !== 'C6' && G.attackChampion.id !== 'C7'
    ? ` [${G.attackChampion.label}]` : '';
  setHint(`Angriff aus ${GRID_DIRECTION[effectiveStart] || '?'} ${effectiveClockwise ? '↻' : '↺'} · ${attackers} Angreifer${champHint}`, true);

  const totalAttackers = attackers;
  initAttackerBar(totalAttackers);
  let spentSoFar = 0;

  const steps = [];
  for (const idx of raidRoute) {
    if (attackers <= 0) break;

    const card = G.board[idx];
    if (!card) continue; // sollte durch raidRoute-Filter nicht vorkommen, aber sicher ist sicher

    const schildwallBonus = getSchildwallBonus(idx);
    const schutzBonus = (card.fragile && hasSchutzpatronin()) ? Math.max(0, 2 - card.def) : 0;
    const def  = (card.def || 0) + (G.boosted[idx] || 0) + schildwallBonus + schutzBonus;
    const hasTower = G.fortified[idx];
    const incoming = attackers;
    attackers = Math.max(0, attackers - def);
    const deactivate = incoming >= def && !hasTower;
    const blocked    = incoming >= def &&  hasTower;
    steps.push({ type: 'attack', idx, incoming, def, hasTower, deactivate, blocked, spent: Math.min(def, incoming) });
  }

  // Brandstifter: mindestens 1 Karte erzwingen wenn keine deaktiviert wurde
  if (G.attackChampion && G.attackChampion.id === 'C9') {
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
    {
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
            G.boosted[idx] = 0;
            spawnColoredFloat(idx, '🎭 Abgelenkt!', '#c8940a');
            renderGrid();
          } else {
            G.plundered[idx] = true;
            G.boosted[idx] = 0;

            // Flip via animated display-swap
            const flipEl = document.querySelectorAll('.cell')[idx]?.querySelector('.card-flip');
            if (flipEl) flipCard(flipEl);

            // Riss + Schockwelle von dieser Karte aus
            const stageEl = document.getElementById('stage');
            if (stageEl) spawnRaidCrack(stageEl, idx);

            // Kristallpalast: zerstört
            if (hitCard && hitCard.special_mechanic === 'destroyable') {
              G.board[idx] = null;
              G.stacks[idx] = null;
              spawnColoredFloat(idx, '💎 Zerstört!', '#c8a010');
            }
            // Score update
            if (hitCard && hitCard.special_mechanic === 'pts_if_plundered') {
              G.score = G.score + 8;
              spawnColoredFloat(idx, '+8 💰 Versicherung!', '#3a8a3a');
            } else {
              G.score = Math.max(0, G.score - calcCardPts(G.board[idx] || {pts:0}));
              spawnColoredFloat(idx, `−${def}🛡`, '#c04040');
            }

            // Re-render after flip animation completes (450ms)
            setTimeout(() => {
              renderGrid();
              updateRathausScore();
            }, 500);
          }
        } else if (blocked) {
          // Turm hat gehalten — Ritter bleibt auf dem Feld
          spawnColoredFloat(idx, `♜ −${def}`, '#6a38a8');
          renderGrid();
        } else {
          // Erfolgreich verteidigt — Ritter bleibt auf dem Feld
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
    if (G.attackChampion && G.attackChampion.id === 'C12') {
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
            // Flip victim card before renderGrid
            const victimCells = document.querySelectorAll('.cell');
            const victimFlip = victimCells[victim]?.querySelector('.card-flip');
            if (victimFlip && victimFlip.dataset.flipped !== '1') {
              victimFlip.dataset.flipped = '1';
              victimFlip.classList.add('flipped');
              victimFlip.addEventListener('animationend', () => victimFlip.classList.remove('flipped'), { once: true });
            }
            setTimeout(() => { renderGrid(); updateRathausScore(); }, 350);
            if (victimCells[victim]) {
              victimCells[victim].classList.add('plundering');
              victimCells[victim].addEventListener('animationend', () => victimCells[victim].classList.remove('plundering'), {once:true});
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
      // Score vollständig neu berechnen — dynamische Karten wie Z5 (deact*) reagieren auf Plünderungen
      recomputeScoreFromBoard();
      updateRathausScore();
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
  document.querySelectorAll('.edge-barrier, .edge-zone').forEach(e => e.remove());

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
  setHint(PHASE_HINTS[G.phase], false);
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
  // Reset city card flips only (hand DOM is rebuilt by renderHand anyway)
  resetFlips(document.getElementById('grid'));
  hideCardPreview();
  renderEdgeZones(false);
  renderPlaceRow();
  document.querySelectorAll('.cell-build-overlay').forEach(e => e.remove());
}

// Beschreibungen für Sonderkarten-Mechaniken
const SPECIAL_MECHANIC_DESC = {
  free_build:        'Kostenlos bauen — zählt nicht zum Baulimit',
  minus2_attackers:  '−2 Angreifer vor dem Überfall',
  neighbor_defense:  'Nachbarkarten erhalten +1 Verteidigung',
  neighbor_defense_2:'Nachbarkarten erhalten +2 Verteidigung',
  zwillingsturm:     'Verdoppelt die Punkte aller direkten Nachbarkarten',
  indestructible:    'Kann nie deaktiviert werden',
  reveal_red:        'Deckt roten Würfel (Champion) auf, wenn verborgen',
  reveal_yellow:     'Deckt gelben Würfel (Richtung) auf, wenn verborgen',
  reveal_blue:       'Deckt blauen Würfel (Angreifer) auf, wenn verborgen',
  direct_knight:     'Gibt sofort 2 Ritter beim Bau',
  direct_barrier:    'Gibt sofort 2 Barrieren beim Bau',
  direct_coins:          'Gibt sofort 2 Münzen beim Bau',
  direct_coins_seasonal: 'Münzen je nach Jahreszeit beim Bau',
  dual_res_nahrung:  'Produziert Holz UND Nahrung',
  dual_res_holz:     'Produziert Nahrung UND Holz',
  schutzpatronin:    'Alle fragilen Gebäude erhalten def 2 und werden nicht zerstört',
  dual_res_glas:     'Produziert 2× Glas',
  destroyable:       '15 Punkte — wird bei Deaktivierung zerstört',
  pts_if_plundered:  '0 Punkte wenn aktiv · 8 Punkte wenn deaktiviert',
  season_pts:        'Punkte = Jahreszeit × 2 (max 8 in Herbst)',
  sonder_count:      'Punkte = Anzahl Sonderkarten auf dem Feld × 2',
};

// CARD_INFO: name kommt direkt aus card.name (seit ID-Umbenennung in cards.js)
// desc bleibt hier als Fallback für Karten ohne eigene Beschreibung
function getCardInfo(card) {
  if (!card) return null;
  const name = card.name || card.id;
  const desc = card.special_mechanic
    ? (CARD_DESC_FALLBACK[card.special_mechanic] || '')
    : (CARD_DESC_BY_ID[card.id] || '');
  return { name, desc };
}

function showCardPreview(card) {
  const panel = document.getElementById('card-preview');
  if (!panel || !card) { hideCardPreview(); return; }
  const info = getCardInfo(card);
  const resLabel = card.res === 'holz'    ? `<img src="res-holz.png"    width="14" height="14" style="vertical-align:middle;object-fit:contain;"> Holz`
                 : card.res === 'nahrung' ? `<img src="res-nahrung.png" width="14" height="14" style="vertical-align:middle;object-fit:contain;"> Nahrung`
                 : card.res === 'glas'    ? `<img src="res-glas.png"    width="14" height="14" style="vertical-align:middle;object-fit:contain;"> Glas`
                 : '';

  // Formel-Anzeige (z.B. "🔵×3") und aktuellen Wert berechnen
  const ptsText = card.pts !== undefined ? formatPts(card.pts) : '';
  const currentPts = calcCardPts(card);

  // Ist die Punktezahl dynamisch (nicht fix)?
  const isFixed = typeof card.pts === 'number' ||
                  (card.pts && card.pts.type === 'fixed');
  const showCurrent = !isFixed && currentPts > 0 && G.diceRolled;

  const ptsDisplay = ptsText
    ? (showCurrent ? `★ ${ptsText} = <b>${currentPts}</b> Pkt` : `★ ${ptsText} Pkt`)
    : (currentPts > 0 ? `★ ${currentPts} Pkt` : '');

  const stats = [
    ptsDisplay,
    card.def !== undefined ? `<img src="def-barriere.png" width="12" height="14" style="vertical-align:middle;object-fit:contain;"> ${card.def} Abw` : '',
    resLabel,
    card.upgrade ? '⬆ Stapelbar' : '',
    card.fragile ? '⚡ Einmalig' : '',
  ].filter(Boolean).join('  ·  ');

  panel.innerHTML = `
    <div class="cp-card">${makeCard(card, 44, 61, false)}</div>
    <div class="cp-info">
      <div class="cp-name">${info.name}</div>
      ${stats ? `<div class="cp-stats">${stats}</div>` : ''}
      ${info.desc ? `<div class="cp-desc">${info.desc}</div>` : ''}
    </div>`;
  panel.classList.add('active');
}

function hideCardPreview() {
  const panel = document.getElementById('card-preview');
  if (!panel) return;
  panel.innerHTML = '';
  panel.classList.remove('active');
}

function onHandClick(idx) {
  if (!isPhaseAllowed('card')) { showToast('Karten nur in der Bau-Phase'); return; }
  if (!G.hand[idx]) return;

  if (G.selectedBarrier) { clearSelection(); }
  if (G.selectedHandIdx === idx) {
    clearSelection();
    setHint('Karte wählen');
  } else {
    clearSelection();
    G.selectedHandIdx = idx;
    G.mode = 'card';
    const card = G.hand[idx];
    const playability = getCardPlayability(card);
    if (!playability.playable) {
      setHint(`⊘ ${playability.reason}`, true);
    } else if (playability.coinBypass) {
      setHint(`🪙 ${playability.reason} — Tippe ein Feld zum Bauen`, true);
    } else if (card && card.cat === 'special' && card.special_mechanic && SPECIAL_MECHANIC_DESC[card.special_mechanic]) {
      setHint(`✦ ${SPECIAL_MECHANIC_DESC[card.special_mechanic]}`, true);
    } else {
      setHint('Feld antippen', true);
    }
  }
  renderHand(); renderGrid(true);

  // After renderHand rebuilds DOM, flip the selected card
  if (G.selectedHandIdx === idx) {
    setTimeout(() => {
      const activeIdxs = G.hand.map((c, i) => c ? i : null).filter(i => i !== null);
      const pos = activeIdxs.indexOf(idx);
      const slots = document.querySelectorAll('#hand-cards .hand-card');
      const targetSlot = slots[pos];
      if (targetSlot) {
        const flipEl = targetSlot.querySelector('.card-flip');
        if (flipEl) flipCard(flipEl);
      }
    }, 50);
  }
}

function onBarrierHandClick() {
  if (!isPhaseAllowed('barrier')) { showToast('Barrieren nur in der Verteidigungs-Phase'); return; }
  if (G.barrierHand <= 0) return;
  if (G.selectedBarrier) {
    clearSelection();
    setHint('Karte wählen');
    renderHand(); renderGrid(true);
    return;
  }
  clearSelection();
  G.selectedBarrier = true;
  G.mode = 'barrier';
  setHint('Spalt zwischen zwei Karten antippen', true);
  renderHand();
  renderGrid(true);
  setTimeout(() => renderEdgeZones(true), 50);
}

function onTowerHandClick() {
  if (!isPhaseAllowed('tower')) { showToast('Türme nur in der Verteidigungs-Phase'); return; }
  if (G.coins < RATIO) { showToast(`Nicht genug Münzen (${RATIO} benötigt)`); return; }
  if (G.selectedTower) { clearSelection(); setHint('Karte wählen'); renderHand(); renderGrid(); return; }
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
  // ── Nicht-Karten-Modi zuerst ──────────────────────────────────
  if (G.mode === 'barrier') return;
  if (G.mode === 'tower') {
    if (!G.board[idx] || idx === 4) { showToast('Nur auf Gebäude platzierbar'); return; }
    if (G.fortified[idx]) { showToast('Bereits befestigt'); return; }
    placeTower(idx); return;
  }
  if (G.mode === 'knight') {
    if (!G.board[idx] || idx === 4) { showToast('Nur auf Gebäude platzierbar'); return; }
    placeKnight(idx); return;
  }

  // ── Karte muss ausgewählt sein ────────────────────────────────
  if (G.selectedHandIdx < 0) {
    if (idx === 4) return;
    if (G.board[idx] && !G.plundered[idx]) {
      const cells = document.getElementById('grid').querySelectorAll('.cell');
      const flipEl = cells[idx]?.querySelector('.card-flip');
      if (flipEl) {
        // Clear any existing auto-flip timer first
        if (flipEl._autoFlipTimer) {
          clearTimeout(flipEl._autoFlipTimer);
          flipEl._autoFlipTimer = null;
        }
        if (flipEl.dataset.flipped === '1') {
          // Already flipped — unflip immediately
          unflipCard(flipEl);
        } else {
          // Flip forward, then auto-unflip after 2s
          flipCard(flipEl);
          flipEl._autoFlipTimer = setTimeout(() => {
            unflipCard(flipEl);
            flipEl._autoFlipTimer = null;
          }, 3000);
        }
      }
    }
    return;
  }
  if (idx === 4) return;
  const selCard = G.hand[G.selectedHandIdx];
  if (!selCard) { showToast('Zuerst eine Karte wählen'); return; }

  // ── Zweiter Tap auf dasselbe Feld → platzieren ─────────────────
  if (G.selectedCellIdx === idx) {
    commitPlacement();
    return;
  }

  // ── Validierung vor dem Overlay ───────────────────────────────
  // Sonderkarte: Slot-Kapazität prüfen
  if (selCard.cat === 'special') {
    const sonderCount = G.board.filter((c, i) =>
      c && i !== 4 && c.cat === 'special' && !G.plundered[i]
      && c.special_mechanic !== 'free_build'
    ).length;
    if (sonderCount >= G.rathausLevel) {
      showToast(`Rathaus Level ${G.rathausLevel} — nur ${G.rathausLevel} Sonderkarte${G.rathausLevel > 1 ? 'n' : ''} erlaubt. Rathaus upgraden!`);
      return;
    }
  }
  // Fragile-Konflikt prüfen
  if (selCard.fragile && selCard.special_mechanic) {
    const conflictIdx = findFragileConflict(selCard, idx);
    if (conflictIdx >= 0) { showToast(fragileConflictMessage(selCard.special_mechanic)); return; }
  }
  // Decoy-Regeln
  if (selCard.special_mechanic === 'decoy') {
    if (!G.board[idx]) { showToast('Ablenkungsmanöver braucht eine Karte zum Beschützen'); return; }
    if (G.board[idx].fragile) { showToast('Ablenkungsmanöver nicht auf andere fragile Karten'); return; }
  }

  // ── Erster Tap: Feld merken + Overlay zeigen ─────────────────
  G.selectedCellIdx = idx;

  let overlayClass = 'cell-build-overlay';
  let overlayText  = 'HIER BAUEN';
  if (G.board[idx]) {
    if (selCard.special_mechanic === 'decoy') {
      overlayClass += ' decoy-ol';  overlayText = '🎭 ABLENKEN';
      setHint('Nochmal tippen zum Ablenken', true);
    } else if (canUpgrade(idx, selCard)) {
      overlayClass += ' upgrade-ol'; overlayText = '⬆ UPGRADE';
      setHint('Nochmal tippen zum Upgraden', true);
    } else {
      overlayClass += ' replace-ol'; overlayText = '⚒ ERSETZEN';
      setHint('Nochmal tippen zum Ersetzen', true);
    }
  } else {
    setHint('Nochmal tippen zum Bauen', true);
  }

  // Grid neu rendern (skipGlows=true — kein async Glow-Remove)
  renderGrid(true);

  // Overlay direkt auf die Zelle hängen
  const cells = document.querySelectorAll('#grid .cell');
  const cell  = cells[idx];
  if (cell) {
    const ov = document.createElement('div');
    ov.className = overlayClass;
    ov.innerHTML = `<span>${overlayText}</span>`;
    ov.addEventListener('click',    (e) => { e.stopPropagation(); commitPlacement(); });
    ov.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); commitPlacement(); }, {passive:false});
    cell.appendChild(ov);
  }
}

// ── commitPlacement: State → Render → Draft ─────────────────────────────────
// Einzige Funktion die eine Karte ins Board schreibt.
// Reihenfolge: Validierung → State-Mutation → ALLES synchron rendern → Draft
function commitPlacement() {
  if (G.selectedHandIdx < 0 || G.selectedCellIdx < 0) return;
  const handIdx   = G.selectedHandIdx;
  const targetIdx = G.selectedCellIdx;
  const newCard   = G.hand[handIdx];
  if (!newCard) return;

  const existing = G.board[targetIdx];

  // ── Sonderkarten sind kostenlos — Slot-Prüfung erfolgt in canPlayCard ──

  // ── State-Mutation ─────────────────────────────────────────────
  G.hand[handIdx] = null;

  let placeType = 'build';

  if (!existing) {
    G.board[targetIdx]  = { ...newCard };
    G.stacks[targetIdx] = [{ ...newCard }];
    G.score += calcCardPts(newCard);
    SFX.build();

  } else if (newCard.special_mechanic === 'decoy') {
    const oldPts = calcCardPts(G.board[targetIdx]);
    G.stacks[targetIdx] = [...(G.stacks[targetIdx] || [existing]), { ...newCard }];
    G.board[targetIdx]  = { ...newCard };
    G.fortified[targetIdx] = false;
    G.boosted[targetIdx]   = false;
    G.score = G.score - oldPts + calcCardPts(newCard);
    SFX.build();
    showToast('🎭 Ablenkungsmanöver — schützt die Karte darunter');

  } else if (canUpgrade(targetIdx, newCard)) {
    placeType = 'upgrade';
    const oldPts = calcCardPts(G.board[targetIdx]);
    G.stacks[targetIdx] = [...(G.stacks[targetIdx] || [existing]), { ...newCard }];
    G.board[targetIdx]  = { ...newCard };
    G.score = G.score - oldPts + calcCardPts(newCard);
    const diff = calcCardPts(newCard) - oldPts;
    if (diff !== 0) spawnColoredFloat(targetIdx, `${diff >= 0 ? '+' : ''}${diff}`, diff >= 0 ? 'var(--ink)' : '#c04040');
    SFX.upgrade();
    showToast(`Upgrade · Ressource ×${G.stacks[targetIdx].length}`);

  } else {
    placeType = 'replace';
    const oldPts = calcCardPts(G.board[targetIdx]);
    G.board[targetIdx]  = { ...newCard };
    G.stacks[targetIdx] = [{ ...newCard }];
    G.fortified[targetIdx] = false;
    G.boosted[targetIdx]   = false;
    G.score = G.score - oldPts + calcCardPts(newCard);
    SFX.discard();
    showToast('Gebäude abgerissen und neu gebaut');
  }

  // ── Sonder-Mechaniken (State only, kein Render hier) ──────────
  G.builtThisSeason++;
  const mech = newCard.special_mechanic;
  if (mech === 'free_build') {
    G.builtThisSeason--;
    showToast('Außenposten — zählt nicht zum Baulimit!');
  } else if (mech === 'minus2_attackers') {
    G.bogenwacht = (G.bogenwacht || 0) + 1;
    showToast('Bogenwacht — −2 Angreifer beim nächsten Überfall');
  } else if (mech === 'neighbor_defense') {
    G.schildwall = G.schildwall || new Set();
    G.schildwall.add(targetIdx);
    showToast('Schildwall — Nachbarn erhalten +1 Verteidigung');
  } else if (mech === 'neighbor_defense_2') {
    G.schildwall = G.schildwall || new Set();
    G.schildwall.add(targetIdx);
    showToast('Schildwall — Nachbarn erhalten +2 Verteidigung');
  } else if (mech === 'indestructible') {
    G.fortified[targetIdx] = true;
    showToast('Ewige Bastion — kann nie deaktiviert werden!');
  } else if (mech === 'reveal_red' && G.diceConcealed?.has('red')) {
    G.diceConcealed.delete('red');
    showToast('Spion des Rates — Champion aufgedeckt!');
  } else if (mech === 'reveal_yellow') {
    showToast('Fernkundschafter — Angriffsrichtung wird immer aufgedeckt!');
  } else if (mech === 'reveal_blue') {
    showToast('Zahlmeister — Angreiferzahl wird immer aufgedeckt!');
  } else if (mech === 'direct_knight') {
    G.knights = (G.knights || 0) + 3;
    showToast('Ritterburg — +3 Ritter sofort!');
  } else if (mech === 'direct_barrier') {
    G.barrierHand = (G.barrierHand || 0) + 2;
    showToast('Holzfestung — +2 Barrieren sofort!');
  } else if (mech === 'direct_coins') {
    G.coins = (G.coins || 0) + 2;
    SFX.coin && SFX.coin();
    showToast('Münzprägung — +2 Münzen sofort!');
  } else if (mech === 'direct_coins_seasonal') {
    const earned = G.season; // Winter=0, Frühling=1, Sommer=2, Herbst=3
    G.coins = (G.coins || 0) + earned;
    SFX.coin && SFX.coin();
    showToast(earned > 0 ? `Bankhaus — +${earned} Münzen!` : 'Bankhaus — im Winter keine Münzen');
  } else if (mech === 'force_start' && G.attackDir) {
    G.attackDir = { ...G.attackDir, startCell: targetIdx, direction: GRID_DIRECTION[targetIdx] };
    showToast('🏰 Stadttor — Überfall startet hier!');
  } else if (mech === 'force_dir_cw' && G.attackDir) {
    G.attackDir = { ...G.attackDir, clockwise: true };
    showToast('🧭 Windrose — Überfall läuft ↻');
  } else if (mech === 'force_dir_ccw' && G.attackDir) {
    G.attackDir = { ...G.attackDir, clockwise: false };
    showToast('🧭 Windrose — Überfall läuft ↺');
  }

  // ── Selection leeren (vor Render) ─────────────────────────────
  G.selectedHandIdx    = -1;
  G.selectedCellIdx    = -1;
  G.mode = 'card';
  renderEdgeZones(false);
  renderPlaceRow();
  document.querySelectorAll('.cell-build-overlay').forEach(e => e.remove());

  // ── EINMALIGER synchroner Render-Block ────────────────────────
  // Reihenfolge: Grid → Glows → Würfel → Rathaus → Hand → Ressourcen
  renderGrid(true);        // skipGlows=true: kein async Remove
  renderGroundGlows();     // synchron sofort
  renderDice(false);       // Würfel aktualisieren (reveal etc.)
  renderAttackOrigin();    // Angriffs-Marker
  updateRathausScore();
  renderHand();
  renderProductionPanel();

  // ── cardLand-Animation auf die neu gerenderte Zelle ───────────
  // Erst NACH dem Render-Block, damit die Zelle garantiert im DOM ist
  const freshCells = document.querySelectorAll('#grid .cell');
  const freshCell  = freshCells[targetIdx];
  if (freshCell) {
    freshCell.classList.add('just-placed');
    freshCell.addEventListener('animationend', () => freshCell.classList.remove('just-placed'), {once:true});
    spawnBurst(freshCell);
    if (placeType !== 'build' && calcCardPts(G.board[targetIdx]) > 0) {
      spawnColoredFloat(targetIdx, `+${formatPts(G.board[targetIdx].pts)}`, 'var(--ink)');
    } else if (placeType === 'build' && calcCardPts(G.board[targetIdx]) > 0) {
      spawnFloat(targetIdx, `+${formatPts(G.board[targetIdx].pts)}`);
    }
  }

  // ── Draft vorantreiben (nach allem anderen) ────────────────────
  if (G.builtThisSeason >= 5) {
    DRAFT.active = false;
    G.hand = [];
    renderHand();
    setHint('5 Gebäude errichtet · › weiter', true);
  } else if (DRAFT.active) {
    advanceDraft();
  }
}

function onEdgeClick(key, cellIdx, edge) {
  if (!G.selectedBarrier) return;
  G.selectedBarrierKey = key;
  document.querySelectorAll('.edge-zone').forEach(z => z.classList.remove('target'));
  placeBarrier(key, cellIdx, edge);
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
  if (G.coins < RATIO || !G.board[idx] || G.fortified[idx]) return;
  G.coins -= RATIO;
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
  if (G.coins < RATIO) { clearSelection(); G.mode = 'card'; renderGrid(); }
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
  setHint('Karte wählen');
  showToast('Verteidigung erhöht');
}

function placeBarrier(key, cellIdx, edge) {
  G.barriers.add(key);
  G.barrierHand--;

  renderEdgeZones(false);
  clearSelection();
  renderHand();
  renderGrid();

  // Re-Render der Barrieren + Settle-Animation auf der neuen
  setTimeout(() => {
    renderBarriers();
    const el = document.querySelector(`.edge-barrier[data-edge-key="${key}"]`);
    if (el) {
      el.classList.add('just-placed');
      setTimeout(() => el.classList.remove('just-placed'), 500);
    }
  }, 30);

  const barricaded = isBarricaded(cellIdx);
  setHint('Karte wählen');
  if (barricaded) {
    showToast(`🛡 Feld ${cellIdx} vollständig barrikadiert!`);
  } else {
    showToast('🪵 Barriere errichtet!');
  }
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
  // Alte Barrieren entfernen
  document.querySelectorAll('.edge-barrier').forEach(e => e.remove());
  if (!G.barriers || G.barriers.size === 0) return;

  const gridEl = document.getElementById('grid');
  const cells  = gridEl.querySelectorAll('.cell');

  G.barriers.forEach(key => {
    const [idxStr, edge] = key.split('-');
    const idx  = Number(idxStr);
    const cell = cells[idx];
    if (!cell) return;
    if (!CELL_OUTER_EDGES[idx]?.includes(edge)) return;

    const isH = (edge === 'N' || edge === 'S');

    // Positionierung relativ zur Zelle (50% = Mitte der jeweiligen Kante)
    // Zelle hat overflow:visible, daher ragt die Barriere über den Rand hinaus
    const el = document.createElement('div');
    el.className = 'edge-barrier';
    el.dataset.edgeKey = key;

    // CSS-Positionierung: Mitte der Kante, dann mit translate zentrieren
    let posCSS = '';
    switch (edge) {
      case 'N': posCSS = `left:50%; top:0;    transform:translate(-50%, calc(-50% - ${EDGE_OFFSET}px));`; break;
      case 'S': posCSS = `left:50%; bottom:0; transform:translate(-50%, calc(50% + ${EDGE_OFFSET}px));`;  break;
      case 'W': posCSS = `left:0;   top:50%;  transform:translate(calc(-50% - ${EDGE_OFFSET}px), -50%);`; break;
      case 'O': posCSS = `right:0;  top:50%;  transform:translate(calc(50% + ${EDGE_OFFSET}px), -50%);`;  break;
    }

    el.style.cssText = `position:absolute; pointer-events:none; z-index:49; ${posCSS}`;
    el.innerHTML = makeBarrierSVG(isH);
    cell.appendChild(el);
  });
}

function makeBarrierSVG(isHorizontal) {
  // EIN konsistentes Brett-Design (Draufsicht): waagerecht liegendes Holzbrett.
  // Für O/W-Kanten wird das Brett per CSS um 90° rotiert — gleiche Perspektive,
  // nur andere Orientierung.
  const w = 56, h = 14;
  const bw = 48, bh = 10;
  const x = (w-bw)/2, y = (h-bh)/2;
  const rotation = isHorizontal ? 0 : 90;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"
    viewBox="0 0 ${w} ${h}" overflow="visible"
    style="transform:rotate(${rotation}deg); filter:drop-shadow(0 2px 2px rgba(18,14,10,0.4)) drop-shadow(0 1px 1px rgba(18,14,10,0.2))">
    <!-- Brett-Oberfläche (Draufsicht) -->
    <rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="1.5"
          fill="#c4955a" stroke="#7a5020" stroke-width="0.7"/>
    <!-- Holzmaserung längs -->
    <line x1="${x+2}" y1="${y+bh*0.35}" x2="${x+bw-2}" y2="${y+bh*0.32}"
          stroke="#9a7040" stroke-width="0.5" opacity="0.55"/>
    <line x1="${x+2}" y1="${y+bh*0.65}" x2="${x+bw-2}" y2="${y+bh*0.68}"
          stroke="#9a7040" stroke-width="0.4" opacity="0.45"/>
    <!-- Obere Materialstärken-Kante -->
    <rect x="${x+1}" y="${y-1.5}" width="${bw-2}" height="2" rx="0.5"
          fill="#e8b870" opacity="0.8"/>
    <!-- Glanzlinie -->
    <line x1="${x+1}" y1="${y+1}" x2="${x+bw-1}" y2="${y+1}"
          stroke="rgba(255,255,255,0.28)" stroke-width="0.7"/>
  </svg>`;
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
setHint(PHASE_HINTS[G.phase], false);

// Version anzeigen
const splashVersion = document.getElementById('splash-version');
const headerTitle   = document.getElementById('header-title');
if (splashVersion) splashVersion.textContent = `v${VERSION}`;
if (headerTitle)   headerTitle.textContent   = `Talwacht v${VERSION}`;

// ── Rules Screen ────────────────────────────────────────────────
const rulesEl   = document.getElementById('rules-screen');
let rulesPage   = 0;

function renderRulesPage(idx) {
  const page = RULES_PAGES[idx];
  const pips = document.getElementById('rules-progress');
  pips.innerHTML = RULES_PAGES.map((_,i) =>
    `<div class="rules-pip${i === idx ? ' active' : ''}"></div>`
  ).join('');
  const iconEl = document.getElementById('rules-icon');
  if (['I','II','III','IV','V'].includes(page.icon)) {
    iconEl.innerHTML = `<span style="font-family:'Pirata One',cursive;font-size:2.4rem;color:#d67617;line-height:1;">${page.icon}</span>`;
  } else {
    iconEl.textContent = page.icon;
  }
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


// ── GLOSSAR ─────────────────────────────────────────────────────────
const GLOSSAR_ICONS = [
  { icon: 'res-holz.png',             term: 'Holz',                   def: 'Rohstoff. Wird in der Rüstphase 1:1 in Barrieren umgewandelt.' },
  { icon: 'res-nahrung.png',          term: 'Nahrung',                def: 'Rohstoff. Wird in der Rüstphase 1:1 in Ritter umgewandelt.' },
  { icon: 'res-glas.png',             term: 'Glas',                   def: 'Rohstoff. Wird in der Rüstphase 1:1 in Münzen umgewandelt.' },
  { icon: 'def-barriere.png',         term: 'Barriere',               def: 'Holzwall an der Außenkante eines Randfeldes. Verhindert den Angriffsstart dort.' },
  { icon: 'def-ritter.png',           term: 'Ritter',                 def: 'Verteidiger auf einem Gebäude. Erhöht die Verteidigung um +1, solange die Karte liegt.' },
  { icon: 'res-muenze.png',           term: 'Münze',                  def: 'Währung für Türme (2 Münzen) und Sonderkarten-Bau (1 Münze pro fehlendem Rathaus-Level).' },
  { icon: 'def-turm.png',             term: 'Turm',                   def: 'Permanente Befestigung (2 Münzen). Ein Feld mit Turm kann nie geplündert werden.' },
  { icon: 'icon-defense.png',         term: 'Verteidigung',           def: 'Gibt an wie viele Angreifer ein Gebäude aufhalten kann, bevor es geplündert wird.' },
  { icon: 'icon-vp.png',              term: 'Siegpunkte',             def: 'Werden am Ende jeder Jahreszeit aus allen aktiven Gebäuden addiert. 4 Jahreszeiten ergeben den Gesamtscore.' },
  { icon: 'icon-def-sum.png',         term: 'Summe der Verteidigung', def: 'Gesamte Verteidigung aller Gebäude in der Stadt — inklusive geplünderter Karten.' },
  { icon: 'icon-special.png',         term: 'Sondergebäude',          def: 'Karten mit einzigartigen Fähigkeiten. Kosten beim Bau Münzen je nach fehlendem Rathaus-Level.' },
  { icon: 'icon-fragile.png',         term: 'Fragil',                 def: 'Einmal-Effekt. Fragile Karten werden nach dem Überfall automatisch entfernt.' },
  { icon: 'icon-rathaus-level.png',   term: 'Rathaus-Level',          def: 'Stufe 1–6. Karten mit ⚡ skalieren ihre Punkte mit dem Level. Aufwertung durch Karte unters Rathaus schieben.' },
  { icon: 'icon-free-build.png',      term: 'Kostenlos baubar',       def: 'Diese Karte verbraucht keinen der 5 Bauplätze der Jahreszeit.' },
  { icon: 'icon-neighbor.png',        term: 'Nachbargebäude',         def: 'Direkt angrenzende Felder — horizontal und vertikal. Diagonal zählt nicht.' },
  { icon: 'icon-plundered.png',       term: 'Geplündertes Gebäude',   def: 'Wurde überrannt. Zählt nicht zur Wertung, bleibt aber auf dem Feld bis zum nächsten Bauen.' },
  { icon: 'icon-raid-start.png',      term: 'Start der Plünderung',   def: 'Das Außenfeld von dem der Überfall startet — bestimmt durch den gelben Würfel.' },
  { icon: 'icon-raid-dir.png',        term: 'Laufrichtung',           def: 'Die Richtung in der der Überfall durch die Stadt zieht — mit oder gegen den Uhrzeigersinn.' },
  { icon: 'icon-season-winter.png',   term: 'Winter',                 def: 'Jahreszeit 1. Kurze Runde: nur Bauen, Rüsten und Wertung — kein Überfall.' },
  { icon: 'icon-season-frühling.png', term: 'Frühling',               def: 'Jahreszeit 2. Erste vollständige Runde mit Gerüchten und Überfall.' },
  { icon: 'icon-season-sommer.png',   term: 'Sommer',                 def: 'Jahreszeit 3. Angriffe werden intensiver.' },
  { icon: 'icon-season-herbst.png',   term: 'Herbst',                 def: 'Jahreszeit 4. Letzte Runde. Münzen werden am Ende in Siegpunkte umgewandelt.' },
];

const GLOSSAR_ENTRIES = [
  { term: 'Barriere',         def: 'Holzwall an der Außenkante eines Randfeldes. Sind ALLE Außenkanten barrikadiert, kann dort kein Angriff starten. Der Angriff weicht in Laufrichtung aus. Barrieren bleiben permanent.' },
  { term: 'Ritter',           def: 'Verteidiger auf einem Gebäude. Erhöht die Verteidigung um +1. Bleibt solange die Karte liegt — wird die Karte geplündert, verschwindet auch der Ritter.' },
  { term: 'Münze',            def: 'Währung. Für Türme (2 Münzen) und Sonderkarten (1 Münze pro fehlendem Rathaus-Level). Münzen bleiben über Jahreszeiten erhalten.' },
  { term: 'Turm',             def: 'Permanente Befestigung (2 Münzen). Ein Feld mit Turm ist uneinnehmbar — egal wie stark der Angriff.' },
  { term: 'Rathaus',          def: 'Das feste Gebäude in der Mitte. Kann nicht ersetzt werden. Schiebe eine Karte darunter um es aufzuwerten (max. Level 6) — du erhältst sofort eine Münze.' },
  { term: 'Rathaus-Level',    def: 'Stufe 1–6. Karten mit ⚡ skalieren ihre Punkte mit dem Level. Je höher, desto wertvoller.' },
  { term: 'Rohstoffe',        def: 'Holz, Nahrung und Glas. Werden in der Bauphase produziert und in der Rüstphase zu Barrieren, Rittern und Münzen umgewandelt.' },
  { term: 'Fragile',          def: 'Einmal-Effekt. Fragile Karten werden nach dem Überfall automatisch entfernt.' },
  { term: 'Decoy',            def: 'Sondertyp der Fragile-Karten. Zieht Angreifer auf sich — der restliche Pfad bleibt verschont. Wird danach entfernt.' },
  { term: 'Plündern',         def: 'Ein Gebäude das überrannt wurde gilt als geplündert. Es zählt in der Wertung nicht und bleibt markiert bis zum nächsten Bauen.' },
  { term: 'Siegpunkte',       def: 'Werden am Ende jeder Jahreszeit aus allen aktiven Gebäuden addiert. Nach 4 Jahreszeiten ist der Gesamtscore dein Ergebnis.' },
  { term: 'Champion',         def: 'Der rote Würfel bestimmt eine Sonderfähigkeit der angreifenden Horde — immer eine Überraschung.' },
  { term: 'Angriffsrichtung', def: 'Der gelbe Würfel. Bestimmt von welcher Seite die Horde einmarschiert. Beeinflusst welche Felder zuerst getroffen werden.' },
  { term: 'Upgrade',          def: 'Lege weitere Karten gleichen Rohstoffs auf ein bestehendes Gebäude (max. 6). Erhöht Rohstoffproduktion und oft auch Verteidigung.' },
  { term: 'Innovation (⚡)',   def: 'Karten mit ⚡ skalieren ihre Siegpunkte mit dem Rathaus-Level. Bei Level 6 können sie sehr hohe Punktzahlen erreichen.' },
  { term: 'Stärkende Säulen', def: 'Solange aktiv erhalten alle fragilen Gebäude def 2 und werden nach einem Überfall nicht zerstört.' },
];

function openGlossar() {
  const screen = document.getElementById('glossar-screen');
  const body   = document.getElementById('glossar-body');

  const iconSection = `
    <div class="glossar-section-title">Symbole &amp; Icons</div>
    ${GLOSSAR_ICONS.map(e => `
      <div class="glossar-entry glossar-icon-entry">
        <div class="glossar-icon-wrap">
          <img src="${e.icon}" width="48" height="48" style="object-fit:contain;display:block;" onerror="this.style.opacity='0.15'">
        </div>
        <div class="glossar-icon-text">
          <div class="glossar-term">${e.term}</div>
          <div class="glossar-def">${e.def}</div>
        </div>
      </div>
    `).join('')}
    <div class="glossar-section-title" style="margin-top:20px;">Begriffe</div>
    ${GLOSSAR_ENTRIES.map(e => `
      <div class="glossar-entry">
        <div class="glossar-term">${e.term}</div>
        <div class="glossar-def">${e.def}</div>
      </div>
    `).join('')}
  `;

  body.innerHTML = iconSection;
  screen.classList.add('active');
}


document.getElementById('glossar-close').addEventListener('click', () => {
  document.getElementById('glossar-screen').classList.remove('active');
});
document.getElementById('glossar-screen').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) {
    e.currentTarget.classList.remove('active');
  }
});
document.getElementById('btn-info').addEventListener('click', openGlossar);

// ── Layout-Shift Observer ─────────────────────────────────────────
// Barrieren und Edge-Zonen werden absolut positioniert und müssen
// bei jedem Layout-Shift (Hand hoch/runter, Overlay, Resize) neu
// berechnet werden, damit sie mit dem Grid wandern.
// WICHTIG: Observer wird erst nach 500ms aktiviert, damit die vielen
// Layout-Shifts beim Startup (Font-Loading, Splash, Rules-Screen) ihn
// nicht mehrfach feuern lassen.
{
  let reposTimer = null;
  function reposBarriers() {
    clearTimeout(reposTimer);
    reposTimer = setTimeout(() => {
      renderBarriers();
      // Edge-Zonen nur neu rendern wenn gerade aktiv (Rüstphase)
      if (document.querySelector('.edge-zone')) {
        renderEdgeZones(true);
      }
    }, 80);
  }

  // Grid und Hand beobachten — verzögert starten
  setTimeout(() => {
    const ro = new ResizeObserver(reposBarriers);
    const gridEl = document.getElementById('grid');
    const handEl = document.getElementById('hand-area');
    if (gridEl) ro.observe(gridEl);
    if (handEl) ro.observe(handEl);
  }, 500);

  // Auch window-Resize abfangen (Rotation, Zoom)
  window.addEventListener('resize', reposBarriers, { passive: true });
}
