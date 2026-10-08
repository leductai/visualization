import type { Algorithm, SimulationEvent, VisualState, LPLine, LPVertex } from '../engine/types';
import { emitter } from './events';
import { preset, ri, need } from './_shared';
import source from '../../webcode2/quy_hoach_tuyen_tinh.cpp?raw';

export type LPSense = 'max' | 'min';
export interface LPConstraint { a: number; b: number; op: '<=' | '>=' | '='; c: number; raw: string }
export interface LPInput { cx: number; cy: number; sense: LPSense; cons: LPConstraint[] }

const EPS = 1e-9;
const fmt = (v: number) => {
  const r = Math.abs(v) < 0.00005 ? 0 : Math.round(v * 10000) / 10000;
  return String(r);
};

/** Phân tích vế trái dạng ax + by, vd "3x + 2y", "-x", "y", "3*x". */
export function parseSide(expr: string): { a: number; b: number } {
  const s = expr.replace(/\s+/g, '').replace(/\*/g, '');
  need(s.length > 0, `Vế trái trống: "${expr}".`);
  need(!/[^0-9xy.+-]/i.test(s), `Ký tự lạ trong "${expr}" (chỉ dùng x, y, số).`);
  let a = 0, b = 0, found = false;
  for (const term of s.replace(/-/g, '+-').split('+').filter(t => t.length > 0)) {
    const m = term.match(/^([+-]?\d*\.?\d*)([xy])$/i);
    need(!!m, `Hạng thức không hiểu: "${term}".`);
    const coef = m![1];
    const v = coef === '' || coef === '+' ? 1 : coef === '-' ? -1 : Number(coef);
    need(Number.isFinite(v), `Hệ số không hợp lệ: "${term}".`);
    if (m![2].toLowerCase() === 'x') a += v; else b += v;
    found = true;
  }
  need(found, `Thiếu x hoặc y trong "${expr}".`);
  return { a, b };
}

export function parseObjective(line: string): { cx: number; cy: number; sense: LPSense } {
  let s = line.trim(), sense: LPSense | null = null;
  const head = s.match(/^(maximize|minimize|max|min)\b/i);
  if (head) { sense = /^min/i.test(head[1]) ? 'min' : 'max'; s = s.slice(head[0].length); }
  const tail = s.match(/->\s*(maximize|minimize|max|min)\s*$/i);
  if (tail) { sense = /^min/i.test(tail[1]) ? 'min' : 'max'; s = s.slice(0, tail.index); }
  need(sense !== null, 'Dòng mục tiêu phải ghi max hoặc min (vd "max 3x + 2y").');
  s = s.trim().replace(/^[a-zA-Z]\s*=\s*/, '').trim();
  const { a, b } = parseSide(s);
  return { cx: a, cy: b, sense: sense! };
}

export function parseConstraint(line: string): LPConstraint {
  const m = line.trim().match(/^(.*?)(<=|>=|=|<|>)(.*)$/);
  need(!!m, `Ràng buộc phải có <=, >= hoặc =: "${line}".`);
  const side = m![1];
  need(/x/i.test(side) || /y/i.test(side), `Ràng buộc thiếu x/y: "${line}".`);
  const { a, b } = parseSide(side);
  const c = Number(m![3].trim());
  need(Number.isFinite(c), `Vế phải không phải số: "${line}".`);
  const op = m![2] === '<' ? '<=' : m![2] === '>' ? '>=' : (m![2] as LPConstraint['op']);
  return { a, b, op, c, raw: line.trim() };
}

function boundsOf(pts: { x: number; y: number }[]): [number, number, number, number] {
  let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
  for (const p of pts) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    xmin = Math.min(xmin, p.x); xmax = Math.max(xmax, p.x);
    ymin = Math.min(ymin, p.y); ymax = Math.max(ymax, p.y);
  }
  if (!Number.isFinite(xmin)) { xmin = -1; xmax = 7; ymin = -1; ymax = 7; }
  xmin -= 1.5; xmax += 1.5; ymin -= 1.5; ymax += 1.5;
  if (xmax - xmin < 6) { const mid = (xmax + xmin) / 2; xmin = mid - 3; xmax = mid + 3; }
  if (ymax - ymin < 6) { const mid = (ymax + ymin) / 2; ymin = mid - 3; ymax = mid + 3; }
  return [xmin, xmax, ymin, ymax];
}

export function lpBounds(input: LPInput): [number, number, number, number] {
  const pts: { x: number; y: number }[] = [{ x: 0, y: 0 }];
  for (const k of input.cons) {
    const a = k.op === '>=' ? -k.a : k.a, b = k.op === '>=' ? -k.b : k.b, c = k.op === '>=' ? -k.c : k.c;
    if (Math.abs(a) > EPS) pts.push({ x: c / a, y: 0 });
    if (Math.abs(b) > EPS) pts.push({ x: 0, y: c / b });
  }
  return boundsOf(pts);
}

function* lpSim(input: LPInput): Generator<SimulationEvent> {
  const emit = emitter(source);
  const { cx, cy, sense } = input;
  const lines: LPLine[] = input.cons.map(k =>
    k.op === '>=' ? { a: -k.a, b: -k.b, c: -k.c, raw: k.raw } : { a: k.a, b: k.b, c: k.c, raw: k.raw });
  const isEq = input.cons.map(k => k.op === '=');
  const feas = (x: number, y: number) => lines.every((L, i) =>
    isEq[i] ? Math.abs(L.a * x + L.b * y - L.c) <= 1e-7 : L.a * x + L.b * y <= L.c + 1e-7);
  const [xmin, xmax, ymin, ymax] = lpBounds(input);
  const state: VisualState = {
    lp: { cx, cy, sense, lines, verts: [], best: -1, xmin, xmax, ymin, ymax, status: 'optimal' },
    variables: { rangBuoc: lines.length },
  };
  const tag = sense === 'max' ? 'max' : 'min';
  yield emit('check', `Chuẩn hóa ${lines.length} ràng buộc về a·x + b·y ≤ c, mục tiêu ${tag} Z = ${fmt(cx)}x + ${fmt(cy)}y.`, state, 1, 'thoa(x, y)');

  const verts: LPVertex[] = [];
  for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) {
    const det = lines[i].a * lines[j].b - lines[j].a * lines[i].b;
    if (Math.abs(det) < EPS) {
      yield emit('check', `R${i + 1} ∥ R${j + 1} nên không có giao điểm.`, state, 2, 'dinhThuc');
      continue;
    }
    const x = (lines[i].c * lines[j].b - lines[j].c * lines[i].b) / det;
    const y = (lines[i].a * lines[j].c - lines[j].a * lines[i].c) / det;
    if (verts.some(v => Math.hypot(v.x - x, v.y - y) < 1e-7)) {
      yield emit('check', `Giao R${i + 1}∩R${j + 1} = (${fmt(x)}, ${fmt(y)}) trùng đỉnh đã có.`, state, 2, 'dinhThuc');
      continue;
    }
    if (!feas(x, y)) {
      yield emit('check', `Giao R${i + 1}∩R${j + 1} = (${fmt(x)}, ${fmt(y)}) vi phạm ràng buộc → loại.`, state, 2, 'dinhThuc');
      continue;
    }
    const z = cx * x + cy * y;
    verts.push({ x, y, z });
    state.lp = { ...state.lp!, verts: [...verts] };
    state.active = [verts.length - 1];
    state.marked = verts.map((_, k) => k);
    state.variables = { x: fmt(x), y: fmt(y), Z: fmt(z), dinh: verts.length };
    yield emit('accept', `Đỉnh ${verts.length}: (${fmt(x)}, ${fmt(y)}), Z = ${fmt(z)}.`, state, 3, 'dinh.push_back');
  }

  if (verts.length === 0) {
    // Không có đỉnh vẫn có thể khả thi (nửa mặt phẳng / dải): thử gốc tọa độ và điểm trên mỗi đường.
    const samples: { x: number; y: number }[] = [{ x: 0, y: 0 }];
    for (const L of lines) {
      if (Math.hypot(L.a, L.b) < EPS) continue;
      const n = Math.hypot(L.a, L.b), ux = -L.b / n, uy = L.a / n;
      const base = Math.abs(L.a) >= Math.abs(L.b) ? { x: L.c / L.a, y: 0 } : { x: 0, y: L.c / L.b };
      samples.push(base, { x: base.x + ux, y: base.y + uy }, { x: base.x - ux, y: base.y - uy });
    }
    const ok = samples.some(p => feas(p.x, p.y));
    state.lp = { ...state.lp!, status: ok ? 'unbounded' : 'infeasible' };
    state.active = [];
    if (!ok) {
      state.result = 'Vô nghiệm: không có điểm nào thỏa mọi ràng buộc.';
      state.outputs = [state.result];
      yield emit('complete', state.result, state, 5, 'vo_nghiem');
    } else {
      state.result = 'Không giới nội: miền nghiệm không rỗng nhưng không có đỉnh chặn.';
      state.outputs = [state.result];
      yield emit('output', state.result, state, 6, 'cout << fixed');
      yield emit('complete', state.result, state, 6, 'cout << fixed');
    }
    return;
  }

  // Đồ thị 2 biến: tia không giới nội (nếu có) là pháp tuyến xoay của một ràng buộc.
  const dirs: { x: number; y: number }[] = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }, { x: cx, y: cy }];
  for (const L of lines) { const n = Math.hypot(L.a, L.b) || 1; dirs.push({ x: -L.b / n, y: L.a / n }, { x: L.b / n, y: -L.a / n }); }
  const ray = dirs.find(d =>
    lines.every((L, i) => isEq[i] ? Math.abs(L.a * d.x + L.b * d.y) <= 1e-7 : L.a * d.x + L.b * d.y <= 1e-9) &&
    (sense === 'max' ? cx * d.x + cy * d.y > 1e-9 : cx * d.x + cy * d.y < -1e-9));
  let best = 0;
  for (let k = 0; k < verts.length; k++) {
    const better = sense === 'max' ? verts[k].z > verts[best].z + 1e-9 : verts[k].z < verts[best].z - 1e-9;
    if (k === 0 || better) {
      best = k;
      state.lp = { ...state.lp!, best };
      state.path = [best];
      state.variables = { dinhTot: best + 1, Ztot: fmt(verts[best].z) };
      yield emit('update', `Tốt nhất hiện tại: đỉnh ${best + 1} với Z = ${fmt(verts[best].z)}.`, state, 4, 'totNhat');
    }
  }
  if (ray) {
    state.lp = { ...state.lp!, status: 'unbounded' };
    state.result = `Không giới nội: từ đỉnh ${best + 1} đi theo tia (${fmt(ray.x)}, ${fmt(ray.y)}) thì Z ${tag === 'max' ? 'tăng' : 'giảm'} mãi.`;
    state.outputs = [state.result];
    yield emit('output', state.result, state, 5, 'vo_nghiem');
    yield emit('complete', state.result, state, 6, 'cout << fixed');
    return;
  }
  const v = verts[best];
  state.lp = { ...state.lp!, best, status: 'optimal' };
  state.active = [best]; state.path = [best];
  state.variables = { x: fmt(v.x), y: fmt(v.y), Z: fmt(v.z) };
  state.result = `Tối ưu (${fmt(v.x)}, ${fmt(v.y)}) · Z = ${fmt(v.z)}.`;
  state.outputs = [state.result];
  yield emit('output', `Nghiệm tối ưu: x = ${fmt(v.x)}, y = ${fmt(v.y)}, Z = ${fmt(v.z)}.`, state, 6, 'cout << fixed');
  yield emit('complete', state.result, state, 6, 'cout << fixed');
}

const ex1: LPInput = {
  cx: 3, cy: 2, sense: 'max',
  cons: [
    { a: 2, b: 1, op: '<=', c: 10, raw: '2x + y <= 10' },
    { a: 1, b: 2, op: '<=', c: 8, raw: 'x + 2y <= 8' },
    { a: 1, b: 0, op: '>=', c: 0, raw: 'x >= 0' },
    { a: 0, b: 1, op: '>=', c: 0, raw: 'y >= 0' },
  ],
};

export const quyHoachTuyenTinh: Algorithm = {
  id: 'quy-hoach-tuyen-tinh', title: 'Quy hoạch tuyến tính', category: 'Tối ưu',
  tags: ['Phương pháp đồ thị', '2 biến'], complexity: 'O(m²)',
  description: 'Tối ưu hàm tuyến tính 2 biến bằng phương pháp đồ thị',
  goal: 'Vẽ miền nghiệm trên mặt phẳng X–Y rồi trượt đường đẳng trị Z tới đỉnh tốt nhất.',
  inputFormat: 'Dòng 1: max/min và hàm mục tiêu (vd "max 3x + 2y"). Các dòng sau: mỗi dòng 1 ràng buộc (vd "2x + y <= 10").',
  note: 'C++ tham chiếu đọc dạng số đã chuẩn hóa (sense cx cy / m / a b c); giao diện nhận dạng đại số rồi chuẩn hóa về dạng đó. Phát hiện vô nghiệm và không giới nội theo đúng lý thuyết đồ thị.',
  source,
  pseudocode: [
    'Chuẩn hóa mọi ràng buộc về a·x + b·y ≤ c',
    'Giao từng cặp đường thẳng biên',
    'Giữ giao điểm thỏa mọi ràng buộc làm đỉnh',
    'Tính Z tại mỗi đỉnh, giữ đỉnh tốt nhất',
    'Kết luận vô nghiệm / không giới nội nếu có',
    'In nghiệm tối ưu và Z',
  ],
  presets: [
    preset('Mẫu 3x+2y', ex1, 'Tối ưu (4, 2) · Z = 16'),
    preset('Vô nghiệm', {
      cx: 1, cy: 1, sense: 'max',
      cons: [
        { a: 1, b: 1, op: '<=', c: -1, raw: 'x + y <= -1' },
        { a: 1, b: 0, op: '>=', c: 0, raw: 'x >= 0' },
        { a: 0, b: 1, op: '>=', c: 0, raw: 'y >= 0' },
      ],
    }, 'Miền nghiệm rỗng'),
    preset('Không giới nội', {
      cx: 1, cy: 1, sense: 'max',
      cons: [
        { a: 1, b: 0, op: '>=', c: 0, raw: 'x >= 0' },
        { a: 0, b: 1, op: '>=', c: 0, raw: 'y >= 0' },
      ],
    }, 'Z tăng vô hạn'),
  ],
  example: 'max 3x + 2y\n2x + y <= 10\nx + 2y <= 8\nx >= 0\ny >= 0',
  kind: 'chart',
  validate: i => {
    if (!i || (i.sense !== 'max' && i.sense !== 'min') || !Number.isFinite(i.cx) || !Number.isFinite(i.cy)) return 'Thiếu hàm mục tiêu max/min với hệ số hợp lệ.';
    if (!Array.isArray(i.cons) || i.cons.length < 1 || i.cons.length > 12) return 'Cần 1..12 ràng buộc.';
    const bad = i.cons.some((k: any) =>
      !Number.isFinite(k?.a) || !Number.isFinite(k?.b) || !Number.isFinite(k?.c) ||
      Math.abs(k.a) > 1e6 || Math.abs(k.b) > 1e6 || Math.abs(k.c) > 1e9 ||
      (k.op !== '<=' && k.op !== '>=' && k.op !== '=') || (k.a === 0 && k.b === 0));
    return bad ? 'Ràng buộc phải dạng ax + by <=/>=/= c với hệ số hợp lệ.' : null;
  },
  initial: i => {
    const [xmin, xmax, ymin, ymax] = lpBounds(i);
    const lines: LPLine[] = i.cons.map((k: LPConstraint) =>
      k.op === '>=' ? { a: -k.a, b: -k.b, c: -k.c, raw: k.raw } : { a: k.a, b: k.b, c: k.c, raw: k.raw });
    return { lp: { cx: i.cx, cy: i.cy, sense: i.sense, lines, verts: [], best: -1, xmin, xmax, ymin, ymax, status: 'optimal' } };
  },
  simulate: lpSim,
  parseInput: raw => {
    const ls = raw.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
    need(ls.length >= 2, 'Cần 1 dòng mục tiêu và ít nhất 1 ràng buộc.');
    const obj = parseObjective(ls[0]);
    const cons = ls.slice(1).map(parseConstraint);
    need(cons.length <= 12, 'Tối đa 12 ràng buộc.');
    return { ...obj, cons };
  },
  randomInput: () => {
    const sense = Math.random() < 0.5 ? 'max' : 'min';
    const cx = ri(1, 5), cy = ri(1, 5);
    const rx = ri(3, 8), ry = ri(3, 8);
    const lines = [`x <= ${rx}`, `y <= ${ry}`, 'x >= 0', 'y >= 0'];
    if (Math.random() < 0.6) lines.push(`${ri(1, 3)}x + ${ri(1, 3)}y <= ${ri(6, 14)}`);
    return `${sense} ${cx}x + ${cy}y\n${lines.join('\n')}`;
  },
} as Algorithm;
