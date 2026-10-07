import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, pick, randomDigits, randomLetters, randomWeights, tokens, need } from './_shared';
import source from '../../webcode/sinh-hoan-vi.cpp?raw';

function* permutations({ n }: { n: number }): Generator<SimulationEvent> {
  const emit = emitter(source), values = Array(n).fill(''), used = Array(n + 1).fill(false);
  const state: VisualState = { values, secondary: used.slice(1), secondaryLabel: 'daDung[1..n]' };
  function* go(pos: number): Generator<SimulationEvent> {
    state.variables = { n, viTri: pos }; state.active = pos < n ? [pos] : [];
    if (pos === n) { state.outputs = [values.join(' ')]; yield emit('output', `In hoán vị: ${values.join(' ')}.`, state, 1, 'inHoanVi();', pos); return; }
    for (let x = 1; x <= n; x++) {
      state.variables = { n, viTri: pos, so: x };
      yield emit('check', `Kiểm tra số ${x} chưa dùng.`, state, 2, 'if (!daDung[so])', pos);
      if (used[x]) { yield emit('reject', `Số ${x} đã dùng.`, state, 2, 'if (!daDung[so])', pos); continue; }
      values[pos] = x; used[x] = true; state.secondary = used.slice(1);
      yield emit('accept', `Chọn ${x} cho vị trí ${pos}.`, state, 3, 'hoanVi[viTri] = so;', pos);
      yield* go(pos + 1);
      used[x] = false; values[pos] = ''; state.active = [pos]; state.secondary = used.slice(1);
      state.variables = { n, viTri: pos, so: x };
      yield emit('undo', `Bỏ đánh dấu ${x}.`, state, 5, 'daDung[so] = false;', pos);
    }
  }
  yield* go(0); state.result = 'Đã duyệt hết các hoán vị.';
  yield emit('complete', state.result, state, 6, 'quayLui(0);');
}

export const sinhHoanVi: Algorithm = {
  id: 'sinh-hoan-vi', title: 'Sinh hoán vị', category: 'Quay lui', tags: ['Hoán vị', 'Đánh dấu'], complexity: 'O(n·n!)', description: 'Liệt kê mọi hoán vị của 1..n', goal: 'Chọn số chưa dùng, đi sâu rồi trả lại số đó.', inputFormat: 'Số nguyên n từ 0 đến 9 (giới hạn mảng C++).', source, pseudocode: ['Nếu viTri == n: inHoanVi()', 'Thử so = 1..n; kiểm tra !daDung[so]', 'Gán hoanVi[viTri]; đánh dấu daDung[so]', 'quayLui(viTri + 1)', 'daDung[so] = false', 'Kết thúc duyệt'], presets: [preset('n = 3', { n: 3 }, '3 vị trí · 6 kết quả'), preset('n = 0', { n: 0 }, 'Một hoán vị rỗng'), preset('n = 8', { n: 8 }, '40.320 kết quả')], example: `3`, kind: 'array', validate: i => Number.isInteger(i?.n) && i.n >= 0 && i.n <= 9 ? null : 'n phải là số nguyên từ 0 đến 9.', initial: i => ({ values: Array(i.n).fill(''), secondary: Array(i.n).fill(false), secondaryLabel: 'daDung[1..n]' }), simulate: permutations,
  parseInput: raw => { const t = tokens(raw); need(t.length === 1, 'Cần đúng một số nguyên n.'); const n = Number(t[0]); need(Number.isInteger(n), 'n phải là số nguyên.'); return { n }; },
  randomInput: () => String(ri(1, 8)),
};
