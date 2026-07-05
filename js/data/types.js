// Vereinfachte Gen-1-Typentabelle. CHART[angriff][verteidigung] = Multiplikator.
// Nicht gelistete Kombinationen sind neutral (×1).

export const TYPE_NAMES = {
  normal: 'Normal', feuer: 'Feuer', wasser: 'Wasser', pflanze: 'Pflanze',
  elektro: 'Elektro', eis: 'Eis', kampf: 'Kampf', gift: 'Gift',
  boden: 'Boden', flug: 'Flug', psycho: 'Psycho', kaefer: 'Käfer',
  gestein: 'Gestein', geist: 'Geist', drache: 'Drache',
};

export const TYPE_COLORS = {
  normal: '#a8a878', feuer: '#f08030', wasser: '#6890f0', pflanze: '#78c850',
  elektro: '#f8d030', eis: '#98d8d8', kampf: '#c03028', gift: '#a040a0',
  boden: '#e0c068', flug: '#a890f0', psycho: '#f85888', kaefer: '#a8b820',
  gestein: '#b8a038', geist: '#705898', drache: '#7038f8',
};

const CHART = {
  feuer:   { pflanze: 2, eis: 2, kaefer: 2, wasser: 0.5, feuer: 0.5, gestein: 0.5, drache: 0.5 },
  wasser:  { feuer: 2, boden: 2, gestein: 2, wasser: 0.5, pflanze: 0.5, drache: 0.5 },
  pflanze: { wasser: 2, boden: 2, gestein: 2, feuer: 0.5, pflanze: 0.5, gift: 0.5, flug: 0.5, kaefer: 0.5, drache: 0.5 },
  elektro: { wasser: 2, flug: 2, elektro: 0.5, pflanze: 0.5, drache: 0.5, boden: 0 },
  eis:     { pflanze: 2, boden: 2, flug: 2, drache: 2, wasser: 0.5, eis: 0.5 },
  kampf:   { normal: 2, eis: 2, gestein: 2, gift: 0.5, flug: 0.5, psycho: 0.5, kaefer: 0.5, geist: 0 },
  gift:    { pflanze: 2, kaefer: 2, gift: 0.5, boden: 0.5, gestein: 0.5, geist: 0.5 },
  boden:   { feuer: 2, elektro: 2, gift: 2, gestein: 2, pflanze: 0.5, kaefer: 0.5, flug: 0 },
  flug:    { pflanze: 2, kampf: 2, kaefer: 2, elektro: 0.5, gestein: 0.5 },
  psycho:  { kampf: 2, gift: 2, psycho: 0.5 },
  kaefer:  { pflanze: 2, psycho: 2, gift: 2, feuer: 0.5, kampf: 0.5, flug: 0.5, geist: 0.5 },
  gestein: { feuer: 2, eis: 2, flug: 2, kaefer: 2, kampf: 0.5, boden: 0.5 },
  geist:   { geist: 2, psycho: 2, normal: 0 },
  drache:  { drache: 2 },
  normal:  { gestein: 0.5, geist: 0 },
};

// Multiplikator eines Angriffstyps gegen die Typen eines Gegners.
// Untergrenze 0.25, damit kein Tower völlig nutzlos wird (außer explizit ×0 → 0.25).
export function typeMult(attackType, defTypes) {
  if (!attackType) return 1;
  let m = 1;
  const row = CHART[attackType] || {};
  for (const t of defTypes) {
    const v = row[t];
    if (v !== undefined) m *= v;
  }
  return Math.max(0.25, m);
}

// Für UI: Stärken/Schwächen eines Angriffstyps auflisten
export function typeMatchups(attackType) {
  const row = CHART[attackType] || {};
  const strong = [], weak = [];
  for (const [t, v] of Object.entries(row)) {
    if (v >= 2) strong.push(TYPE_NAMES[t]);
    else if (v <= 0.5) weak.push(TYPE_NAMES[t]);
  }
  return { strong, weak };
}
