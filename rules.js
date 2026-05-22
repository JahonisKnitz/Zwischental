// ═══════════════════════════════════════════
//  ZWISCHENTAL — Spielanleitung
//  Diese Datei separat pflegen.
//  Kein Hochladen von game.js / index.html nötig
//  wenn nur Text geändert wird.
// ═══════════════════════════════════════════

const RULES_PAGES = [
  {
    title: 'Willkommen im Murmeltal',
    icon: '🏰',
    sections: [
      {
        heading: '',
        text: 'Du bist Bürgermeister:in in Murmeltal - ein grünes Tal zwischen vier Königreichen, die ordentlich Ärger miteinander haben. Deswegen ziehen regelmäßig plündernde Truppen durch dein Tal, auf dem Weg zum nächsten Scharmützel. Mitten durch deine Siedlung...\n\nBaue eine florierende Siedlung — und überlebe die regelmäßigen Überfälle der marodierenden Murmeltier-Horden.'
      },
      {
        heading: 'Bauen. Plündern. Bauen.',
        text: 'Du spielst 4 Jahreszeiten und jede besteht aus Bauen → Rüsten → Überfall. Außerdem Im Winter! Da gibt es keinen Überfall — die Horden machen Winterschlafen.'
      },
      {
        heading: 'Erwecke die Siedlung zum Leben',
        text: 'Sichere dir die besten Karten für dein 3×3-Raster. Karten sind Gebäude und liefern Rohstoffe (Holz, Nahrung, Glas) Punkte, Verteidigung oder Sonderfähigkeiten. Du kannst Gebäude upgraden (gleicher Rohstoff, bis zu 3) oder ersetzen — aber jede Aktion zählt.'
      }
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
        heading: '3 Würfel, 1 Geheimnis & Gerüchte',
        text: 'Drei Würfel bestimmen den Überfall: 🟡 Gelb = Angriffsrichtung (NW bis S), 🔵 Blau = Angreiferzahl, 🔴 Rot = Champion-Fähigkeit. Mindestens einer ist immer verborgen, denn der höchste Würfel wird nicht aufgedeckt — du weißt nie alles.'
      },
      {
        heading: 'Der Überfall',
        text: 'Angreifer ziehen Feld für Feld durch die Stadt. Jedes Gebäude wehrt sich mit seiner Verteidigung. Wird ein Feld dennoch überrannt, ist das Gebäude geplündert — es zählt bei der Wertung nicht. Befestigte Gebäude (Turm) überleben alles.'
      }
    ]
  },
  {
    title: 'Nach dem Überfall ist vor dem Überfall',
    icon: '★',
    sections: [
      {
        heading: 'Wertung',
        text: 'Am Ende jeder Jahreszeit zählen alle aktiven (nicht geplünderten) Gebäude ihre Siegpunkte. Manche Karten geben Punkte basierend auf Würfelwerten, Rohstoffproduktion oder dem Rathaus-Level. Nach 4 Jahreszeiten gewinnt dein Highscore.'
      },
      {
        heading: 'Rathaus & Innovation',
        text: 'Dein Rathaus steht uneinnehmbar in der Mitte. Schiebe eine Karte darunter um es aufzuwerten (max. Level 6) — du erhältst sofort eine Münze und kannst mit jeder Ausbaustufe spektakuläre Gebäude bauen.'
      },
      {
        heading: 'Und täglich grüßt das Murmeltal...',
        text: 'Der verborgen Würfel ist dein größter Feind. Baue so, dass du auch den schlimmsten Fall überlebst — nicht nur den wahrscheinlichsten. Viel Glück, Bürgermeister.'
      }
    ]
  }
];
