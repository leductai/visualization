import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset } from './_shared';
import source from '../../webcode/tinh-diem-mon-hoc.cpp?raw';

function* grades(input: { weights: number[]; target: number }): Generator<SimulationEvent> {
  const emit = emitter(source), n = input.weights.length, scores = Array(n).fill('');
  const target = Math.floor(input.target * 10 + 0.5), low = target * 40 - 20, high = target * 40 + 19;
  const min = Array(n + 1).fill(0), max = Array(n + 1).fill(0);
  for (let i = n - 1; i >= 0; i--) { min[i] = min[i + 1] + input.weights[i]; max[i] = max[i + 1] + input.weights[i] * 40; }
  const state: VisualState = { values: scores, secondary: input.weights, secondaryLabel: 'heSo' };
  function* go(pos: number, sum: number): Generator<SimulationEvent> {
    state.variables = { viTri: pos, tong: sum, tongThapNhat: low, tongCaoNhat: high, canDuoi: sum + min[pos], canTren: sum + max[pos] }; state.active = pos < n ? [pos] : [];
    yield emit('check', 'Kiểm tra khoảng tổng còn khả thi.', state, 1, 'if (tong + tongNhoNhat[viTri]', pos);
    if (sum + min[pos] > high || sum + max[pos] < low) { yield emit('reject', 'Cắt nhánh: khoảng tổng không giao mục tiêu.', state, 2, 'tong + tongLonNhat[viTri] <', pos); return; }
    if (pos === n) { state.outputs = [scores.join(' ')]; yield emit('output', `Xuất điểm ${scores.join(' ')}.`, state, 3, 'inKetQua();', pos); return; }
    for (let x = 1; x <= 40; x++) {
      state.variables = { viTri: pos, tong: sum, tongThapNhat: low, tongCaoNhat: high, canDuoi: sum + min[pos], canTren: sum + max[pos], diemThu: x / 4 };
      state.active = [pos];
      scores[pos] = x / 4; yield emit('accept', `Chọn điểm ${x / 4}.`, state, 4, 'diem[viTri] = diemThu;', pos);
      yield* go(pos + 1, sum + input.weights[pos] * x);
      scores[pos] = ''; state.active = [pos];
      state.variables = { viTri: pos, tong: sum, tongThapNhat: low, tongCaoNhat: high, canDuoi: sum + min[pos], canTren: sum + max[pos] };
      yield emit('undo', `Trở về môn ${pos + 1}.`, state, 5, 'quayLui(viTri + 1, tong +', pos);
    }
  }
  yield* go(0, 0); state.result = 'Đã duyệt các tổ hợp điểm.';
  yield emit('complete', state.result, state, 6, 'quayLui(0, 0);');
}

export const tinhDiemMonHoc: Algorithm = {
  id: 'tinh-diem-mon-hoc', title: 'Tính điểm môn học', category: 'Quay lui', tags: ['Cắt nhánh', 'Trọng số'], complexity: 'O(40^n)', description: 'Các bộ điểm theo bước 0.25', goal: 'Giới hạn tổng giúp loại sớm những nhánh không đạt mục tiêu.', inputFormat: 'Hệ số nguyên dương có tổng 100; mục tiêu 0..10.', note: 'C++ dùng tổng hệ số 100 và khoảng [mục tiêu×40−20, mục tiêu×40+19] với mục tiêu đã nhân 10.', source, pseudocode: ['Tính cận dưới / trên của tổng còn lại', 'Cắt nhánh nếu không giao khoảng mục tiêu', 'Nếu hết môn: xuất bộ điểm', 'Thử diemThu = 1..40 (đơn vị 0.25)', 'quayLui(viTri + 1, tong + heSo×diemThu)', 'Kết thúc duyệt'], presets: [preset('Hai thành phần 50/50', { weights: [50, 50], target: 8 }, 'Hệ số 50, 50 · Mục tiêu 8.0'), preset('Không có kết quả', { weights: [100], target: 0 }, 'Một thành phần · Điểm tối thiểu 0.25')], kind: 'array', validate: i => Array.isArray(i?.weights) && i.weights.length > 0 && i.weights.length <= 10 && i.weights.every((x: any) => Number.isInteger(x) && x > 0) && i.weights.reduce((s: number, x: number) => s + x, 0) === 100 && Number.isFinite(i.target) && i.target >= 0 && i.target <= 10 ? null : 'Hệ số phải có tổng 100; mục tiêu từ 0 đến 10.', initial: i => ({ values: Array(i.weights.length).fill(''), secondary: i.weights, secondaryLabel: 'heSo' }), simulate: grades,
};
