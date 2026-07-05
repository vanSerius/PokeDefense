// Gegner: Bewegung entlang des Pfads, Statuseffekte, Grab-Zyklen, Boss-Fähigkeiten.
import { pointAt } from '../data/maps.js';
import { typeMult } from '../data/types.js';

let nextId = 1;

export class Enemy {
  constructor(def, opts = {}) {
    this.id = nextId++;
    this.def = def;
    this.dex = def.dex;
    this.name = def.name;
    this.types = def.types;
    this.move = def.move;
    this.maxHp = Math.round(def.hp * (opts.hpMult || 1));
    this.hp = this.maxHp;
    this.baseSpeed = def.speed * (opts.speedMult || 1);
    this.bounty = Math.max(1, Math.round(def.bounty * (opts.bountyMult || 1)));
    this.dist = opts.dist || 0;
    this.dead = false;
    this.leaked = false;
    this.scale = def.scale || 1;
    this.boss = !!def.boss;
    this.miniboss = !!def.miniboss;

    // Status
    this.burn = null;      // {dps, t}
    this.poison = [];      // [{dps, t}] (Stacks)
    this.slow = null;      // {f, t}
    this.sleep = 0;
    this.stun = 0;
    this.held = 0;         // Barriere
    this.flash = 0;        // Hit-Blink
    this.wobble = Math.random() * Math.PI * 2;

    // Graben
    this.underground = false;
    this.digT = def.digCycle ? Math.random() * def.digCycle.up : 0;

    // Boss-Zustand
    this.shield = 0;
    this.rage = false;
    this.abilityT = 0;
    this.phasesDone = new Set();
  }

  get statusImmunityFactor() { return this.boss ? 0.35 : (this.miniboss ? 0.6 : 1); }

  currentSpeed() {
    if (this.sleep > 0 || this.stun > 0 || this.held > 0) return 0;
    let s = this.baseSpeed;
    if (this.slow) s *= this.slow.f;
    if (this.rage) s *= 1.7;
    if (this.underground) s *= 0.6;
    return s;
  }

  isTargetable(towerTargets) {
    if (this.dead) return false;
    if (this.shield > 0) return false;
    if (this.underground && !(towerTargets && towerTargets.dig)) return false;
    if (this.move === 'fly' && towerTargets && towerTargets.fly === false) return false;
    return true;
  }

  update(dt, session) {
    if (this.dead) return;
    const path = session.path;

    // Timer
    if (this.flash > 0) this.flash -= dt;
    if (this.sleep > 0) this.sleep -= dt;
    if (this.stun > 0) this.stun -= dt;
    if (this.held > 0) this.held -= dt;
    if (this.shield > 0) this.shield -= dt;
    if (this.slow) { this.slow.t -= dt; if (this.slow.t <= 0) this.slow = null; }

    // DoT
    if (this.burn) {
      this.takeRawDamage(this.burn.dps * dt, session, '#f08030');
      this.burn.t -= dt;
      if (this.burn.t <= 0) this.burn = null;
    }
    for (let i = this.poison.length - 1; i >= 0; i--) {
      const p = this.poison[i];
      this.takeRawDamage(p.dps * dt, session, '#a040a0');
      p.t -= dt;
      if (p.t <= 0) this.poison.splice(i, 1);
    }
    if (this.dead) return;

    // Regeneration
    if (this.def.regen && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.def.regen * dt * (this.maxHp / 100));
    }

    // Grab-Zyklus
    if (this.def.digCycle) {
      this.digT -= dt;
      if (this.digT <= 0) {
        this.underground = !this.underground;
        this.digT = this.underground ? this.def.digCycle.down : this.def.digCycle.up;
        if (this.underground) session.particles.burst(this.x, this.y, '#8a6f47', 8, 70);
      }
    }

    // Boss-Fähigkeiten
    if (this.def.ability === 'garados') this.updateGarados(dt, session);
    if (this.def.ability === 'mewtwo') this.updateMewtwo(dt, session);

    // Barrieren prüfen
    for (const bar of session.barriers) {
      if (bar.t > 0 && this.dist < bar.dist && this.dist > bar.dist - 30) {
        this.held = Math.max(this.held, 0.1);
      }
    }

    this.dist += this.currentSpeed() * dt;
    this.wobble += dt * 6;

    const p = pointAt(path, this.dist);
    this.x = p.x; this.y = p.y; this.dx = p.dx;

    if (this.dist >= path.total) {
      this.leaked = true;
      this.dead = true;
    }
  }

  updateGarados(dt, session) {
    this.abilityT += dt;
    // Alle 9s für 2.5s abtauchen
    const cycle = this.abilityT % 9;
    const wasUnder = this.underground;
    this.underground = cycle > 6.5;
    if (this.underground && !wasUnder) {
      session.particles.burst(this.x, this.y, '#6890f0', 16, 120, { glow: true });
      session.toast && session.toast('Garados taucht ab!');
    }
    if (!this.underground && wasUnder) {
      session.particles.burst(this.x, this.y, '#6890f0', 16, 120, { glow: true });
    }
    if (!this.rage && this.hp < this.maxHp * 0.3) {
      this.rage = true;
      session.shake(10);
      session.toast && session.toast('GARADOS WUTANFALL!');
    }
  }

  updateMewtwo(dt, session) {
    this.abilityT += dt;
    // Alle 12s: zufälligen Tower deaktivieren
    if (this.abilityT > 12) {
      this.abilityT = 0;
      const candidates = session.towers.filter((t) => t.disabled <= 0);
      if (candidates.length) {
        const t = candidates[Math.floor(Math.random() * candidates.length)];
        t.disabled = 4;
        session.particles.burst(t.x, t.y, '#f85888', 14, 100, { glow: true });
        session.toast && session.toast(`Mewtwo blockiert ${t.stage.name}!`);
      }
    }
    // Phasen: Schild + Klone bei 75/50/25%
    for (const ph of [0.75, 0.5, 0.25]) {
      if (this.hp < this.maxHp * ph && !this.phasesDone.has(ph)) {
        this.phasesDone.add(ph);
        this.shield = 3;
        session.shake(8);
        session.spawnClones(this, 2);
        session.toast && session.toast('Mewtwo erschafft Klone!');
      }
    }
  }

  // Roher Schaden ohne Typ-Berechnung (DoT, Wolken)
  takeRawDamage(amount, session, color, source = null) {
    if (this.dead || this.shield > 0) return;
    this.hp -= amount;
    if (this.hp <= 0) { this.hp = 0; session.onEnemyKilled(this, source); }
  }

  // Getroffen von einem Angriff
  hit(dmg, attackType, session, source, opts = {}) {
    if (this.dead || this.shield > 0) return 0;
    const mult = typeMult(attackType, this.types);
    let amount = dmg * mult;
    if (opts.critMult) amount *= opts.critMult;
    this.hp -= amount;
    this.flash = 0.12;

    // Schadenszahl
    const eff = mult >= 2 ? '#ffcd75' : (mult <= 0.5 ? '#94b0c2' : '#ffffff');
    const size = mult >= 2 ? 15 : (opts.critMult ? 15 : 11);
    session.particles.number(this.x, this.y - 24 * this.scale, String(Math.round(amount)), opts.critMult ? '#ef7d57' : eff, size);
    if (mult >= 2 && Math.random() < 0.3) session.particles.number(this.x, this.y - 40, 'SUPER!', '#ffcd75', 8);

    if (this.hp <= 0) { this.hp = 0; session.onEnemyKilled(this, source); }
    return amount;
  }

  applyEffects(effect, session, imm = null) {
    if (!effect || this.dead) return;
    const f = imm !== null ? imm : this.statusImmunityFactor;
    if (effect.burn) {
      this.burn = { dps: effect.burn.dps, t: effect.burn.dur * f };
    }
    if (effect.poison && this.poison.length < (effect.poison.stack || 3)) {
      this.poison.push({ dps: effect.poison.dps, t: effect.poison.dur * f });
    }
    if (effect.slow) {
      if (!this.slow || effect.slow.f < this.slow.f) this.slow = { f: effect.slow.f, t: effect.slow.dur * f };
      else this.slow.t = Math.max(this.slow.t, effect.slow.dur * f);
    }
    if (effect.sleep && Math.random() < effect.sleep.chance) {
      this.sleep = Math.max(this.sleep, effect.sleep.dur * f);
      session.particles.number(this.x, this.y - 30, 'Zzz', '#a890f0', 9);
    }
    if (effect.stun) {
      this.stun = Math.max(this.stun, effect.stun.dur * f);
    }
    if (effect.push) {
      const d = effect.push.dist * (this.boss ? 0.2 : (this.miniboss ? 0.45 : 1));
      this.dist = Math.max(0, this.dist - d);
      session.particles.burst(this.x, this.y, '#f85888', 5, 60, { glow: true });
    }
  }
}
