import type { Algorithm, DecisionNode, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, pick, randomDigits, randomLetters, randomWeights, tokens, need } from './_shared';
import source from '../../webcode/sinh-hoan-vi.cpp?raw';

/** Chuẩn hóa input: { n } cũ hoặc { items } mới (vd [7,2,4] như hình trên lớp). */
function resolveItems(input: any): (string | number)[] {
  if (Array.isArray(input?.items)) return [...input.items];
  const n = input?.n;
  return Array.from({ length: Math.max(0, n ?? 0) }, (_, i) => i + 1);
}

function* permutations(input: { n?: number; items?: (string | number)[] }): Generator<SimulationEvent> {
  const items = resolveItems(input);
  const n = items.length;
  const emit = emitter(source), values: (string | number)[] = Array(n).fill(''), used = Array(n).fill(false);
  const state: VisualState = { values: [...values], secondary: used.slice(), secondaryLabel: 'daDung' };
  // Cây quyết định chỉ dựng khi n nhỏ (n! nút sẽ nổ với n lớn).
  const buildTree = n <= 5;
  const tree: DecisionNode[] = buildTree ? [{ id: 0, parent: null, label: '∅', status: 'root', depth: 0 }] : [];
  let nextId = 1;
  if (buildTree) state.decision = [...tree];
  function* go(pos: number, parentId: number): Generator<SimulationEvent> {
    state.variables = { n, viTri: pos }; state.active = pos < n ? [pos] : [];
    if (buildTree) state.decision = [...tree];
    if (pos === n) { state.outputs = [values.join(' ')]; yield emit('output', `In hoán vị: ${values.join(' ')}.`, state, 1, 'inHoanVi();', pos); return; }
    for (let k = 0; k < n; k++) {
      const label = String(items[k]);
      state.variables = { n, viTri: pos, so: label as any };
      if (buildTree) state.decision = [...tree];
      yield emit('check', `Kiểm tra ${label} chưa dùng.`, state, 2, 'if (!daDung[so])', pos);
      if (used[k]) {
        if (buildTree) {
          tree.push({ id: nextId++, parent: parentId, label, status: 'pruned', depth: pos + 1 });
          state.decision = [...tree];
        }
        yield emit('reject', `${label} đã dùng, cắt nhánh.`, state, 2, 'if (!daDung[so])', pos);
        continue;
      }
      values[pos] = items[k]; used[k] = true; state.secondary = used.slice();
      let nodeId = -1;
      if (buildTree) {
        nodeId = nextId++;
        tree.push({ id: nodeId, parent: parentId, label, status: 'current', depth: pos + 1 });
        state.decision = [...tree];
      }
      yield emit('accept', `Chọn ${label} cho vị trí ${pos}.`, state, 3, 'hoanVi[viTri] = so;', pos);
      yield* go(pos + 1, buildTree ? nodeId : -1);
      used[k] = false; values[pos] = ''; state.active = [pos]; state.secondary = used.slice();
      state.variables = { n, viTri: pos, so: label as any };
      if (buildTree) {
        const node = tree.find(t => t.id === nodeId);
        if (node) node.status = 'accepted';
        state.decision = [...tree];
      }
      yield emit('undo', `Bỏ đánh dấu ${label}.`, state, 5, 'daDung[so] = false;', pos);
    }
  }
  yield* go(0, 0); state.result = 'Đã duyệt hết các hoán vị.';
  if (buildTree) state.decision = [...tree];
  yield emit('complete', state.result, state, 6, 'quayLui(0);');
}

const isDistinctArray = (v: any) =>
  Array.isArray(v) && v.length >= 1 && v.length <= 9 &&
  v.every((x: any) => (typeof x === 'string' && x.length > 0 && x.length <= 8) || Number.isInteger(x)) &&
  new Set(v.map(String)).size === v.length;

function validateSinhHoanVi(i: any): string | null {
  if (isDistinctArray(i?.items)) return null;
  if (Number.isInteger(i?.n) && i.n >= 0 && i.n <= 9) return null;
  return 'n phải là số nguyên từ 0 đến 9, hoặc danh sách 1..9 phần tử phân biệt (vd "7 2 4").';
}

export const sinhHoanVi: Algorithm = {
  id: 'sinh-hoan-vi', title: 'Sinh hoán vị', category: 'Quay lui', tags: ['Hoán vị', 'Đánh dấu'], complexity: 'O(n·n!)', description: 'Liệt kê mọi hoán vị của 1..n', goal: 'Chọn số chưa dùng, đi sâu rồi trả lại số đó.', inputFormat: 'Một số n (0..9), hoặc danh sách các phần tử phân biệt (vd "7 2 4").', note: 'Cây quyết định chỉ vẽ khi n ≤ 5 (n! nút sẽ quá lớn). Bản C++ gốc liệt kê 1..n; preset (7, 2, 4) ánh xạ đúng cây trên lớp.', source, pseudocode: ['Nếu viTri == n: inHoanVi()', 'Thử so = 1..n; kiểm tra !daDung[so]', 'Gán hoanVi[viTri]; đánh dấu daDung[so]', 'quayLui(viTri + 1)', 'daDung[so] = false', 'Kết thúc duyệt'], presets: [preset('n = 3', { n: 3 }, '3 vị trí · 6 kết quả'), preset('a = (7, 2, 4)', { items: [7, 2, 4] }, 'Đúng mẫu trên lớp · 6 kết quả'), preset('n = 0', { n: 0 }, 'Một hoán vị rỗng'), preset('n = 8', { n: 8 }, '40.320 kết quả')], example: `7 2 4`, kind: 'array',
  validate: validateSinhHoanVi,
  initial: i => {
    const items = resolveItems(i);
    return { values: Array(items.length).fill(''), secondary: Array(items.length).fill(false), secondaryLabel: 'daDung', decision: items.length <= 5 ? [{ id: 0, parent: null, label: '∅', status: 'root', depth: 0 }] : undefined };
  },
  simulate: permutations,
  parseInput: raw => {
    const t = tokens(raw);
    need(t.length >= 1 && t.length <= 9, 'Cần 1 số n, hoặc danh sách 1..9 phần tử phân biệt.');
    if (t.length === 1 && /^-?\d+$/.test(t[0])) { const n = Number(t[0]); need(Number.isInteger(n), 'n phải là số nguyên.'); return { n }; }
    const nums = t.map(x => /^-?\d+$/.test(x) ? Number(x) : x);
    need(new Set(nums.map(String)).size === nums.length, 'Các phần tử phải phân biệt.');
    return { items: nums };
  },
  randomInput: () => String(ri(1, 8)),
};
