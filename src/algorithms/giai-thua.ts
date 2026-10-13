import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, tokens, need } from './_shared';
import source from '../../webcode/giai-thua.cpp?raw';

function* factorial({ n }: { n: number }): Generator<SimulationEvent> {
  const emit = emitter(source);
  const stack: number[] = [n], resolved: string[] = [];
  const state: VisualState = { values: [...stack], secondary: [...resolved], secondaryLabel: 'kết quả trả về' };
  function* go(k: number, depth: number): Generator<SimulationEvent, bigint> {
    state.variables = { n: k, doSau: depth }; state.active = stack.length ? [stack.length - 1] : [];
    yield emit('check', `n = ${k}, đã về 0 chưa?`, state, 1, 'if (n == 0) return 1;', depth, true);
    if (k === 0) {
      resolved.push('1');
      state.secondary = [...resolved];
      yield emit('update', 'giaithua(0) = 1.', state, 1, 'if (n == 0) return 1;', depth, false);
      return 1n;
    }
    stack.push(k - 1);
    state.values = [...stack];
    state.variables = { n: k, doSau: depth };
    yield emit('accept', `Gọi giaithua(${k - 1}).`, state, 2, 'return n * giaithua(n - 1);', depth, false);
    const sub: bigint = yield* go(k - 1, depth + 1);
    stack.pop();
    const res = BigInt(k) * sub;
    resolved.push(res.toString());
    state.values = [...stack]; state.secondary = [...resolved];
    state.active = stack.length ? [stack.length - 1] : [];
    state.variables = { n: k, doSau: depth, nhan: `${k} × ${sub.toString()}` };
    yield emit('update', `giaithua(${k}) = ${k} × ${sub.toString()} = ${res.toString()}.`, state, 2, 'return n * giaithua(n - 1);', depth, false);
    return res;
  }
  const result: bigint = yield* go(n, 0);
  state.values = [...stack]; state.secondary = [...resolved];
  state.active = [];
  state.variables = { n, doSau: 0 };
  state.outputs = [result.toString()];
  yield emit('output', `${n}! = ${result.toString()}.`, state, 3, 'giaithua(n)', 0, false);
  state.result = `${n}! = ${result.toString()}.`;
  yield emit('complete', state.result, state, 3, 'giaithua(n)', 0, false);
}

export const giaiThua: Algorithm = {
  id: 'giai-thua', title: 'Giai thừa', category: 'Giảm để trị', tags: ['Đệ quy', 'Top-down'], complexity: 'O(n)',
  description: 'Tính n! bằng giảm để trị top-down',
  goal: 'Giảm n về 0 rồi nhân ngược lên: n! = n × (n−1)!',
  inputFormat: 'Số nguyên n từ 0 đến 20.',
  note: 'Ngăn xếp khung gọi hiện ở mảng chính, kết quả trả về từng tầng ở mảng phụ. Tính bằng BigInt nên khớp C++ long long trong khoảng cho phép.',
  source,
  pseudocode: [
    'Nếu n == 0: trả về 1',
    'Tính (n−1)! rồi nhân với n',
    'Kết thúc tính n!',
  ],
  presets: [
    preset('n = 5', { n: 5 }, '120'),
    preset('n = 0', { n: 0 }, 'Trường hợp dừng = 1'),
    preset('n = 10', { n: 10 }, '3.628.800'),
  ],
  example: `5`,
  kind: 'array',
  validate: i => Number.isInteger(i?.n) && i.n >= 0 && i.n <= 20 ? null : 'n phải là số nguyên từ 0 đến 20.',
  initial: i => ({ values: [i.n], secondary: [], secondaryLabel: 'kết quả trả về' }),
  simulate: factorial,
  parseInput: raw => { const t = tokens(raw); need(t.length === 1, 'Cần đúng một số nguyên n.'); const n = Number(t[0]); need(Number.isInteger(n), 'n phải là số nguyên.'); return { n }; },
  randomInput: () => String(ri(3, 8)),
} as Algorithm;
