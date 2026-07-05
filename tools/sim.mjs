// Headless-Balance-Simulation: spielt komplette Runs mit einer simplen KI
// durch und meldet Herzen/Gold pro Map. Aufruf: node tools/sim.mjs [trainer] [seed]
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const { Session } = await import('../js/game/session.js');
const { newRun, applyItem, advanceRun } = await import('../js/game/state.js');
const { LINES } = await import('../js/data/pokemon.js');
const { ITEMS, rollDraft, stonesForTrainer } = await import('../js/data/items.js');
const { pathCells } = await import('../js/data/maps.js');
const { makeRng } = await import('../js/core/rng.js');
const { COLS, ROWS, TILE } = await import('../js/config.js');

const trainerKey = process.argv[2] || 'rot';
const seed = parseInt(process.argv[3] || '42', 10);

function bestCells(session) {
  // Zellen nach Pfadnähe sortieren (wie viele Pfadzellen im Radius ~2)
  const pc = pathCells(session.map.path);
  const scores = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!session.canBuildAt(c, r)) continue;
      let s = 0;
      for (const [pcx, pcy] of pc) {
        const d = Math.hypot(pcx - c, pcy - r);
        if (d <= 2.4) s += (2.4 - d);
      }
      if (s > 0) scores.push({ c, r, s });
    }
  }
  scores.sort((a, b) => b.s - a.s);
  return scores;
}

function aiStep(session) {
  // Entwickeln hat Priorität
  for (const t of session.towers) {
    const check = t.canEvolve(session);
    if (check.ok) session.evolve(t);
    else if (check.trade) {
      const partner = session.towers.find((o) => o !== t);
      if (partner) session.swap(t, partner);
    }
  }
  // Steht eine Evolution kurz bevor (Kills erfüllt)? Dann Gold reservieren.
  let reserve = 0;
  for (const t of session.towers) {
    const req = t.nextEvo(session);
    if (req && !req.trade && t.kills >= req.kills && (!req.stone || session.run.stones.includes(req.stone))) {
      reserve = Math.max(reserve, req.gold);
    }
  }
  // Bauen: teuerste leistbare freigeschaltete Linie (mit Reserve, außer am Anfang)
  const cells = bestCells(session);
  const minTowers = 6;
  // Erst günstig für Abdeckung bauen, später teuer
  const cheapFirst = session.towers.length < minTowers;
  const options = session.roster()
    .filter((s) => session.isUnlocked(s))
    .map((s) => LINES[s.line])
    .filter((l) => session.gold >= l.cost + (cheapFirst ? 0 : reserve))
    .sort((a, b) => cheapFirst ? a.cost - b.cost : b.cost - a.cost);
  if (cells.length && options.length && session.towers.length < 16) {
    // Ohne Flug-Abwehr zuerst eine Anti-Flug-Linie bauen
    const canHitFly = (l) => !(l.targets && l.targets.fly === false);
    let choice = options[0];
    const flyCapable = session.towers.filter((t) => canHitFly(t.line)).length;
    if (flyCapable < session.towers.length * 0.6 + 1) {
      choice = options.find(canHitFly) || choice;
    }
    const spot = cells.find((cell) => session.canBuildAt(cell.c, cell.r));
    if (spot) session.build(choice.key, spot.c, spot.r);
  }
  // Welle starten
  if (session.state === 'build' || session.state === 'between') session.startWave();
}

const run = newRun(trainerKey);
run.seed = seed;
const draftRngBase = makeRng(seed);

let result = 'running';
const perMap = [];

while (result === 'running') {
  const session = new Session(run, {});
  const heartsBefore = run.hearts;
  let guard = 0;
  while (session.state !== 'won' && session.state !== 'lost') {
    aiStep(session);
    for (let i = 0; i < 10; i++) session.update(0.05);
    if (++guard > 60000) { console.error('TIMEOUT auf Map', session.mapNo); result = 'timeout'; break; }
  }
  perMap.push({
    map: session.mapNo, name: session.map.name,
    state: session.state,
    heartsLost: heartsBefore - run.hearts,
    hearts: run.hearts,
    towers: session.towers.length,
    maxStage: Math.max(...session.towers.map((t) => t.stageIdx + 1), 0),
    goldEnd: Math.floor(session.gold),
  });
  if (result === 'timeout') break;
  if (session.state === 'lost') { result = 'lost'; break; }
  const adv = advanceRun(run, session.gold);
  if (adv === 'victory') { result = 'victory'; break; }
  // Draft: Steine zuerst, dann X-Angriff/Flinkklaue, sonst erstes
  const picks = rollDraft(draftRngBase, run);
  const prio = ['donnerstein', 'mondstein', 'xangriff', 'flinkklaue', 'weitblick', 'gluecksei', 'sonderbonbon'];
  const chosen = prio.find((p) => picks.includes(p)) || picks[0];
  if (chosen) applyItem(run, chosen);
}

console.log(`\n=== ${trainerKey} / Seed ${seed} → ${result.toUpperCase()} ===`);
for (const m of perMap) {
  console.log(`Map ${String(m.map).padStart(2)} ${m.name.padEnd(18)} ${m.state.padEnd(5)} ❤-${m.heartsLost} (=${m.hearts})  Tower:${m.towers} Stufe:${m.maxStage} Gold:${m.goldEnd}`);
}
console.log('Items:', run.items.join(', ') || '–');
