import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset } from './_shared';
import source from '../../webcode/do-min.cpp?raw';

function* mines({ target }: { target: number[][] }): Generator<SimulationEvent> {
  const emit = emitter(source), n = target.length, m = target[0].length;
  const board = Array.from({ length: n }, () => Array(m).fill(0));
  const state: VisualState = { grid: board, secondary: target.flat(), secondaryLabel: 'Gợi ý a: bốn ô cạnh' };
  let found = false;
  function* derive(row: number): Generator<SimulationEvent, boolean> {
    for (let c = 0; c < m; c++) {
      const v = target[row - 1][c] - (row >= 2 ? board[row - 2][c] : 0) - (c ? board[row - 1][c - 1] : 0) - (c + 1 < m ? board[row - 1][c + 1] : 0);
      state.active = [row * m + c]; state.variables = { dong: row, cot: c, giaTri: v };
      if (v !== 0 && v !== 1) { yield emit('reject', `Giá trị suy ra ${v} không phải 0/1.`, state, 2, 'if (giaTri != 0 && giaTri != 1)'); return false; }
      board[row][c] = v; yield emit('update', `Suy ra b[${row}][${c}] = ${v}.`, state, 2, 'b[dong][cot] = giaTri;');
    }
    return true;
  }
  function* first(c: number): Generator<SimulationEvent> {
    if (c === m) {
      for (let row = 1; row < n; row++) if (!(yield* derive(row))) return;
      for (let j = 0; j < m; j++) {
        const sum = (n >= 2 ? board[n - 2][j] : 0) + (j ? board[n - 1][j - 1] : 0) + (j + 1 < m ? board[n - 1][j + 1] : 0);
        state.active = [(n - 1) * m + j]; state.variables = { cot: j, tong: sum, goiY: target[n - 1][j] };
        yield emit('check', `Kiểm tra gợi ý cuối: ${sum} = ${target[n - 1][j]}?`, state, 3, 'if (tong != a[n - 1][cot])');
        if (sum !== target[n - 1][j]) { yield emit('reject', 'Gợi ý hàng cuối không khớp.', state, 3, 'if (tong != a[n - 1][cot])'); return; }
      }
      found = true; state.outputs = [board.map(row => row.join(' ')).join('\n')];
      yield emit('output', 'Tìm thấy cấu hình mìn đầu tiên.', state, 4, 'inKetQua();'); return;
    }
    for (let value = 0; value <= 1 && !found; value++) {
      board[0][c] = value; state.active = [c]; state.variables = { cot: c, giaTri: value };
      yield emit('accept', `Thử b[0][${c}] = ${value}.`, state, 1, 'b[0][cot] = giaTri;', c);
      yield* first(c + 1);
      state.active = [c]; state.variables = { cot: c, giaTri: value };
      if (!found) yield emit('undo', `Quay lại ô đầu hàng ${c}.`, state, 1, 'thuHangDau(cot + 1);', c);
    }
  }
  yield* first(0); state.result = found ? 'Đã tìm thấy nghiệm.' : 'Không có nghiệm.';
  yield emit('complete', state.result, state, 5, 'thuHangDau(0);');
}

export const doMin: Algorithm = {
  id: 'do-min', title: 'Dò mìn', category: 'Quay lui', tags: ['Nhị phân', 'Suy luận'], complexity: 'O(2^m·n·m)', description: 'Tìm cấu hình mìn từ bảng gợi ý', goal: 'Thử hàng đầu, suy ra các hàng tiếp theo.', inputFormat: 'Bảng chữ nhật; mỗi ô đếm bốn ô cạnh.', note: 'C++ đọc b[-1] khi suy ra hàng 1. Mô phỏng sửa biên thành hàng 0 ảo và giữ nghiệm đầu tiên trước khi C++ thay đổi hàng đầu lúc thoát đệ quy.', source, pseudocode: ['Thử từng ô hàng đầu bằng 0 hoặc 1', 'Suy ra hàng tiếp; loại giá trị ngoài 0/1', 'Kiểm tra gợi ý của hàng cuối', 'In cấu hình đầu tiên thỏa mãn', 'Kết thúc: tìm thấy hoặc vô nghiệm'], presets: [preset('Bảng 3×3', { target: [[1, 1, 1], [1, 2, 1], [1, 1, 1]] }, 'Gợi ý 3×3'), preset('Một hàng', { target: [[0, 0, 0]] }, 'Trường hợp n = 1'), preset('Vô nghiệm', { target: [[4]] }, 'Ô đơn không có lân cận')], kind: 'grid', validate: i => Array.isArray(i?.target) && i.target.length > 0 && i.target.length <= 45 && Array.isArray(i.target[0]) && i.target[0].length > 0 && i.target[0].length <= 45 && i.target.every((row: any) => Array.isArray(row) && row.length === i.target[0].length && row.every((x: any) => Number.isInteger(x) && x >= 0 && x <= 4)) ? null : 'Cần bảng chữ nhật tối đa 45×45, giá trị 0..4.', initial: i => ({ grid: i.target.map((row: number[]) => row.map(() => 0)), secondary: i.target.flat(), secondaryLabel: 'Bảng gợi ý a' }), simulate: mines,
};
