// HUD: Topbar, Tower-Bauleiste und Tower-Info-Panel (DOM).
import { LINES } from '../data/pokemon.js';
import { TYPE_NAMES, typeMatchups } from '../data/types.js';
import { staticUrl } from '../core/loader.js';
import { sfx } from '../core/audio.js';
import { SELL_REFUND, SPEEDS, MAP_COUNT } from '../config.js';

export class Hud {
  constructor(ui) {
    this.ui = ui; // geteilter UI-Zustand aus main.js
    this.el = {
      hearts: document.getElementById('tb-hearts'),
      gold: document.getElementById('tb-gold'),
      map: document.getElementById('tb-map'),
      wave: document.getElementById('tb-wave'),
      waveBtn: document.getElementById('btn-wave'),
      speedBtn: document.getElementById('btn-speed'),
      pauseBtn: document.getElementById('btn-pause'),
      muteBtn: document.getElementById('btn-mute'),
      towerbar: document.getElementById('towerbar'),
      towerpanel: document.getElementById('towerpanel'),
    };
    this.cache = {};
    this.cardEls = new Map();
  }

  set(key, el, text) {
    if (this.cache[key] !== text) { this.cache[key] = text; el.textContent = text; }
  }

  // Bauleiste neu aufbauen (bei Map-Start & nach Bank-Änderungen)
  buildTowerbar(session) {
    this.el.towerbar.innerHTML = '';
    this.cardEls.clear();
    this.benchEls = [];
    // Team-Bank: mitgebrachte Pokémon, gratis platzierbar
    session.bench.forEach((unit, idx) => {
      const line = LINES[unit.lineKey];
      const stage = line.stages[unit.stageIdx];
      const card = document.createElement('div');
      card.className = 'tower-card bench';
      card.innerHTML = `
        <span class="tc-badge">S${unit.stageIdx + 1}</span>
        <img src="${staticUrl(stage.dex)}" alt="${stage.name}">
        <div class="tc-cost" style="color:var(--accent2)">TEAM</div>
        <div class="tc-name">${stage.name}</div>`;
      card.addEventListener('click', () => this.ui.onBenchCardTap(idx));
      this.el.towerbar.appendChild(card);
      this.benchEls.push({ card, idx });
    });
    for (const slot of session.roster()) {
      const line = LINES[slot.line];
      const card = document.createElement('div');
      card.className = 'tower-card';
      card.innerHTML = `
        <span class="tc-lock"></span><span class="tc-badge"></span>
        <img src="${staticUrl(line.stages[0].dex)}" alt="${line.stages[0].name}">
        <div class="tc-cost"><i class="ico ico-coin sm"></i>${line.cost}</div>
        <div class="tc-name">${line.stages[0].name}</div>`;
      card.addEventListener('click', () => this.ui.onTowerCardTap(slot, line));
      this.el.towerbar.appendChild(card);
      this.cardEls.set(slot.line, { card, slot, line });
    }
  }

  update(session) {
    if (!session) return;
    this.set('hearts', this.el.hearts.lastElementChild, String(session.run.hearts));
    this.set('gold', this.el.gold.lastElementChild, String(Math.floor(session.gold)));
    this.set('map', this.el.map, `${session.map.name} (${session.mapNo}/${MAP_COUNT})`);
    // Vorschau: Typ der nächsten Welle anzeigen, solange sie nicht läuft
    let waveLabel = `Welle ${Math.min(session.waveIdx + 1, session.waveCount)}/${session.waveCount}`;
    if (session.state === 'build' || session.state === 'between') {
      const next = session.waves[session.waveIdx + 1];
      if (next) {
        const names = { mixed: 'Gemischt', swarm: 'SCHWARM!', fast: 'SCHNELL!', tank: 'PANZER!', fly: 'FLIEGER!', boss: 'BOSS!!!' };
        waveLabel = `Welle ${session.waveIdx + 2}/${session.waveCount}: ${names[next.archetype] || ''}`;
      }
    }
    this.set('wave', this.el.wave, waveLabel);

    // Wellen-Button (früher rufen gibt Bonus-Gold!)
    let waveText, waveCls = 'tb-btn';
    if (session.state === 'build') { waveText = 'Start!'; waveCls += ' attention'; }
    else if (session.state === 'between') { waveText = `Rufen +${session.earlyCallBonus()}`; waveCls += ' primary'; }
    else waveText = '···';
    this.set('waveBtn', this.el.waveBtn, waveText);
    if (this.cache.waveCls !== waveCls) { this.cache.waveCls = waveCls; this.el.waveBtn.className = waveCls; }

    // Karten-Zustände
    const p = this.ui.placing;
    for (const { card, slot, line } of this.cardEls.values()) {
      const unlocked = session.isUnlocked(slot);
      const affordable = session.gold >= line.cost;
      card.classList.toggle('locked', !unlocked);
      card.classList.toggle('expensive', unlocked && !affordable);
      card.classList.toggle('selected', !!p && p.line === line && p.benchIdx === null);
      const lockEl = card.querySelector('.tc-lock');
      const lockHtml = unlocked ? '' : '<i class="ico ico-lock sm" style="margin:0"></i>';
      if (lockEl.innerHTML !== lockHtml) lockEl.innerHTML = lockHtml;
    }
    for (const { card, idx } of this.benchEls || []) {
      card.classList.toggle('selected', !!p && p.benchIdx === idx);
    }
  }

  updateSpeedBtn(speedIdx) { this.el.speedBtn.textContent = SPEEDS[speedIdx] + '\u00d7'; }
  updatePauseBtn(paused) { this.el.pauseBtn.textContent = paused ? '>' : 'II'; }
  updateMuteBtn(muted) {
    this.el.muteBtn.innerHTML = `<i class="ico ico-sound-${muted ? 'off' : 'on'}" style="margin:0"></i>`;
  }

  // ---------- Tower-Panel ----------
  showTowerPanel(session, tower) {
    const p = this.el.towerpanel;
    p.classList.remove('hidden');
    this.el.towerbar.classList.add('hidden');
    const atk = tower.attack;
    const { strong, weak } = typeMatchups(atk.type);
    const req = tower.nextEvo(session);
    const check = tower.canEvolve(session);

    let evoLabel = '';
    if (req) {
      if (req.trade) evoLabel = 'Tausch-Evo!';
      else if (check.candy) evoLabel = 'Gratis-Evo!';
      else evoLabel = `Evo <i class="ico ico-coin sm"></i>${req.gold}`;
    }
    const kindInfo = {
      support: 'Bufft Tower in Reichweite', aura: 'Frost-Aura', mine: 'Legt Minen',
      chain: 'Kettenblitz', lob: 'Flächenschaden', boomerang: 'Bumerang', beam: 'Impuls', orb: 'Geschoss',
    }[atk.kind] || '';

    const trainCost = tower.trainCost();
    p.innerHTML = `
      <img class="tp-sprite" src="${staticUrl(tower.stage.dex)}" alt="">
      <div class="tp-info">
        <div class="tp-name">${tower.stage.name}${tower.trainLvl ? ` <span style="color:var(--ok)">Lv.${tower.trainLvl}</span>` : ''} <span style="color:var(--muted);font-size:7px">Stufe ${tower.stageIdx + 1}/${tower.line.stages.length} · ${tower.stage.types.map((t) => TYPE_NAMES[t]).join('/')}</span></div>
        <div class="tp-stats">${kindInfo}${atk.dmg ? ` · DMG ${Math.round(tower.dmg(session))}` : ''} · Kills ${tower.kills}${req && req.kills ? `/${req.kills}` : ''}
        ${strong.length ? `<br>Stark: ${strong.slice(0, 4).join(', ')}` : ''}${weak.length ? ` · Schwach: ${weak.slice(0, 3).join(', ')}` : ''}
        ${req && req.stone ? `<br>Braucht: ${req.stone.charAt(0).toUpperCase() + req.stone.slice(1)}stein ${session.run.stones.includes(req.stone) ? '✔' : '✖ (Item-Draft)'}` : ''}</div>
      </div>
      <div class="tp-buttons">
        ${req ? `<button class="tp-btn evo" id="tp-evo" ${check.ok ? '' : 'disabled'}>${evoLabel}</button>` : ''}
        <button class="tp-btn" id="tp-train" style="background:#7a5cb8">Training <i class="ico ico-coin sm"></i>${trainCost}</button>
        <button class="tp-btn swap" id="tp-swap">Tausch</button>
        <button class="tp-btn sell" id="tp-sell">Verkauf <i class="ico ico-coin sm"></i>${Math.round(tower.spent * SELL_REFUND)}</button>
        <button class="tp-btn" id="tp-close">X</button>
      </div>`;

    p.querySelector('#tp-close').addEventListener('click', () => this.ui.deselectTower());
    p.querySelector('#tp-sell').addEventListener('click', () => this.ui.sellSelected());
    p.querySelector('#tp-swap').addEventListener('click', () => this.ui.startSwap());
    p.querySelector('#tp-train').addEventListener('click', () => {
      if (tower.train(session)) {
        session.particles.burst(tower.x, tower.y, '#b89cf0', 12, 90, { glow: true });
        sfx.evolve();
        this.showTowerPanel(session, tower);
      } else {
        this.ui.toast(`Training kostet ${tower.trainCost()} Gold (+8% Schaden, +4% Tempo)`);
        sfx.error();
      }
    });
    const evoBtn = p.querySelector('#tp-evo');
    if (evoBtn) {
      evoBtn.addEventListener('click', () => {
        if (check.ok) this.ui.evolveSelected();
        else { this.ui.toast(check.reason || 'Noch nicht möglich'); sfx.error(); }
      });
      // Auch bei disabled den Grund zeigen
      if (!check.ok) {
        evoBtn.disabled = false;
        evoBtn.style.opacity = '0.55';
      }
    }
  }

  hideTowerPanel() {
    this.el.towerpanel.classList.add('hidden');
    this.el.towerbar.classList.remove('hidden');
  }
}
