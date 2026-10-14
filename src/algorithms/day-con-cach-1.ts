import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, sequenceValidation, tokens, need } from './_shared';
import source from '../../webcode2/day_con_cach_1.cpp?raw';

function* longestDiffOne({ values }: { values: number[] }): Generator<SimulationEvent> {
  const emit = emitter(source);
  const n = values.length;
  const dp = Array(n).fill(1), prev = Array(n).fill(-1);
  const state: VisualState = {
    values: [...values], labels: values.map((_, i) => String(i + 1)),
    secondary: [...dp], secondaryLabel: 'doDai',
    variables: { n },
  };
  let best = 0, last = -1;
  yield emit('update', `Khởi tạo dp[i] = 1 với mọi i.`, state, 1, 'vector<int> dp(n, 1), truoc(n, -1);', 0, false);
  for (let i = 0; i < n; i++) {
    state.active = [i]; state.marked = [];
    state.variables = { i: i + 1 };
    for (let j = 0; j < i; j++) {
      const diff = Math.abs(values[i] - values[j]);
      state.active = [i]; state.marked = [j];
      state.variables = { i: i + 1, j: j + 1, chenh: diff, doDai: dp[i] };
      yield emit('check', `|${values[i]} − ${values[j]}| = ${diff} ${diff === 1 ? '→ nối được.' : '→ bỏ qua.'}`, state, 2, 'abs(a[i] - a[j]) == 1', 0, true);
      if (diff === 1 && dp[j] + 1 > dp[i]) {
        dp[i] = dp[j] + 1; prev[i] = j;
        state.secondary = [...dp];
        state.variables = { i: i + 1, j: j + 1, doDai: dp[i] };
        yield emit('update', `dp[${i + 1}] = ${dp[i]}, nối sau vị trí ${j + 1}.`, state, 3, 'dp[i] = dp[j] + 1;', 0, false);
      }
    }
    if (dp[i] > best) {
      best = dp[i]; last = i;
      state.variables = { i: i + 1, totNhat: best };
      yield emit('update', `Tốt nhất hiện tại: dài ${best} kết thúc ở vị trí ${i + 1}.`, state, 4, 'if (dp[i] > totNhat)', 0, false);
    }
  }
  const chain: number[] = [];
  for (let v = last; v !== -1; v = prev[v]) chain.push(v);
  chain.reverse();
  state.path = [...chain];
  state.active = []; state.marked = [];
  state.result = `${best}\n${chain.map(i => values[i]).join(' ')}`;
  state.outputs = [state.result];
  state.variables = { totNhat: best };
  yield emit('output', `Dài ${best}: ${chain.map(i => values[i]).join(' ') || '∅'}.`, state, 5, 'cout << totNhat', 0, false);
  yield emit('complete', 'Đã dựng dãy con cách 1 dài nhất.', state, 5, 'cout << totNhat', 0, false);
}

export const dayConCach1: Algorithm = {
  id: 'day-con-cach-1', title: 'Dãy con cách 1', category: 'Quy hoạch động', tags: ['DP O(n²)', 'Truy vết'], complexity: 'O(n²)',
  description: 'Dãy con dài nhất có hai số liền kề chênh nhau đúng 1',
  goal: 'dp[i] nối sau a[j] gần nhất có hiệu bằng 1, rồi truy vết ngược.',
  inputFormat: 'Dòng 1: n. Dòng 2: n số nguyên.',
  note: 'Điều kiện là |hiệu| == 1 đúng bằng một (không phải tăng dần như LIS). Chấp nhận một dãy dài nhất bất kì.',
  source,
  pseudocode: [
    'dp[i] = 1 với mọi i',
    'Với j < i có |a[i]−a[j]| == 1: xét nối dài',
    'Nối dài dp[i] và lưu truoc[i]',
    'Giữ tốt nhất, truy vết từ cuoi',
    'In độ dài và dãy',
  ],
  presets: [
    preset('Đề mẫu 7 số', { values: [9, 8, 3, 4, 3, 7, 5] }, 'Dài 3 (vd 3 → 4 → 3)'),
    preset('Bằng nhau', { values: [2, 2, 2] }, 'Không nối được · dài 1'),
    preset('Dãy rỗng', { values: [] }, 'Độ dài 0'),
  ],
  example: `7\n9 8 3 4 3 7 5`,
  kind: 'array',
  validate: sequenceValidation,
  initial: i => ({ values: [...(i.values as number[])], labels: (i.values as number[]).map((_, k) => String(k + 1)), secondary: Array((i.values as number[]).length).fill(1), secondaryLabel: 'doDai' }),
  simulate: longestDiffOne,
  parseInput: raw => {
    const t = tokens(raw);
    need(t.length >= 1, 'Cần n và dãy.');
    const n = Number(t[0]);
    need(Number.isInteger(n) && n >= 0, 'n không hợp lệ.');
    const values = t.slice(1).map(Number);
    need(values.length === n && values.every(Number.isSafeInteger), 'Dãy không hợp lệ.');
    return { values };
  },
  randomInput: () => { const n = ri(3, 8); return `${n}\n${Array.from({ length: n }, () => ri(0, 9)).join(' ')}`; },
} as Algorithm;
