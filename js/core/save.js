// Speicherstand: Meta-Progression (dauerhaft) + laufender Run (zwischen Maps)
const META_KEY = 'pokedefense_meta_v1';
const RUN_KEY = 'pokedefense_run_v1';

const defaultMeta = () => ({
  wins: 0,
  runs: 0,
  giovanniUnlocked: false,
  bestMap: {},          // trainerKey -> höchste erreichte Map
  dexBuilt: [],         // dex-Nummern gebauter Pokémon
  dexDefeated: [],      // dex-Nummern besiegter Gegner
  muted: false,
});

let meta = null;

export function getMeta() {
  if (!meta) {
    try { meta = { ...defaultMeta(), ...JSON.parse(localStorage.getItem(META_KEY) || '{}') }; }
    catch (e) { meta = defaultMeta(); }
  }
  return meta;
}

export function saveMeta() {
  try { localStorage.setItem(META_KEY, JSON.stringify(getMeta())); } catch (e) { /* privat-modus */ }
}

export function dexAdd(list, dex) {
  const m = getMeta();
  if (!m[list].includes(dex)) { m[list].push(dex); saveMeta(); }
}

export function saveRun(runState) {
  try { localStorage.setItem(RUN_KEY, JSON.stringify(runState)); } catch (e) { /* egal */ }
}

export function loadRun() {
  try { return JSON.parse(localStorage.getItem(RUN_KEY) || 'null'); } catch (e) { return null; }
}

export function clearRun() {
  try { localStorage.removeItem(RUN_KEY); } catch (e) { /* egal */ }
}
