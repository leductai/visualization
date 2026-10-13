import type { Algorithm, GraphEdge, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, tokens, need } from './_shared';
import source from '../../webcode2/duong_ngan_nhat.cpp?raw';

export interface CostEdge { u: number; v: number; w: number } // đỉnh 0-based
export interface CostInput { labels: string[]; edges: CostEdge[]; start: string; end: string }

const INF = 1e9;

const layout = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / Math.max(1, n) - Math.PI / 2;
    return { x: Math.round(Math.cos(a) * 10 * 100) / 100, y: Math.round(Math.sin(a) * 10 * 100) / 100 };
  });

const show = (d: number) => (d >= INF ? -1 : d);

function* dijkstra(input: CostInput): Generator<SimulationEvent> {
  const emit = emitter(source);
  const n = input.labels.length;
  const idx = new Map(input.labels.map((l, i) => [l, i]));
  const adj: { to: number; w: number; edge: number }[][] = Array.from({ length: n }, () => []);
  input.edges.forEach((e, k) => adj[e.u].push({ to: e.v, w: e.w, edge: k }));
  const s = idx.get(input.start)!, t = idx.get(input.end)!;
  const nodes = layout(n).map((p, i) => ({ id: i, label: input.labels[i], x: p.x, y: p.y }));
  const status: GraphEdge['status'][] = Array(input.edges.length).fill('undecided');
  const snap = (): GraphEdge[] => input.edges.map((e, k) => ({ u: e.u, v: e.v, w: e.w, status: status[k] }));
  const graphOf = () => ({ nodes, edges: snap(), best: [] as number[], bestTotal: null as number | null, directed: true });
  const dist = Array(n).fill(INF), pred = Array(n).fill(-1), done: boolean[] = Array(n).fill(false);
  const tree: number[] = [];
  dist[s] = 0;
  const distRow = () => dist.map(show);
  const state: VisualState = {
    graph: graphOf(),
    secondary: distRow(), secondaryLabel: 'khoảng cách (-1: vô cùng)',
    labels: [...input.labels],
    variables: { dinh: n, canh: input.edges.length },
  };
  yield emit('update', `dist[${input.start}] = 0, còn lại vô cùng.`, state, 1, 'dist[s] = 0;', 0, false);
  for (let lap = 0; lap < n; lap++) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && (u === -1 || dist[i] < dist[u])) u = i;
    state.variables = { vong: lap + 1 };
    yield emit('check', 'Quét đỉnh chưa chốt có dist nhỏ nhất.', state, 2, 'dist[i] < dist[u]', 0, true);
    if (u === -1 || dist[u] >= INF) {
      yield emit('check', 'Các đỉnh còn lại không tới được, dừng.', state, 2, 'dist[i] < dist[u]', 0, true);
      break;
    }
    done[u] = true;
    state.active = [];
    state.variables = { chot: input.labels[u], dist: dist[u] };
    yield emit('accept', `Chốt ${input.labels[u]} với dist ${show(dist[u])}.`, state, 2, 'xong[u] = true;', 0, false);
    for (const { to: v, w, edge: k } of adj[u]) {
      status[k] = 'current'; state.active = [k];
      state.graph = graphOf();
      state.variables = { tu: input.labels[u], den: input.labels[v], w };
      yield emit('check', `Thử nới ${input.labels[u]} → ${input.labels[v]} (w = ${w}).`, state, 3, 'if (dist[u] + w < dist[v])', 0, true);
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        const old = tree.findIndex(e => input.edges[e].v === v);
        if (old >= 0) { status[tree[old]] = 'undecided'; tree.splice(old, 1); }
        pred[v] = u;
        status[k] = 'chosen'; tree.push(k);
        state.marked = [...tree];
        state.secondary = distRow();
        state.graph = graphOf();
        state.variables = { den: input.labels[v], dist: dist[v], truoc: input.labels[u] };
        yield emit('update', `dist[${input.labels[v]}] = ${show(dist[v])} qua ${input.labels[u]}.`, state, 3, 'dist[v] = dist[u] + w;', 0, false);
      }
      if (status[k] === 'current') status[k] = 'undecided';
      state.active = [];
    }
    state.graph = graphOf();
  }
  const outputs: string[] = [];
  const distStr = dist.map(show).join(' ');
  state.active = [];
  if (dist[t] < INF) {
    const chain: number[] = [];
    for (let v = t; v !== -1; v = pred[v]) chain.push(v);
    chain.reverse();
    const pathE: number[] = [];
    for (let i = 1; i < chain.length; i++) {
      const k = input.edges.findIndex(e => e.u === chain[i - 1] && e.v === chain[i]);
      if (k >= 0) pathE.push(k);
    }
    input.edges.forEach((_, k) => { status[k] = pathE.includes(k) ? 'chosen' : 'undecided'; });
    state.path = [...pathE];
    state.secondary = distRow();
    state.graph = graphOf();
    state.variables = { tong: dist[t] };
    outputs.push(chain.map(v => input.labels[v]).join(' -> '));
    state.outputs = [outputs[0]];
    yield emit('output', `Đường ngắn nhất: ${outputs[0]} (tổng ${dist[t]}).`, state, 4, 'cout << ten[duong[i]];', 0, false);
  }
  outputs.push(distStr);
  state.outputs = [distStr];
  yield emit('output', `Hàng khoảng cách: ${distStr}.`, state, 4, 'dist[i] >= VO_CUNG', 0, false);
  state.result = dist[t] < INF
    ? `Đường ngắn nhất ${input.start} → ${input.end} dài ${dist[t]}.`
    : `Không tới được ${input.end} từ ${input.start}.`;
  yield emit('complete', state.result, state, 4, 'return 0;', 0, false);
}

const classic: CostInput = {
  labels: ['A', 'B', 'C', 'D', 'E', 'F'],
  edges: [
    { u: 0, v: 1, w: 4 }, { u: 0, v: 2, w: 2 }, { u: 1, v: 2, w: 1 },
    { u: 2, v: 1, w: 1 }, { u: 1, v: 3, w: 5 }, { u: 2, v: 3, w: 8 },
    { u: 2, v: 4, w: 10 }, { u: 3, v: 4, w: 2 }, { u: 3, v: 5, w: 6 },
    { u: 4, v: 5, w: 3 },
  ],
  start: 'A', end: 'F',
};

export const duongNganNhat: Algorithm = {
  id: 'duong-ngan-nhat', title: 'Đường ngắn nhất', category: 'Tối ưu', tags: ['Tham lam', 'Dijkstra'], complexity: 'O(n²)',
  description: 'Đường ngắn nhất từ một nguồn (trọng số không âm)',
  goal: 'Chốt đỉnh dist nhỏ nhất rồi nới lỏng các cạnh ra khỏi nó.',
  inputFormat: 'Dòng 1: n m. Dòng 2: n nhãn. Tiếp theo m dòng cạnh a b w (w ≥ 0). Dòng cuối: đỉnh bắt đầu và kết thúc.',
  note: 'Dijkstra chỉ đúng với trọng số không âm — input âm bị từ chối. Số trên cạnh là trọng số; -1 nghĩa là không tới được. Cây tiền nhiệm xanh dần theo quá trình nới lỏng.',
  source,
  pseudocode: [
    'dist[s] = 0, còn lại vô cùng',
    'Chốt đỉnh chưa xong có dist nhỏ nhất',
    'Nới lỏng cạnh ra, cập nhật truoc',
    'In đường đi và hàng dist',
  ],
  presets: [
    preset('Kinh điển 6 đỉnh', classic, 'A → C → B → D → E → F · tổng 13'),
    preset('Không tới được', { labels: ['A', 'B', 'C'], edges: [{ u: 0, v: 1, w: 1 }], start: 'A', end: 'C' }, 'C không tới được'),
    preset('Một đỉnh', { labels: ['A'], edges: [], start: 'A', end: 'A' }, 'Đường rỗng · dist 0'),
  ],
  example: `6 10\nA B C D E F\nA B 4\nA C 2\nB C 1\nC B 1\nB D 5\nC D 8\nC E 10\nD E 2\nD F 6\nE F 3\nA F`,
  kind: 'graph',
  validate: i => {
    const labels = i?.labels, edges = i?.edges;
    if (!Array.isArray(labels) || labels.length < 1 || labels.length > 50) return 'Cần 1..50 đỉnh.';
    if (!labels.every((x: any) => typeof x === 'string' && x.length >= 1 && x.length <= 8) || new Set(labels).size !== labels.length) return 'Nhãn đỉnh phải phân biệt, dài 1..8 ký tự.';
    if (!Array.isArray(edges) || edges.length > 500) return 'Cần tối đa 500 cạnh.';
    const seen = new Set<string>();
    for (const e of edges) {
      if (!Number.isInteger(e?.u) || !Number.isInteger(e?.v) || e.u < 0 || e.v < 0 || e.u >= labels.length || e.v >= labels.length) return 'Cạnh phải nối hai đỉnh hợp lệ.';
      if (e.u === e.v) return 'Không cho khuyên (cạnh nối đỉnh với chính nó).';
      if (!Number.isInteger(e?.w) || e.w < 0) return 'Trọng số phải là số nguyên không âm (Dijkstra không làm việc với trọng số âm).';
      const key = `${e.u}>${e.v}`;
      if (seen.has(key)) return 'Không cho cạnh lặp.';
      seen.add(key);
    }
    if (!labels.includes(i?.start) || !labels.includes(i?.end)) return 'Đỉnh bắt đầu/kết thúc phải có trong danh sách.';
    return null;
  },
  initial: i => {
    const labels = i.labels as string[], edges = i.edges as CostEdge[];
    const n = labels.length;
    const nodes = layout(n).map((p, k) => ({ id: k, label: labels[k], x: p.x, y: p.y }));
    const dist0 = labels.map(l => (l === i.start ? 0 : -1));
    return {
      graph: { nodes, edges: edges.map(e => ({ u: e.u, v: e.v, w: e.w, status: 'undecided' as const })), best: [], bestTotal: null, directed: true },
      secondary: dist0, secondaryLabel: 'khoảng cách (-1: vô cùng)',
      labels: [...labels],
    };
  },
  simulate: dijkstra,
  parseInput: raw => {
    const t = tokens(raw);
    need(t.length >= 5, 'Cần n, m, nhãn đỉnh, cạnh và đỉnh bắt đầu/kết thúc.');
    const n = Number(t[0]), m = Number(t[1]);
    need(Number.isInteger(n) && n > 0 && n <= 50 && Number.isInteger(m) && m >= 0 && m <= 500, 'n, m không hợp lệ.');
    need(t.length === 2 + n + 3 * m + 2, `Cần đúng ${2 + n + 3 * m + 2} token theo mẫu.`);
    const labels = t.slice(2, 2 + n);
    need(new Set(labels).size === n, 'Nhãn đỉnh phải phân biệt.');
    const idx = new Map(labels.map((l, k) => [l, k] as [string, number]));
    const edges: CostEdge[] = [];
    for (let k = 0; k < m; k++) {
      const a = t[2 + n + 3 * k], b = t[2 + n + 3 * k + 1], w = Number(t[2 + n + 3 * k + 2]);
      need(idx.has(a) && idx.has(b), `Cạnh ${a} ${b} dùng nhãn lạ.`);
      need(Number.isInteger(w) && w >= 0, `Trọng số cạnh ${a} ${b} phải không âm.`);
      edges.push({ u: idx.get(a)!, v: idx.get(b)!, w });
    }
    return { labels, edges, start: t[2 + n + 3 * m], end: t[2 + n + 3 * m + 1] };
  },
  randomInput: () => {
    const n = ri(3, 6);
    const labels = Array.from({ length: n }, (_, k) => String.fromCharCode(65 + k));
    const maxM = Math.min(n * (n - 1), 10), m = ri(n - 1, maxM);
    const used = new Set<string>(), lines: string[] = [];
    while (lines.length < m) {
      const a = ri(0, n - 1), b = ri(0, n - 1);
      if (a === b || used.has(`${a}>${b}`)) continue;
      used.add(`${a}>${b}`);
      lines.push(`${labels[a]} ${labels[b]} ${ri(1, 9)}`);
    }
    return `${n} ${m}\n${labels.join(' ')}\n${lines.join('\n')}\n${labels[0]} ${labels[n - 1]}`;
  },
} as Algorithm;
