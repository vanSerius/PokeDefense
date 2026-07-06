// Session: eine Map-Runde. Verwaltet Gegner, Tower, Projektile, Wellen,
// Gold & Herzen. Die Run-übergreifenden Daten stecken in `run` (state.js).
import { TILE, COLS, ROWS, WAVE_BONUS, SELL_REFUND, BOSS_HEART_DMG, TEAM_CAP } from '../config.js';
import { MAPS, buildPath, pathCells, pointAt } from '../data/maps.js';
import { ENEMIES } from '../data/enemies.js';
import { LINES } from '../data/pokemon.js';
import { TRAINERS } from '../data/trainers.js';
import { generateWaves, bountyScale } from '../data/waves.js';
import { makeRng } from '../core/rng.js';
import { Enemy } from './enemy.js';
import { Tower } from './tower.js';
import { Particles } from './particles.js';
import { sfx } from '../core/audio.js';
import { dexAdd } from '../core/save.js';

const BLOCKING_DECO = new Set(['baum', 'fels', 'wasser', 'lava', 'kristall']);

export class Session {
  constructor(run, callbacks = {}) {
    this.run = run;
    this.cb = callbacks;               // { onToast, onBoss, onWaveChange, onEnd }
    this.mapNo = run.mapIndex + 1;
    this.map = MAPS[run.mapIndex];
    this.rng = makeRng(run.seed + run.mapIndex * 31337);

    this.path = buildPath(this.map.path, TILE);
    this.pathSet = new Set(pathCells(this.map.path).map(([c, r]) => c + ',' + r));

    // Pfad-Samples für Minen/Barrieren
    this.pathSamples = [];
    for (let d = 30; d < this.path.total - 30; d += 20) {
      const p = pointAt(this.path, d);
      this.pathSamples.push({ x: p.x, y: p.y, dist: d });
    }

    this.deco = this.generateDeco();
    this.blocked = new Set(this.deco.filter((d) => BLOCKING_DECO.has(d.kind)).map((d) => d.c + ',' + d.r));

    this.gold = run.gold;
    this.enemies = [];
    this.towers = [];
    // Team-Bank: mitgebrachte Pokémon aus vorherigen Maps (gratis platzierbar)
    this.bench = (run.team || []).map((u) => ({ ...u }));
    this.projectiles = [];
    this.mines = [];
    this.clouds = [];
    this.barriers = [];
    this.fx = [];
    this.particles = new Particles();

    this.waves = generateWaves(this.mapNo, run.seed);
    this.waveIdx = -1;                 // noch keine Welle gestartet
    this.spawnQueue = [];
    this.state = 'build';              // build | wave | between | won | lost
    this.betweenT = 0;
    this.time = 0;
    this.shakeT = 0; this.shakeMag = 0;
    this.bossActive = null;
  }

  // ---------- Setup ----------
  generateDeco() {
    const deco = [];
    const biomeDeco = { wiese: ['busch', 'blume', 'stein'], wald: ['baum', 'baum', 'busch', 'pilz'], see: ['wasser', 'schilf', 'stein'], hoehle: ['fels', 'fels', 'kristall'], vulkan: ['fels', 'lava', 'lava'] }[this.map.biome];
    const taken = new Set(this.pathSet);
    const count = 10 + Math.floor(this.rng() * 6);
    let guard = 200;
    while (deco.length < count && guard-- > 0) {
      const c = Math.floor(this.rng() * COLS);
      const r = Math.floor(this.rng() * ROWS);
      const k = c + ',' + r;
      if (taken.has(k)) continue;
      // nicht direkt neben dem Pfad zubauen (Bauplätze freihalten)
      let nearPath = 0;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (this.pathSet.has((c + dc) + ',' + (r + dr))) nearPath++;
      }
      if (nearPath > 0 && this.rng() < 0.7) continue;
      taken.add(k);
      deco.push({ c, r, kind: biomeDeco[Math.floor(this.rng() * biomeDeco.length)], v: this.rng() });
    }
    return deco;
  }

  // ---------- Bauen / Verkaufen / Tauschen ----------
  canBuildAt(c, r) {
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return false;
    const k = c + ',' + r;
    if (this.pathSet.has(k) || this.blocked.has(k)) return false;
    return !this.towers.some((t) => t.col === c && t.row === r);
  }

  towerAt(c, r) {
    return this.towers.find((t) => t.col === c && t.row === r) || null;
  }

  roster() { return TRAINERS[this.run.trainer].roster; }

  isUnlocked(slot) {
    for (const cond of slot.unlock) {
      if (cond.builtCount && this.towers.length < cond.builtCount) return false;
      if (cond.evoStage && this.run.maxEvoStage < cond.evoStage) return false;
      if (cond.mapReached && this.mapNo < cond.mapReached) return false;
      if (cond.lineCount) {
        const [key, n] = cond.lineCount;
        if (this.towers.filter((t) => t.lineKey === key).length < n) return false;
      }
    }
    return true;
  }

  get teamSize() { return this.towers.length + this.bench.length; }

  build(lineKey, c, r) {
    const line = LINES[lineKey];
    if (!line || !this.canBuildAt(c, r) || this.gold < line.cost) return null;
    if (this.teamSize >= TEAM_CAP) { this.toast(`Team voll (max. ${TEAM_CAP})!`); return null; }
    const slot = this.roster().find((s) => s.line === lineKey);
    if (!slot || !this.isUnlocked(slot)) return null;
    this.gold -= line.cost;
    const t = new Tower(lineKey, c, r);
    this.towers.push(t);
    dexAdd('dexBuilt', t.stage.dex);
    this.particles.burst(t.x, t.y, '#ffcd75', 10, 80);
    sfx.build();
    return t;
  }

  // Team-Mitglied aus der Bank gratis aufstellen
  buildFromBench(idx, c, r) {
    const unit = this.bench[idx];
    if (!unit || !this.canBuildAt(c, r)) return null;
    this.bench.splice(idx, 1);
    const t = new Tower(unit.lineKey, c, r, unit);
    this.towers.push(t);
    this.particles.burst(t.x, t.y, '#41a6f6', 10, 80);
    sfx.build();
    return t;
  }

  sell(tower) {
    const idx = this.towers.indexOf(tower);
    if (idx < 0) return;
    this.towers.splice(idx, 1);
    for (const m of this.mines) if (m.tower === tower) m.done = true;
    const refund = Math.round(tower.spent * SELL_REFUND);
    this.gold += refund;
    this.particles.number(tower.x, tower.y, `+${refund}`, '#ffcd75');
    sfx.sell();
  }

  evolve(tower) {
    const check = tower.canEvolve(this);
    if (!check.ok) return check;
    tower.evolve(this, !!check.candy);
    if (check.candy) this.run.candy--;
    this.afterEvolve(tower);
    return check;
  }

  afterEvolve(tower) {
    this.run.maxEvoStage = Math.max(this.run.maxEvoStage, tower.stageIdx + 1);
    dexAdd('dexBuilt', tower.stage.dex);
    this.particles.burst(tower.x, tower.y, '#ffffff', 22, 130, { glow: true, life: 0.8 });
    this.fx.push({ kind: 'ring', x: tower.x, y: tower.y, r0: 10, r1: 90, t: 0, life: 0.7, color: '#ffcd75' });
    sfx.evolve();
    this.toast(`${tower.stage.name} entwickelt!`);
  }

  // Tausch: Positionen wechseln; tauschbereite Tower entwickeln sich!
  swap(a, b) {
    [a.col, b.col] = [b.col, a.col];
    [a.row, b.row] = [b.row, a.row];
    [a.x, b.x] = [b.x, a.x];
    [a.y, b.y] = [b.y, a.y];
    let evolved = false;
    for (const t of [a, b]) {
      const req = t.nextEvo(this);
      if (req && req.trade) {
        t.evolve(this, true);
        this.afterEvolve(t);
        evolved = true;
      }
    }
    if (!evolved) sfx.build();
    return evolved;
  }

  // ---------- Wellen ----------
  get waveCount() { return this.waves.length; }

  startWave() {
    if (this.state !== 'build' && this.state !== 'between') return false;
    this.waveIdx++;
    const wave = this.waves[this.waveIdx];
    if (!wave) return false;
    this.state = 'wave';
    this.spawnQueue = [];
    let t = 0;
    for (const g of wave.groups) {
      for (let i = 0; i < g.count; i++) {
        this.spawnQueue.push({ at: t, enemy: g.enemy, hpMult: g.hpMult, speedMult: g.speedMult });
        t += g.gap;
      }
      t += 1.2;
    }
    this.spawnT = 0;
    if (wave.archetype === 'boss') {
      const def = ENEMIES[wave.groups[0].enemy];
      this.cb.onBoss && this.cb.onBoss(def.name);
      sfx.boss();
      this.shake(12);
    } else {
      sfx.waveStart();
    }
    this.cb.onWaveChange && this.cb.onWaveChange();
    return true;
  }

  spawnEnemy(key, opts = {}) {
    const def = ENEMIES[key];
    const e = new Enemy(def, { bountyMult: bountyScale(this.mapNo) * (1 + this.run.mods.bounty), ...opts });
    this.enemies.push(e);
    const p = pointAt(this.path, e.dist);
    e.x = p.x; e.y = p.y;
    if (def.boss) this.bossActive = e;
    return e;
  }

  spawnClones(boss, n) {
    for (let i = 0; i < n; i++) {
      this.spawnEnemy('mewtwoKlon', { dist: Math.max(0, boss.dist - 50 - i * 40), hpMult: Math.pow(1.17, this.mapNo - 1) / 3 });
    }
  }

  // ---------- Kampf ----------
  fireAt(tower, target) {
    const atk = tower.attack;
    const dmg = tower.dmg(this);
    const crit = atk.crit && Math.random() < atk.crit.chance ? atk.crit.mult : 0;

    if (atk.kind === 'chain') {
      // Kettenblitz: sofort, springt weiter
      const hitList = [target];
      let cur = target;
      for (let i = 1; i < atk.chains; i++) {
        let best = null, bd = Infinity;
        for (const e of this.enemies) {
          if (hitList.includes(e) || !e.isTargetable(tower.targets)) continue;
          const d = Math.hypot(e.x - cur.x, e.y - cur.y);
          if (d < atk.chainRange && d < bd) { best = e; bd = d; }
        }
        if (!best) break;
        hitList.push(best);
        cur = best;
      }
      const pts = [{ x: tower.x, y: tower.y - 20 }, ...hitList.map((e) => ({ x: e.x, y: e.y }))];
      this.fx.push({ kind: 'bolt', pts, t: 0, life: 0.22 });
      for (let i = 0; i < hitList.length; i++) {
        const e = hitList[i];
        e.hit(dmg * Math.pow(0.75, i), atk.type, this, tower, { critMult: crit || undefined });
        e.applyEffects(atk.effect, this);
        this.particles.burst(e.x, e.y, '#f8d030', 5, 70, { glow: true });
      }
      sfx.zap();
      return;
    }

    if (atk.kind === 'beam') {
      // Psycho-Impuls: sofort auf Ziel (+ ggf. Splash)
      this.fx.push({ kind: 'psy', x: target.x, y: target.y, from: { x: tower.x, y: tower.y - 16 }, t: 0, life: 0.3 });
      target.hit(dmg, atk.type, this, tower, { critMult: crit || undefined });
      target.applyEffects(atk.effect, this);
      if (atk.splash) {
        for (const e of this.enemies) {
          if (e === target || !e.isTargetable(tower.targets)) continue;
          if (Math.hypot(e.x - target.x, e.y - target.y) < atk.splash) {
            e.hit(dmg * 0.5, atk.type, this, tower);
            e.applyEffects(atk.effect, this);
          }
        }
      }
      sfx.shoot();
      return;
    }

    if (atk.kind === 'boomerang') {
      const ang = Math.atan2(target.y - tower.y, target.x - tower.x);
      this.projectiles.push({
        kind: 'boomerang', tower, x: tower.x, y: tower.y, ang,
        dist: 0, maxDist: tower.range(this), phase: 'out', speed: atk.projSpeed,
        dmg, type: atk.type, visual: atk.visual, hitOut: new Set(), hitBack: new Set(), rot: 0,
      });
      sfx.shoot();
      return;
    }

    // orb / lob
    this.projectiles.push({
      kind: atk.kind, tower, x: tower.x, y: tower.y - 18,
      target, tx: target.x, ty: target.y,
      speed: atk.projSpeed || 320, dmg, type: atk.type, visual: atk.visual,
      splash: atk.splash || 0, effect: atk.effect, cloud: atk.cloud, crit,
      t: 0, trail: 0,
    });
    sfx.shoot();
  }

  hitEnemy(proj, enemy) {
    const opts = proj.crit ? { critMult: proj.crit } : {};
    enemy.hit(proj.dmg, proj.type, this, proj.tower, opts);
    enemy.applyEffects(proj.effect, this);
  }

  explodeAt(proj, x, y) {
    const color = { fireball: '#f08030', water: '#6890f0', leaf: '#78c850', poison: '#a040a0', psy: '#f85888', dragon: '#7038f8', rock: '#b8a038', sting: '#a8b820', shadow: '#705898' }[proj.visual] || '#fff';
    this.particles.burst(x, y, color, proj.splash ? 14 : 7, proj.splash ? 110 : 70, { glow: true });
    if (proj.splash) {
      this.fx.push({ kind: 'ring', x, y, r0: 6, r1: proj.splash, t: 0, life: 0.3, color });
      for (const e of this.enemies) {
        if (!e.isTargetable(proj.tower.targets)) continue;
        if (Math.hypot(e.x - x, e.y - y) <= proj.splash) this.hitEnemy(proj, e);
      }
    } else if (proj.target && !proj.target.dead) {
      this.hitEnemy(proj, proj.target);
    }
    if (proj.cloud) {
      this.clouds.push({ x, y, radius: proj.cloud.radius, dps: proj.cloud.dps, slow: proj.cloud.slow || null, t: proj.cloud.dur, max: proj.cloud.dur, type: proj.type, tower: proj.tower });
    }
    sfx.hit();
  }

  randomPathPointInRange(x, y, r, any = false) {
    const inRange = this.pathSamples.filter((p) => Math.hypot(p.x - x, p.y - y) <= r);
    if (!inRange.length) return null;
    return inRange[Math.floor(this.rng() * inRange.length)];
  }

  onEnemyKilled(enemy, source) {
    if (enemy.dead) return;
    enemy.dead = true;
    let gold = enemy.bounty;
    if (source && source.attack && source.attack.effect && source.attack.effect.goldOnKill) {
      gold += source.attack.effect.goldOnKill;
      this.particles.number(enemy.x, enemy.y - 10, `+${gold}◉`, '#ffcd75', 10);
      sfx.gold();
    }
    this.gold += gold;
    if (source) source.kills += 1;
    dexAdd('dexDefeated', enemy.dex);
    this.particles.burst(enemy.x, enemy.y, '#ffffff', enemy.boss ? 30 : 9, enemy.boss ? 160 : 85);
    if (enemy.boss || enemy.miniboss) {
      this.shake(enemy.boss ? 14 : 6);
      this.particles.number(enemy.x, enemy.y - 30, `+${gold}◉`, '#ffcd75', 16);
    }
    sfx.kill();
  }

  // ---------- Update ----------
  toast(msg) { this.cb.onToast && this.cb.onToast(msg); }
  shake(mag) { this.shakeT = 0.4; this.shakeMag = mag; }

  update(dt) {
    if (this.state === 'won' || this.state === 'lost') return;
    this.time += dt;
    if (this.shakeT > 0) this.shakeT -= dt;

    // Spawnen
    if (this.state === 'wave' && this.spawnQueue.length) {
      this.spawnT += dt;
      while (this.spawnQueue.length && this.spawnQueue[0].at <= this.spawnT) {
        const s = this.spawnQueue.shift();
        this.spawnEnemy(s.enemy, { hpMult: s.hpMult, speedMult: s.speedMult });
      }
    }

    // Tower-Buffs zurücksetzen und neu berechnen (Pantimos setzt buffNext)
    for (const t of this.towers) { t.buff = t.buffNext || 1; t.buffNext = 1; }

    for (const t of this.towers) t.update(dt, this);

    // Gegner
    for (const e of this.enemies) e.update(dt, this);
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.leaked) {
        this.run.hearts -= e.boss ? BOSS_HEART_DMG : 1;
        this.shake(e.boss ? 12 : 4);
        sfx.leak();
        this.enemies.splice(i, 1);
        if (e === this.bossActive) this.bossActive = null;
        if (this.run.hearts <= 0) {
          this.run.hearts = 0;
          this.state = 'lost';
          this.cb.onEnd && this.cb.onEnd('lost');
          return;
        }
      } else if (e.dead) {
        if (e === this.bossActive) this.bossActive = null;
        this.enemies.splice(i, 1);
      }
    }

    this.updateProjectiles(dt);
    this.updateMines(dt);
    this.updateClouds(dt);

    for (let i = this.barriers.length - 1; i >= 0; i--) {
      this.barriers[i].t -= dt;
      if (this.barriers[i].t <= 0) this.barriers.splice(i, 1);
    }
    for (let i = this.fx.length - 1; i >= 0; i--) {
      this.fx[i].t += dt;
      if (this.fx[i].t >= this.fx[i].life) this.fx.splice(i, 1);
    }
    this.particles.update(dt);

    // Wellen-Ende prüfen
    if (this.state === 'wave' && !this.spawnQueue.length && !this.enemies.length) {
      const bonus = WAVE_BONUS + this.run.mods.waveGold;
      this.gold += bonus;
      sfx.waveDone();
      this.particles.number(this.path.pts[0].x, this.path.pts[0].y, `+${bonus}◉`, '#ffcd75', 14);
      if (this.waveIdx >= this.waves.length - 1) {
        this.state = 'won';
        this.cb.onEnd && this.cb.onEnd('won');
      } else {
        this.state = 'between';
        this.betweenT = 6;
        this.cb.onWaveChange && this.cb.onWaveChange();
      }
      return;
    }

    // Auto-Start nächste Welle
    if (this.state === 'between') {
      this.betweenT -= dt;
      if (this.betweenT <= 0) this.startWave();
    }
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.t = (p.t || 0) + dt;

      if (p.kind === 'boomerang') {
        p.rot += dt * 14;
        const dir = p.phase === 'out' ? 1 : -1;
        p.dist += p.speed * dt * dir;
        if (p.phase === 'out' && p.dist >= p.maxDist) p.phase = 'back';
        p.x = p.tower.x + Math.cos(p.ang) * p.dist;
        p.y = p.tower.y + Math.sin(p.ang) * p.dist;
        const hitSet = p.phase === 'out' ? p.hitOut : p.hitBack;
        for (const e of this.enemies) {
          if (hitSet.has(e.id) || !e.isTargetable(p.tower.targets)) continue;
          if (Math.hypot(e.x - p.x, e.y - p.y) < 26) {
            hitSet.add(e.id);
            e.hit(p.dmg, p.type, this, p.tower);
            this.particles.burst(e.x, e.y, '#e0c068', 5, 60);
            sfx.hit();
          }
        }
        if (p.phase === 'back' && p.dist <= 0) this.projectiles.splice(i, 1);
        continue;
      }

      // Ziel nachführen (orb) bzw. Fixpunkt (lob)
      if (p.kind === 'orb' && p.target && !p.target.dead && !p.target.leaked) {
        p.tx = p.target.x; p.ty = p.target.y;
      }
      const dx = p.tx - p.x, dy = p.ty - p.y;
      const d = Math.hypot(dx, dy);
      const step = p.speed * dt;
      if (d <= step + 6) {
        this.explodeAt(p, p.tx, p.ty);
        this.projectiles.splice(i, 1);
        continue;
      }
      p.x += (dx / d) * step;
      p.y += (dy / d) * step;
      // Trail-Partikel
      p.trail += dt;
      if (p.trail > 0.04) {
        p.trail = 0;
        const colors = { fireball: '#ffcd75', water: '#a8d8f0', leaf: '#a8e890', poison: '#c878c8', psy: '#f8a8c8', dragon: '#a888f8', rock: '#d8c898', sting: '#c8d840', shadow: '#9878b8' };
        this.particles.spawn({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20, size: 3, color: colors[p.visual] || '#fff', life: 0.3, glow: p.visual === 'fireball' });
      }
      if (p.t > 4) this.projectiles.splice(i, 1); // Sicherheitsnetz
    }
  }

  updateMines(dt) {
    for (let i = this.mines.length - 1; i >= 0; i--) {
      const m = this.mines[i];
      if (m.done) { this.mines.splice(i, 1); continue; }
      m.t += dt;
      for (const e of this.enemies) {
        if (e.underground || e.dead) continue;
        if (Math.hypot(e.x - m.x, e.y - m.y) < 22) {
          // BOOM
          const atk = m.tower.attack;
          const dmg = m.tower.dmg(this);
          this.particles.burst(m.x, m.y, '#f8d030', 18, 140, { glow: true });
          this.fx.push({ kind: 'ring', x: m.x, y: m.y, r0: 6, r1: atk.splash, t: 0, life: 0.35, color: '#f8d030' });
          for (const e2 of this.enemies) {
            if (e2.dead || e2.underground) continue;
            if (Math.hypot(e2.x - m.x, e2.y - m.y) <= atk.splash) {
              e2.hit(dmg, atk.type, this, m.tower);
              e2.applyEffects(atk.effect, this);
            }
          }
          sfx.explosion();
          this.shake(4);
          m.done = true;
          this.mines.splice(i, 1);
          break;
        }
      }
    }
  }

  updateClouds(dt) {
    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const c = this.clouds[i];
      c.t -= dt;
      if (c.t <= 0) { this.clouds.splice(i, 1); continue; }
      for (const e of this.enemies) {
        if (e.dead || e.underground) continue;
        if (Math.hypot(e.x - c.x, e.y - c.y) <= c.radius) {
          e.takeRawDamage(c.dps * dt, this, null, c.tower);
          if (!e.dead && c.slow) e.applyEffects({ slow: { f: c.slow, dur: 0.4 } }, this);
        }
      }
    }
  }
}
