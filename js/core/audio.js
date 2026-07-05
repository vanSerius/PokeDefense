// Prozedurale WebAudio-Soundeffekte – keine Audiodateien nötig.
import { getMeta, saveMeta } from './save.js';

let ctx = null;
let master = null;

function ensureCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = getMeta().muted ? 0 : 0.35;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function unlockAudio() { try { ensureCtx(); } catch (e) { /* kein Audio */ } }

export function toggleMute() {
  const m = getMeta();
  m.muted = !m.muted;
  saveMeta();
  if (master) master.gain.value = m.muted ? 0 : 0.35;
  return m.muted;
}
export function isMuted() { return getMeta().muted; }

function tone({ freq = 440, freq2 = null, dur = 0.1, type = 'square', vol = 0.5, delay = 0 }) {
  if (!ctx || getMeta().muted) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freq2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq2), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g); g.connect(master);
  osc.start(t0); osc.stop(t0 + dur + 0.02);
}

function noise({ dur = 0.15, vol = 0.3, delay = 0, low = false }) {
  if (!ctx || getMeta().muted) return;
  const t0 = ctx.currentTime + delay;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain(); g.gain.value = vol;
  if (low) {
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
    src.connect(f); f.connect(g);
  } else src.connect(g);
  g.connect(master);
  src.start(t0);
}

export const sfx = {
  shoot: () => tone({ freq: 700, freq2: 300, dur: 0.06, type: 'square', vol: 0.12 }),
  zap: () => { tone({ freq: 1600, freq2: 200, dur: 0.09, type: 'sawtooth', vol: 0.15 }); },
  hit: () => noise({ dur: 0.05, vol: 0.1 }),
  kill: () => tone({ freq: 300, freq2: 60, dur: 0.18, type: 'triangle', vol: 0.2 }),
  build: () => { tone({ freq: 330, dur: 0.07, vol: 0.2 }); tone({ freq: 494, dur: 0.09, delay: 0.07, vol: 0.2 }); },
  sell: () => { tone({ freq: 494, dur: 0.07, vol: 0.2 }); tone({ freq: 330, dur: 0.09, delay: 0.07, vol: 0.2 }); },
  evolve: () => {
    [262, 330, 392, 523, 659, 784].forEach((f, i) => tone({ freq: f, dur: 0.12, delay: i * 0.09, type: 'square', vol: 0.22 }));
  },
  leak: () => { tone({ freq: 200, freq2: 80, dur: 0.3, type: 'sawtooth', vol: 0.3 }); noise({ dur: 0.2, vol: 0.2, low: true }); },
  waveStart: () => { tone({ freq: 392, dur: 0.1, vol: 0.2 }); tone({ freq: 523, dur: 0.12, delay: 0.1, vol: 0.2 }); },
  waveDone: () => { [523, 659, 784].forEach((f, i) => tone({ freq: f, dur: 0.1, delay: i * 0.08, vol: 0.2 })); },
  gold: () => tone({ freq: 988, freq2: 1319, dur: 0.08, type: 'sine', vol: 0.15 }),
  boss: () => { [110, 104, 98, 92].forEach((f, i) => tone({ freq: f, dur: 0.35, delay: i * 0.3, type: 'sawtooth', vol: 0.3 })); },
  victory: () => { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.16, delay: i * 0.14, type: 'square', vol: 0.25 })); },
  defeat: () => { [392, 370, 349, 330].forEach((f, i) => tone({ freq: f, dur: 0.3, delay: i * 0.25, type: 'triangle', vol: 0.3 })); },
  click: () => tone({ freq: 880, dur: 0.04, type: 'sine', vol: 0.15 }),
  error: () => tone({ freq: 160, dur: 0.15, type: 'square', vol: 0.2 }),
  explosion: () => { noise({ dur: 0.35, vol: 0.35, low: true }); tone({ freq: 90, freq2: 30, dur: 0.3, type: 'sawtooth', vol: 0.3 }); },
};
