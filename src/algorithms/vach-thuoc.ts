import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, tokens, need } from './_shared';
import source from '../../webcode2/vach_thuoc.cpp?raw';

function* vachThuocSim({ L, h }: { L: number; h: number }): Generator<SimulationEvent> {
  const emit = emitter(source);
  const cols = L + 1;
  const grid: (string | number)[][] = Array.from({ length: h }, () => Array(cols).fill(''));
  const state: VisualState = {
    grid,
    rowLabels: Array.from({ length: h }, (_, i) => String(h - i)),
    columnLabels: Array.from({ length: cols }, (_, i) => String(i)),
  };
  function* ve(l: number, r: number, hh: number): Generator<SimulationEvent> {
    state.variables = { l, r, h: hh };
    yield emit('check', `Xét đoạn ${l}..${r} với h=${hh}.`, state, 1, 'if (h <= 0) return;', hh);
    if (hh <= 0) { yield emit('reject', `Dừng vì h=${hh}.`, state, 1, 'if (h <= 0) return;', hh); return; }
    if (r - l <= 1) { yield emit('reject', `Đoạn ${l}..${r} chỉ còn 1 ô.`, state, 2, 'if (r - l <= 1) return;', hh); return; }
    const m = Math.floor((l + r) / 2), row = h - hh;
    state.active = [row * cols + m];
    state.variables = { l, r, m, h: hh };
    grid[row][m] = hh;
    yield emit('accept', `Vạch tại vị trí ${m}, độ cao ${hh}.`, state, 3, 'vach[m] = h;', hh);
    yield emit('update', `Đệ quy đoạn trái ${l}..${m} với h-1.`, state, 4, 've(l, m, h - 1);', hh);
    yield* ve(l, m, hh - 1);
    yield emit('update', `Đệ quy đoạn phải ${m}..${r} với h-1.`, state, 5, 've(m, r, h - 1);', hh);
    yield* ve(m, r, hh - 1);
    state.active = [];
  }
  yield* ve(0, L, h);
  state.result = `Đã vạch xong thước dài ${L} với độ cao đầu ${h}.`;
  state.outputs = [state.result];
  yield emit('complete', state.result, state, 6, 'return 0;');
}

export const vachThuoc: Algorithm = {
  id: 'vach-thuoc', title: 'Vạch thước', category: 'Chia để trị', tags: ['Chia để trị', 'Đệ quy'], complexity: 'O(2^h)', description: 'Vạch chia thước theo chia để trị', goal: 'Mỗi đoạn giữa vạch theo h, rồi chia hai nửa với h−1.', inputFormat: 'Độ dài L và độ cao h.', example: '8 3', kind: 'grid', source, pseudocode: ['Nếu h <= 0 hoặc còn 1 ô: dừng', 'Tìm m giữa đoạn l..r', 'Vạch tại m với chiều cao h', 'Đệ quy đoạn trái với h-1', 'Đệ quy đoạn phải với h-1', 'Kết thúc'],
  presets: [preset('Thước 8, h=3', { L: 8, h: 3 }, '8 ô, cao 3 tầng'), preset('Thước 4, h=2', { L: 4, h: 2 }, '4 ô, cao 2 tầng'), preset('Thước 16, h=4', { L: 16, h: 4 }, '16 ô, cao 4 tầng')],
  validate: i => Number.isInteger(i?.L) && Number.isInteger(i?.h) && i.L >= 2 && i.L <= 64 && i.h >= 1 && i.h <= 8 && Number.isInteger(Math.log2(i.L)) && i.h <= Math.log2(i.L) + 1 ? null : 'Cần L là lũy thừa 2 (2..64), 1 <= h <= log2(L)+1.',
  initial: i => ({ grid: Array.from({ length: i.h }, () => Array(i.L + 1).fill('')), rowLabels: Array.from({ length: i.h }, (_, j) => String(i.h - j)), columnLabels: Array.from({ length: i.L + 1 }, (_, j) => String(j)) }),
  simulate: vachThuocSim,
  parseInput: raw => { const t = tokens(raw); need(t.length === 2, 'Cần hai số L và h.'); return { L: Number(t[0]), h: Number(t[1]) }; },
  randomInput: () => { const h = ri(1, 4); const L = 1 << h; return `${L} ${h}`; },
} as Algorithm;
