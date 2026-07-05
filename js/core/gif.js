// Minimaler GIF89a-Decoder: dekodiert animierte GIFs zu einer Liste
// vorkomponierter Canvas-Frames (inkl. Disposal-Handling & Transparenz).
// Bewusst ohne externe Abhängigkeit gehalten.

function lzwDecode(minCodeSize, data, pixelCount) {
  const out = new Uint8Array(pixelCount);
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let dict = [];
  const resetDict = () => {
    dict = [];
    for (let i = 0; i < clearCode; i++) dict[i] = [i];
    dict[clearCode] = [];
    dict[eoiCode] = null;
    codeSize = minCodeSize + 1;
  };
  resetDict();

  let bitPos = 0, outPos = 0, prev = null;
  const readCode = () => {
    let code = 0;
    for (let i = 0; i < codeSize; i++) {
      const byte = data[bitPos >> 3];
      if (byte === undefined) return eoiCode;
      code |= ((byte >> (bitPos & 7)) & 1) << i;
      bitPos++;
    }
    return code;
  };

  while (outPos < pixelCount) {
    const code = readCode();
    if (code === clearCode) { resetDict(); prev = null; continue; }
    if (code === eoiCode) break;
    let entry;
    if (dict[code]) {
      entry = dict[code];
    } else if (code === dict.length && prev) {
      entry = prev.concat(prev[0]);
    } else {
      break; // korrupter Stream – abbrechen, Rest bleibt transparent
    }
    for (let i = 0; i < entry.length && outPos < pixelCount; i++) out[outPos++] = entry[i];
    if (prev) {
      dict.push(prev.concat(entry[0]));
      if (dict.length === (1 << codeSize) && codeSize < 12) codeSize++;
    }
    prev = entry;
  }
  return out;
}

export function decodeGif(buffer) {
  const b = new Uint8Array(buffer);
  let p = 0;
  const u16 = () => b[p++] | (b[p++] << 8);

  // Header
  if (String.fromCharCode(b[0], b[1], b[2]) !== 'GIF') throw new Error('Kein GIF');
  p = 6;
  const width = u16(), height = u16();
  const packed = b[p++];
  p += 2; // bg-Index, Aspect
  let gct = null;
  if (packed & 0x80) {
    const size = 2 << (packed & 7);
    gct = b.subarray(p, p + size * 3);
    p += size * 3;
  }

  const frames = [];
  // Kompositions-Puffer
  const comp = new Uint8ClampedArray(width * height * 4);
  let delay = 100, transIdx = -1, disposal = 0;

  const skipSubBlocks = () => { let n; while ((n = b[p++]) !== 0) p += n; };

  while (p < b.length) {
    const block = b[p++];
    if (block === 0x3B) break; // Trailer
    if (block === 0x21) { // Extension
      const label = b[p++];
      if (label === 0xF9) { // Graphics Control
        p++; // Blockgröße (4)
        const flags = b[p++];
        delay = u16() * 10 || 100;
        transIdx = (flags & 1) ? b[p++] : (p++, -1);
        disposal = (flags >> 2) & 7;
        p++; // Terminator
      } else {
        skipSubBlocks();
      }
    } else if (block === 0x2C) { // Image Descriptor
      const ix = u16(), iy = u16(), iw = u16(), ih = u16();
      const ipacked = b[p++];
      let lct = null;
      if (ipacked & 0x80) {
        const size = 2 << (ipacked & 7);
        lct = b.subarray(p, p + size * 3);
        p += size * 3;
      }
      const interlaced = !!(ipacked & 0x40);
      const palette = lct || gct;
      const minCodeSize = b[p++];
      // LZW-Datenblöcke einsammeln
      let total = 0; const chunks = [];
      let n;
      while ((n = b[p++]) !== 0) { chunks.push(b.subarray(p, p + n)); total += n; p += n; }
      const data = new Uint8Array(total);
      let off = 0;
      for (const c of chunks) { data.set(c, off); off += c.length; }
      const indices = lzwDecode(minCodeSize, data, iw * ih);

      // Vorherigen Zustand sichern (für Disposal 3)
      let backup = null;
      if (disposal === 3) backup = comp.slice();

      // Interlace-Zeilenreihenfolge
      let rows;
      if (interlaced) {
        rows = [];
        for (let y = 0; y < ih; y += 8) rows.push(y);
        for (let y = 4; y < ih; y += 8) rows.push(y);
        for (let y = 2; y < ih; y += 4) rows.push(y);
        for (let y = 1; y < ih; y += 2) rows.push(y);
      }

      for (let row = 0; row < ih; row++) {
        const y = interlaced ? rows[row] : row;
        for (let x = 0; x < iw; x++) {
          const idx = indices[row * iw + x];
          if (idx === transIdx) continue;
          const gx = ix + x, gy = iy + y;
          if (gx >= width || gy >= height) continue;
          const o = (gy * width + gx) * 4;
          comp[o] = palette[idx * 3];
          comp[o + 1] = palette[idx * 3 + 1];
          comp[o + 2] = palette[idx * 3 + 2];
          comp[o + 3] = 255;
        }
      }

      // Frame als Canvas snapshotten
      const cv = document.createElement('canvas');
      cv.width = width; cv.height = height;
      cv.getContext('2d').putImageData(new ImageData(comp.slice(), width, height), 0, 0);
      frames.push({ canvas: cv, delay });

      // Disposal für den nächsten Frame anwenden
      if (disposal === 2) {
        for (let y = iy; y < iy + ih && y < height; y++) {
          for (let x = ix; x < ix + iw && x < width; x++) {
            const o = (y * width + x) * 4;
            comp[o] = comp[o + 1] = comp[o + 2] = comp[o + 3] = 0;
          }
        }
      } else if (disposal === 3 && backup) {
        comp.set(backup);
      }
      transIdx = -1; disposal = 0;
    } else {
      break; // Unbekannter Block – aufhören
    }
  }

  return { width, height, frames };
}
