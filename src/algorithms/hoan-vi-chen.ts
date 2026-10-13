import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, tokens, need } from './_shared';
import source from '../../webcode/hoan-vi-chen.cpp?raw';

function* insertions({ items }: { items: number[] }): Generator<SimulationEvent> {
  const emit = emitter(source);
  let LG: number[][] = [[items[0]]];
  const fmt = (p: number[]) => p.join(' ');
  const state: VisualState = { values: [...LG[0]], secondary: [fmt(LG[0])], secondaryLabel: 'LG hiện tại' };
  yield emit('update', `LG = {(${fmt(LG[0])})}.`, state, 1, 'LG = { { a[0] } };', 0, false);
  let step = 0;
  for (let i = 1; i < items.length; i++) {
    const P: number[][] = [];
    for (const x of LG) {
      state.active = []; state.marked = [];
      state.variables = { buoc: step, xet: fmt(x) };
      yield emit('check', `Xét hoán vị con (${fmt(x)}), chèn ${items[i]}.`, state, 2, 'for (auto cur : LG)', 0, true);
      for (let k = 0; k <= x.length; k++) {
        const y = [...x.slice(0, k), items[i], ...x.slice(k)];
        P.push(y);
        step++;
        state.values = [...y]; state.active = [k];
        state.secondary = P.map(fmt);
        state.variables = { buoc: step, chen: items[i], viTri: k };
        yield emit('accept', `Chèn ${items[i]} vào vị trí ${k} của (${fmt(x)}).`, state, 2, 'y.insert(y.begin() + k, a[i]);', 0, false);
      }
    }
    LG = P;
    state.values = [...LG[LG.length - 1]]; state.active = [];
    state.secondary = LG.map(fmt);
    state.variables = { buoc: step, doDai: i + 1 };
    yield emit('update', `LG có ${LG.length} hoán vị độ dài ${i + 1}.`, state, 3, 'LG = P;', 0, false);
  }
  const outputs: string[] = [];
  for (const perm of LG) {
    state.values = [...perm]; state.active = [];
    state.variables = { buoc: step };
    outputs.push(fmt(perm));
    state.outputs = [fmt(perm)];
    yield emit('output', `In hoán vị: ${fmt(perm)}.`, state, 4, 'cout << perm[i];', 0, false);
  }
  state.active = [];
  state.result = `Đã liệt kê ${outputs.length} hoán vị.`;
  yield emit('complete', state.result, state, 4, 'cout << perm[i];', 0, false);
}

export const hoanViChen: Algorithm = {
  id: 'hoan-vi-chen', title: 'Hoán vị chèn', category: 'Sinh', tags: ['Sinh lặp', 'Chèn dần'], complexity: 'O(n·n!)',
  description: 'Liệt kê hoán vị bằng cách chèn bottom-up',
  goal: 'Chèn từng phần tử vào mọi vị trí của từng hoán vị con; LG phình dần tới đủ n!.',
  inputFormat: 'Dãy 1..9 số nguyên phân biệt, cách nhau bởi khoảng trắng.',
  note: 'Cách 2 bottom-up (đối chiếu Cách 1 quay lui ở Sinh hoán vị): không đệ quy, dãy dài dần từ 1 lên n. Ô sáng là vị trí vừa chèn.',
  source,
  pseudocode: [
    'LG = {(a0)} ban đầu',
    'Với mỗi x trong LG, chèn a[i] vào mọi vị trí',
    'LG = P sau mỗi vòng',
    'In mọi hoán vị trong LG',
  ],
  presets: [
    preset('a = (4, 3, 1, 2)', { items: [4, 3, 1, 2] }, 'Dãy dài dần · 24 hoán vị'),
    preset('Ba số', { items: [3, 1, 2] }, '6 hoán vị'),
    preset('Một số', { items: [7] }, 'Một hoán vị duy nhất'),
  ],
  example: `4 3 1 2`,
  kind: 'array',
  validate: i => Array.isArray(i?.items) && i.items.length >= 1 && i.items.length <= 9 && i.items.every((x: any) => Number.isInteger(x)) && new Set((i.items as number[]).map(String)).size === i.items.length ? null : 'Cần 1..9 số nguyên phân biệt.',
  initial: i => ({ values: [(i.items as number[])[0]], secondary: [(i.items as number[])[0]].map(String), secondaryLabel: 'LG hiện tại' }),
  simulate: insertions,
  parseInput: raw => {
    const t = tokens(raw);
    need(t.length >= 1 && t.length <= 9, 'Cần 1..9 số nguyên.');
    const items = t.map(Number);
    need(items.every(Number.isInteger), 'Chỉ chứa số nguyên.');
    need(new Set(items.map(String)).size === items.length, 'Các số phải phân biệt.');
    return { items };
  },
  randomInput: () => { const n = ri(2, 4); const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5); return pool.slice(0, n).join(' '); },
} as Algorithm;
