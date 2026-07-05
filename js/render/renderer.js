// Renderer: zeichnet Map (vorgerendert), Tower, Gegner, Projektile & Effekte.
import { TILE, COLS, ROWS, W, H } from '../config.js';
import { BIOMES, pointAt } from '../data/maps.js';
import { getFrame, getSprite } from '../core/loader.js';
import { TYPE_COLORS } from '../data/types.js';
import { makeRng } from '../core/rng.js';

const glowCache = new Map();
function glowSprite(color, size = 32) {
  const key = color + size;
  if (!glowCache.has(key)) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = size * 2;
    const g = cv.getContext('2d');
    const grad = g.createRadialGradient(size, size, 0, size, size, size);
    grad.addColorStop(0, color);
    grad.addColorStop(0.4, color + '88');
    grad.addColorStop(1, color + '00');
    g.fillStyle = grad;
    g.fillRect(0, 0, size * 2, size * 2);
    glowCache.set(key, cv);
  }
  return glowCache.get(key);
}

// ---------- Map-Hintergrund (einmal pro Map vorgerendert) ----------
export function renderMapBackground(session) {
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const biome = BIOMES[session.map.biome];
  const rng = makeRng(session.run.seed + session.mapNo * 999);

  // Boden: Schachbrett + Sprenkel
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      g.fillStyle = (c + r) % 2 === 0 ? biome.ground : biome.ground2;
      g.fillRect(c * TILE, r * TILE, TILE, TILE);
    }
  }
  for (let i = 0; i < 260; i++) {
    const x = rng() * W, y = rng() * H;
    g.fillStyle = rng() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
    g.fillRect(x, y, 3 + rng() * 4, 3 + rng() * 4);
  }

  // Pfad
  const pts = session.path.pts;
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.strokeStyle = biome.pathEdge;
  g.lineWidth = TILE * 0.78;
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for (const p of pts) g.lineTo(p.x, p.y);
  g.stroke();
  g.strokeStyle = biome.path;
  g.lineWidth = TILE * 0.62;
  g.stroke();
  // Pfad-Textur: Steinchen
  for (let d = 12; d < session.path.total; d += 26) {
    const p = pointAt(session.path, d);
    g.fillStyle = 'rgba(0,0,0,0.1)';
    const ox = (rng() - 0.5) * 26, oy = (rng() - 0.5) * 26;
    g.beginPath();
    g.arc(p.x + ox, p.y + oy, 2 + rng() * 2.5, 0, Math.PI * 2);
    g.fill();
  }

  // Spawn-Portal (Höhle) & Ziel (Fahne)
  const s0 = pts[0], sE = pts[pts.length - 1];
  g.fillStyle = '#16161f';
  g.beginPath(); g.ellipse(s0.x, s0.y, 26, 20, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#2a2438';
  g.beginPath(); g.ellipse(s0.x, s0.y, 18, 13, 0, 0, Math.PI * 2); g.fill();

  g.fillStyle = '#16161f';
  g.fillRect(sE.x - 3, sE.y - 34, 6, 38);
  g.fillStyle = '#ef4444';
  g.beginPath();
  g.moveTo(sE.x + 3, sE.y - 34);
  g.lineTo(sE.x + 26, sE.y - 26);
  g.lineTo(sE.x + 3, sE.y - 17);
  g.closePath(); g.fill();
  g.fillStyle = '#fff';
  g.beginPath(); g.arc(sE.x + 11, sE.y - 26, 3.5, 0, Math.PI * 2); g.fill();

  // Deko
  for (const d of session.deco) {
    drawDeco(g, d, rng);
  }
  return cv;
}

function drawDeco(g, d, rng) {
  const x = d.c * TILE + TILE / 2, y = d.r * TILE + TILE / 2;
  const v = d.v;
  g.save();
  g.translate(x, y);
  switch (d.kind) {
    case 'baum': {
      g.fillStyle = 'rgba(0,0,0,0.2)';
      g.beginPath(); g.ellipse(0, 22, 20, 7, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#5e4b2f'; g.fillRect(-5, 6, 10, 18);
      g.fillStyle = '#1e5631';
      for (let i = 0; i < 3; i++) {
        const w = 40 - i * 10, yy = 8 - i * 16;
        g.beginPath(); g.moveTo(-w / 2, yy); g.lineTo(0, yy - 22); g.lineTo(w / 2, yy); g.closePath(); g.fill();
      }
      g.fillStyle = '#2e7a45';
      g.beginPath(); g.moveTo(-12, -12); g.lineTo(0, -30); g.lineTo(12, -12); g.closePath(); g.fill();
      break;
    }
    case 'busch':
      g.fillStyle = '#2e7a45';
      g.beginPath(); g.arc(-8, 6, 11, 0, Math.PI * 2); g.arc(8, 6, 11, 0, Math.PI * 2); g.arc(0, -3, 13, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3e9a58';
      g.beginPath(); g.arc(-4, 0, 7, 0, Math.PI * 2); g.arc(7, 4, 6, 0, Math.PI * 2); g.fill();
      break;
    case 'blume': {
      const colors = ['#f8d030', '#ef7d57', '#f4f4f4', '#f85888'];
      for (let i = 0; i < 3; i++) {
        const fx = (v * 7 + i * 2.3) % 1 * 36 - 18, fy = (v * 13 + i * 3.1) % 1 * 36 - 18;
        g.fillStyle = colors[Math.floor((v * 10 + i) % colors.length)];
        g.beginPath(); g.arc(fx, fy, 4, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#ffcd75';
        g.beginPath(); g.arc(fx, fy, 1.5, 0, Math.PI * 2); g.fill();
      }
      break;
    }
    case 'stein': case 'fels': {
      const s = d.kind === 'fels' ? 1.4 : 1;
      g.fillStyle = 'rgba(0,0,0,0.2)';
      g.beginPath(); g.ellipse(0, 14 * s, 18 * s, 6 * s, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = d.kind === 'fels' ? '#6e6680' : '#8a8578';
      g.beginPath();
      g.moveTo(-16 * s, 12 * s); g.lineTo(-12 * s, -8 * s); g.lineTo(0, -16 * s); g.lineTo(14 * s, -6 * s); g.lineTo(16 * s, 12 * s);
      g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.15)';
      g.beginPath(); g.moveTo(-12 * s, -8 * s); g.lineTo(0, -16 * s); g.lineTo(4 * s, -4 * s); g.closePath(); g.fill();
      break;
    }
    case 'pilz':
      g.fillStyle = '#e8d8b8'; g.fillRect(-4, 0, 8, 14);
      g.fillStyle = '#c03028';
      g.beginPath(); g.arc(0, 0, 13, Math.PI, 0); g.fill();
      g.fillStyle = '#fff';
      g.beginPath(); g.arc(-5, -6, 2.5, 0, Math.PI * 2); g.arc(5, -4, 2, 0, Math.PI * 2); g.fill();
      break;
    case 'kristall': {
      g.fillStyle = 'rgba(120,200,255,0.25)';
      g.beginPath(); g.arc(0, 0, 24, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#7ec8ff';
      g.beginPath(); g.moveTo(0, -20); g.lineTo(10, 0); g.lineTo(0, 16); g.lineTo(-10, 0); g.closePath(); g.fill();
      g.fillStyle = '#b8e4ff';
      g.beginPath(); g.moveTo(0, -20); g.lineTo(10, 0); g.lineTo(0, 4); g.closePath(); g.fill();
      break;
    }
    case 'wasser':
      g.fillStyle = '#4a90d9';
      g.beginPath();
      if (g.roundRect) g.roundRect(-26, -22, 52, 44, 14); else g.rect(-26, -22, 52, 44);
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(-14, -6); g.quadraticCurveTo(-7, -11, 0, -6); g.quadraticCurveTo(7, -1, 14, -6); g.stroke();
      g.beginPath(); g.moveTo(-14, 8); g.quadraticCurveTo(-7, 3, 0, 8); g.quadraticCurveTo(7, 13, 14, 8); g.stroke();
      break;
    case 'lava':
      g.fillStyle = '#ff6b35';
      g.beginPath();
      if (g.roundRect) g.roundRect(-26, -22, 52, 44, 14); else g.rect(-26, -22, 52, 44);
      g.fill();
      g.fillStyle = '#ffcd75';
      g.beginPath(); g.arc(-8, -4, 6, 0, Math.PI * 2); g.arc(10, 8, 4, 0, Math.PI * 2); g.arc(6, -10, 3, 0, Math.PI * 2); g.fill();
      break;
    case 'schilf':
      g.strokeStyle = '#3e9a58'; g.lineWidth = 3; g.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        g.beginPath(); g.moveTo(i * 8, 16); g.quadraticCurveTo(i * 8 + i * 4, -4, i * 10, -14); g.stroke();
      }
      break;
  }
  g.restore();
}

// ---------- Sprites ----------
function drawSprite(ctx, dex, x, y, opts = {}) {
  const frame = getFrame(dex, opts.time || 0);
  if (!frame) return;
  const info = getSprite(dex);
  const targetH = (opts.size || 52) * (opts.scale || 1);
  const k = targetH / Math.max(info.h, 1);
  const w = info.w * k, h = info.h * k;
  ctx.save();
  ctx.translate(x, y);
  if (opts.flip) ctx.scale(-1, 1);
  if (opts.squashY) ctx.scale(1 / opts.squashY, opts.squashY);
  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
  let filtered = false;
  if (opts.filter) {
    try { ctx.filter = opts.filter; filtered = true; } catch (e) { /* alter Browser */ }
  }
  ctx.drawImage(frame, -w / 2, -h + 6, w, h);
  if (filtered) ctx.filter = 'none';
  ctx.restore();
}

function drawShadow(ctx, x, y, r) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
}

// ---------- Haupt-Frame ----------
export function drawFrame(ctx, session, ui) {
  const t = session.time;

  ctx.save();
  // Screenshake
  if (session.shakeT > 0) {
    const m = session.shakeMag * (session.shakeT / 0.4);
    ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
  }

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(session.bg, 0, 0);

  // Bauplatz-Hervorhebung im Platzierungsmodus
  if (ui.placing) {
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (session.canBuildAt(c, r)) ctx.fillRect(c * TILE + 2, r * TILE + 2, TILE - 4, TILE - 4);
      }
    }
  }

  // Wolken (Gift etc.)
  for (const c of session.clouds) {
    const a = Math.min(0.4, c.t / c.max * 0.5);
    const col = TYPE_COLORS[c.type] || '#a040a0';
    ctx.globalAlpha = a;
    for (let i = 0; i < 4; i++) {
      const ang = t * 0.8 + i * Math.PI / 2;
      const ox = Math.cos(ang) * c.radius * 0.35, oy = Math.sin(ang) * c.radius * 0.25;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(c.x + ox, c.y + oy, c.radius * 0.55, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Barrieren
  for (const b of session.barriers) {
    const a = Math.min(1, b.t / 0.3);
    ctx.globalAlpha = 0.5 * a;
    ctx.fillStyle = '#f85888';
    ctx.beginPath(); ctx.ellipse(b.x, b.y, 26, 34, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.9 * a;
    ctx.strokeStyle = '#ffd0e0'; ctx.lineWidth = 3;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Minen (Mini-Voltobal)
  for (const m of session.mines) {
    const blink = Math.sin(m.t * 6) > 0.6;
    drawShadow(ctx, m.x, m.y + 6, 10);
    ctx.fillStyle = blink ? '#ff6b6b' : '#ef4444';
    ctx.beginPath(); ctx.arc(m.x, m.y, 9, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#f4f4f4';
    ctx.beginPath(); ctx.arc(m.x, m.y, 9, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = '#16161f'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(m.x, m.y, 9, 0, Math.PI * 2); ctx.moveTo(m.x - 9, m.y); ctx.lineTo(m.x + 9, m.y); ctx.stroke();
  }

  // ---- Entities nach Y sortiert ----
  const drawables = [];
  for (const tw of session.towers) drawables.push({ y: tw.y, kind: 'tower', o: tw });
  for (const e of session.enemies) drawables.push({ y: e.y + (e.move === 'fly' ? 14 : 0), kind: 'enemy', o: e });
  drawables.sort((a, b) => a.y - b.y);

  for (const d of drawables) {
    if (d.kind === 'tower') drawTower(ctx, session, d.o, t, ui);
    else drawEnemy(ctx, session, d.o, t);
  }

  // Projektile
  for (const p of session.projectiles) drawProjectile(ctx, p, t);

  // FX
  for (const f of session.fx) drawFx(ctx, f);

  // Partikel & Zahlen
  session.particles.draw(ctx);

  // Platzierungs-Geist
  if (ui.placing && ui.ghostCell) {
    const [c, r] = ui.ghostCell;
    const ok = session.canBuildAt(c, r) && session.gold >= ui.placing.cost;
    const x = c * TILE + TILE / 2, y = r * TILE + TILE / 2;
    const range = ui.placing.stages[0].attack.range * (1 + session.run.mods.range);
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = ok ? '#38b764' : '#ef4444';
    ctx.beginPath(); ctx.arc(x, y, range, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = ok ? '#38b764' : '#ef4444'; ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = ok ? 'rgba(56,183,100,0.35)' : 'rgba(239,68,68,0.35)';
    ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
    drawSprite(ctx, ui.placing.stages[0].dex, x, y + 20, { time: t * 1000, alpha: 0.75 });
  }

  // Ausgewählter Tower: Reichweite
  if (ui.selectedTower && session.towers.includes(ui.selectedTower)) {
    const tw = ui.selectedTower;
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#41a6f6';
    ctx.beginPath(); ctx.arc(tw.x, tw.y, tw.range(session), 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = '#41a6f6'; ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Tausch-Modus: Pfeile
    if (ui.swapMode) {
      ctx.strokeStyle = '#ffcd75'; ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(tw.col * TILE + 3, tw.row * TILE + 3, TILE - 6, TILE - 6);
      ctx.setLineDash([]);
    }
  }

  // Boss-HP-Leiste
  if (session.bossActive) {
    const b = session.bossActive;
    const w = W * 0.5, x = (W - w) / 2, y = 14;
    ctx.fillStyle = 'rgba(22,22,31,0.85)';
    ctx.fillRect(x - 4, y - 4, w + 8, 22);
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(x, y, w, 14);
    const frac = Math.max(0, b.hp / b.maxHp);
    ctx.fillStyle = frac > 0.5 ? '#38b764' : (frac > 0.25 ? '#ffcd75' : '#ef4444');
    ctx.fillRect(x, y, w * frac, 14);
    ctx.font = 'bold 10px PressStart, monospace';
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText(b.name + (b.rage ? ' – WUT!' : b.shield > 0 ? ' – SCHILD' : ''), W / 2, y + 11);
  }

  ctx.restore();
}

function drawTower(ctx, session, tw, t, ui) {
  drawShadow(ctx, tw.x, tw.y + 22, 20);
  // Sockel
  ctx.fillStyle = 'rgba(22,22,31,0.25)';
  ctx.beginPath();
  if (ctx.roundRect) { ctx.roundRect(tw.col * TILE + 6, tw.row * TILE + 6, TILE - 12, TILE - 12, 10); ctx.fill(); }

  const bob = Math.sin(t * 2.5 + tw.id) * 1.5;
  const squash = tw.recoil > 0 ? 1 - Math.sin(Math.min(1, tw.recoil / 0.35) * Math.PI) * 0.15 : 1;
  const opts = {
    time: t * 1000, size: 54, squashY: squash, flip: tw.facing === -1,
  };
  if (tw.disabled > 0) opts.filter = 'grayscale(0.8) brightness(0.7)';
  if (tw.evoFlash > 0.6) opts.filter = 'brightness(3)';
  drawSprite(ctx, tw.stage.dex, tw.x, tw.y + 24 + bob, opts);

  if (tw.disabled > 0) {
    ctx.font = '12px PressStart, monospace';
    ctx.fillStyle = '#f85888'; ctx.textAlign = 'center';
    ctx.fillText('✕', tw.x, tw.y - 26 + Math.sin(t * 4) * 3);
  }
  if (tw.buff > 1) {
    ctx.fillStyle = '#ffcd75';
    const a = t * 3 + tw.id;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(tw.x + Math.cos(a) * 22 - 1.5, tw.y - 8 + Math.sin(a * 1.3) * 14 - 1.5, 3, 3);
    ctx.globalAlpha = 1;
  }
  // Evo-Bereit-Anzeige
  const check = tw.canEvolve(session);
  if (check.ok) {
    ctx.font = '11px PressStart, monospace';
    ctx.fillStyle = '#38b764'; ctx.textAlign = 'center';
    ctx.fillText('▲', tw.x + 20, tw.y - 20 + Math.sin(t * 5) * 3);
  }
}

function drawEnemy(ctx, session, e, t) {
  if (e.dead) return;
  const fly = e.move === 'fly';
  const floaty = e.move === 'float';
  const lift = fly ? 20 + Math.sin(e.wobble) * 4 : (floaty ? 8 + Math.sin(e.wobble) * 3 : 0);

  if (e.underground) {
    // Erdhügel
    ctx.fillStyle = '#6e5a3a';
    ctx.beginPath(); ctx.ellipse(e.x, e.y + 8, 16, 9, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#5a4a30';
    ctx.beginPath(); ctx.ellipse(e.x, e.y + 8, 16, 4, 0, 0, Math.PI); ctx.fill();
    return;
  }

  drawShadow(ctx, e.x, e.y + 12, fly ? 8 : 13 * e.scale);

  const opts = {
    time: t * 1000 + e.id * 137, size: 44 * e.scale,
    flip: e.dx < 0,
  };
  if (e.flash > 0) opts.filter = 'brightness(2.4) saturate(0.3)';
  else if (e.def.shiny) opts.filter = 'hue-rotate(160deg)';
  else if (e.rage) opts.filter = 'saturate(2) brightness(1.15)';
  drawSprite(ctx, e.dex, e.x, e.y + 14 - lift, opts);

  // Schild (Mewtwo)
  if (e.shield > 0) {
    ctx.globalAlpha = 0.4 + Math.sin(t * 8) * 0.15;
    ctx.strokeStyle = '#f85888'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(e.x, e.y - lift - 6, 30 * e.scale, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // HP-Balken
  if (e.hp < e.maxHp) {
    const w = 30 * e.scale, x = e.x - w / 2, y = e.y - lift - 26 * e.scale;
    ctx.fillStyle = 'rgba(22,22,31,0.7)';
    ctx.fillRect(x - 1, y - 1, w + 2, 5);
    const frac = e.hp / e.maxHp;
    ctx.fillStyle = frac > 0.5 ? '#38b764' : (frac > 0.25 ? '#ffcd75' : '#ef4444');
    ctx.fillRect(x, y, w * frac, 3);
  }

  // Status-Icons
  let ix = e.x - 12;
  const iy = e.y - lift - 32 * e.scale;
  const dot = (color) => {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(ix, iy, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#16161f'; ctx.lineWidth = 1; ctx.stroke();
    ix += 9;
  };
  if (e.burn) dot('#f08030');
  if (e.poison.length) dot('#a040a0');
  if (e.slow) dot('#98d8d8');
  if (e.sleep > 0) {
    ctx.font = '9px PressStart, monospace';
    ctx.fillStyle = '#a890f0'; ctx.textAlign = 'center';
    ctx.fillText('z', e.x + 14 + Math.sin(t * 3) * 2, iy - 4 - (t * 8 % 6));
  }
}

function drawProjectile(ctx, p, t) {
  ctx.save();
  switch (p.visual) {
    case 'fireball': {
      ctx.drawImage(glowSprite('#f08030'), p.x - 20, p.y - 20, 40, 40);
      ctx.fillStyle = '#ffcd75';
      ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff8e8';
      ctx.beginPath(); ctx.arc(p.x - 1, p.y - 1, 3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'water': {
      ctx.fillStyle = '#6890f0';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b8d8f8';
      ctx.beginPath(); ctx.arc(p.x - 2, p.y - 3, 2.5, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'leaf': {
      ctx.translate(p.x, p.y);
      ctx.rotate(t * 10);
      ctx.fillStyle = '#78c850';
      ctx.beginPath(); ctx.ellipse(0, 0, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#4e9a30'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke();
      break;
    }
    case 'poison': {
      ctx.fillStyle = '#a040a0';
      const puls = 1 + Math.sin(t * 12) * 0.15;
      ctx.beginPath(); ctx.arc(p.x, p.y, 7 * puls, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d080d0';
      ctx.beginPath(); ctx.arc(p.x - 2, p.y - 2, 2.5, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'psy': {
      ctx.drawImage(glowSprite('#f85888'), p.x - 18, p.y - 18, 36, 36);
      ctx.strokeStyle = '#f85888'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, 5 + Math.sin(t * 14) * 2, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ffd0e0';
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'dragon': {
      ctx.drawImage(glowSprite('#7038f8'), p.x - 22, p.y - 22, 44, 44);
      ctx.fillStyle = '#a888f8';
      ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'rock': {
      ctx.translate(p.x, p.y);
      ctx.rotate(t * 6);
      ctx.fillStyle = '#b8a038';
      ctx.beginPath();
      ctx.moveTo(-7, 3); ctx.lineTo(-4, -6); ctx.lineTo(4, -6); ctx.lineTo(7, 2); ctx.lineTo(2, 7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d8c878';
      ctx.fillRect(-3, -4, 4, 3);
      break;
    }
    case 'sting': {
      const ang = Math.atan2(p.ty - p.y, p.tx - p.x);
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      ctx.fillStyle = '#f8f8d0';
      ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-5, -3); ctx.lineTo(-5, 3); ctx.closePath(); ctx.fill();
      break;
    }
    case 'shadow': {
      ctx.drawImage(glowSprite('#705898'), p.x - 20, p.y - 20, 40, 40);
      ctx.fillStyle = '#40305a';
      const puls = 1 + Math.sin(t * 10) * 0.2;
      ctx.beginPath(); ctx.arc(p.x, p.y, 7 * puls, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9878b8';
      ctx.beginPath(); ctx.arc(p.x + 2, p.y - 2, 2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'bone': {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = '#f0e8d0';
      ctx.fillRect(-10, -2.5, 20, 5);
      for (const sx of [-10, 10]) {
        ctx.beginPath();
        ctx.arc(sx, -3, 3.5, 0, Math.PI * 2);
        ctx.arc(sx, 3, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    default: {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawFx(ctx, f) {
  const k = f.t / f.life;
  if (f.kind === 'ring') {
    const r = f.r0 + (f.r1 - f.r0) * k;
    ctx.globalAlpha = (1 - k) * 0.8;
    ctx.strokeStyle = f.color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (f.kind === 'bolt') {
    ctx.globalAlpha = 1 - k;
    for (const [width, color] of [[5, '#16161f'], [3, '#f8d030'], [1.5, '#fffbe0']]) {
      ctx.strokeStyle = color; ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i < f.pts.length - 1; i++) {
        const a = f.pts[i], b = f.pts[i + 1];
        ctx.moveTo(a.x, a.y);
        const segs = 4;
        for (let s = 1; s <= segs; s++) {
          const tt = s / segs;
          const mx = a.x + (b.x - a.x) * tt + (s < segs ? (Math.random() - 0.5) * 14 : 0);
          const my = a.y + (b.y - a.y) * tt + (s < segs ? (Math.random() - 0.5) * 14 : 0);
          ctx.lineTo(mx, my);
        }
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (f.kind === 'psy') {
    ctx.globalAlpha = (1 - k) * 0.9;
    ctx.strokeStyle = '#f85888'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const r = 26 - k * 20 - i * 7;
      if (r > 2) { ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, Math.PI * 2); ctx.stroke(); }
    }
    ctx.globalAlpha = (1 - k) * 0.3;
    ctx.beginPath(); ctx.moveTo(f.from.x, f.from.y); ctx.lineTo(f.x, f.y); ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
