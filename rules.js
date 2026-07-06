// ═══════════════════════════════════════════
//  TALWACHT — Spielanleitung
//  Diese Datei separat pflegen.
//  Kein Hochladen von game.js / index.html nötig
//  wenn nur Text geändert wird.
// ═══════════════════════════════════════════

const RULES_PAGES = [
  {
    title: 'NEU: Kapazität',
    icon: '⚫︎⚫︎⚫︎',
    sections: [
      {
        heading: '🆕 Neue Mechanik: Kapazität',
        text: 'Die Horde kommt! Verstecke deine Reichtümer, stationiere Ritter, errichte Türme — doch nicht jedes Gebäude hat genug Platz dafür. Jede Karte hat jetzt eine Kapazität für Aufwertungen, sichtbar als Punkte unten rechts auf der Karte. Die Kapazität begrenzt, wie viele Token insgesamt auf einer Karte platziert werden dürfen — Ritter, Münzen und Türme zählen als Aufwertungen.<br><br><strong>Kapazität gibt der Kartenauswahl weitere Tiefe</strong> — neben Siegpunkten, Verteidigung und Effekt/Rohstoff.',
        image: 'kapazitaet.png'
      },
      {
        heading: 'Kapazität nach Kartentyp',
        text: 'Gebäude, welche Rohstoffe produzieren (grün) oder fragile (gelb) Gebäude, sind meistens schon ausgelastet oder nicht stabil genug, um Münzen und Ritter darin zu verstecken. Wohnhäuser, Gebäude ohne Funktion (blau) — und die NEUEN Karten: verlassene Gebäude — haben mehr Platz und eignen sich damit besonders gut, um viele wertvolle Münzen vor der gierigen Horde zu verbergen oder mutige Ritter für einen Hinterhalt zu stationieren.',
        image: 's11.png'
      },
      {
        heading: 'Neue Sondergebäude',
        text: 'Die cleveren Baumeister vom Zwischental sind bereit, neue Sondergebäude für dich zu errichten:<br><br><strong>Die Lagerfeste (Z2)</strong> — Gibt den Nachbarkarten zusätzlich 2 Kapazitäten. Möchtest du noch mehr Münzen in einem Gebäude verstecken, mehr Ritter stationieren oder einen Turm platzieren, wo eigentlich kein Platz ist? Die Lagerfeste hilft!<br><br><strong>Die Speicherstadt (Z8)</strong> — Unendlich Kapazität. Hier passt mehr rein, als du besitzt.<br><br><strong>Die geheimen Katakomben (Z23)</strong> — Gelagerte Münzen werden nicht geplündert. Nur du kennst den geheimen Eingang zu den Katakomben — deine Münzen sind hier sicher.',
        image: 'sonder-kapazitaet.png'
      }
    ]
  },
  {
    title: 'Neu: Münzen auf Karten',
    icon: 'res-muenze.png',
    sections: [
      {
        heading: '🆕 Münzen als "Ritter für Punkte"',
        text: 'Ähnlich wie Ritter die Verteidigung einer Karte erhöhen, erhöhen Münzen die Siegpunkte. Münzen können jetzt in Gebäuden versteckt werden, um bei jeder Wertung Zinsen in Form von 2 Siegpunkten zu erbringen. Aber Achtung: Wird die Karte geplündert, werden auch die Münzen gestohlen!'
      },
      {
        heading: 'Zinsen = +2 Siegpunkte pro Münze',
        text: 'Jede Münze auf einem aktiven (nicht geplünderten) Gebäude bringt +2 Siegpunkte bei der Jahreszeitenwertung. Münzen bleiben auf der Karte und werden jede Jahreszeit neu bewertet — solange sie nicht geplündert werden. Eine einzelne, frühzeitig platzierte Münze kann also 8 Siegpunkte bringen.'
      },
      {
        heading: 'Risiko & Platzierung (Demo)',
        text: 'Wird ein Gebäude geplündert, gehen alle Münzen darauf sofort verloren — vor der Wertung. Münzen auf einem Gebäude mit Turm sind sicher: der Turm macht das Gebäude unplünderbar. Münzen im persönlichen Vorrat (nicht auf einer Karte) bringen 0 Siegpunkte bei Spielende.<br><br>Platzierung in der Rüstphase: Münz-Button antippen → Gebäude antippen → Münze wird dort gelagert. Jede gelagerte Münze belegt 1 Kapazitäts-Slot.'
      }
    ]
  },
  {
    title: 'NEU: Barrieren & Türme',
    icon: 'def-barriere.png def-turm.png',
    sections: [
      {
        heading: 'Barrieren grundlegend überarbeitet',
        text: 'Barrieren sind keine permanenten Wände mehr. Jede Barriere hat jetzt Verteidigung 1 und ist fragil: sie hält genau 1 Angreifer auf und verschwindet danach.'
      },
      {
        heading: 'Außenkanten (wie bisher)',
        text: 'Barrieren können wie bisher an den Außenkanten von Karten platziert werden. Sie werden ausgelöst, bevor die Horde dieses Gebäude betritt — stoppen 1 Plünderer, dann weg.'
      },
      {
        heading: 'Innenkanten (NEU)',
        text: 'Barrieren können jetzt auch zwischen zwei benachbarten Gebäuden platziert werden. Zieht die Horde von Feld zu Feld über eine Barriere, stoppt sie 1 Plünderer beim Übergang. Max. 1 Barriere pro Kante.',
        image: 'barriere-zwischenraum.png'
      },
      {
        heading: 'Türme: NEUE Regeln',
        text: 'Maximal 2 Türme pro Siedlung — platziere sie geschickt. Ein Turm setzt außerdem die Verteidigung einer Karte dauerhaft auf 0 — die Karte selbst hält keine Plünderer mehr ab. Nur Ritter auf der Karte zählen noch als Verteidigung.<br><br>Nutze das zu deinem Vorteil: Ein Turm hebt somit auch die Fragilität auf — fragile Karten werden stabil und nach einem Überfall nicht mehr entfernt.',
        image: 'maxturm.png'
      }
    ]
  }
];
