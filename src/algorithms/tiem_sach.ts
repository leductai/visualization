import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, pick, randomDigits, randomLetters, randomWeights, safeArray, tokens, need } from './_shared';
import source from '../../webcode2/tiem_sach.cpp?raw';

type KnapsackInput = { weights: number[]; prices: number[]; capacity: number };

function* knapsack({ weights, prices, capacity }: KnapsackInput): Generator<SimulationEvent> {
  const emit = emitter(source), dp = Array(capacity + 1).fill(0);
  const state: VisualState = { values: dp, labels: dp.map((_, j) => String(j)), secondary: weights, secondaryLabel: 'Giá sách / trongLuong' };
  for (let i = 0; i < weights.length; i++) {
    for (let j = capacity; j >= weights[i]; j--) {
      const candidate = dp[j - weights[i]] + prices[i]; state.active = [j]; state.marked = [j - weights[i]];
      state.variables = { sach: i + 1, gia: weights[i], soTrang: prices[i], nganSach: j, ungVien: candidate, hienTai: dp[j] };
      yield emit('check', `So sánh ${candidate} với dp[${j}] = ${dp[j]}.`, state, 2, 'if (giaTriMax[j - trongLuong[i]]');
      if (candidate > dp[j]) { dp[j] = candidate; yield emit('update', `dp[${j}] = ${candidate}; duyệt ngân sách giảm để mỗi sách chỉ chọn một lần.`, state, 3, 'giaTriMax[j] ='); }
      else yield emit('reject', 'Giữ phương án hiện tại.', state, 2, 'if (giaTriMax[j - trongLuong[i]]');
    }
  }
  state.result = String(dp[capacity]); state.outputs = [state.result]; state.active = [capacity];
  yield emit('output', `Số trang tối đa: ${state.result}.`, state, 4, 'cout << giaTriMax');
  yield emit('complete', `Kết quả: ${state.result}.`, state, 4, 'cout << giaTriMax');
}

export const tiemSach: Algorithm = {
  id: 'tiem_sach', title: 'Tiệm sách', category: 'Quy hoạch động', tags: ['Knapsack 0/1', 'DP một chiều'], complexity: 'O(n·B)', description: 'Chọn sách để có nhiều trang nhất', goal: 'Duyệt ngân sách giảm dần để không chọn lặp một cuốn sách.', inputFormat: 'Giá, số trang mỗi sách và ngân sách B.', source, pseudocode: ['Khởi tạo giaTriMax[0..B] = 0', 'Với mỗi sách, duyệt j từ B xuống giá sách', 'dp[j] = max(dp[j], dp[j−giá] + sốTrang)', 'In dp[B]'], presets: [preset('Bốn cuốn sách', { weights: [4, 8, 5, 3], prices: [5, 12, 8, 1], capacity: 10 }, 'Ngân sách 10 · Tối đa 13 trang'), preset('Không đủ ngân sách', { weights: [4, 8], prices: [5, 12], capacity: 2 }, 'Không chọn được cuốn nào'), preset('Mỗi sách chỉ một lần', { weights: [2], prices: [3], capacity: 4 }, 'Kết quả 3, không phải 6')], example: `4 10
4 8 5 3
5 12 8 1`, kind: 'array', validate: i => safeArray(i?.weights) && safeArray(i?.prices) && i.weights.length <= 1000 && i.weights.length === i.prices.length && i.weights.every((x: number) => x > 0) && i.prices.every((x: number) => x >= 0) && Number.isInteger(i.capacity) && i.capacity >= 0 && i.capacity <= 100000 ? null : 'Giá, số trang hoặc ngân sách không hợp lệ.', initial: i => ({ values: Array(i.capacity + 1).fill(0), labels: Array.from({ length: i.capacity + 1 }, (_, j) => String(j)), secondary: i.weights, secondaryLabel: 'Giá sách' }), simulate: knapsack,
  parseInput: raw => { const t = tokens(raw); need(t.length >= 2, 'Cần n, x và dữ liệu.'); const n = Number(t[0]), capacity = Number(t[1]); need(Number.isInteger(n) && Number.isInteger(capacity) && n > 0 && capacity >= 0, 'n, x không hợp lệ.'); const weights = t.slice(2, 2 + n).map(Number); const prices = t.slice(2 + n, 2 + 2 * n).map(Number); need(weights.length === n && prices.length === n && weights.every(x => Number.isInteger(x) && x > 0) && prices.every(x => Number.isInteger(x) && x >= 0), 'Dữ liệu sách không hợp lệ.'); return { weights, prices, capacity }; },
  randomInput: () => { const n = ri(2, 5), c = ri(3, 12); const w = Array.from({length: n}, () => ri(1, 8)); const p = Array.from({length: n}, () => ri(1, 15)); return `${n} ${c}\n${w.join(' ')}\n${p.join(' ')}`; },
};
