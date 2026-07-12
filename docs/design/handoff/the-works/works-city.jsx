/* works-city.jsx — "The Works": a data-driven isometric yard plan of the
   foundry's repos. One building per repo; storeys from √(lines × sessions)
   (or lines / sessions via heightMetric); lit windows from output share;
   smoke = active; pennants = PRs merged (weekly). Drawn as a technical
   illustration: hairline ink, hatched shade faces, engineering furniture.
   All paint comes from House DS custom properties, so it themes itself.

   window.FoundryWorks = { City }
   Props: repos (array), variant "yard"|"strip", night, motion, dressing,
          heightMetric "blend"|"lines"|"sessions", labelWidth
*/

const { useState, useMemo } = React;

/* ---------- palette (all via DS vars so light/dark just works) ---------- */
const C = {
  ink: 'var(--ds-text-2)',
  inkStrong: 'var(--ds-text)',
  inkSoft: 'var(--ds-text-3)',
  inkFaint: 'var(--ds-text-faint)',
  hair: 'var(--ds-line)',
  hairS: 'var(--ds-line-strong)',
  paper: 'var(--ds-surface)',
  paper2: 'var(--ds-surface-2)',
  plate: 'color-mix(in srgb, var(--ds-surface-2) 62%, var(--ds-surface))',
  plateEdge: 'color-mix(in srgb, var(--ds-text) 10%, var(--ds-surface-2))',
  shade: 'color-mix(in srgb, var(--ds-text) 13%, var(--ds-surface-2))',
  glass: 'color-mix(in srgb, var(--ds-text) 20%, var(--ds-surface-2))',
  winOff: 'color-mix(in srgb, var(--ds-text) 24%, var(--ds-surface-2))',
  accent: 'var(--ds-accent)',
  accentH: 'var(--ds-accent-hover)',
  gold: 'var(--ds-secondary)',
  mono: 'var(--ds-font-mono)',
  serif: 'var(--ds-font-display)',
};
const HAIR = 0.7, LINE = 1.05;

/* ---------- iso helpers ---------- */
function makeProj(S, ox, oy) {
  const cx = Math.cos(Math.PI / 6) * S, cy = Math.sin(Math.PI / 6) * S;
  return (x, y, z = 0) => [ox + (x - y) * cx, oy + (x + y) * cy - z * S];
}
const pl = (a) => a.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
function seeded(seedStr) {
  let s = 7;
  for (let i = 0; i < seedStr.length; i++) s = (s * 31 + seedStr.charCodeAt(i)) >>> 0;
  return () => { s = (s * 1103515245 + 12345) >>> 0; return (s >>> 8) / 16777216; };
}
const fmtK = (n) => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e4 ? Math.round(n / 1e3) + 'k' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(n);

/* ---------- tiny paint primitives ---------- */
function Po({ p, f = 'none', s = C.ink, w = HAIR, o, dash, k }) {
  return React.createElement('polygon', { key: k, points: p, style: { fill: f, stroke: s, opacity: o }, strokeWidth: w, strokeDasharray: dash, strokeLinejoin: 'round' });
}
function Ln({ a, b, s = C.ink, w = HAIR, o, dash, k }) {
  return React.createElement('line', { key: k, x1: a[0], y1: a[1], x2: b[0], y2: b[1], style: { stroke: s, opacity: o }, strokeWidth: w, strokeDasharray: dash, strokeLinecap: 'round' });
}
function Tx({ x, y, t, size = 9, fill = C.inkSoft, w = 500, ls = '0.08em', anchor = 'start', font = C.mono, italic, k }) {
  return React.createElement('text', { key: k, x, y, textAnchor: anchor, style: { fill, fontFamily: font, fontSize: size, fontWeight: w, letterSpacing: ls, fontStyle: italic ? 'italic' : 'normal' } }, t);
}

/* ---------- geometry pieces (each returns an array of elements) ---------- */

function ground(P, x, y, w, d, h, opts = {}) {
  // extruded district slab with survey grid
  const els = [];
  const t = 0.14;
  els.push(Po({ k: 'gt', p: pl([P(x, y, 0), P(x + w, y, 0), P(x + w, y + d, 0), P(x, y + d, 0)]), f: C.plate, s: C.hairS, w: HAIR }));
  els.push(Po({ k: 'ge1', p: pl([P(x, y + d, 0), P(x + w, y + d, 0), P(x + w, y + d, -t), P(x, y + d, -t)]), f: C.plateEdge, s: C.hairS, w: HAIR }));
  els.push(Po({ k: 'ge2', p: pl([P(x + w, y, 0), P(x + w, y + d, 0), P(x + w, y + d, -t), P(x + w, y, -t)]), f: C.paper2, s: C.hairS, w: HAIR }));
  if (!opts.noGrid) {
    for (let i = 1; i < w; i++) els.push(Ln({ k: 'gx' + i, a: P(x + i, y, 0), b: P(x + i, y + d, 0), s: C.hair, w: 0.5, o: 0.75 }));
    for (let j = 1; j < d; j++) els.push(Ln({ k: 'gy' + j, a: P(x, y + j, 0), b: P(x + w, y + j, 0), s: C.hair, w: 0.5, o: 0.75 }));
  }
  return els;
}

function shadowOf(P, x, y, w, d, h) {
  const k = Math.min(0.5, 0.14 + h * 0.055);
  return Po({ k: 'sh', p: pl([P(x + w, y, 0), P(x + w, y + d, 0), P(x + w + h * k, y + d + h * k * 0.4, 0), P(x + w + h * k, y + h * k * 0.4, 0)]), f: 'var(--ds-text)', s: 'none', o: 0.055 });
}

function boxWalls(P, x, y, w, d, h, z0 = 0, hatchId) {
  const els = [];
  // SW face (y+d) — shade + hatch
  const fy = [P(x, y + d, z0), P(x + w, y + d, z0), P(x + w, y + d, z0 + h), P(x, y + d, z0 + h)];
  els.push(Po({ k: 'fy', p: pl(fy), f: C.shade, s: C.ink, w: HAIR }));
  if (hatchId) els.push(Po({ k: 'fyh', p: pl(fy), f: `url(#${hatchId})`, s: 'none' }));
  // SE face (x+w) — light
  const fx = [P(x + w, y, z0), P(x + w, y + d, z0), P(x + w, y + d, z0 + h), P(x + w, y, z0 + h)];
  els.push(Po({ k: 'fx', p: pl(fx), f: C.paper2, s: C.ink, w: HAIR }));
  // plinth lines
  els.push(Ln({ k: 'pl1', a: P(x + w, y, z0 + 0.22), b: P(x + w, y + d, z0 + 0.22), s: C.hairS, w: 0.5 }));
  els.push(Ln({ k: 'pl2', a: P(x, y + d, z0 + 0.22), b: P(x + w, y + d, z0 + 0.22), s: C.hairS, w: 0.5, o: 0.7 }));
  return els;
}

function flatTop(P, x, y, w, d, z) {
  return [
    Po({ k: 'top', p: pl([P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)]), f: C.paper, s: C.ink, w: HAIR }),
    // parapet inner line
    Po({ k: 'par', p: pl([P(x + 0.12, y + 0.12, z), P(x + w - 0.12, y + 0.12, z), P(x + w - 0.12, y + d - 0.12, z), P(x + 0.12, y + d - 0.12, z)]), f: 'none', s: C.hair, w: 0.5 }),
  ];
}

// gable roof, ridge along given axis
function gableRoof(P, x, y, w, d, z, r, axis, hatchId) {
  const els = [];
  if (axis === 'y') {
    const xr = x + w / 2;
    els.push(Po({ k: 'rB', p: pl([P(x, y, z), P(x, y + d, z), P(xr, y + d, z + r), P(xr, y, z + r)]), f: C.paper, s: C.ink, w: HAIR }));
    els.push(Po({ k: 'rA', p: pl([P(x + w, y, z), P(x + w, y + d, z), P(xr, y + d, z + r), P(xr, y, z + r)]), f: C.paper2, s: C.ink, w: HAIR }));
    const tri = [P(x, y + d, z), P(x + w, y + d, z), P(xr, y + d, z + r)];
    els.push(Po({ k: 'rT', p: pl(tri), f: C.shade, s: C.ink, w: HAIR }));
    if (hatchId) els.push(Po({ k: 'rTh', p: pl(tri), f: `url(#${hatchId})`, s: 'none' }));
    els.push(Ln({ k: 'ridge', a: P(xr, y, z + r), b: P(xr, y + d, z + r), s: C.inkStrong, w: LINE }));
  } else {
    const yr = y + d / 2;
    els.push(Po({ k: 'rB', p: pl([P(x, y, z), P(x + w, y, z), P(x + w, yr, z + r), P(x, yr, z + r)]), f: C.paper, s: C.ink, w: HAIR }));
    els.push(Po({ k: 'rA', p: pl([P(x, y + d, z), P(x + w, y + d, z), P(x + w, yr, z + r), P(x, yr, z + r)]), f: C.paper2, s: C.ink, w: HAIR }));
    els.push(Po({ k: 'rT', p: pl([P(x + w, y, z), P(x + w, y + d, z), P(x + w, yr, z + r)]), f: C.paper2, s: C.ink, w: HAIR }));
    els.push(Ln({ k: 'ridge', a: P(x, yr, z + r), b: P(x + w, yr, z + r), s: C.inkStrong, w: LINE }));
  }
  return els;
}

// sawtooth roof, teeth along x, glazing faces +x
function sawtoothRoof(P, x, y, w, d, z, r, teeth, hatchId, glassId, litGlass) {
  const els = [];
  const tw = w / teeth;
  for (let i = 0; i < teeth; i++) {
    const xa = x + i * tw, xb = xa + tw;
    els.push(Po({ k: 'sl' + i, p: pl([P(xa, y, z), P(xa, y + d, z), P(xb, y + d, z + r), P(xb, y, z + r)]), f: C.paper, s: C.ink, w: HAIR }));
    const gl = [P(xb, y, z), P(xb, y + d, z), P(xb, y + d, z + r), P(xb, y, z + r)];
    els.push(Po({ k: 'gl' + i, p: pl(gl), f: litGlass ? 'color-mix(in srgb, var(--ds-secondary) 32%, var(--ds-surface-2))' : C.glass, s: C.ink, w: HAIR }));
    if (glassId) els.push(Po({ k: 'glh' + i, p: pl(gl), f: `url(#${glassId})`, s: 'none' }));
    const tri = [P(xa, y + d, z), P(xb, y + d, z), P(xb, y + d, z + r)];
    els.push(Po({ k: 'st' + i, p: pl(tri), f: C.shade, s: C.ink, w: HAIR }));
    if (hatchId) els.push(Po({ k: 'sth' + i, p: pl(tri), f: `url(#${hatchId})`, s: 'none' }));
  }
  return els;
}

// clerestory monitor: flat roof + raised lit box with tiny gable
function monitorRoof(P, x, y, w, d, z, night, hatchId) {
  const els = [...flatTop(P, x, y, w, d, z)];
  const mx = x + w * 0.2, my = y + d * 0.24, mw = w * 0.6, md = d * 0.52, mh = 0.34;
  els.push(...boxWalls(P, mx, my, mw, md, mh, z, null));
  // clerestory strip on light face
  const stripY = [P(mx + mw, my + 0.06, z + 0.08), P(mx + mw, my + md - 0.06, z + 0.08), P(mx + mw, my + md - 0.06, z + mh - 0.07), P(mx + mw, my + 0.06, z + mh - 0.07)];
  els.push(Po({ k: 'cl', p: pl(stripY), f: night ? C.gold : 'color-mix(in srgb, var(--ds-accent) 55%, var(--ds-surface-2))', s: C.ink, w: 0.5, o: 0.95 }));
  els.push(...gableRoof(P, mx, my, mw, md, z + mh, 0.22, 'y', hatchId));
  return els;
}

function chimney(P, x, y, hs, hatchId) {
  const w = 0.34;
  const els = [];
  els.push(...boxWalls(P, x, y, w, w, hs, 0, hatchId));
  els.push(...boxWalls(P, x - 0.05, y - 0.05, w + 0.1, w + 0.1, 0.16, hs, null));
  els.push(Po({ k: 'cap', p: pl([P(x - 0.05, y - 0.05, hs + 0.16), P(x + w + 0.05, y - 0.05, hs + 0.16), P(x + w + 0.05, y + w + 0.05, hs + 0.16), P(x - 0.05, y + w + 0.05, hs + 0.16)]), f: C.paper, s: C.ink, w: HAIR }));
  els.push(Po({ k: 'mouth', p: pl([P(x + 0.04, y + 0.04, hs + 0.161), P(x + w - 0.04, y + 0.04, hs + 0.161), P(x + w - 0.04, y + w - 0.04, hs + 0.161), P(x + 0.04, y + w - 0.04, hs + 0.161)]), f: 'var(--ds-text)', s: 'none', o: 0.55 }));
  for (const bz of [0.34, 0.67]) {
    els.push(Ln({ k: 'b1' + bz, a: P(x + w, y, hs * bz), b: P(x + w, y + w, hs * bz), s: C.hairS, w: 0.5 }));
    els.push(Ln({ k: 'b2' + bz, a: P(x, y + w, hs * bz), b: P(x + w, y + w, hs * bz), s: C.hairS, w: 0.5 }));
  }
  return els;
}

function smoke(P, x, y, z, i0, motion, night) {
  const [sx, sy] = P(x, y, z);
  const puff = (dx, dy, r, k) => React.createElement('circle', { key: k, cx: sx + dx, cy: sy + dy, r, style: { fill: 'none', stroke: night ? C.inkSoft : C.inkFaint } , strokeWidth: 0.8 });
  const cluster = (idx) => React.createElement('g', {
    key: 'p' + idx,
    className: 'fyw-puff',
    style: {
      transformOrigin: `${sx}px ${sy}px`,
      animation: motion ? `fywPuff ${8 + idx * 2.6}s ${(i0 + idx) * 2.4}s linear infinite` : 'none',
      opacity: motion ? 0 : (idx === 0 ? 0.55 : 0),
    },
  }, [puff(0, -2, 2.6, 'a'), puff(3.4, -4.4, 1.9, 'b'), puff(-2.6, -5, 1.5, 'c')]);
  return [cluster(0), cluster(1), cluster(2)];
}

// windows on a vertical plane. plane: 'x' fixed x, span across y; 'y' fixed y, span across x
function windows(P, plane, fixed, from, to, zBase, storeys, litFrac, seed, night, glowAcc) {
  const els = [];
  const rnd = seeded(seed);
  const sh = 0.6, ww = 0.26, step = 0.46, m0 = 0.24;
  const len = to - from - m0 * 2;
  const n = Math.max(1, Math.floor(len / step));
  for (let s = 0; s < storeys; s++) {
    const z0 = zBase + 0.34 + s * sh, z1 = z0 + 0.28;
    for (let i = 0; i < n; i++) {
      const a = from + m0 + i * step + (step - ww) / 2, b = a + ww;
      const q = plane === 'x'
        ? [P(fixed, a, z0), P(fixed, b, z0), P(fixed, b, z1), P(fixed, a, z1)]
        : [P(a, fixed, z0), P(b, fixed, z0), P(b, fixed, z1), P(a, fixed, z1)];
      const lit = rnd() < litFrac;
      if (lit && night) {
        const cx = (q[0][0] + q[2][0]) / 2, cy = (q[0][1] + q[2][1]) / 2;
        glowAcc.push(React.createElement('circle', { key: seed + s + '-' + i + 'g', cx, cy, r: 6.5, style: { fill: C.gold, opacity: 0.13 } }));
      }
      els.push(Po({
        k: seed + s + '-' + i,
        p: pl(q),
        f: lit ? (night ? C.gold : C.accent) : C.winOff,
        s: lit ? 'none' : 'color-mix(in srgb, var(--ds-text) 30%, transparent)',
        w: 0.4,
        o: lit ? (night ? 0.98 : 0.88) : 0.9,
      }));
    }
  }
  return els;
}

function pennants(P, x0, y0, x1, y1, z, count) {
  const els = [];
  const n = Math.min(count, 6);
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const px = x0 + (x1 - x0) * t, py = y0 + (y1 - y0) * t;
    const base = P(px, py, z), top = P(px, py, z + 0.42);
    els.push(Ln({ k: 'fp' + i, a: base, b: top, s: C.ink, w: 0.6 }));
    els.push(Po({ k: 'ff' + i, p: pl([top, [top[0] + 7.5, top[1] + 2.2], [top[0], top[1] + 4.6]]), f: C.accent, s: 'none', o: 0.95 }));
  }
  return els;
}

function ingotStack(P, x, y, rows, glowTop, night) {
  const els = [];
  const iw = 0.46, id = 0.24, ih = 0.15;
  let total = 0;
  rows.forEach((cnt) => { total += cnt; });
  let placed = 0;
  rows.forEach((cnt, layer) => {
    for (let i = 0; i < cnt; i++) {
      placed++;
      const gx = x + layer * 0.12, gy = y + i * (id + 0.07) + layer * 0.11, gz = layer * ih;
      const isTop = glowTop && placed === total;
      els.push(...boxWalls(P, gx, gy, iw, id, ih, gz, null));
      els.push(Po({
        k: 'it' + layer + '-' + i,
        p: pl([P(gx, gy, gz + ih), P(gx + iw, gy, gz + ih), P(gx + iw, gy + id, gz + ih), P(gx, gy + id, gz + ih)]),
        f: isTop ? C.gold : C.paper, s: C.ink, w: HAIR, o: isTop ? 0.95 : 1,
      }));
      if (isTop && night) {
        const c = P(gx + iw / 2, gy + id / 2, gz + ih);
        els.push(React.createElement('circle', { key: 'ig' + layer + i, cx: c[0], cy: c[1], r: 9, style: { fill: C.gold, opacity: 0.16 } }));
      }
    }
  });
  return els;
}

function rail(P, x0, x1, y) {
  const els = [];
  for (let sx = x0; sx < x1; sx += 0.55) {
    els.push(Ln({ k: 'sl' + sx.toFixed(1), a: P(sx, y - 0.09, 0), b: P(sx, y + 0.35, 0), s: C.hairS, w: 0.7, o: 0.65 }));
  }
  els.push(Ln({ k: 'r1', a: P(x0, y, 0), b: P(x1, y, 0), s: C.inkSoft, w: 0.9 }));
  els.push(Ln({ k: 'r2', a: P(x0, y + 0.26, 0), b: P(x1, y + 0.26, 0), s: C.inkSoft, w: 0.9 }));
  // buffer stop
  els.push(Ln({ k: 'bs1', a: P(x1, y - 0.12, 0), b: P(x1, y + 0.38, 0), s: C.ink, w: 1.4 }));
  els.push(Ln({ k: 'bs2', a: P(x1 - 0.22, y + 0.13, 0.22), b: P(x1, y + 0.13, 0), s: C.ink, w: 0.9 }));
  return els;
}

function flatcar(P, x, y, night) {
  const els = [];
  els.push(...boxWalls(P, x, y - 0.12, 1.3, 0.5, 0.2, 0.12, null));
  els.push(Po({ k: 'fc', p: pl([P(x, y - 0.12, 0.32), P(x + 1.3, y - 0.12, 0.32), P(x + 1.3, y + 0.38, 0.32), P(x, y + 0.38, 0.32)]), f: C.paper, s: C.ink, w: HAIR }));
  const w1 = P(x + 0.3, y + 0.38, 0.06), w2 = P(x + 1.0, y + 0.38, 0.06);
  els.push(React.createElement('circle', { key: 'w1', cx: w1[0], cy: w1[1], r: 2.2, style: { fill: 'none', stroke: C.ink }, strokeWidth: 0.7 }));
  els.push(React.createElement('circle', { key: 'w2', cx: w2[0], cy: w2[1], r: 2.2, style: { fill: 'none', stroke: C.ink }, strokeWidth: 0.7 }));
  els.push(...ingotStack(P, x + 0.18, y - 0.02, [2], true, night));
  return els;
}

function gantryCrane(P, x0, y0, x1, y1, h, night) {
  const els = [];
  const leg = (lx, ly) => {
    els.push(Ln({ k: 'lg' + lx + ly, a: P(lx, ly, 0), b: P(lx, ly, h), s: C.ink, w: 0.9 }));
  };
  leg(x0, y0); leg(x0, y1); leg(x1, y0); leg(x1, y1);
  // braces
  els.push(Ln({ k: 'br1', a: P(x0, y0, 0), b: P(x0, y1, h * 0.55), s: C.hairS, w: 0.5 }));
  els.push(Ln({ k: 'br2', a: P(x0, y1, 0), b: P(x0, y0, h * 0.55), s: C.hairS, w: 0.5 }));
  els.push(Ln({ k: 'br3', a: P(x1, y0, 0), b: P(x1, y1, h * 0.55), s: C.hairS, w: 0.5 }));
  els.push(Ln({ k: 'br4', a: P(x1, y1, 0), b: P(x1, y0, h * 0.55), s: C.hairS, w: 0.5 }));
  // top rails + girder
  els.push(Ln({ k: 'tr1', a: P(x0, y0, h), b: P(x1, y0, h), s: C.ink, w: 1.2 }));
  els.push(Ln({ k: 'tr2', a: P(x0, y1, h), b: P(x1, y1, h), s: C.ink, w: 1.2 }));
  const xg = x0 + (x1 - x0) * 0.6;
  els.push(Ln({ k: 'gird', a: P(xg, y0, h), b: P(xg, y1, h), s: C.inkStrong, w: 1.6 }));
  // trolley + cable + hook + hanging ingot
  const ym = y0 + (y1 - y0) * 0.42;
  const tr = P(xg, ym, h);
  els.push(React.createElement('rect', { key: 'trl', x: tr[0] - 3, y: tr[1] - 2.4, width: 6, height: 4.4, style: { fill: C.paper2, stroke: C.ink }, strokeWidth: 0.7 }));
  els.push(Ln({ k: 'cab', a: P(xg, ym, h - 0.06), b: P(xg, ym, 0.78), s: C.inkSoft, w: 0.6 }));
  const hk = P(xg, ym, 0.78);
  els.push(React.createElement('path', { key: 'hook', d: `M ${hk[0]} ${hk[1]} q 3 3 0 5 q -2.4 1.6 -3.4 -0.6`, style: { fill: 'none', stroke: C.ink }, strokeWidth: 0.8 }));
  els.push(...boxWalls(P, xg - 0.23, ym - 0.12, 0.46, 0.24, 0.15, 0.44, null));
  els.push(Po({ k: 'hi', p: pl([P(xg - 0.23, ym - 0.12, 0.59), P(xg + 0.23, ym - 0.12, 0.59), P(xg + 0.23, ym + 0.12, 0.59), P(xg - 0.23, ym + 0.12, 0.59)]), f: night ? C.gold : C.paper, s: C.ink, w: HAIR, o: 0.95 }));
  els.push(Ln({ k: 'cc1', a: P(xg, ym, 0.78), b: P(xg - 0.2, ym - 0.1, 0.6), s: C.inkSoft, w: 0.45 }));
  els.push(Ln({ k: 'cc2', a: P(xg, ym, 0.78), b: P(xg + 0.2, ym + 0.1, 0.6), s: C.inkSoft, w: 0.45 }));
  return els;
}

function vacantLot(P, x, y, w, d) {
  const els = [];
  els.push(Po({ k: 'lot', p: pl([P(x, y, 0), P(x + w, y, 0), P(x + w, y + d, 0), P(x, y + d, 0)]), f: 'none', s: C.inkSoft, w: 0.7, dash: '3 3' }));
  [[x, y], [x + w, y], [x + w, y + d], [x, y + d]].forEach(([sx, sy], i) => {
    const b = P(sx, sy, 0), t = P(sx, sy, 0.3);
    els.push(Ln({ k: 'stk' + i, a: b, b: t, s: C.ink, w: 0.7 }));
    els.push(Po({ k: 'stf' + i, p: pl([t, [t[0] + 5, t[1] + 1.6], [t[0], t[1] + 3.4]]), f: C.accent, s: 'none', o: 0.8 }));
  });
  els.push(Ln({ k: 'd1', a: P(x, y, 0), b: P(x + w, y + d, 0), s: C.hair, w: 0.5, dash: '2 3' }));
  els.push(Ln({ k: 'd2', a: P(x + w, y, 0), b: P(x, y + d, 0), s: C.hair, w: 0.5, dash: '2 3' }));
  // signboard
  const bx = x + w * 0.32, by = y + d + 0.001;
  els.push(Ln({ k: 'sp1', a: P(bx, by, 0), b: P(bx, by, 0.62), s: C.ink, w: 0.8 }));
  els.push(Ln({ k: 'sp2', a: P(bx + 0.55, by, 0), b: P(bx + 0.55, by, 0.62), s: C.ink, w: 0.8 }));
  els.push(Po({ k: 'sb', p: pl([P(bx - 0.06, by, 0.3), P(bx + 0.61, by, 0.3), P(bx + 0.61, by, 0.62), P(bx - 0.06, by, 0.62)]), f: C.paper, s: C.ink, w: 0.8 }));
  const c = P(bx + 0.28, by, 0.47);
  els.push(Ln({ k: 'sbt1', a: [c[0] - 6, c[1] - 1.5], b: [c[0] + 6, c[1] - 1.5], s: C.inkSoft, w: 0.7 }));
  els.push(Ln({ k: 'sbt2', a: [c[0] - 6, c[1] + 1.5], b: [c[0] + 4, c[1] + 1.5], s: C.inkSoft, w: 0.7 }));
  return els;
}

function furnaceMouth(P, plane, fixed, from, z0, night, motion) {
  const els = [];
  const w = 0.5, h = 0.5;
  const q = plane === 'x'
    ? [P(fixed, from, z0), P(fixed, from + w, z0), P(fixed, from + w, z0 + h), P(fixed, from, z0 + h)]
    : [P(from, fixed, z0), P(from + w, fixed, z0), P(from + w, fixed, z0 + h), P(from, fixed, z0 + h)];
  const c = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2];
  els.push(React.createElement('circle', {
    key: 'fg', cx: c[0], cy: c[1], r: night ? 15 : 10,
    className: motion ? 'fyw-flick' : '',
    style: { fill: C.gold, opacity: night ? 0.3 : 0.18 },
  }));
  els.push(Po({ k: 'fm', p: pl(q), f: C.gold, s: 'color-mix(in srgb, var(--ds-text) 35%, transparent)', w: 0.6, o: 0.95 }));
  const arch = plane === 'x'
    ? [P(fixed, from + 0.07, z0), P(fixed, from + w - 0.07, z0), P(fixed, from + w - 0.07, z0 + h - 0.1), P(fixed, from + 0.07, z0 + h - 0.1)]
    : [P(from + 0.07, fixed, z0), P(from + w - 0.07, fixed, z0), P(from + w - 0.07, fixed, z0 + h - 0.1), P(from + 0.07, fixed, z0 + h - 0.1)];
  els.push(Po({ k: 'fmi', p: pl(arch), f: 'none', s: 'color-mix(in srgb, var(--ds-text) 45%, transparent)', w: 0.5 }));
  return els;
}

function numberPlate(P, x, y, n, hovered) {
  const c = P(x, y, 0);
  return [
    React.createElement('circle', { key: 'npc', cx: c[0], cy: c[1], r: 7, style: { fill: hovered ? 'var(--ds-accent-soft)' : C.paper, stroke: hovered ? C.accent : C.inkSoft }, strokeWidth: 0.8 }),
    React.createElement('text', { key: 'npt', x: c[0], y: c[1] + 2.6, textAnchor: 'middle', style: { fill: hovered ? C.accent : C.ink, fontFamily: C.mono, fontSize: 7.2, fontWeight: 600 } }, String(n).padStart(2, '0')),
  ];
}

function districtLabel(P, plate) {
  const a = plate.screen ? plate.screen : P(plate.lx, plate.ly, 0);
  const text = plate.label, anchor = plate.anchor;
  if (anchor === 'end') {
    return [
      Ln({ k: 'dt', a: [a[0] - 14, a[1] + 4], b: [a[0], a[1] + 4], s: C.accent, w: 2 }),
      Tx({ k: 'dl', x: a[0] - 20, y: a[1] + 7, t: text, size: 8.5, fill: C.inkSoft, ls: '0.16em', anchor: 'end' }),
    ];
  }
  return [
    Ln({ k: 'dt', a: [a[0], a[1] + 4], b: [a[0] + 14, a[1] + 4], s: C.accent, w: 2 }),
    Tx({ k: 'dl', x: a[0] + 20, y: a[1] + 7, t: text, size: 8.5, fill: C.inkSoft, ls: '0.16em' }),
  ];
}

/* ---------- storey math ---------- */
function storeysFor(repos, metric, maxStoreys) {
  const score = (r) => metric === 'lines' ? r.lines : metric === 'sessions' ? r.sessions : Math.sqrt(Math.max(0, r.lines) * Math.max(0, r.sessions));
  const max = Math.max(...repos.map(score), 1);
  const out = {};
  repos.forEach((r) => {
    const s = score(r);
    out[r.repo] = s <= 0 ? 0 : Math.max(1, Math.round(maxStoreys * Math.pow(s / max, 0.6)));
  });
  return out;
}

/* ---------- yard layout (all-time) ---------- */
const YARD = {
  cubby:           { x: 0.9,  y: 0.7,  w: 2.9, d: 4.6, arch: 'hall',    plate: 0, np: [4.4, 5.8],  stacks: [[0.35, 1.7], [0.35, 3.2]], furnace: true, annex: true },
  'claude-skills': { x: 15.3, y: 1.0,  w: 2.3, d: 1.9, arch: 'monitor', plate: 1, np: [18.2, 3.4], stacks: [[14.9, 1.35]] },
  floorprint:      { x: 5.2,  y: 4.9,  w: 3.1, d: 1.7, arch: 'monitor', plate: 0, np: [8.8, 7.0],  stacks: [] },
  sift:            { x: 18.7, y: 1.1,  w: 2.0, d: 1.5, arch: 'gableY',  plate: 1, np: [21.2, 3.0], stacks: [] },
  cartoon:         { x: 15.5, y: 3.9,  w: 1.7, d: 1.3, arch: 'gableY',  plate: 1, np: [17.6, 5.6], stacks: [[15.2, 4.15]] },
  'doc-scan':      { x: 8.9,  y: 5.0,  w: 1.9, d: 1.4, arch: 'gableY',  plate: 0, np: [11.2, 6.8], stacks: [] },
  foundry:         { x: 5.9,  y: 9.1,  w: 2.0, d: 1.5, arch: 'gableX',  plate: 2, np: [8.3, 11.0], stacks: [], flag: true },
  memekit:         { x: 18.5, y: 3.8,  w: 1.4, d: 1.1, arch: 'shed',    plate: 1, np: [20.3, 5.3], stacks: [] },
  'design-system': { x: 9.0,  y: 9.2,  w: 1.5, d: 1.2, arch: 'shed',    plate: 2, np: [10.9, 10.8], stacks: [] },
  folix:           { x: 11.3, y: 4.9,  w: 2.1, d: 1.6, arch: 'lot',     plate: 0, np: [13.8, 6.9], stacks: [] },
};
const YARD_PLATES = [
  { x: 0, y: 0, w: 14, d: 7.2, label: '01 · APPS', lx: 0.1, ly: 7.5 },
  { x: 14.7, y: 0.4, w: 8.1, d: 5.6, label: '02 · AGENT TOOLING', screen: [858, 415] },
  { x: 5.4, y: 8.6, w: 6.0, d: 2.6, label: '03 · WEB & SITES', lx: 5.6, ly: 10.9, anchor: 'end' },
];

/* ---------- strip layout (weekly) ---------- */
const STRIP = {
  cubby:           { x: 0.6,  y: 0.45, w: 3.3, d: 2.0, arch: 'hall',   stacks: [[0.25, 0.9], [0.25, 1.75]], furnace: true },
  'claude-skills': { x: 4.8,  y: 0.7,  w: 1.9, d: 1.55, arch: 'monitor', stacks: [[4.5, 0.95]] },
  sift:            { x: 7.5,  y: 0.8,  w: 1.7, d: 1.4, arch: 'gableY', stacks: [], vent: true },
  'doc-scan':      { x: 9.9,  y: 0.85, w: 1.6, d: 1.3, arch: 'gableY', stacks: [], vent: true },
  floorprint:      { x: 12.1, y: 0.8,  w: 1.8, d: 1.35, arch: 'monitor', stacks: [], vent: true },
  cartoon:         { x: 14.6, y: 0.9,  w: 1.5, d: 1.2, arch: 'shed',   stacks: [], vent: true },
};

/* ---------- one building ---------- */
function buildingEls(P, b, r, storeys, opts) {
  const { night, motion, hatchId, glassId, glowAcc } = opts;
  const els = [];
  const base = 0.36;
  const h = storeys <= 0 ? 0 : base + storeys * 0.6 + 0.1;

  if (b.arch === 'lot') return [...vacantLot(P, b.x, b.y, b.w, b.d)];

  els.push(shadowOf(P, b.x, b.y, b.w, b.d, h));
  els.push(...boxWalls(P, b.x, b.y, b.w, b.d, h, 0, hatchId));

  // windows: long light face (x+w) across y; halls also get shade-face rows.
  // Halls skip the ground storey on the shade face (furnace + doors live there);
  // a hall with an attached annex skips its covered gable-end windows entirely.
  if (!b.annex) {
    els.push(...windows(P, 'x', b.x + b.w, b.y, b.y + b.d, 0, storeys, r.litFrac, r.repo + 'x', night, glowAcc));
  }
  if (b.d >= 1.4 || b.w >= 2.4) {
    const skipGround = b.arch === 'hall' && storeys > 1;
    els.push(...windows(P, 'y', b.y + b.d, b.x, b.x + b.w, skipGround ? 0.6 : 0, skipGround ? storeys - 1 : storeys, r.litFrac * 0.8, r.repo + 'y', night, glowAcc));
  }

  const rr = Math.max(0.35, Math.min(0.8, b.w * 0.24));
  if (b.arch === 'hall') {
    els.push(...gableRoof(P, b.x, b.y, b.w, b.d, h, rr, 'y', hatchId));
  } else if (b.arch === 'gableY') {
    els.push(...gableRoof(P, b.x, b.y, b.w, b.d, h, rr, 'y', hatchId));
  } else if (b.arch === 'gableX') {
    els.push(...gableRoof(P, b.x, b.y, b.w, b.d, h, Math.min(0.5, b.d * 0.3), 'x', hatchId));
  } else if (b.arch === 'monitor') {
    els.push(...monitorRoof(P, b.x, b.y, b.w, b.d, h, night, hatchId));
  } else {
    els.push(...flatTop(P, b.x, b.y, b.w, b.d, h));
  }

  if (b.furnace) {
    if (b.annex) els.push(...furnaceMouth(P, 'y', b.y + b.d, b.x + 0.55, 0.02, night, motion));
    else els.push(...furnaceMouth(P, 'x', b.x + b.w, b.y + b.d * 0.32, 0.02, night, motion));
  }

  // annex: sawtooth casting shop attached to cubby
  if (b.annex) {
    const ax = b.x + b.w + 0.001, ay = b.y + 0.35, aw = 2.7, ad = 3.0, ah = base + 1.9;
    els.push(shadowOf(P, ax, ay, aw, ad, ah));
    els.push(...boxWalls(P, ax, ay, aw, ad, ah, 0, hatchId));
    els.push(...windows(P, 'x', ax + aw, ay, ay + ad, 0, 2, r.litFrac, r.repo + 'ax', night, glowAcc));
    els.push(...sawtoothRoof(P, ax, ay, aw, ad, ah, 0.55, 4, hatchId, glassId, night));
  }

  // chimneys + smoke
  (b.stacks || []).forEach(([sx, sy], i) => {
    const hs = h + 1.5 + i * 0.35;
    els.push(...chimney(P, sx, sy, hs, hatchId));
    if (r.active) els.push(...smoke(P, sx + 0.17, sy + 0.17, hs + 0.35, i * 2, motion, night));
  });
  if (b.vent && r.active) {
    const vx = b.x + b.w * 0.32, vy = b.y + b.d * 0.4;
    const vh = h + rr + 0.42;
    els.push(Ln({ k: 'vent', a: P(vx, vy, h - 0.1), b: P(vx, vy, vh), s: C.ink, w: 1.6 }));
    els.push(...smoke(P, vx, vy, vh + 0.12, 1, motion, night));
  }

  // pennants along ridge (weekly PRs)
  if (r.prs > 0) {
    const xr = b.x + b.w / 2;
    els.push(...pennants(P, xr, b.y + 0.2, xr, b.y + b.d - 0.2, h + rr, r.prs));
  }
  if (b.flag) {
    const fx = b.x + b.w / 2, fy = b.y + b.d / 2;
    const t = P(fx, fy, h + 1.1);
    els.push(Ln({ k: 'flp', a: P(fx, fy, h + Math.min(0.5, b.d * 0.3)), b: t, s: C.ink, w: 0.7 }));
    els.push(Po({ k: 'flf', p: pl([t, [t[0] + 9, t[1] + 2.6], [t[0], t[1] + 5.4]]), f: C.accent, s: 'none' }));
  }
  return els;
}

/* ---------- furniture ---------- */
function titleBlock(x, y, mode, meta) {
  const w = 292, h = 76;
  const els = [];
  els.push(React.createElement('rect', { key: 'tb', x, y, width: w, height: h, style: { fill: C.paper, stroke: C.hairS }, strokeWidth: 0.9 }));
  els.push(React.createElement('rect', { key: 'tb2', x: x + 3, y: y + 3, width: w - 6, height: h - 6, style: { fill: 'none', stroke: C.hair }, strokeWidth: 0.6 }));
  els.push(Ln({ k: 'tbr1', a: [x + 3, y + 30], b: [x + w - 3, y + 30], s: C.hair, w: 0.6 }));
  els.push(Ln({ k: 'tbr2', a: [x + w - 74, y + 3], b: [x + w - 74, y + 30], s: C.hair, w: 0.6 }));
  els.push(React.createElement('rect', { key: 'tbt', x: x, y: y, width: 22, height: 4, style: { fill: C.accent } }));
  els.push(Tx({ k: 't1', x: x + 12, y: y + 22, t: 'The Works', size: 16.5, fill: C.inkStrong, font: C.serif, italic: false, ls: '0.01em', w: 400 }));
  els.push(Tx({ k: 't2', x: x + w - 66, y: y + 15, t: mode === 'strip' ? 'SHEET W' : 'SHEET 03', size: 7.5, fill: C.inkSoft }));
  els.push(Tx({ k: 't3', x: x + w - 66, y: y + 25, t: meta.sheetNo, size: 7.5, fill: C.inkSoft }));
  els.push(Tx({ k: 't4', x: x + 12, y: y + 43, t: meta.l1, size: 7.6, fill: C.inkSoft }));
  els.push(Tx({ k: 't5', x: x + 12, y: y + 55, t: meta.l2, size: 7.6, fill: C.inkFaint }));
  els.push(Tx({ k: 't6', x: x + 12, y: y + 67, t: meta.l3, size: 7.6, fill: C.inkFaint }));
  return els;
}

function northArrow(x, y) {
  return [
    React.createElement('circle', { key: 'nc', cx: x, cy: y, r: 11, style: { fill: 'none', stroke: C.hairS }, strokeWidth: 0.8 }),
    React.createElement('polygon', { key: 'nn', points: `${x},${y - 8} ${x + 3},${y + 4} ${x},${y + 1.5} ${x - 3},${y + 4}`, style: { fill: C.ink } }),
    Tx({ k: 'nt', x: x, y: y + 22, t: 'N', size: 8, anchor: 'middle', fill: C.inkSoft }),
  ];
}

function scaleBar(x, y, S) {
  const u = S * 0.6; // one storey
  return [
    Ln({ k: 'sb0', a: [x, y], b: [x + u * 2, y], s: C.ink, w: 0.9 }),
    Ln({ k: 'sb1', a: [x, y - 3.5], b: [x, y + 3.5], s: C.ink, w: 0.9 }),
    Ln({ k: 'sb2', a: [x + u, y - 2.5], b: [x + u, y + 2.5], s: C.ink, w: 0.7 }),
    Ln({ k: 'sb3', a: [x + u * 2, y - 3.5], b: [x + u * 2, y + 3.5], s: C.ink, w: 0.9 }),
    React.createElement('rect', { key: 'sbf', x: x, y: y - 2, width: u, height: 4, style: { fill: C.ink, opacity: 0.75 } }),
    Tx({ k: 'sbt', x: x + u * 2 + 8, y: y + 3, t: '2 STOREYS', size: 7.5, fill: C.inkFaint }),
  ];
}

/* ---------- the component ---------- */
function City(props) {
  const variant = props.variant === 'strip' ? 'strip' : 'yard';
  const night = props.night === true || props.night === 'true';
  const motionOk = !(props.motion === false || props.motion === 'false') &&
    !(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const dressing = !(props.dressing === false || props.dressing === 'false');
  const metric = props.heightMetric || 'blend';
  const repos = props.repos || [];
  const [hover, setHover] = useState(null); // {repo, px, py}
  const uid = useMemo(() => 'fyw' + Math.random().toString(36).slice(2, 7), []);

  const conf = variant === 'yard'
    ? { S: 30, ox: 268, oy: 236, vw: 1160, vh: 612, maxStoreys: 8, layout: YARD }
    : { S: 26, ox: 126, oy: 172, vw: 620, vh: 448, maxStoreys: 6, layout: STRIP };

  const P = useMemo(() => makeProj(conf.S, conf.ox, conf.oy), [variant]);
  const storeys = useMemo(() => storeysFor(repos, metric, conf.maxStoreys), [repos, metric, variant]);

  const maxTok = Math.max(...repos.map((r) => r.tokens || r.sessions || 1), 1);
  const enriched = repos.map((r) => ({
    ...r,
    litFrac: Math.max(0.12, Math.sqrt((r.tokens || r.sessions || 0) / maxTok)),
  })).filter((r) => conf.layout[r.repo]);

  // painter order: back to front by x+y of layout origin
  const ordered = [...enriched].sort((a, b) => (conf.layout[a.repo].x + conf.layout[a.repo].y) - (conf.layout[b.repo].x + conf.layout[b.repo].y));

  const glowAcc = [];
  const opts = { night, motion: motionOk, hatchId: uid + 'h', glassId: uid + 'g', glowAcc };

  const onMove = (r) => (e) => {
    const rect = e.currentTarget.ownerSVGElement.parentElement.getBoundingClientRect();
    setHover({ repo: r.repo, px: e.clientX - rect.left, py: e.clientY - rect.top });
  };

  const buildings = ordered.map((r, idx) => {
    const b = conf.layout[r.repo];
    const dim = hover && hover.repo !== r.repo;
    const rank = repos.findIndex((x) => x.repo === r.repo) + 1;
    return React.createElement('g', {
      key: r.repo,
      onMouseMove: onMove(r),
      onMouseLeave: () => setHover(null),
      style: { opacity: dim ? 0.38 : 1, transition: 'opacity 0.25s var(--ds-ease-standard)', cursor: 'default' },
      'aria-label': r.repo,
    }, [
      ...buildingEls(P, b, r, storeys[r.repo], opts),
      ...(variant === 'yard' && b.np ? numberPlate(P, b.np[0], b.np[1], rank, hover && hover.repo === r.repo) : []),
    ]);
  });

  /* ground + dressing */
  const under = [];
  if (variant === 'yard') {
    YARD_PLATES.forEach((p, i) => under.push(React.createElement('g', { key: 'pl' + i }, ground(P, p.x, p.y, p.w, p.d, 0))));
    if (dressing) {
      under.push(React.createElement('g', { key: 'rail' }, [
        ...rail(P, -1.4, 14.2, 7.82),
        ...flatcar(P, 2.1, 7.7, night),
      ]));
    }
    YARD_PLATES.forEach((p, i) => under.push(React.createElement('g', { key: 'dl' + i }, districtLabel(P, p))));
  } else {
    under.push(React.createElement('g', { key: 'pl' }, ground(P, 0, 0, 16.8, 3.1, 0)));
  }

  const over = [];
  if (variant === 'yard' && dressing) {
    over.push(React.createElement('g', { key: 'crane' }, gantryCrane(P, 9.4, 0.8, 10.9, 3.6, 2.6, night)));
    over.push(React.createElement('g', { key: 'ing1' }, ingotStack(P, 8.6, 1.2, [4, 4, 3, 1], true, night)));
    over.push(React.createElement('g', { key: 'ing2' }, ingotStack(P, 20.9, 1.4, [3, 2], true, night)));
    over.push(React.createElement('g', { key: 'ing3' }, ingotStack(P, 3.2, 5.6, [2, 1], false, night)));
  }

  /* furniture */
  const furn = [];
  if (variant === 'yard') {
    furn.push(React.createElement('g', { key: 'tb' }, titleBlock(conf.vw - 316, conf.vh - 96, 'yard', {
      sheetNo: 'NO. 03-A',
      l1: 'FORGE YARD PLAN — ONE BUILDING PER REPO',
      l2: (props.metaLine || 'SURVEYED FROM 3,097 SESSION LOGS · MAY 22 – JUL 11, 2026').toUpperCase(),
      l3: ('SCALE: 1 STOREY ≈ ' + (metric === 'blend' ? '√(LINES × SESSIONS)' : metric === 'lines' ? 'LINES ADDED' : 'SESSIONS') + ' · 8-STOREY MAX'),
    })));
    furn.push(React.createElement('g', { key: 'na' }, northArrow(conf.vw - 46, 40)));
    furn.push(React.createElement('g', { key: 'sc' }, scaleBar(24, conf.vh - 26, conf.S)));
  } else {
    const t = props.stamp || '';
    furn.push(Tx({ k: 'stamp', x: conf.vw - 10, y: 16, t, size: 7.5, fill: C.inkFaint, anchor: 'end', ls: '0.14em' }));
  }

  /* strip labels under buildings */
  if (variant === 'strip') {
    enriched.forEach((r) => {
      const b = conf.layout[r.repo];
      const a = P(b.x + b.w + 0.15, b.y + b.d + 0.15, 0);
      furn.push(Tx({ k: r.repo + 'l1', x: a[0], y: a[1] + 12, t: r.repo, size: 9, fill: C.ink, w: 600, anchor: 'middle', ls: '0.04em' }));
      furn.push(Tx({ k: r.repo + 'l2', x: a[0], y: a[1] + 23, t: fmtK(r.lines) + ' · ' + (r.prs || 0) + ' PR' + (r.prs === 1 ? '' : 'S'), size: 7.4, fill: C.inkFaint, anchor: 'middle' }));
    });
  }

  const hoveredRepo = hover ? enriched.find((r) => r.repo === hover.repo) : null;
  const tipRows = hoveredRepo ? [
    ['storeys', storeys[hoveredRepo.repo] === 0 ? 'site cleared' : String(storeys[hoveredRepo.repo])],
    ['sessions', fmtK(hoveredRepo.sessions)],
    ['lines added', fmtK(hoveredRepo.lines)],
    hoveredRepo.tokens != null ? ['tokens out', fmtK(hoveredRepo.tokens)] : null,
    hoveredRepo.prs != null ? ['PRs merged', String(hoveredRepo.prs)] : null,
  ].filter(Boolean) : [];

  const svg = React.createElement('svg', {
    viewBox: `0 0 ${conf.vw} ${conf.vh}`,
    role: 'img',
    'aria-label': props.ariaLabel || 'Isometric yard plan: one building per repository, height mapped to activity.',
    style: { width: '100%', height: 'auto', display: 'block' },
  }, [
    React.createElement('style', { key: 'st' }, `
      @keyframes fywPuff { 0% { transform: translate(0,0) scale(0.55); opacity: 0; } 12% { opacity: 0.55; } 70% { opacity: 0.3; } 100% { transform: translate(-13px,-34px) scale(1.65); opacity: 0; } }
      @keyframes fywFlick { 0%,100% { opacity: 0.16; } 50% { opacity: 0.3; } }
      .fyw-flick { animation: fywFlick 4.2s var(--ds-ease-standard, ease) infinite; }
      @media (prefers-reduced-motion: reduce) { .fyw-puff, .fyw-flick { animation: none !important; } }
    `),
    React.createElement('defs', { key: 'df' }, [
      React.createElement('pattern', { key: 'h', id: uid + 'h', width: 4.5, height: 4.5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
        React.createElement('line', { x1: 0, y1: 0, x2: 0, y2: 4.5, style: { stroke: 'var(--ds-text-3)', opacity: 0.35 }, strokeWidth: 0.55 })),
      React.createElement('pattern', { key: 'g', id: uid + 'g', width: 3.4, height: 8, patternUnits: 'userSpaceOnUse' },
        React.createElement('line', { x1: 1.7, y1: 0, x2: 1.7, y2: 8, style: { stroke: 'var(--ds-text-2)', opacity: 0.4 }, strokeWidth: 0.5 })),
    ]),
    React.createElement('g', { key: 'under' }, under),
    React.createElement('g', { key: 'glow' }, glowAcc),
    React.createElement('g', { key: 'b' }, buildings),
    React.createElement('g', { key: 'over' }, over),
    React.createElement('g', { key: 'furn' }, furn),
  ]);

  const tip = hoveredRepo ? React.createElement('div', {
    style: {
      position: 'absolute',
      left: Math.min(hover.px + 16, (props.tipClamp || 900)),
      top: hover.py + 14,
      background: 'var(--ds-surface)',
      border: '1px solid var(--ds-line-strong)',
      borderRadius: 'var(--ds-radius-sm)',
      boxShadow: 'var(--ds-shadow-pop)',
      padding: '10px 13px 11px',
      minWidth: 188,
      maxWidth: 260,
      pointerEvents: 'none',
      zIndex: 5,
    },
  }, [
    React.createElement('div', { key: 'h', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 7 } }, [
      React.createElement('span', { key: 'n', style: { fontFamily: C.mono, fontSize: 11.5, fontWeight: 600, color: 'var(--ds-text)', letterSpacing: '0.03em' } }, hoveredRepo.repo),
      React.createElement('span', { key: 'g', style: { fontFamily: C.mono, fontSize: 8, color: 'var(--ds-text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase' } }, hoveredRepo.group || ''),
    ]),
    ...tipRows.map(([k, v], i) => React.createElement('div', { key: 'r' + i, style: { display: 'flex', justifyContent: 'space-between', gap: 14, padding: '2.5px 0', borderTop: i === 0 ? 'none' : '1px solid var(--ds-line)' } }, [
      React.createElement('span', { key: 'k', style: { fontFamily: C.mono, fontSize: 9, color: 'var(--ds-text-3)', letterSpacing: '0.06em' } }, k),
      React.createElement('span', { key: 'v', style: { fontFamily: C.mono, fontSize: 9.5, fontWeight: 600, color: 'var(--ds-text-2)' } }, v),
    ])),
    ...(hoveredRepo.prTitles && hoveredRepo.prTitles.length ? [
      React.createElement('div', { key: 'pt', style: { marginTop: 7, paddingTop: 6, borderTop: '1px solid var(--ds-line)' } },
        hoveredRepo.prTitles.slice(0, 2).map((t, i) =>
          React.createElement('div', { key: i, style: { fontFamily: C.mono, fontSize: 8.5, lineHeight: 1.5, color: 'var(--ds-text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, '· ' + t))),
    ] : []),
  ]) : null;

  return React.createElement('div', { style: { position: 'relative', width: props.width || '100%' } }, [svg, tip]);
}

window.FoundryWorks = { City };
