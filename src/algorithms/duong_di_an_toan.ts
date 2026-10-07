import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset } from './_shared';
import source from '../../webcode2/duong_di_an_toan.cpp?raw';

function* gridPaths({ grid }: { grid: string[] }): Generator<SimulationEvent> {
  const emit = emitter(source), n = grid.length, dp = Array.from({ length: n }, () => Array(n).fill(0));
  const state: VisualState = { grid: dp.map((row, r) => row.map((value, c) => grid[r][c] === '*' ? '*' : value)), variables: { mod: 1000000007 } };
  dp[0][0] = grid[0][0] === '.' ? 1 : 0;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    state.active = [r * n + c]; state.marked = [r > 0 ? (r - 1) * n + c : -1, c > 0 ? r * n + c - 1 : -1].filter(i => i >= 0);
    state.variables = { dong: r, cot: c, tren: r ? dp[r - 1][c] : 0, trai: c ? dp[r][c - 1] : 0 };
    if (grid[r][c] === '*') { state.grid![r][c] = '*'; yield emit('reject', `Ô (${r}, ${c}) bị chặn: 0 đường đi.`, state, 2, "if (luoi[i][j] == '*')"); continue; }
    if (r || c) dp[r][c] = ((r ? dp[r - 1][c] : 0) + (c ? dp[r][c - 1] : 0)) % 1000000007;
    state.grid = dp.map((row, i) => row.map((value, j) => grid[i][j] === '*' ? '*' : value));
    yield emit('update', `Số đường tới (${r}, ${c}) = ${dp[r][c]}.`, state, 3, 'soDuongDi[i][j] = (soDuongDi[i][j] + soDuongDi[i-1][j])');
  }
  state.result = String(dp[n - 1][n - 1]); state.outputs = [state.result];
  yield emit('output', `Số đường đi an toàn: ${state.result}.`, state, 4, 'cout << soDuongDi');
  yield emit('complete', `Kết quả: ${state.result}.`, state, 4, 'cout << soDuongDi');
}

export const duongDiAnToan: Algorithm = {
  id: 'duong_di_an_toan', title: 'Đường đi an toàn', category: 'Quy hoạch động', tags: ['Lưới', 'Modulo'], complexity: 'O(n²)', description: 'Đếm đường đi tránh chướng ngại vật', goal: 'Chỉ đi xuống hoặc sang phải; cộng số đường từ trên và trái.', inputFormat: 'Lưới vuông; . là ô trống, * là chướng ngại.', source, pseudocode: ['Ô đầu trống: dp[0][0] = 1', 'Ô *: đặt số đường bằng 0', 'Ô trống: cộng trên và trái, modulo 1e9+7', 'In dp[n−1][n−1]'], presets: [preset('Có chướng ngại', { grid: ['....', '.*..', '...*', '....'] }, 'Lưới 4×4'), preset('Chặn ô đầu', { grid: ['*..', '...', '...'] }, 'Không có đường'), preset('Chặn ô cuối', { grid: ['..', '.*'] }, 'Không có đường')], kind: 'grid', validate: i => Array.isArray(i?.grid) && i.grid.length > 0 && i.grid.length <= 1000 && i.grid.every((row: any) => typeof row === 'string' && row.length === i.grid.length && /^[.*]+$/.test(row)) ? null : 'Cần lưới vuông tối đa 1.000×1.000.', initial: i => ({ grid: i.grid.map((row: string) => [...row].map(x => x === '*' ? '*' : 0)) }), simulate: gridPaths,
};
