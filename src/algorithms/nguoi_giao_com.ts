import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, pick, randomDigits, randomLetters, randomWeights, validateTree, tokens, need } from './_shared';
import source from '../../webcode2/nguoi_giao_com.cpp?raw';

type TreeInput = { n: number; edges: number[][]; queries: number[][] };

function* lca({ n, edges, queries }: TreeInput): Generator<SimulationEvent> {
  const emit = emitter(source), levels = 19, visibleLevels = Math.max(1, Math.ceil(Math.log2(n + 1)));
  const adjacency: number[][] = Array.from({ length: n + 1 }, () => []);
  for (const [a, b] of edges) { adjacency[a].push(b); adjacency[b].push(a); }
  for (const neighbors of adjacency) neighbors.reverse();
  const parent: number[][] = Array.from({ length: n + 1 }, () => Array(levels).fill(0)), depth = Array(n + 1).fill(0), stack = [1];
  const state: VisualState = { values: Array.from({ length: n }, (_, i) => i + 1), edges, secondary: depth.slice(1), secondaryLabel: 'doSau[1..n]', variables: { root: 1 }, grid: parent.slice(1).map(row => row.slice(0, visibleLevels)), columnLabels: Array.from({ length: visibleLevels }, (_, k) => `2^${k}`) };
  while (stack.length) {
    const u = stack.pop()!; state.active = [u - 1]; state.variables = { root: 1, u, stack: stack.join(', ') };
    yield emit('check', `Lấy đỉnh ${u} ra khỏi stack DFS.`, state, 1, 'int u = stackDinh[top--];');
    for (const v of adjacency[u]) if (v !== parent[u][0]) {
      parent[v][0] = u; depth[v] = depth[u] + 1;
      for (let k = 1; k < levels; k++) parent[v][k] = parent[parent[v][k - 1]][k - 1];
      stack.push(v); state.active = [v - 1]; state.secondary = depth.slice(1); state.grid = parent.slice(1).map(row => row.slice(0, visibleLevels));
      state.variables = { root: 1, u, v, doSau: depth[v] };
      yield emit('update', `cha[${v}][0] = ${u}, độ sâu ${depth[v]}; tính tổ tiên 2^k.`, state, 2, 'cha[v][k] =');
    }
  }
  for (const [a, b] of queries) {
    let u = a, v = b; if (depth[u] < depth[v]) [u, v] = [v, u];
    const difference = depth[u] - depth[v]; state.path = []; state.marked = [];
    for (let k = 0; k < levels; k++) if (difference & (1 << k)) {
      const old = u; u = parent[u][k]; state.active = [u - 1, v - 1]; state.variables = { a, b, u, v, k };
      yield emit('update', `Nâng ${old} lên ${u} bằng bước 2^${k}.`, state, 3, 'u = cha[u][k];');
    }
    if (u !== v) for (let k = levels - 1; k >= 0; k--) {
      state.variables = { a, b, u, v, k };
      yield emit('check', `So sánh tổ tiên mức ${k} của ${u} và ${v}.`, state, 4, 'if (cha[u][k] != cha[v][k])');
      if (parent[u][k] !== parent[v][k]) { u = parent[u][k]; v = parent[v][k]; state.active = [u - 1, v - 1]; yield emit('update', `Nâng đồng thời lên ${u} và ${v}.`, state, 4, 'v = cha[v][k];'); }
    }
    const ancestor = u === v ? u : parent[u][0], pathA: number[] = [], pathB: number[] = [];
    for (let x = a; x !== ancestor; x = parent[x][0]) pathA.push(x - 1);
    for (let x = b; x !== ancestor; x = parent[x][0]) pathB.push(x - 1);
    state.path = [...pathA, ancestor - 1, ...pathB.reverse()]; state.marked = [ancestor - 1]; state.active = [a - 1, b - 1];
    const distance = depth[a] + depth[b] - 2 * depth[ancestor]; state.outputs = [String(distance)]; state.variables = { a, b, LCA: ancestor, khoangCach: distance };
    yield emit('output', `LCA(${a}, ${b}) = ${ancestor}; khoảng cách = ${distance}.`, state, 5, 'cout << doSau[a]');
  }
  state.result = 'Đã trả lời mọi truy vấn trên cây.'; yield emit('complete', state.result, state, 6, 'return 0;');
}

export const nguoiGiaoCom: Algorithm = {
  id: 'nguoi_giao_com', title: 'Người giao cơm', category: 'Cấu trúc dữ liệu', tags: ['Cây', 'LCA', 'Binary lifting'], complexity: 'O((n + q)·log n)', description: 'Khoảng cách giữa hai đỉnh trên cây', goal: 'Tìm tổ tiên chung thấp nhất rồi tính số cạnh trên đường đi.', inputFormat: 'Cây n đỉnh, n−1 cạnh và các cặp truy vấn.', source, pseudocode: ['DFS bằng stack từ gốc 1', 'Lưu doSau và cha[v][k] = tổ tiên 2^k', 'Nâng đỉnh sâu hơn để cùng độ sâu', 'Nâng đồng thời nếu tổ tiên khác nhau', 'LCA → khoảng cách = sâu[a]+sâu[b]−2×sâu[LCA]', 'Kết thúc'], presets: [preset('Cây bảy đỉnh', { n: 7, edges: [[1, 2], [1, 3], [2, 4], [2, 5], [3, 6], [3, 7]], queries: [[4, 7], [2, 5], [6, 6]] }, 'Truy vấn khác nhánh, tổ tiên và chính nó'), preset('Một đỉnh', { n: 1, edges: [], queries: [[1, 1]] }, 'Khoảng cách 0')], example: `7 3
1 2
1 3
2 4
2 5
3 6
3 7
4 7
2 5
6 6`, kind: 'tree', validate: validateTree, initial: i => ({ values: Array.from({ length: i.n }, (_, j) => j + 1), edges: i.edges, variables: { root: 1 } }), simulate: lca,
  parseInput: raw => { const t = tokens(raw); need(t.length >= 2, 'Cần n, q và dữ liệu.'); const n = Number(t[0]), q = Number(t[1]); need(Number.isInteger(n) && Number.isInteger(q) && n > 0 && q > 0, 'n, q không hợp lệ.'); const rest = t.slice(2).map(Number); need(rest.length === (n - 1) * 2 + q * 2, `Cần ${n - 1} cạnh và ${q} truy vấn.`); const edges = Array.from({ length: n - 1 }, (_, i) => rest.slice(i * 2, i * 2 + 2)); const queries = Array.from({ length: q }, (_, i) => rest.slice((n - 1) * 2 + i * 2, (n - 1) * 2 + i * 2 + 2)); return { n, edges, queries }; },
  randomInput: () => { const n = ri(2, 8), q = ri(1, 4); const edges = []; for (let v = 2; v <= n; v++) edges.push([ri(1, v - 1), v]); const qs = Array.from({length: q}, () => `${ri(1, n)} ${ri(1, n)}`); return `${n} ${q}\n${edges.map(e => e.join(' ')).join('\n')}\n${qs.join('\n')}`; },
};
