// 20 vorgenerierte Maps. Der Pfad ist als Wegpunkt-Liste (Grid-Koordinaten)
// definiert; Segmente verlaufen immer orthogonal. Erster Punkt = Spawn (Rand),
// letzter Punkt = Ziel (Rand). Kreuzungen sind erlaubt (Brücken-Optik).
// Deko wird prozedural pro Biom auf Nicht-Pfad-Zellen verteilt.
import { COLS, ROWS } from '../config.js';

export const BIOMES = {
  wiese:  { ground: '#4e9a4e', ground2: '#3f8a41', groundLight: '#65b05c', path: '#c2a35d', pathEdge: '#8a7440', deco: ['busch', 'blume', 'stein'], sky: '#87ceeb' },
  wald:   { ground: '#2e6e3e', ground2: '#255c34', groundLight: '#3f8a50', path: '#8a6f47', pathEdge: '#5e4b2f', deco: ['baum', 'baum', 'busch', 'pilz'], sky: '#5fa377' },
  see:    { ground: '#3d8a5a', ground2: '#337a4e', groundLight: '#55a56e', path: '#d9c47f', pathEdge: '#a08c53', deco: ['wasser', 'schilf', 'stein'], sky: '#6fc3df' },
  hoehle: { ground: '#4a4458', ground2: '#3d3849', groundLight: '#5c546e', path: '#7a7086', pathEdge: '#57505f', deco: ['fels', 'fels', 'kristall'], sky: '#2a2438' },
  vulkan: { ground: '#5e3a38', ground2: '#4d2e2b', groundLight: '#754944', path: '#8c5b45', pathEdge: '#63402f', deco: ['fels', 'lava', 'lava'], sky: '#8c3a2b' },
};

// 12 kuratierte Maps: Minibosse auf 3, 9 & 11 · Bosse auf 6 (Garados) & 12 (Mewtwo)
export const MAPS = [
  { name: 'Route 1',          biome: 'wiese',  path: [[0,3],[8,3],[8,6],[14,6],[14,3],[19,3]] },
  { name: 'Alabastia-Hügel',  biome: 'wiese',  path: [[0,1],[15,1],[15,5],[4,5],[4,8]] },
  { name: 'Felstunnel-Tor',   biome: 'wiese',  path: [[9,0],[9,3],[3,3],[3,6],[16,6],[16,3],[19,3]], miniboss: 'onix' },
  { name: 'Vertania-Wald',    biome: 'wald',   path: [[0,4],[5,4],[5,1],[11,1],[11,7],[16,7],[16,4],[19,4]] },
  { name: 'Flegmon-Brücke',   biome: 'wald',   path: [[0,7],[15,7],[15,1],[2,1],[2,4],[19,4]] },
  { name: 'Zorn-See',         biome: 'see',    path: [[0,4],[7,4],[7,2],[12,2],[12,6],[19,6]], boss: 'garados' },
  { name: 'Mondberg',         biome: 'hoehle', path: [[19,1],[8,1],[8,4],[15,4],[15,7],[0,7]] },
  { name: 'Siegesstraße',     biome: 'hoehle', path: [[9,0],[9,4],[2,4],[2,7],[16,7],[16,4],[19,4]] },
  { name: 'Seeschaum-Insel',  biome: 'hoehle', path: [[0,2],[17,2],[17,7],[0,7]], miniboss: 'lapras' },
  { name: 'Zinnoberpfad',     biome: 'vulkan', path: [[19,4],[13,4],[13,1],[6,1],[6,7],[0,7]] },
  { name: 'Glutkammer',       biome: 'vulkan', path: [[0,1],[9,1],[9,7],[3,7],[3,4],[14,4],[14,1],[19,1]], miniboss: 'arkani' },
  { name: 'Unbekannte Höhle', biome: 'vulkan', path: [[0,4],[16,4],[16,1],[3,1],[3,7],[19,7]], boss: 'mewtwo' },
];

// Wegpunkte → Liste aller Pfadzellen (in Laufrichtung, dedupliziert)
export function pathCells(waypoints) {
  const cells = [];
  const seen = new Set();
  const add = (c, r) => {
    const k = c + ',' + r;
    if (!seen.has(k)) { seen.add(k); cells.push([c, r]); }
  };
  for (let i = 0; i < waypoints.length - 1; i++) {
    let [c, r] = waypoints[i];
    const [c2, r2] = waypoints[i + 1];
    add(c, r);
    const dc = Math.sign(c2 - c), dr = Math.sign(r2 - r);
    while (c !== c2 || r !== r2) { c += dc; r += dr; add(c, r); }
  }
  return cells;
}

// Wegpunkte (Grid) → Pixel-Polyline (Zellmittelpunkte) + Gesamtlänge
export function buildPath(waypoints, tile) {
  const pts = waypoints.map(([c, r]) => ({ x: c * tile + tile / 2, y: r * tile + tile / 2 }));
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const len = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
    segs.push({ a: pts[i], b: pts[i + 1], len, start: total });
    total += len;
  }
  return { pts, segs, total };
}

// Position auf dem Pfad bei Distanz d (geklemmt)
export function pointAt(path, d) {
  d = Math.max(0, Math.min(path.total, d));
  for (const s of path.segs) {
    if (d <= s.start + s.len) {
      const t = s.len ? (d - s.start) / s.len : 0;
      return {
        x: s.a.x + (s.b.x - s.a.x) * t,
        y: s.a.y + (s.b.y - s.a.y) * t,
        dx: Math.sign(s.b.x - s.a.x),
        dy: Math.sign(s.b.y - s.a.y),
      };
    }
  }
  const last = path.pts[path.pts.length - 1];
  return { x: last.x, y: last.y, dx: 0, dy: 0 };
}

// Validierung (für Tests): Wegpunkte orthogonal & im Grid
export function validateMap(map) {
  const errs = [];
  const wp = map.path;
  for (const [c, r] of wp) {
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) errs.push(`Wegpunkt außerhalb: ${c},${r}`);
  }
  for (let i = 0; i < wp.length - 1; i++) {
    const [c1, r1] = wp[i], [c2, r2] = wp[i + 1];
    if (c1 !== c2 && r1 !== r2) errs.push(`Segment ${i} nicht orthogonal`);
    if (c1 === c2 && r1 === r2) errs.push(`Segment ${i} hat Länge 0`);
  }
  const [c0, r0] = wp[0];
  const [cn, rn] = wp[wp.length - 1];
  const onEdge = ([c, r]) => c === 0 || c === COLS - 1 || r === 0 || r === ROWS - 1;
  if (!onEdge([c0, r0])) errs.push('Spawn nicht am Rand');
  if (!onEdge([cn, rn])) errs.push('Ziel nicht am Rand');
  return errs;
}
