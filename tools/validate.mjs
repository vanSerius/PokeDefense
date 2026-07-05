// Daten-Validierung ohne Browser: Maps, Tower, Gegner, Trainer, Items.
// Aufruf: node tools/validate.mjs
import { MAPS, validateMap, pathCells, buildPath } from '../js/data/maps.js';
import { LINES } from '../js/data/pokemon.js';
import { ENEMIES } from '../js/data/enemies.js';
import { TRAINERS } from '../js/data/trainers.js';
import { ITEMS } from '../js/data/items.js';
import { generateWaves } from '../js/data/waves.js';
import { TILE, MAP_COUNT } from '../js/config.js';
import { existsSync } from 'node:fs';

let errors = 0;
const err = (msg) => { console.error('FEHLER:', msg); errors++; };

// ---- Maps ----
if (MAPS.length !== MAP_COUNT) err(`MAPS.length = ${MAPS.length}, erwartet ${MAP_COUNT}`);
MAPS.forEach((m, i) => {
  for (const e of validateMap(m)) err(`Map ${i + 1} (${m.name}): ${e}`);
  const cells = pathCells(m.path);
  if (cells.length < 15) err(`Map ${i + 1}: Pfad sehr kurz (${cells.length} Zellen)`);
  const path = buildPath(m.path, TILE);
  if (path.total <= 0) err(`Map ${i + 1}: Pfadlänge 0`);
  if (m.boss && !ENEMIES[m.boss]) err(`Map ${i + 1}: unbekannter Boss ${m.boss}`);
  if (m.miniboss && !ENEMIES[m.miniboss]) err(`Map ${i + 1}: unbekannter Miniboss ${m.miniboss}`);
});

// ---- Sprites vorhanden? ----
const allDex = new Set();
for (const line of Object.values(LINES)) for (const s of line.stages) allDex.add(s.dex);
for (const e of Object.values(ENEMIES)) allDex.add(e.dex);
for (const dex of allDex) {
  if (!existsSync(new URL(`../assets/sprites/static/${dex}.png`, import.meta.url))) err(`Sprite fehlt: static/${dex}.png`);
  if (!existsSync(new URL(`../assets/sprites/animated/${dex}.gif`, import.meta.url))) err(`Sprite fehlt: animated/${dex}.gif`);
}
for (const item of Object.values(ITEMS)) {
  if (!existsSync(new URL(`../assets/sprites/items/${item.icon}.png`, import.meta.url))) err(`Item-Icon fehlt: ${item.icon}.png`);
}

// ---- Trainer-Roster ----
for (const tr of Object.values(TRAINERS)) {
  if (tr.roster.length !== 6) err(`Trainer ${tr.key}: ${tr.roster.length} Slots, erwartet 6`);
  for (const slot of tr.roster) {
    if (!LINES[slot.line]) err(`Trainer ${tr.key}: unbekannte Linie ${slot.line}`);
    else if (LINES[slot.line].trainer !== tr.key) err(`Linie ${slot.line} gehört zu ${LINES[slot.line].trainer}, nicht ${tr.key}`);
    if (slot.unlock.length && !slot.unlockText) err(`Trainer ${tr.key}/${slot.line}: unlockText fehlt`);
  }
}

// ---- Tower-Stufen ----
for (const line of Object.values(LINES)) {
  line.stages.forEach((s, i) => {
    if (i > 0 && !s.evo) err(`${line.key} Stufe ${i + 1}: evo fehlt`);
    if (!s.attack) err(`${line.key} Stufe ${i + 1}: attack fehlt`);
    else if (!['orb', 'lob', 'chain', 'boomerang', 'aura', 'mine', 'support', 'beam'].includes(s.attack.kind)) {
      err(`${line.key}: unbekannter attack.kind ${s.attack.kind}`);
    }
  });
}

// ---- Wellen generierbar ----
for (let m = 1; m <= MAP_COUNT; m++) {
  const waves = generateWaves(m, 12345);
  if (!waves.length) err(`Map ${m}: keine Wellen`);
  for (const w of waves) {
    for (const g of w.groups) {
      if (!ENEMIES[g.enemy]) err(`Map ${m}: unbekannter Gegner ${g.enemy}`);
      if (!g.count || g.count < 1) err(`Map ${m}: Gruppe ohne count`);
    }
  }
}
const boss10 = generateWaves(10, 1).some((w) => w.groups.some((g) => g.boss));
const boss20 = generateWaves(20, 1).some((w) => w.groups.some((g) => g.boss));
if (!boss10) err('Map 10 hat keine Boss-Welle');
if (!boss20) err('Map 20 hat keine Boss-Welle');

console.log(errors ? `${errors} Fehler gefunden.` : 'Alles OK ✔');
process.exit(errors ? 1 : 0);
