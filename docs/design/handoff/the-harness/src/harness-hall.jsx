/* harness-hall.jsx — "The Harness": the Claude Code harness drawn as the
   foundry's machine hall. Same hairline-ink engineering-drawing idiom as
   works-city.jsx. All paint via House DS custom properties.

   window.FoundryHarness = { Hall, Switchyard, Lifecycle, Tracker, Loop }
   Hall: {motion}  Switchyard: {scenario}  others: {}
   Animation classes (.fyh-flow, .fyh-smoke, .fyh-glow) are defined in the
   host page's helmet. */

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
  winOff: 'color-mix(in srgb, var(--ds-text) 24%, var(--ds-surface-2))',
  accent: 'var(--ds-accent)',
  accentH: 'var(--ds-accent-hover)',
  accentSoft: 'color-mix(in srgb, var(--ds-accent) 14%, transparent)',
  gold: 'var(--ds-secondary)',
  danger: 'var(--ds-danger)',
  warn: 'var(--ds-warning)',
  good: 'var(--ds-success)',
  mono: 'var(--ds-font-mono)',
  serif: 'var(--ds-font-display)',
};
const HAIR = 0.7, LINE = 1.05;

function makeProj(S, ox, oy) {
  const cx = Math.cos(Math.PI / 6) * S, cy = Math.sin(Math.PI / 6) * S;
  return (x, y, z = 0) => [ox + (x - y) * cx, oy + (x + y) * cy - z * S];
}
const pl = (a) => a.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');

function Po({ p, f = 'none', s = C.ink, w = HAIR, o, dash, cls }) {
  return React.createElement('polygon', { points: p, className: cls, style: { fill: f, stroke: s, opacity: o }, strokeWidth: w, strokeDasharray: dash, strokeLinejoin: 'round' });
}
function Pa({ d, f = 'none', s = C.ink, w = HAIR, o, dash, cls, cap = 'round', marker }) {
  return React.createElement('path', { d, className: cls, style: { fill: f, stroke: s, opacity: o }, strokeWidth: w, strokeDasharray: dash, strokeLinecap: cap, strokeLinejoin: 'round', markerEnd: marker });
}
function Ln({ a, b, s = C.ink, w = HAIR, o, dash, cls, marker }) {
  return React.createElement('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], className: cls, style: { stroke: s, opacity: o }, strokeWidth: w, strokeDasharray: dash, strokeLinecap: 'round', markerEnd: marker });
}
function Ci({ c, r, f = 'none', s = C.ink, w = HAIR, o, cls }) {
  return React.createElement('circle', { cx: c[0], cy: c[1], r, className: cls, style: { fill: f, stroke: s, opacity: o }, strokeWidth: w });
}
function Tx({ x, y, t, size = 9, fill = C.inkSoft, w = 500, ls = '0.09em', anchor = 'start', font = C.mono, o, upper = true }) {
  return React.createElement('text', { x, y, textAnchor: anchor, style: { fill, opacity: o, fontFamily: font, fontSize: size, fontWeight: w, letterSpacing: ls, textTransform: upper ? 'uppercase' : 'none' } }, t);
}
function G(children, key, extra) { return React.createElement('g', Object.assign({ key }, extra), children); }

function hatchDefs(id) {
  return React.createElement('defs', { key: 'defs' },
    React.createElement('pattern', { id, width: 5, height: 5, patternTransform: 'rotate(45)', patternUnits: 'userSpaceOnUse' },
      React.createElement('line', { x1: 0, y1: 0, x2: 0, y2: 5, style: { stroke: 'var(--ds-text)' }, strokeWidth: 0.55, opacity: 0.16 })),
    React.createElement('marker', { id: id + '-arr', viewBox: '0 0 8 8', refX: 6.5, refY: 4, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' },
      React.createElement('path', { d: 'M0.5,0.8 L7,4 L0.5,7.2', fill: 'none', style: { stroke: 'context-stroke' }, strokeWidth: 1.1, strokeLinecap: 'round', strokeLinejoin: 'round' })));
}

/* ---------- shared iso pieces ---------- */
function ground(P, x, y, w, d, opts = {}) {
  const els = [], t = 0.14;
  els.push(React.createElement(Po, { key: 'gt', p: pl([P(x, y, 0), P(x + w, y, 0), P(x + w, y + d, 0), P(x, y + d, 0)]), f: C.plate, s: C.hairS }));
  els.push(React.createElement(Po, { key: 'ge1', p: pl([P(x, y + d, 0), P(x + w, y + d, 0), P(x + w, y + d, -t), P(x, y + d, -t)]), f: C.plateEdge, s: C.hairS }));
  els.push(React.createElement(Po, { key: 'ge2', p: pl([P(x + w, y, 0), P(x + w, y + d, 0), P(x + w, y + d, -t), P(x + w, y, -t)]), f: C.paper2, s: C.hairS }));
  if (!opts.noGrid) {
    for (let i = 2; i < w; i += 2) els.push(React.createElement(Ln, { key: 'gx' + i, a: P(x + i, y, 0), b: P(x + i, y + d, 0), s: C.hair, w: 0.45, o: 0.6 }));
    for (let j = 2; j < d; j += 2) els.push(React.createElement(Ln, { key: 'gy' + j, a: P(x, y + j, 0), b: P(x + w, y + j, 0), s: C.hair, w: 0.45, o: 0.6 }));
  }
  return els;
}
function shadowOf(P, x, y, w, d, h) {
  const k = Math.min(0.5, 0.14 + h * 0.055);
  return React.createElement(Po, { key: 'sh', p: pl([P(x + w, y, 0), P(x + w, y + d, 0), P(x + w + h * k, y + d + h * k * 0.4, 0), P(x + w + h * k, y + h * k * 0.4, 0)]), f: 'var(--ds-text)', s: 'none', o: 0.055 });
}
function box(P, x, y, w, d, h, z0 = 0, hatchId, topFill) {
  const els = [];
  const fy = [P(x, y + d, z0), P(x + w, y + d, z0), P(x + w, y + d, z0 + h), P(x, y + d, z0 + h)];
  els.push(React.createElement(Po, { key: 'fy', p: pl(fy), f: C.shade, s: C.ink }));
  if (hatchId) els.push(React.createElement(Po, { key: 'fyh', p: pl(fy), f: `url(#${hatchId})`, s: 'none' }));
  els.push(React.createElement(Po, { key: 'fx', p: pl([P(x + w, y, z0), P(x + w, y + d, z0), P(x + w, y + d, z0 + h), P(x + w, y, z0 + h)]), f: C.paper2, s: C.ink }));
  els.push(React.createElement(Po, { key: 'top', p: pl([P(x, y, z0 + h), P(x + w, y, z0 + h), P(x + w, y + d, z0 + h), P(x, y + d, z0 + h)]), f: topFill || C.paper, s: C.ink }));
  return els;
}
function windowsSE(P, x, y, w, d, h, z0, cols, rows, litSet, keyp) {
  // windows on the SE (x+w) face, laid along y
  const els = [];
  const my = 0.24, gz = (h - 0.5) / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const yy = y + my + (c * (d - my * 2)) / cols, hh = z0 + 0.34 + r * gz;
    const wW = (d - my * 2) / cols - 0.14, wH = Math.min(0.44, gz - 0.16);
    const lit = litSet && litSet.has(r * cols + c);
    els.push(React.createElement(Po, {
      key: keyp + r + '-' + c,
      p: pl([P(x + w, yy, hh), P(x + w, yy + wW, hh), P(x + w, yy + wW, hh + wH), P(x + w, yy, hh + wH)]),
      f: lit ? C.gold : C.winOff, s: C.ink, w: 0.5, o: lit ? 0.92 : 0.75, cls: lit ? 'fyh-glow' : undefined,
    }));
  }
  return els;
}
function smoke(P, x, y, z, motion, keyp, delay) {
  const [sx, sy] = P(x, y, z);
  if (!motion) return [React.createElement(Ci, { key: keyp + 's0', c: [sx + 1, sy - 6], r: 3.4, s: C.inkSoft, w: 0.6, o: 0.5 }), React.createElement(Ci, { key: keyp + 's1', c: [sx + 3.5, sy - 13], r: 4.6, s: C.inkSoft, w: 0.55, o: 0.35 })];
  return [0, 1, 2].map((i) => React.createElement('circle', {
    key: keyp + 'sm' + i, cx: sx + 1 + i * 1.4, cy: sy - 4 - i * 2, r: 3 + i * 1.1,
    style: { fill: 'none', stroke: C.inkSoft, animationDelay: (delay + i * 1.6) + 's' }, strokeWidth: 0.6, className: 'fyh-smoke',
  }));
}
function leader(from, to, text, opts = {}) {
  // engineering leader line: dashed hairline + label
  const els = [];
  els.push(React.createElement(Pa, { key: 'l', d: `M${from[0]},${from[1]} L${to[0]},${to[1]}`, s: C.hairS, w: 0.6, dash: '3 3', o: 0.9 }));
  els.push(React.createElement(Ci, { key: 'd', c: from, r: 1.6, f: C.accent, s: 'none', o: 0.9 }));
  const lines = Array.isArray(text) ? text : [text];
  lines.forEach((t, i) => els.push(React.createElement(Tx, {
    key: 't' + i, x: to[0] + (opts.anchor === 'end' ? -4 : 4), y: to[1] + 3 + i * 12,
    t, size: i === 0 ? 9.5 : 8.5, fill: i === 0 ? C.inkStrong : C.inkSoft, w: i === 0 ? 600 : 500, anchor: opts.anchor || 'start',
  })));
  return G(els, opts.k);
}

/* ================= HALL — hero isometric machine hall ================= */
function Hall({ motion = true }) {
  const P = makeProj(26, 318, 92);
  const H = 'hh-hatch';
  const els = [];

  // sheet furniture
  els.push(hatchDefs(H));
  els.push(G([
    React.createElement('rect', { key: 'b', x: 10, y: 10, width: 1120, height: 614, fill: 'none', style: { stroke: C.hair }, strokeWidth: 0.8 }),
    ...[[10, 10], [1130, 10], [10, 624], [1130, 624]].flatMap((c, i) => [
      React.createElement(Ln, { key: 'cm' + i + 'a', a: [c[0] - 0 + (c[0] < 500 ? 0 : 0), c[1]], b: [c[0] + (c[0] < 500 ? 14 : -14), c[1]], s: C.hairS, w: 1 }),
      React.createElement(Ln, { key: 'cm' + i + 'b', a: [c[0], c[1]], b: [c[0], c[1] + (c[1] < 300 ? 14 : -14)], s: C.hairS, w: 1 }),
    ]),
  ], 'sheet'));

  // ground slab
  els.push(G(ground(P, 0, 0, 27, 11), 'ground'));

  // ---- conveyor belt spine (x 0.8→26.2 at y 4.2..5.4) ----
  const beltEls = [];
  beltEls.push(...box(P, 0.8, 4.2, 25.4, 1.2, 0.3, 0, null, C.paper2));
  for (let i = 0; i < 31; i++) beltEls.push(React.createElement(Ln, { key: 'r' + i, a: P(1.2 + i * 0.82, 4.2, 0.3), b: P(1.2 + i * 0.82, 5.4, 0.3), s: C.hair, w: 0.5, o: 0.8 }));
  for (let i = 0; i < 6; i++) {
    const bx = 3.2 + i * 4.1;
    beltEls.push(React.createElement(Pa, { key: 'ch' + i, d: `M${P(bx, 4.55, 0.31)} L${P(bx + 0.45, 4.8, 0.31)} L${P(bx, 5.05, 0.31)}`, s: C.accent, w: 1.1, o: 0.85 }));
  }
  els.push(G(beltEls, 'belt'));

  // ---- 01 intake dock (front-left) ----
  const dock = [];
  dock.push(shadowOf(P, 1.2, 6.2, 2.4, 1.9, 0.5));
  dock.push(...box(P, 1.2, 6.2, 2.4, 1.9, 0.5, 0, H));
  dock.push(...box(P, 1.7, 6.6, 0.8, 0.6, 0.4, 0.5, null));
  dock.push(...box(P, 2.6, 6.9, 0.8, 0.6, 0.4, 0.5, null));
  dock.push(...box(P, 2.15, 6.75, 0.8, 0.6, 0.4, 0.9, null));
  // ramp to belt
  dock.push(React.createElement(Po, { key: 'ramp', p: pl([P(2.1, 6.2, 0.5), P(3.0, 6.2, 0.5), P(3.0, 5.4, 0.3), P(2.1, 5.4, 0.3)]), f: C.paper2, s: C.ink }));
  els.push(G(dock, 'dock'));

  // ---- 02 guard portal over belt at x≈5.4 ----
  const gate = [];
  gate.push(...box(P, 5.2, 3.7, 0.4, 0.4, 2.5, 0, null));
  gate.push(...box(P, 5.2, 5.5, 0.4, 0.4, 2.5, 0, null));
  gate.push(...box(P, 5.1, 3.55, 0.6, 2.5, 0.4, 2.5, H));
  // hanging plate
  gate.push(React.createElement(Po, { key: 'hp', p: pl([P(5.4, 4.1, 2.1), P(5.4, 5.3, 2.1), P(5.4, 5.3, 1.65), P(5.4, 4.1, 1.65)]), f: C.plate, s: C.hairS }));
  gate.push(React.createElement(Ln, { key: 'hw1', a: P(5.4, 4.35, 2.5), b: P(5.4, 4.35, 2.1), s: C.ink, w: 0.5 }));
  gate.push(React.createElement(Ln, { key: 'hw2', a: P(5.4, 5.05, 2.5), b: P(5.4, 5.05, 2.1), s: C.ink, w: 0.5 }));
  els.push(G(gate, 'gate'));

  // ---- 03 control tower (routing) ----
  const tower = [];
  tower.push(shadowOf(P, 7.6, 1.3, 2, 2, 3.2));
  tower.push(...box(P, 7.6, 1.3, 2, 2, 3.2, 0, H));
  tower.push(...windowsSE(P, 7.6, 1.3, 2, 2, 3.2, 0, 3, 3, new Set([1, 3, 4, 7]), 'tw'));
  tower.push(...box(P, 7.75, 1.45, 1.7, 1.7, 0.22, 3.2, null));
  tower.push(React.createElement(Ln, { key: 'ant', a: P(8.6, 2.3, 3.42), b: P(8.6, 2.3, 4.5), s: C.inkStrong, w: LINE }));
  tower.push(React.createElement(Ci, { key: 'antb', c: P(8.6, 2.3, 4.5), r: 2.2, s: C.inkStrong, w: 0.8, f: 'none' }));
  // signal flag
  tower.push(React.createElement(Po, { key: 'flag', p: pl([P(8.6, 2.3, 4.36), P(8.6, 2.3, 4.14), [P(8.6, 2.3, 4.25)[0] + 13, P(8.6, 2.3, 4.25)[1] + 3]]), f: C.accent, s: 'none', o: 0.9 }));
  // catwalk tower → belt
  tower.push(React.createElement(Po, { key: 'cat', p: pl([P(8.3, 3.3, 1.4), P(9.0, 3.3, 1.4), P(9.0, 4.2, 1.4), P(8.3, 4.2, 1.4)]), f: 'none', s: C.ink, w: 0.6 }));
  tower.push(React.createElement(Ln, { key: 'catl1', a: P(8.3, 4.2, 1.4), b: P(8.3, 4.2, 0.3), s: C.ink, w: 0.55 }));
  tower.push(React.createElement(Ln, { key: 'catl2', a: P(9.0, 4.2, 1.4), b: P(9.0, 4.2, 0.3), s: C.ink, w: 0.55 }));
  els.push(G(tower, 'tower'));

  // ---- 04 furnaces (behind belt) ----
  const furn = [];
  // planner — tall, crowned
  furn.push(shadowOf(P, 11.4, 0.7, 2, 2, 4));
  furn.push(...box(P, 11.4, 0.7, 2, 2, 4, 0, H));
  furn.push(...windowsSE(P, 11.4, 0.7, 2, 2, 4, 0, 2, 4, new Set([0, 1, 3, 4, 6]), 'pf'));
  furn.push(...box(P, 11.85, 1.15, 1.1, 1.1, 0.5, 4, null));
  furn.push(...box(P, 12.9, 0.85, 0.5, 0.5, 1.3, 4, null));
  furn.push(...smoke(P, 13.15, 1.1, 5.35, motion, 'p', 0));
  // executor — wide
  furn.push(shadowOf(P, 14.6, 0.8, 2.4, 1.9, 2.9));
  furn.push(...box(P, 14.6, 0.8, 2.4, 1.9, 2.9, 0, H));
  furn.push(...windowsSE(P, 14.6, 0.8, 2.4, 1.9, 2.9, 0, 3, 3, new Set([0, 2, 4, 5, 7]), 'ef'));
  furn.push(...box(P, 16.35, 0.95, 0.5, 0.5, 1.0, 2.9, null));
  furn.push(...smoke(P, 16.6, 1.2, 3.95, motion, 'e', 0.9));
  // chore — small
  furn.push(shadowOf(P, 18.2, 1.05, 1.4, 1.5, 1.9));
  furn.push(...box(P, 18.2, 1.05, 1.4, 1.5, 1.9, 0, H));
  furn.push(...windowsSE(P, 18.2, 1.05, 1.4, 1.5, 1.9, 0, 2, 2, new Set([1, 2]), 'cf'));
  furn.push(...smoke(P, 19.35, 1.25, 1.95, motion, 'c', 1.8));
  // feed chutes furnace → belt
  [[12.4, 2.7, 2.2], [15.8, 2.7, 1.8], [18.9, 2.55, 1.2]].forEach(([fx, fy, fz], i) => {
    furn.push(React.createElement(Pa, { key: 'chute' + i, d: `M${P(fx, fy, fz)} L${P(fx, 4.35, 0.4)}`, s: C.ink, w: 0.8, dash: '1 3' }));
  });
  els.push(G(furn, 'furnaces'));

  // ---- 05 casting bay ----
  const cast = [];
  cast.push(shadowOf(P, 21, 3.4, 3, 2.6, 2.2));
  // open shed: two end frames + gable roof
  cast.push(...box(P, 21, 3.4, 0.28, 2.6, 2.0, 0, null));
  cast.push(...box(P, 23.72, 3.4, 0.28, 2.6, 2.0, 0, null));
  const ridgeZ = 2.75;
  cast.push(React.createElement(Po, { key: 'roofB', p: pl([P(21, 3.4, 2.0), P(24, 3.4, 2.0), P(24, 4.7, ridgeZ), P(21, 4.7, ridgeZ)]), f: C.paper, s: C.ink }));
  cast.push(React.createElement(Po, { key: 'roofA', p: pl([P(21, 6.0, 2.0), P(24, 6.0, 2.0), P(24, 4.7, ridgeZ), P(21, 4.7, ridgeZ)]), f: C.shade, s: C.ink }));
  cast.push(React.createElement(Po, { key: 'roofAh', p: pl([P(21, 6.0, 2.0), P(24, 6.0, 2.0), P(24, 4.7, ridgeZ), P(21, 4.7, ridgeZ)]), f: `url(#${H})`, s: 'none' }));
  cast.push(React.createElement(Ln, { key: 'ridge', a: P(21, 4.7, ridgeZ), b: P(24, 4.7, ridgeZ), s: C.inkStrong, w: LINE }));
  // ingot molds on belt
  [21.5, 22.4, 23.3].forEach((mx, i) => {
    cast.push(...box(P, mx, 4.5, 0.62, 0.62, 0.3, 0.3, null, i === 1 ? C.gold : C.paper));
  });
  // pennant mast
  cast.push(React.createElement(Ln, { key: 'mast', a: P(24.1, 3.3, 0), b: P(24.1, 3.3, 3.4), s: C.inkStrong, w: 0.9 }));
  const mp = P(24.1, 3.3, 3.4), mp2 = P(24.1, 3.3, 3.05);
  cast.push(React.createElement(Po, { key: 'pen1', p: pl([mp, [mp[0] + 15, mp[1] + 4], [mp[0], mp[1] + 8]]), f: C.accent, s: 'none', o: 0.9 }));
  cast.push(React.createElement(Po, { key: 'pen2', p: pl([mp2, [mp2[0] + 13, mp2[1] + 3.5], [mp2[0], mp2[1] + 7]]), f: C.gold, s: 'none', o: 0.85 }));
  els.push(G(cast, 'casting'));

  // ---- 06 records shed (front-right) ----
  const rec = [];
  rec.push(shadowOf(P, 24.3, 6.6, 2, 1.7, 1.5));
  rec.push(...box(P, 24.3, 6.6, 2, 1.7, 1.5, 0, H));
  rec.push(...box(P, 24.5, 6.8, 0.9, 0.6, 0.5, 1.5, null, C.paper2));
  // spool / drum on top
  const dc0 = P(25.9, 7.3, 1.8);
  rec.push(React.createElement(Ci, { key: 'drum', c: dc0, r: 5.5, s: C.inkStrong, w: 0.9, f: C.paper2 }));
  rec.push(React.createElement(Ci, { key: 'drum2', c: dc0, r: 2, s: C.ink, w: 0.6, f: 'none' }));
  els.push(G(rec, 'records'));

  // belt → records chute
  els.push(G([React.createElement(Pa, { key: 'rc', d: `M${P(24.9, 5.4, 0.3)} L${P(25.1, 6.6, 0.9)}`, s: C.ink, w: 0.8, dash: '1 3' })], 'recchute'));

  // ---- lessons return pipe (records → tower), dashed on ground ----
  const flowCls = motion ? 'fyh-flow' : undefined;
  els.push(G([
    React.createElement(Pa, { key: 'ret', d: `M${P(24.6, 8.7, 0)} L${P(9.0, 8.7, 0)} L${P(9.0, 3.8, 0)}`, s: C.accent, w: 1.2, dash: '5 5', o: 0.8, cls: flowCls, marker: `url(#${H}-arr)` }),
  ], 'return'));

  // ---- yard furniture ----
  const yard = [];
  yard.push(...box(P, 4.3, 7.6, 0.7, 0.7, 0.5, 0, null));
  yard.push(...box(P, 5.2, 7.9, 0.7, 0.7, 0.5, 0, null));
  for (let i = 0; i <= 12; i++) yard.push(React.createElement(Ln, { key: 'fp' + i, a: P(1 + i * 2.05, 10.4, 0), b: P(1 + i * 2.05, 10.4, 0.42), s: C.ink, w: 0.6, o: 0.75 }));
  for (let i = 0; i < 12; i++) yard.push(React.createElement(Ln, { key: 'fw' + i, a: P(1 + i * 2.05, 10.4, 0.34), b: P(1 + (i + 1) * 2.05, 10.4, 0.34), s: C.hairS, w: 0.5, o: 0.7 }));
  const bm = P(2.2, 9.5, 0);
  yard.push(React.createElement(Ln, { key: 'bm1', a: [bm[0] - 5, bm[1]], b: [bm[0] + 5, bm[1]], s: C.inkSoft, w: 0.7 }));
  yard.push(React.createElement(Ln, { key: 'bm2', a: [bm[0], bm[1] - 5], b: [bm[0], bm[1] + 5], s: C.inkSoft, w: 0.7 }));
  yard.push(React.createElement(Ci, { key: 'bm3', c: bm, r: 3.2, s: C.inkSoft, w: 0.6 }));
  els.push(G(yard, 'yard'));

  // ---- leader labels ----
  els.push(leader(P(2.4, 7, 1.1), [64, 486], ['01 · intake', 'the ask arrives'], { k: 'L1' }));
  els.push(leader(P(5.3, 3.8, 2.6), [128, 128], ['02 · guards', 'hooks deny the', 'catastrophic'], { k: 'L2' }));
  els.push(leader(P(8.6, 1.5, 3.6), [318, 66], ['03 · routing', 'mode · tier · effort'], { k: 'L3' }));
  els.push(leader(P(12.4, 0.8, 4.3), [568, 46], ['04 · furnaces — model tiers', 'planner · executor · chore', 'fable/opus · sonnet · haiku'], { k: 'L4' }));
  els.push(leader(P(23.9, 3.5, 2.9), [942, 96], ['05 · casting', 'commits · prs'], { k: 'L5' }));
  els.push(leader(P(26.2, 7.4, 1.4), [1044, 388], ['06 · records', 'session logs', 'memory'], { k: 'L6' }));
  els.push(leader(P(16.5, 8.7, 0), [560, 590], ['lessons return — skills · guards · rules'], { k: 'L7' }));



  // ---- title block ----
  els.push(G([
    React.createElement('rect', { key: 'tb', x: 24, y: 552, width: 316, height: 62, fill: C.paper, style: { stroke: C.hairS }, strokeWidth: 0.8 }),
    React.createElement(Ln, { key: 'tbl', a: [24, 574], b: [340, 574], s: C.hair, w: 0.6 }),
    React.createElement(Ln, { key: 'tbv', a: [236, 574], b: [236, 614], s: C.hair, w: 0.6 }),
    React.createElement(Tx, { key: 't1', x: 34, y: 568, t: 'the harness — machine hall', size: 10.5, fill: C.inkStrong, w: 650 }),
    React.createElement(Tx, { key: 't2', x: 34, y: 590, t: 'governed engineering line', size: 8.5 }),
    React.createElement(Tx, { key: 't3', x: 34, y: 604, t: 'abhijit bansal · foundry', size: 8.5 }),
    React.createElement(Tx, { key: 't4', x: 246, y: 590, t: 'dwg fy-05a', size: 8.5, fill: C.accentH }),
    React.createElement(Tx, { key: 't5', x: 246, y: 604, t: '2026-07-13', size: 8.5 }),
  ], 'titleblock'));

  // north arrow
  els.push(G([
    React.createElement(Ci, { key: 'n0', c: [1092, 66], r: 14, s: C.hairS, w: 0.7 }),
    React.createElement(Pa, { key: 'n1', d: 'M1092,76 L1092,56', s: C.inkStrong, w: 1, marker: `url(#${H}-arr)` }),
    React.createElement(Tx, { key: 'n2', x: 1092, y: 96, t: 'n', size: 9, anchor: 'middle', fill: C.inkStrong }),
  ], 'north'));

  return React.createElement('svg', { viewBox: '0 0 1140 634', role: 'img', 'aria-label': 'Isometric engineering drawing of the harness as a machine hall: the ask enters, passes guard gates, a routing tower dispatches to three model furnaces, castings become commits, records feed lessons back.', style: { width: '100%', height: 'auto', display: 'block' } }, els);
}

/* ================= SWITCHYARD — interactive routing schematic ================= */
const RAIL_Y = { solo: 150, single: 245, wf: 340, teamA: 460, teamB: 512 };
const FURN_X = { planner: 330, executor: 545, chore: 745 };
const EFFORTS = ['low', 'med', 'high', 'xhigh', 'max'];

const SCN = {
  fix: {
    mode: 'solo',
    modeLabel: 'Solo — orchestrator edits directly',
    node: { x: 520, t: ['orchestrator edits', 'no dispatch ceremony'] },
    drops: [],
    dials: {},
    gates: { compile: 'skip', tests: 'skip', review: 'skip', push: 'off', log: 'on' },
    gateNote: 'smart routing: trivial tier — heavy review skipped, fired gates never suppressed',
  },
  review: {
    mode: 'single',
    modeLabel: 'Single agent — one bounded delegation',
    node: { x: 430, t: ['one perspective', 'schema-shaped return'] },
    drops: [{ x: 545, furnace: 'executor', t: ['ecc:swift-reviewer', 'sonnet · medium'] }],
    dials: { executor: 1 },
    gates: { compile: 'off', tests: 'off', review: 'on', push: 'off', log: 'on' },
    gateNote: 'a focused review dispatch — findings return with file:line anchors',
  },
  wave: {
    mode: 'wf',
    modeLabel: 'Workflow — /fix BUG-004 · a real wave',
    node: { x: 260, t: ['plan desk', 'propose → WAIT'] },
    drops: [
      { x: 330, furnace: 'planner', t: ['writing-plans', 'fable/opus · xhigh'] },
      { x: 545, furnace: 'executor', t: ['TDD · phases serial', 'sonnet · med–high'] },
      { x: 745, furnace: 'chore', t: ['digests · checklists', 'haiku · low'] },
    ],
    dials: { planner: 3, executor: 2, chore: 0 },
    gates: { compile: 'on', tests: 'on', review: 'on', push: 'warn', log: 'warn' },
    gateNote: 'phase boundary, in order: compile → whole CubbyTests → reviewer → push → docs: checkpoint',
  },
  audit: {
    mode: 'wf',
    modeLabel: 'Workflow + adversarial verify',
    node: { x: 260, t: ['fan-out over', 'the config'] },
    drops: [
      { x: 545, furnace: 'executor', t: ['6 finder agents', 'sonnet · medium'] },
      { x: 330, furnace: 'planner', t: ['synthesis · scoring', 'opus · high'], labelLeft: true },
      { x: 490, furnace: 'planner', t: ['adversarial verify', 'fable · max'], labelLeft: true },
    ],
    dials: { planner: 4, executor: 1 },
    gates: { compile: 'off', tests: 'off', review: 'on', push: 'off', log: 'on' },
    gateNote: 'schema every data-returning dispatch — parse-retry loops are pure token burn',
  },
  team: {
    mode: 'team',
    modeLabel: 'Agent team — long-lived roles, cross-talk',
    node: null,
    drops: [
      { x: 430, furnace: 'executor', t: ['implementer', 'sonnet · med–high'], fromY: RAIL_Y.teamA, labelLeft: true, ly: 16 },
      { x: 640, furnace: 'executor', t: ['reviewer', 'sonnet · med'], fromY: RAIL_Y.teamB },
    ],
    dials: { planner: 3, executor: 2 },
    gates: { compile: 'on', tests: 'on', review: 'on', push: 'warn', log: 'warn' },
    gateNote: 'mid-flight steering across phases — the orchestrator stays planner-tier',
  },
};

function crucible(cx, cy, name, tier, level, active) {
  const els = [];
  const ink = active ? C.accent : C.ink;
  const body = `M${cx - 26},${cy - 18} L${cx + 26},${cy - 18} L${cx + 18},${cy + 14} L${cx - 18},${cy + 14} Z`;
  els.push(React.createElement(Pa, { key: 'b', d: body, f: active ? C.accentSoft : C.paper2, s: ink, w: active ? 1.4 : HAIR }));
  els.push(React.createElement(Pa, { key: 'm', d: `M${cx - 20},${cy - 18} L${cx + 20},${cy - 18}`, s: active ? C.gold : C.inkSoft, w: active ? 2.2 : 1.2, o: active ? 0.95 : 0.6, cls: active ? 'fyh-glow' : undefined }));
  els.push(React.createElement(Ln, { key: 'l1', a: [cx - 22, cy + 14], b: [cx - 26, cy + 20], s: ink, w: HAIR }));
  els.push(React.createElement(Ln, { key: 'l2', a: [cx + 22, cy + 14], b: [cx + 26, cy + 20], s: ink, w: HAIR }));
  els.push(React.createElement(Tx, { key: 'n', x: cx, y: cy + 34, t: name, size: 9.5, fill: active ? C.inkStrong : C.inkSoft, w: 650, anchor: 'middle' }));
  els.push(React.createElement(Tx, { key: 't', x: cx, y: cy + 46, t: tier, size: 8, fill: active ? C.accentH : C.inkFaint, anchor: 'middle' }));
  // effort dial
  const dx = cx + 44, dy = cy - 2, r = 15;
  els.push(React.createElement(Pa, { key: 'da', d: `M${dx - r},${dy} A${r},${r} 0 0 1 ${dx + r},${dy}`, s: C.hairS, w: 0.8 }));
  for (let i = 0; i < 5; i++) {
    const a = Math.PI - (i * Math.PI) / 4;
    els.push(React.createElement(Ln, { key: 'dt' + i, a: [dx + Math.cos(a) * (r - 2.5), dy - Math.sin(a) * (r - 2.5)], b: [dx + Math.cos(a) * (r + 1.5), dy - Math.sin(a) * (r + 1.5)], s: C.inkSoft, w: 0.7, o: 0.8 }));
  }
  const na = Math.PI - ((level == null ? 0 : level) * Math.PI) / 4;
  els.push(React.createElement(Ln, { key: 'dn', a: [dx, dy], b: [dx + Math.cos(na) * (r - 4.5), dy - Math.sin(na) * (r - 4.5)], s: level != null && active ? C.gold : C.inkFaint, w: level != null && active ? 1.6 : 1, o: level != null && active ? 1 : 0.6 }));
  els.push(React.createElement(Ci, { key: 'dc', c: [dx, dy], r: 1.6, f: level != null && active ? C.gold : C.inkFaint, s: 'none' }));
  els.push(React.createElement(Tx, { key: 'dl', x: dx, y: dy + 12, t: level != null && active ? EFFORTS[level] : 'effort', size: 7.5, fill: level != null && active ? C.gold : C.inkFaint, anchor: 'middle' }));
  return G(els, 'cr-' + name);
}

function gateLamp(x, y, label, sub, state) {
  // state: on | warn | skip | off
  const col = state === 'on' ? C.good : state === 'warn' ? C.warn : C.inkFaint;
  const fill = state === 'on' ? 'color-mix(in srgb, var(--ds-success) 12%, transparent)' : state === 'warn' ? 'color-mix(in srgb, var(--ds-warning) 12%, transparent)' : 'none';
  const els = [
    React.createElement('rect', { key: 'r', x: x, y: y, width: 118, height: 34, rx: 3, fill, style: { stroke: state === 'off' ? C.hair : col }, strokeWidth: state === 'off' ? 0.7 : 1.1, strokeDasharray: state === 'skip' ? '3 3' : undefined }),
    React.createElement(Ci, { key: 'd', c: [x + 12, y + 17], r: 3, f: state === 'off' ? 'none' : col, s: state === 'off' ? C.inkFaint : 'none', w: 0.8 }),
    React.createElement(Tx, { key: 't', x: x + 22, y: y + 15, t: label, size: 8.5, fill: state === 'off' ? C.inkFaint : C.inkStrong, w: 600 }),
    React.createElement(Tx, { key: 's', x: x + 22, y: y + 27, t: state === 'skip' ? 'skipped — trivial' : sub, size: 7.5, fill: state === 'skip' ? C.inkSoft : state === 'off' ? C.inkFaint : col }),
  ];
  return G(els, 'gl-' + label);
}

function Switchyard({ scenario = 'wave' }) {
  const sc = SCN[scenario] || SCN.wave;
  const A = 'sy-hatch';
  const els = [hatchDefs(A)];
  const flow = 'fyh-flow';
  const MERGE_X = 872, GATE_X = 900, OUT_X = 1032;

  // base rails
  const rails = [];
  const railDefs = [
    ['solo', 'solo', 'single-file fix · conversational turn'],
    ['single', 'single agent', 'one bounded delegation'],
    ['wf', 'workflow', 'fan-out · pipelines · aggregation'],
    ['teamA', 'agent team', 'long-lived roles · cross-talk'],
  ];
  railDefs.forEach(([id, name, when]) => {
    const y = RAIL_Y[id];
    rails.push(React.createElement(Ln, { key: 'rail-' + id, a: [232, y], b: [MERGE_X, y], s: C.hairS, w: 1.2 }));
    rails.push(React.createElement(Ln, { key: 'railb-' + id, a: [232, y + 3.5], b: [MERGE_X, y + 3.5], s: C.hair, w: 0.6, o: 0.9 }));
    for (let tx = 244; tx < MERGE_X; tx += 26) rails.push(React.createElement(Ln, { key: 'tie-' + id + tx, a: [tx, y - 2.5], b: [tx, y + 6], s: C.hair, w: 0.6, o: 0.55 }));
    rails.push(React.createElement(Tx, { key: 'rn-' + id, x: 240, y: y - 22, t: name, size: 10, fill: C.inkStrong, w: 650 }));
    rails.push(React.createElement(Tx, { key: 'rw-' + id, x: 240, y: y - 11, t: when, size: 7.5, fill: C.inkFaint }));
  });
  rails.push(React.createElement(Ln, { key: 'rail-tb', a: [380, RAIL_Y.teamB], b: [MERGE_X - 40, RAIL_Y.teamB], s: C.hairS, w: 1.2 }));
  rails.push(React.createElement(Ln, { key: 'railb-tb', a: [380, RAIL_Y.teamB + 3.5], b: [MERGE_X - 40, RAIL_Y.teamB + 3.5], s: C.hair, w: 0.6, o: 0.9 }));
  rails.push(React.createElement(Tx, { key: 'rn-tb', x: 388, y: RAIL_Y.teamB + 16, t: 'second role — reviewer', size: 7.5, fill: C.inkFaint }));
  // switch fan from trunk
  Object.keys(RAIL_Y).filter((k) => k !== 'teamB').forEach((k) => {
    rails.push(React.createElement(Pa, { key: 'fan-' + k, d: `M158,340 C 195,340 200,${RAIL_Y[k]} 232,${RAIL_Y[k]}`, s: C.hairS, w: 1.1 }));
  });
  rails.push(React.createElement(Pa, { key: 'fan-tb', d: `M340,${RAIL_Y.teamA} C 362,${RAIL_Y.teamA} 358,${RAIL_Y.teamB} 380,${RAIL_Y.teamB}`, s: C.hairS, w: 1.1 }));
  rails.push(React.createElement(Ci, { key: 'switch-dot', c: [158, 340], r: 3.2, f: C.inkStrong, s: 'none' }));
  // merges
  Object.keys(RAIL_Y).forEach((k) => {
    const endX = k === 'teamB' ? MERGE_X - 40 : MERGE_X;
    rails.push(React.createElement(Pa, { key: 'mg-' + k, d: `M${endX},${RAIL_Y[k]} C ${MERGE_X + 20},${RAIL_Y[k]} ${MERGE_X - 4},340 ${GATE_X},340`, s: C.hairS, w: 1.1 }));
  });
  els.push(G(rails, 'rails'));

  // entry + out plates
  els.push(G([
    React.createElement('rect', { key: 'r', x: 56, y: 316, width: 102, height: 48, rx: 4, fill: C.paper, style: { stroke: C.hairS }, strokeWidth: 1 }),
    React.createElement(Tx, { key: 't', x: 70, y: 337, t: 'task in', size: 10, fill: C.inkStrong, w: 650 }),
    React.createElement(Tx, { key: 's', x: 70, y: 351, t: 'the ask', size: 8, fill: C.inkSoft }),
  ], 'entry'));
  els.push(G([
    React.createElement('rect', { key: 'r', x: OUT_X - 8, y: 306, width: 106, height: 68, rx: 4, fill: C.paper, style: { stroke: C.hairS }, strokeWidth: 1 }),
    React.createElement(Tx, { key: 't', x: OUT_X + 4, y: 328, t: 'shipped', size: 10, fill: C.inkStrong, w: 650 }),
    React.createElement(Tx, { key: 's1', x: OUT_X + 4, y: 342, t: 'commits + PR', size: 8, fill: C.inkSoft }),
    React.createElement(Tx, { key: 's2', x: OUT_X + 4, y: 354, t: 'docs: checkpoint', size: 8, fill: C.inkSoft }),
    React.createElement(Tx, { key: 's3', x: OUT_X + 4, y: 366, t: 'session log', size: 8, fill: C.inkSoft }),
  ], 'out'));


  // gate column
  const gateStates = sc.gates;
  els.push(G([
    React.createElement('rect', { key: 'gr', x: GATE_X - 14, y: 118, width: 132, height: 404, rx: 6, fill: 'none', style: { stroke: C.hair }, strokeWidth: 0.8, strokeDasharray: '4 4' }),
    React.createElement(Tx, { key: 'gt', x: GATE_X - 4, y: 106, t: 'phase-boundary gates', size: 8.5, fill: C.inkSoft, w: 600 }),
    gateLamp(GATE_X, 152, 'compile', 'green', gateStates.compile),
    gateLamp(GATE_X, 200, 'tests', 'whole CubbyTests', gateStates.tests),
    gateLamp(GATE_X, 248, 'review', 'no CRIT/HIGH', gateStates.review),
    gateLamp(GATE_X, 296, 'push gate ▲', 'block-once', gateStates.push),
    gateLamp(GATE_X, 344, 'log ▲', 'docs: checkpoint', gateStates.log),
    React.createElement(Tx, { key: 'gn1', x: GATE_X, y: 400, t: '■ hard · ▲ reminder', size: 7.5, fill: C.inkFaint }),
  ], 'gates'));

  // furnace row
  els.push(G([
    React.createElement(Ln, { key: 'fl', a: [240, 596], b: [860, 596], s: C.hair, w: 0.7, dash: '2 4' }),
    React.createElement(Tx, { key: 'ft', x: 240, y: 628, t: 'the furnaces — every dispatch sets two knobs: tier + effort', size: 8.5, fill: C.inkSoft }),
    crucible(FURN_X.planner, 560, 'fable / opus', 'planner', sc.dials.planner, sc.dials.planner != null),
    crucible(FURN_X.executor, 560, 'sonnet', 'executor', sc.dials.executor, sc.dials.executor != null),
    crucible(FURN_X.chore, 560, 'haiku', 'chore', sc.dials.chore, sc.dials.chore != null),
  ], 'furnaces'));

  // ---- active overlay ----
  const act = [];
  const y0 = RAIL_Y[sc.mode === 'team' ? 'teamA' : sc.mode];
  act.push(React.createElement(Pa, { key: 'a-trunk', d: `M158,340 C 195,340 200,${y0} 232,${y0} L${MERGE_X},${y0} C ${MERGE_X + 20},${y0} ${MERGE_X - 4},340 ${GATE_X},340 L${OUT_X - 8},340`, s: C.accent, w: 2, cls: flow, dash: '7 6', o: 0.95 }));
  if (sc.mode === 'team') {
    act.push(React.createElement(Pa, { key: 'a-tb', d: `M340,${RAIL_Y.teamA} C 362,${RAIL_Y.teamA} 358,${RAIL_Y.teamB} 380,${RAIL_Y.teamB} L${MERGE_X - 40},${RAIL_Y.teamB} C ${MERGE_X + 8},${RAIL_Y.teamB} ${MERGE_X - 10},340 ${GATE_X},340`, s: C.accent, w: 1.6, cls: flow, dash: '7 6', o: 0.75 }));
    [480, 600, 720].forEach((x, i) => {
      act.push(React.createElement(Ln, { key: 'ct' + i, a: [x, RAIL_Y.teamA + 6], b: [x, RAIL_Y.teamB - 6], s: C.gold, w: 1.1, dash: '2 3', marker: `url(#${A}-arr)` }));
      act.push(React.createElement(Ln, { key: 'ct2' + i, a: [x + 14, RAIL_Y.teamB - 6], b: [x + 14, RAIL_Y.teamA + 6], s: C.gold, w: 1.1, dash: '2 3', marker: `url(#${A}-arr)` }));
    });
    act.push(React.createElement(Tx, { key: 'ctt', x: 547, y: (RAIL_Y.teamA + RAIL_Y.teamB) / 2 + 3, t: 'cross-talk', size: 8, fill: C.gold, anchor: 'middle' }));
  }
  if (sc.node) {
    act.push(React.createElement('rect', { key: 'nd', x: sc.node.x - 58, y: y0 - 60, width: 116, height: 26, rx: 3, fill: C.paper, style: { stroke: C.accent }, strokeWidth: 1 }));
    act.push(React.createElement(Tx, { key: 'ndt', x: sc.node.x, y: y0 - 49, t: sc.node.t[0], size: 8.5, fill: C.inkStrong, w: 600, anchor: 'middle' }));
    act.push(React.createElement(Tx, { key: 'nds', x: sc.node.x, y: y0 - 39, t: sc.node.t[1], size: 7.5, fill: C.inkSoft, anchor: 'middle' }));
    act.push(React.createElement(Ln, { key: 'ndl', a: [sc.node.x, y0 - 32], b: [sc.node.x, y0 - 4], s: C.accent, w: 0.8, dash: '2 2' }));
    act.push(React.createElement(Ci, { key: 'ndd', c: [sc.node.x, y0], r: 3, f: C.accent, s: 'none' }));
  }
  sc.drops.forEach((d, i) => {
    const fy = d.fromY || y0;
    const fx = FURN_X[d.furnace];
    const jog = d.fromY ? 524 : Math.min(fy + 26, 524);
    act.push(React.createElement(Pa, { key: 'dr' + i, d: `M${d.x},${fy} L${d.x},${jog} L${fx},${jog} L${fx},528`, s: C.accentH, w: 1.3, dash: '3 4', marker: `url(#${A}-arr)`, o: 0.9 }));
    act.push(React.createElement(Ci, { key: 'drd' + i, c: [d.x, fy], r: 2.6, f: C.accentH, s: 'none' }));
    const lx = d.labelLeft ? d.x - 6 : d.x + 6;
    const lanchor = d.labelLeft ? 'end' : 'start';
    const ly = fy + (d.ly || 40);
    act.push(React.createElement(Tx, { key: 'drt' + i, x: lx, y: ly, t: d.t[0], size: 8.5, fill: C.inkStrong, w: 600, anchor: lanchor }));
    act.push(React.createElement(Tx, { key: 'drs' + i, x: lx, y: ly + 11, t: d.t[1], size: 7.5, fill: C.accentH, anchor: lanchor }));
  });
  act.push(React.createElement(Tx, { key: 'gnote', x: 1128, y: 616, t: sc.gateNote, size: 8, fill: C.inkSoft, anchor: 'end', upper: false }));
  els.push(G(act, 'active-' + scenario));

  return React.createElement('svg', { viewBox: '0 0 1140 640', role: 'img', 'aria-label': 'Routing switchyard: a task enters, a switch fans to four orchestration-mode rails, dispatches drop to three model furnaces with effort dials, and every path exits through the phase-boundary gates.', style: { width: '100%', height: 'auto', display: 'block' } }, els);
}

/* ================= LIFECYCLE — the conveyor of hook events ================= */
function hookChip(x, y, name, cls, note) {
  const col = cls === 'hard' ? C.danger : cls === 'once' ? C.warn : cls === 'paused' ? C.inkFaint : C.inkSoft;
  return G([
    React.createElement('rect', { key: 'r', x, y, width: 178, height: 17, rx: 2.5, fill: C.paper, style: { stroke: C.hair }, strokeWidth: 0.7 }),
    React.createElement(cls === 'hard' ? 'rect' : 'circle', cls === 'hard'
      ? { key: 'd', x: x + 6, y: y + 5.5, width: 6, height: 6, fill: col }
      : { key: 'd', cx: x + 9, cy: y + 8.5, r: cls === 'once' ? 3.4 : 2.6, fill: cls === 'once' ? col : 'none', stroke: cls === 'once' ? 'none' : col, strokeWidth: 1 }),
    React.createElement(Tx, { key: 't', x: x + 18, y: y + 12, t: name, size: 8, fill: cls === 'paused' ? C.inkFaint : C.inkStrong, w: 550, upper: false }),
    note ? React.createElement(Tx, { key: 'n', x: x + 172, y: y + 12, t: note, size: 7, fill: col, anchor: 'end' }) : null,
  ], 'hc' + name);
}

function Lifecycle() {
  const A = 'lc-hatch';
  const els = [hatchDefs(A)];
  const BY = 268;
  // belt
  els.push(G([
    React.createElement(Ln, { key: 'b1', a: [60, BY], b: [1080, BY], s: C.hairS, w: 1.2 }),
    React.createElement(Ln, { key: 'b2', a: [60, BY + 10], b: [1080, BY + 10], s: C.hairS, w: 1.2 }),
    ...Array.from({ length: 23 }, (_, i) => React.createElement(Ci, { key: 'ro' + i, c: [82 + i * 44, BY + 20], r: 4.5, s: C.ink, w: 0.7 })),
    ...Array.from({ length: 6 }, (_, i) => React.createElement(Pa, { key: 'cv' + i, d: `M${150 + i * 160},${BY + 2.5} l7,2.5 l-7,2.5`, s: C.accent, w: 1, o: 0.9 })),
  ], 'belt'));

  const stations = [
    {
      x: 130, name: 'SessionStart', sub: 'once, at open', chips: [
        ['session auto-namer', 'inject'], ['ultracode directive', 'inject'], ['session-context inject', 'inject'], ['caveman · instincts', 'inject'],
      ],
    },
    {
      x: 330, name: 'UserPromptSubmit', sub: 'each turn', chips: [
        ['caveman re-assert', 'inject'], ['instinct observer', 'paused', 'paused 07-12'],
      ],
    },
    {
      x: 545, name: 'PreToolUse', sub: 'the chokepoint', barrier: C.danger, chips: [
        ['bash-guard', 'hard', 'deny'], ['cartoon rewrite', 'inject', '−70%'], ['guard-test-scope', 'hard', 'deny'], ['guard-push-gate', 'once', 'remind'], ['guard-generated (W|E)', 'hard', 'deny'],
      ],
    },
    {
      x: 760, name: 'PostToolUse', sub: 'after each call', chips: [
        ['format-file', 'inject', 'no-op'],
      ],
    },
    {
      x: 950, name: 'Stop', sub: 'end of turn', barrier: C.warn, chips: [
        ['stop-log-guard', 'once', 'per tip'], ['/goal gate', 'hard', 'until met'],
      ],
    },
  ];
  stations.forEach((st, si) => {
    const g = [];
    const topY = 196 - st.chips.length * 19;
    g.push(React.createElement(Ln, { key: 'post', a: [st.x, 214], b: [st.x, BY], s: C.ink, w: 0.9 }));
    g.push(React.createElement(Ci, { key: 'pd', c: [st.x, BY - 4], r: 2.4, f: C.accent, s: 'none' }));
    g.push(React.createElement(Tx, { key: 'nm', x: st.x, y: 206, t: st.name, size: 10, fill: C.inkStrong, w: 700, anchor: 'middle', upper: false }));
    g.push(React.createElement(Tx, { key: 'sb', x: st.x, y: 217, t: st.sub, size: 7.5, fill: C.accentH, anchor: 'middle' }));
    st.chips.forEach((c, i) => g.push(hookChip(st.x - 89, topY + i * 19, c[0], c[1], c[2])));
    if (st.barrier) {
      g.push(React.createElement(Ln, { key: 'bp1', a: [st.x - 13, BY - 26], b: [st.x - 13, BY + 12], s: st.barrier, w: 1.6 }));
      g.push(React.createElement(Ln, { key: 'bp2', a: [st.x + 13, BY - 26], b: [st.x + 13, BY + 12], s: st.barrier, w: 1.6 }));
      g.push(React.createElement(Pa, { key: 'bp3', d: `M${st.x - 13},${BY - 26} L${st.x + 13},${BY - 26}`, s: st.barrier, w: 1.6 }));
      g.push(React.createElement(Pa, { key: 'bp4', d: `M${st.x - 13},${BY - 19} L${st.x + 13},${BY - 26} M${st.x - 13},${BY - 12} L${st.x + 13},${BY - 19}`, s: st.barrier, w: 0.8, o: 0.7 }));
    }
    els.push(G(g, 'st' + si));
  });

  // tool loop between Pre and Post
  els.push(G([
    React.createElement(Pa, { key: 'tl', d: `M575,${BY + 34} C 610,${BY + 62} 700,${BY + 62} 735,${BY + 34}`, s: C.ink, w: 0.9, marker: `url(#${A}-arr)` }),
    React.createElement(Tx, { key: 'tt', x: 655, y: BY + 66, t: 'the tool runs', size: 8, anchor: 'middle' }),
    React.createElement(Pa, { key: 'tr', d: `M735,232 C 700,206 610,206 575,230`, s: C.inkSoft, w: 0.8, dash: '3 4', marker: `url(#${A}-arr)` }),
    React.createElement(Tx, { key: 'trt', x: 655, y: 200, t: 'next tool call', size: 8, fill: C.inkFaint, anchor: 'middle' }),
  ], 'toolloop'));

  // legend
  els.push(G([
    React.createElement('rect', { key: 'lr', x: 60, y: BY + 84, width: 570, height: 24, rx: 3, fill: 'none', style: { stroke: C.hair }, strokeWidth: 0.7 }),
    React.createElement('rect', { key: 'l1', x: 74, y: BY + 93, width: 6, height: 6, fill: C.danger }),
    React.createElement(Tx, { key: 'l1t', x: 86, y: BY + 100, t: 'hard — blocks every time', size: 8 }),
    React.createElement(Ci, { key: 'l2', c: [248, BY + 96], r: 3.4, f: C.warn, s: 'none' }),
    React.createElement(Tx, { key: 'l2t', x: 258, y: BY + 100, t: 'block-once — reminds, then passes', size: 8 }),
    React.createElement(Ci, { key: 'l3', c: [478, BY + 96], r: 2.6, s: C.inkSoft, w: 1 }),
    React.createElement(Tx, { key: 'l3t', x: 488, y: BY + 100, t: 'inject / passive', size: 8 }),
  ], 'legend'));

  return React.createElement('svg', { viewBox: '0 0 1140 392', role: 'img', 'aria-label': 'The session lifecycle as a conveyor: five hook events with their guard plates, classed hard, block-once, or passive.', style: { width: '100%', height: 'auto', display: 'block' } }, els);
}

/* ================= TRACKER — two loops with opposite cost profiles ================= */
function Tracker() {
  const A = 'tk-hatch';
  const els = [hatchDefs(A)];

  const plate = (x, y, w, h, title, lines, opts = {}) => G([
    React.createElement('rect', { key: 'r', x, y, width: w, height: h, rx: 4, fill: opts.fill || C.paper, style: { stroke: opts.stroke || C.hairS }, strokeWidth: opts.sw || 1 }),
    React.createElement(Tx, { key: 't', x: x + 12, y: y + 19, t: title, size: 9.5, fill: C.inkStrong, w: 650, upper: false }),
    ...lines.map((l, i) => React.createElement(Tx, { key: 'l' + i, x: x + 12, y: y + 34 + i * 12, t: l, size: 8, fill: opts.lineFill || C.inkSoft, upper: false })),
  ], 'pl' + title + x);

  // capture loop (left)
  els.push(G([
    React.createElement(Tx, { key: 'h', x: 60, y: 52, t: 'capture loop — cheap, instant, chore-tier', size: 9.5, fill: C.accentH, w: 650 }),
    plate(60, 66, 150, 78, '/issue · /feature · /task', ['"found a bug on X"', '"we should build Y"', 'no research, no reads'], {}),
    React.createElement(Pa, { key: 'a1', d: 'M210,105 L266,105', s: C.accent, w: 1.4, marker: `url(#${A}-arr)` }),
    React.createElement(Tx, { key: 'a1t', x: 238, y: 96, t: 'seconds', size: 7.5, anchor: 'middle', fill: C.accentH }),
  ], 'capture'));

  // the ledger (center-left) — drawn as a document sheet with real rows
  const LX = 268, LY = 58, LW = 300, LH = 210;
  const ledger = [
    React.createElement('rect', { key: 'sh', x: LX + 5, y: LY + 5, width: LW, height: LH, fill: 'var(--ds-text)', opacity: 0.05 }),
    React.createElement('rect', { key: 'r', x: LX, y: LY, width: LW, height: LH, fill: C.paper, style: { stroke: C.hairS }, strokeWidth: 1 }),
    React.createElement(Ln, { key: 'hl', a: [LX, LY + 30], b: [LX + LW, LY + 30], s: C.hair, w: 0.7 }),
    React.createElement(Tx, { key: 't', x: LX + 14, y: LY + 20, t: 'docs/tracker/TRACKER.md', size: 9.5, fill: C.inkStrong, w: 650, upper: false }),
    React.createElement(Tx, { key: 'c', x: LX + LW - 14, y: LY + 20, t: 'the ledger', size: 8, fill: C.accentH, anchor: 'end' }),
  ];
  const rows = [
    ['BUG-004', 'barcode overwrites name', 'open · med', C.danger],
    ['BUG-005', 'favorite star unclear', 'open · low', C.danger],
    ['FEAT-003', 'edit an item\u2019s cover photo', 'open · med', C.accent],
    ['FEAT-008', 'voice queries over labels', 'open · med', C.accent],
    ['TASK-002', 'deploy CloudKit prod schema', 'open · crit', C.warn],
    ['TASK-004', 'device checklist A–H', 'open · high', C.warn],
  ];
  rows.forEach((r, i) => {
    const ry = LY + 46 + i * 24;
    ledger.push(React.createElement(Ci, { key: 'rd' + i, c: [LX + 20, ry - 3], r: 2.4, f: r[3], s: 'none', o: 0.9 }));
    ledger.push(React.createElement(Tx, { key: 'ri' + i, x: LX + 30, y: ry, t: r[0], size: 8, fill: C.inkStrong, w: 650 }));
    ledger.push(React.createElement(Tx, { key: 'rt' + i, x: LX + 88, y: ry, t: r[1], size: 7.5, fill: C.inkSoft, upper: false }));
    ledger.push(React.createElement(Tx, { key: 'rs' + i, x: LX + LW - 12, y: ry, t: r[2], size: 7, fill: C.inkFaint, anchor: 'end' }));
    ledger.push(React.createElement(Ln, { key: 'rl' + i, a: [LX + 12, ry + 8], b: [LX + LW - 12, ry + 8], s: C.hair, w: 0.5, o: 0.7 }));
  });
  ledger.push(React.createElement(Tx, { key: 'more', x: LX + 14, y: LY + LH - 8, t: '27 open on this branch · s32–s33 · 2026-07-13', size: 7.5, fill: C.inkFaint }));
  els.push(G(ledger, 'ledger'));

  // /backlog tap
  els.push(G([
    React.createElement(Pa, { key: 'b1', d: `M${LX + 150},${LY + LH} L${LX + 150},${LY + LH + 26}`, s: C.inkSoft, w: 0.9, dash: '3 3', marker: `url(#${A}-arr)` }),
    plate(LX + 92, LY + LH + 28, 116, 34, '/backlog', ['grouped, filtered view'], {}),
  ], 'backlog'));

  // resolve loop (right)
  const RX = 640;
  els.push(G([
    React.createElement(Tx, { key: 'h', x: RX, y: 52, t: 'resolve loop — full ceremony, AGENTS.md throughout', size: 9.5, fill: C.accentH, w: 650 }),
    React.createElement(Pa, { key: 'a2', d: `M${LX + LW},105 L${RX - 14},105`, s: C.accent, w: 1.4, marker: `url(#${A}-arr)` }),
    React.createElement(Tx, { key: 'a2t', x: (LX + LW + RX) / 2, y: 96, t: '/fix BUG-004', size: 8, anchor: 'middle', fill: C.accentH, w: 650 }),
    plate(RX, 66, 128, 66, '1 · group a wave', ['cluster by screen/area', 'recommend /goal first'], {}),
    plate(RX + 148, 66, 128, 66, '2 · plan, then WAIT', ['writing-plans · planner', 'status → planned'], { stroke: C.warn, lineFill: C.inkSoft }),
    plate(RX + 296, 66, 128, 66, '3 · TDD + review', ['failing test first', 'swift-reviewer per phase'], {}),
    plate(RX, 172, 128, 66, '4 · gates + ship', ['compile · tests · review', 'push · docs: checkpoint'], {}),
    plate(RX + 148, 172, 128, 66, '5 · device-verify', ['checklist on real device', 'status → verified'], {}),
    plate(RX + 296, 172, 128, 66, '6 · archive', ['archive/2026-07.md', 'screenshots swept'], {}),
    React.createElement(Pa, { key: 'f1', d: `M${RX + 128},99 L${RX + 146},99`, s: C.ink, w: 1, marker: `url(#${A}-arr)` }),
    React.createElement(Pa, { key: 'f2', d: `M${RX + 276},99 L${RX + 294},99`, s: C.ink, w: 1, marker: `url(#${A}-arr)` }),
    React.createElement(Pa, { key: 'f3', d: `M${RX + 360},132 C ${RX + 360},152 ${RX + 128},148 ${RX + 66},170`, s: C.ink, w: 1, marker: `url(#${A}-arr)` }),
    React.createElement(Pa, { key: 'f4', d: `M${RX + 128},205 L${RX + 146},205`, s: C.ink, w: 1, marker: `url(#${A}-arr)` }),
    React.createElement(Pa, { key: 'f5', d: `M${RX + 276},205 L${RX + 294},205`, s: C.ink, w: 1, marker: `url(#${A}-arr)` }),
    React.createElement(Tx, { key: 'wait', x: RX + 212, y: 148, t: '⏸ user approval', size: 8, fill: C.warn, anchor: 'middle' }),
  ], 'resolve'));

  // learn tap (bottom right)
  els.push(G([
    React.createElement(Pa, { key: 'l1', d: `M${RX + 360},238 L${RX + 360},268 L${RX + 220},268 L${RX + 220},282`, s: C.inkSoft, w: 0.9, dash: '3 3', marker: `url(#${A}-arr)` }),
    React.createElement(Pa, { key: 'l2', d: `M${LX + 240},${LY + LH} C ${LX + 280},330 ${RX - 40},324 ${RX + 118},296`, s: C.inkSoft, w: 0.9, dash: '3 3', o: 0.8 }),
    plate(RX + 130, 284, 180, 52, '/tracker-learn', ['attempts ≥ 2 → patterns report', 'suggest-only — drafts nothing'], { stroke: C.hairS }),
    React.createElement(Tx, { key: 'lt', x: RX + 130, y: 352, t: 'repeat fixes feed skills · AGENTS.md amendments · hooks', size: 7.5, fill: C.inkFaint, upper: false }),
  ], 'learn'));

  return React.createElement('svg', { viewBox: '0 0 1140 366', role: 'img', 'aria-label': 'The dev-tracker: a cheap capture loop appends real items to TRACKER.md; the /fix resolve loop groups a wave, plans, waits for approval, runs TDD and review through the gates, verifies on device, archives; /tracker-learn mines repeat fixes.', style: { width: '100%', height: 'auto', display: 'block' } }, els);
}

/* ================= LOOP — the learning cycle ================= */
function Loop() {
  const A = 'lp-hatch';
  const els = [hatchDefs(A)];
  const cx = 450, cy = 196, rx = 330, ry = 128;
  const node = (x, y, w, title, lines, stamp) => G([
    React.createElement('rect', { key: 'r', x: x - w / 2, y: y - 26, width: w, height: 56, rx: 4, fill: C.paper, style: { stroke: C.hairS }, strokeWidth: 1 }),
    React.createElement(Tx, { key: 't', x, y: y - 8, t: title, size: 9.5, fill: C.inkStrong, w: 650, anchor: 'middle', upper: false }),
    ...lines.map((l, i) => React.createElement(Tx, { key: 'l' + i, x, y: y + 6 + i * 11, t: l, size: 7.5, fill: C.inkSoft, anchor: 'middle', upper: false })),
    stamp ? React.createElement('g', { key: 'st', transform: `rotate(-8 ${x + w / 2 - 20} ${y - 22})` },
      React.createElement('rect', { x: x + w / 2 - 62, y: y - 32, width: 84, height: 18, rx: 2, fill: 'none', style: { stroke: C.warn }, strokeWidth: 1.1 }),
      React.createElement(Tx, { x: x + w / 2 - 20, y: y - 19, t: stamp, size: 7.5, fill: C.warn, w: 700, anchor: 'middle' })) : null,
  ], 'nd' + title);

  const arc = (a0, a1, k) => {
    const p0 = [cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry], p1 = [cx + Math.cos(a1) * rx, cy + Math.sin(a1) * ry];
    const mid = [(p0[0] + p1[0]) / 2 + Math.cos((a0 + a1) / 2) * 40, (p0[1] + p1[1]) / 2 + Math.sin((a0 + a1) / 2) * 26];
    return React.createElement(Pa, { key: k, d: `M${p0[0]},${p0[1]} Q${mid[0]},${mid[1]} ${p1[0]},${p1[1]}`, s: C.accent, w: 1.2, dash: '4 5', o: 0.75, marker: `url(#${A}-arr)` });
  };
  els.push(arc(-Math.PI / 2 + 0.35, -0.35, 'a1'));
  els.push(arc(0.35, Math.PI / 2 - 0.35, 'a2'));
  els.push(arc(Math.PI / 2 + 0.35, Math.PI - 0.35, 'a3'));
  els.push(arc(Math.PI + 0.35, (3 * Math.PI) / 2 - 0.35, 'a4'));

  els.push(node(cx, cy - ry - 24, 240, 'governed work', ['workflow + tiers + adversarial verify'], null));
  els.push(node(cx + rx + 10, cy, 220, 'session logs + memory', ['resume pointers · decisions', 'one fact per file'], null));
  els.push(node(cx, cy + ry + 30, 260, 'instincts', ['272 banked · 0 byte-dupes', 'curation still open'], 'observer paused'));
  els.push(node(cx - rx - 10, cy, 220, 'skills · guards · rules', ['ios-dev mined lessons', 'AGENTS.md amendments'], null));
  els.push(React.createElement(Tx, { key: 'c1', x: cx, y: cy - 4, t: 'every lesson becomes machinery', size: 10, fill: C.inkStrong, w: 650, anchor: 'middle', upper: false }));
  els.push(React.createElement(Tx, { key: 'c2', x: cx, y: cy + 12, t: 'the next session starts smarter than the last', size: 8.5, fill: C.inkSoft, anchor: 'middle', upper: false }));

  return React.createElement('svg', { viewBox: '0 0 900 400', role: 'img', 'aria-label': 'The learning cycle: governed work writes session logs and memory, mined into instincts (observer currently paused), codified as skills, guards, and rules that govern the next session.', style: { width: '100%', height: 'auto', display: 'block', maxWidth: 900, margin: '0 auto' } }, els);
}

window.FoundryHarness = { Hall, Switchyard, Lifecycle, Tracker, Loop };
