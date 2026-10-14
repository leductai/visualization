import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, tokens, need } from './_shared';
import source from '../../webcode2/chon_hoat_dong.cpp?raw';

export interface Activity { start: number; end: number }

function* greedy({ acts }: { acts: Activity[] }): Generator<SimulationEvent> {
  const emit = emitter(source);
  const order = acts.map((_, i) => i).sort((a, b) =>
    acts[a].end !== acts[b].end ? acts[a].end - acts[b].end :
    acts[a].start !== acts[b].start ? acts[a].start - acts[b].start : a - b);
  const sorted = order.map(i => ({ ...acts[i], orig: i }));
  const flags = Array(sorted.length).fill(0);
  const picked: number[] = [];
  const state: VisualState = {
    intervals: sorted.map(a => ({ start: a.start, end: a.end, value: a.end - a.start })),
    values: [...flags], valuesLabel: 'chon',
    variables: { n: acts.length },
  };
  yield emit('update', `Sắp ${acts.length} hoạt động theo giờ kết thúc tăng dần.`, state, 1, 'sort(idx.begin(), idx.end()', 0, false);
  flags[0] = 1; picked.push(0);
  let fLast = sorted[0].end;
  state.values = [...flags]; state.path = [...picked];
  state.active = [0];
  state.variables = { chon: sorted[0].orig + 1, fCuoi: fLast };
  yield emit('accept', `Chọn hoạt động ${sorted[0].orig + 1} đầu tiên (kết thúc sớm nhất).`, state, 3, 'chon.push_back(', 0, false);
  for (let k = 1; k < sorted.length; k++) {
    const a = sorted[k];
    state.active = [k]; state.marked = [picked[picked.length - 1]];
    state.variables = { i: a.orig + 1, batDau: a.start, fCuoi: fLast, truoc: picked[picked.length - 1] };
    yield emit('check', `Hoạt động ${a.orig + 1} [${a.start}, ${a.end}): ${a.start} ≥ ${fLast}?`, state, 2, 'if (s[i] >= fCuoi)', 0, true);
    if (a.start >= fLast) {
      flags[k] = 1; picked.push(k); fLast = a.end;
      state.values = [...flags]; state.path = [...picked];
      state.variables = { i: a.orig + 1, fCuoi: fLast, dem: picked.length };
      yield emit('accept', `Chọn hoạt động ${a.orig + 1} (tương thích).`, state, 3, 'chon.push_back(', 0, false);
    }
  }
  const list = picked.map(k => sorted[k].orig + 1);
  const outputs = [String(picked.length), list.join(' ')];
  state.active = []; state.marked = [];
  state.variables = { dem: picked.length };
  state.outputs = [outputs[0]];
  yield emit('output', `Chọn được ${picked.length} hoạt động.`, state, 4, 'cout << chon.size()', 0, false);
  state.outputs = [outputs[1]];
  yield emit('output', `Danh sách: ${outputs[1]}.`, state, 4, 'cout << chon[k] + 1', 0, false);
  state.result = `Chọn được ${picked.length} hoạt động: ${outputs[1]}.`;
  yield emit('complete', state.result, state, 4, 'return 0;', 0, false);
}

export const chonHoatDong: Algorithm = {
  id: 'chon-hoat-dong', title: 'Chọn hoạt động', category: 'Tối ưu', tags: ['Tham lam', 'Khoảng'], complexity: 'O(n·log n)',
  description: 'Chọn nhiều hoạt động không giao nhau nhất',
  goal: 'Kết thúc sớm trước; chạm biên [s, f) vẫn tương thích.',
  inputFormat: 'Dòng 1: n. Tiếp theo n dòng s f với s < f.',
  note: 'Tham lam tối ưu vì mọi hoạt động giá trị như nhau. Khác bài Đồ án: ở đây tương thích là s ≥ fCuoi (nửa mở), còn Đồ án dùng end < start nghiêm ngặt và có trọng số nên phải QHĐ.',
  source,
  pseudocode: [
    'Sắp xếp theo giờ kết thúc tăng dần',
    'Chọn nếu bắt đầu ≥ kết thúc đã chọn',
    'Thêm vào đáp án, cập nhật fCuoi',
    'In số lượng và danh sách đã chọn',
  ],
  presets: [
    preset('Chạm biên', { acts: [{ start: 1, end: 3 }, { start: 2, end: 4 }, { start: 3, end: 5 }] }, 'Biên chạm vẫn chọn · 2 hoạt động'),
    preset('Kinh điển 11 hoạt động', {
      acts: [
        { start: 1, end: 4 }, { start: 3, end: 5 }, { start: 0, end: 6 }, { start: 5, end: 7 },
        { start: 3, end: 9 }, { start: 5, end: 9 }, { start: 6, end: 10 }, { start: 8, end: 11 },
        { start: 8, end: 12 }, { start: 2, end: 14 }, { start: 12, end: 16 },
      ],
    }, 'Chọn 1, 4, 8, 11 · 4 hoạt động'),
    preset('Một hoạt động', { acts: [{ start: 5, end: 9 }] }, 'Chọn duy nhất'),
  ],
  example: `3\n1 3\n2 4\n3 5`,
  kind: 'timeline',
  validate: i => {
    const acts = i?.acts;
    if (!Array.isArray(acts) || acts.length < 1 || acts.length > 1000) return 'Cần 1..1000 hoạt động.';
    if (!acts.every((a: any) => Number.isSafeInteger(a?.start) && Number.isSafeInteger(a?.end) && Math.abs(a.start) <= 1e9 && Math.abs(a.end) <= 1e9 && a.start < a.end)) return 'Mỗi hoạt động cần s < f trong giới hạn.';
    return null;
  },
  initial: i => {
    const acts = (i.acts as Activity[]).map(a => ({ ...a }));
    acts.sort((a, b) => a.end !== b.end ? a.end - b.end : a.start - b.start);
    return {
      intervals: acts.map(a => ({ start: a.start, end: a.end, value: a.end - a.start })),
      values: Array(acts.length).fill(0), valuesLabel: 'chon',
    };
  },
  simulate: greedy,
  parseInput: raw => {
    const t = tokens(raw).map(Number);
    need(t.length >= 1, 'Cần số hoạt động.');
    const n = t[0];
    need(Number.isInteger(n) && n > 0 && n <= 1000, 'Số hoạt động không hợp lệ.');
    const rest = t.slice(1);
    need(rest.length === n * 2, `Cần ${n} cặp start end.`);
    const acts = Array.from({ length: n }, (_, k) => ({ start: rest[2 * k], end: rest[2 * k + 1] }));
    need(acts.every(a => Number.isSafeInteger(a.start) && Number.isSafeInteger(a.end) && a.start < a.end), 'Mỗi hoạt động cần s < f.');
    return { acts };
  },
  randomInput: () => {
    const n = ri(3, 7);
    const items = Array.from({ length: n }, () => { const s = ri(0, 9); return { start: s, end: ri(s + 1, s + 5) }; });
    return `${n}\n${items.map(a => `${a.start} ${a.end}`).join('\n')}`;
  },
} as Algorithm;
