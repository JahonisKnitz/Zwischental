// ═══════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════
const SEASON_COLORS = {
  winter: '#6899b8',
  spring: '#5a9e6a',
  summer: '#c8940a',
  autumn: '#a04820',
  special:'#7a3a8a',
};

const CAT_CODE = {
  winter:'W', spring:'F', summer:'S', autumn:'H', special:'SB'
};

// ═══════════════════════════════════════════
//  KARTEN-TÖNUNG
// ═══════════════════════════════════════════
const CARD_TONES = {
  yellow:    '#c8940a',
  green:     '#5a9e6a',
  lightblue: '#6899b8',
};

function getCardTone(card) {
  if (!card) return '#7a7060';
  if (card.fragile)        return CARD_TONES.yellow;
  if (card.res)            return CARD_TONES.green;
  return CARD_TONES.lightblue;
}

const BUILDINGS = [
  {id:'W1', name:'Holzfällerruine', cat:'winter', pts:1, def:1, res:'holz', upgrade:true, cap:0},
  {id:'W2', name:'Holzfällerruine', cat:'winter', pts:1, def:1, res:'holz', upgrade:true, cap:0},
  {id:'W3', name:'Holzfäller', cat:'winter', pts:2, def:1, res:'holz', upgrade:true, cap:1},
  {id:'W4', name:'Holzfäller', cat:'winter', pts:2, def:1, res:'holz', upgrade:true, cap:1},
  {id:'W5', name:'Holzfäller', cat:'winter', pts:2, def:1, res:'holz', upgrade:true, cap:1},
  {id:'W6', name:'Bauernhofruine', cat:'winter', pts:1, def:1, res:'nahrung', upgrade:true, cap:0},
  {id:'W7', name:'Bauernhofruine', cat:'winter', pts:1, def:1, res:'nahrung', upgrade:true, cap:0},
  {id:'W8', name:'Kräuterhütte', cat:'winter', pts:2, def:1, res:'nahrung', upgrade:true, cap:1},
  {id:'W9', name:'Kräuterhütte', cat:'winter', pts:2, def:0, res:'nahrung', upgrade:true, cap:1},
  {id:'W10', name:'alter Ofen', cat:'winter', pts:1, def:1, res:'glas', upgrade:true, cap:1},
  {id:'W11', name:'Glasschmelze', cat:'winter', pts:2, def:1, res:'glas', upgrade:true, cap:1},
  {id:'W12', name:'Glasschmelze', cat:'winter', pts:2, def:1, res:'glas', upgrade:true, cap:1},
  {id:'W13', name:'Glasmanufaktur', cat:'winter', pts:2, def:0, res:'glas', upgrade:false, special_mechanic:'dual_res_glas', cap:1},
  {id:'W14', name:'Marktstand', cat:'winter', pts:3, def:1, res:'holz', upgrade:false, special_mechanic:'dual_res_nahrung', cap:2},
  {id:'W15', name:'Wohnhaus', cat:'winter', pts:4, def:0, res:null, upgrade:false, cap:2},
  {id:'W16', name:'verlassenes Gehöft', cat:'winter', pts:3, def:0, res:null, upgrade:false, special_mechanic:'dual_res_glas', cap:4},
  {id:'W17', name:'Brunnen', cat:'winter', pts:1, def:0, res:null, upgrade:false, cap:0},
  {id:'W18', name:'Bibliothek', cat:'winter', pts:5, def:0, res:null, upgrade:false, cap:2},
  {id:'W19', name:'Bronzehändler', cat:'winter', pts:6, def:0, res:null, upgrade:false, cap:2},
  {id:'W20', name:'Nachtwächter', cat:'winter', pts:1, def:3, res:null, upgrade:false, cap:3},
  {id:'W21', name:'Nachtwächter', cat:'winter', pts:1, def:3, res:null, upgrade:false, cap:3},
  {id:'W22', name:'Ausschank', cat:'winter', pts:3, def:2, res:null, upgrade:false, cap:2},
  {id:'W23', name:'Ort der Bekehrung', cat:'winter', pts:2, def:0, res:null, upgrade:false, fragile:true, special_mechanic:'bekehrung', cap:0},
  {id:'W24', name:'offenes Stadttor', cat:'winter', pts:0, def:0, res:null, upgrade:false, fragile:true, special_mechanic:'force_start', cap:1},
  {id:'F1', name:'kleines Holzlager', cat:'spring', pts:3, def:1, res:'holz', upgrade:true, cap:1},
  {id:'F2', name:'kleines Holzlager', cat:'spring', pts:3, def:1, res:'holz', upgrade:true, cap:1},
  {id:'F3', name:'kleine Mühle', cat:'spring', pts:2, def:1, res:'nahrung', upgrade:true, cap:1},
  {id:'F4', name:'kleine Mühle', cat:'spring', pts:2, def:1, res:'nahrung', upgrade:true, cap:1},
  {id:'F5', name:'Glasschmelze', cat:'spring', pts:2, def:1, res:'glas', upgrade:true, cap:1},
  {id:'F6', name:'Glasschmelze', cat:'spring', pts:2, def:1, res:'glas', upgrade:true, cap:1},
  {id:'F7', name:'Glasmanufaktur', cat:'spring', pts:2, def:0, res:'glas', upgrade:false, special_mechanic:'dual_res_glas', cap:1},
  {id:'F8', name:'Marktstand', cat:'spring', pts:3, def:1, res:'holz', upgrade:false, special_mechanic:'dual_res_nahrung', cap:2},
  {id:'F9', name:'verlassenes Gut', cat:'spring', pts:4, def:1, res:null, upgrade:false, cap:4},
  {id:'F10', name:'Wachtstube', cat:'spring', pts:2, def:3, res:null, upgrade:false, cap:3},
  {id:'F11', name:'Wachposten', cat:'spring', pts:3, def:3, res:null, upgrade:false, cap:3},
  {id:'F12', name:'Wachturm', cat:'spring', pts:4, def:3, res:null, upgrade:false, cap:3},
  {id:'F13', name:'Apothekerwagen', cat:'spring', pts:{type:'dice+',color:'yellow',bonus:2}, def:0, res:null, upgrade:false, cap:1},
  {id:'F14', name:'Krämer', cat:'spring', pts:{type:'dice+',color:'blue',bonus:2}, def:0, res:null, upgrade:false, cap:1},
  {id:'F15', name:'Silberhändler', cat:'spring', pts:7, def:1, res:null, upgrade:false, cap:2},
  {id:'F16', name:'Ort der Bekehrung', cat:'spring', pts:2, def:0, res:null, upgrade:false, fragile:true, special_mechanic:'bekehrung', cap:0},
  {id:'F17', name:'Nebeltarnung', cat:'spring', pts:2, def:0, res:null, upgrade:false, fragile:true, special_mechanic:'decoy', cap:0},
  {id:'F18', name:'offenes Stadttor', cat:'spring', pts:0, def:1, res:null, upgrade:false, fragile:true, special_mechanic:'force_start', cap:1},
  {id:'F19', name:'Uhrenturm ↻', cat:'spring', pts:0, def:0, res:null, upgrade:false, fragile:true, special_mechanic:'force_dir_cw', cap:1},
  {id:'F20', name:'Turmuhr ↺', cat:'spring', pts:0, def:0, res:null, upgrade:false, fragile:true, special_mechanic:'force_dir_ccw', cap:1},
  {id:'SO1', name:'Sägemühle', cat:'summer', pts:3, def:2, res:'holz', upgrade:true, cap:1},
  {id:'SO2', name:'Sägemühle', cat:'summer', pts:3, def:2, res:'holz', upgrade:true, cap:1},
  {id:'SO3', name:'Gärtnerei', cat:'summer', pts:3, def:1, res:'nahrung', upgrade:true, cap:1},
  {id:'SO4', name:'Händlerzunft', cat:'summer', pts:5, def:2, res:'holz', upgrade:false, special_mechanic:'dual_res_nahrung', cap:2},
  {id:'SO5', name:'Glashütte', cat:'summer', pts:3, def:1, res:'glas', upgrade:true, cap:1},
  {id:'SO6', name:'Holzbörse', cat:'summer', pts:{type:'res*',res:'holz',factor:2}, def:2, res:'holz', upgrade:true, cap:2},
  {id:'SO7', name:'Kornmühle', cat:'summer', pts:{type:'res*',res:'nahrung',factor:2}, def:2, res:'nahrung', upgrade:true, cap:1},
  {id:'SO8', name:'Wachturm', cat:'summer', pts:4, def:3, res:null, upgrade:false, cap:2},
  {id:'SO9', name:'reisender Veteran', cat:'summer', pts:{type:'dice+',color:'red',bonus:3}, def:1, res:null, upgrade:false, cap:1},
  {id:'SO10', name:'Taverne zum Fass', cat:'summer', pts:5, def:1, res:null, upgrade:false, cap:2},
  {id:'SO11', name:'verlassenes Anwesen', cat:'summer', pts:5, def:1, res:null, upgrade:false, cap:5},
  {id:'SO12', name:'Goldhändler', cat:'summer', pts:8, def:1, res:null, upgrade:false, cap:2},
  {id:'SO13', name:'Nebeltarnung', cat:'summer', pts:2, def:0, res:null, upgrade:false, fragile:true, special_mechanic:'decoy', cap:0},
  {id:'SO14', name:'offenes Stadttor', cat:'summer', pts:0, def:0, res:null, upgrade:false, fragile:true, special_mechanic:'force_start', cap:1},
  {id:'SO15', name:'Uhrenturm ↻', cat:'summer', pts:0, def:0, res:null, upgrade:false, fragile:true, special_mechanic:'force_dir_cw', cap:1},
  {id:'SO16', name:'Turmuhr ↺', cat:'summer', pts:0, def:0, res:null, upgrade:false, fragile:true, special_mechanic:'force_dir_ccw', cap:1},
  {id:'H1', name:'Vorratsfeste', cat:'autumn', pts:6, def:3, res:'holz', upgrade:false, special_mechanic:'dual_res_nahrung', cap:3},
  {id:'H2', name:'Holzhändlerfeste', cat:'autumn', pts:{type:'res*',res:'holz',factor:3}, def:3, res:'holz', upgrade:true, cap:3},
  {id:'H3', name:'Müllergilde', cat:'autumn', pts:{type:'res*',res:'nahrung',factor:3}, def:2, res:'nahrung', upgrade:true, cap:2},
  {id:'H4', name:'Tempel der Winde', cat:'autumn', pts:{type:'dice+',color:'yellow',bonus:4}, def:1, res:null, upgrade:false, cap:2},
  {id:'H5', name:'Pilgerstätte', cat:'autumn', pts:{type:'dice+',color:'blue',bonus:4}, def:1, res:null, upgrade:false, cap:2},
  {id:'H6', name:'Residenz', cat:'autumn', pts:7, def:1, res:null, upgrade:false, cap:3},
  {id:'H7', name:'Burg', cat:'autumn', pts:5, def:4, res:null, upgrade:false, cap:3},
  {id:'H8', name:'Wirtshaus zum Fass', cat:'autumn', pts:6, def:2, res:null, upgrade:false, cap:2},
  {id:'H9', name:'Schatzkammer', cat:'autumn', pts:12, def:0, res:null, upgrade:false, cap:2},
  {id:'H10', name:'Nebeltarnung', cat:'autumn', pts:2, def:0, res:null, upgrade:false, fragile:true, special_mechanic:'decoy', cap:0},
  {id:'H11', name:'Uhrenturm ↻', cat:'autumn', pts:0, def:0, res:null, upgrade:false, fragile:true, special_mechanic:'force_dir_cw', cap:1},
  {id:'H12', name:'Turmuhr ↺', cat:'autumn', pts:0, def:0, res:null, upgrade:false, fragile:true, special_mechanic:'force_dir_ccw', cap:1},
];
const RATHAUS = { id:'rathaus', cat:null, pts:0, def:0, res:null, upgrade:false };

const SPECIAL_BUILDINGS = [
  {id:'Z31', name:'Champion-Arena', cat:'special', pts:{type:'dice*',color:'red',factor:3}, def:3, res:null, upgrade:false, diceColor:'red', cap:2},
  {id:'Z33', name:'Spiegelturm', cat:'special', pts:3, def:2, res:null, upgrade:false, special_mechanic:'zwillingsturm', diceColor:'yellow', cap:3},
  {id:'Z34', name:'Elfenbeinturm', cat:'special', pts:{type:'inno*',factor:3}, def:2, res:null, upgrade:false, diceColor:'blue', cap:1},
  {id:'Z4', name:'Brückenhinterhalt', cat:'special', pts:{type:'def_sum'}, def:0, res:null, upgrade:false, fragile:true, diceColor:'yellow', cap:0},
  {id:'Z5', name:'Treppe zum Himmel', cat:'special', pts:{type:'deact*',factor:3}, def:0, res:null, upgrade:false, fragile:true, diceColor:'red', cap:3},
  {id:'Z6', name:'Ritterburg', cat:'special', pts:6, def:2, res:null, upgrade:false, special_mechanic:'direct_knight', diceColor:'red', cap:3},
  {id:'Z7', name:'stärkende Säulen', cat:'special', pts:4, def:1, res:null, upgrade:false, special_mechanic:'schutzpatronin', diceColor:'yellow', cap:0},
  {id:'Z8', name:'Speicherstadt', cat:'special', pts:6, def:1, res:null, upgrade:false, diceColor:'spring', infinite_cap:true, cap:99},
  {id:'Z3', name:'Gezeiten-Kloster', cat:'special', pts:{type:'season_table',table:[0,4,8,12]}, def:1, res:null, upgrade:false, special_mechanic:'season_pts', diceColor:'spring', cap:2},
  {id:'Z9', name:'Alchemisten-Turm', cat:'special', pts:{type:'res*',res:'glas',factor:3}, def:1, res:'glas', upgrade:false, diceColor:'yellow', cap:3},
  {id:'Z10', name:'Kristallpalast', cat:'special', pts:15, def:0, res:null, upgrade:false, fragile:true, special_mechanic:'destroyable', diceColor:'yellow', cap:0},
  {id:'Z11', name:'Bettler-Orden', cat:'special', pts:0, def:0, res:null, upgrade:true, special_mechanic:'pts_if_plundered', diceColor:'blue', stack_group:'bettler_orden', cap:2},
  {id:'Z12', name:'Bettler-Orden', cat:'special', pts:0, def:0, res:null, upgrade:true, special_mechanic:'pts_if_plundered', diceColor:'blue', stack_group:'bettler_orden', cap:2},
  {id:'Z13', name:'Rote Residenz', cat:'special', pts:{type:'dice+',color:'red',bonus:7}, def:3, res:null, upgrade:false, diceColor:'red', cap:2},
  {id:'Z14', name:'Zitadelle', cat:'special', pts:{type:'dice_sum*',a:'blue',b:'yellow',factor:2}, def:0, res:null, upgrade:false, diceColor:'blue', cap:2},
  {id:'Z15', name:'Architekten-Salon', cat:'special', pts:{type:'sonder_count',factor:2}, def:1, res:null, upgrade:false, special_mechanic:'sonder_count', diceColor:'blue', cap:2},
  {id:'Z16', name:'Außenposten', cat:'special', pts:7, def:2, res:null, upgrade:false, special_mechanic:'free_build', diceColor:'spring', cap:3},
  {id:'Z17', name:'Bogenwacht', cat:'special', pts:5, def:2, res:null, upgrade:true, special_mechanic:'minus2_attackers', diceColor:'red', stack_group:'bogenwacht', cap:2},
  {id:'Z18', name:'Schildtor', cat:'special', pts:3, def:2, res:null, upgrade:true, special_mechanic:'neighbor_defense_2', diceColor:'yellow', stack_group:'schildtor', cap:2},
  {id:'Z19', name:'Luftschloss', cat:'special', pts:7, def:2, res:null, upgrade:false, special_mechanic:'indestructible', diceColor:'blue', cap:2},
  {id:'Z20', name:'Luftschloss', cat:'special', pts:7, def:2, res:null, upgrade:false, special_mechanic:'indestructible', diceColor:'blue', cap:2},
  {id:'Z21', name:'Kartograph', cat:'special', pts:{type:'dice*',color:'yellow',factor:1}, def:1, res:null, upgrade:false, fragile:true, special_mechanic:'reveal_yellow', diceColor:'yellow', cap:2},
  {id:'Z22', name:'Wahrsagerpalast', cat:'special', pts:{type:'dice*',color:'blue',factor:1}, def:1, res:null, upgrade:false, fragile:true, special_mechanic:'reveal_blue', diceColor:'blue', cap:2},
  {id:'Z23', name:'geheime Katakomben', cat:'special', pts:5, def:1, res:null, upgrade:false, diceColor:'yellow', safe_vault:true, cap:5},
  {id:'Z24', name:'Münzprägung', cat:'special', pts:5, def:1, res:null, upgrade:false, special_mechanic:'direct_coins', diceColor:'yellow', cap:3},
  {id:'Z25', name:'Zollbrücke', cat:'special', pts:5, def:1, res:null, upgrade:false, special_mechanic:'direct_coins_seasonal', diceColor:'blue', cap:2},
  {id:'Z26', name:'Handelszentrum', cat:'special', pts:{type:'green*',factor:3}, def:0, res:null, upgrade:false, diceColor:'blue', cap:3},
  {id:'Z27', name:'Bogenwacht', cat:'special', pts:5, def:2, res:null, upgrade:true, special_mechanic:'minus2_attackers', diceColor:'red', stack_group:'bogenwacht', cap:2},
  {id:'Z28', name:'Bogenwacht', cat:'special', pts:5, def:2, res:null, upgrade:true, special_mechanic:'minus2_attackers', diceColor:'red', stack_group:'bogenwacht', cap:2},
  {id:'Z29', name:'Schildtor', cat:'special', pts:4, def:2, res:null, upgrade:true, special_mechanic:'neighbor_defense_2', diceColor:'yellow', stack_group:'schildtor', cap:2},
  {id:'Z30', name:'Schildtor', cat:'special', pts:4, def:2, res:null, upgrade:true, special_mechanic:'neighbor_defense_2', diceColor:'yellow', stack_group:'schildtor', cap:2},
  {id:'Z1', name:'Holzfestung', cat:'special', pts:6, def:2, res:null, upgrade:false, special_mechanic:'direct_barrier', diceColor:'yellow', cap:3},
  {id:'Z2', name:'Lagerfeste', cat:'special', pts:6, def:2, res:null, upgrade:false, special_mechanic:'cap_boost_neighbors', diceColor:'yellow', cap:4},
  {id:'Z32', name:'Schwarze Kathedrale', cat:'special', pts:{type:'sole_survivor',value:48}, def:1, res:null, upgrade:false, diceColor:'red', cap:1},
];


//  SVG CARD RENDERER
//  Stil: weißer Raum, S/W, Tokaido-minimalistisch
//  - Kein Titel (sprachneutral)
//  - Punkte-Banner oben links
//  - Wappenschild unten
//  - Isometrische Bleistift-Illustration
//  - Farbe nur bei Sonderbauten
// ═══════════════════════════════════════════
function makeCard(card, w, h, isRathaus, score, fortified, boosted, plundered, animated) {
  const isSpecial = card.cat === 'special';
  const DICE_COLORS_MAP = { yellow:'#c8a010', blue:'#2a5890', red:'#901828', spring:'#4a9a4a' };
  const sc = isSpecial
    ? (card.diceColor ? (DICE_COLORS_MAP[card.diceColor] || '#6a38a8') : '#6a38a8')
    : '#1a1610';
  const code = card.cat ? (CAT_CODE[card.cat] + card.num) : '';

  // Ressource-Emoji für Icon auf der Karte
  const resEmoji = card.res === 'nahrung' ? '🌾'
                 : card.res === 'holz'    ? '🪵'
                 : card.res === 'glas'    ? '🫙' : '';

  if (isRathaus) return makeRathaus(w, h, score);

  const imgTag  = `<image href="${card.id}.png" x="1" y="1" width="${Math.round(w*0.97)}" height="${Math.round(h*0.98)}" preserveAspectRatio="xMidYMid slice" opacity="1" clip-path="inset(0 round 3px)" onerror="this.style.display='none'"/>`;
  const ill = drawIsoBuilding(card.id, w, h, plundered ? '#a0a098' : sc, isSpecial && !plundered, animated);

  // Punkte-Banner: Jahreszeit-Farbe wenn nicht befestigt; grau wenn geplündert
  const ROYAL   = '#5a2d82';
  const ROYAL_L = '#8a4abf';
  const ROYAL_D = '#2e1245';

  const seasonCol   = plundered ? null : (isSpecial ? SEASON_COLORS[card.cat] : getCardTone(card));
  const bannerFill  = plundered ? '#7a7870'
                    : fortified ? ROYAL
                    : seasonCol;
  const bannerFill2 = plundered ? 'rgba(255,255,255,0.08)'
                    : fortified ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.25)';
  const ptsColor    = plundered ? 'rgba(220,216,210,0.8)' : 'white';

  // Materialstärke des Banners (nur bei fortified)
  const bannerDepth = fortified ? `
  <!-- ── PREMIUM BANNER 3D — königliches Violett ── -->
  <!-- Tiefe Materialstärke: zwei Schichten -->
  <path d="M ${w*0.06} ${h*0.28} L ${w*0.2} ${h*0.34} L ${w*0.34} ${h*0.28}
           L ${w*0.34} ${h*0.315} L ${w*0.2} ${h*0.375} L ${w*0.06} ${h*0.315} Z"
        fill="${ROYAL_D}" opacity="0.95"/>
  <path d="M ${w*0.06} ${h*0.315} L ${w*0.2} ${h*0.375} L ${w*0.34} ${h*0.315}
           L ${w*0.34} ${h*0.332} L ${w*0.2} ${h*0.392} L ${w*0.06} ${h*0.332} Z"
        fill="#1a0830" opacity="0.85"/>
  <!-- Glanzlinie oben — Metallkante -->
  <line x1="${w*0.07}" y1="${h*0.007}" x2="${w*0.33}" y2="${h*0.007}"
        stroke="rgba(220,180,255,0.7)" stroke-width="1.1"/>
  <!-- Seitliche Kanten -->
  <line x1="${w*0.06}" y1="0" x2="${w*0.06}" y2="${h*0.332}"
        stroke="${ROYAL_D}" stroke-width="1.2"/>
  <line x1="${w*0.34}" y1="0" x2="${w*0.34}" y2="${h*0.332}"
        stroke="rgba(180,120,255,0.3)" stroke-width="0.8"/>
  <!-- Innere Prägung — feiner Rahmen wie Samtband -->
  <path d="M ${w*0.09} ${h*0.03} L ${w*0.31} ${h*0.03} L ${w*0.31} ${h*0.24}
           L ${w*0.2} ${h*0.295} L ${w*0.09} ${h*0.24} Z"
        fill="none" stroke="rgba(200,150,255,0.28)" stroke-width="0.7"/>
  ` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="shim${w}${h}${card.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="white" stop-opacity="0"/>
      <stop offset="50%"  stop-color="white" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Hintergrund -->
  <rect width="${w}" height="${h}" rx="3" fill="#fafaf8"/>
  <!-- Rand -->
  <rect x="0.5" y="0.5" width="${w-1}" height="${h-1}" rx="2.5"
        fill="none" stroke="${fortified ? '#6a38a8' : (isSpecial ? SEASON_COLORS[card.cat] : 'rgba(18,14,10,0.12)')}"
        stroke-width="${fortified ? 1.5 : (isSpecial ? 1.5 : 0.8)}"/>

  <!-- PNG — füllt die Karte -->
  ${imgTag}

  <!-- VERTEIDIGUNG SCHILD — über dem PNG -->
  ${fortified
    ? ''
    : makeShield(card.def, w, h, isSpecial ? SEASON_COLORS[card.cat] : null, boosted, card.fragile)}

  <!-- SCHIMMER -->
  <rect width="${w}" height="${h}" rx="3"
        fill="url(#shim${w}${h}${card.id})" pointer-events="none"/>

  ${plundered ? `
  <!-- GEPLÜNDERT-SCHLEIER -->
  <rect width="${w}" height="${h}" rx="3"
        fill="rgba(160,156,148,0.38)" pointer-events="none"/>
  <circle cx="${w-9}" cy="9" r="6" fill="rgba(120,116,110,0.7)"/>
  <line x1="${w-12}" y1="6" x2="${w-6}" y2="12" stroke="white" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="${w-6}"  y1="6" x2="${w-12}" y2="12" stroke="white" stroke-width="1.4" stroke-linecap="round"/>
  ` : ''}

  <!-- Kapazitätspunkte entfernt — Info in Grafiken eingearbeitet -->
</svg>`;
}

// ── Rathaus ──────────────────────────────
function makeRathaus(w, h, score) {
  const cx = w/2, s = score || 0;
  const rathausLevel = G ? (G.rathausLevel || 1) : 1;
  // Vault-Münzen-Bonus: Summe aller gelagerten Münzen × 2
  const vaultTotal = (G && G.vaultCoins) ? G.vaultCoins.reduce((sum, n) => sum + n, 0) : 0;
  const vaultBonus = vaultTotal * 2;
  // Weißer Wert = nur Gebäude-VP (ohne Münzen)
  const buildingScore = Math.max(0, s - vaultBonus);
  const levelDots = Array.from({length: 6}, (_, i) =>
    `<circle cx="${cx - 25 + i*10}" cy="${h*0.90}" r="${h<100?2.8:3.5}"
     fill="${i < rathausLevel ? '#7a3a8a' : 'rgba(18,14,10,0.10)'}"/>`
  ).join('');

  // Banner: obere Hälfte der Karte — kein Gebäude mehr darüber
  const bL   = w*0.06;
  const bR   = w*0.94;
  const bT   = h*0.04;
  const bB   = h*0.56;
  const bTip = h*0.65;
  const tipW = (bR-bL)*0.15;

  // Rathaus-Level-Bereich: untere Hälfte
  const inoY = h*0.76;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="shimR${w}${h}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="white" stop-opacity="0"/>
      <stop offset="52%"  stop-color="white" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="rathausBanner${w}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#9060c8"/>
      <stop offset="35%"  stop-color="#6a38a8"/>
      <stop offset="100%" stop-color="#2e1050"/>
    </linearGradient>
  </defs>

  <!-- Papierstärke -->
  <rect x="1.5" y="${h-2}" width="${w-3}" height="2" rx="1" fill="rgba(18,14,10,0.09)"/>
  <rect x="${w-2}" y="1.5" width="2" height="${h-3}" rx="1" fill="rgba(18,14,10,0.06)"/>

  <!-- Karte Hintergrund -->
  <rect width="${w}" height="${h}" rx="3" fill="#fafaf8"/>
  <rect x="0.5" y="0.5" width="${w-1}" height="${h-1}" rx="2.5"
        fill="none" stroke="#c8a040" stroke-width="1.5"/>
  <rect x="3" y="3" width="${w-6}" height="${h-6}" rx="1.5"
        fill="none" stroke="#c8a040" stroke-width="0.5" opacity="0.4"/>

  <!-- BANNER — Lesezeichen, obere Hälfte -->
  <path d="M ${bL} ${bT} L ${bR} ${bT} L ${bR} ${bB}
           L ${cx + tipW} ${bB} L ${cx} ${bTip}
           L ${cx - tipW} ${bB} L ${bL} ${bB} Z"
        fill="url(#rathausBanner${w})"/>
  <rect x="${bL}" y="${bT}" width="${bR-bL}" height="${(bB-bT)*0.06}"
        fill="rgba(220,180,255,0.2)"/>
  <path d="M ${bL+4} ${bT+4} L ${bR-4} ${bT+4} L ${bR-4} ${bB-3}
           L ${cx + tipW*0.85} ${bB-3} L ${cx} ${bTip-4}
           L ${cx - tipW*0.85} ${bB-3} L ${bL+4} ${bB-3} Z"
        fill="none" stroke="rgba(200,150,255,0.15)" stroke-width="0.8"/>

  <!-- PUNKTZAHL — weiß = Gebäude, gold = Münzen -->
  ${vaultBonus > 0 ? `
  <!-- Mit Münzen: beide Zahlen nebeneinander -->
  <text x="${cx - w*0.13}" y="${bT + (bB-bT)*0.42}" text-anchor="middle" dominant-baseline="middle"
        font-family="'Pirata One',cursive" font-size="${h<100 ? 24 : 32}" font-weight="400"
        fill="white">${buildingScore}</text>
  <text x="${cx + w*0.14}" y="${bT + (bB-bT)*0.42}" text-anchor="middle" dominant-baseline="middle"
        font-family="'Pirata One',cursive" font-size="${h<100 ? 24 : 32}" font-weight="400"
        fill="#e8c840">+${vaultBonus}</text>
  ` : `
  <!-- Ohne Münzen: Gebäude-VP zentriert -->
  <text x="${cx}" y="${bT + (bB-bT)*0.42}" text-anchor="middle" dominant-baseline="middle"
        font-family="'Pirata One',cursive" font-size="${h<100 ? 28 : 38}" font-weight="400"
        fill="white">${buildingScore}</text>
  `}
  <text x="${cx}" y="${bT + (bB-bT)*0.74}" text-anchor="middle" dominant-baseline="middle"
        font-family="'Cinzel',serif" font-size="${h<100 ? 5.5 : 7}" font-weight="400"
        fill="rgba(255,255,255,0.38)" letter-spacing="2.5">PUNKTE</text>

  <!-- RATHAUS LEVEL — Zahl -->
  <text x="${cx}" y="${inoY}" text-anchor="middle" dominant-baseline="middle"
        font-family="'Cinzel',serif" font-size="${h<100 ? 15 : 19}" font-weight="700"
        fill="${rathausLevel > 1 ? '#7a3a8a' : 'rgba(18,14,10,0.12)'}">${rathausLevel}</text>
  <text x="${cx}" y="${inoY + (h<100?12:15)}" text-anchor="middle" dominant-baseline="middle"
        font-family="'Cinzel',serif" font-size="${h<100 ? 5 : 6.5}" font-weight="400"
        fill="rgba(18,14,10,0.22)" letter-spacing="2">RATHAUS</text>
  <!-- 6 Level-Pips -->
  ${levelDots}
  <!-- Schimmer -->
  <rect width="${w}" height="${h}" rx="3"
        fill="url(#shimR${w}${h})" pointer-events="none"/>
</svg>`;
}

// ── Blitz-SVG für Innovation ──────────────────────────────────────
function makeLightningSVG(size, color) {
  const c = color || '#1a1610';
  return `<svg width="${size}" height="${size*1.3}" viewBox="0 0 10 13">
    <path d="M 7 0 L 2 7 L 5 7 L 3 13 L 10 5 L 6.5 5 Z"
          fill="${c}" stroke="${c}" stroke-width="0.3"
          stroke-linejoin="round"/>
  </svg>`;
}
// Turm-Token: ersetzt das Schild auf befestigten Karten vollständig
// Koordinaten exakt aus makeShield übernommen damit der Turm die gleiche
// Fläche belegt wie das Schild
function makeTowerToken(w, h, boosted) {
  // Identisch mit makeShield-Koordinaten
  const x  = w * 0.270;
  const hw = w * 0.080;
  const y0 = h * 0.580;
  const y2 = y0 + h * 0.140;
  const midY = (y0 + y2) / 2 + h * 0.008;

  // Turm-Körper: füllt den Schild-Bereich aus
  const tx  = x - hw * 0.95;  // linke Kante
  const tw  = hw * 1.90;       // Breite
  const th  = y2 - y0;         // Höhe (= Schildhöhe)
  const mh  = th * 0.26;       // Zinnen-Höhe
  const mw  = tw / 5.2;        // Zinnen-Breite
  const mg  = mw * 0.55;       // Lücke zwischen Zinnen

  // Drei Zinnen oben auf dem Turm
  const merlons = [-tw*0.28, 0, tw*0.28].map(dx => {
    const mx = x + dx - mw/2;
    return `<rect x="${mx.toFixed(1)}" y="${(y0 - mh).toFixed(1)}"
      width="${mw.toFixed(1)}" height="${mh.toFixed(1)}"
      rx="0.5" fill="#5a2888"/>`;
  }).join('');

  // Tor (kleiner Bogen in Turmmitte)
  const gateW = tw * 0.30, gateH = th * 0.32;
  const gx = x - gateW/2, gy = y2 - gateH;

  return `
  <!-- Turm-Körper -->
  <rect x="${tx.toFixed(1)}" y="${y0.toFixed(1)}"
        width="${tw.toFixed(1)}" height="${th.toFixed(1)}"
        rx="1" fill="#3a1a60" opacity="0.93"/>
  <!-- Helles oberes Drittel -->
  <rect x="${tx.toFixed(1)}" y="${y0.toFixed(1)}"
        width="${tw.toFixed(1)}" height="${(th*0.28).toFixed(1)}"
        rx="1" fill="#6a38a8" opacity="0.60"/>
  <!-- Tor-Bogen -->
  <rect x="${gx.toFixed(1)}" y="${gy.toFixed(1)}"
        width="${gateW.toFixed(1)}" height="${(gateH*0.6).toFixed(1)}"
        rx="${(gateW*0.5).toFixed(1)}" fill="#1a0a30" opacity="0.85"/>
  <!-- Drei Zinnen -->
  ${merlons}
  <!-- Kontur -->
  <rect x="${tx.toFixed(1)}" y="${y0.toFixed(1)}"
        width="${tw.toFixed(1)}" height="${th.toFixed(1)}"
        rx="1" fill="none" stroke="#8a58c8" stroke-width="0.8"/>
  <!-- Ritter-Bonus falls vorhanden -->
  ${(boosted||0) > 0 ? `
  <text x="${x}" y="${midY}" text-anchor="middle" dominant-baseline="middle"
    font-family="'Cinzel',serif" font-size="${h<100 ? 7 : 9}" font-weight="700"
    fill="#3db870">${boosted}</text>` : ''}`;
}

function makeShield(def, w, h, color, boosted, fragile) {
  const x  = w * 0.270;
  const hw = w * 0.080;

  const y0 = h * 0.580;
  const y1 = y0 + h * 0.140 * 0.7;
  const y2 = y0 + h * 0.140;

  const sc = color || '#6a6860';
  const numColor = boosted ? '#3db870' : 'white';
  const midY = (y0 + y2) / 2 + h * 0.008;

  // Blitz-Pfad zentriert auf (x, midY), Größe abhängig von Schildgröße
  const bh = (y2 - y0) * 0.75;
  const bw = bh * 0.55;
  const bx = x, by = midY;
  const lightningPath = `M ${bx+bw*0.3} ${by-bh*0.5} L ${bx-bw*0.2} ${by+bh*0.05} L ${bx+bw*0.1} ${by+bh*0.05} L ${bx-bw*0.3} ${by+bh*0.5} L ${bx+bw*0.2} ${by-bh*0.05} L ${bx-bw*0.1} ${by-bh*0.05} Z`;

  return `
  <path d="M ${x-hw} ${y0} L ${x+hw} ${y0} L ${x+hw} ${y1}
           Q ${x+hw} ${y2} ${x} ${y2+h*0.003}
           Q ${x-hw} ${y2} ${x-hw} ${y1} Z"
        fill="${sc}" opacity="0.9"/>
  <path d="M ${x-hw} ${y0} L ${x+hw} ${y0} L ${x+hw} ${y0+h*0.02} L ${x-hw} ${y0+h*0.02} Z"
        fill="rgba(255,255,255,0.18)"/>

  ${boosted ? `
  <text x="${x}" y="${y0 - h*0.042}" text-anchor="middle" dominant-baseline="middle"
        font-family="'Cinzel',serif" font-size="${h<100 ? 22 : 29}" font-weight="700"
        fill="#1a1610" opacity="0.85">+</text>` : ''}

  ${fragile
    ? `<path d="${lightningPath}" fill="white" opacity="0.95"/>`
    : `<text x="${x}" y="${midY}" text-anchor="middle" dominant-baseline="middle"
        font-family="'Cinzel',serif" font-size="${h<100 ? 11 : 14}" font-weight="700"
        fill="${numColor}">${def + (boosted||0)}</text>`
  }`;
}

// ── Ressource Glyphen ────────────────────
function drawGlyph(type, w, h) {
  const x = w*0.5, y = h*0.78, s = 'rgba(18,14,10,0.5)';
  if (type === 'grain') return `
    <line x1="${x-8}" y1="${y+3}" x2="${x-8}" y2="${y-6}" stroke="${s}" stroke-width="0.8"/>
    <ellipse cx="${x-8}" cy="${y-7}" rx="3.5" ry="2.5" fill="none" stroke="${s}" stroke-width="0.7"/>
    <line x1="${x}" y1="${y+3}" x2="${x}" y2="${y-8}" stroke="${s}" stroke-width="0.8"/>
    <ellipse cx="${x}" cy="${y-9}" rx="3.5" ry="2.5" fill="none" stroke="${s}" stroke-width="0.7"/>
    <line x1="${x+8}" y1="${y+3}" x2="${x+8}" y2="${y-6}" stroke="${s}" stroke-width="0.8"/>
    <ellipse cx="${x+8}" cy="${y-7}" rx="3.5" ry="2.5" fill="none" stroke="${s}" stroke-width="0.7"/>`;
  if (type === 'log') return `
    <ellipse cx="${x}" cy="${y}" rx="11" ry="5" fill="none" stroke="${s}" stroke-width="0.9"/>
    <line x1="${x-11}" y1="${y}" x2="${x+11}" y2="${y}" stroke="${s}" stroke-width="0.6" opacity="0.4"/>
    <ellipse cx="${x}" cy="${y}" rx="5" ry="2.5" fill="none" stroke="${s}" stroke-width="0.6" opacity="0.5"/>
    <ellipse cx="${x}" cy="${y}" rx="2" ry="1" fill="none" stroke="${s}" stroke-width="0.5" opacity="0.4"/>`;
  if (type === 'scale') return `
    <line x1="${x}" y1="${y-7}" x2="${x}" y2="${y+5}" stroke="${s}" stroke-width="0.8"/>
    <line x1="${x-9}" y1="${y-3}" x2="${x+9}" y2="${y-3}" stroke="${s}" stroke-width="0.8"/>
    <line x1="${x-9}" y1="${y-3}" x2="${x-9}" y2="${y+2}" stroke="${s}" stroke-width="0.7"/>
    <line x1="${x+9}" y1="${y-3}" x2="${x+9}" y2="${y+2}" stroke="${s}" stroke-width="0.7"/>
    <ellipse cx="${x-9}" cy="${y+2}" rx="4.5" ry="2" fill="none" stroke="${s}" stroke-width="0.7"/>
    <ellipse cx="${x+9}" cy="${y+2}" rx="4.5" ry="2" fill="none" stroke="${s}" stroke-width="0.7"/>`;
  return '';
}

// ═══════════════════════════════════════════
//  ISO BUILDING SKETCHES
//  echte 3-seitige Isometrie: links, rechts, oben
// ═══════════════════════════════════════════
function drawIsoBuilding(id, w, h, stroke, isSpecial, animated) {
  const zone_y = h * 0.06;
  const zone_h = h * 0.80;
  const cx = w / 2;
  const cy = zone_y + zone_h * 0.72;
  const u = Math.min(w, h) * 0.09;

  // Ressource → Illustration:
  //   Holz    → Wassermühle (dreht sich)
  //   Nahrung → Windmühle  (dreht sich)
  //   Glas    → Glasschmelze (qualmt)

  const WATER  = () => isoWatermill(cx, cy, u, stroke, animated);
  const WIND   = () => isoWindmill(cx, cy, u, stroke, animated);
  const FORGE  = () => isoGlassForge(cx, cy, u, stroke, animated);
  const TOWER  = (s=1.5, h2=3.8) => isoTower(cx, cy, u*s, u*h2, u*s, stroke, isSpecial);
  const HOUSE  = (bw=2,bh=2,bd=2,rh=1.5) => isoHouse(cx, cy, u*bw, u*bh, u*bd, u*rh, stroke);
  const CHAPEL = () => isoChapel(cx, cy, u, stroke);
  const CATH   = () => isoCathedral(cx, cy, u, stroke);
  const MANOR  = () => isoManor(cx, cy, u, stroke);

  const map = {
    // ── Rathaus ──
    rathaus:  () => isoTower(cx, cy, u*2.0, u*3.5, u*2.0, stroke, isSpecial),

    // ── WINTER ──
    W1: WATER, W2: WATER, W3: WATER,           // Holzfäller
    W4: WIND,  W5: WIND,  W6: WIND,            // Bauernhof
    W7: FORGE, W8: FORGE, W9: FORGE,           // Glashütte
    W10: () => HOUSE(2.2, 1.8, 2.2, 1.2),      // Ratskeller
    W11: () => HOUSE(2.2, 1.8, 2.2, 1.2),
    W12: WATER,                                 // Holzfäller ⚡
    W13: WIND,                                  // Bauernhof ⚡
    W14: MANOR, W15: MANOR,                    // Bibliothek
    W16: () => HOUSE(1.8, 1.4, 1.8, 1.0),      // Grundschule
    W17: () => HOUSE(1.8, 1.4, 1.8, 1.0),
    W18: () => TOWER(1.4, 3.2),                // Sternwarte
    W19: () => HOUSE(2.0, 1.6, 2.0, 1.0),      // Schmuckhändler
    W20: () => TOWER(1.2, 2.4), W21: () => TOWER(1.2, 2.4), // Wachposten
    W22: MANOR,                                // Gaukler
    W23: () => TOWER(1.4, 2.8), W24: () => TOWER(1.4, 2.8), // Stadttor

    // ── FRÜHLING ──
    F1: WATER,  F2: WATER,                     // Sägemühle
    F3: WIND,   F4: WIND,                      // Mühle
    F5: FORGE,  F6: FORGE, F7: FORGE,          // Schmelze
    F8: () => HOUSE(2.5, 1.6, 2.5, 1.0),       // Marktplatz
    F9: () => HOUSE(2.5, 1.6, 2.5, 1.0),
    F10: () => TOWER(1.4, 3.5), F11: () => TOWER(1.4, 3.5), F12: () => TOWER(1.4, 3.5), // Wachturm
    F13: MANOR, F14: MANOR,                    // Orakel
    F15: () => HOUSE(2.0, 1.6, 2.0, 1.0),      // Diamanthändler
    F16: () => TOWER(1.4, 3.2),                // Observatorium
    F17: MANOR,                                // Gaukler
    F18: () => TOWER(1.4, 2.8),               // Stadttor
    F19: MANOR, F20: MANOR,                   // Windrose

    // ── SOMMER ──
    SO1: WATER, SO2: WATER,                    // Forsthaus
    SO3: WIND,  SO4: WIND,                     // Erntehof
    SO5: FORGE,                                // Glashütte
    SO6: () => TOWER(2.0, 4.2),               // Schloss
    SO7: MANOR, SO8: MANOR,                   // Prophet
    SO9: WATER,                                // Forstwirtschaft
    SO10: WIND,                                // Brauerei
    SO11: () => HOUSE(2.8, 1.8, 2.8, 1.0),    // Markthalle
    SO12: () => HOUSE(2.2, 1.8, 2.2, 1.2),    // Juwelenhändler
    SO13: MANOR,                               // Gaukler
    SO14: () => TOWER(1.4, 2.8),              // Stadttor
    SO15: MANOR, SO16: MANOR,                 // Windrose

    // ── HERBST ──
    H1: () => HOUSE(3.0, 2.0, 3.0, 1.2),      // Großbasar
    H2: () => TOWER(2.2, 4.8),                // Palast
    H3: () => TOWER(2.4, 4.0),                // Burg
    H4: MANOR, H5: MANOR,                     // Seher
    H6: WATER,                                 // Zimmerwerk
    H7: WIND,                                  // Kornkammer
    H8: () => HOUSE(2.6, 2.2, 2.6, 1.6),      // Handelsgilde
    H9: () => HOUSE(2.4, 2.0, 2.4, 1.4),      // Schatzkammer
    H10: MANOR,                                // Gaukler
    H11: MANOR, H12: MANOR,                   // Windrose

    // ── SONDERKARTEN ──
    Z1: () => HOUSE(3.2, 1.6, 3.2, 0.6),      // Blutarena
    Z2: () => TOWER(1.8, 3.8),                // Zwillingsturm
    Z3: CATH,                                  // Akademie
    Z4: () => HOUSE(3.4, 1.8, 3.4, 0.8),      // Trojanisches Pferd
    Z5: MANOR,                                 // Ruinenmagier
    Z6: () => TOWER(1.8, 4.2),                // Ritterburg
    Z7: WIND,                                  // Gewürzmarkt
    Z8: CATH,                                  // Druidenzirkel
    Z9: FORGE,                                 // Alchemistenlabor
    Z10: () => TOWER(2.0, 4.5),               // Kristallpalast
    Z11: () => TOWER(1.6, 3.2), Z12: () => TOWER(1.6, 3.2), // Versicherung
    Z13: () => TOWER(2.0, 3.0),               // Rote Residenz
    Z14: MANOR,                                // Nebelbastei
    Z15: () => HOUSE(2.8, 2.0, 2.8, 1.4),     // Immobilienhändler
    Z16: () => HOUSE(1.6, 1.2, 1.6, 0.8),     // Außenposten
    Z17: () => TOWER(1.4, 3.0), Z18: () => TOWER(1.4, 3.0), // Bogenwacht ×3
    Z19: () => TOWER(2.0, 3.8), Z20: () => TOWER(2.0, 3.8), // Ewige Bastion ×2
    Z21: MANOR,                                // Fernkundschafter
    Z22: MANOR,                                // Zahlmeister
    Z23: () => TOWER(1.2, 2.2), Z24: () => TOWER(1.2, 2.2), // Münzprägung ×2
    Z25: () => HOUSE(2.4, 2.0, 2.4, 1.4),     // Bankhaus
    Z26: () => HOUSE(2.8, 2.2, 2.8, 1.6),     // Handelszentrum
    Z27: () => TOWER(1.4, 3.0),               // Bogenwacht (weitere)
    Z28: () => TOWER(1.4, 3.0),
    Z29: () => HOUSE(2.8, 1.6, 2.8, 0.8),     // Schildtor (weitere)
    Z30: () => HOUSE(2.8, 1.6, 2.8, 0.8),
  };

  return (map[id] || HOUSE)();
}

// ── ISO-Primitiven ───────────────────────

// Würfelhaus mit Giebeldach
function isoHouse(cx, cy, bw, bh, bd, rh, s) {
  // b=Boden, w=Breite, h=Höhe, d=Tiefe, r=Dachhöhe
  // Isometrie: x-Achse geht rechts-unten, z-Achse links-unten, y=oben
  // 2:1 Isometrie vereinfacht
  const lx = bw * 0.86, ly = bw * 0.5;  // links
  const rx = bw * 0.86, ry = bw * 0.5;  // rechts
  const fill_top  = 'rgba(18,14,10,0.04)';
  const fill_left = 'rgba(18,14,10,0.12)';
  const fill_right= 'rgba(18,14,10,0.07)';
  const fill_roof_l='rgba(18,14,10,0.18)';
  const fill_roof_r='rgba(18,14,10,0.10)';

  // Eck-Punkte Grundriss
  const front = [cx,        cy       ]; // vorne
  const right = [cx+lx,     cy-ly    ]; // rechts
  const back  = [cx,        cy-ly*2  ]; // hinten
  const left  = [cx-rx,     cy-ry    ]; // links

  // Hochgezogen um bh
  const frontT = [front[0], front[1]-bh];
  const rightT = [right[0], right[1]-bh];
  const backT  = [back[0],  back[1] -bh];
  const leftT  = [left[0],  left[1] -bh];

  // Dachfirst (Mitte oben)
  const ridgeF = [cx,       frontT[1]-rh];
  const ridgeB = [cx,       backT[1] -rh];

  const P = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

  return `
  <!-- Linke Wand -->
  <polygon points="${P(front)} ${P(frontT)} ${P(leftT)} ${P(left)}"
           fill="${fill_left}" stroke="${s}" stroke-width="0.8" stroke-linejoin="round"/>
  <!-- Rechte Wand -->
  <polygon points="${P(front)} ${P(frontT)} ${P(rightT)} ${P(right)}"
           fill="${fill_right}" stroke="${s}" stroke-width="0.8" stroke-linejoin="round"/>
  <!-- Dach links -->
  <polygon points="${P(frontT)} ${P(leftT)} ${P(ridgeB)} ${P(ridgeF)}"
           fill="${fill_roof_l}" stroke="${s}" stroke-width="0.8" stroke-linejoin="round"/>
  <!-- Dach rechts -->
  <polygon points="${P(frontT)} ${P(rightT)} ${P(ridgeB)} ${P(ridgeF)}"
           fill="${fill_roof_r}" stroke="${s}" stroke-width="0.8" stroke-linejoin="round"/>
  <!-- Giebel links sichtbar (vorne) -->
  <polygon points="${P(frontT)} ${P(ridgeF)} ${P(frontT)}"
           fill="none" stroke="${s}" stroke-width="0.6"/>`;
}

// Turm (quadratisch, kein Giebel, Zinnen)
function isoTower(cx, cy, tw, th, td, s, gold) {
  const lx = tw*0.86, ly = tw*0.5;
  const fill_left = 'rgba(18,14,10,0.14)';
  const fill_right= 'rgba(18,14,10,0.07)';
  const fill_top  = gold ? 'rgba(200,160,64,0.15)' : 'rgba(18,14,10,0.03)';

  const front = [cx,    cy    ];
  const right = [cx+lx, cy-ly ];
  const back  = [cx,    cy-ly*2];
  const left  = [cx-lx, cy-ly ];
  const fT=[front[0],front[1]-th], rT=[right[0],right[1]-th],
        bT=[back[0], back[1]-th],  lT=[left[0], left[1]-th];
  const P = p=>`${p[0].toFixed(1)},${p[1].toFixed(1)}`;

  // Zinnen (vereinfacht): 3 Blöcke oben links und rechts
  const crenH = th*0.12, crenW = lx*0.3;
  let crenels = '';
  for (let i=0;i<3;i++) {
    const t = i/3;
    const bx = lT[0]*(1-t) + fT[0]*t;
    const by = lT[1]*(1-t) + fT[1]*t;
    if(i%2===0) crenels += `<polygon points="${bx},${by} ${bx},${by-crenH} ${bx+crenW*0.5},${by-crenH} ${bx+crenW*0.5},${by}" fill="${fill_left}" stroke="${s}" stroke-width="0.6"/>`;
    const bx2 = fT[0]*(1-t) + rT[0]*t;
    const by2 = fT[1]*(1-t) + rT[1]*t;
    if(i%2===0) crenels += `<polygon points="${bx2},${by2} ${bx2},${by2-crenH} ${bx2+crenW*0.5},${by2-crenH} ${bx2+crenW*0.5},${by2}" fill="${fill_right}" stroke="${s}" stroke-width="0.6"/>`;
  }

  return `
  <polygon points="${P(front)} ${P(fT)} ${P(lT)} ${P(left)}"   fill="${fill_left}"  stroke="${s}" stroke-width="0.9"/>
  <polygon points="${P(front)} ${P(fT)} ${P(rT)} ${P(right)}"  fill="${fill_right}" stroke="${s}" stroke-width="0.9"/>
  <polygon points="${P(fT)} ${P(rT)} ${P(bT)} ${P(lT)}"         fill="${fill_top}"   stroke="${s}" stroke-width="0.9"/>
  ${crenels}`;
}

// Kapelle: Haus + kleiner Turm + Kreuz
function isoChapel(cx, cy, u, s) {
  return isoHouse(cx, cy, u*2.2, u*1.6, u*2.2, u*1.8, s) +
    isoTower(cx, cy-u*1.4, u*0.9, u*2.0, u*0.9, s, false) +
    `<line x1="${cx}" y1="${(cy-u*1.4)-u*2.8}" x2="${cx}" y2="${(cy-u*1.4)-u*1.9}" stroke="${s}" stroke-width="1"/>
     <line x1="${cx-u*0.5}" y1="${(cy-u*1.4)-u*2.5}" x2="${cx+u*0.5}" y2="${(cy-u*1.4)-u*2.5}" stroke="${s}" stroke-width="1"/>`;
}

// Marktstand: Dach ohne Wände, Tisch
function isoStall(cx, cy, u, s) {
  const bw=u*2.8, bh=u*0.3, bd=u*2.0;
  const lx=bw*0.86, ly=bw*0.5;
  const fill='rgba(18,14,10,0.08)';
  const top=[cx,cy-bh*2], r=[cx+lx,cy-ly-bh*2], b=[cx,cy-ly*2-bh*2], l=[cx-lx,cy-ly-bh*2];
  const P=p=>`${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  // Dach-Plane (flach, etwas geneigt)
  const roofH=u*1.2;
  return `
  <polygon points="${P(top)} ${P(r)} ${P(b)} ${P(l)}" fill="${fill}" stroke="${s}" stroke-width="0.9"/>
  <!-- Dachüberhang -->
  <line x1="${top[0]-lx*1.1}" y1="${top[1]-ly*1.1-roofH*0.5}" x2="${r[0]+lx*0.1}" y2="${r[1]-ly*0.1-roofH*0.5}" stroke="${s}" stroke-width="1.2"/>
  <!-- Tisch-Beine -->
  <line x1="${cx-lx*0.6}" y1="${cy-ly*0.6}" x2="${cx-lx*0.6}" y2="${cy+u}" stroke="${s}" stroke-width="0.8"/>
  <line x1="${cx+lx*0.6}" y1="${cy-ly*0.6}" x2="${cx+lx*0.6}" y2="${cy+u}" stroke="${s}" stroke-width="0.8"/>`;
}

function isoWindmill(cx, cy, u, s, animated) {
  const base = isoTower(cx, cy, u*1.2, u*2.2, u*1.2, s, false);
  const wx = cx, wy = cy - u*2.2 - u*0.3;
  const arm = u * 2.1;
  const dur = (3.2 + Math.random() * 1.2).toFixed(1);
  const blades = `
  <line x1="${wx}" y1="${wy}" x2="${wx}" y2="${wy - arm}" stroke="${s}" stroke-width="1.1"/>
  <ellipse cx="${wx}" cy="${wy - arm*0.55}" rx="${u*0.55}" ry="${u*0.2}" fill="rgba(18,14,10,0.08)" stroke="${s}" stroke-width="0.6"/>
  <line x1="${wx}" y1="${wy}" x2="${wx}" y2="${wy + arm}" stroke="${s}" stroke-width="1.1"/>
  <ellipse cx="${wx}" cy="${wy + arm*0.55}" rx="${u*0.55}" ry="${u*0.2}" fill="rgba(18,14,10,0.08)" stroke="${s}" stroke-width="0.6"/>
  <line x1="${wx}" y1="${wy}" x2="${wx - arm}" y2="${wy}" stroke="${s}" stroke-width="1.1"/>
  <ellipse cx="${wx - arm*0.55}" cy="${wy}" rx="${u*0.2}" ry="${u*0.55}" fill="rgba(18,14,10,0.08)" stroke="${s}" stroke-width="0.6"/>
  <line x1="${wx}" y1="${wy}" x2="${wx + arm}" y2="${wy}" stroke="${s}" stroke-width="1.1"/>
  <ellipse cx="${wx + arm*0.55}" cy="${wy}" rx="${u*0.2}" ry="${u*0.55}" fill="rgba(18,14,10,0.08)" stroke="${s}" stroke-width="0.6"/>
  <circle cx="${wx}" cy="${wy}" r="${u*0.28}" fill="white" stroke="${s}" stroke-width="0.9"/>`;

  return base + `<g>${animated ? `
    <animateTransform attributeName="transform" type="rotate"
      from="0 ${wx.toFixed(1)} ${wy.toFixed(1)}"
      to="360 ${wx.toFixed(1)} ${wy.toFixed(1)}"
      dur="${dur}s" repeatCount="indefinite"/>` : ''}
    ${blades}
  </g>`;
}

function isoWatermill(cx, cy, u, s, animated) {
  const base = isoHouse(cx, cy, u*2.2, u*1.8, u*2.2, u*1.4, s);
  const rx = cx - u*2.0, ry = cy - u*0.6;
  const rr = u * 1.4;
  const dur = (4.5 + Math.random()).toFixed(1);
  let spokes = '';
  for (let i = 0; i < 6; i++) {
    const a  = (i / 6) * Math.PI * 2;
    const x2 = (Math.cos(a) * rr).toFixed(1);
    const y2 = (Math.sin(a) * rr).toFixed(1);
    spokes += `<line x1="0" y1="0" x2="${x2}" y2="${y2}" stroke="${s}" stroke-width="0.7"/>`;
    spokes += `<line x1="${(Math.cos(a+0.3)*rr*0.7).toFixed(1)}" y1="${(Math.sin(a+0.3)*rr*0.7).toFixed(1)}"
      x2="${(Math.cos(a-0.3)*rr*0.7).toFixed(1)}" y2="${(Math.sin(a-0.3)*rr*0.7).toFixed(1)}"
      stroke="${s}" stroke-width="1.0" opacity="0.7"/>`;
  }
  return base + `
  <g transform="translate(${rx.toFixed(1)},${ry.toFixed(1)})">
    ${animated ? `<animateTransform attributeName="transform" type="rotate"
      from="0 0 0" to="360 0 0"
      dur="${dur}s" repeatCount="indefinite" additive="sum"/>` : ''}
    <circle cx="0" cy="0" r="${rr}" fill="none" stroke="${s}" stroke-width="0.9"/>
    <circle cx="0" cy="0" r="${(rr*0.18).toFixed(1)}" fill="rgba(18,14,10,0.1)" stroke="${s}" stroke-width="0.7"/>
    ${spokes}
  </g>
  <line x1="${rx-rr*1.2}" y1="${ry+rr*0.7}" x2="${rx+rr*1.2}" y2="${ry+rr*0.7}"
        stroke="${s}" stroke-width="0.5" opacity="0.25"/>`;
}

function isoGlassForge(cx, cy, u, s, animated) {
  const base = isoHouse(cx, cy, u*2.4, u*1.8, u*2.0, u*1.2, s);
  const tx = cx - u*1.0, ty = cy - u*2.8;
  const tw = u*0.7, th = u*2.0;
  const chimney = isoTower(tx, ty, tw, th, tw, s, false);
  const smokeX = tx, smokeY = ty - th - u*0.2;

  const smoke = animated ? [0, 1.1, 2.2].map((delay, i) => `
    <circle cx="${smokeX}" cy="${smokeY}" r="${u*0.3}" fill="rgba(120,110,100,0.6)">
      <animate attributeName="cy" calcMode="linear"
        values="${smokeY};${smokeY - u*1.5};${smokeY - u*3.5}"
        dur="2.8s" begin="${delay}s" repeatCount="indefinite"/>
      <animate attributeName="r"
        values="${u*0.3};${u*0.7};${u*1.2}"
        dur="2.8s" begin="${delay}s" repeatCount="indefinite"/>
      <animate attributeName="opacity"
        values="0;0.5;0.3;0"
        keyTimes="0;0.2;0.6;1"
        dur="2.8s" begin="${delay}s" repeatCount="indefinite"/>
    </circle>`).join('') : '';

  return base + chimney + smoke;
}

// Mühle: Turm + Flügel (alt, für Kompatibilität)
function isoMill(cx, cy, u, s) {
  // Flügelkreuz
  const mx=cx-u*1.2*0.86, my=cy-u*1.2*0.5-u*2.8*0.6;
  return base + `
  <line x1="${mx-u*2}" y1="${my}" x2="${mx+u*2}" y2="${my}" stroke="${s}" stroke-width="0.9"/>
  <line x1="${mx}" y1="${my-u*2}" x2="${mx}" y2="${my+u*2}" stroke="${s}" stroke-width="0.9"/>
  <circle cx="${mx}" cy="${my}" r="${u*0.35}" fill="white" stroke="${s}" stroke-width="0.8"/>`;
}

// Kathedrale: Hauptschiff + 2 Türme + Kreuzgang-Andeutung
function isoCathedral(cx, cy, u, s) {
  return isoHouse(cx, cy, u*3.0, u*1.8, u*2.0, u*2.2, s) +
    isoTower(cx-u*2.0, cy-u*0.5, u*1.0, u*3.5, u*1.0, s, false) +
    isoTower(cx+u*2.0, cy-u*0.5, u*1.0, u*3.5, u*1.0, s, false) +
    // Großes Kreuz oben Mitte
    `<line x1="${cx}" y1="${cy-u*3.8}" x2="${cx}" y2="${cy-u*2.8}" stroke="${s}" stroke-width="1.2"/>
     <line x1="${cx-u*0.7}" y1="${cy-u*3.4}" x2="${cx+u*0.7}" y2="${cy-u*3.4}" stroke="${s}" stroke-width="1.2"/>`;
}

// Getreidespeicher (Herbst): runder Silo + Dach
function isoGranary(cx, cy, u, s) {
  // Runder Körper: Ellipsen als Näherung
  const rx = u*1.8, ry = u*0.9, h = u*2.4;
  return `
  <!-- Boden-Ellipse -->
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"
           fill="rgba(18,14,10,0.06)" stroke="${s}" stroke-width="0.8"/>
  <!-- Silo-Körper linke Seite -->
  <path d="M ${cx-rx} ${cy} L ${cx-rx} ${cy-h} Q ${cx} ${cy-h-ry} ${cx+rx} ${cy-h} L ${cx+rx} ${cy} Z"
        fill="rgba(18,14,10,0.04)" stroke="${s}" stroke-width="0.8"/>
  <!-- Mittellinie -->
  <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy-h}"
        stroke="${s}" stroke-width="0.5" opacity="0.3"/>
  <!-- Dach-Ellipse -->
  <ellipse cx="${cx}" cy="${cy-h}" rx="${rx}" ry="${ry}"
           fill="rgba(18,14,10,0.1)" stroke="${s}" stroke-width="0.8"/>
  <!-- Dachspitze -->
  <line x1="${cx}" y1="${cy-h-ry*1.8}" x2="${cx-rx*0.8}" y2="${cy-h}"
        stroke="${s}" stroke-width="0.8"/>
  <line x1="${cx}" y1="${cy-h-ry*1.8}" x2="${cx+rx*0.8}" y2="${cy-h}"
        stroke="${s}" stroke-width="0.8"/>
  <!-- Horizontale Ringe -->
  <ellipse cx="${cx}" cy="${cy-h*0.35}" rx="${rx}" ry="${ry}" fill="none" stroke="${s}" stroke-width="0.5" opacity="0.35"/>
  <ellipse cx="${cx}" cy="${cy-h*0.65}" rx="${rx}" ry="${ry}" fill="none" stroke="${s}" stroke-width="0.5" opacity="0.35"/>`;
}

// Herrenhaus (Herbst): breites Haus mit Turm + Fahne
function isoManor(cx, cy, u, s) {
  return isoHouse(cx, cy, u*3.0, u*2.0, u*2.2, u*1.8, s) +
    isoTower(cx-u*2.2, cy-u*0.4, u*1.1, u*3.2, u*1.1, s, false) +
    `<!-- Fahne -->
    <line x1="${cx-u*2.2}" y1="${cy-u*0.4-u*3.2-u*0.1}" x2="${cx-u*2.2}" y2="${cy-u*0.4-u*3.2-u*1.2}"
          stroke="${s}" stroke-width="0.8"/>
    <path d="M ${cx-u*2.2} ${cy-u*0.4-u*3.2-u*1.2} L ${cx-u*2.2+u*1.2} ${cy-u*0.4-u*3.2-u*0.95}
             L ${cx-u*2.2} ${cy-u*0.4-u*3.2-u*0.7} Z"
          fill="rgba(18,14,10,0.25)" stroke="${s}" stroke-width="0.5"/>`;
}

// Baumstamm (für Holzfäller)
function isoLog(cx, cy, u, s) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${u*1.4}" ry="${u*0.7}" fill="rgba(18,14,10,0.06)" stroke="${s}" stroke-width="0.7"/>
  <ellipse cx="${cx}" cy="${cy}" rx="${u*0.7}" ry="${u*0.35}" fill="none" stroke="${s}" stroke-width="0.5" opacity="0.5"/>`;
}

// Kamin (für Schmiede)
function isoChimney(cx, cy, tw, th, s) {
  return isoTower(cx, cy+th, tw, th, tw, s, false);
}


// ═══════════════════════════════════════════
//  ÜBERFALL-KARTEN
// ═══════════════════════════════════════════

// 🟡 Gelbe Karten — Angriffsrichtung (8 Außenfelder im Uhrzeigersinn)
const DIRECTION_POOL = [
  { id:'Y1', label:'NW', gridIdx:0 },
  { id:'Y2', label:'N',  gridIdx:1 },
  { id:'Y3', label:'NO', gridIdx:2 },
  { id:'Y4', label:'O',  gridIdx:5 },
  { id:'Y5', label:'SO', gridIdx:8 },
  { id:'Y6', label:'S',  gridIdx:7 },
  { id:'Y7', label:'SW', gridIdx:6 },
  { id:'Y8', label:'W',  gridIdx:3 },
];
