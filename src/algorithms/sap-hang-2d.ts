import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, tokens, need } from './_shared';
import source from '../../webcode2/sap_hang_2d.cpp?raw';

export interface RankPoint { label: string; x: number; y: number }
export interface RankInput { points: RankPoint[] }

interface Prepared {
  xs: number[]; ys: number[]; yRank: number[]; order: number[]; levels: number;
}

function prepare(points: RankPoint[]): Prepared {
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const levels = [...new Set(ys)].sort((a, b) => a - b);
  const yRank = ys.map(y => levels.indexOf(y) + 1);
  const order = points.map((_, i) => i).sort((a, b) => xs[a] !== xs[b] ? xs[a] - xs[b] : ys[a] - ys[b]);
  return { xs, ys, yRank, order, levels: levels.length };
}

function* dominance(input: RankInput): Generator<SimulationEvent> {
  const emit = emitter(source);
  const n = input.points.length;
  const { xs, ys, yRank, order, levels } = prepare(input.points);
  const rank = Array(n).fill(0), bit = Array(levels + 2).fill(0);
  const bitAdd = (i: number, v: number) => { for (; i < bit.length; i += i & -i) bit[i] += v; };
  const bitSum = (i: number) => { let s = 0; for (; i > 0; i -= i & -i) s += bit[i]; return s; };
  const state: VisualState = {
    values: [...rank],
    labels: input.points.map(p => p.label),
    secondary: [...bit], secondaryLabel: 'cây BIT',
    points: input.points.map(p => ({ x: p.x, y: p.y, label: p.label })),
    variables: { n },
  };
  const sync = () => { state.values = [...rank]; state.secondary = [...bit]; };
  const name = (i: number) => input.points[i].label;
  yield emit('update', `Sắp ${n} điểm theo x tăng, nén y còn ${levels} mức.`, state, 1, 'sort(theoX.begin(), theoX.end()', 0, false);
  function* cdq(l: number, r: number, depth: number): Generator<SimulationEvent> {
    state.variables = { left: l, right: r, doSau: depth }; state.active = []; state.marked = [];
    if (l >= r) {
      yield emit('check', `Đoạn [${l}] một điểm, dừng.`, state, 2, 'int mid = (l + r) / 2;', depth, true);
      return;
    }
    if (xs[order[l]] === xs[order[r]]) {
      yield emit('check', `Cụm [${l}, ${r}] cùng hoành độ, bỏ qua.`, state, 2, 'if (X[theoX[l]] == X[theoX[r]]) return;', depth, true);
      return;
    }
    const mid = Math.floor((l + r) / 2);
    // Dời biên khỏi cụm cùng x để nửa trái < nửa phải thật (mọi điểm trái đều đủ điều kiện x).
    let k = mid;
    if (xs[order[k]] === xs[order[k + 1]]) {
      let a = k;
      while (a > l && xs[order[a - 1]] === xs[order[k]]) a--;
      let b = k + 1;
      while (b < r && xs[order[b + 1]] === xs[order[k + 1]]) b++;
      k = (a > l && (b >= r || mid - (a - 1) <= b - mid)) ? a - 1 : b;
    }
    state.variables = { left: l, mid: k, right: r, doSau: depth };
    yield emit('check', `Chia [${l}, ${r}] tại k = ${k}.`, state, 2, 'int mid = (l + r) / 2;', depth, true);
    yield* cdq(l, k, depth + 1);
    yield* cdq(k + 1, r, depth + 1);
    // Nửa trái < nửa phải thật nên quét thuần theo y: mọi điểm cộng vào đều đủ điều kiện x.
    const left = order.slice(l, k + 1).sort((a, b) => ys[a] - ys[b]);
    const right = order.slice(k + 1, r + 1).sort((a, b) => ys[a] - ys[b]);
    let p = 0;
    const added: number[] = [];
    for (const q of right) {
      while (p < left.length && ys[left[p]] < ys[q]) {
        const u = left[p];
        bitAdd(yRank[u], 1); added.push(u); p++;
        sync();
        state.active = [q]; state.marked = [u];
        state.variables = { diem: name(q), cong: name(u), doSau: depth, trai: l, giua: k, phai: r };
        yield emit('check', `${name(u)} có y nhỏ hơn ${name(q)}: cộng vào BIT.`, state, 3, 'bitThem(hangY[trai[p]], 1);', depth, true);
      }
      const cnt = bitSum(yRank[q] - 1);
      state.active = [q];
      state.marked = [...added];
      state.variables = { diem: name(q), them: cnt, hang: rank[q] + cnt, doSau: depth };
      sync();
      if (cnt > 0) {
        rank[q] += cnt; sync();
        yield emit('update', `${name(q)} thêm ${cnt}, hạng = ${rank[q]}.`, state, 4, 'hang[q] += bitTong(hangY[q] - 1);', depth, false);
      } else {
        yield emit('check', `${name(q)} không thêm điểm nào.`, state, 4, 'hang[q] += bitTong(hangY[q] - 1);', depth, true);
      }
    }
    for (const u of added) bitAdd(yRank[u], -1);
    sync();
  }
  yield* cdq(0, n - 1, 0);
  for (let i = 0; i < n; i++) {
    state.active = [i]; state.marked = [];
    state.variables = { diem: name(i), hang: rank[i], doSau: 0 };
    sync();
    state.outputs = [`${name(i)} ${rank[i]}`];
    yield emit('output', `Hạng ${name(i)} = ${rank[i]}.`, state, 5, "cout << ten[i]", 0, false);
  }
  state.active = [];
  state.variables = { n, doSau: 0 };
  state.result = `Đã xếp hạng ${n} điểm.`;
  yield emit('complete', state.result, state, 5, "cout << ten[i]", 0, false);
}

const slide: RankInput = {
  points: [
    { label: 'A', x: 1, y: 1 }, { label: 'B', x: 2, y: 3 }, { label: 'C', x: 3, y: 2 },
    { label: 'D', x: 4, y: 4 }, { label: 'E', x: 5, y: 0 },
  ],
};

export const sapHang2d: Algorithm = {
  id: 'sap-hang-2d', title: 'Sắp hạng 2D', category: 'Chia để trị', tags: ['Trội 2D', 'Fenwick'], complexity: 'O(n·log²n)',
  description: 'Hạng mỗi điểm bằng số điểm nó trội hơn (x và y đều lớn hơn)',
  goal: 'Chia đôi theo x, quét theo y, dùng BIT đếm điểm trội hơn.',
  inputFormat: 'Dòng 1: n. Tiếp theo n dòng: nhãn x y. Tối đa 200 điểm.',
  note: 'Chia để trị kiểu CDQ: sắp theo x tăng rồi chia đôi; khi trộn chỉ cộng điểm trái có x nhỏ hơn thật và truy vấn y nhỏ hơn thật nên bằng nhau không tính. BIT dọn sạch sau mỗi lần trộn.',
  source,
  pseudocode: [
    'Sắp theo x tăng, nén y',
    'Chia [l, r] tại biên cụm (trái < phải); đệ quy hai nửa',
    'Quét theo y, cộng điểm trái vào BIT',
    'Hạng điểm = số điểm trái có y nhỏ hơn',
    'In hạng từng điểm',
  ],
  presets: [
    preset('Ví dụ 4: A–E', slide, '5 điểm · hạng D = 3'),
    preset('Cùng hoành độ', { points: [{ label: 'A', x: 0, y: 0 }, { label: 'B', x: 0, y: 5 }, { label: 'C', x: 0, y: 2 }] }, 'Không điểm nào trội hơn'),
    preset('Một điểm', { points: [{ label: 'P', x: 4, y: 7 }] }, 'Hạng duy nhất bằng 0'),
  ],
  example: `5\nA 1 1\nB 2 3\nC 3 2\nD 4 4\nE 5 0`,
  kind: 'array',
  validate: i => {
    const points = i?.points;
    if (!Array.isArray(points) || points.length < 1 || points.length > 200) return 'Cần 1..200 điểm.';
    if (!points.every((p: any) => typeof p?.label === 'string' && p.label.length >= 1 && p.label.length <= 8 && Number.isSafeInteger(p?.x) && Number.isSafeInteger(p?.y) && Math.abs(p.x) <= 1e9 && Math.abs(p.y) <= 1e9)) return 'Nhãn dài 1..8 ký tự, tọa độ nguyên.';
    if (new Set(points.map((p: any) => p.label)).size !== points.length) return 'Nhãn điểm phải phân biệt.';
    return null;
  },
  initial: i => {
    const points = (i as RankInput).points;
    const { levels } = prepare(points);
    return {
      values: Array(points.length).fill(0),
      labels: points.map(p => p.label),
      secondary: Array(levels + 2).fill(0), secondaryLabel: 'cây BIT',
      points: points.map(p => ({ x: p.x, y: p.y, label: p.label })),
    };
  },
  simulate: dominance,
  parseInput: raw => {
    const t = tokens(raw);
    need(t.length >= 4, 'Cần n và ít nhất một điểm nhãn x y.');
    const n = Number(t[0]);
    need(Number.isInteger(n) && n > 0 && n <= 200, 'n phải từ 1 đến 200.');
    need(t.length === 1 + 3 * n, `Cần đúng ${1 + 3 * n} token: n rồi n dòng nhãn x y.`);
    const points: RankPoint[] = [];
    for (let k = 0; k < n; k++) {
      const label = t[1 + 3 * k], x = Number(t[1 + 3 * k + 1]), y = Number(t[1 + 3 * k + 2]);
      need(label.length >= 1 && label.length <= 8 && Number.isSafeInteger(x) && Number.isSafeInteger(y), `Điểm ${k + 1} không hợp lệ.`);
      points.push({ label, x, y });
    }
    need(new Set(points.map(p => p.label)).size === n, 'Nhãn điểm phải phân biệt.');
    return { points };
  },
  randomInput: () => {
    const n = ri(3, 7), used = new Set<string>(), points: string[] = [];
    while (points.length < n) {
      const label = String.fromCharCode(65 + ri(0, 25)) + (used.size >= 26 ? String(points.length) : '');
      if (used.has(label)) continue;
      used.add(label);
      points.push(`${label} ${ri(0, 9)} ${ri(0, 9)}`);
    }
    return `${n}\n${points.join('\n')}`;
  },
} as Algorithm;
