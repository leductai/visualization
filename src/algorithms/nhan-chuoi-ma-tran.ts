import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, need } from './_shared';
import source from '../../webcode2/nhan_chuoi_ma_tran.cpp?raw';

const idx = (i: number, j: number, w: number) => i * w + j;

function* matrixChain({ dims }: { dims: number[] }): Generator<SimulationEvent> {
  const emit = emitter(source);
  const n = dims.length - 1, W = n;
  const dp: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const cut: number[][] = Array.from({ length: n }, () => Array(n).fill(-1));
  const blank = Array.from({ length: n }, () => Array<CellValue>(n).fill('·'));
  for (let i = 0; i < n; i++) blank[i][i] = 0;
  const names = Array.from({ length: n }, (_, i) => `A${i + 1}`);
  const state: VisualState = {
    grid: blank.map(row => [...row]),
    rowLabels: [...names],
    columnLabels: [...names],
    variables: { soMaTran: n },
  };
  yield emit('update', `dp[i][i] = 0 với mọi i (một ma trận không cần nhân).`, state, 1, 'dp[i][i] = 0;', 0, false);
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      let best = Infinity;
      state.active = [idx(i, j, W)];
      state.variables = { i: i + 1, j: j + 1, doDai: len };
      for (let k = i; k < j; k++) {
        const mult = dims[i] * dims[k + 1] * dims[j + 1];
        const cand = dp[i][k] + dp[k + 1][j] + mult;
        state.active = [idx(i, j, W)]; state.marked = [idx(i, k, W), idx(k + 1, j, W)];
        state.variables = { i: i + 1, j: j + 1, k: k + 1, trai: dp[i][k], phai: dp[k + 1][j], phiNhan: mult, ungVien: cand };
        yield emit('check', `Cắt tại ${k + 1}: ${dp[i][k]} + ${dp[k + 1][j]} + ${dims[i]}·${dims[k + 1]}·${dims[j + 1]} = ${cand}.`, state, 2, 'for (int k = i; k < j; k++)', 0, true);
        if (cand < best) {
          best = cand;
          dp[i][j] = cand; cut[i][j] = k;
          state.grid![i][j] = cand;
          state.variables = { i: i + 1, j: j + 1, k: k + 1, totNhat: cand };
          yield emit('update', `DP[${i + 1}][${j + 1}] = ${cand} (cắt tại ${k + 1}).`, state, 3, 'dp[i][j] = ungVien; cat[i][j] = k;', 0, false);
        }
      }
    }
  }
  // Truy vết bảng cat dựng thứ tự nhân tối ưu.
  const route: number[] = [];
  const build = (i: number, j: number): string => {
    route.push(idx(i, j, W));
    if (i === j) return `A${i + 1}`;
    const k = cut[i][j];
    return `(${build(i, k)} x ${build(k + 1, j)})`;
  };
  const expr = build(0, n - 1);
  state.path = [...route];
  state.active = [idx(0, n - 1, W)]; state.marked = [];
  state.variables = { totNhat: dp[0][n - 1] };
  yield emit('update', `Truy vết được: ${expr}.`, state, 4, 'dung(i, k, cat)', 0, false);
  const outputs = [String(dp[0][n - 1]), expr];
  state.outputs = [outputs[0]];
  yield emit('output', `Số phép nhân ít nhất: ${outputs[0]}.`, state, 5, 'cout << dp[0][n - 1]', 0, false);
  state.outputs = [outputs[1]];
  yield emit('output', `Thứ tự nhân tối ưu: ${outputs[1]}.`, state, 5, 'dung(0, n - 1, cat)', 0, false);
  state.active = [];
  state.result = `${outputs[0]}\n${outputs[1]}`;
  yield emit('complete', state.result, state, 5, 'return 0;', 0, false);
}

type CellValue = string | number;

export const nhanChuoiMaTran: Algorithm = {
  id: 'nhan-chuoi-ma-tran', title: 'Nhân chuỗi ma trận', category: 'Quy hoạch động', tags: ['QHĐ khoảng', 'Truy vết'], complexity: 'O(n³)',
  description: 'Thứ tự nhân chuỗi ma trận ít phép nhân nhất',
  goal: 'DP[i][j] thử mọi điểm cắt k, cộng phí p[i−1]·p[k]·p[j].',
  inputFormat: 'Một dòng dãy kích thước p0..pn (2..13 số nguyên dương).',
  note: 'Ai là p[i−1]×p[i] theo đúng đề. Ký hiệu nhân trong output là x cho khớp C++.',
  source,
  pseudocode: [
    'dp[i][i] = 0 với mọi i',
    'Đoạn dài dần, thử mọi điểm cắt k',
    'Cộng phí nhân, giữ nhỏ nhất và điểm cắt',
    'Truy vết bảng cat dựng thứ tự nhân',
    'In số phép nhân ít nhất và thứ tự',
  ],
  presets: [
    preset('Kinh điển 6 ma trận', { dims: [30, 35, 15, 5, 10, 20, 25] }, 'Ít nhất 15125 phép nhân'),
    preset('Hai ma trận', { dims: [10, 20, 30] }, '10·20·30 = 6000'),
    preset('Một ma trận', { dims: [5, 7] }, 'Không cần nhân'),
  ],
  example: `30 35 15 5 10 20 25`,
  kind: 'grid',
  validate: i => {
    const dims = i?.dims;
    if (!Array.isArray(dims) || dims.length < 2 || dims.length > 13) return 'Cần 2..13 kích thước (1..12 ma trận).';
    if (!dims.every((x: any) => Number.isInteger(x) && x >= 1 && x <= 1000)) return 'Kích thước phải là số nguyên dương ≤ 1000.';
    return null;
  },
  initial: i => {
    const dims = i.dims as number[], n = dims.length - 1;
    const grid = Array.from({ length: n }, () => Array<string | number>(n).fill('·'));
    for (let k = 0; k < n; k++) grid[k][k] = 0;
    const names = Array.from({ length: n }, (_, k) => `A${k + 1}`);
    return { grid, rowLabels: [...names], columnLabels: [...names] };
  },
  simulate: matrixChain,
  parseInput: raw => {
    const t = raw.trim().split(/\s+/).filter(Boolean);
    need(t.length >= 2 && t.length <= 13, 'Cần 2..13 kích thước.');
    const dims = t.map(Number);
    need(dims.every(x => Number.isInteger(x) && x >= 1 && x <= 1000), 'Kích thước phải là số nguyên dương ≤ 1000.');
    return { dims };
  },
  randomInput: () => {
    const n = ri(2, 5);
    return Array.from({ length: n + 1 }, () => ri(2, 20)).join(' ');
  },
} as Algorithm;
