import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset } from './_shared';
import source from '../../webcode2/rut_bai_trung_thuong.cpp?raw';

type EditInput = { a: string; b: string };

function* editDistance({ a, b }: EditInput): Generator<SimulationEvent> {
  const emit = emitter(source), rows = [Array.from({ length: b.length + 1 }, (_, j) => j), Array(b.length + 1).fill(0)];
  const matrix: (number | string)[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill('·'));
  matrix[0] = [...rows[0]];
  const state: VisualState = { grid: matrix, rowLabels: ['∅', ...a], columnLabels: ['∅', ...b], secondary: [...rows[0]], secondaryLabel: 'Hai hàng cuộn: hàng hiện tại', variables: { i: 0, j: 0 } };
  yield emit('update', 'Khởi tạo khoảng cách từ chuỗi rỗng: 0..m.', state, 1, 'soBuocSua[0][j] = j;');
  for (let i = 1; i <= a.length; i++) {
    const cur = rows[i & 1], prev = rows[(i - 1) & 1]; cur[0] = i; matrix[i][0] = i;
    state.active = [i * (b.length + 1)]; state.secondary = [...cur]; state.variables = { i, j: 0 };
    yield emit('update', `Xóa ${i} ký tự để được chuỗi rỗng.`, state, 2, 'soBuocSua[i & 1][0] = i;');
    for (let j = 1; j <= b.length; j++) {
      state.active = [i * (b.length + 1) + j]; state.marked = [(i - 1) * (b.length + 1) + j - 1, (i - 1) * (b.length + 1) + j, i * (b.length + 1) + j - 1];
      state.variables = { i, j, thay: prev[j - 1] + 1, xoa: prev[j] + 1, chen: cur[j - 1] + 1 };
      yield emit('check', `So sánh ${a[i - 1]} với ${b[j - 1]}.`, state, 3, 'if (chuoi1[i-1] == chuoi2[j-1])');
      let operation = 'giữ ký tự', fragment = 'soBuocSua[i & 1][j] = soBuocSua[(i-1) & 1][j-1];';
      cur[j] = prev[j - 1];
      if (a[i - 1] !== b[j - 1]) {
        cur[j]++; operation = 'thay'; fragment = 'soBuocSua[i & 1][j] = soBuocSua[(i-1) & 1][j-1] + 1;';
        if (prev[j] + 1 < cur[j]) { cur[j] = prev[j] + 1; operation = 'xóa'; fragment = 'soBuocSua[i & 1][j] = soBuocSua[(i-1) & 1][j] + 1;'; }
        if (cur[j - 1] + 1 < cur[j]) { cur[j] = cur[j - 1] + 1; operation = 'chèn'; fragment = 'soBuocSua[i & 1][j] = soBuocSua[i & 1][j-1] + 1;'; }
      }
      matrix[i][j] = cur[j]; state.secondary = [...cur];
      yield emit('update', `dp[${i}][${j}] = ${cur[j]} (${operation}).`, state, 4, fragment);
    }
  }
  state.result = String(rows[a.length & 1][b.length]); state.outputs = [state.result];
  yield emit('output', `Khoảng cách chỉnh sửa: ${state.result}.`, state, 5, 'cout << soBuocSua');
  yield emit('complete', `Kết quả: ${state.result}.`, state, 5, 'cout << soBuocSua');
}

export const rutBaiTrungThuong: Algorithm = {
  id: 'rut_bai_trung_thuong', title: 'Rút bài trúng thưởng', category: 'Quy hoạch động', tags: ['Edit distance', 'Hàng cuộn'], complexity: 'O(n·m)', description: 'Khoảng cách chỉnh sửa hai chuỗi', goal: 'Chèn, xóa hoặc thay một ký tự với chi phí 1.', inputFormat: 'Hai chuỗi a và b.', note: 'Bộ tính dùng hai hàng như C++; ma trận đầy đủ chỉ phục vụ quan sát. Chuỗi rỗng là mở rộng vì cin không đọc được chuỗi rỗng.', source, pseudocode: ['Khởi tạo hàng 0 bằng 0..m', 'Đặt dp[i][0] = i', 'So sánh a[i−1] với b[j−1]', 'Giữ ký tự hoặc min(thay, xóa, chèn)', 'In dp[n][m]'], presets: [preset('kitten → sitting', { a: 'kitten', b: 'sitting' }, 'Khoảng cách 3'), preset('Chuỗi rỗng', { a: '', b: 'abc' }, 'Chèn 3 ký tự'), preset('Giống nhau', { a: 'algo', b: 'algo' }, 'Khoảng cách 0')], kind: 'grid', validate: i => typeof i?.a === 'string' && typeof i?.b === 'string' && i.a.length <= 5000 && i.b.length <= 5000 ? null : 'Hai chuỗi dài tối đa 5.000 ký tự.', initial: i => ({ grid: Array.from({ length: i.a.length + 1 }, () => Array(i.b.length + 1).fill('·')), rowLabels: ['∅', ...i.a], columnLabels: ['∅', ...i.b] }), simulate: editDistance,
};
