import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, pick, randomDigits, randomLetters, randomWeights, sequenceValidation, tokens, need } from './_shared';
import source from '../../webcode2/daycontangdainhat.cpp?raw';

type Sequence = { values: number[] };

function* fenwickLIS({ values }: Sequence): Generator<SimulationEvent> {
  const emit = emitter(source), ranks = [...new Set(values)].sort((a, b) => a - b), bit = Array(ranks.length + 1).fill(0);
  const rankOf = new Map(ranks.map((value, index) => [value, index + 1]));
  const state: VisualState = { values, secondary: bit.slice(1), secondaryLabel: 'Fenwick: cực đại tiền tố', labels: values.map((x) => `hạng ${rankOf.get(x)}`) };
  yield emit('update', `Nén tọa độ: ${ranks.join(', ')}.`, state, 1, 'sort(mangSapXep');
  let best = 0;
  for (let i = 0; i < values.length; i++) {
    const rank = rankOf.get(values[i])!; let previous = 0; state.active = [i]; state.marked = [];
    for (let p = rank - 1; p > 0; p -= p & -p) {
      previous = Math.max(previous, bit[p]); state.variables = { i: i + 1, hang: rank, truyVan: p, max: previous };
      yield emit('check', `Đọc Fenwick[${p}] = ${bit[p]}; chỉ truy vấn hạng < ${rank}.`, state, 2, 'if (cayFenwick[viTri] > ketQua)');
    }
    const length = previous + 1;
    for (let p = rank; p <= ranks.length; p += p & -p) {
      bit[p] = Math.max(bit[p], length); state.secondary = bit.slice(1); state.variables = { i: i + 1, hang: rank, capNhat: p, doDai: length };
      yield emit('update', `Fenwick[${p}] = ${bit[p]}.`, state, 3, 'cayFenwick[viTri] = giaTri;');
    }
    best = Math.max(best, length);
  }
  state.result = String(best); state.outputs = [state.result];
  yield emit('output', `Độ dài dãy con tăng nghiêm ngặt: ${best}.`, state, 4, 'cout << doDaiLonNhat');
  yield emit('complete', `Kết quả: ${best}.`, state, 4, 'cout << doDaiLonNhat');
}

export const daycontangdainhat: Algorithm = {
  id: 'daycontangdainhat', title: 'LIS với Fenwick', category: 'Cấu trúc dữ liệu', tags: ['Nén tọa độ', 'Fenwick tree'], complexity: 'O(n·log n)', description: 'Độ dài dãy con tăng dài nhất', goal: 'Truy vấn hạng nhỏ hơn để giữ tính tăng nghiêm ngặt.', inputFormat: 'Dãy số nguyên.', source, pseudocode: ['Sắp xếp và nén các giá trị thành hạng', 'doDai = timMax(hang−1) + 1', 'Cập nhật cực đại Fenwick từ hang trở lên', 'In độ dài lớn nhất'], presets: [preset('Dãy hỗn hợp', { values: [3, 1, 2, 5, 4, 6] }, 'LIS dài 4'), preset('Các giá trị bằng nhau', { values: [2, 2, 2, 2] }, 'Tăng nghiêm ngặt · LIS dài 1'), preset('Dãy rỗng', { values: [] }, 'LIS dài 0')], example: `6
3 1 2 5 4 6`, kind: 'array', validate: sequenceValidation, initial: i => ({ values: i.values, secondary: Array(new Set(i.values).size).fill(0), secondaryLabel: 'Fenwick' }), simulate: fenwickLIS,
  parseInput: raw => { const t = tokens(raw); need(t.length >= 1, 'Cần n và dãy.'); const n = Number(t[0]); need(Number.isInteger(n) && n >= 0, 'n không hợp lệ.'); const values = t.slice(1).map(Number); need(values.length === n && values.every(Number.isSafeInteger), 'Dãy không hợp lệ.'); return { values }; },
  randomInput: () => { const n = ri(0, 10); const vals = Array.from({length: n}, () => ri(-5, 9)); return `${n}\n${vals.join(' ')}`; },
};
