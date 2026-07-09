// Einstiegspunkt: lädt Assets, verdrahtet UI, steuert den Spielfluss.
import { W, H, TILE, SPEEDS } from './config.js';
import { loadAll } from './core/loader.js';
import { towerDexIds } from './data/pokemon.js';
import { enemyDexIds } from './data/enemies.js';
import { unlockAudio, toggleMute, isMuted, sfx } from './core/audio.js';
import { getMeta, loadRun, saveRun, clearRun } from './core/save.js';
import { makeRng } from './core/rng.js';
import { newRun, applyItem, advanceRun, endRun } from './game/state.js';
import { Session } from './game/session.js';
import { serializeTower } from './game/tower.js';
import { LINES } from './data/pokemon.js';
import { drawFrame } from './render/renderer.js';
import { renderBackgroundFrames, PALETTES } from './render/tiles.js';
import { Hud } from './ui/hud.js';
import * as screens from './ui/screens.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = W; canvas.height = H;

let session = null;
let run = null;
let paused = false;
let speedIdx = 0;
let lastT = 0;

// Geteilter UI-Zustand (auch vom Renderer gelesen)
const ui = {
  placing: null,        // { line, benchIdx|null, dex, range, cost }
  ghostCell: null,
  selectedTower: null,
  swapMode: false,
  skillTargeting: false,
  skillGhost: null,
  toast: screens.toast,

  onTowerCardTap(slot, line) {
    unlockAudio();
    if (!session) return;
    if (!session.isUnlocked(slot)) {
      screens.toast(`Gesperrt: ${slot.unlockText}`);
      sfx.error();
      return;
    }
    this.deselectTower();
    if (this.placing && this.placing.line === line && this.placing.benchIdx === null) { this.placing = null; return; }
    if (session.gold < line.cost) {
      screens.toast(`Zu teuer! ${line.stages[0].name} kostet ${line.cost} Gold`);
      sfx.error();
      return;
    }
    const st = line.stages[0];
    this.placing = { line, benchIdx: null, dex: st.dex, range: st.attack.range, cost: line.cost };
    this.ghostCell = null;
    screens.toast(`${st.name}: ${line.desc}`);
    sfx.click();
  },

  onBenchCardTap(idx) {
    unlockAudio();
    if (!session) return;
    this.deselectTower();
    if (this.placing && this.placing.benchIdx === idx) { this.placing = null; return; }
    const unit = session.bench[idx];
    if (!unit) return;
    const line = LINES[unit.lineKey];
    const st = line.stages[unit.stageIdx];
    this.placing = { line, benchIdx: idx, dex: st.dex, range: st.attack.range, cost: 0 };
    this.ghostCell = null;
    screens.toast(`${st.name} aus deinem Team – gratis platzieren!`);
    sfx.click();
  },

  deselectTower() {
    this.selectedTower = null;
    this.swapMode = false;
    hud.hideTowerPanel();
  },

  selectTower(t) {
    this.placing = null;
    this.selectedTower = t;
    this.swapMode = false;
    hud.showTowerPanel(session, t);
    sfx.click();
  },

  sellSelected() {
    if (!this.selectedTower) return;
    session.sell(this.selectedTower);
    this.deselectTower();
  },

  evolveSelected() {
    if (!this.selectedTower) return;
    const res = session.evolve(this.selectedTower);
    if (res.ok) hud.showTowerPanel(session, this.selectedTower);
  },

  startSwap() {
    if (!this.selectedTower) return;
    this.swapMode = true;
    screens.toast('Tippe einen anderen Tower zum Tauschen! (Tausch-Evos entwickeln sich)');
    sfx.click();
  },
};

const hud = new Hud(ui);

// ---------- Canvas-Skalierung ----------
function resizeCanvas() {
  const stage = document.getElementById('stage');
  const bw = stage.clientWidth, bh = stage.clientHeight;
  if (!bw || !bh) return;
  const k = Math.min(bw / W, bh / H);
  canvas.style.width = Math.floor(W * k) + 'px';
  canvas.style.height = Math.floor(H * k) + 'px';
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 150));

// ---------- Eingabe auf dem Spielfeld ----------
function canvasCell(ev) {
  const rect = canvas.getBoundingClientRect();
  const x = (ev.clientX - rect.left) / rect.width * W;
  const y = (ev.clientY - rect.top) / rect.height * H;
  return { x, y, c: Math.floor(x / TILE), r: Math.floor(y / TILE) };
}

canvas.addEventListener('pointermove', (ev) => {
  if (!session) return;
  const { x, y, c, r } = canvasCell(ev);
  if (ui.skillTargeting) ui.skillGhost = [x, y];
  if (ui.placing) ui.ghostCell = [c, r];
});

canvas.addEventListener('pointerdown', (ev) => {
  if (!session) return;
  unlockAudio();
  const { x, y, c, r } = canvasCell(ev);

  // 1) Skill-Zielmodus
  if (ui.skillTargeting) {
    ui.skillTargeting = false;
    ui.skillGhost = null;
    session.castSkill(x, y);
    return;
  }

  // 2) Drops einsammeln
  if (session.collectDropAt(x, y)) return;

  if (ui.placing) {
    ui.ghostCell = [c, r];
    const t = ui.placing.benchIdx !== null
      ? session.buildFromBench(ui.placing.benchIdx, c, r)
      : session.build(ui.placing.line.key, c, r);
    if (t) {
      ui.placing = null;
      ui.ghostCell = null;
      hud.buildTowerbar(session); // Bank hat sich evtl. geändert
    } else if (!session.canBuildAt(c, r)) {
      ui.placing = null;
      ui.ghostCell = null;
    } else {
      screens.toast('Nicht genug Gold!');
      sfx.error();
    }
    return;
  }

  const t = session.towerAt(c, r);
  if (ui.swapMode && ui.selectedTower && t && t !== ui.selectedTower) {
    session.swap(ui.selectedTower, t);
    ui.deselectTower();
    return;
  }
  if (t) ui.selectTower(t);
  else ui.deselectTower();
});

// ---------- Skill-Button ----------
const skillBtn = document.getElementById('skillbtn');
skillBtn.addEventListener('click', () => {
  unlockAudio();
  if (!session || !session.skill) return;
  if (session.skillCd > 0) {
    screens.toast(`${session.skill.name} lädt noch ${Math.ceil(session.skillCd)}s…`);
    sfx.error();
    return;
  }
  if (session.skill.target === 'point') {
    ui.skillTargeting = !ui.skillTargeting;
    ui.skillGhost = null;
    if (ui.skillTargeting) screens.toast(`${session.skill.name}: Ziel auf dem Feld antippen!`);
  } else {
    session.castSkill(0, 0);
  }
  sfx.click();
});

function updateSkillBtn() {
  if (!session || !session.skill) { skillBtn.classList.add('hidden'); return; }
  skillBtn.classList.remove('hidden');
  const cooling = session.skillCd > 0;
  skillBtn.classList.toggle('cooling', cooling);
  skillBtn.classList.toggle('targeting', ui.skillTargeting);
  const nameEl = skillBtn.querySelector('.sk-name');
  const text = cooling ? `${Math.ceil(session.skillCd)}s` : session.skill.name.slice(0, 10);
  if (nameEl.textContent !== text) nameEl.textContent = text;
}

// ---------- Topbar-Buttons ----------
document.getElementById('btn-wave').addEventListener('click', () => {
  unlockAudio();
  if (session) session.startWave();
});
document.getElementById('btn-speed').addEventListener('click', () => {
  unlockAudio();
  speedIdx = (speedIdx + 1) % SPEEDS.length;
  hud.updateSpeedBtn(speedIdx);
});
document.getElementById('btn-pause').addEventListener('click', () => {
  unlockAudio();
  paused = !paused;
  hud.updatePauseBtn(paused);
});
document.getElementById('btn-mute').addEventListener('click', () => {
  unlockAudio();
  hud.updateMuteBtn(toggleMute());
});

// ---------- Spielfluss ----------
function goMenu() {
  session = null;
  document.getElementById('app').classList.add('hidden');
  screens.showMenu({
    savedRun: loadRun(),
    onNew: () => goTrainerSelect(),
    onContinue: () => { run = loadRun(); if (run) goRunMap(); else goTrainerSelect(); },
    onDex: () => screens.showDex({ onBack: goMenu }),
  });
}

function goTrainerSelect() {
  session = null;
  document.getElementById('app').classList.add('hidden');
  screens.showTrainerSelect({
    onPick: (key) => { run = newRun(key); clearRun(); goRunMap(); },
    onBack: goMenu,
  });
}

function goRunMap() {
  session = null;
  document.getElementById('app').classList.add('hidden');
  saveRun(run);
  screens.showRunMap(run, {
    onStart: startMap,
    onQuit: () => { endRun(run, false); goMenu(); },
  });
}

function startMap() {
  screens.clearScreens();
  document.getElementById('app').classList.remove('hidden');
  ui.placing = null; ui.selectedTower = null; ui.swapMode = false;
  hud.hideTowerPanel();

  session = new Session(run, {
    onToast: screens.toast,
    onBoss: screens.showBossBanner,
    onEnd: (result) => setTimeout(() => onMapEnd(result), 900),
  });
  session.bgFrames = renderBackgroundFrames(session);
  if (session.skill) {
    skillBtn.querySelector('.sk-icon').innerHTML =
      `<img src="assets/sprites/static/${session.skill.icon}.png" style="width:26px;height:26px;image-rendering:pixelated" alt="">`;
    screens.toast(`Trainer-Skill bereit: ${session.skill.name} – ${session.skill.desc}`);
  }
  document.getElementById('stage').style.background = PALETTES[session.map.biome].frame;
  hud.buildTowerbar(session);
  hud.updateSpeedBtn(speedIdx);
  hud.updateMuteBtn(isMuted());
  paused = false;
  hud.updatePauseBtn(false);
  resizeCanvas();
  screens.toast(`${session.map.name} – Baue Tower und starte die Welle!`);
}

function onMapEnd(result) {
  if (!session) return;
  if (result === 'won') {
    // Team einsammeln: aufgestellte + nicht aufgestellte Pokémon wandern mit
    run.team = [...session.towers.map(serializeTower), ...session.bench];
    const goldLeft = session.gold;
    const status = advanceRun(run, goldLeft);
    if (status === 'victory') {
      endRun(run, true);
      sfx.victory();
      session = null;
      document.getElementById('app').classList.add('hidden');
      screens.showEnd(true, run, {}, { onNew: goTrainerSelect, onMenu: goMenu });
    } else {
      // Item-Draft, dann weiter
      session = null;
      document.getElementById('app').classList.add('hidden');
      const rng = makeRng(run.seed + run.mapIndex * 7717);
      screens.showDraft(run, rng, {
        onPick: (itemKey) => {
          applyItem(run, itemKey);
          saveRun(run);
          goRunMap();
        },
      });
    }
  } else {
    sfx.defeat();
    endRun(run, false);
    session = null;
    document.getElementById('app').classList.add('hidden');
    screens.showEnd(false, run, {}, { onNew: goTrainerSelect, onMenu: goMenu });
  }
}

// ---------- Game-Loop ----------
function loop(t) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
  lastT = t;
  if (!session) return;
  if (!paused) {
    const speed = SPEEDS[speedIdx];
    for (let i = 0; i < speed; i++) session.update(dt);
  }
  drawFrame(ctx, session, ui);
  hud.update(session);
  updateSkillBtn();
}

// ---------- Start ----------
async function boot() {
  const loadText = document.getElementById('load-text');
  const ids = [...towerDexIds(), ...enemyDexIds()];
  try {
    await loadAll(ids, (p) => {
      loadText.textContent = `Lade Pokémon… ${Math.round(p * 100)}%`;
    });
  } catch (e) {
    loadText.textContent = 'Fehler beim Laden: ' + e.message;
    throw e;
  }
  document.getElementById('loading').classList.add('hidden');
  requestAnimationFrame(loop);
  goMenu();
}

boot();

// Debug-/Test-Hook (auch für automatisierte Tests)
window.__pd = {
  get session() { return session; },
  get run() { return run; },
  ui,
};
