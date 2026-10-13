import type { Algorithm, DecisionNode, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, tokens, need } from './_shared';
import source from '../../webcode/liet-ke-nhi-phan.cpp?raw';

function* binaries({ n }: { n: number }): Generator<SimulationEvent> {
  const emit = emitter(source), values: (string | number)[] = Array(n).fill('');
  const state: VisualState = { values: [...values] };
  // Vét cạn nhị phân không có nhánh cắt nên cây luôn đầy đủ; chỉ vẽ khi n ≤ 5.
  const buildTree = n <= 5;
  const tree: DecisionNode[] = buildTree ? [{ id: 0, parent: null, label: '∅', status: 'root', depth: 0 }] : [];
  let nextId = 1;
  if (buildTree) state.decision = [...tree];
  function* go(pos: number, parentId: number): Generator<SimulationEvent> {
    state.variables = { n, viTri: pos }; state.active = pos < n ? [pos] : [];
    if (buildTree) state.decision = [...tree];
    if (pos === n) { state.outputs = [values.join('')]; yield emit('output', `In dãy: ${values.join('')}.`, state, 1, 'inDay();', pos); return; }
    for (let bit = 0; bit <= 1; bit++) {
      state.variables = { n, viTri: pos, bit };
      if (buildTree) state.decision = [...tree];
      yield emit('check', `Xét bit ${bit} tại vị trí ${pos}.`, state, 2, 'for (int bit = 0; bit <= 1; bit++)', pos);
      values[pos] = bit;
      let nodeId = -1;
      if (buildTree) {
        nodeId = nextId++;
        tree.push({ id: nodeId, parent: parentId, label: String(bit), status: 'current', depth: pos + 1 });
        state.decision = [...tree];
      }
      yield emit('accept', `Chọn bit ${bit} cho vị trí ${pos}.`, state, 3, 'day[viTri] = bit;', pos);
      yield* go(pos + 1, buildTree ? nodeId : -1);
      if (buildTree) {
        const node = tree.find(t => t.id === nodeId);
        if (node) node.status = 'accepted';
        state.decision = [...tree];
      }
    }
  }
  yield* go(0, 0); state.result = 'Đã liệt kê mọi dãy nhị phân.';
  if (buildTree) state.decision = [...tree];
  yield emit('complete', state.result, state, 4, 'quayLui(0);');
}

export const lietKeNhiPhan: Algorithm = {
  id: 'liet-ke-nhi-phan', title: 'Dãy nhị phân', category: 'Quay lui', tags: ['Vét cạn', 'Nhị phân'], complexity: 'O(n·2ⁿ)', description: 'Liệt kê mọi dãy nhị phân độ dài n', goal: 'Mỗi vị trí thử 0 rồi 1; không có nhánh nào bị cắt.', inputFormat: 'Số nguyên n từ 0 đến 12.', note: 'Vét cạn nên mọi nhánh đều đi tới lá, cây quyết định không có nhánh đỏ. Cây chỉ vẽ khi n ≤ 5 (đủ 2^n lá).',   source, pseudocode: ['Nếu viTri == n: inDay()', 'Thử bit = 0..1', 'Gán day[viTri] = bit rồi quayLui(viTri + 1)', 'Kết thúc liệt kê'], presets: [preset('n = 3', { n: 3 }, '3 vị trí · 8 dãy'), preset('n = 0', { n: 0 }, 'Một dãy rỗng'), preset('n = 5', { n: 5 }, 'Cây nhị phân đầy đủ · 32 dãy')], example: `3`, kind: 'array',
  validate: i => Number.isInteger(i?.n) && i.n >= 0 && i.n <= 12 ? null : 'n phải là số nguyên từ 0 đến 12.',
  initial: i => ({ values: Array(i.n).fill(''), decision: i.n <= 5 ? [{ id: 0, parent: null, label: '∅', status: 'root', depth: 0 }] : undefined }),
  simulate: binaries,
  parseInput: raw => { const t = tokens(raw); need(t.length === 1, 'Cần đúng một số nguyên n.'); const n = Number(t[0]); need(Number.isInteger(n), 'n phải là số nguyên.'); return { n }; },
  randomInput: () => String(ri(1, 5)),
} as Algorithm;
