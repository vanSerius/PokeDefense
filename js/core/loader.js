// Asset-Loader: lädt animierte GIF-Sprites (dekodiert zu Canvas-Frames)
// und statische PNGs als Fallback. Alles wird gecacht.
import { decodeGif } from './gif.js';

const sprites = new Map();   // dexId -> { frames:[{canvas,delay}], total, w, h }
const statics = new Map();   // dexId -> HTMLImageElement

export function staticUrl(dex) { return `assets/sprites/static/${dex}.png`; }
export function itemUrl(icon) { return `assets/sprites/items/${icon}.png`; }

function loadImage(url) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = url;
  });
}

async function loadAnimated(dex) {
  try {
    const resp = await fetch(`assets/sprites/animated/${dex}.gif`);
    if (!resp.ok) throw new Error('404');
    const gif = decodeGif(await resp.arrayBuffer());
    if (!gif.frames.length) throw new Error('leer');
    const total = gif.frames.reduce((s, f) => s + f.delay, 0);
    sprites.set(dex, { frames: gif.frames, total, w: gif.width, h: gif.height });
  } catch (e) {
    // Fallback: statisches PNG als Ein-Frame-Sprite
    const img = statics.get(dex);
    if (img) sprites.set(dex, { frames: [{ canvas: img, delay: 1000 }], total: 1000, w: img.width, h: img.height });
  }
}

export async function loadAll(dexIds, onProgress) {
  const ids = [...new Set(dexIds)];
  let done = 0;
  const step = () => { done++; onProgress && onProgress(done / (ids.length * 2)); };
  // Statische zuerst (Fallback-Basis), dann animierte
  await Promise.all(ids.map(async (dex) => {
    try { statics.set(dex, await loadImage(staticUrl(dex))); } catch (e) { /* egal */ }
    step();
  }));
  await Promise.all(ids.map(async (dex) => { await loadAnimated(dex); step(); }));
}

// Aktuellen Frame eines Sprites anhand der Weltzeit holen
export function getFrame(dex, timeMs) {
  const s = sprites.get(dex);
  if (!s) return null;
  if (s.frames.length === 1) return s.frames[0].canvas;
  let t = timeMs % s.total;
  for (const f of s.frames) {
    if (t < f.delay) return f.canvas;
    t -= f.delay;
  }
  return s.frames[0].canvas;
}

export function getSprite(dex) { return sprites.get(dex) || null; }
export function getStatic(dex) { return statics.get(dex) || null; }
