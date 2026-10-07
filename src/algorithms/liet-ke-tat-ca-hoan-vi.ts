import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset } from './_shared';
import source from '../../webcode/liet-ke-tat-ca-hoan-vi.cpp?raw';

function* repeatedPermutations({ digits }: { digits: string }): Generator<SimulationEvent> {
  const emit = emitter(source), count = Array(10).fill(0), values = Array(digits.length).fill('');
  for (const ch of digits) count[Number(ch)]++;
  const state: VisualState = { values, secondary: count.slice(1), secondaryLabel: 'soLanXuatHien[1..9]' };
  function* go(pos: number): Generator<SimulationEvent> {
    state.variables = { doDai: digits.length, viTri: pos }; state.active = pos < digits.length ? [pos] : [];
    if (pos === digits.length) { state.outputs = [values.join('')]; yield emit('output', `Xuất ${values.join('')}.`, state, 1, 'inKetQua();', pos); return; }
    for (let d = 9; d >= 1; d--) {
      yield emit('check', `Còn ${count[d]} chữ số ${d}.`, state, 2, 'if (soLanXuatHien[chuSo] > 0)', pos);
      if (!count[d]) continue;
      values[pos] = String(d); count[d]--; state.secondary = count.slice(1);
      yield emit('accept', `Chọn ${d}, giảm bộ đếm.`, state, 3, 'soLanXuatHien[chuSo]--;', pos);
      yield* go(pos + 1);
      count[d]++; values[pos] = ''; state.secondary = count.slice(1); state.active = [pos];
      state.variables = { doDai: digits.length, viTri: pos, chuSo: d };
      yield emit('undo', `Trả lại chữ số ${d}.`, state, 5, 'soLanXuatHien[chuSo]++;', pos);
    }
  }
  yield* go(0); state.result = digits.includes('0') ? 'Không có kết quả: mã C++ không chọn chữ số 0.' : 'Đã liệt kê mọi hoán vị phân biệt.';
  yield emit('complete', state.result, state, 6, 'quayLui(0);');
}

export const lietKeTatCaHoanVi: Algorithm = {
  id: 'liet-ke-tat-ca-hoan-vi', title: 'Hoán vị có chữ số lặp', category: 'Quay lui', tags: ['Tần suất', 'Giảm dần'], complexity: 'O(n·P)', description: 'Liệt kê các hoán vị phân biệt', goal: 'Bộ đếm giúp tránh sinh kết quả trùng nhau.', inputFormat: 'Chuỗi chữ số, tối đa 20 ký tự.', note: 'C++ chỉ thử 9..1. Đầu vào chứa 0 sẽ không có kết quả.', source, pseudocode: ['Nếu viTri == doDai: inKetQua()', 'Thử chuSo = 9..1 còn xuất hiện', 'Gán ketQua; giảm bộ đếm', 'quayLui(viTri + 1)', 'Khôi phục bộ đếm', 'Kết thúc duyệt'], presets: [preset('112', { digits: '112' }, '3 hoán vị phân biệt'), preset('909', { digits: '909' }, 'Không có kết quả theo C++')], kind: 'array', validate: i => typeof i?.digits === 'string' && /^\d{1,20}$/.test(i.digits) ? null : 'Cần 1..20 chữ số.', initial: i => ({ values: Array(i.digits.length).fill(''), secondary: Array.from({ length: 9 }, (_, j) => [...i.digits].filter(x => x === String(j + 1)).length), secondaryLabel: 'soLanXuatHien[1..9]' }), simulate: repeatedPermutations,
};
