// Handgepixeltes GBA-Stil-Tileset, komplett im Code erzeugt.
// Alles wird in 16px-Tiles auf einen Low-Res-Canvas (320×144) gezeichnet
// und ohne Glättung ×4 hochskaliert → einheitlicher Pixel-Look.
import { TILE, COLS, ROWS, W, H } from '../config.js';
import { pathCells } from '../data/maps.js';
import { makeRng } from '../core/rng.js';

const S = 16;                 // Tile-Größe in Low-Res-Pixeln
const LW = COLS * S;          // 320
const LH = ROWS * S;          // 144

// ---------- Biom-Paletten (an Pokémon Smaragd angelehnt) ----------
export const PALETTES = {
  wiese: {
    grass: '#68c058', grassDark: '#58b048', tuft: '#3f9838', tuftHi: '#88d870',
    path: '#e8d8a8', pathHi: '#f4e8c0', pathLo: '#d0b880', edge: '#a08850', edgeDark: '#705c30',
    frame: '#2e5e2a',
  },
  wald: {
    grass: '#48a050', grassDark: '#3c9044', tuft: '#2a7834', tuftHi: '#63bd68',
    path: '#c8a878', pathHi: '#dcc094', pathLo: '#b08c58', edge: '#80683c', edgeDark: '#584828',
    frame: '#1e4420',
  },
  see: {
    grass: '#58b878', grassDark: '#4aa868', tuft: '#328850', tuftHi: '#7cd49a',
    path: '#f0dCA8'.toLowerCase(), pathHi: '#f8ecc8', pathLo: '#d8c088', edge: '#a89058', edgeDark: '#786438',
    frame: '#1c4c46',
  },
  hoehle: {
    grass: '#6c6080', grassDark: '#605474', tuft: '#4a4060', tuftHi: '#847898',
    path: '#a89ab0', pathHi: '#bcaec4', pathLo: '#8c7e98', edge: '#645870', edgeDark: '#443c50',
    frame: '#241e34',
  },
  vulkan: {
    grass: '#8a544a', grassDark: '#7c483e', tuft: '#5e342c', tuftHi: '#a06a58',
    path: '#c09068', pathHi: '#d4a87c', pathLo: '#a87850', edge: '#7c5638', edgeDark: '#543822',
    frame: '#38160e',
  },
};

// ---------- Pixel-Art-Props (Strings → Pixel) ----------
// Gemeinsame Farbcodes: sh = Schatten. '.' = transparent.
const PROPS = {
  baum: {
    colors: { D: '#1e5c28', G: '#2f7d3a', L: '#48a050', H: '#63bd68', T: '#6e4a28', t: '#8a6238', s: 'rgba(0,0,0,0.25)' },
    frames: [[
      '......DDDD......',
      '....DDGGGGDD....',
      '...DGGLGLGGGD...',
      '..DGLGHLLGLGGD..',
      '..DGGLLHLGGGGD..',
      '.DGGLHLLGLGLGGD.',
      '.DGLGLGHLGGGGGD.',
      '.DGGGLLLHLGLGGD.',
      '..DGLGHLGGLGGD..',
      '..DGGGLLGGGGGD..',
      '...DDGGLGGGDD...',
      '.....DDGGDD.....',
      '.......TT.......',
      '......tTTt......',
      '......TTTT......',
      '....ssssssss....',
    ]],
  },
  busch: {
    colors: { D: '#26702f', G: '#3a9046', L: '#55ac5c', H: '#74c878', s: 'rgba(0,0,0,0.22)' },
    frames: [[
      '................',
      '................',
      '................',
      '................',
      '.....DDDD.......',
      '...DDGLGGDD.....',
      '..DGLHLGLGGDD...',
      '.DGGLLGHLGLGGD..',
      '.DGLGHGLLGGLGD..',
      '.DGGLLGGHLGGGD..',
      '..DGGGLLGGGGD...',
      '...DDGGGGGDD....',
      '....ssssssss....',
      '................',
      '................',
      '................',
    ]],
  },
  blume: {
    colors: { R: '#e85858', Y: '#f8d048', W: '#f8f8f8', G: '#3f9838', P: '#f088a8' },
    frames: [[
      '................',
      '................',
      '..RR............',
      '.RYYR.......WW..',
      '..RR.......WYYW.',
      '....G.......WW..',
      '....G....G......',
      '.........G......',
      '..........PP....',
      '...WW....PYYP...',
      '..WYYW....PP....',
      '...WW......G....',
      '....G......G....',
      '....G...........',
      '................',
      '................',
    ], [
      '................',
      '................',
      '................',
      '..RR........WW..',
      '.RYYR......WYYW.',
      '..RRG.......WWG.',
      '....G....G..G...',
      '.........G......',
      '..........PP....',
      '...WW....PYYP...',
      '..WYYW....PPG...',
      '...WWG......G...',
      '....G...........',
      '................',
      '................',
      '................',
    ]],
  },
  stein: {
    colors: { D: '#6a6258', G: '#8c8478', L: '#a89f90', H: '#c0b8a8', s: 'rgba(0,0,0,0.22)' },
    frames: [[
      '................',
      '................',
      '................',
      '................',
      '................',
      '......DDDD......',
      '....DDGLLGD.....',
      '...DGLHHLGGD....',
      '...DGLHLGGGD....',
      '..DGGLLGGGDD....',
      '..DGGGGGGDD.....',
      '...DDDDDDD......',
      '....ssssss......',
      '................',
      '................',
      '................',
    ]],
  },
  fels: {
    colors: { D: '#4a4258', G: '#6a6178', L: '#847a94', H: '#a098b0', s: 'rgba(0,0,0,0.25)' },
    frames: [[
      '................',
      '......DDD.......',
      '.....DGLGD......',
      '....DGLHLGD.....',
      '...DGLHHLGGD....',
      '..DGGLHLLGGGD...',
      '..DGLLHLGGGGD...',
      '.DGGLHLGGGDGGD..',
      '.DGGLLGGGGGGGD..',
      '.DGGGGGGDGGGGD..',
      '.DGGGGGDDGGGDD..',
      '..DDGGGGGGDDD...',
      '...DDDDDDDDD....',
      '...sssssssss....',
      '................',
      '................',
    ]],
  },
  pilz: {
    colors: { R: '#d04838', H: '#e86858', W: '#f0e8d8', D: '#b0a890', s: 'rgba(0,0,0,0.2)' },
    frames: [[
      '................',
      '................',
      '................',
      '................',
      '.....RRRRR......',
      '....RHWRRHR.....',
      '...RRHRRWRRR....',
      '...RRRWRRRRR....',
      '....WWWWWWW.....',
      '......WWD.......',
      '......WWD.......',
      '.....WWWDD......',
      '.....ssssss.....',
      '................',
      '................',
      '................',
    ]],
  },
  kristall: {
    colors: { D: '#4878b8', C: '#68a8e8', L: '#98d0f8', H: '#d8f0ff', s: 'rgba(0,0,0,0.25)' },
    frames: [[
      '................',
      '.......C........',
      '......CLC.......',
      '......CLHC......',
      '.....CLHLC......',
      '.....DCLLCD.....',
      '....DCLHLCD.....',
      '..C.DCLLLCD.....',
      '.CLC.DCLCD..C...',
      '.CLHC.DCD..CLC..',
      '..CC.DCLCD.CHC..',
      '.....DCCCD..C...',
      '......DDD.......',
      '....sssssss.....',
      '................',
      '................',
    ], [
      '................',
      '.......C........',
      '......CHC.......',
      '......CHLC......',
      '.....CLHHC......',
      '.....DCHLCD.....',
      '....DCLHHCD.....',
      '..C.DCLHLCD.....',
      '.CHC.DCLCD..C...',
      '.CLHC.DCD..CHC..',
      '..CC.DCHCD.CLC..',
      '.....DCCCD..C...',
      '......DDD.......',
      '....sssssss.....',
      '................',
      '................',
    ]],
  },
  schilf: {
    colors: { G: '#2a8848', L: '#48ac60', H: '#70c888', B: '#b09050' },
    frames: [[
      '................',
      '......L....H....',
      '..H...L...L.....',
      '..L..HL...L..L..',
      '..L..L.L..H..L..',
      '...L.L.L.L...H..',
      '...L..LL.L..L...',
      '....L.LL...L....',
      '.....BLLB.L.....',
      '.....BBLBB......',
      '......BBB.......',
      '................',
      '................',
      '................',
      '................',
      '................',
    ]],
  },
  wasser: {
    colors: { D: '#2860a8', B: '#3878c8', L: '#58a0e8', H: '#a8d8f8', E: '#c8b078' },
    frames: [[
      '................',
      '....EEEEEEEE....',
      '..EEBBBBBBBBEE..',
      '.EBBLBBBBBLBBE..',
      '.EBLHLBBBBBBBE..',
      'EBBBLBBBLBBBBBE.',
      'EBBBBBBLHLBBBBE.',
      'EBBLBBBBLBBBLBE.',
      'EBLHLBBBBBBLHLE.',
      '.EBLBBBLBBBBLE..',
      '.EBBBBLHLBBBBE..',
      '..EEBBBLBBBEE...',
      '....EEEEEEEE....',
      '................',
      '................',
      '................',
    ], [
      '................',
      '....EEEEEEEE....',
      '..EEBBBBBBBBEE..',
      '.EBBBBBLBBBBBE..',
      '.EBBLBLHLBBLBE..',
      'EBBLHLBLBBLHLBE.',
      'EBBBLBBBBBBLBBE.',
      'EBBBBBBBBBBBBBE.',
      'EBBLBBBBLBBBBBE.',
      '.EBHLBBLHLBBLE..',
      '.EBLBBBBLBBHLE..',
      '..EEBBBBBBBEE...',
      '....EEEEEEEE....',
      '................',
      '................',
    ]],
  },
  lava: {
    colors: { D: '#3a1410', C: '#5a241a', O: '#f06028', Y: '#f8a038', H: '#ffd868' },
    frames: [[
      '................',
      '....DDDDDDDD....',
      '..DDCOOOOOOCDD..',
      '.DCOOYOOOOYOOCD.',
      '.DCOYHYOOOOOOCD.',
      'DCOOOYOOOYOOOOCD',
      'DCOOOOOYYHYOOOCD',
      'DCOOYOOOOYOOOOCD',
      'DCOYHYOOOOOYOOCD',
      '.DCOYOOOYOOOOCD.',
      '.DCOOOOYHYOOOCD.',
      '..DDCOOOYOOCDD..',
      '....DDDDDDDD....',
      '................',
      '................',
      '................',
    ], [
      '................',
      '....DDDDDDDD....',
      '..DDCOOOOOOCDD..',
      '.DCOOOOYOOOOOCD.',
      '.DCOOOYHYOOYOCD.',
      'DCOOYOOYOOYHYOCD',
      'DCOYHYOOOOOYOOCD',
      'DCOOYOOOOOOOOOCD',
      'DCOOOOOYOOOOYOCD',
      '.DCOOOYHYOOOOCD.',
      '.DCOOOOYOOYOOCD.',
      '..DDCOOOOOOCDD..',
      '....DDDDDDDD....',
      '................',
      '................',
    ]],
  },
  stalagmit: {
    colors: { D: '#443c50', G: '#645874', L: '#847a94', H: '#a89ec0', s: 'rgba(0,0,0,0.25)' },
    frames: [[
      '................',
      '................',
      '.......DD.......',
      '......DHLD......',
      '......DLGD......',
      '.....DGLLGD.....',
      '.....DLGGD......',
      '....DGLLGGD.....',
      '....DGLGGGD..D..',
      '...DGLLGGGD.DLD.',
      '...DGLGGGGDDGLD.',
      '..DGGLGGGDGDGGD.',
      '..DGGGGGGGGGGD..',
      '..ssssssssssss..',
      '................',
      '................',
    ]],
  },
  hoehlenloch: {
    colors: { B: '#0e0c16', D: '#241e34', G: '#645874', L: '#847a94' },
    frames: [[
      '................',
      '................',
      '....GGGGGGGG....',
      '..GGLDDDDDDLGG..',
      '.GLDDBBBBBBDDLG.',
      '.GDBBBBBBBBBBDG.',
      'GLDBBBBBBBBBBDLG',
      'GDBBBBBBBBBBBBDG',
      'GDBBBBBBBBBBBBDG',
      'GDBBBBBBBBBBBBDG',
      'GGDBBBBBBBBBBDGG',
      '.GGDDBBBBBBDDGG.',
      '...GGDDDDDDGG...',
      '................',
      '................',
      '................',
    ]],
  },
  ziel: {
    colors: { R: '#e04838', W: '#f4f4f4', D: '#16161f', G: '#c8c8d0', s: 'rgba(0,0,0,0.25)' },
    frames: [[
      '......D.........',
      '......DRRRR.....',
      '......DRRRRRR...',
      '......DRRRR.....',
      '......DRR.......',
      '......D.........',
      '......D.........',
      '......D.........',
      '....DDDDDD......',
      '..DDWWWWWWDD....',
      '.DWWRRRRRRWWD...',
      '.DWRRRDDRRRWD...',
      '.DWWWDWWDWWWD...',
      '..DDWWWWWWDD....',
      '....DDDDDD......',
      '...ssssssss.....',
    ]],
  },
};

const propCache = new Map();
function propCanvas(kind, frame) {
  const key = kind + ':' + frame;
  if (!propCache.has(key)) {
    const def = PROPS[kind];
    const rows = def.frames[Math.min(frame, def.frames.length - 1)];
    const cv = document.createElement('canvas');
    cv.width = rows[0].length; cv.height = rows.length;
    const g = cv.getContext('2d');
    for (let y = 0; y < rows.length; y++) {
      for (let x = 0; x < rows[y].length; x++) {
        const ch = rows[y][x];
        if (ch === '.') continue;
        g.fillStyle = def.colors[ch] || '#f0f';
        g.fillRect(x, y, 1, 1);
      }
    }
    propCache.set(key, cv);
  }
  return propCache.get(key);
}

// Deko-Art der Session → Prop-Art
const DECO_PROP = {
  baum: 'baum', busch: 'busch', blume: 'blume', stein: 'stein', fels: 'fels',
  pilz: 'pilz', kristall: 'kristall', schilf: 'schilf', wasser: 'wasser',
  lava: 'lava',
};
// In der Höhle sehen "Felsen" wie Stalagmiten aus
const BIOME_PROP_OVERRIDE = { hoehle: { fels: 'stalagmit' } };

// ---------- Boden-Tiles ----------
function drawGrassTile(g, c, r, pal, rng) {
  // Rasen-Streifen wie gemähtes Pokémon-Gras
  g.fillStyle = r % 2 === 0 ? pal.grass : pal.grassDark;
  g.fillRect(c * S, r * S, S, S);
  // kleine Grasbüschel-Pixel
  const n = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i++) {
    const x = c * S + 1 + Math.floor(rng() * (S - 3));
    const y = r * S + 1 + Math.floor(rng() * (S - 3));
    if (rng() < 0.6) {
      g.fillStyle = pal.tuft;
      g.fillRect(x, y, 1, 1);
      g.fillRect(x + 2, y, 1, 1);
      g.fillRect(x + 1, y + 1, 1, 1);
    } else {
      g.fillStyle = pal.tuftHi;
      g.fillRect(x, y, 1, 1);
    }
  }
}

// Pfad-Autotiling: Kanten & runde Ecken je nach Nachbarn
function drawPathTile(g, c, r, pal, has, rng) {
  const x0 = c * S, y0 = r * S;
  const N = has(c, r - 1), E = has(c + 1, r), Sd = has(c, r + 1), Wd = has(c - 1, r);
  const NE = has(c + 1, r - 1), NW = has(c - 1, r - 1), SE = has(c + 1, r + 1), SW = has(c - 1, r + 1);

  g.fillStyle = pal.path;
  g.fillRect(x0, y0, S, S);

  // Sand-Textur
  for (let i = 0; i < 4; i++) {
    g.fillStyle = rng() < 0.5 ? pal.pathHi : pal.pathLo;
    g.fillRect(x0 + 1 + Math.floor(rng() * (S - 2)), y0 + 1 + Math.floor(rng() * (S - 2)), 1, 1);
  }

  // Kanten (2px dunkel + 1px Übergang)
  const edge = (x, y, w, h) => { g.fillStyle = pal.edgeDark, g.fillRect(x, y, w, h); };
  const edge2 = (x, y, w, h) => { g.fillStyle = pal.edge, g.fillRect(x, y, w, h); };
  if (!N) { edge(x0, y0, S, 1); edge2(x0, y0 + 1, S, 1); }
  if (!Sd) { edge(x0, y0 + S - 1, S, 1); edge2(x0, y0 + S - 2, S, 1); }
  if (!Wd) { edge(x0, y0, 1, S); edge2(x0 + 1, y0, 1, S); }
  if (!E) { edge(x0 + S - 1, y0, 1, S); edge2(x0 + S - 2, y0, 1, S); }

  // Runde Außenecken: Eck-Pixel zurück zu Gras + diagonale Kante
  const roundCorner = (cx, cy, dx, dy) => {
    g.fillStyle = r % 2 === 0 ? pal.grass : pal.grassDark;
    g.fillRect(cx, cy, 3, 1);
    g.fillRect(cx, cy + dy, 2, 1);
    g.fillRect(cx, cy + 2 * dy, 1, 1);
    // Diagonale
    g.fillStyle = pal.edgeDark;
    g.fillRect(cx + 3 * dx >= 0 ? cx + 3 : cx, cy, 1, 1);
    g.fillRect(cx + (dx > 0 ? 3 : 0), cy, 1, 1);
    g.fillRect(cx + (dx > 0 ? 2 : 1), cy + dy, 1, 1);
    g.fillRect(cx + (dx > 0 ? 1 : 2), cy + 2 * dy, 1, 1);
    g.fillRect(cx + (dx > 0 ? 0 : 3), cy + 3 * dy >= 0 ? cy + 3 * dy : cy, 1, 1);
  };
  if (!N && !Wd) roundCorner(x0, y0, 1, 1);
  if (!N && !E) { // rechte obere Ecke: spiegeln
    g.fillStyle = r % 2 === 0 ? pal.grass : pal.grassDark;
    g.fillRect(x0 + S - 3, y0, 3, 1);
    g.fillRect(x0 + S - 2, y0 + 1, 2, 1);
    g.fillRect(x0 + S - 1, y0 + 2, 1, 1);
    g.fillStyle = pal.edgeDark;
    g.fillRect(x0 + S - 4, y0, 1, 1);
    g.fillRect(x0 + S - 3, y0 + 1, 1, 1);
    g.fillRect(x0 + S - 2, y0 + 2, 1, 1);
    g.fillRect(x0 + S - 1, y0 + 3, 1, 1);
  }
  if (!Sd && !Wd) {
    g.fillStyle = r % 2 === 0 ? pal.grass : pal.grassDark;
    g.fillRect(x0, y0 + S - 1, 3, 1);
    g.fillRect(x0, y0 + S - 2, 2, 1);
    g.fillRect(x0, y0 + S - 3, 1, 1);
    g.fillStyle = pal.edgeDark;
    g.fillRect(x0 + 3, y0 + S - 1, 1, 1);
    g.fillRect(x0 + 2, y0 + S - 2, 1, 1);
    g.fillRect(x0 + 1, y0 + S - 3, 1, 1);
    g.fillRect(x0, y0 + S - 4, 1, 1);
  }
  if (!Sd && !E) {
    g.fillStyle = r % 2 === 0 ? pal.grass : pal.grassDark;
    g.fillRect(x0 + S - 3, y0 + S - 1, 3, 1);
    g.fillRect(x0 + S - 2, y0 + S - 2, 2, 1);
    g.fillRect(x0 + S - 1, y0 + S - 3, 1, 1);
    g.fillStyle = pal.edgeDark;
    g.fillRect(x0 + S - 4, y0 + S - 1, 1, 1);
    g.fillRect(x0 + S - 3, y0 + S - 2, 1, 1);
    g.fillRect(x0 + S - 2, y0 + S - 3, 1, 1);
    g.fillRect(x0 + S - 1, y0 + S - 4, 1, 1);
  }

  // Innenecken (diagonal fehlt, orthogonal vorhanden)
  g.fillStyle = pal.edgeDark;
  if (N && Wd && !NW) g.fillRect(x0, y0, 2, 2);
  if (N && E && !NE) g.fillRect(x0 + S - 2, y0, 2, 2);
  if (Sd && Wd && !SW) g.fillRect(x0, y0 + S - 2, 2, 2);
  if (Sd && E && !SE) g.fillRect(x0 + S - 2, y0 + S - 2, 2, 2);
}

// ---------- Haupt-Renderer: 2 animierte Frames des Hintergrunds ----------
export function renderBackgroundFrames(session) {
  const pal = PALETTES[session.map.biome];
  const cells = new Set(pathCells(session.map.path).map(([c, r]) => c + ',' + r));
  const has = (c, r) => cells.has(c + ',' + r);
  const propOverride = BIOME_PROP_OVERRIDE[session.map.biome] || {};

  const frames = [];
  for (let f = 0; f < 2; f++) {
    const lo = document.createElement('canvas');
    lo.width = LW; lo.height = LH;
    const g = lo.getContext('2d');
    const rng = makeRng(session.run.seed + session.mapNo * 4243);

    // Boden
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) drawGrassTile(g, c, r, pal, rng);
    }
    // Pfad
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (has(c, r)) drawPathTile(g, c, r, pal, has, rng);
      }
    }

    // Spawn-Loch & Ziel
    const [sc, sr] = session.map.path[0];
    const [ec, er] = session.map.path[session.map.path.length - 1];
    g.drawImage(propCanvas('hoehlenloch', 0), sc * S, sr * S);
    g.drawImage(propCanvas('ziel', 0), ec * S, er * S - 4);

    // Deko-Props (nach Y sortiert für Überlappung)
    const deco = [...session.deco].sort((a, b) => a.r - b.r);
    for (const d of deco) {
      const kind = propOverride[d.kind] || DECO_PROP[d.kind];
      if (!kind || !PROPS[kind]) continue;
      const cv = propCanvas(kind, f);
      const px = d.c * S + Math.floor((S - cv.width) / 2);
      const py = d.r * S + (S - cv.height);
      g.drawImage(cv, px, py);
    }

    // Hochskalieren
    const out = document.createElement('canvas');
    out.width = W; out.height = H;
    const og = out.getContext('2d');
    og.imageSmoothingEnabled = false;
    og.drawImage(lo, 0, 0, W, H);
    frames.push(out);
  }
  return frames;
}
