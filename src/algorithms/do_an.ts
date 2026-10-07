import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset } from './_shared';
import source from '../../webcode2/do_an.cpp?raw';

type Interval = { start: number; end: number; value: number };

function* intervals({ projects }: { projects: Interval[] }): Generator<SimulationEvent> {
  const emit = emitter(source), sorted = [...projects].sort((a, b) => a.end - b.end), dp = Array(sorted.length).fill(0);
  const state: VisualState = { intervals: sorted, values: dp, secondaryLabel: 'tongTinChi', variables: {} };
  yield emit('update', 'Sắp xếp dự án theo thời điểm kết thúc.', state, 1, 'sort(dsDuAn');
  dp[0] = sorted[0].value; state.active = [0];
  yield emit('update', `tongTinChi[0] = ${dp[0]}.`, state, 2, 'tongTinChi[0] =');
  for (let i = 1; i < sorted.length; i++) {
    let left = 0, right = i - 1, pred = -1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2); state.active = [i]; state.marked = [mid]; state.variables = { i, trai: left, phai: right, giua: mid };
      yield emit('check', `Dự án ${mid + 1} kết thúc ${sorted[mid].end} < ${sorted[i].start}?`, state, 3, 'if (dsDuAn[giua].ketThuc <');
      if (sorted[mid].end < sorted[i].start) { pred = mid; left = mid + 1; } else right = mid - 1;
    }
    const take = sorted[i].value + (pred >= 0 ? dp[pred] : 0); dp[i] = Math.max(take, dp[i - 1]); state.marked = pred >= 0 ? [pred] : [];
    state.variables = { i, truoc: pred, chon: take, bo: dp[i - 1], totNhat: dp[i] };
    yield emit('update', `dp[${i}] = max(${take}, ${dp[i - 1]}) = ${dp[i]}.`, state, 4, 'if (tongTinChi[i-1] >');
  }
  state.result = String(dp.at(-1)); state.outputs = [state.result];
  yield emit('output', `Tổng tín chỉ tối đa: ${state.result}.`, state, 5, 'cout << tongTinChi');
  yield emit('complete', `Kết quả: ${state.result}.`, state, 5, 'cout << tongTinChi');
}

export const doAn: Algorithm = {
  id: 'do_an', title: 'Đồ án', category: 'Quy hoạch động', tags: ['Khoảng có trọng số', 'Tìm kiếm nhị phân'], complexity: 'O(n·log n)', description: 'Chọn các đồ án không giao nhau', goal: 'Dự án trước phải kết thúc trước thời điểm bắt đầu dự án sau.', inputFormat: 'Danh sách {start, end, value}.', note: 'Điều kiện tương thích là end < start. Hai dự án chạm nhau ở cùng thời điểm không được chọn cùng.', source, pseudocode: ['Sắp xếp dự án theo kết thúc', 'Khởi tạo dp[0] bằng tín chỉ dự án đầu', 'Tìm dự án cuối có end < start[i]', 'dp[i] = max(dp[i−1], value[i]+dp[trước])', 'In dp[n−1]'], presets: [preset('Năm dự án', { projects: [{ start: 1, end: 3, value: 5 }, { start: 2, end: 5, value: 6 }, { start: 4, end: 6, value: 5 }, { start: 6, end: 7, value: 4 }, { start: 7, end: 9, value: 8 }] }, 'Chọn dự án 1, 3, 5 · Tổng 18'), preset('Chạm biên', { projects: [{ start: 1, end: 2, value: 5 }, { start: 2, end: 3, value: 7 }] }, 'Kết quả 7, không phải 12')], kind: 'timeline', validate: i => Array.isArray(i?.projects) && i.projects.length > 0 && i.projects.length <= 200000 && i.projects.every((p: any) => Number.isSafeInteger(p?.start) && Number.isSafeInteger(p?.end) && Math.abs(p.start) <= 1e9 && Math.abs(p.end) <= 1e9 && p.start <= p.end && Number.isSafeInteger(p.value) && p.value >= 0 && p.value <= 1e9) ? null : 'Cần các khoảng hợp lệ với giá trị không âm.', initial: i => ({ intervals: i.projects, values: Array(i.projects.length).fill(0) }), simulate: intervals,
};
