import type { Algorithm, Cell, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, tokens, need, randomLetters } from './_shared';
import source from '../../webcode2/day_con_chung_dai_nhat.cpp?raw';

export interface LCSInput { a: string; b: string }
const MAXLEN = 30;

function* lcs({ a, b }: LCSInput): Generator<SimulationEvent> {
  const emit = emitter(source);
  const n = a.length, m = b.length, cols = m + 1;
  const dp = Array.from({ length: n + 1 }, () => Array(cols).fill(0));
  const grid: Cell[][] = Array.from({ length: n + 1 }, () => Array<Cell>(cols).fill('·'));
  const state: VisualState = {
    grid,
    rowLabels: ['∅', ...a.split('')],
    columnLabels: ['∅', ...b.split('')],
    variables: { n, m },
  };
  for (let j = 0; j <= m; j++) grid[0][j] = 0;
  for (let i = 0; i <= n; i++) grid[i][0] = 0;
  yield emit('update', `Hàng 0 và cột 0 bằng 0 (chuỗi rỗng không có gì chung).`, state, 1, 'khoiTaoBang');
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    const idx = i * cols + j, x = a[i - 1], y = b[j - 1], match = x === y;
    state.active = [idx];
    state.variables = { i, j, kyTuX: x, kyTuY: y };
    yield emit('check', `So sánh X[${i}] = '${x}' với Y[${j}] = '${y}'${match ? ': khớp' : ': khác'} nhau.`, state, match ? 2 : 3, match ? 'khopNhau' : 'layMax');
    if (match) {
      dp[i][j] = dp[i - 1][j - 1] + 1; grid[i][j] = dp[i][j];
      state.marked = [(i - 1) * cols + (j - 1)];
      state.variables = { i, j, dp: dp[i][j], tuOng: `(${i - 1}, ${j - 1})` };
      yield emit('accept', `Khớp: dp[${i}][${j}] = dp[${i - 1}][${j - 1}] + 1 = ${dp[i][j]}.`, state, 2, 'khopNhau');
    } else {
      dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]); grid[i][j] = dp[i][j];
      const fromTop = dp[i - 1][j] >= dp[i][j - 1];
      state.marked = fromTop ? [(i - 1) * cols + j] : [i * cols + (j - 1)];
      state.variables = { i, j, dp: dp[i][j], layTu: fromTop ? 'trên' : 'trái' };
      yield emit('update', `Khác: dp[${i}][${j}] = max(${dp[i - 1][j]}, ${dp[i][j - 1]}) = ${dp[i][j]}.`, state, 3, 'layMax');
    }
  }
  const len = dp[n][m];
  let i = n, j = m;
  const chain: string[] = [], path: number[] = [];
  while (i > 0 && j > 0) {
    const idx = i * cols + j;
    if (a[i - 1] === b[j - 1]) {
      path.unshift(idx); chain.unshift(a[i - 1]);
      state.path = [...path]; state.active = [idx];
      state.variables = { i, j, nhan: a[i - 1], chuoi: chain.join('') };
      yield emit('update', `Truy vết (${i}, ${j}): khớp '${a[i - 1]}' → nhận vào LCS "${chain.join('')}".`, state, 4, 'truyVet');
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      state.active = [idx]; state.marked = [(i - 1) * cols + j];
      state.variables = { i, j, diChuyen: 'lên' };
      yield emit('update', `Truy vết (${i}, ${j}): đi lên theo max.`, state, 4, 'truyVet');
      i--;
    } else {
      state.active = [idx]; state.marked = [i * cols + (j - 1)];
      state.variables = { i, j, diChuyen: 'sang trái' };
      yield emit('update', `Truy vết (${i}, ${j}): sang trái theo max.`, state, 4, 'truyVet');
      j--;
    }
  }
  state.active = []; state.path = [...path];
  state.variables = { doDai: len, chuoi: chain.join('') };
  state.result = `Độ dài ${len} · LCS "${chain.join('')}".`;
  state.outputs = [String(len), chain.join('')];
  yield emit('output', `Dãy con chung dài nhất dài ${len}: "${chain.join('')}".`, state, 5, 'inKetQua');
  yield emit('complete', state.result, state, 5, 'inKetQua');
}

export const dayConChungDaiNhat: Algorithm = {
  id: 'day-con-chung-dai-nhat', title: 'Dãy con chung dài nhất', category: 'Quy hoạch động',
  tags: ['LCS', 'Truy vết'], complexity: 'O(n·m)',
  description: 'Tìm dãy con chung dài nhất của hai chuỗi',
  goal: 'Điền bảng dp từng ô rồi truy vết ngược từ dp[n][m] về gốc.',
  inputFormat: 'Hai dòng: chuỗi X rồi chuỗi Y (mỗi chuỗi 0..30 ký tự, không dấu cách).',
  note: 'Bảng đầy đủ được giữ để quan sát và truy vết; chuỗi rỗng cho LCS độ dài 0.',
  source,
  pseudocode: [
    'Hàng 0 và cột 0 bằng 0',
    'X[i−1] == Y[j−1]: dp ô chéo + 1',
    'Khác nhau: max(ô trên, ô trái)',
    'Truy vết từ dp[n][m] về gốc',
    'In độ dài và chuỗi LCS',
  ],
  presets: [
    preset('Mẫu abcbadt/cbkadt', { a: 'abcbadt', b: 'cbkadt' }, 'LCS "cbadt" · dài 5'),
    preset('Giống nhau', { a: 'algo', b: 'algo' }, 'LCS "algo" · dài 4'),
    preset('Không chung', { a: 'abc', b: 'xyz' }, 'LCS rỗng · dài 0'),
  ],
  example: 'abcbadt\ncbkadt',
  kind: 'grid',
  validate: i => typeof i?.a === 'string' && typeof i?.b === 'string' && i.a.length <= MAXLEN && i.b.length <= MAXLEN && /^\S*$/.test(i.a) && /^\S*$/.test(i.b)
    ? null : `Mỗi chuỗi 0..${MAXLEN} ký tự, không chứa dấu cách.`,
  initial: i => ({
    grid: Array.from({ length: i.a.length + 1 }, () => Array<Cell>(i.b.length + 1).fill('·')),
    rowLabels: ['∅', ...i.a.split('')], columnLabels: ['∅', ...i.b.split('')],
  }),
  simulate: lcs,
  parseInput: raw => {
    const lines = raw.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const t = lines.length === 2 ? lines : tokens(raw);
    need(t.length === 2, 'Cần đúng hai chuỗi X và Y (hai dòng hoặc cách nhau bởi dấu cách).');
    const [a, b] = t;
    need(a.length <= MAXLEN && b.length <= MAXLEN && /^\S*$/.test(a) && /^\S*$/.test(b), `Mỗi chuỗi 0..${MAXLEN} ký tự, không chứa dấu cách.`);
    return { a, b };
  },
  randomInput: () => `${randomLetters(ri(3, 8), 'abcd')}\n${randomLetters(ri(3, 8), 'abcd')}`,
} as Algorithm;
