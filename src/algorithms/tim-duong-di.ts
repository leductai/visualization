import type { Algorithm, DecisionNode, GraphEdge, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, tokens, need } from './_shared';
import source from '../../webcode2/tim_duong_di.cpp?raw';

export interface PathEdge { u: number; v: number } // đỉnh 0-based
export interface PathInput { labels: string[]; edges: PathEdge[]; start: string; end: string }

const layout = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / Math.max(1, n) - Math.PI / 2;
    return { x: Math.round(Math.cos(a) * 10 * 100) / 100, y: Math.round(Math.sin(a) * 10 * 100) / 100 };
  });

function* allPaths(input: PathInput): Generator<SimulationEvent> {
  const emit = emitter(source);
  const n = input.labels.length;
  const idx = new Map(input.labels.map((l, i) => [l, i]));
  const adj: { to: number; edge: number }[][] = Array.from({ length: n }, () => []);
  input.edges.forEach((e, k) => adj[e.u].push({ to: e.v, edge: k }));
  const s = idx.get(input.start)!, t = idx.get(input.end)!;
  const nodes = layout(n).map((p, i) => ({ id: i, label: input.labels[i], x: p.x, y: p.y }));
  const status: GraphEdge['status'][] = Array(input.edges.length).fill('undecided');
  const snap = (): GraphEdge[] => input.edges.map((e, k) => ({ u: e.u, v: e.v, w: k + 1, status: status[k] }));
  const graphOf = () => ({ nodes, edges: snap(), best: [] as number[], bestTotal: null as number | null, directed: true });
  const visited = Array(n).fill(false);
  const pathV: number[] = [s], pathE: number[] = [];
  const outputs: string[] = [];
  const pathStr = () => pathV.map(v => input.labels[v]).join(' -> ');
  const state: VisualState = {
    graph: graphOf(),
    secondary: [input.start], secondaryLabel: 'đường đi',
    variables: { dinh: n, canh: input.edges.length },
  };
  // Cây quyết định chỉ vẽ khi đồ thị nhỏ (số đường đi có thể bùng nổ giai thừa).
  const buildTree = n <= 7 && input.edges.length <= 20;
  const tree: DecisionNode[] = buildTree ? [{ id: 0, parent: null, label: input.start, status: 'root', depth: 0 }] : [];
  let nextId = 1;
  if (buildTree) state.decision = [...tree];

  function* dfs(u: number, parentId: number, depth: number): Generator<SimulationEvent> {
    state.variables = { dinh: input.labels[u], viTri: depth, daTham: visited.filter(Boolean).length };
    if (buildTree) state.decision = [...tree];
    if (u === t) {
      outputs.push(pathStr());
      state.outputs = [pathStr()];
      yield emit('output', `Được đường đi: ${pathStr()}.`, state, 1, 'inDuongDi();', depth);
      return;
    }
    for (const { to: v, edge: k } of adj[u]) {
      status[k] = 'current'; state.active = [k];
      state.graph = graphOf();
      state.variables = { dinh: input.labels[u], ke: input.labels[v], viTri: depth };
      if (buildTree) state.decision = [...tree];
      yield emit('check', `Thử cạnh ${input.labels[u]} → ${input.labels[v]}.`, state, 2, 'if (!daTham[v])', depth);
      if (visited[v]) {
        status[k] = 'undecided'; state.active = [];
        state.graph = graphOf();
        if (buildTree) {
          tree.push({ id: nextId++, parent: parentId, label: input.labels[v], status: 'pruned', depth: depth + 1 });
          state.decision = [...tree];
        }
        yield emit('reject', `${input.labels[v]} đã thăm, cắt nhánh tránh chu trình.`, state, 2, 'if (!daTham[v])', depth);
        continue;
      }
      visited[v] = true; pathV.push(v); pathE.push(k);
      status[k] = 'chosen';
      state.path = [...pathE]; state.secondary = pathV.map(x => input.labels[x]);
      let nodeId = -1;
      if (buildTree) {
        nodeId = nextId++;
        tree.push({ id: nodeId, parent: parentId, label: input.labels[v], status: 'current', depth: depth + 1 });
        state.decision = [...tree];
      }
      state.graph = graphOf();
      yield emit('accept', `Đi tới ${input.labels[v]}.`, state, 3, 'duong.push_back(v);', depth);
      yield* dfs(v, buildTree ? nodeId : -1, depth + 1);
      visited[v] = false; pathV.pop(); pathE.pop();
      status[k] = 'undecided'; state.active = [k]; state.path = [...pathE];
      state.secondary = pathV.map(x => input.labels[x]);
      state.variables = { dinh: input.labels[u], viTri: depth };
      if (buildTree) {
        const node = tree.find(t => t.id === nodeId);
        if (node) node.status = 'accepted';
        state.decision = [...tree];
      }
      state.graph = graphOf();
      yield emit('undo', `Quay lui khỏi ${input.labels[v]}.`, state, 4, 'daTham[v] = false;', depth);
    }
    state.active = [];
  }

  visited[s] = true;
  yield* dfs(s, 0, 0);
  state.active = []; state.path = [];
  state.result = outputs.length
    ? `Tìm được ${outputs.length} đường đi từ ${input.start} đến ${input.end}.`
    : `Không có đường đi từ ${input.start} đến ${input.end}.`;
  state.outputs = [...outputs];
  if (buildTree) state.decision = [...tree];
  yield emit('complete', state.result, state, 5, 'dfs(s);');
}

const slideEdges: [string, string][] = [
  ['W', 'M'], ['W', 'Q'], ['I', 'W'], ['I', 'K'], ['I', 'U'], ['I', 'M'],
  ['U', 'W'], ['U', 'K'], ['U', 'Q'], ['M', 'U'], ['M', 'Q'], ['Q', 'I'], ['Q', 'M'],
];
const slideLabels = ['W', 'K', 'I', 'U', 'M', 'Q'];
const slideInput: PathInput = {
  labels: slideLabels,
  edges: slideEdges.map(([a, b]) => ({ u: slideLabels.indexOf(a), v: slideLabels.indexOf(b) })),
  start: 'U', end: 'I',
};

export const timDuongDi: Algorithm = {
  id: 'tim-duong-di', title: 'Tìm đường đi', category: 'Quay lui', tags: ['Đồ thị có hướng', 'Liệt kê'], complexity: 'O(P·(n+m))',
  description: 'Liệt kê mọi đường đi đơn từ đỉnh bắt đầu đến đỉnh kết thúc',
  goal: 'Thử mọi cạnh ra tới đỉnh chưa thăm, đánh dấu rồi hoàn tác.',
  inputFormat: 'Dòng 1: n m. Dòng 2: n nhãn đỉnh. Tiếp theo m dòng cạnh a b. Dòng cuối: đỉnh bắt đầu và kết thúc.',
  note: 'Dòng cuối (bắt đầu/kết thúc) là mở rộng từ mẫu trên lớp, vốn ngầm hiểu đi từ U đến I. Số trên cạnh là thứ tự cạnh trong input. Cây quyết định chỉ vẽ khi n ≤ 7 và m ≤ 20.',
  source,
  pseudocode: [
    'Nếu tới đích: inDuongDi()',
    'Với mỗi cạnh ra, kiểm tra đỉnh chưa thăm',
    'Đánh dấu, thêm đỉnh vào đường đi rồi đi sâu',
    'Hoàn tác để thử cạnh khác',
    'Kết thúc liệt kê từ đỉnh bắt đầu',
  ],
  presets: [
    preset('Ví dụ 5: U → I', slideInput, '6 đỉnh · 13 cạnh · 3 đường đi'),
    preset('DAG nhỏ', { labels: ['A', 'B', 'C', 'D'], edges: [{ u: 0, v: 1 }, { u: 0, v: 2 }, { u: 1, v: 3 }, { u: 2, v: 3 }], start: 'A', end: 'D' }, '2 đường đi'),
    preset('Không có đường', { labels: ['A', 'B', 'C'], edges: [{ u: 0, v: 1 }], start: 'B', end: 'A' }, 'Đồ thị không liên thông chiều'),
  ],
  example: `6 13\nW K I U M Q\nW M\nW Q\nI W\nI K\nI U\nI M\nU W\nU K\nU Q\nM U\nM Q\nQ I\nQ M\nU I`,
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
      const key = `${e.u}>${e.v}`;
      if (seen.has(key)) return 'Không cho cạnh lặp.';
      seen.add(key);
    }
    if (!labels.includes(i?.start) || !labels.includes(i?.end)) return 'Đỉnh bắt đầu/kết thúc phải có trong danh sách.';
    if (i.start === i.end) return 'Đỉnh bắt đầu và kết thúc phải khác nhau.';
    return null;
  },
  initial: i => {
    const n = (i.labels as string[]).length;
    const nodes = layout(n).map((p, k) => ({ id: k, label: (i.labels as string[])[k], x: p.x, y: p.y }));
    return {
      graph: { nodes, edges: (i.edges as PathEdge[]).map((e, k) => ({ u: e.u, v: e.v, w: k + 1, status: 'undecided' as const })), best: [], bestTotal: null, directed: true },
      secondary: [i.start], secondaryLabel: 'đường đi',
      decision: n <= 7 && (i.edges as PathEdge[]).length <= 20 ? [{ id: 0, parent: null, label: i.start, status: 'root', depth: 0 }] : undefined,
    };
  },
  simulate: allPaths,
  parseInput: raw => {
    const t = tokens(raw);
    need(t.length >= 5, 'Cần n, m, nhãn đỉnh, cạnh và đỉnh bắt đầu/kết thúc.');
    const n = Number(t[0]), m = Number(t[1]);
    need(Number.isInteger(n) && n > 0 && n <= 50 && Number.isInteger(m) && m >= 0 && m <= 500, 'n, m không hợp lệ.');
    need(t.length === 2 + n + 2 * m + 2, `Cần đúng ${2 + n + 2 * m + 2} token theo mẫu.`);
    const labels = t.slice(2, 2 + n);
    need(new Set(labels).size === n, 'Nhãn đỉnh phải phân biệt.');
    const idx = new Map(labels.map((l, k) => [l, k] as [string, number]));
    const edges: PathEdge[] = [];
    for (let k = 0; k < m; k++) {
      const a = t[2 + n + 2 * k], b = t[2 + n + 2 * k + 1];
      need(idx.has(a) && idx.has(b), `Cạnh ${a} ${b} dùng nhãn lạ.`);
      edges.push({ u: idx.get(a)!, v: idx.get(b)! });
    }
    return { labels, edges, start: t[2 + n + 2 * m], end: t[2 + n + 2 * m + 1] };
  },
  randomInput: () => {
    const n = ri(3, 6);
    const labels = Array.from({ length: n }, (_, k) => String.fromCharCode(65 + k));
    const maxM = Math.min(n * (n - 1), 10), m = ri(n - 1, maxM);
    const used = new Set<string>(), pairs: string[] = [];
    while (pairs.length < m * 2) {
      const a = ri(0, n - 1), b = ri(0, n - 1);
      if (a === b || used.has(`${a}>${b}`)) continue;
      used.add(`${a}>${b}`); pairs.push(labels[a], labels[b]);
    }
    const edgeLines = Array.from({ length: m }, (_, k) => `${pairs[2 * k]} ${pairs[2 * k + 1]}`);
    return `${n} ${m}\n${labels.join(' ')}\n${edgeLines.join('\n')}\n${labels[0]} ${labels[n - 1]}`;
  },
} as Algorithm;
