import type { Algorithm, DecisionNode, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, tokens, need } from './_shared';
import source from '../../webcode2/fibonacci.cpp?raw';

function* fibo({ n }: { n: number }): Generator<SimulationEvent> {
  const emit = emitter(source);
  const stack: number[] = [n], resolved: string[] = [];
  const state: VisualState = { values: [...stack], secondary: [...resolved], secondaryLabel: 'kết quả trả về' };
  // Cây gọi nhị phân bùng nổ theo hàm mũ nên chỉ vẽ khi n ≤ 10 (fibo(10) đã 177 nút).
  const buildTree = n <= 10;
  const tree: DecisionNode[] = buildTree ? [{ id: 0, parent: null, label: `f${n}`, status: 'root', depth: 0 }] : [];
  let nextId = 1;
  if (buildTree) state.decision = [...tree];
  function* go(k: number, parentId: number, depth: number): Generator<SimulationEvent, bigint> {
    state.variables = { n: k, doSau: depth }; state.active = stack.length ? [stack.length - 1] : [];
    yield emit('check', `fibo(${k}), đã về trường hợp dừng chưa?`, state, 1, 'if (n <= 1) return n;', depth, true);
    if (k <= 1) {
      resolved.push(String(k));
      state.secondary = [...resolved];
      if (buildTree) {
        tree.push({ id: nextId++, parent: parentId, label: `f${k}`, status: 'accepted', depth: depth + 1 });
        state.decision = [...tree];
      }
      yield emit('update', `fibo(${k}) = ${k}.`, state, 1, 'if (n <= 1) return n;', depth, false);
      return BigInt(k);
    }
    let nodeId = -1;
    if (buildTree) {
      nodeId = nextId++;
      tree.push({ id: nodeId, parent: parentId, label: `f${k}`, status: 'current', depth: depth + 1 });
      state.decision = [...tree];
    }
    yield emit('accept', `Tách fibo(${k}) thành fibo(${k - 1}) + fibo(${k - 2}).`, state, 2, 'return fibo(n - 1) + fibo(n - 2);', depth, false);
    stack.push(k - 1);
    state.values = [...stack];
    const left: bigint = yield* go(k - 1, buildTree ? nodeId : -1, depth + 1);
    stack.pop();
    stack.push(k - 2);
    state.values = [...stack];
    state.variables = { n: k, doSau: depth, trai: left.toString() };
    yield emit('accept', `Xong nhánh trái, tính fibo(${k - 2}).`, state, 2, 'return fibo(n - 1) + fibo(n - 2);', depth, false);
    const right: bigint = yield* go(k - 2, buildTree ? nodeId : -1, depth + 1);
    stack.pop();
    const res = left + right;
    resolved.push(res.toString());
    state.values = [...stack]; state.secondary = [...resolved];
    state.active = stack.length ? [stack.length - 1] : [];
    state.variables = { n: k, doSau: depth, tong: `${left.toString()} + ${right.toString()}` };
    if (buildTree) {
      const node = tree.find(t => t.id === nodeId);
      if (node) node.status = 'accepted';
      state.decision = [...tree];
    }
    yield emit('update', `fibo(${k}) = ${left.toString()} + ${right.toString()} = ${res.toString()}.`, state, 2, 'return fibo(n - 1) + fibo(n - 2);', depth, false);
    return res;
  }
  const result: bigint = yield* go(n, 0, 0);
  state.values = [...stack]; state.secondary = [...resolved];
  state.active = [];
  state.variables = { n, doSau: 0 };
  state.outputs = [result.toString()];
  yield emit('output', `fibo(${n}) = ${result.toString()}.`, state, 3, 'fibo(n)', 0, false);
  state.result = `fibo(${n}) = ${result.toString()}.`;
  yield emit('complete', state.result, state, 3, 'fibo(n)', 0, false);
}

export const fibonacci: Algorithm = {
  id: 'fibonacci', title: 'Fibonacci', category: 'Chia để trị', tags: ['Đệ quy', 'Cây gọi'], complexity: 'O(2ⁿ)',
  description: 'Tính Fibonacci bằng đệ quy top-down',
  goal: 'Tách đôi tới 0/1 rồi cộng ngược lên; thấy rõ tính toán lặp lại.',
  inputFormat: 'Số nguyên n từ 0 đến 20.',
  note: 'Bản ngây thơ không nhớ kết quả nên số lần gọi bùng nổ theo hàm mũ (đây chính là động lực của memoization/QHĐ). Cây gọi chỉ vẽ khi n ≤ 10.',
  source,
  pseudocode: [
    'Nếu n ≤ 1: trả về n',
    'Tính fibo(n−1) rồi fibo(n−2), cộng lại',
    'Kết thúc tính fibo(n)',
  ],
  presets: [
    preset('n = 6', { n: 6 }, 'fibo(6) = 8 · 25 lời gọi'),
    preset('n = 0', { n: 0 }, 'Trường hợp dừng = 0'),
    preset('n = 1', { n: 1 }, 'Trường hợp dừng = 1'),
  ],
  example: `6`,
  kind: 'array',
  validate: i => Number.isInteger(i?.n) && i.n >= 0 && i.n <= 20 ? null : 'n phải là số nguyên từ 0 đến 20.',
  initial: i => ({
    values: [i.n], secondary: [], secondaryLabel: 'kết quả trả về',
    decision: i.n <= 10 ? [{ id: 0, parent: null, label: `f${i.n}`, status: 'root', depth: 0 }] : undefined,
  }),
  simulate: fibo,
  parseInput: raw => { const t = tokens(raw); need(t.length === 1, 'Cần đúng một số nguyên n.'); const n = Number(t[0]); need(Number.isInteger(n), 'n phải là số nguyên.'); return { n }; },
  randomInput: () => String(ri(4, 8)),
} as Algorithm;
