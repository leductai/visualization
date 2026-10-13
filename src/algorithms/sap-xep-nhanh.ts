import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, tokens, need } from './_shared';
import source from '../../webcode2/quick_sort.cpp?raw';

function* quickSort({ values: input }: { values: number[] }): Generator<SimulationEvent> {
  const emit = emitter(source), a = [...input];
  const state: VisualState = {
    values: [...a], labels: a.map((_, i) => String(i)),
    variables: { n: a.length },
  };
  const outputs: string[] = [];
  let lastOutput = input.join(' ');
  function* go(left: number, right: number, depth: number): Generator<SimulationEvent> {
    state.variables = { left, right, doSau: depth }; state.active = []; state.marked = [];
    if (left >= right) return;
    const pivot = a[right];
    state.variables = { left, right, chot: pivot, doSau: depth };
    state.active = [right];
    yield emit('check', `Phân đoạn [${left}, ${right}], chốt = ${pivot}.`, state, 1, 'int chot = a[right];', depth, true);
    let i = left - 1;
    for (let j = left; j < right; j++) {
      state.active = [j]; state.marked = [right];
      state.variables = { left, right, chot: pivot, i, j, doSau: depth };
      yield emit('check', `So a[${j}] = ${a[j]} với chốt ${pivot}.`, state, 2, 'if (a[j] <= chot)', depth, true);
      if (a[j] <= pivot) {
        i++;
        if (a[i] !== a[j]) {
          [a[i], a[j]] = [a[j], a[i]];
          state.values = [...a];
          state.active = [i]; state.marked = [j];
          state.variables = { left, right, chot: pivot, i, j, doSau: depth };
          yield emit('update', `Đổi a[${i}] ↔ a[${j}].`, state, 3, 'swap(a[i], a[j]);', depth, false);
        }
      }
    }
    if (a[i + 1] !== a[right]) {
      [a[i + 1], a[right]] = [a[right], a[i + 1]];
      state.values = [...a];
    }
    const at = i + 1;
    state.active = [at]; state.marked = [];
    state.variables = { left, right, chot: pivot, chotViTri: at, doSau: depth };
    if (a.join(' ') !== lastOutput) {
      lastOutput = a.join(' ');
      outputs.push(lastOutput);
      state.outputs = [lastOutput];
      yield emit('output', `Chốt ${pivot} đứng ở ${at}: ${lastOutput}.`, state, 4, 'swap(a[i + 1], a[right]);', depth, false);
    } else {
      yield emit('reject', `Phân đoạn [${left}, ${right}] không đổi thứ tự, không ghi.`, state, 4, 'swap(a[i + 1], a[right]);', depth, false);
    }
    yield* go(left, at - 1, depth + 1);
    yield* go(at + 1, right, depth + 1);
  }
  yield* go(0, a.length - 1, 0);
  state.active = []; state.marked = [];
  state.variables = { n: a.length, doSau: 0 };
  state.result = outputs.length ? `Ghi ${outputs.length} cấu hình đổi, dãy cuối: ${a.join(' ')}.` : 'Mọi lần phân đoạn đều không đổi thứ tự.';
  state.outputs = [...outputs];
  yield emit('complete', state.result, state, 5, 'sapXepNhanh(0, n - 1);', 0, false);
}

export const sapXepNhanh: Algorithm = {
  id: 'sap-xep-nhanh', title: 'Sắp xếp nhanh', category: 'Chia để trị', tags: ['Quick Sort', 'Chốt'], complexity: 'O(n·log n)',
  description: 'Sắp xếp tăng dần bằng Quick Sort (Lomuto)',
  goal: 'Chốt cuối đoạn, gom số ≤ chốt về đầu, đặt chốt đúng chỗ rồi đệ quy.',
  inputFormat: 'Dãy số nguyên (có hoặc không có số đầu là n), tối đa 500 phần tử.',
  note: 'Phân đoạn Lomuto với chốt là phần tử cuối; số bằng chốt gom về bên trái. Chỉ lần phân đoạn làm đổi dãy mới thành output.',
  source,
  pseudocode: [
    'Nếu left < right: lấy chốt a[right]',
    'Quét j: số ≤ chốt thì i++ rồi đổi chỗ',
    'Đổi a[i] ↔ a[j]',
    'Đặt chốt vào vị trí đúng, đệ quy hai bên',
    'Kết thúc sắp xếp',
  ],
  presets: [
    preset('Đề mẫu 8 số', { values: [8, 3, 4, 5, 9, 1, 12, 7] }, '5 lần chốt đổi'),
    preset('Đã sắp xếp', { values: [1, 2, 3, 4] }, 'Không có cấu hình đổi'),
    preset('Ba số', { values: [3, 1, 2] }, '1 lần chốt đổi'),
  ],
  example: `8\n8 3 4 5 9 1 12 7`,
  kind: 'array',
  validate: i => Array.isArray(i?.values) && i.values.length >= 1 && i.values.length <= 500 && i.values.every((x: any) => Number.isSafeInteger(x) && Math.abs(x) <= 1e9) ? null : 'Cần dãy 1..500 số nguyên.',
  initial: i => ({ values: [...i.values], labels: (i.values as number[]).map((_, k) => String(k)) }),
  simulate: quickSort,
  parseInput: raw => {
    const t = tokens(raw).map(Number);
    need(t.length >= 1 && t.every(Number.isInteger), 'Cần dãy số nguyên.');
    if (t.length >= 2 && t[0] === t.length - 1) return { values: t.slice(1) };
    return { values: t };
  },
  randomInput: () => { const n = ri(4, 8); return Array.from({ length: n }, () => ri(0, 20)).join(' '); },
} as Algorithm;
