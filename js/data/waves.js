// Wellen-Generator: erzeugt aus Map-Nummer + Seed die Wellen einer Map.
// Jede Welle = Liste von Spawn-Gruppen { enemy, count, gap, hpMult, speedMult }.
import { ENEMIES } from './enemies.js';
import { MAPS } from './maps.js';
import { makeRng, pick, shuffle } from '../core/rng.js';

// Welche Gegner ab welcher Map auftauchen
const POOLS = [
  { from: 1,  keys: ['raupy', 'karpador', 'rattfratz', 'taubsi'] },
  { from: 3,  keys: ['habitak', 'knofensa', 'paras'] },
  { from: 5,  keys: ['sandan', 'zubat', 'enton', 'krabby'] },
  { from: 8,  keys: ['menki', 'digda', 'magnetilo', 'tentacha'] },
  { from: 10, keys: ['fukano', 'kleinstein', 'rattikarl', 'tauboga'] },
  { from: 13, keys: ['machollo', 'ponita', 'muschas'] },
];

function poolFor(mapNo) {
  const keys = [];
  for (const p of POOLS) if (mapNo >= p.from) keys.push(...p.keys);
  return keys;
}

const ARCHETYPES = ['mixed', 'swarm', 'fast', 'tank', 'fly'];

function wavesCount(mapNo) {
  if (mapNo >= 20) return 8;
  if (mapNo >= 15) return 8;
  if (mapNo >= 10) return 7;
  if (mapNo >= 5) return 6;
  return 5;
}

// HP-Skalierung über den Run
export function hpScale(mapNo, waveNo) {
  return Math.pow(1.13, mapNo - 1) * (1 + 0.10 * (waveNo - 1));
}
// Kopfgeld wächst mit, damit man auf späteren Maps genug für Evos hat
export function bountyScale(mapNo) {
  return 1 + (mapNo - 1) * 0.15;
}

export function generateWaves(mapNo, seed) {
  const rng = makeRng(seed * 7919 + mapNo * 104729);
  const map = MAPS[mapNo - 1];
  const pool = poolFor(mapNo);
  const nWaves = wavesCount(mapNo);
  const waves = [];

  for (let w = 1; w <= nWaves; w++) {
    const hpM = hpScale(mapNo, w);
    const groups = [];
    let arch = pick(rng, ARCHETYPES);
    // frühe Maps: kein reiner Flug-Rush in Welle 1
    if (mapNo <= 2 && w === 1) arch = 'mixed';

    const budget = 7 + Math.floor(w * 1.3) + Math.floor(mapNo / 3); // grobe Anzahl

    if (arch === 'swarm') {
      const weak = pool.filter((k) => ENEMIES[k].hp <= 40);
      const key = pick(rng, weak.length ? weak : pool);
      groups.push({ enemy: key, count: Math.round(budget * 1.8), gap: 0.45, hpMult: hpM * 0.6, speedMult: 1 });
    } else if (arch === 'fast') {
      const fast = pool.filter((k) => ENEMIES[k].speed >= 70);
      const key = pick(rng, fast.length ? fast : pool);
      groups.push({ enemy: key, count: budget, gap: 0.7, hpMult: hpM * 0.85, speedMult: 1.25 });
    } else if (arch === 'tank') {
      const tanks = pool.filter((k) => ENEMIES[k].hp >= 60);
      const key = pick(rng, tanks.length ? tanks : pool);
      groups.push({ enemy: key, count: Math.max(3, Math.round(budget * 0.55)), gap: 1.5, hpMult: hpM * 1.7, speedMult: 0.85 });
    } else if (arch === 'fly') {
      const fly = pool.filter((k) => ENEMIES[k].move === 'fly');
      const key = fly.length ? pick(rng, fly) : pick(rng, pool);
      groups.push({ enemy: key, count: budget, gap: 0.8, hpMult: hpM, speedMult: 1.1 });
    } else {
      // mixed: 2–3 Gruppen verschiedener Gegner
      const kinds = shuffle(rng, pool).slice(0, 2 + (rng() < 0.5 ? 1 : 0));
      for (const key of kinds) {
        groups.push({ enemy: key, count: Math.max(2, Math.round(budget / kinds.length)), gap: 0.9, hpMult: hpM, speedMult: 1 });
      }
    }

    // Miniboss ans Ende der letzten Welle
    if (w === nWaves && map.miniboss) {
      groups.push({ enemy: map.miniboss, count: 1, gap: 2, hpMult: hpScale(mapNo, 1), speedMult: 1, miniboss: true });
    }
    waves.push({ groups, archetype: arch });
  }

  // Boss-Welle (Map 10 & 20) als eigene Extra-Welle
  if (map.boss) {
    waves.push({
      groups: [{ enemy: map.boss, count: 1, gap: 0, hpMult: 1, speedMult: 1, boss: true }],
      archetype: 'boss',
    });
  }
  return waves;
}
