// ═══════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════
const SEASON_COLORS = {
  winter: '#6899b8',   // gedämpftes Winterblau — Aquarell
  spring: '#5a9e6a',   // Waldgrün — warm, wie Cover
  summer: '#c8940a',   // Ocker-Gold — wie Cover-Himmel
  autumn: '#a04820',   // Terrakotta — wie Cover-Erdtöne
  special:'#7a3a8a',
};

const CAT_CODE = {
  winter:'W', spring:'F', summer:'S', autumn:'H', special:'SB'
};

// ═══════════════════════════════════════════
//  KARTEN-TÖNUNG — entkoppelt von Jahreszeiten
//  Bestimmt Banner-Fill, Streifen, Außenrand und Bodenlicht
//  bei Nicht-Sonderkarten.
// ═══════════════════════════════════════════
const CARD_TONES = {
  yellow:    '#c8940a',  // fragile (one-time-use)
  green:     '#5a9e6a',  // permanente Rohstoff-Karten
  lightblue: '#6899b8',  // permanente Karten ohne Rohstoff
};

function getCardTone(card) {
  if (!card) return '#7a7060';
  if (card.fragile)        return CARD_TONES.yellow;
  if (card.res)            return CARD_TONES.green;
  return CARD_TONES.lightblue;
}

const BUILDINGS = [
  // WINTER (24)
  {id:'W1', name:'Holzfäller',    cat:'winter', pts:2, def:1, res:'holz',    inno:0, upgrade:true},
  {id:'W2', name:'Holzfäller',    cat:'winter', pts:2, def:1, res:'holz',    inno:0, upgrade:true},
  {id:'W3', name:'Holzfäller',    cat:'winter', pts:2, def:1, res:'holz',    inno:0, upgrade:true},
  {id:'W4', name:'Bauernhof',      cat:'winter', pts:2, def:1, res:'nahrung', inno:0, upgrade:true},
  {id:'W5', name:'Bauernhof',      cat:'winter', pts:2, def:1, res:'nahrung', inno:0, upgrade:true},
  {id:'W6', name:'Bauernhof',      cat:'winter', pts:2, def:1, res:'nahrung', inno:0, upgrade:true},
  {id:'W7', name:'Glashütte',  cat:'winter', pts:2, def:1, res:'glas',    inno:0, upgrade:true},
  {id:'W8', name:'Glashütte',  cat:'winter', pts:2, def:1, res:'glas',    inno:0, upgrade:true},
  {id:'W9', name:'Glashütte',  cat:'winter', pts:2, def:1, res:'glas',    inno:0, upgrade:true},
  {id:'W10', name:'Ratskeller',       cat:'winter', pts:4, def:2, res:null,       inno:1, upgrade:false},
  {id:'W11', name:'Ratskeller',       cat:'winter', pts:4, def:2, res:null,       inno:1, upgrade:false},
  {id:'W12', name:'Holzfäller ⚡', cat:'winter', pts:1, def:1, res:'holz',    inno:1, upgrade:true},
  {id:'W13', name:'Bauernhof ⚡',   cat:'winter', pts:1, def:1, res:'nahrung', inno:1, upgrade:true},
  {id:'W14', name:'Bibliothek',       cat:'winter', pts:5, def:0, res:null,       inno:1, upgrade:false},
  {id:'W15', name:'Bibliothek',       cat:'winter', pts:5, def:0, res:null,       inno:1, upgrade:false},
  {id:'W16', name:'Glashändler',      cat:'winter', pts:2, def:0, res:'glas',     inno:0, upgrade:false, special_mechanic:'dual_res_glas'},
  {id:'W17', name:'Glashändler',      cat:'winter', pts:2, def:0, res:'glas',     inno:0, upgrade:false, special_mechanic:'dual_res_glas'},
  {id:'W18', name:'Sternwarte',       cat:'winter', pts:7, def:0, res:null,       inno:1, upgrade:false},
  {id:'W19', name:'Schmuckhändler',  cat:'winter', pts:9, def:0, res:null,       inno:0, upgrade:false},
  {id:'W20', name:'Wachposten',       cat:'winter', pts:2, def:3, res:null,       inno:0, upgrade:false},
  {id:'W21', name:'Wachposten',       cat:'winter', pts:2, def:3, res:null,       inno:0, upgrade:false},
  {id:'W22', name:'Gaukler',          cat:'winter', pts:2, def:0, res:null,       inno:0, upgrade:false, fragile:true, special_mechanic:'decoy'},
  {id:'W23', name:'Stadttor',       cat:'winter', pts:0, def:0, res:null,      inno:0, upgrade:false, fragile:true, special_mechanic:'force_start'},
  {id:'W24', name:'Brunnen',        cat:'winter', pts:1, def:0, res:null,      inno:0, upgrade:false},
  // FRÜHLING (20)
  {id:'F1', name:'Sägemühle',      cat:'spring', pts:3, def:1, res:'holz',    inno:0, upgrade:true},
  {id:'F2', name:'Sägemühle',      cat:'spring', pts:3, def:1, res:'holz',    inno:0, upgrade:true},
  {id:'F3', name:'Mühle',        cat:'spring', pts:3, def:1, res:'nahrung', inno:0, upgrade:true},
  {id:'F4', name:'Mühle',        cat:'spring', pts:3, def:1, res:'nahrung', inno:0, upgrade:true},
  {id:'F5', name:'Schmelze',      cat:'spring', pts:2, def:1, res:'glas',    inno:0, upgrade:true},
  {id:'F6', name:'Schmelze',      cat:'spring', pts:2, def:1, res:'glas',    inno:0, upgrade:true},
  {id:'F7', name:'Schmelze',      cat:'spring', pts:2, def:1, res:'glas',    inno:0, upgrade:true},
  {id:'F8', name:'Marktplatz',      cat:'spring', pts:4, def:1, res:'holz',     inno:0, upgrade:false, special_mechanic:'dual_res_nahrung'},
  {id:'F9', name:'Marktplatz',      cat:'spring', pts:4, def:1, res:'holz',     inno:0, upgrade:false, special_mechanic:'dual_res_nahrung'},
  {id:'F10', name:'Wachturm',      cat:'spring', pts:3, def:2, res:null,       inno:1, upgrade:false},
  {id:'F11', name:'Wachturm',      cat:'spring', pts:4, def:2, res:null,       inno:1, upgrade:false},
  {id:'F12', name:'Wachturm',      cat:'spring', pts:5, def:2, res:null,       inno:1, upgrade:false},
  {id:'F13', name:'Orakel (Gelb)',     cat:'spring', pts:{type:'dice+',color:'yellow',bonus:1}, def:1, res:null, inno:1, upgrade:false},
  {id:'F14', name:'Orakel (Blau)',     cat:'spring', pts:{type:'dice+',color:'blue',  bonus:1}, def:1, res:null, inno:1, upgrade:false},
  {id:'F15', name:'Diamanthändler', cat:'spring', pts:9, def:1, res:null,       inno:0, upgrade:false},
  {id:'F16', name:'Observatorium',   cat:'spring', pts:7, def:1, res:null,       inno:1, upgrade:false},
  {id:'F17', name:'Gaukler',      cat:'spring', pts:2, def:0, res:null,      inno:0, upgrade:false, fragile:true, special_mechanic:'decoy'},
  {id:'F18', name:'Stadttor',      cat:'spring', pts:0, def:0, res:null,      inno:0, upgrade:false, fragile:true, special_mechanic:'force_start'},
  {id:'F19', name:'Windrose ↻',      cat:'spring', pts:2, def:0, res:null,      inno:1, upgrade:false, fragile:true, special_mechanic:'force_dir_cw'},
  {id:'F20', name:'Windrose ↺',      cat:'spring', pts:2, def:0, res:null,      inno:0, upgrade:false, fragile:true, special_mechanic:'force_dir_ccw'},
  // SOMMER (16)
  {id:'SO1', name:'Forsthaus',     cat:'summer', pts:4, def:2, res:'holz',    inno:1, upgrade:true},
  {id:'SO2', name:'Forsthaus',     cat:'summer', pts:4, def:2, res:'holz',    inno:1, upgrade:true},
  {id:'SO3', name:'Erntehof',      cat:'summer', pts:4, def:2, res:'nahrung', inno:1, upgrade:true},
  {id:'SO4', name:'Erntehof',      cat:'summer', pts:4, def:2, res:'nahrung', inno:1, upgrade:true},
  {id:'SO5', name:'Glashütte',    cat:'summer', pts:4, def:2, res:'glas',    inno:0, upgrade:true},
  {id:'SO6', name:'Schloss',         cat:'summer', pts:7, def:2, res:null,       inno:1, upgrade:false},
  {id:'SO7', name:'Prophet (Gelb)',    cat:'summer', pts:{type:'dice+',color:'yellow',bonus:2}, def:1, res:null, inno:1, upgrade:false},
  {id:'SO8', name:'Prophet (Blau)',    cat:'summer', pts:{type:'dice+',color:'blue',  bonus:2}, def:1, res:null, inno:1, upgrade:false},
  {id:'SO9', name:'Forstwirtschaft', cat:'summer', pts:{type:'res*',res:'holz',    factor:1}, def:1, res:'holz',    inno:1, upgrade:true},
  {id:'SO10', name:'Brauerei',        cat:'summer', pts:{type:'res*',res:'nahrung', factor:1}, def:1, res:'nahrung', inno:1, upgrade:true},
  {id:'SO11', name:'Markthalle',      cat:'summer', pts:4, def:2, res:'holz',    inno:0, upgrade:false, special_mechanic:'dual_res_nahrung'},
  {id:'SO12', name:'Juwelenhändler', cat:'summer', pts:11,def:0, res:null,       inno:0, upgrade:false},
  {id:'SO13', name:'Gaukler',      cat:'summer', pts:2, def:0, res:null,      inno:0, upgrade:false, fragile:true, special_mechanic:'decoy'},
  {id:'SO14', name:'Stadttor',      cat:'summer', pts:0, def:0, res:null,      inno:0, upgrade:false, fragile:true, special_mechanic:'force_start'},
  {id:'SO15', name:'Windrose ↻',      cat:'summer', pts:3, def:0, res:null,      inno:1, upgrade:false, fragile:true, special_mechanic:'force_dir_cw'},
  {id:'SO16', name:'Windrose ↺',      cat:'summer', pts:3, def:0, res:null,      inno:0, upgrade:false, fragile:true, special_mechanic:'force_dir_ccw'},
  // HERBST (12)
  {id:'H1', name:'Großbasar',      cat:'autumn', pts:5, def:2, res:'holz',     inno:0, upgrade:false, special_mechanic:'dual_res_nahrung'},
  {id:'H2', name:'Palast',          cat:'autumn', pts:9, def:2, res:null,       inno:0, upgrade:false},
  {id:'H3', name:'Burg',            cat:'autumn', pts:5, def:4, res:null,       inno:0, upgrade:false},
  {id:'H4', name:'Seher (Gelb)',      cat:'autumn', pts:{type:'dice+',color:'yellow',bonus:3}, def:2, res:null, inno:0, upgrade:false},
  {id:'H5', name:'Seher (Blau)',      cat:'autumn', pts:{type:'dice+',color:'blue',  bonus:3}, def:2, res:null, inno:0, upgrade:false},
  {id:'H6', name:'Zimmerwerk',      cat:'autumn', pts:{type:'res*',res:'holz',    factor:2}, def:3, res:'holz',    inno:0, upgrade:true},
  {id:'H7', name:'Kornkammer',      cat:'autumn', pts:{type:'res*',res:'nahrung', factor:2}, def:3, res:'nahrung', inno:0, upgrade:true},
  {id:'H8', name:'Handelsgilde',    cat:'autumn', pts:{type:'blue*', factor:2},              def:1, res:null,       inno:0, upgrade:false},
  {id:'H9', name:'Schatzkammer',    cat:'autumn', pts:12,def:0, res:null,       inno:0, upgrade:false},
  {id:'H10', name:'Gaukler',      cat:'autumn', pts:2, def:0, res:null,      inno:0, upgrade:false, fragile:true, special_mechanic:'decoy'},
  {id:'H11', name:'Windrose ↻',      cat:'autumn', pts:4, def:0, res:null,      inno:0, upgrade:false, fragile:true, special_mechanic:'force_dir_cw'},
  {id:'H12', name:'Windrose ↺',      cat:'autumn', pts:4, def:0, res:null,      inno:0, upgrade:false, fragile:true, special_mechanic:'force_dir_ccw'},
];
const RATHAUS = { id:'rathaus', cat:null, pts:0, def:0, res:null, inno:0, upgrade:false };

const SPECIAL_BUILDINGS = [
  {id:'Z1',  name:'Blutarena',         cat:'special', minLevel:4, pts:{type:'dice*',color:'red',   factor:3}, def:2, res:null,      inno:0, upgrade:false, diceColor:'red'},
  {id:'Z2',  name:'Zwillingsturm',     cat:'special', minLevel:4, pts:{type:'dice+dice',a:'yellow',b:'blue'}, def:2, res:null,      inno:0, upgrade:false, diceColor:'yellow'},
  {id:'Z3',  name:'Akademie',          cat:'special', minLevel:4, pts:{type:'inno*',factor:2},               def:2, res:null,      inno:2, upgrade:false, diceColor:'blue'},
  {id:'Z4',  name:'Trojanisches Pferd',cat:'special', minLevel:2, pts:{type:'def_sum'},                      def:0, res:null,      inno:0, upgrade:false, diceColor:'yellow', fragile:true},
  {id:'Z5',  name:'Ruinenmagier',      cat:'special', minLevel:4, pts:{type:'deact*',factor:3},              def:1, res:null,      inno:0, upgrade:false, diceColor:'red'},
  {id:'Z6',  name:'Ritterburg',        cat:'special', minLevel:2, pts:6,                                     def:1, res:null,      inno:0, upgrade:false, diceColor:'red',    special_mechanic:'direct_knight'},
  {id:'Z7',  name:'Gewürzmarkt',       cat:'special', minLevel:2, pts:6,                                     def:1, res:'nahrung', inno:0, upgrade:false, diceColor:'yellow', special_mechanic:'dual_res_holz'},
  {id:'Z8',  name:'Druidenzirkel',     cat:'special', minLevel:4, pts:{type:'season*',factor:3},             def:1, res:null,      inno:0, upgrade:false, diceColor:'spring', special_mechanic:'season_pts'},
  {id:'Z9',  name:'Alchemistenlabor',  cat:'special', minLevel:4, pts:{type:'res*',res:'glas',factor:3},     def:1, res:'glas',    inno:1, upgrade:false, diceColor:'yellow'},
  {id:'Z10', name:'Kristallpalast',    cat:'special', minLevel:6, pts:15,                                    def:0, res:null,      inno:0, upgrade:false, diceColor:'yellow', special_mechanic:'destroyable', fragile:true},
  {id:'Z11', name:'Versicherung',      cat:'special', minLevel:2, pts:0,                                     def:2, res:null,      inno:0, upgrade:false, diceColor:'blue',   special_mechanic:'pts_if_plundered'},
  {id:'Z12', name:'Versicherung',      cat:'special', minLevel:2, pts:0,                                     def:2, res:null,      inno:0, upgrade:false, diceColor:'blue',   special_mechanic:'pts_if_plundered'},
  {id:'Z13', name:'Schild des Rates',  cat:'special', minLevel:6, pts:{type:'dice+',color:'red',bonus:5},    def:4, res:null,      inno:0, upgrade:false, diceColor:'red'},
  {id:'Z14', name:'Nebelbastei',       cat:'special', minLevel:4, pts:{type:'dice_sum*',a:'blue',b:'yellow',factor:2}, def:0, res:null, inno:0, upgrade:false, diceColor:'blue'},
  {id:'Z15', name:'Immobilienhändler', cat:'special', minLevel:4, pts:{type:'deact*',factor:3},              def:1, res:null,      inno:0, upgrade:false, diceColor:'blue',   special_mechanic:'sonder_count'},
  {id:'Z16', name:'Zeltlager',         cat:'special', minLevel:2, pts:7,                                     def:0, res:null,      inno:0, upgrade:false, diceColor:'spring', special_mechanic:'free_build'},
  {id:'Z17', name:'Bogenwacht',        cat:'special', minLevel:2, pts:3,                                     def:1, res:null,      inno:0, upgrade:false, diceColor:'red',    special_mechanic:'minus2_attackers'},
  {id:'Z18', name:'Schildwall',        cat:'special', minLevel:2, pts:2,                                     def:1, res:null,      inno:0, upgrade:false, diceColor:'yellow', special_mechanic:'neighbor_defense'},
  {id:'Z19', name:'Ewige Bastion',     cat:'special', minLevel:6, pts:6,                                     def:2, res:null,      inno:0, upgrade:false, diceColor:'blue',   special_mechanic:'indestructible'},
  {id:'Z20', name:'Ewige Bastion',     cat:'special', minLevel:6, pts:6,                                     def:2, res:null,      inno:0, upgrade:false, diceColor:'blue',   special_mechanic:'indestructible'},
  {id:'Z21', name:'Fernkundschafter',  cat:'special', minLevel:2, pts:{type:'dice*',color:'yellow',factor:1}, def:1, res:null,     inno:0, upgrade:false, diceColor:'yellow', special_mechanic:'reveal_yellow', fragile:true},
  {id:'Z22', name:'Zahlmeister',       cat:'special', minLevel:2, pts:{type:'dice*',color:'blue',  factor:1}, def:1, res:null,     inno:0, upgrade:false, diceColor:'blue',   special_mechanic:'reveal_blue',   fragile:true},
  {id:'Z23', name:'Münzprägung',       cat:'special', minLevel:2, pts:4,                                     def:1, res:null,      inno:0, upgrade:false, diceColor:'yellow', special_mechanic:'direct_coins'},
  {id:'Z24', name:'Münzprägung',       cat:'special', minLevel:2, pts:4,                                     def:1, res:null,      inno:0, upgrade:false, diceColor:'yellow', special_mechanic:'direct_coins'},
  {id:'Z25', name:'Bankhaus',          cat:'special', minLevel:4, pts:5,                                     def:1, res:null,      inno:0, upgrade:false, diceColor:'blue',   special_mechanic:'direct_coins_seasonal'},
  {id:'Z26', name:'Handelszentrum',    cat:'special', minLevel:4, pts:{type:'blue*',factor:3},               def:1, res:null,      inno:0, upgrade:false, diceColor:'blue'},
  {id:'Z27', name:'Bogenwacht',        cat:'special', minLevel:2, pts:3,                                     def:1, res:null,      inno:0, upgrade:false, diceColor:'red',    special_mechanic:'minus2_attackers'},
  {id:'Z28', name:'Bogenwacht',        cat:'special', minLevel:2, pts:3,                                     def:1, res:null,      inno:0, upgrade:false, diceColor:'red',    special_mechanic:'minus2_attackers'},
  {id:'Z29', name:'Schildwall',        cat:'special', minLevel:2, pts:2,                                     def:1, res:null,      inno:0, upgrade:false, diceColor:'yellow', special_mechanic:'neighbor_defense_2'},
  {id:'Z30', name:'Schildwall',        cat:'special', minLevel:2, pts:2,                                     def:1, res:null,      inno:0, upgrade:false, diceColor:'yellow', special_mechanic:'neighbor_defense_2'},
];

// ═══════════════════════════════════════════
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
      <stop offset="38%"  stop-color="white" stop-opacity="0"/>
      <stop offset="50%"  stop-color="white" stop-opacity="0.18"/>
      <stop offset="58%"  stop-color="white" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </linearGradient>
    ${fortified ? `
    <linearGradient id="royalBanner${card.id}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#9060c8"/>
      <stop offset="25%"  stop-color="#6a38a8"/>
      <stop offset="70%"  stop-color="#4a2080"/>
      <stop offset="100%" stop-color="#2e1050"/>
    </linearGradient>` : ''}
  </defs>

  <!-- Papierstärke -->
  <rect x="1.5" y="${h-2}" width="${w-3}" height="2" rx="1" fill="rgba(18,14,10,0.09)"/>
  <rect x="${w-2}" y="1.5" width="2" height="${h-3}" rx="1" fill="rgba(18,14,10,0.06)"/>

  <!-- Karte Hintergrund -->
  <rect width="${w}" height="${h}" rx="3" fill="#fafaf8"/>
  <!-- Rand -->
  <rect x="0.5" y="0.5" width="${w-1}" height="${h-1}" rx="2.5"
        fill="none" stroke="${fortified ? '#6a38a8' : (isSpecial ? SEASON_COLORS[card.cat] : 'rgba(18,14,10,0.12)')}"
        stroke-width="${fortified ? 1.5 : (isSpecial ? 1.5 : 0.8)}"/>

  <!-- ── JAHRESZEIT-STREIFEN — nur wenn nicht geplündert ── -->
  ${card.cat && !plundered ? `
  <defs>
    <linearGradient id="stripe${card.id}${w}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="${seasonCol}" stop-opacity="0"/>
      <stop offset="10%"  stop-color="${seasonCol}" stop-opacity="0.65"/>
      <stop offset="90%"  stop-color="${seasonCol}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${seasonCol}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="${w*0.2 - w*0.07}" y="${h*0.35}" width="${w*0.14}" height="${h*0.46}"
        fill="url(#stripe${card.id}${w})"/>` : ''}

  <!-- PUNKTE BANNER -->
  <path d="M ${w*0.06} 0 L ${w*0.34} 0 L ${w*0.34} ${h*0.28} L ${w*0.2} ${h*0.34} L ${w*0.06} ${h*0.28} Z"
        fill="${fortified ? `url(#royalBanner${card.id})` : bannerFill}"/>
  <!-- Banner Glanz oben -->
  <path d="M ${w*0.06} 0 L ${w*0.34} 0 L ${w*0.34} ${h*0.07} L ${w*0.06} ${h*0.07} Z"
        fill="${bannerFill2}"/>
  ${bannerDepth}
  <!-- Punkte-Zahl — formatiert (auch relativ) -->
  <text x="${w*0.2}" y="${h*0.22}" text-anchor="middle"
        font-family="'Cinzel',serif" font-size="${typeof card.pts === 'number' ? (h<100?16:21) : (h<100?9:11)}" font-weight="700"
        fill="${ptsColor}">${formatPts(card.pts)}</text>

  ${plundered ? `
  <!-- RISS über der Punktzahl — zeigt: Punkte verloren -->
  <!-- Diagonaler Riss, weiß, über den Banner -->
  <line x1="${w*0.08}" y1="${h*0.30}" x2="${w*0.18}" y2="${h*0.06}"
        stroke="rgba(255,255,255,0.55)" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="${w*0.18}" y1="${h*0.06}" x2="${w*0.22}" y2="${h*0.12}"
        stroke="rgba(255,255,255,0.55)" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="${w*0.22}" y1="${h*0.12}" x2="${w*0.30}" y2="${h*0.00}"
        stroke="rgba(255,255,255,0.45)" stroke-width="1.0" stroke-linecap="round"/>
  <!-- Zweiter Riss, versetzt -->
  <line x1="${w*0.10}" y1="${h*0.26}" x2="${w*0.19}" y2="${h*0.10}"
        stroke="rgba(0,0,0,0.12)" stroke-width="0.8" stroke-linecap="round"/>
  ` : ''}

  <!-- VERTEIDIGUNG SCHILD -->
  ${makeShield(card.def, w, h, isSpecial ? SEASON_COLORS[card.cat] : null, boosted)}

  <!-- ISO ILLUSTRATION — über Banner, Streifen und Schild, tiefer gesetzt -->
  ${ill}

  <!-- JAHRES-CODE entfernt -->

  <!-- RESSOURCE ICON — zeigt alle produzierten Rohstoffe -->
  ${(() => {
    const m = card.special_mechanic;
    const res2 = m === 'dual_res_nahrung' ? '🌾'
               : m === 'dual_res_holz'    ? '🪵'
               : m === 'dual_res_glas'    ? '🫙' : '';
    if (resEmoji && res2) {
      // Zwei Icons nebeneinander
      const fs = h < 100 ? 16 : 20;
      const y  = h * 0.88;
      return `<text x="${w*0.64}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="${fs}">${resEmoji}</text>
  <text x="${w*0.86}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="${fs}">${res2}</text>`;
    }
    if (resEmoji) {
      return `<text x="${w*0.76}" y="${h*0.88}" text-anchor="middle" dominant-baseline="middle"
        font-size="${h < 100 ? 20 : 25}">${resEmoji}</text>`;
    }
    // Fragile-Mechanik-Emoji (statt Ressource)
    const fragileEmoji = m === 'force_start'    ? '🏰'
                       : m === 'force_dir_cw'   ? '↻'
                       : m === 'force_dir_ccw'  ? '↺'
                       : m === 'decoy'          ? '🎭' : '';
    if (fragileEmoji && card.fragile && !plundered) {
      const isArrow = m === 'force_dir_cw' || m === 'force_dir_ccw';
      const fs = isArrow ? (h < 100 ? 22 : 28) : (h < 100 ? 18 : 22);
      const fw = isArrow ? 'font-weight="700"' : '';
      return `<text x="${w*0.76}" y="${h*0.88}" text-anchor="middle" dominant-baseline="middle"
        font-size="${fs}" ${fw} fill="#1a1610">${fragileEmoji}</text>`;
    }
    return '';
  })()}

  <!-- UPGRADE PIP oder SPEZIALKARTEN-BAUBEDINGUNG -->
  ${card.isSpecialOffer && card.diceColor ? (() => {
    const baseCost = G.diceRolled ? G.dice[card.diceColor] : '?';
    const discount = G ? (G.rathausLevel - 1) : 0;
    const finalCost = G.diceRolled ? Math.max(0, G.dice[card.diceColor] - discount) : '?';
    const diceHex = { yellow:'#c8a010', blue:'#2a5890', red:'#901828' }[card.diceColor] || '#555';
    const canBuild = G.diceRolled && G.coins >= finalCost;
    return `
    <!-- Würfelkosten minus Rathaus-Rabatt oben rechts -->
    <rect x="${w-22}" y="1" width="21" height="12" rx="3"
          fill="${diceHex}" opacity="${canBuild ? 1 : 0.5}"/>
    <!-- kleiner Münz-Icon -->
    <circle cx="${w-20}" cy="7" r="3" fill="rgba(255,220,60,0.8)"/>
    <!-- Kosten -->
    <text x="${w-12}" y="8.5" text-anchor="middle" dominant-baseline="middle"
          font-family="'Cinzel',serif" font-size="5.5" font-weight="700"
          fill="white">${finalCost}</text>
    ${!canBuild && G.diceRolled ? `
    <!-- Gesperrt-Schleier -->
    <rect x="${w-22}" y="1" width="21" height="12" rx="3"
          fill="rgba(0,0,0,0.25)"/>` : ''}`;
  })() :
  card.upgrade ? `
  <circle cx="${w-7}" cy="${h*0.07}" r="4.5" fill="#c8a040"/>
  <text x="${w-7}" y="${h*0.07}" text-anchor="middle" dominant-baseline="middle"
        font-size="5.5" fill="white" font-weight="bold">▲</text>` : ''}

  <!-- ── FRAGILE-MARKER — Karte wird bei Wertung entfernt wenn betreten ── -->
  ${card.fragile && !plundered ? `
  <!-- Sprungrisse-Symbol oben links auf dem Punkte-Banner -->
  <g transform="translate(${w*0.2 - 6}, ${h*0.14 - 6})" opacity="0.95">
    <!-- Kreis-Hintergrund weiß für Kontrast gegen Banner -->
    <circle cx="6" cy="6" r="6" fill="#fafaf8" stroke="#1a1610" stroke-width="0.8"/>
    <!-- Sprungrisse — drei Linien vom Zentrum -->
    <line x1="6" y1="6" x2="2.5" y2="2.5" stroke="#1a1610" stroke-width="0.9" stroke-linecap="round"/>
    <line x1="6" y1="6" x2="9.5" y2="3"   stroke="#1a1610" stroke-width="0.9" stroke-linecap="round"/>
    <line x1="6" y1="6" x2="5"   y2="10"  stroke="#1a1610" stroke-width="0.9" stroke-linecap="round"/>
    <!-- Kleiner zentraler Punkt -->
    <circle cx="6" cy="6" r="0.9" fill="#1a1610"/>
  </g>` : ''}

  <!-- SCHIMMER -->
  <rect width="${w}" height="${h}" rx="3"
        fill="url(#shim${w}${h}${card.id})" pointer-events="none"/>

  ${plundered ? `
  <!-- GEPLÜNDERT-SCHLEIER: Grau über der ganzen Karte -->
  <rect width="${w}" height="${h}" rx="3"
        fill="rgba(160,156,148,0.38)" pointer-events="none"/>
  <!-- Kleines X-Symbol oben rechts als klares Signal -->
  <circle cx="${w-9}" cy="9" r="6" fill="rgba(120,116,110,0.7)"/>
  <line x1="${w-12}" y1="6" x2="${w-6}" y2="12" stroke="white" stroke-width="1.4" stroke-linecap="round"/>
  <line x1="${w-6}"  y1="6" x2="${w-12}" y2="12" stroke="white" stroke-width="1.4" stroke-linecap="round"/>
  ` : ''}
</svg>`;
}

// ── Rathaus ──────────────────────────────
function makeRathaus(w, h, score) {
  const cx = w/2, s = score || 0;
  const rathausLevel = G ? (G.rathausLevel || 1) : 1;
  const levelDots = Array.from({length: 5}, (_, i) =>
    `<circle cx="${cx - 20 + i*10}" cy="${h*0.88}" r="${h<100?2.5:3}"
     fill="${i < rathausLevel - 1 ? '#7a3a8a' : 'rgba(18,14,10,0.12)'}"/>`
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

  <!-- PUNKTZAHL -->
  <text x="${cx}" y="${bT + (bB-bT)*0.42}" text-anchor="middle" dominant-baseline="middle"
        font-family="'Cinzel',serif" font-size="${h<100 ? 26 : 34}" font-weight="700"
        fill="white">${s}</text>
  <text x="${cx}" y="${bT + (bB-bT)*0.74}" text-anchor="middle" dominant-baseline="middle"
        font-family="'Cinzel',serif" font-size="${h<100 ? 5.5 : 7}" font-weight="400"
        fill="rgba(255,255,255,0.38)" letter-spacing="2.5">PUNKTE</text>

  <!-- RATHAUS LEVEL — Zahl + Punkte-Indikator -->
  <text x="${cx}" y="${inoY}" text-anchor="middle" dominant-baseline="middle"
        font-family="'Cinzel',serif" font-size="${h<100 ? 15 : 19}" font-weight="700"
        fill="${rathausLevel > 1 ? '#7a3a8a' : 'rgba(18,14,10,0.12)'}">${rathausLevel}</text>
  <text x="${cx}" y="${inoY + (h<100?12:15)}" text-anchor="middle" dominant-baseline="middle"
        font-family="'Cinzel',serif" font-size="${h<100 ? 5 : 6.5}" font-weight="400"
        fill="rgba(18,14,10,0.22)" letter-spacing="2">RATHAUS</text>
  ${levelDots}  <!-- Schimmer -->
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
function makeShield(def, w, h, color, boosted) {
  const x  = w * 0.2;   // exakt gleiche Achse wie Banner-Mitte und Streifen
  const hw = w * 0.112;  // 20% schmaler als vorher (0.14 → 0.112)

  // Doppelte Höhe: von 0.855 bis 0.975 statt 0.855 bis 0.92
  const y0 = h * 0.82;           // Oberkante
  const y1 = h * 0.93;           // Unterkante Körper
  const y2 = h * 0.978;          // Spitze

  // Helleres Grau für das Schild
  const sc = color || '#6a6860';
  const numColor  = boosted ? '#3db870' : 'white';  // wärmeres Grün, weniger giftig

  return `
  <!-- Schild-Form -->
  <path d="M ${x-hw} ${y0} L ${x+hw} ${y0} L ${x+hw} ${y1}
           Q ${x+hw} ${y2} ${x} ${y2+h*0.003}
           Q ${x-hw} ${y2} ${x-hw} ${y1} Z"
        fill="${sc}" opacity="0.9"/>
  <path d="M ${x-hw} ${y0} L ${x+hw} ${y0} L ${x+hw} ${y0+h*0.02} L ${x-hw} ${y0+h*0.02} Z"
        fill="rgba(255,255,255,0.18)"/>

  ${boosted ? `
  <!-- Plus-Zeichen ÜBER dem Schild — groß, schwarz -->
  <text x="${x}" y="${y0 - h*0.042}" text-anchor="middle" dominant-baseline="middle"
        font-family="'Cinzel',serif" font-size="${h<100 ? 22 : 29}" font-weight="700"
        fill="#1a1610" opacity="0.85">+</text>` : ''}

  <!-- Verteidigungszahl -->
  <text x="${x}" y="${(y0+y2)/2 + h*0.008}" text-anchor="middle" dominant-baseline="middle"
        font-family="'Cinzel',serif" font-size="${h<100 ? 11 : 14}" font-weight="700"
        fill="${numColor}">${def + (boosted||0)}</text>`;
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
    Z13: () => TOWER(2.0, 3.0),               // Schild des Rates
    Z14: MANOR,                                // Nebelbastei
    Z15: () => HOUSE(2.8, 2.0, 2.8, 1.4),     // Immobilienhändler
    Z16: () => HOUSE(1.6, 1.2, 1.6, 0.8),     // Zeltlager
    Z17: () => TOWER(1.4, 3.0), Z18: () => TOWER(1.4, 3.0), // Bogenwacht ×3
    Z19: () => TOWER(2.0, 3.8), Z20: () => TOWER(2.0, 3.8), // Ewige Bastion ×2
    Z21: MANOR,                                // Fernkundschafter
    Z22: MANOR,                                // Zahlmeister
    Z23: () => TOWER(1.2, 2.2), Z24: () => TOWER(1.2, 2.2), // Münzprägung ×2
    Z25: () => HOUSE(2.4, 2.0, 2.4, 1.4),     // Bankhaus
    Z26: () => HOUSE(2.8, 2.2, 2.8, 1.6),     // Handelszentrum
    Z27: () => TOWER(1.4, 3.0),               // Bogenwacht (weitere)
    Z28: () => TOWER(1.4, 3.0),
    Z29: () => HOUSE(2.8, 1.6, 2.8, 0.8),     // Schildwall (weitere)
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
