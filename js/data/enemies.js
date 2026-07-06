// Gegner-Definitionen. hp/speed/bounty sind Basiswerte für Map 1
// und werden in waves.js pro Map skaliert.
// move: 'ground' | 'fly' | 'float' | 'dig'
// dig-Gegner tauchen periodisch unter und sind dann unverwundbar.

export const ENEMIES = {
  raupy:      { dex: 10,  name: 'Raupy',      types: ['kaefer'],            move: 'ground', hp: 16,  speed: 52, bounty: 4,  scale: 0.85 },
  taubsi:     { dex: 16,  name: 'Taubsi',     types: ['normal', 'flug'],    move: 'fly',    hp: 20,  speed: 62, bounty: 5,  scale: 0.85 },
  tauboga:    { dex: 17,  name: 'Tauboga',    types: ['normal', 'flug'],    move: 'fly',    hp: 55,  speed: 68, bounty: 9,  scale: 1.0 },
  rattfratz:  { dex: 19,  name: 'Rattfratz',  types: ['normal'],            move: 'ground', hp: 22,  speed: 78, bounty: 5,  scale: 0.85 },
  rattikarl:  { dex: 20,  name: 'Rattikarl',  types: ['normal'],            move: 'ground', hp: 60,  speed: 88, bounty: 10, scale: 1.0 },
  habitak:    { dex: 21,  name: 'Habitak',    types: ['normal', 'flug'],    move: 'fly',    hp: 26,  speed: 74, bounty: 6,  scale: 0.85 },
  sandan:     { dex: 27,  name: 'Sandan',     types: ['boden'],             move: 'ground', hp: 42,  speed: 55, bounty: 7,  scale: 0.9 },
  zubat:      { dex: 41,  name: 'Zubat',      types: ['gift', 'flug'],      move: 'fly',    hp: 24,  speed: 82, bounty: 6,  scale: 0.85 },
  paras:      { dex: 46,  name: 'Paras',      types: ['kaefer', 'pflanze'], move: 'ground', hp: 34,  speed: 48, bounty: 6,  scale: 0.9 },
  digda:      { dex: 50,  name: 'Digda',      types: ['boden'],             move: 'dig',    hp: 38,  speed: 60, bounty: 9,  scale: 0.85, digCycle: { up: 2.2, down: 1.4 } },
  enton:      { dex: 54,  name: 'Enton',      types: ['wasser'],            move: 'ground', hp: 48,  speed: 52, bounty: 8,  scale: 0.95 },
  menki:      { dex: 56,  name: 'Menki',      types: ['kampf'],             move: 'ground', hp: 40,  speed: 85, bounty: 8,  scale: 0.9 },
  fukano:     { dex: 58,  name: 'Fukano',     types: ['feuer'],             move: 'ground', hp: 50,  speed: 80, bounty: 9,  scale: 0.95 },
  machollo:   { dex: 66,  name: 'Machollo',   types: ['kampf'],             move: 'ground', hp: 75,  speed: 48, bounty: 10, scale: 1.0 },
  knofensa:   { dex: 69,  name: 'Knofensa',   types: ['pflanze', 'gift'],   move: 'ground', hp: 38,  speed: 58, bounty: 7,  scale: 0.9 },
  tentacha:   { dex: 72,  name: 'Tentacha',   types: ['wasser', 'gift'],    move: 'float',  hp: 55,  speed: 50, bounty: 10, scale: 0.95, regen: 2 },
  kleinstein: { dex: 74,  name: 'Kleinstein', types: ['gestein', 'boden'],  move: 'ground', hp: 95,  speed: 34, bounty: 11, scale: 0.9 },
  ponita:     { dex: 77,  name: 'Ponita',     types: ['feuer'],             move: 'ground', hp: 60,  speed: 95, bounty: 11, scale: 1.0 },
  magnetilo:  { dex: 81,  name: 'Magnetilo',  types: ['elektro'],           move: 'float',  hp: 58,  speed: 55, bounty: 9,  scale: 0.85 },
  muschas:    { dex: 90,  name: 'Muschas',    types: ['wasser'],            move: 'ground', hp: 110, speed: 30, bounty: 12, scale: 0.85 },
  krabby:     { dex: 98,  name: 'Krabby',     types: ['wasser'],            move: 'ground', hp: 52,  speed: 56, bounty: 8,  scale: 0.85 },
  karpador:   { dex: 129, name: 'Karpador',   types: ['wasser'],            move: 'ground', hp: 12,  speed: 42, bounty: 3,  scale: 0.9 },

  // ---- Minibosse ----
  onix:    { dex: 95,  name: 'Onix',   types: ['gestein', 'boden'], move: 'ground', hp: 480,  speed: 26, bounty: 60,  scale: 1.5, miniboss: true },
  arkani:  { dex: 59,  name: 'Arkani', types: ['feuer'],            move: 'ground', hp: 420,  speed: 62, bounty: 60,  scale: 1.3, miniboss: true },
  lapras:  { dex: 131, name: 'Lapras', types: ['wasser', 'eis'],    move: 'float',  hp: 620,  speed: 32, bounty: 80,  scale: 1.4, miniboss: true, regen: 6 },
  relaxo:  { dex: 143, name: 'Relaxo', types: ['normal'],           move: 'ground', hp: 900,  speed: 18, bounty: 100, scale: 1.5, miniboss: true },

  // ---- Bosse ----
  garados: { dex: 130, name: 'Garados', types: ['wasser', 'flug'], move: 'float', hp: 720, speed: 30, bounty: 400, scale: 1.9, boss: true,
             ability: 'garados' }, // taucht periodisch ab, Wutanfall unter 30% HP (HP skalieren via hpScale)
  mewtwo:  { dex: 150, name: 'Mewtwo', types: ['psycho'], move: 'float', hp: 820, speed: 26, bounty: 1000, scale: 1.8, boss: true,
             ability: 'mewtwo' },  // Schildphasen, Klone, deaktiviert Tower
  mewtwoKlon: { dex: 150, name: 'Mewtwo-Klon', types: ['psycho'], move: 'float', hp: 350, speed: 55, bounty: 25, scale: 1.1, shiny: true },
};

export function enemyDexIds() {
  return Object.values(ENEMIES).map((e) => e.dex);
}
