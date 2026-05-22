// ═══════════════════════════════════════════
//  MURMELTAL — Spielanleitung
//  Diese Datei separat pflegen.
//  Kein Hochladen von game.js / index.html nötig
//  wenn nur Text geändert wird.
// ═══════════════════════════════════════════

const RULES_PAGES = [
  {
    title: 'Das Tal ruft',
    icon: '🏰',
    sections: [
      {
        heading: 'Ziel',
        text: 'Du bist Bürgermeister eines kleinen Tals. Baue eine florierende Siedlung — und überleebe die jährlichen Überfälle der marodierenden Murmeltier-Horden.'
      },
      {
        heading: 'Spielablauf',
        text: 'Das Spiel läuft über 4 Jahreszeiten. Jede Jahreszeit besteht aus drei Phasen: Bauen → Rüsten → Überfall. Im Winter gibt es keinen Überfall — die Horde schläft noch.'
      },
      {
        heading: 'Bauen',
        text: 'Du erhältst eine Hand von Karten und wählst bis zu 5 davon für dein 3×3-Raster. Karten liefern Rohstoffe (Holz, Nahrung, Glas) oder Sonderfähigkeiten. Du kannst Karten upgraden (gleicher Rohstoff, bis zu 3 Lagen) oder ersetzen — aber jede Aktion zählt.'
      },
    ]
  },
  {
    title: 'Verteidigung & Überfall',
    icon: '⚔️',
    sections: [
      {
        heading: 'Rüsten',
        text: 'Nach dem Bauen wandelt deine Stadt Rohstoffe um: 2 Holz → 1 Barriere · 2 Nahrung → 1 Ritter · 2 Glas → 1 Münze. Platziere Barrieren zwischen Feldern, Ritter auf Gebäude und kaufe Türme mit Münzen um Gebäude dauerhaft zu befestigen.'
      },
      {
        heading: '3 Würfel — 3 Geheimnisse',
        text: 'Drei Würfel bestimmen den Überfall: 🟡 Gelb = Angriffsrichtung (NW bis S), 🔵 Blau = Angreiferzahl, 🔴 Rot = Champion-Fähigkeit. Einer davon ist immer verborgen — du weißt nie alles.'
      },
      {
        heading: 'Der Überfall',
        text: 'Angreifer ziehen Feld für Feld durch die Stadt. Jedes Gebäude wehrt sich mit seiner Verteidigung. Wird ein Feld dennoch überrannt, ist das Gebäude geplündert — es zählt bei der Wertung nicht. Befestigte Gebäude (Turm) überleben alles.'
      },
    ]
  },
  {
    title: 'Punkte & Tipps',
    icon: '★',
    sections: [
      {
        heading: 'Wertung',
        text: 'Am Ende jeder Jahreszeit zählen alle aktiven (nicht geplünderten) Gebäude ihre Siegpunkte. Manche Karten geben Punkte basierend auf Würfelwerten, Rohstoffproduktion oder dem Rathaus-Level. Nach 4 Jahreszeiten gewinnt dein Highscore.'
      },
      {
        heading: 'Rathaus',
        text: 'Das Rathaus steht fest in der Mitte. Schiebe eine Karte darunter um es aufzuwerten (max. Level 6) — du erhältst sofort eine Münze und Karten mit ⚡ skalieren besser. Eine gute Investition.'
      },
      {
        heading: 'Tipp',
        text: 'Der verborgen Würfel ist dein größter Feind. Baue so, dass du auch den schlimmsten Fall überlebst — nicht nur den wahrscheinlichsten. Viel Glück, Bürgermeister.'
      },
    ]
  }
];
