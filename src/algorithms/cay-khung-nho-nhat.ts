import type { Algorithm, SimulationEvent, VisualState, GraphEdge } from '../engine/types';
import { emitter } from './events';
import { preset, ri, tokens, need } from './_shared';
import source from '../../webcode2/cay_khung_nho_nhat.cpp?raw';

export interface MSTEdge { u: number; v: number; w: number } // đỉnh 0-based
export interface MSTInput { n: number; edges: MSTEdge[]; pos?: { x: number; y: number }[]; names?: string[] }

const fmtE = (e: MSTEdge) => `(${e.u + 1}, ${e.v + 1}, w=${e.w})`;

function layout(n: number, pos?: { x: number; y: number }[]) {
  if (pos && pos.length === n) return pos;
  return Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / Math.max(1, n) - Math.PI / 2;
    return { x: Math.round(Math.cos(a) * 10 * 100) / 100, y: Math.round(Math.sin(a) * 10 * 100) / 100 };
  });
}

function* mst(input: MSTInput): Generator<SimulationEvent> {
  const emit = emitter(source);
  const { n, edges } = input;
  const m = edges.length;
  const nodes = layout(n, input.pos).map((p, i) => ({ id: i, label: input.names?.[i] ?? String(i + 1), x: p.x, y: p.y }));
  const status: GraphEdge['status'][] = Array(m).fill('undecided');
  const snap = (): GraphEdge[] => edges.map((e, k) => ({ u: e.u, v: e.v, w: e.w, status: status[k] }));
  const find = (p: number[], x: number): number => (p[x] === x ? x : find(p, p[x]));
  let best = Infinity, bestEdges: number[] = [];
  const state: VisualState = {
    graph: { nodes, edges: snap(), best: [], bestTotal: null },
    variables: { dinh: n, canh: m },
  };
  yield emit('check', `Đồ thị ${n} đỉnh, ${m} cạnh. Liệt kê chọn/bỏ từng cạnh, cắt nhánh khi tạo chu trình.`, state, 1, 'quayLui(int i');

  function* bt(i: number, taken: number[], total: number, parent: number[]): Generator<SimulationEvent> {
    if (i === m) {
      if (taken.length === n - 1 && total < best) {
        best = total; bestEdges = [...taken];
        state.graph = { nodes, edges: snap(), best: [...bestEdges], bestTotal: best };
        state.path = [...bestEdges];
        state.variables = { cayTot: best, soCanh: taken.length };
        state.outputs = [`Cây tốt hơn: tổng ${best}.`];
        yield emit('output', `Được cây khung tổng ${best} với các cạnh ${bestEdges.map(k => k + 1).join(', ')}.`, state, 5, 'totNhat');
      } else if (taken.length !== n - 1) {
        yield emit('check', `Hết cạnh nhưng chỉ chọn được ${taken.length}/${n - 1} → nhánh cụt.`, state, 5, 'totNhat');
      }
      return;
    }
    const e = edges[i];
    status[i] = 'current'; state.active = [i];
    state.graph = { nodes, edges: snap(), best: [...bestEdges], bestTotal: best === Infinity ? null : best };
    state.variables = { i: i + 1, u: e.u + 1, v: e.v + 1, w: e.w, daChon: taken.length, tong: total };
    yield emit('check', `Xét cạnh ${i + 1}/${m} ${fmtE(e)}. Đã chọn ${taken.length}, tổng ${total}.`, state, 1, 'quayLui(int i');
    if (total >= best) {
      status[i] = 'undecided'; state.active = [];
      state.graph = { nodes, edges: snap(), best: [...bestEdges], bestTotal: best === Infinity ? null : best };
      yield emit('check', `Cắt nhánh: tổng ${total} ≥ tốt nhất ${best}.`, state, 1, 'quayLui(int i');
      return;
    }
    if (find(parent, e.u) === find(parent, e.v)) {
      status[i] = 'skipped';
      state.graph = { nodes, edges: snap(), best: [...bestEdges], bestTotal: best === Infinity ? null : best };
      state.variables = { i: i + 1, u: e.u + 1, v: e.v + 1, lyDo: 'chu trình' };
      yield emit('reject', `Cạnh ${i + 1} ${fmtE(e)} tạo chu trình → bỏ qua.`, state, 2, 'taoChuTrinh');
      status[i] = 'undecided';
      yield* bt(i + 1, taken, total, parent);
      return;
    }
    // Nhánh chọn.
    const next = [...parent]; next[find(next, e.u)] = find(next, e.v);
    status[i] = 'chosen'; taken.push(i);
    state.graph = { nodes, edges: snap(), best: [...bestEdges], bestTotal: best === Infinity ? null : best };
    state.marked = [...taken]; state.variables = { i: i + 1, chon: i + 1, tong: total + e.w };
    yield emit('accept', `Chọn cạnh ${i + 1} ${fmtE(e)}. Tổng tạm ${total + e.w}.`, state, 3, 'hopNhat');
    yield* bt(i + 1, taken, total + e.w, next);
    // Hoàn tác rồi thử nhánh bỏ.
    taken.pop(); status[i] = 'undecided'; state.marked = [...taken];
    state.graph = { nodes, edges: snap(), best: [...bestEdges], bestTotal: best === Infinity ? null : best };
    yield emit('undo', `Hoàn tác cạnh ${i + 1}, thử nhánh bỏ qua.`, state, 6, 'chon.pop_back');
    if (taken.length + (m - i - 1) >= n - 1) {
      status[i] = 'skipped';
      state.graph = { nodes, edges: snap(), best: [...bestEdges], bestTotal: best === Infinity ? null : best };
      yield emit('reject', `Bỏ cạnh ${i + 1} ${fmtE(e)} (không chọn).`, state, 6, 'boQua');
      status[i] = 'undecided';
      yield* bt(i + 1, taken, total, parent);
    } else {
      yield emit('check', `Bỏ cạnh ${i + 1} thì không đủ ${n - 1} cạnh → cắt nhánh bỏ.`, state, 6, 'boQua');
    }
    state.active = [];
  }

  yield* bt(0, [], 0, Array.from({ length: n }, (_, i) => i));
  bestEdges.forEach(k => { status[k] = 'chosen'; });
  state.active = []; state.marked = [...bestEdges]; state.path = [...bestEdges];
  state.graph = { nodes, edges: snap(), best: [...bestEdges], bestTotal: best === Infinity ? null : best };
  if (best === Infinity) {
    state.result = 'Vô nghiệm: đồ thị không liên thông, không có cây khung.';
    state.outputs = [state.result];
    yield emit('complete', state.result, state, 5, 'vo_nghiem');
  } else {
    state.variables = { cayTot: best, soCanh: bestEdges.length };
    state.result = `Cây khung nhỏ nhất tổng ${best} · cạnh ${bestEdges.map(k => `${k + 1}${fmtE(edges[k])}`).join(', ')}.`;
    state.outputs = [state.result];
    yield emit('output', `Nghiệm tối ưu: tổng ${best}.`, state, 6, 'cout << totNhat');
    yield emit('complete', state.result, state, 6, 'cout << totNhat');
  }
}

const sketchPos = [
  { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 },
  { x: 0, y: 1 }, { x: 2, y: 1 },
  { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
  { x: 3, y: 0 },
];
const sketchEdges: MSTEdge[] = [
  { u: 0, v: 1, w: 6 }, { u: 1, v: 2, w: 9 }, { u: 0, v: 3, w: 14 },
  { u: 1, v: 6, w: 5 }, { u: 1, v: 4, w: 12 }, { u: 3, v: 5, w: 3 },
  { u: 3, v: 6, w: 8 }, { u: 4, v: 7, w: 7 }, { u: 6, v: 7, w: 10 },
  { u: 7, v: 8, w: 15 },
];

export const cayKhungNhoNhat: Algorithm = {
  id: 'cay-khung-nho-nhat', title: 'Cây khung nhỏ nhất', category: 'Quay lui',
  tags: ['Backtracking', 'DSU', 'Cắt nhánh'], complexity: 'O(2^m)',
  description: 'Liệt kê cây khung bằng quay lui chọn/bỏ từng cạnh',
  goal: 'Thử chọn từng cạnh, loại nhánh tạo chu trình, giữ cây tổng nhỏ nhất.',
  inputFormat: 'Dòng 1: n m. Tiếp theo m dòng u v w (đỉnh 1-based). Tùy chọn: thêm n dòng x y làm tọa độ vẽ.',
  note: 'Cạnh 5 nối Trên-giữa → Dưới-giữa theo đúng cột trong hình mẫu (9 đỉnh, 10 cạnh). Đồ thị không liên thông sẽ báo vô nghiệm.',
  source,
  pseudocode: [
    'Xét cạnh e[i] = (u, v, w)',
    'Nếu thêm e[i] tạo chu trình: bỏ qua',
    'Chọn e[i]: hợp nhất DSU, cộng trọng số',
    'quayLui(i + 1) cho cạnh tiếp theo',
    'Đủ n−1 cạnh không chu trình: ghi nhận tốt nhất',
    'Hoàn tác e[i], thử nhánh bỏ qua',
  ],
  presets: [
    preset('Hình mẫu 9 đỉnh', { n: 9, edges: sketchEdges, pos: sketchPos }, 'MST = 63 · 8 cạnh'),
    preset('Tam giác', { n: 3, edges: [{ u: 0, v: 1, w: 1 }, { u: 1, v: 2, w: 2 }, { u: 0, v: 2, w: 4 }] }, 'MST = 3'),
    preset('Không liên thông', { n: 4, edges: [{ u: 0, v: 1, w: 1 }, { u: 2, v: 3, w: 2 }] }, 'Vô nghiệm'),
  ],
  example: '9 10\n1 2 6\n2 3 9\n1 4 14\n2 7 5\n2 5 12\n4 6 3\n4 7 8\n5 8 7\n7 8 10\n8 9 15',
  kind: 'graph',
  validate: i => {
    if (!Number.isInteger(i?.n) || i.n < 2 || i.n > 10) return 'Cần 2..10 đỉnh (quay lui liệt kê 2^m nhánh).';
    if (!Array.isArray(i?.edges) || i.edges.length < 1 || i.edges.length > 20) return 'Cần 1..20 cạnh.';
    const bad = i.edges.some((e: any) => !Number.isInteger(e?.u) || !Number.isInteger(e?.v) || e.u < 0 || e.v < 0 || e.u >= i.n || e.v >= i.n || e.u === e.v || !Number.isInteger(e?.w) || e.w < 1 || e.w > 1e6);
    if (bad) return 'Cạnh phải dạng u v w với đỉnh 1..n, u ≠ v, w nguyên 1..10⁶.';
    if (i.pos !== undefined && (!Array.isArray(i.pos) || i.pos.length !== i.n || i.pos.some((p: any) => !Number.isFinite(p?.x) || !Number.isFinite(p?.y) || Math.abs(p.x) > 1e3 || Math.abs(p.y) > 1e3))) return 'Tọa độ vẽ phải đủ n cặp số.';
    if (i.names !== undefined && (!Array.isArray(i.names) || i.names.length !== i.n || i.names.some((s: any) => typeof s !== 'string' || s.length > 20))) return 'Tên đỉnh phải đủ n chuỗi.';
    return null;
  },
  initial: i => ({
    graph: {
      nodes: layout(i.n, i.pos).map((p, k) => ({ id: k, label: i.names?.[k] ?? String(k + 1), x: p.x, y: p.y })),
      edges: i.edges.map((e: MSTEdge) => ({ u: e.u, v: e.v, w: e.w, status: 'undecided' as const })),
      best: [], bestTotal: null,
    },
  }),
  simulate: mst,
  parseInput: raw => {
    const t = tokens(raw).map(Number);
    need(t.length >= 2, 'Cần n, m và danh sách cạnh.');
    const n = t[0], m = t[1];
    need(Number.isInteger(n) && n >= 2 && n <= 10, 'n phải nguyên 2..10.');
    need(Number.isInteger(m) && m >= 1 && m <= 20, 'm phải nguyên 1..20.');
    need(t.length >= 2 + m * 3, `Cần ${m} cạnh u v w.`);
    const rest = t.slice(2);
    need(rest.every(Number.isFinite), 'Đầu vào phải toàn số.');
    const edges = Array.from({ length: m }, (_, k) => ({ u: rest[k * 3] - 1, v: rest[k * 3 + 1] - 1, w: rest[k * 3 + 2] }));
    need(edges.every(e => Number.isInteger(e.u) && Number.isInteger(e.v) && e.u >= 0 && e.v >= 0 && e.u < n && e.v < n && e.u !== e.v && Number.isInteger(e.w) && e.w >= 1 && e.w <= 1e6), 'Cạnh không hợp lệ.');
    const tail = rest.slice(m * 3);
    let pos: { x: number; y: number }[] | undefined;
    if (tail.length > 0) {
      need(tail.length === n * 2, `Tọa độ vẽ cần đúng ${n} cặp x y (hoặc bỏ trống để xếp vòng tròn).`);
      pos = Array.from({ length: n }, (_, k) => ({ x: tail[k * 2], y: tail[k * 2 + 1] }));
    }
    return { n, edges, pos };
  },
  randomInput: () => {
    const n = ri(4, 6);
    const pairs: [number, number][] = [];
    for (let v = 2; v <= n; v++) pairs.push([ri(1, v - 1), v]); // khung liên thông
    const extra = ri(0, 2);
    let guard = 0;
    while (pairs.length < n - 1 + extra && guard++ < 50) {
      const a = ri(1, n), b = ri(1, n);
      if (a !== b && !pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) pairs.push([a, b]);
    }
    return `${n} ${pairs.length}\n${pairs.map(([a, b]) => `${a} ${b} ${ri(1, 9)}`).join('\n')}`;
  },
} as Algorithm;
