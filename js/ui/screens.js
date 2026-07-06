// Vollbild-Screens: Menü, Trainerwahl, Run-Karte, Item-Draft, Sieg/Niederlage, Pokédex.
import { TRAINERS } from '../data/trainers.js';
import { LINES } from '../data/pokemon.js';
import { ENEMIES } from '../data/enemies.js';
import { MAPS, BIOMES } from '../data/maps.js';
import { ITEMS, rollDraft } from '../data/items.js';
import { staticUrl, itemUrl } from '../core/loader.js';
import { getMeta } from '../core/save.js';
import { MAP_COUNT, START_HEARTS } from '../config.js';
import { sfx } from '../core/audio.js';

const root = () => document.getElementById('screens');

function screen(html, cls = '') {
  const div = document.createElement('div');
  div.className = 'screen ' + cls;
  div.innerHTML = html;
  root().appendChild(div);
  return div;
}

export function clearScreens() { root().innerHTML = ''; }

const BIOME_ICONS = { wiese: '🌿', wald: '🌲', see: '🌊', hoehle: '⛰', vulkan: '🌋' };

// ---------- Hauptmenü ----------
export function showMenu(actions) {
  clearScreens();
  const meta = getMeta();
  const hasRun = !!actions.savedRun;
  const s = screen(`
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%">
      <div style="display:flex;align-items:center;gap:14px">
        <img src="${staticUrl(25)}" style="width:56px;height:56px;image-rendering:pixelated" alt="">
        <h1 class="title">PokeDefense</h1>
        <img src="${staticUrl(6)}" style="width:56px;height:56px;image-rendering:pixelated;transform:scaleX(-1)" alt="">
      </div>
      <div class="subtitle">Roguelike Tower Defense · 20 Maps · 4 Trainer</div>
      ${hasRun ? '<button class="menu-btn primary" id="m-continue">Run fortsetzen</button>' : ''}
      <button class="menu-btn ${hasRun ? '' : 'primary'}" id="m-new">Neuer Run</button>
      <button class="menu-btn" id="m-dex">Pokédex</button>
      <div class="stat-line">Siege: <b>${meta.wins}</b> · Runs: <b>${meta.runs}</b>${meta.giovanniUnlocked ? ' · <b style="color:#a855f7">Giovanni freigeschaltet!</b>' : ''}</div>
    </div>`);
  if (hasRun) s.querySelector('#m-continue').addEventListener('click', () => { sfx.click(); actions.onContinue(); });
  s.querySelector('#m-new').addEventListener('click', () => { sfx.click(); actions.onNew(); });
  s.querySelector('#m-dex').addEventListener('click', () => { sfx.click(); actions.onDex(); });
}

// ---------- Trainerwahl ----------
export function showTrainerSelect(actions) {
  clearScreens();
  const meta = getMeta();
  const s = screen(`
    <h2 class="title" style="font-size:16px">Wähle deinen Trainer</h2>
    <div class="subtitle">Der Trainer bestimmt deine 6 Tower-Linien für den ganzen Run</div>
    <div class="trainer-row" id="t-row"></div>
    <button class="menu-btn" id="t-back" style="margin-top:14px">← Zurück</button>`);
  const row = s.querySelector('#t-row');
  for (const tr of Object.values(TRAINERS)) {
    const locked = tr.secret && !meta.giovanniUnlocked;
    const card = document.createElement('div');
    card.className = 'trainer-card' + (locked ? ' locked' : '');
    card.innerHTML = `
      <div class="t-emblem" style="background:linear-gradient(135deg,${tr.color}55,${tr.color}22)">
        ${tr.emblem.map((d) => `<img src="${staticUrl(d)}" alt="">`).join('')}
      </div>
      <div class="t-name">${locked ? '???' : tr.name}</div>
      <div class="t-desc">${locked ? 'Gewinne einen Run, um diesen Trainer freizuschalten!' : tr.desc}</div>
      <div class="t-roster">${locked ? '' : tr.roster.map((r) => `<img src="${staticUrl(LINES[r.line].stages[0].dex)}" alt="">`).join('')}</div>
      <div class="stat-line" style="margin:0">Beste Map: <b>${meta.bestMap[tr.key] || '–'}</b></div>`;
    if (!locked) card.addEventListener('click', () => { sfx.click(); actions.onPick(tr.key); });
    else card.addEventListener('click', () => sfx.error());
    row.appendChild(card);
  }
  s.querySelector('#t-back').addEventListener('click', () => { sfx.click(); actions.onBack(); });
}

// ---------- Run-Karte (Map-Übersicht) ----------
export function showRunMap(run, actions) {
  clearScreens();
  const tr = TRAINERS[run.trainer];
  const nodes = MAPS.map((m, i) => {
    const cls = ['map-node'];
    if (i < run.mapIndex) cls.push('done');
    if (i === run.mapIndex) cls.push('current');
    if (m.boss) cls.push('boss');
    const icon = m.boss ? '💀' : (m.miniboss ? '⭐' : BIOME_ICONS[m.biome]);
    return `<div class="${cls.join(' ')}"><span class="mn-num">${i + 1}</span><span class="mn-bio">${i < run.mapIndex ? '✔' : icon}</span></div>`;
  }).join('');
  const items = run.items.map((k) => `<span class="item-chip"><img src="${itemUrl(ITEMS[k].icon)}" alt="">${ITEMS[k].name}</span>`).join('');
  const team = (run.team || []).map((u) => {
    const st = LINES[u.lineKey].stages[u.stageIdx];
    return `<span class="item-chip" title="${st.name}"><img src="${staticUrl(st.dex)}" alt="">S${u.stageIdx + 1}</span>`;
  }).join('');
  const map = MAPS[run.mapIndex];
  const s = screen(`
    <h2 class="title" style="font-size:14px;color:${tr.color}">${tr.name}s Run</h2>
    <div class="stat-line">❤ <b>${run.hearts}/${START_HEARTS}</b> · Start-Gold: <b>◉${run.gold}</b>${run.candy ? ` · 🍬×${run.candy}` : ''}</div>
    <div class="run-map-grid">${nodes}</div>
    ${team ? `<div class="stat-line" style="margin-bottom:0">Dein Team (reist mit!):</div><div class="item-strip">${team}</div>` : ''}
    ${items ? `<div class="item-strip">${items}</div>` : ''}
    <div class="subtitle" style="margin:8px 0 4px">Nächste Map: <b style="color:var(--accent)">${map.name}</b> ${map.boss ? '– BOSS-KAMPF!' : map.miniboss ? '– Miniboss wartet!' : ''}</div>
    <button class="menu-btn primary" id="r-start">Map ${run.mapIndex + 1} starten</button>
    <button class="menu-btn" id="r-quit" style="font-size:9px;min-width:0;padding:9px 16px">Run aufgeben</button>`);
  s.querySelector('#r-start').addEventListener('click', () => { sfx.click(); actions.onStart(); });
  s.querySelector('#r-quit').addEventListener('click', () => {
    if (confirm('Run wirklich aufgeben?')) { sfx.click(); actions.onQuit(); }
  });
}

// ---------- Item-Draft ----------
export function showDraft(run, rng, actions) {
  clearScreens();
  const picks = rollDraft(rng, run);
  const s = screen(`
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%">
      <h2 class="title" style="font-size:15px">Map ${run.mapIndex} geschafft!</h2>
      <div class="subtitle">Wähle deine Belohnung (gilt für den ganzen Run)</div>
      <div class="draft-row" id="d-row"></div>
    </div>`, 'overlay');
  const row = s.querySelector('#d-row');
  for (const key of picks) {
    const item = ITEMS[key];
    const card = document.createElement('div');
    card.className = 'draft-card';
    card.innerHTML = `<img src="${itemUrl(item.icon)}" alt=""><div class="d-name">${item.name}</div><div class="d-desc">${item.desc}</div>`;
    card.addEventListener('click', () => { sfx.gold(); actions.onPick(key); });
    row.appendChild(card);
  }
}

// ---------- Sieg / Niederlage ----------
export function showEnd(won, run, stats, actions) {
  clearScreens();
  const meta = getMeta();
  const firstWin = won && meta.wins === 1;
  const s = screen(`
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%">
      <h1 class="title" style="color:${won ? 'var(--ok)' : 'var(--danger)'}">${won ? '🏆 CHAMP!' : 'GAME OVER'}</h1>
      <div class="subtitle">${won
        ? 'Du hast alle 20 Maps überlebt und Mewtwo besiegt!'
        : `Dein Team wurde auf Map ${run.mapIndex + 1} (${MAPS[run.mapIndex].name}) überrannt…`}</div>
      ${firstWin ? `<div class="stat-line" style="color:#a855f7;font-size:11px">🔓 GEHEIMER TRAINER FREIGESCHALTET: GIOVANNI!</div>` : ''}
      <div class="stat-line">Trainer: <b>${TRAINERS[run.trainer].name}</b> · Maps geschafft: <b>${won ? MAP_COUNT : run.mapIndex}</b> · Items: <b>${run.items.length}</b></div>
      <button class="menu-btn primary" id="e-again">Neuer Run</button>
      <button class="menu-btn" id="e-menu">Hauptmenü</button>
    </div>`);
  s.querySelector('#e-again').addEventListener('click', () => { sfx.click(); actions.onNew(); });
  s.querySelector('#e-menu').addEventListener('click', () => { sfx.click(); actions.onMenu(); });
}

// ---------- Pokédex ----------
export function showDex(actions) {
  clearScreens();
  const meta = getMeta();
  const towerDex = [...new Set(Object.values(LINES).flatMap((l) => l.stages.map((st) => ({ dex: st.dex, name: st.name }))))];
  const enemyDex = [...new Map(Object.values(ENEMIES).map((e) => [e.dex, { dex: e.dex, name: e.name }])).values()];
  const entry = (e, seen) => `<div class="dex-entry ${seen ? '' : 'unseen'}" title="${seen ? e.name : '???'}"><img src="${staticUrl(e.dex)}" alt=""></div>`;
  const s = screen(`
    <h2 class="title" style="font-size:15px">Pokédex</h2>
    <div class="subtitle">Gebaut: ${meta.dexBuilt.length}/${towerDex.length} · Besiegt: ${meta.dexDefeated.length}/${enemyDex.length}</div>
    <div class="stat-line"><b>Deine Tower</b></div>
    <div class="dex-grid">${towerDex.map((e) => entry(e, meta.dexBuilt.includes(e.dex))).join('')}</div>
    <div class="stat-line" style="margin-top:12px"><b>Besiegte Gegner</b></div>
    <div class="dex-grid">${enemyDex.map((e) => entry(e, meta.dexDefeated.includes(e.dex))).join('')}</div>
    <button class="menu-btn" id="d-back" style="margin-top:16px">← Zurück</button>`);
  s.querySelector('#d-back').addEventListener('click', () => { sfx.click(); actions.onBack(); });
}

// ---------- Boss-Banner & Toast ----------
export function showBossBanner(name) {
  const div = document.createElement('div');
  div.className = 'boss-banner';
  div.innerHTML = `⚠ BOSS ⚠<br>${name}`;
  document.getElementById('stage').appendChild(div);
  setTimeout(() => div.remove(), 2700);
}

let toastEl = null, toastTimer = 0;
export function toast(msg) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}
