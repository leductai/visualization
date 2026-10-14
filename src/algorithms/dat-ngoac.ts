import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, need } from './_shared';
import source from '../../webcode2/dat_ngoac.cpp?raw';

export interface ExprInput { values: number[]; ops: ('+' | 'x')[] }

const fmt = (v: number) => String(Math.round(v * 1e9) / 1e9);
const showOp = (o: '+' | 'x') => (o === 'x' ? '×' : '+');
const idx = (i: number, j: number, w: number) => i * w + j;

function* parenthesize({ values, ops }: ExprInput): Generator<SimulationEvent> {
  const emit = emitter(source);
  const m = values.length, W = m;
  const dp: number[][] = Array.from({ length: m }, () => Array(m).fill(0));
  const cut: number[][] = Array.from({ length: m }, () => Array(m).fill(-1));
  for (let i = 0; i < m; i++) dp[i][i] = values[i];
  const blank = Array.from({ length: m }, () => Array(m).fill('·'));
  for (let i = 0; i < m; i++) blank[i][i] = fmt(values[i]);
  const state: VisualState = {
    grid: blank.map(row => [...row]),
    rowLabels: values.map((_, i) => String(i)),
    columnLabels: values.map((_, i) => String(i)),
    variables: { soHang: m },
  };
  yield emit('update', `dp[i][i] = x[i] với mọi i.`, state, 1, 'dp[i][i] = x[i];', 0, false);
  for (let len = 2; len <= m; len++) {
    for (let i = 0; i + len - 1 < m; i++) {
      const j = i + len - 1;
      let best = -1;
      state.active = [idx(i, j, W)];
      state.variables = { i, j, doDai: len };
      for (let k = i; k < j; k++) {
        const cand = ops[k] === '+' ? dp[i][k] + dp[k + 1][j] : dp[i][k] * dp[k + 1][j];
        state.active = [idx(i, j, W)]; state.marked = [idx(i, k, W), idx(k + 1, j, W)];
        state.variables = { i, j, k, trai: fmt(dp[i][k]), phai: fmt(dp[k + 1][j]), ungVien: fmt(cand) };
        yield emit('check', `Cắt tại ${k}: ${fmt(dp[i][k])} ${showOp(ops[k])} ${fmt(dp[k + 1][j])} = ${fmt(cand)}.`, state, 2, 'for (int k = i; k < j; k++)', 0, true);
        if (cand > best) {
          best = cand;
          dp[i][j] = cand; cut[i][j] = k;
          state.grid![i][j] = fmt(cand);
          state.variables = { i, j, k, totNhat: fmt(cand) };
          yield emit('update', `DP[${i}][${j}] = ${fmt(cand)} (cắt tại ${k}).`, state, 3, 'dp[i][j] = ungVien; cat[i][j] = k;', 0, false);
        }
      }
    }
  }
  // Truy vết bảng cat dựng biểu thức tối ưu.
  const route: number[] = [];
  const build = (i: number, j: number): string => {
    route.push(idx(i, j, W));
    if (i === j) return fmt(values[i]);
    const k = cut[i][j];
    return `(${build(i, k)} ${ops[k]} ${build(k + 1, j)})`;
  };
  const expr = build(0, m - 1);
  state.path = [...route];
  state.active = [idx(0, m - 1, W)]; state.marked = [];
  state.variables = { totNhat: fmt(dp[0][m - 1]) };
  yield emit('update', `Truy vết được: ${expr}.`, state, 4, 'dung(i, k,', 0, false);
  const outputs = [fmt(dp[0][m - 1]), expr];
  state.outputs = [outputs[0]];
  yield emit('output', `Giá trị lớn nhất: ${outputs[0]}.`, state, 5, 'cout << dp[0][n]', 0, false);
  state.outputs = [outputs[1]];
  yield emit('output', `Biểu thức tối ưu: ${outputs[1]}.`, state, 5, 'dung(0, n,', 0, false);
  state.active = [];
  state.result = `${outputs[0]}\n${outputs[1]}`;
  yield emit('complete', state.result, state, 5, 'return 0;', 0, false);
}

export const datNgoac: Algorithm = {
  id: 'dat-ngoac', title: 'Đặt ngoặc tối ưu', category: 'Quy hoạch động', tags: ['QHĐ khoảng', 'Truy vết'], complexity: 'O(n³)',
  description: 'Đặt ngoặc để giá trị biểu thức lớn nhất',
  goal: 'DP[i][j] thử mọi điểm cắt k, giữ max và truy vết.',
  inputFormat: 'Một chuỗi biểu thức: số không âm và phép + × xen kẽ.',
  note: 'Bảng DP trong C++ chỉ lấy max nên chỉ đúng với số không âm — input âm bị từ chối. Ký hiệu nhân trong output là x cho khớp C++.',
  source,
  pseudocode: [
    'dp[i][i] = x[i] với mọi i',
    'Đoạn dài dần, thử mọi điểm cắt k',
    'Tính ứng viên, giữ lớn nhất và điểm cắt',
    'Truy vết bảng cat dựng biểu thức',
    'In giá trị lớn nhất và biểu thức',
  ],
  presets: [
    preset('1+2×3+4', { values: [1, 2, 3, 4], ops: ['+', 'x', '+'] }, 'Tối đa 21 = (1+2)×(3+4)'),
    preset('6+0×6', { values: [6, 0, 6], ops: ['+', 'x'] }, '36 nhờ ngoặc trái'),
    preset('0.1×0.1+0.1', { values: [0.1, 0.1, 0.1], ops: ['x', '+'] }, '0.11'),
  ],
  example: `1+2×3+4`,
  kind: 'grid',
  validate: i => {
    const values = i?.values, ops = i?.ops;
    if (!Array.isArray(values) || values.length < 1 || values.length > 12) return 'Cần 1..12 số.';
    if (!values.every((x: any) => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= 1e12)) return 'Các số phải không âm và hữu hạn.';
    if (!Array.isArray(ops) || ops.length !== values.length - 1 || !ops.every((o: any) => o === '+' || o === 'x')) return 'Phép toán phải là + hoặc × xen kẽ.';
    return null;
  },
  initial: i => {
    const values = i.values as number[], m = values.length;
    const grid = Array.from({ length: m }, () => Array(m).fill('·'));
    for (let k = 0; k < m; k++) grid[k][k] = fmt(values[k]);
    return {
      grid,
      rowLabels: values.map((_, k) => String(k)),
      columnLabels: values.map((_, k) => String(k)),
    };
  },
  simulate: parenthesize,
  parseInput: raw => {
    const s = raw.replace(/\s+/g, '');
    need(s.length > 0, 'Cần một biểu thức.');
    const parts = s.split(/([+×*xX])/).filter(p => p.length > 0);
    need(parts.length >= 1 && parts.length % 2 === 1, 'Biểu thức phải dạng số phép số …');
    const values: number[] = [], ops: ('+' | 'x')[] = [];
    parts.forEach((p, k) => {
      if (k % 2 === 0) {
        need(/^\d+(\.\d+)?$/.test(p), `Số không hợp lệ: "${p}".`);
        const v = Number(p);
        need(Number.isFinite(v) && v >= 0, 'Các số phải không âm.');
        values.push(v);
      } else {
        need(p === '+' || p === '×' || p === '*' || p === 'x' || p === 'X', `Phép toán không hợp lệ: "${p}".`);
        ops.push(p === '+' ? '+' : 'x');
      }
    });
    need(values.length >= 1 && values.length <= 12, 'Cần 1..12 số.');
    return { values, ops };
  },
  randomInput: () => {
    const n = ri(2, 5);
    const parts: string[] = [String(ri(0, 9))];
    for (let k = 1; k < n; k++) parts.push(Math.random() < 0.5 ? '+' : '×', String(ri(0, 9)));
    return parts.join('');
  },
} as Algorithm;
