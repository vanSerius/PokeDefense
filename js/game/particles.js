// Partikelsystem + Schadenszahlen. Bewusst schlicht & schnell (Mobile!).
const MAX_PARTICLES = 400;

export class Particles {
  constructor() {
    this.list = [];
    this.numbers = [];
  }

  spawn(opts) {
    if (this.list.length >= MAX_PARTICLES) return;
    this.list.push({
      x: opts.x, y: opts.y,
      vx: opts.vx || 0, vy: opts.vy || 0,
      g: opts.g || 0,
      size: opts.size || 3,
      color: opts.color || '#fff',
      t: 0, life: opts.life || 0.5,
      shrink: opts.shrink !== false,
      glow: opts.glow || false,
    });
  }

  burst(x, y, color, count = 8, speed = 90, opts = {}) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.8);
      this.spawn({
        x, y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30,
        g: opts.g !== undefined ? opts.g : 220,
        size: (opts.size || 4) * (0.6 + Math.random() * 0.8),
        color, life: (opts.life || 0.45) * (0.7 + Math.random() * 0.6),
        glow: opts.glow,
      });
    }
  }

  number(x, y, text, color = '#fff', size = 13) {
    if (this.numbers.length > 40) this.numbers.shift();
    this.numbers.push({ x: x + (Math.random() * 16 - 8), y, text, color, size, t: 0, life: 0.8 });
  }

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      p.t += dt;
      if (p.t >= p.life) { this.list.splice(i, 1); continue; }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (let i = this.numbers.length - 1; i >= 0; i--) {
      const n = this.numbers[i];
      n.t += dt;
      n.y -= 34 * dt;
      if (n.t >= n.life) this.numbers.splice(i, 1);
    }
  }

  draw(ctx) {
    for (const p of this.list) {
      const k = 1 - p.t / p.life;
      const s = p.shrink ? p.size * k : p.size;
      ctx.globalAlpha = Math.min(1, k * 1.5);
      ctx.fillStyle = p.color;
      if (p.glow) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, s * 1.6, 0, Math.PI * 2);
        ctx.globalAlpha *= 0.35;
        ctx.fill();
        ctx.globalAlpha = Math.min(1, k * 1.5);
      }
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    for (const n of this.numbers) {
      const k = 1 - n.t / n.life;
      ctx.globalAlpha = Math.min(1, k * 2);
      ctx.font = `bold ${n.size}px PressStart, monospace`;
      ctx.strokeStyle = '#16161f';
      ctx.lineWidth = 3;
      ctx.strokeText(n.text, n.x, n.y);
      ctx.fillStyle = n.color;
      ctx.fillText(n.text, n.x, n.y);
    }
    ctx.globalAlpha = 1;
  }
}
