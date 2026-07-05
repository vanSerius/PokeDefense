// Tower-Definitionen: alle Pokémon-Linien mit Stufen, Angriffen & Evo-Regeln.
// evo = Bedingung, um DIESE Stufe zu erreichen:
//   { gold, kills }                  – Gold zahlen + Kills des Towers
//   { gold, kills, stone:'feuer' }   – zusätzlich Evolutionsstein nötig (Item-Draft)
//   { trade:true }                   – Tausch-Evolution: zwei Tower tauschen die Plätze
// noFly / onlyGroundHit etc. über targets gesteuert.

export const LINES = {
  // ============ ROT – Der Klassiker ============
  glumanda: {
    key: 'glumanda', trainer: 'rot', cost: 95,
    desc: 'Feuerbälle mit Brand-Schaden über Zeit.',
    stages: [
      { dex: 4, name: 'Glumanda', types: ['feuer'],
        attack: { kind: 'orb', type: 'feuer', visual: 'fireball', dmg: 11, rate: 1.1, range: 145, projSpeed: 340, effect: { burn: { dps: 4, dur: 2 } } } },
      { dex: 5, name: 'Glutexo', types: ['feuer'], evo: { gold: 140, kills: 8 },
        attack: { kind: 'orb', type: 'feuer', visual: 'fireball', dmg: 24, rate: 1.25, range: 158, projSpeed: 360, splash: 34, effect: { burn: { dps: 8, dur: 2.5 } } } },
      { dex: 6, name: 'Glurak', types: ['feuer', 'flug'], evo: { gold: 420, kills: 20 },
        attack: { kind: 'orb', type: 'feuer', visual: 'fireball', dmg: 50, rate: 1.35, range: 175, projSpeed: 400, splash: 52, effect: { burn: { dps: 16, dur: 3 } } } },
    ],
  },
  schiggy: {
    key: 'schiggy', trainer: 'rot', cost: 100,
    desc: 'Wasserpumpe mit Flächenschaden.',
    stages: [
      { dex: 7, name: 'Schiggy', types: ['wasser'],
        attack: { kind: 'lob', type: 'wasser', visual: 'water', dmg: 14, rate: 0.8, range: 150, projSpeed: 300, splash: 46 } },
      { dex: 8, name: 'Schillok', types: ['wasser'], evo: { gold: 150, kills: 8 },
        attack: { kind: 'lob', type: 'wasser', visual: 'water', dmg: 30, rate: 0.85, range: 162, projSpeed: 320, splash: 58 } },
      { dex: 9, name: 'Turtok', types: ['wasser'], evo: { gold: 430, kills: 20 },
        attack: { kind: 'lob', type: 'wasser', visual: 'water', dmg: 62, rate: 0.9, range: 180, projSpeed: 340, splash: 74 } },
    ],
  },
  bisasam: {
    key: 'bisasam', trainer: 'rot', cost: 90,
    desc: 'Rankenhieb: verlangsamt und vergiftet.',
    stages: [
      { dex: 1, name: 'Bisasam', types: ['pflanze', 'gift'],
        attack: { kind: 'orb', type: 'pflanze', visual: 'leaf', dmg: 9, rate: 1.2, range: 140, projSpeed: 330, effect: { slow: { f: 0.72, dur: 1.2 }, poison: { dps: 3, dur: 2, stack: 2 } } } },
      { dex: 2, name: 'Bisaknosp', types: ['pflanze', 'gift'], evo: { gold: 135, kills: 8 },
        attack: { kind: 'orb', type: 'pflanze', visual: 'leaf', dmg: 19, rate: 1.3, range: 152, projSpeed: 350, effect: { slow: { f: 0.62, dur: 1.5 }, poison: { dps: 6, dur: 2.5, stack: 3 } } } },
      { dex: 3, name: 'Bisaflor', types: ['pflanze', 'gift'], evo: { gold: 400, kills: 20 },
        attack: { kind: 'orb', type: 'pflanze', visual: 'leaf', dmg: 40, rate: 1.4, range: 168, projSpeed: 370, splash: 40, effect: { slow: { f: 0.5, dur: 1.8 }, poison: { dps: 12, dur: 3, stack: 4 } } } },
    ],
  },
  pikachu: {
    key: 'pikachu', trainer: 'rot', cost: 130,
    desc: 'Kettenblitz auf mehrere Ziele. Stark gegen Flug & Wasser, wirkungslos gegen Boden.',
    stages: [
      { dex: 25, name: 'Pikachu', types: ['elektro'],
        attack: { kind: 'chain', type: 'elektro', visual: 'bolt', dmg: 13, rate: 1.0, range: 155, chains: 3, chainRange: 110 } },
      { dex: 26, name: 'Raichu', types: ['elektro'], evo: { gold: 320, kills: 14, stone: 'donner' },
        attack: { kind: 'chain', type: 'elektro', visual: 'bolt', dmg: 34, rate: 1.15, range: 175, chains: 5, chainRange: 130 } },
    ],
  },
  tragosso: {
    key: 'tragosso', trainer: 'rot', cost: 140,
    desc: 'Knochen-Bumerang: hoher Schaden, trifft aber KEINE fliegenden Gegner.',
    targets: { fly: false },
    stages: [
      { dex: 104, name: 'Tragosso', types: ['boden'],
        attack: { kind: 'boomerang', type: 'boden', visual: 'bone', dmg: 22, rate: 0.75, range: 170, projSpeed: 300 } },
      { dex: 105, name: 'Knogga', types: ['boden'], evo: { gold: 165, kills: 9 },
        attack: { kind: 'boomerang', type: 'boden', visual: 'bone', dmg: 55, rate: 0.85, range: 195, projSpeed: 330 } },
    ],
  },
  dratini: {
    key: 'dratini', trainer: 'rot', cost: 260,
    desc: 'Drachenwut: teurer Spätspiel-Allrounder mit enormem Schaden.',
    stages: [
      { dex: 147, name: 'Dratini', types: ['drache'],
        attack: { kind: 'orb', type: 'drache', visual: 'dragon', dmg: 26, rate: 1.0, range: 160, projSpeed: 380 } },
      { dex: 148, name: 'Dragonir', types: ['drache'], evo: { gold: 300, kills: 11 },
        attack: { kind: 'orb', type: 'drache', visual: 'dragon', dmg: 58, rate: 1.1, range: 178, projSpeed: 400, splash: 36 } },
      { dex: 149, name: 'Dragoran', types: ['drache', 'flug'], evo: { gold: 640, kills: 26 },
        attack: { kind: 'orb', type: 'drache', visual: 'dragon', dmg: 120, rate: 1.2, range: 200, projSpeed: 430, splash: 55 } },
    ],
  },

  // ============ SABRINA – Die Kontrolleurin ============
  abra: {
    key: 'abra', trainer: 'sabrina', cost: 110,
    desc: 'Konfusion: teleportiert Gegner auf dem Pfad zurück!',
    stages: [
      { dex: 63, name: 'Abra', types: ['psycho'],
        attack: { kind: 'beam', type: 'psycho', visual: 'psy', dmg: 8, rate: 0.8, range: 150, effect: { push: { dist: 55 } } } },
      { dex: 64, name: 'Kadabra', types: ['psycho'], evo: { gold: 160, kills: 8 },
        attack: { kind: 'beam', type: 'psycho', visual: 'psy', dmg: 20, rate: 0.9, range: 165, effect: { push: { dist: 85 } } } },
      { dex: 65, name: 'Simsala', types: ['psycho'], evo: { trade: true },
        attack: { kind: 'beam', type: 'psycho', visual: 'psy', dmg: 55, rate: 1.05, range: 185, splash: 44, effect: { push: { dist: 120 } } } },
    ],
  },
  traumato: {
    key: 'traumato', trainer: 'sabrina', cost: 100,
    desc: 'Hypnose: Chance, Gegner in Schlaf zu versetzen.',
    stages: [
      { dex: 96, name: 'Traumato', types: ['psycho'],
        attack: { kind: 'beam', type: 'psycho', visual: 'psy', dmg: 10, rate: 1.0, range: 145, effect: { sleep: { dur: 1.1, chance: 0.22 } } } },
      { dex: 97, name: 'Hypno', types: ['psycho'], evo: { gold: 165, kills: 9 },
        attack: { kind: 'beam', type: 'psycho', visual: 'psy', dmg: 26, rate: 1.1, range: 165, effect: { sleep: { dur: 1.6, chance: 0.3 } } } },
    ],
  },
  nebulak: {
    key: 'nebulak', trainer: 'sabrina', cost: 120,
    desc: 'Geister-Lecker trifft ALLES – auch Fliegende & Grabende.',
    targets: { dig: true },
    stages: [
      { dex: 92, name: 'Nebulak', types: ['geist', 'gift'],
        attack: { kind: 'orb', type: 'geist', visual: 'shadow', dmg: 12, rate: 1.15, range: 150, projSpeed: 320, effect: { slow: { f: 0.8, dur: 0.8 } } } },
      { dex: 93, name: 'Alpollo', types: ['geist', 'gift'], evo: { gold: 175, kills: 9 },
        attack: { kind: 'orb', type: 'geist', visual: 'shadow', dmg: 28, rate: 1.25, range: 165, projSpeed: 340, effect: { slow: { f: 0.7, dur: 1.1 } } } },
      { dex: 94, name: 'Gengar', types: ['geist', 'gift'], evo: { trade: true },
        attack: { kind: 'orb', type: 'geist', visual: 'shadow', dmg: 62, rate: 1.4, range: 180, projSpeed: 370, splash: 46, effect: { slow: { f: 0.6, dur: 1.4 } } } },
    ],
  },
  voltobal: {
    key: 'voltobal', trainer: 'sabrina', cost: 120,
    desc: 'Legt Explosions-Minen auf den Pfad, die Gegner betäuben.',
    stages: [
      { dex: 100, name: 'Voltobal', types: ['elektro'],
        attack: { kind: 'mine', type: 'elektro', visual: 'bolt', dmg: 45, rate: 0.22, range: 150, splash: 55, maxMines: 2, effect: { stun: { dur: 0.8 } } } },
      { dex: 101, name: 'Lektrobal', types: ['elektro'], evo: { gold: 230, kills: 9 },
        attack: { kind: 'mine', type: 'elektro', visual: 'bolt', dmg: 110, rate: 0.3, range: 175, splash: 75, maxMines: 3, effect: { stun: { dur: 1.2 } } } },
    ],
  },
  rossana: {
    key: 'rossana', trainer: 'sabrina', cost: 170,
    desc: 'Eisige Aura: verlangsamt alle Gegner in Reichweite dauerhaft.',
    stages: [
      { dex: 124, name: 'Rossana', types: ['eis', 'psycho'],
        attack: { kind: 'aura', type: 'eis', visual: 'ice', dmg: 7, rate: 1.4, range: 130, effect: { slow: { f: 0.55, dur: 0.7 } } } },
    ],
  },
  pantimos: {
    key: 'pantimos', trainer: 'sabrina', cost: 150,
    desc: 'Support: +25% Schaden für Tower in Reichweite, Barriere stoppt Gegner.',
    stages: [
      { dex: 122, name: 'Pantimos', types: ['psycho'],
        attack: { kind: 'support', type: 'psycho', visual: 'psy', buff: 1.25, range: 145, barrier: { every: 9, dur: 1.6 } } },
    ],
  },

  // ============ KOGA – Der Giftninja ============
  hornliu: {
    key: 'hornliu', trainer: 'koga', cost: 65,
    desc: 'Billiger Schwarm-Turm: schnelle Giftstiche.',
    stages: [
      { dex: 13, name: 'Hornliu', types: ['kaefer', 'gift'],
        attack: { kind: 'orb', type: 'kaefer', visual: 'sting', dmg: 6, rate: 1.6, range: 130, projSpeed: 360, effect: { poison: { dps: 2, dur: 2, stack: 2 } } } },
      { dex: 14, name: 'Kokuna', types: ['kaefer', 'gift'], evo: { gold: 60, kills: 4 },
        attack: { kind: 'orb', type: 'kaefer', visual: 'sting', dmg: 10, rate: 1.8, range: 140, projSpeed: 380, effect: { poison: { dps: 4, dur: 2, stack: 3 } } } },
      { dex: 15, name: 'Bibor', types: ['kaefer', 'gift'], evo: { gold: 190, kills: 12 },
        attack: { kind: 'orb', type: 'kaefer', visual: 'sting', dmg: 24, rate: 2.2, range: 155, projSpeed: 420, effect: { poison: { dps: 8, dur: 2.5, stack: 4 } } } },
    ],
  },
  zubat: {
    key: 'zubat', trainer: 'koga', cost: 105,
    desc: 'Absauger: extrem schnelle Angriffe, Kills geben Extra-Gold.',
    stages: [
      { dex: 41, name: 'Zubat', types: ['gift', 'flug'],
        attack: { kind: 'orb', type: 'gift', visual: 'poison', dmg: 7, rate: 2.2, range: 140, projSpeed: 420, effect: { goldOnKill: 2 } } },
      { dex: 42, name: 'Golbat', types: ['gift', 'flug'], evo: { gold: 165, kills: 9 },
        attack: { kind: 'orb', type: 'gift', visual: 'poison', dmg: 15, rate: 2.6, range: 155, projSpeed: 450, effect: { goldOnKill: 3 } } },
      { dex: 169, name: 'Crobat', types: ['gift', 'flug'], evo: { gold: 300, kills: 35, friendship: true },
        attack: { kind: 'orb', type: 'gift', visual: 'poison', dmg: 34, rate: 3.2, range: 175, projSpeed: 500, effect: { goldOnKill: 5 } } },
    ],
  },
  smogon: {
    key: 'smogon', trainer: 'koga', cost: 115,
    desc: 'Giftwolken, die auf dem Pfad liegen bleiben.',
    stages: [
      { dex: 109, name: 'Smogon', types: ['gift'],
        attack: { kind: 'lob', type: 'gift', visual: 'poison', dmg: 8, rate: 0.65, range: 145, projSpeed: 260, splash: 50, cloud: { dur: 2.5, radius: 50, dps: 7 } } },
      { dex: 110, name: 'Smogmog', types: ['gift'], evo: { gold: 215, kills: 10 },
        attack: { kind: 'lob', type: 'gift', visual: 'poison', dmg: 18, rate: 0.75, range: 165, projSpeed: 280, splash: 66, cloud: { dur: 3.5, radius: 66, dps: 15 } } },
    ],
  },
  sleima: {
    key: 'sleima', trainer: 'koga', cost: 95,
    desc: 'Schleimpfützen verlangsamen und vergiften Gegner.',
    stages: [
      { dex: 88, name: 'Sleima', types: ['gift'],
        attack: { kind: 'lob', type: 'gift', visual: 'poison', dmg: 9, rate: 0.7, range: 140, projSpeed: 250, splash: 44, cloud: { dur: 2.2, radius: 46, dps: 3, slow: 0.6 } } },
      { dex: 89, name: 'Sleimok', types: ['gift'], evo: { gold: 190, kills: 10 },
        attack: { kind: 'lob', type: 'gift', visual: 'poison', dmg: 20, rate: 0.8, range: 158, projSpeed: 270, splash: 58, cloud: { dur: 3.2, radius: 60, dps: 7, slow: 0.5 } } },
    ],
  },
  nidoran: {
    key: 'nidoran', trainer: 'koga', cost: 135,
    desc: 'Hornattacke mit Chance auf kritische Treffer. Mondstein für Nidoking!',
    stages: [
      { dex: 32, name: 'Nidoran♂', types: ['gift'],
        attack: { kind: 'orb', type: 'gift', visual: 'poison', dmg: 14, rate: 1.0, range: 150, projSpeed: 350, crit: { chance: 0.15, mult: 2 } } },
      { dex: 33, name: 'Nidorino', types: ['gift'], evo: { gold: 160, kills: 8 },
        attack: { kind: 'orb', type: 'gift', visual: 'poison', dmg: 30, rate: 1.1, range: 162, projSpeed: 370, crit: { chance: 0.2, mult: 2 } } },
      { dex: 34, name: 'Nidoking', types: ['gift', 'boden'], evo: { gold: 380, kills: 18, stone: 'mond' },
        attack: { kind: 'orb', type: 'boden', visual: 'rock', dmg: 70, rate: 1.2, range: 180, projSpeed: 390, splash: 42, crit: { chance: 0.25, mult: 2.5 } } },
    ],
  },
  bluzuk: {
    key: 'bluzuk', trainer: 'koga', cost: 110,
    desc: 'Schlafpuder: Chance, ganze Gruppen einzuschläfern.',
    stages: [
      { dex: 48, name: 'Bluzuk', types: ['kaefer', 'gift'],
        attack: { kind: 'lob', type: 'kaefer', visual: 'sting', dmg: 9, rate: 0.8, range: 145, projSpeed: 280, splash: 48, effect: { sleep: { dur: 0.9, chance: 0.25 } } } },
      { dex: 49, name: 'Omot', types: ['kaefer', 'gift'], evo: { gold: 205, kills: 10 },
        attack: { kind: 'lob', type: 'kaefer', visual: 'sting', dmg: 20, rate: 0.9, range: 162, projSpeed: 300, splash: 62, effect: { sleep: { dur: 1.4, chance: 0.32 } } } },
    ],
  },

  // ============ GIOVANNI – Der Boss (geheim) ============
  digda: {
    key: 'digda', trainer: 'giovanni', cost: 80,
    desc: 'Schaufler: günstig, schnell, trifft keine Fliegenden.',
    targets: { fly: false },
    stages: [
      { dex: 50, name: 'Digda', types: ['boden'],
        attack: { kind: 'orb', type: 'boden', visual: 'rock', dmg: 10, rate: 1.5, range: 135, projSpeed: 340 } },
      { dex: 51, name: 'Digdri', types: ['boden'], evo: { gold: 140, kills: 8 },
        attack: { kind: 'orb', type: 'boden', visual: 'rock', dmg: 26, rate: 1.9, range: 150, projSpeed: 380 } },
    ],
  },
  rhyhorn: {
    key: 'rhyhorn', trainer: 'giovanni', cost: 150,
    desc: 'Steinwurf mit Flächenschaden – stark gegen Fliegende.',
    stages: [
      { dex: 111, name: 'Rhyhorn', types: ['boden', 'gestein'],
        attack: { kind: 'lob', type: 'gestein', visual: 'rock', dmg: 20, rate: 0.65, range: 155, projSpeed: 280, splash: 50 } },
      { dex: 112, name: 'Rizeros', types: ['boden', 'gestein'], evo: { gold: 260, kills: 12 },
        attack: { kind: 'lob', type: 'gestein', visual: 'rock', dmg: 52, rate: 0.75, range: 175, projSpeed: 300, splash: 68 } },
    ],
  },
  kangama: {
    key: 'kangama', trainer: 'giovanni', cost: 200,
    desc: 'Zerschmetterer: massive Einzelziel-Schläge.',
    stages: [
      { dex: 115, name: 'Kangama', types: ['normal'],
        attack: { kind: 'orb', type: 'normal', visual: 'rock', dmg: 48, rate: 0.7, range: 150, projSpeed: 400, crit: { chance: 0.2, mult: 2 } } },
    ],
  },
  mauzi: {
    key: 'mauzi', trainer: 'giovanni', cost: 90,
    desc: 'Zahltag: Kills geben deutlich mehr Gold.',
    stages: [
      { dex: 52, name: 'Mauzi', types: ['normal'],
        attack: { kind: 'orb', type: 'normal', visual: 'rock', dmg: 8, rate: 1.3, range: 140, projSpeed: 360, effect: { goldOnKill: 4 } } },
      { dex: 53, name: 'Snobilikat', types: ['normal'], evo: { gold: 165, kills: 9 },
        attack: { kind: 'orb', type: 'normal', visual: 'rock', dmg: 20, rate: 1.6, range: 158, projSpeed: 390, effect: { goldOnKill: 8 } } },
    ],
  },
  nidoranw: {
    key: 'nidoranw', trainer: 'giovanni', cost: 135,
    desc: 'Giftige Königin: Flächengift. Mondstein für Nidoqueen!',
    stages: [
      { dex: 29, name: 'Nidoran♀', types: ['gift'],
        attack: { kind: 'orb', type: 'gift', visual: 'poison', dmg: 12, rate: 1.1, range: 148, projSpeed: 350, effect: { poison: { dps: 3, dur: 2.5, stack: 3 } } } },
      { dex: 30, name: 'Nidorina', types: ['gift'], evo: { gold: 155, kills: 8 },
        attack: { kind: 'orb', type: 'gift', visual: 'poison', dmg: 26, rate: 1.2, range: 160, projSpeed: 370, effect: { poison: { dps: 6, dur: 3, stack: 4 } } } },
      { dex: 31, name: 'Nidoqueen', types: ['gift', 'boden'], evo: { gold: 370, kills: 18, stone: 'mond' },
        attack: { kind: 'lob', type: 'gift', visual: 'poison', dmg: 55, rate: 1.0, range: 178, projSpeed: 320, splash: 60, effect: { poison: { dps: 12, dur: 3, stack: 5 } } } },
    ],
  },
  mewtwo: {
    key: 'mewtwo', trainer: 'giovanni', cost: 650,
    desc: 'Genetische Superwaffe: verheerende Psycho-Sphären.',
    targets: { dig: true },
    stages: [
      { dex: 150, name: 'Mewtwo', types: ['psycho'],
        attack: { kind: 'orb', type: 'psycho', visual: 'psy', dmg: 150, rate: 1.1, range: 210, projSpeed: 450, splash: 60, effect: { push: { dist: 60 } } } },
    ],
  },
};

// Alle Dex-Nummern der Tower (fürs Preloading)
export function towerDexIds() {
  const ids = [];
  for (const line of Object.values(LINES)) for (const s of line.stages) ids.push(s.dex);
  return ids;
}
