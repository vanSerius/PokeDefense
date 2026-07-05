// Item-Draft-Pool: Nach jeder Map wird 1 aus 3 gewählt.
// Wirkung entweder sofort (apply) oder als permanenter Run-Modifikator.

export const ITEMS = {
  feuerstein:   { icon: 'fire-stone',    name: 'Feuerstein',   stone: 'feuer',
                  desc: 'Schaltet Stein-Entwicklungen der Feuer-Linie frei.' },
  wasserstein:  { icon: 'water-stone',   name: 'Wasserstein',  stone: 'wasser',
                  desc: 'Schaltet Stein-Entwicklungen der Wasser-Linie frei.' },
  donnerstein:  { icon: 'thunder-stone', name: 'Donnerstein',  stone: 'donner',
                  desc: 'Schaltet Stein-Entwicklungen der Elektro-Linie frei (Raichu!).' },
  blattstein:   { icon: 'leaf-stone',    name: 'Blattstein',   stone: 'blatt',
                  desc: 'Schaltet Stein-Entwicklungen der Pflanzen-Linie frei.' },
  mondstein:    { icon: 'moon-stone',    name: 'Mondstein',    stone: 'mond',
                  desc: 'Schaltet Mondstein-Entwicklungen frei (Nidoking/Nidoqueen!).' },
  sonderbonbon: { icon: 'rare-candy',    name: 'Sonderbonbon', candy: 1,
                  desc: 'Die nächste Entwicklung ist GRATIS (ignoriert Gold & Kills).' },
  xangriff:     { icon: 'x-attack',      name: 'X-Angriff',    mod: { dmg: 0.10 },
                  desc: '+10% Schaden für alle Tower (dauerhaft, stapelbar).' },
  superschutz:  { icon: 'x-defense',     name: 'Superschutz',  heartsNow: 5,
                  desc: 'Sofort +5 Herzen.' },
  muenzamulett: { icon: 'amulet-coin',   name: 'Münzamulett',  mod: { waveGold: 25 },
                  desc: '+25 Gold nach jeder Welle (dauerhaft, stapelbar).' },
  weitblick:    { icon: 'wide-lens',     name: 'Weitblick',    mod: { range: 0.10 },
                  desc: '+10% Reichweite für alle Tower (dauerhaft, stapelbar).' },
  gluecksei:    { icon: 'lucky-egg',     name: 'Glücks-Ei',    mod: { bounty: 0.15 },
                  desc: '+15% Gold für besiegte Gegner (dauerhaft, stapelbar).' },
  flinkklaue:   { icon: 'quick-claw',    name: 'Flinkklaue',   mod: { rate: 0.08 },
                  desc: '+8% Angriffstempo für alle Tower (dauerhaft, stapelbar).' },
  epteiler:     { icon: 'exp-share',     name: 'EP-Teiler',    mod: { killXp: 1 },
                  desc: 'Kills zählen doppelt für Entwicklungs-Anforderungen.' },
  sanftglocke:  { icon: 'soothe-bell',   name: 'Sanftglocke',  mod: { friendship: 0.5 },
                  desc: 'Freundschafts-Entwicklungen brauchen nur halb so viele Kills (Crobat!).' },
  trank:        { icon: 'potion',        name: 'Trank',        heartsNow: 3,
                  desc: 'Sofort +3 Herzen.' },
  toptrank:     { icon: 'max-potion',    name: 'Top-Trank',    heartsFull: true,
                  desc: 'Stellt alle Herzen wieder her (max. 20).' },
};

// Welche Steine braucht der jeweilige Trainer überhaupt?
import { TRAINERS } from './trainers.js';
import { LINES } from './pokemon.js';

export function stonesForTrainer(trainerKey) {
  const need = new Set();
  for (const slot of TRAINERS[trainerKey].roster) {
    for (const stage of LINES[slot.line].stages) {
      if (stage.evo && stage.evo.stone) need.add(stage.evo.stone);
    }
  }
  return need;
}

// 3 Draft-Optionen ziehen: Steine, die der Trainer braucht und noch nicht hat,
// werden bevorzugt angeboten; keine Duplikate innerhalb eines Drafts.
export function rollDraft(rng, run) {
  const needStones = stonesForTrainer(run.trainer);
  const pool = [];
  for (const [key, item] of Object.entries(ITEMS)) {
    if (item.stone) {
      if (!needStones.has(item.stone) || run.stones.includes(item.stone)) continue;
      pool.push(key, key); // Steine doppelt gewichten – sie schalten Kern-Mechanik frei
    } else if (item.heartsFull) {
      if (run.hearts >= 18) continue;
      pool.push(key);
    } else if (item.heartsNow) {
      if (run.hearts >= 20) continue;
      pool.push(key);
    } else {
      pool.push(key);
    }
  }
  const picks = [];
  let guard = 50;
  while (picks.length < 3 && guard-- > 0 && pool.length) {
    const k = pool[Math.floor(rng() * pool.length)];
    if (!picks.includes(k)) picks.push(k);
  }
  return picks;
}
