import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, pick, randomDigits, randomLetters, randomWeights, tokens, lines, need } from './_shared';
import source from '../../webcode/tro-choi-ghep-chu.cpp?raw';

function* wordSearch(input: { word: string; grid: string[] }): Generator<SimulationEvent> {
  const emit = emitter(source), grid = input.grid.map(row => row.split(''));
  const used = grid.map(row => row.map(() => false)), path: number[] = [];
  const state: VisualState = { grid, path, marked: [] };
  function* go(r: number, c: number, k: number): Generator<SimulationEvent, boolean> {
    state.variables = { tu: input.word, viTri: k, dong: r, cot: c };
    state.active = r >= 0 && r < grid.length && c >= 0 && c < grid[0].length ? [r * grid[0].length + c] : [];
    if (k === input.word.length) { yield emit('accept', 'Đã khớp toàn bộ từ.', state, 1, 'if (viTri == tu.length())', k); return true; }
    yield emit('check', `Kiểm tra ô (${r}, ${c}) cho ký tự ${input.word[k]}.`, state, 2, 'if (dong < 0', k);
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length || used[r][c] || grid[r][c] !== input.word[k]) {
      yield emit('reject', 'Ô ngoài bảng, đã dùng hoặc sai ký tự.', state, 2, 'return false;', k); return false;
    }
    used[r][c] = true; path.push(r * grid[0].length + c); state.marked = [...path];
    yield emit('accept', `Chọn ký tự ${grid[r][c]}.`, state, 3, 'daDung[dong][cot] = true;', k);
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if ((dr || dc) && (yield* go(r + dr, c + dc, k + 1))) return true;
    used[r][c] = false; path.pop(); state.marked = [...path]; state.active = [r * grid[0].length + c];
    state.variables = { tu: input.word, viTri: k, dong: r, cot: c };
    yield emit('undo', 'Bỏ đánh dấu ô, thử đường khác.', state, 5, 'daDung[dong][cot] = false;', k); return false;
  }
  let found = false;
  for (let r = 0; r < grid.length && !found; r++) for (let c = 0; c < grid[0].length && !found; c++) found = yield* go(r, c, 0);
  state.result = found ? 'true' : 'false'; state.outputs = [state.result];
  yield emit('output', found ? 'Tìm thấy từ.' : 'Không tìm thấy từ.', state, 6, 'if (timThay)');
  yield emit('complete', `Kết quả: ${state.result}.`, state, 6, 'if (timThay)');
}

export const troChoiGhepChu: Algorithm = {
  id: 'tro-choi-ghep-chu', title: 'Trò chơi ghép chữ', category: 'Quay lui', tags: ['Lưới', 'Tám hướng'], complexity: 'O(R·C·8^L)', description: 'Tìm từ trên lưới chữ cái', goal: 'Đường đi không được sử dụng một ô hai lần.', inputFormat: 'Từ và bảng chữ nhật.', source, pseudocode: ['Nếu viTri == độ dài từ: trả về true', 'Loại ô ngoài bảng, đã dùng hoặc sai ký tự', 'daDung[dong][cot] = true', 'Thử đệ quy tám ô lân cận', 'Nếu thất bại: bỏ đánh dấu ô', 'Thử từng ô đầu; in true hoặc false'], presets: [preset('Tìm CAT', { word: 'CAT', grid: ['CAT', 'XXX', 'XXX'] }, 'Bảng 3×3 · CAT'), preset('Không có đường đi', { word: 'DOG', grid: ['CAT', 'AAA', 'TTT'] }, 'Bảng 3×3 · DOG')], example: `CAT
CAT
XXX
XXX`, kind: 'grid', validate: i => typeof i?.word === 'string' && i.word.length > 0 && Array.isArray(i.grid) && i.grid.length > 0 && typeof i.grid[0] === 'string' && i.grid[0].length > 0 && i.grid.every((r: any) => typeof r === 'string' && r.length === i.grid[0].length) ? null : 'Từ và bảng chữ nhật không được rỗng.', initial: i => ({ grid: i.grid.map((r: string) => r.split('')), path: [] }), simulate: wordSearch,
  parseInput: raw => { const tkns = tokens(raw); need(tkns.length >= 2, 'Cần từ và lưới.'); const word = tkns[0]; const grid = tokens(raw).slice(1).filter(r => r !== '.'); need(grid.length > 0, 'Lưới không được rỗng.'); return { word, grid }; },
  randomInput: () => { const word = randomLetters(ri(2, 4), 'CATDOGRA'); const g = Array.from({length: 3}, () => randomLetters(3, 'CATDOGX')); g[0] = word[0] + g[0].slice(1); if (word.length >= 2) g[1] = g[1][0] + word[1] + g[1].slice(2); if (word.length >= 3) g[2] = word[2] + g[2].slice(1); return word + '\n' + g.join('\n'); },
};
