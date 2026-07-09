// Trainer-Definitionen: Roster (Tower-Linien) + Freischalt-Bedingungen pro Slot.
// Bedingungstypen (alle in einem Array = UND-Verknüpfung):
//   { builtCount: n }   – mind. n Tower stehen aktuell auf der Map
//   { evoStage: n }     – mind. ein Tower hat Stufe n erreicht (im Run)
//   { lineCount: [key, n] } – n Tower einer bestimmten Linie stehen auf der Map
//   { mapReached: n }   – Map n im Run erreicht

export const TRAINERS = {
  rot: {
    key: 'rot', name: 'Rot', color: '#ef4444',
    desc: 'Der Klassiker aus Alabastia. Ausgewogenes Team mit den drei Kanto-Startern.',
    emblem: [6, 9, 3],
    skill: { name: 'Feuersturm', icon: 6, target: 'point', cd: 20, radius: 115, dmgBase: 60,
             burn: { dpsBase: 10, dur: 3 },
             desc: 'Tippe aufs Feld: Feuersturm mit Flächenschaden + Brand' },
    roster: [
      { line: 'glumanda', unlock: [] },
      { line: 'schiggy', unlock: [] },
      { line: 'bisasam', unlock: [] },
      { line: 'pikachu', unlock: [{ builtCount: 3 }], unlockText: 'Baue 3 Tower' },
      { line: 'tragosso', unlock: [{ evoStage: 2 }], unlockText: 'Entwickle einen Tower (Stufe 2)' },
      { line: 'dratini', unlock: [{ mapReached: 5 }, { evoStage: 3 }], unlockText: 'Erreiche Map 5 + ein Tower auf Stufe 3' },
    ],
  },
  sabrina: {
    key: 'sabrina', name: 'Sabrina', color: '#a855f7',
    desc: 'Die Psycho-Meisterin aus Saffronia. Kontrolliert Gegner mit Teleport, Schlaf & Minen.',
    emblem: [65, 94, 122],
    skill: { name: 'Psychowelle', icon: 65, target: 'global', cd: 24, sleep: 2.5, push: 45,
             desc: 'Alle Gegner schlafen ein und werden zurückgestoßen' },
    roster: [
      { line: 'abra', unlock: [] },
      { line: 'traumato', unlock: [] },
      { line: 'nebulak', unlock: [] },
      { line: 'voltobal', unlock: [{ builtCount: 3 }], unlockText: 'Baue 3 Tower' },
      { line: 'rossana', unlock: [{ evoStage: 2 }], unlockText: 'Entwickle einen Tower (Stufe 2)' },
      { line: 'pantimos', unlock: [{ builtCount: 5 }], unlockText: 'Baue 5 Tower' },
    ],
  },
  koga: {
    key: 'koga', name: 'Koga', color: '#22c55e',
    desc: 'Der Gift-Ninja aus Fuchsania. Zermürbt Gegner mit Gift, Schwärmen und Schleim.',
    emblem: [169, 110, 34],
    skill: { name: 'Gifthagel', icon: 110, target: 'point', cd: 20, radius: 125,
             cloud: { dpsBase: 16, dur: 4.5, slow: 0.55 },
             desc: 'Tippe aufs Feld: großes Giftfeld, das verlangsamt' },
    roster: [
      { line: 'hornliu', unlock: [] },
      { line: 'zubat', unlock: [] },
      { line: 'sleima', unlock: [] },
      { line: 'smogon', unlock: [{ lineCount: ['hornliu', 2] }], unlockText: 'Baue 2× Hornliu-Linie' },
      { line: 'bluzuk', unlock: [{ evoStage: 2 }], unlockText: 'Entwickle einen Tower (Stufe 2)' },
      { line: 'nidoran', unlock: [{ evoStage: 3 }], unlockText: 'Ein Tower auf Stufe 3' },
    ],
  },
  giovanni: {
    key: 'giovanni', name: 'Giovanni', color: '#78716c', secret: true,
    desc: 'Der Boss von Team Rocket. Rohe Gewalt, Gold-Gier und… Mewtwo?!',
    emblem: [150, 112, 31],
    skill: { name: 'Erdbeben', icon: 112, target: 'global', cd: 24, dmgBase: 45, stun: 1.2, groundOnly: true,
             desc: 'Erdbeben: Schaden + Betäubung für alle Boden-Gegner' },
    roster: [
      { line: 'digda', unlock: [] },
      { line: 'mauzi', unlock: [] },
      { line: 'rhyhorn', unlock: [] },
      { line: 'nidoranw', unlock: [{ builtCount: 3 }], unlockText: 'Baue 3 Tower' },
      { line: 'kangama', unlock: [{ evoStage: 2 }], unlockText: 'Entwickle einen Tower (Stufe 2)' },
      { line: 'mewtwo', unlock: [{ mapReached: 8 }, { evoStage: 3 }], unlockText: 'Erreiche Map 8 + ein Tower auf Stufe 3' },
    ],
  },
};
