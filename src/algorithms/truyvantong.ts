import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, pick, randomDigits, randomLetters, randomWeights, safeArray, tokens, need } from './_shared';
import source from '../../webcode2/truyvantong.cpp?raw';

type Sequence = { values: number[] };
type PrefixInput = Sequence & { queries: number[][] };

function* prefix({ values, queries }: PrefixInput): Generator<SimulationEvent> {
  const emit = emitter(source), sums = Array(values.length + 1).fill(0);
  const state: VisualState = { values, secondary: sums, secondaryLabel: 'tongTichLuy[0..n]' };
  for (let i = 1; i <= values.length; i++) {
    sums[i] = sums[i - 1] + values[i - 1]; state.active = [i - 1]; state.variables = { i, giaTri: values[i - 1], tong: sums[i] };
    yield emit('update', `prefix[${i}] = ${sums[i - 1]} + ${values[i - 1]} = ${sums[i]}.`, state, 2, 'tongTichLuy[i] =');
  }
  for (const [left, right] of queries) {
    const result = sums[right] - sums[left - 1];
    state.marked = Array.from({ length: right - left + 1 }, (_, i) => left - 1 + i); state.active = [];
    state.variables = { trai: left, phai: right, prefixPhai: sums[right], prefixTruocTrai: sums[left - 1] }; state.outputs = [String(result)];
    yield emit('output', `Tổng [${left}, ${right}] = ${sums[right]} − ${sums[left - 1]} = ${result}.`, state, 3, 'cout << tongTichLuy[chiSoPhai]');
  }
  state.result = 'Đã trả lời mọi truy vấn.'; yield emit('complete', state.result, state, 4, 'return 0;');
}

export const truyvantong: Algorithm = {
  id: 'truyvantong', title: 'Truy vấn tổng', category: 'Cấu trúc dữ liệu', tags: ['Prefix sum', 'Truy vấn'], complexity: 'O(n + q)', description: 'Trả lời tổng đoạn bằng tổng tiền tố', goal: 'Tổng [l, r] bằng prefix[r] − prefix[l−1].', inputFormat: 'Dãy số nguyên và truy vấn l..r (chỉ số từ 1).', source, pseudocode: ['tongTichLuy[0] = 0', 'prefix[i] = prefix[i−1] + daySo[i]', 'In prefix[r] − prefix[l−1] cho mỗi truy vấn', 'Kết thúc'], presets: [preset('Ba truy vấn', { values: [3, 1, 4, 1, 5], queries: [[1, 3], [2, 5], [4, 4]] }, '5 phần tử · 3 truy vấn'), preset('Có số âm', { values: [-3, 5, -2], queries: [[1, 3], [1, 1]] }, 'Tổng toàn dãy = 0')], example: `5 3
3 1 4 1 5
1 3
2 5
4 4`, kind: 'array', validate: i => safeArray(i?.values) && Array.isArray(i.queries) && i.queries.every((q: any) => Array.isArray(q) && q.length === 2 && q.every(Number.isInteger) && q[0] >= 1 && q[0] <= q[1] && q[1] <= i.values.length) ? null : 'Dãy hoặc truy vấn không hợp lệ.', initial: i => ({ values: i.values, secondary: Array(i.values.length + 1).fill(0), secondaryLabel: 'tongTichLuy[0..n]' }), simulate: prefix,
  parseInput: raw => { const t = tokens(raw); need(t.length >= 2, 'Cần n, q và dữ liệu.'); const n = Number(t[0]), q = Number(t[1]); need(Number.isInteger(n) && Number.isInteger(q) && n > 0 && q > 0, 'n, q phải là số nguyên dương.'); const values = t.slice(2, 2 + n).map(Number); need(values.length === n && values.every(Number.isSafeInteger), 'Dãy giá trị không hợp lệ.'); const rest = t.slice(2 + n).map(Number); need(rest.length === q * 2, `Cần ${q} truy vấn l r.`); const queries = Array.from({ length: q }, (_, i) => rest.slice(i * 2, i * 2 + 2)); need(queries.every(([l, r]) => Number.isInteger(l) && Number.isInteger(r) && l >= 1 && l <= r && r <= n), 'Truy vấn không hợp lệ.'); return { values, queries }; },
  randomInput: () => { const n = ri(3, 8), q = ri(1, 4); const vals = Array.from({length: n}, () => ri(-9, 9)); const qs = Array.from({length: q}, () => { const l = ri(1, n), r = ri(l, n); return `${l} ${r}`; }); return `${n} ${q}\n${vals.join(' ')}\n${qs.join('\n')}`; },
};
