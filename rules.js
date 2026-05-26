// ═══════════════════════════════════════════
//  TALWACHT — Spielanleitung
//  Diese Datei separat pflegen.
//  Kein Hochladen von game.js / index.html nötig
//  wenn nur Text geändert wird.
// ═══════════════════════════════════════════

const RULES_PAGES = [
  {
    title: 'Das Tal ruft',
    icon: 'I',
    sections: [
      {
        heading: 'Willkommen',
        text: 'Willkommen in der Talwacht! Baue eine florierende Siedlung — und überstehe die ständigen Überfälle der marodierenden Murmeltier-Horden.'
      },
      {
        heading: 'Spielablauf',
        text: 'Du spielst 4 Jahreszeiten und jede besteht aus drei Phasen: Bauen → Rüsten → Überfall. Nur im Winter gibt es keinen Überfall — die Horde macht Winterschlaf.'
      },
      {
        heading: 'Bauen',
        text: 'Sichere dir die passenden Karten und baue, upgrade und erweitere deine Siedlung in einem 3×3-Raster. Wähle klug: Rohstoffe produzieren, Verteidigung, Punkte oder sogar Sonderfähigkeiten? Die Karten sind knapp und die nächste Horde kommt ganz sicher...'
      },
    ]
  },
  {
    title: 'Verteidigung & Überfall',
    icon: 'II',
    sections: [
      {
        heading: 'Rüsten',
        text: 'Nach dem Bauen wandelt deine Stadt Rohstoffe um: 2 Holz → 1 Barriere · 2 Nahrung → 1 Ritter · 2 Glas → 1 Münze. Setze Barrieren an die Außenkanten deiner Randfelder, Ritter auf Gebäude und kaufe Türme (2 Münzen) um Gebäude dauerhaft zu befestigen.'
      },
      {
        heading: 'Barrieren & Startpunkt',
        text: 'Sind ALLE Außenkanten eines Randfeldes mit Barrieren geschützt (Kantenfeld: 1, Eckfeld: 2), kann der Angriff dort nicht starten — er weicht in Laufrichtung zum nächsten ungeschützten Feld aus. Barrieren bleiben permanent liegen. Eine voll barrikadierte Stadt ist uneinnehmbar — aber sehr teuer.'
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
    icon: 'III',
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
        text: 'Der verborgene Würfel ist dein größter Feind. Baue so, dass du auch den schlimmsten Fall überlebst — nicht nur den wahrscheinlichsten. Viel Glück, Bürgermeister.'
      },
    ]
  }
];
