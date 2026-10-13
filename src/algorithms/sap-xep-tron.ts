import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, tokens, need } from './_shared';
import source from '../../webcode2/merge_sort.cpp?raw';

function* mergeSort({ values: input }: { values: number[] }): Generator<SimulationEvent> {
  const emit = emitter(source), a = [...input];
  const state: VisualState = {
    values: [...a], labels: a.map((_, i) => String(i)),
    variables: { n: a.length },
  };
  const outputs: string[] = [];
  function* go(left: number, right: number, depth: number): Generator<SimulationEvent> {
    state.variables = { left, right, doSau: depth }; state.active = [];
    if (left >= right) {
      yield emit('check', `Đoạn [${left}] chỉ một phần tử, dừng.`, state, 1, 'if (left < right)', depth, true);
      return;
    }
    const mid = Math.floor((left + right) / 2);
    state.variables = { left, mid, right, doSau: depth };
    state.active = []; state.marked = [];
    yield emit('check', `Chia [${left}, ${right}] tại mid = ${mid}. Đệ quy nửa phải trước.`, state, 1, 'if (left < right)', depth, true);
    // Đúng mã giả đề thi: nửa PHẢI trước rồi mới nửa trái.
    yield* go(mid + 1, right, depth + 1);
    yield* go(left, mid, depth + 1);
    const before = a.slice(left, right + 1);
    state.active = Array.from({ length: right - left + 1 }, (_, k) => left + k);
    state.marked = [];
    state.variables = { left, mid, right, doSau: depth };
    yield emit('check', `Trộn [${left}..${mid}] và [${mid + 1}..${right}].`, state, 4, 'tron(left, mid, right);', depth, true);
    // Trộn ổn định y hệt C++: <= lấy từ nửa trái trước.
    const tmp: number[] = [];
    let i = left, j = mid + 1;
    while (i <= mid && j <= right) {
      if (a[i] <= a[j]) { tmp.push(a[i]); state.marked = [i]; i++; }
      else { tmp.push(a[j]); state.marked = [j]; j++; }
      state.active = [left + tmp.length - 1];
      state.variables = { left, mid, right, doSau: depth, dat: tmp[tmp.length - 1] };
      yield emit('update', `Đặt a[${left + tmp.length - 1}] = ${tmp[tmp.length - 1]}.`, state, 4, 'a[k] = tam[k - left];', depth, false);
    }
    while (i <= mid) {
      tmp.push(a[i]); state.marked = [i]; i++;
      state.active = [left + tmp.length - 1];
      state.variables = { left, mid, right, doSau: depth, dat: tmp[tmp.length - 1] };
      yield emit('update', `Chép nốt a[${left + tmp.length - 1}] = ${tmp[tmp.length - 1]}.`, state, 4, 'a[k] = tam[k - left];', depth, false);
    }
    while (j <= right) {
      tmp.push(a[j]); state.marked = [j]; j++;
      state.active = [left + tmp.length - 1];
      state.variables = { left, mid, right, doSau: depth, dat: tmp[tmp.length - 1] };
      yield emit('update', `Chép nốt a[${left + tmp.length - 1}] = ${tmp[tmp.length - 1]}.`, state, 4, 'a[k] = tam[k - left];', depth, false);
    }
    for (let k = left; k <= right; k++) a[k] = tmp[k - left];
    state.values = [...a];
    state.active = Array.from({ length: right - left + 1 }, (_, k) => left + k);
    state.marked = [];
    const changed = before.some((v, k) => v !== tmp[k]);
    if (changed) {
      outputs.push(a.join(' '));
      state.outputs = [a.join(' ')];
      state.variables = { left, mid, right, doSau: depth };
      yield emit('output', `Merge làm đổi dãy: ${a.join(' ')}.`, state, 4, 'tron(left, mid, right);', depth, false);
    } else {
      yield emit('reject', `Merge [${left}, ${right}] không làm đổi dãy, không ghi.`, state, 4, 'tron(left, mid, right);', depth, false);
    }
  }
  yield* go(0, a.length - 1, 0);
  state.active = []; state.marked = [];
  state.variables = { n: a.length, doSau: 0 };
  state.result = outputs.length ? `Ghi ${outputs.length} cấu hình đổi, dãy cuối: ${a.join(' ')}.` : 'Mọi lần Merge đều không đổi dãy.';
  state.outputs = [...outputs];
  yield emit('complete', state.result, state, 5, 'sapXep(0, n - 1);', 0, false);
}

export const sapXepTron: Algorithm = {
  id: 'sap-xep-tron', title: 'Sắp xếp trộn', category: 'Chia để trị', tags: ['Merge Sort', 'Đệ quy'], complexity: 'O(n·log n)',
  description: 'Sắp xếp tăng dần bằng Merge Sort top-down',
  goal: 'Chia đôi tới từng phần tử rồi trộn hai nửa đã sắp xếp; chỉ ghi cấu hình đổi.',
  inputFormat: 'Dãy số nguyên (có hoặc không có số đầu là n), tối đa 500 phần tử.',
  note: 'Giữ đúng mã giả đề thi: đệ quy nửa PHẢI trước rồi mới nửa trái, mid lấy nguyên, trộn ổn định (<= lấy trái trước). Chỉ lần Merge làm đổi dãy mới thành output.',
  source,
  pseudocode: [
    'Nếu left < right: mid = (left + right) / 2',
    'Đệ quy nửa phải trước (cẩn thận!)',
    'Đệ quy nửa trái',
    'Trộn hai nửa, ghi cấu hình nếu đổi',
    'Kết thúc sắp xếp',
  ],
  presets: [
    preset('Đề thi 8 số', { values: [8, 3, 4, 5, 9, 1, 12, 7] }, '6 cấu hình đổi · 3 đầu đúng Bảng 2'),
    preset('Đã sắp xếp', { values: [1, 2, 3, 4] }, 'Không có cấu hình đổi'),
    preset('Ba số', { values: [3, 1, 2] }, '2 cấu hình đổi'),
  ],
  example: `8\n8 3 4 5 9 1 12 7`,
  kind: 'array',
  validate: i => Array.isArray(i?.values) && i.values.length >= 1 && i.values.length <= 500 && i.values.every((x: any) => Number.isSafeInteger(x) && Math.abs(x) <= 1e9) ? null : 'Cần dãy 1..500 số nguyên.',
  initial: i => ({ values: [...i.values], labels: (i.values as number[]).map((_, k) => String(k)) }),
  simulate: mergeSort,
  parseInput: raw => {
    const t = tokens(raw).map(Number);
    need(t.length >= 1 && t.every(Number.isInteger), 'Cần dãy số nguyên.');
    if (t.length >= 2 && t[0] === t.length - 1) return { values: t.slice(1) };
    return { values: t };
  },
  randomInput: () => { const n = ri(4, 8); return Array.from({ length: n }, () => ri(0, 20)).join(' '); },
} as Algorithm;
