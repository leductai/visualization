import type { Algorithm, GraphEdge, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, tokens, need } from './_shared';
import source from '../../webcode/to-mau.cpp?raw';

export interface MapEdge { u: number; v: number } // đỉnh 0-based, vô hướng
export interface MapInput { labels: string[]; edges: MapEdge[] }

const layout = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / Math.max(1, n) - Math.PI / 2;
    return { x: Math.round(Math.cos(a) * 10 * 100) / 100, y: Math.round(Math.sin(a) * 10 * 100) / 100 };
  });

function* welshPowell(input: MapInput): Generator<SimulationEvent> {
  const emit = emitter(source);
  const n = input.labels.length;
  const adj: { to: number; edge: number }[][] = Array.from({ length: n }, () => []);
  input.edges.forEach((e, k) => { adj[e.u].push({ to: e.v, edge: k }); adj[e.v].push({ to: e.u, edge: k }); });
  const nodes = layout(n).map((p, i) => ({ id: i, label: input.labels[i], x: p.x, y: p.y }));
  const status: GraphEdge['status'][] = Array(input.edges.length).fill('undecided');
  const colors = Array(n).fill(0);
  const snap = (): GraphEdge[] => input.edges.map((e, k) => ({ u: e.u, v: e.v, w: k + 1, status: status[k] }));
  const graphOf = () => ({ nodes, edges: snap(), best: [] as number[], bestTotal: null as number | null, directed: false, hideWeights: true, colors: [...colors] });
  const order = input.labels.map((_, i) => i).sort((a, b) => adj[b].length - adj[a].length || a - b);
  let used = 0;
  const showColors = () => colors.map(c => (c === 0 ? '' : c));
  const state: VisualState = {
    graph: graphOf(),
    secondary: showColors(), secondaryLabel: 'màu đỉnh',
    labels: [...input.labels],
    variables: { dinh: n, ranh: input.edges.length },
  };
  yield emit('update', `Thứ tự tô: ${order.map(v => input.labels[v]).join(', ')} (bậc giảm dần).`, state, 1, 'sort(thuTu.begin(), thuTu.end()', 0, false);
  for (const v of order) {
    for (const { edge: k } of adj[v]) status[k] = 'current';
    state.graph = graphOf();
    const banned = new Set<number>();
    for (const { to } of adj[v]) if (colors[to] > 0) banned.add(colors[to]);
    state.variables = { dinh: input.labels[v], bac: adj[v].length, cam: [...banned].sort((a, b) => a - b).join(',') || '∅' };
    yield emit('check', `Đỉnh ${input.labels[v]} (bậc ${adj[v].length}): màu kề đã dùng {${[...banned].sort((a, b) => a - b).join(', ') || '∅'}}.`, state, 2, 'cam[mau[u]] = true;', 0, true);
    let c = 1;
    while (banned.has(c)) c++;
    colors[v] = c;
    if (c > used) used = c;
    for (const { edge: k } of adj[v]) status[k] = 'undecided';
    state.graph = graphOf();
    state.secondary = showColors();
    state.variables = { dinh: input.labels[v], mau: c };
    yield emit('accept', `Tô ${input.labels[v]} màu ${c}.`, state, 3, 'mau[v] = c;', 0, false);
  }
  const coloring = input.labels.map((l, i) => `${l}${colors[i]}`).join(' ');
  state.secondary = showColors();
  state.variables = { soMau: used };
  state.outputs = [String(used)];
  yield emit('output', `Đã dùng ${used} màu: ${coloring}.`, state, 4, 'cout << soMau', 0, false);
  state.outputs = [coloring];
  yield emit('output', `Cách tô: ${coloring}.`, state, 4, 'cout << ten[i] << mau[i]', 0, false);
  state.result = `Tham lam dùng ${used} màu (không đảm bảo ít nhất).`;
  yield emit('complete', state.result, state, 4, 'cout << soMau', 0, false);
}

export const toMau: Algorithm = {
  id: 'to-mau', title: 'Tô màu bản đồ', category: 'Tối ưu', tags: ['Tham lam', 'Welsh-Powell'], complexity: 'O(n²)',
  description: 'Tô màu các vùng bằng tham lam bậc giảm dần',
  goal: 'Đỉnh bậc cao trước, mỗi đỉnh lấy màu nhỏ nhất còn trống.',
  inputFormat: 'Dòng 1: n m. Dòng 2: n nhãn. Tiếp theo m dòng ranh giới a b.',
  note: 'Tham lam Welsh-Powell nhanh nhưng KHÔNG đảm bảo số màu ít nhất (bài toán NP-khó) — xem preset phản ví dụ 8 đỉnh (tham lam 3 màu, tối ưu chỉ 2). Không đệ quy, không hoàn tác.',
  source,
  pseudocode: [
    'Sắp đỉnh theo bậc giảm dần (hòa theo input)',
    'Đánh dấu màu đỉnh kề đã tô',
    'Chọn màu nhỏ nhất còn trống',
    'In số màu và cách tô',
  ],
  presets: [
    preset('Bản đồ 4 vùng', {
      labels: ['A', 'B', 'C', 'D'],
      edges: [
        { u: 0, v: 1 }, { u: 1, v: 2 }, { u: 2, v: 0 },
        { u: 0, v: 3 }, { u: 1, v: 3 },
      ],
    }, 'Dùng 3 màu'),
    preset('K4 cần 4 màu', {
      labels: ['A', 'B', 'C', 'D'],
      edges: [
        { u: 0, v: 1 }, { u: 0, v: 2 }, { u: 0, v: 3 },
        { u: 1, v: 2 }, { u: 1, v: 3 }, { u: 2, v: 3 },
      ],
    }, 'Đồ thị đầy đủ · 4 màu'),
    preset('Lưỡng phân', {
      labels: ['A', 'B', 'C', 'D'],
      edges: [{ u: 0, v: 1 }, { u: 1, v: 2 }, { u: 2, v: 3 }, { u: 3, v: 0 }],
    }, 'Chu trình chẵn · 2 màu'),
    preset('Tham lam thua tối ưu', {
      labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      edges: [
        { u: 0, v: 2 }, { u: 0, v: 5 }, { u: 0, v: 7 }, { u: 1, v: 2 },
        { u: 3, v: 4 }, { u: 3, v: 6 }, { u: 4, v: 5 },
      ],
    }, 'Tham lam 3 màu, tối ưu chỉ 2'),
  ],
  example: `4 5\nA B C D\nA B\nB C\nC A\nA D\nB D`,
  kind: 'graph',
  validate: i => {
    const labels = i?.labels, edges = i?.edges;
    if (!Array.isArray(labels) || labels.length < 1 || labels.length > 10) return 'Cần 1..10 đỉnh.';
    if (!labels.every((x: any) => typeof x === 'string' && x.length >= 1 && x.length <= 8) || new Set(labels).size !== labels.length) return 'Nhãn đỉnh phải phân biệt, dài 1..8 ký tự.';
    if (!Array.isArray(edges) || edges.length > 100) return 'Cần tối đa 100 ranh giới.';
    const seen = new Set<string>();
    for (const e of edges) {
      if (!Number.isInteger(e?.u) || !Number.isInteger(e?.v) || e.u < 0 || e.v < 0 || e.u >= labels.length || e.v >= labels.length) return 'Ranh giới phải nối hai đỉnh hợp lệ.';
      if (e.u === e.v) return 'Không cho khuyên (ranh giới của đỉnh với chính nó).';
      const key = `${Math.min(e.u, e.v)}-${Math.max(e.u, e.v)}`;
      if (seen.has(key)) return 'Không cho ranh giới lặp.';
      seen.add(key);
    }
    return null;
  },
  initial: i => {
    const labels = i.labels as string[], edges = i.edges as MapEdge[];
    const n = labels.length;
    const nodes = layout(n).map((p, k) => ({ id: k, label: labels[k], x: p.x, y: p.y }));
    return {
      graph: { nodes, edges: edges.map(e => ({ u: e.u, v: e.v, w: 1, status: 'undecided' as const })), best: [], bestTotal: null, directed: false, hideWeights: true, colors: Array(n).fill(0) },
      secondary: Array(n).fill(''), secondaryLabel: 'màu đỉnh',
      labels: [...labels],
    };
  },
  simulate: welshPowell,
  parseInput: raw => {
    const t = tokens(raw);
    need(t.length >= 3, 'Cần n, m, nhãn đỉnh và ranh giới.');
    const n = Number(t[0]), m = Number(t[1]);
    need(Number.isInteger(n) && n > 0 && n <= 10 && Number.isInteger(m) && m >= 0 && m <= 100, 'n, m không hợp lệ.');
    need(t.length === 2 + n + 2 * m, `Cần đúng ${2 + n + 2 * m} token theo mẫu.`);
    const labels = t.slice(2, 2 + n);
    need(new Set(labels).size === n, 'Nhãn đỉnh phải phân biệt.');
    const idx = new Map(labels.map((l, k) => [l, k] as [string, number]));
    const edges: MapEdge[] = [];
    for (let k = 0; k < m; k++) {
      const a = t[2 + n + 2 * k], b = t[2 + n + 2 * k + 1];
      need(idx.has(a) && idx.has(b), `Ranh giới ${a} ${b} dùng nhãn lạ.`);
      edges.push({ u: idx.get(a)!, v: idx.get(b)! });
    }
    return { labels, edges };
  },
  randomInput: () => {
    const n = ri(3, 5);
    const labels = Array.from({ length: n }, (_, k) => String.fromCharCode(65 + k));
    const lines: string[] = [];
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (Math.random() < 0.45) lines.push(`${labels[a]} ${labels[b]}`);
    return `${n} ${lines.length}\n${labels.join(' ')}\n${lines.join('\n')}`;
  },
} as Algorithm;
