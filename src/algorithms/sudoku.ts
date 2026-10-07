import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset } from './_shared';
import source from '../../webcode/sudoku.cpp?raw';

function* sudokuSim({ grid: input }: { grid: string[][] }): Generator<SimulationEvent> {
  const emit = emitter(source), grid = input.map(row => [...row]);
  const state: VisualState = { grid, marked: [], active: [] };
  function* go(depth: number): Generator<SimulationEvent, boolean> {
    let r = -1, c = -1;
    outer: for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) if (grid[i][j] === 'X') { r = i; c = j; break outer; }
    if (r < 0) return true;
    for (let x = 1; x <= 9; x++) {
      state.active = [r * 9 + c]; state.variables = { dong: r, cot: c, so: x }; state.marked = [];
      for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) if ((i === r || j === c || (Math.floor(i / 3) === Math.floor(r / 3) && Math.floor(j / 3) === Math.floor(c / 3))) && grid[i][j] === String(x)) state.marked.push(i * 9 + j);
      yield emit('check', `Thử số ${x} tại ô (${r}, ${c}).`, state, 2, 'if (coTheDien(dong, cot, so))', depth);
      if (state.marked.length) { yield emit('reject', `Số ${x} trùng hàng, cột hoặc vùng 3×3.`, state, 2, 'if (sudoku[dong][i] == so)', depth); continue; }
      grid[r][c] = String(x); yield emit('accept', `Đặt ${x} vào ô đang xét.`, state, 3, 'sudoku[dong][cot] = so;', depth);
      if (yield* go(depth + 1)) return true;
      grid[r][c] = 'X'; state.active = [r * 9 + c]; state.marked = [];
      state.variables = { dong: r, cot: c, so: x };
      yield emit('undo', 'Nhánh thất bại, xóa ô vừa điền.', state, 5, "sudoku[dong][cot] = 'X';", depth);
    }
    return false;
  }
  const solved = yield* go(0); state.marked = []; state.active = [];
  state.result = solved ? 'Sudoku đã được giải.' : 'Sudoku không có nghiệm.';
  state.outputs = [grid.map(row => row.join(' ')).join('\n')];
  yield emit('output', state.result, state, 6, 'cout << sudoku[i][j]'); yield emit('complete', state.result, state, 6, 'quayLui();');
}

const solvedBoard = Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => String((r * 3 + Math.floor(r / 3) + c) % 9 + 1)));
function validateSudoku(input: any): string | null {
  if (!Array.isArray(input?.grid) || input.grid.length !== 9 || !input.grid.every((row: any) => Array.isArray(row) && row.length === 9 && row.every((x: any) => typeof x === 'string' && /^[1-9X]$/.test(x)))) return 'Bảng phải có 9×9 ô, ô trống dùng X.';
  const grid = input.grid as string[][];
  const unique = (cells: string[]) => { const given = cells.filter(x => x !== 'X'); return new Set(given).size === given.length; };
  for (let i = 0; i < 9; i++) {
    if (!unique(grid[i]) || !unique(grid.map(row => row[i]))) return 'Các số cho sẵn trùng hàng hoặc cột.';
    const br = Math.floor(i / 3) * 3, bc = i % 3 * 3;
    if (!unique(grid.slice(br, br + 3).flatMap(row => row.slice(bc, bc + 3)))) return 'Các số cho sẵn trùng vùng 3×3.';
  }
  return null;
}

export const sudoku: Algorithm = {
  id: 'sudoku', title: 'Sudoku', category: 'Quay lui', tags: ['Ràng buộc', 'Lưới 9×9'], complexity: 'O(9^E)', description: 'Giải Sudoku bằng quay lui', goal: 'Thử số tại ô trống đầu tiên, hoàn tác khi không thể đi tiếp.', inputFormat: 'Bảng 9×9; X là ô trống.', note: 'Mô phỏng kiểm tra số cho sẵn và báo vô nghiệm. C++ chỉ in bảng sau khi gọi quayLui.', source, pseudocode: ['Tìm ô X đầu tiên; hết ô thì thành công', 'Thử 1..9; kiểm tra hàng, cột và vùng', 'Điền số vào sudoku[dong][cot]', 'quayLui(); nếu thành công thì trả về', 'Xóa ô nếu nhánh thất bại', 'In bảng và trạng thái kết thúc'], presets: [preset('Bảng có quay lui', { grid: ['53XX7XXXX', '6XX195XXX', 'X98XXXX6X', '8XXX6XXX3', '4XX8X3XX1', '7XXX2XXX6', 'X6XXXX28X', 'XXX419XX5', 'XXXX8XX79'].map(row => row.split('')) }, '51 ô trống'), preset('Đã giải', { grid: solvedBoard }, 'Bảng hợp lệ · Không còn ô trống'), preset('Không có nghiệm', { grid: ['X12345678', '9XXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX', 'XXXXXXXXX'].map(row => row.split('')) }, 'Ô đầu tiên không có số hợp lệ')], kind: 'grid', validate: validateSudoku, initial: i => ({ grid: structuredClone(i.grid) }), simulate: sudokuSim,
};
