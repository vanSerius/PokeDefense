// Tower: Zielerfassung, Feuern, Buffs, Entwicklung.
import { LINES } from '../data/pokemon.js';
import { TILE } from '../config.js';

let nextId = 1;

// Für die Team-Persistenz zwischen Maps
export function serializeTower(t) {
  return { lineKey: t.lineKey, stageIdx: t.stageIdx, kills: t.kills, spent: t.spent, trainLvl: t.trainLvl };
}

export class Tower {
  constructor(lineKey, col, row, saved = null) {
    this.id = nextId++;
    this.line = LINES[lineKey];
    this.lineKey = lineKey;
    this.stageIdx = saved ? saved.stageIdx : 0;
    this.col = col; this.row = row;
    this.x = col * TILE + TILE / 2;
    this.y = row * TILE + TILE / 2;
    this.kills = saved ? saved.kills : 0;
    this.spent = saved ? saved.spent : this.line.cost; // investiertes Gold (für Verkauf)
    this.trainLvl = saved ? (saved.trainLvl || 0) : 0;  // Trainings-Level (+Schaden/Tempo)
    this.cooldown = 0;
    this.buff = 1;                 // Pantimos-Aura
    this.disabled = 0;             // Mewtwo-Psychokinese
    this.recoil = 0;               // Angriffs-Animation
    this.evoFlash = 0;
    this.mines = [];               // Voltobal
    this.barrierT = 0;             // Pantimos
    this.auraPulse = 0;
  }

  get stage() { return this.line.stages[this.stageIdx]; }
  get attack() { return this.stage.attack; }
  get targets() { return this.line.targets || {}; }
  get maxStage() { return this.stageIdx >= this.line.stages.length - 1; }

  range(session) {
    return this.attack.range * (1 + session.run.mods.range);
  }

  dmg(session) {
    return this.attack.dmg * this.buff * (1 + session.run.mods.dmg) * Math.pow(1.08, this.trainLvl);
  }

  rate(session) {
    return this.attack.rate * (1 + session.run.mods.rate) * Math.pow(1.04, this.trainLvl);
  }

  // Training: unbegrenzter Gold-Sink, Kosten wachsen pro Level
  trainCost() {
    return Math.round(this.line.cost * 0.9 * Math.pow(1.3, this.trainLvl));
  }

  train(session) {
    const cost = this.trainCost();
    if (session.gold < cost) return false;
    session.gold -= cost;
    this.spent += cost;
    this.trainLvl++;
    this.evoFlash = 0.4;
    return true;
  }

  // Nächste Evolutionsstufe + Anforderungen (oder null)
  nextEvo(session) {
    if (this.maxStage) return null;
    const next = this.line.stages[this.stageIdx + 1];
    const evo = next.evo || {};
    let kills = evo.kills || 0;
    if (evo.friendship) kills = Math.ceil(kills * (1 - session.run.mods.friendship));
    kills = Math.ceil(kills / (1 + session.run.mods.killXp));
    return {
      stage: next,
      gold: evo.gold || 0,
      kills,
      stone: evo.stone || null,
      trade: !!evo.trade,
      friendship: !!evo.friendship,
    };
  }

  canEvolve(session) {
    const req = this.nextEvo(session);
    if (!req) return { ok: false, reason: 'Maximale Stufe erreicht' };
    if (req.trade) return { ok: false, trade: true, reason: 'Tausch-Entwicklung: nutze „Tauschen“ mit einem anderen Tower!' };
    if (session.run.candy > 0) return { ok: true, candy: true, req };
    if (req.stone && !session.run.stones.includes(req.stone)) {
      return { ok: false, reason: `Benötigt ${req.stone === 'mond' ? 'Mondstein' : req.stone === 'donner' ? 'Donnerstein' : req.stone + 'stein'} (Item-Draft)!` };
    }
    if (this.kills < req.kills) return { ok: false, reason: `Braucht noch ${req.kills - this.kills} Kills` };
    if (session.gold < req.gold) return { ok: false, reason: `Braucht ${req.gold} Gold` };
    return { ok: true, req };
  }

  evolve(session, free = false) {
    const req = this.nextEvo(session);
    if (!req) return false;
    if (!free) {
      session.gold -= req.gold;
      this.spent += req.gold;
    }
    this.stageIdx++;
    this.evoFlash = 1.2;
    this.cooldown = 0;
    return true;
  }

  // Beste Ziele: am weitesten fortgeschrittener erreichbarer Gegner
  findTarget(session) {
    const r = this.range(session);
    let best = null;
    for (const e of session.enemies) {
      if (!e.isTargetable(this.targets)) continue;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d > r) continue;
      if (!best || e.dist > best.dist) best = e;
    }
    return best;
  }

  update(dt, session) {
    if (this.recoil > 0) this.recoil -= dt * 4;
    if (this.evoFlash > 0) this.evoFlash -= dt;
    if (this.disabled > 0) { this.disabled -= dt; return; }
    this.cooldown -= dt;

    const atk = this.attack;

    if (atk.kind === 'support') {
      this.updateSupport(dt, session);
      return;
    }

    if (atk.kind === 'aura') {
      if (this.cooldown <= 0) {
        const r = this.range(session);
        let hitAny = false;
        for (const e of session.enemies) {
          if (!e.isTargetable(this.targets)) continue;
          if (Math.hypot(e.x - this.x, e.y - this.y) > r) continue;
          e.hit(this.dmg(session), atk.type, session, this);
          e.applyEffects(atk.effect, session);
          hitAny = true;
        }
        if (hitAny) {
          this.cooldown = 1 / this.rate(session);
          this.auraPulse = 0.5;
          session.fx.push({ kind: 'ring', x: this.x, y: this.y, r0: 20, r1: r, t: 0, life: 0.45, color: '#98d8d8' });
        }
      }
      if (this.auraPulse > 0) this.auraPulse -= dt;
      return;
    }

    if (atk.kind === 'mine') {
      this.mines = this.mines.filter((m) => !m.done);
      if (this.cooldown <= 0 && this.mines.length < atk.maxMines) {
        const spot = session.randomPathPointInRange(this.x, this.y, this.range(session));
        if (spot) {
          const mine = { x: spot.x, y: spot.y, dist: spot.dist, tower: this, t: 0, done: false };
          this.mines.push(mine);
          session.mines.push(mine);
          this.cooldown = 1 / this.rate(session);
          this.recoil = 0.3;
        }
      }
      return;
    }

    if (this.cooldown <= 0) {
      const target = this.findTarget(session);
      if (target) {
        session.fireAt(this, target);
        this.cooldown = 1 / this.rate(session);
        this.recoil = 0.35;
        this.facing = target.x < this.x ? -1 : 1;
      }
    }
  }

  updateSupport(dt, session) {
    const atk = this.attack;
    const r = this.range(session);
    // Buff-Aura auf Nachbar-Tower
    for (const t of session.towers) {
      if (t === this) continue;
      if (Math.hypot(t.x - this.x, t.y - this.y) <= r) t.buffNext = Math.max(t.buffNext || 1, atk.buff);
    }
    // Barriere
    this.barrierT += dt;
    if (this.barrierT >= atk.barrier.every) {
      this.barrierT = 0;
      const spot = session.randomPathPointInRange(this.x, this.y, r, true);
      if (spot) {
        session.barriers.push({ x: spot.x, y: spot.y, dist: spot.dist, t: atk.barrier.dur, max: atk.barrier.dur });
        session.fx.push({ kind: 'ring', x: spot.x, y: spot.y, r0: 8, r1: 40, t: 0, life: 0.4, color: '#f85888' });
        this.recoil = 0.35;
      }
    }
  }
}
