// Run-Zustand: alles, was zwischen den Maps eines Runs bestehen bleibt.
import { START_HEARTS, BASE_GOLD, GOLD_CARRY, MAP_COUNT } from '../config.js';
import { ITEMS } from '../data/items.js';
import { saveRun, clearRun, getMeta, saveMeta } from '../core/save.js';

export function newRun(trainerKey) {
  return {
    trainer: trainerKey,
    mapIndex: 0,
    hearts: START_HEARTS,
    gold: BASE_GOLD,
    stones: [],
    candy: 0,
    items: [],          // gewählte Item-Keys (für die Anzeige)
    mods: { dmg: 0, range: 0, rate: 0, bounty: 0, waveGold: 0, killXp: 0, friendship: 0 },
    maxEvoStage: 1,
    seed: (Math.random() * 0xffffffff) >>> 0,
  };
}

export function applyItem(run, itemKey) {
  const item = ITEMS[itemKey];
  if (!item) return;
  run.items.push(itemKey);
  if (item.stone) run.stones.push(item.stone);
  if (item.candy) run.candy += item.candy;
  if (item.heartsNow) run.hearts = Math.min(START_HEARTS, run.hearts + item.heartsNow);
  if (item.heartsFull) run.hearts = START_HEARTS;
  if (item.mod) {
    for (const [k, v] of Object.entries(item.mod)) run.mods[k] += v;
  }
}

// Nach gewonnener Map: Gold teilweise mitnehmen, weiter zur nächsten.
// Das Startgold wächst mit, weil die Tower jede Map neu gebaut werden.
export function advanceRun(run, sessionGold) {
  run.mapIndex++;
  run.gold = Math.round(BASE_GOLD * (1 + 0.15 * run.mapIndex) + sessionGold * GOLD_CARRY);
  const meta = getMeta();
  const best = meta.bestMap[run.trainer] || 0;
  if (run.mapIndex + 1 > best) { meta.bestMap[run.trainer] = run.mapIndex + 1; saveMeta(); }
  if (run.mapIndex >= MAP_COUNT) return 'victory';
  saveRun(run);
  return 'next';
}

export function endRun(run, won) {
  const meta = getMeta();
  meta.runs++;
  if (won) {
    meta.wins++;
    meta.giovanniUnlocked = true;
  }
  saveMeta();
  clearRun();
}
