import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, sequenceValidation } from './_shared';
import source from '../../webcode2/daicontangdainhat2.cpp?raw';

type Sequence = { values: number[] };

function* tailsLIS({ values }: Sequence): Generator<SimulationEvent> {
  const emit = emitter(source), tails: number[] = [], last: number[] = [], previous = Array(values.length).fill(-1);
  const state: VisualState = { values, secondary: tails, secondaryLabel: 'giaTriCuoi: đuôi nhỏ nhất mỗi độ dài' };
  for (let i = 0; i < values.length; i++) {
    let left = 0, right = tails.length - 1, pred = -1; state.active = [i];
    while (left <= right) {
      const mid = Math.floor((left + right) / 2); state.variables = { i: i + 1, trai: left + 1, phai: right + 1, giua: mid + 1, duoi: tails[mid] };
      yield emit('check', `${tails[mid]} < ${values[i]}?`, state, 1, 'if (giaTriCuoi[giua] < daySo[i])');
      if (tails[mid] < values[i]) { pred = mid; left = mid + 1; } else right = mid - 1;
    }
    previous[i] = pred < 0 ? -1 : last[pred]; const pos = pred + 1;
    if (pos === tails.length || values[i] < tails[pos]) { tails[pos] = values[i]; last[pos] = i; }
    state.variables = { i: i + 1, viTri: pos + 1, phanTuTruoc: previous[i] + 1, doDai: tails.length };
    yield emit('update', `Đuôi độ dài ${pos + 1}: ${tails[pos]}; cha của phần tử ${i + 1}: ${previous[i] + 1}.`, state, 2, 'if (viTri == doDaiLonNhat)');
  }
  const chain: number[] = [];
  for (let x = last[tails.length - 1] ?? -1; x >= 0; x = previous[x]) {
    chain.unshift(x); state.path = [...chain]; state.marked = [...chain]; state.active = [x];
    yield emit('accept', `Truy vết phần tử ${x + 1}: ${values[x]}.`, state, 3, 'chiSoHienTai = phanTuTruoc[chiSoHienTai];');
  }
  state.result = `${tails.length}\n${chain.map(i => values[i]).join(' ')}`; state.outputs = [state.result];
  yield emit('output', `LIS dài ${tails.length}: ${chain.map(i => values[i]).join(' ')}.`, state, 4, 'cout << doDaiLonNhat');
  yield emit('complete', `Đã dựng dãy con tăng dài nhất.`, state, 4, 'cout << doDaiLonNhat');
}

export const daicontangdainhat2: Algorithm = {
  id: 'daicontangdainhat2', title: 'LIS và truy vết', category: 'Cấu trúc dữ liệu', tags: ['Tails', 'Liên kết trước'], complexity: 'O(n·log n)', description: 'Dựng lại dãy con tăng dài nhất', goal: 'Giữ đuôi nhỏ nhất mỗi độ dài và liên kết tới phần tử trước.', inputFormat: 'Dãy số nguyên.', source, pseudocode: ['Tìm đuôi cuối < daySo[i] bằng nhị phân', 'Lưu phần tử trước; nối dài hoặc thay đuôi nhỏ hơn', 'Đi ngược phanTuTruoc từ đuôi LIS', 'In độ dài và dãy theo thứ tự ban đầu'], presets: [preset('Dãy hỗn hợp', { values: [3, 1, 2, 5, 4, 6] }, 'Truy vết 1 → 2 → 4 → 6'), preset('Giá trị trùng', { values: [2, 2, 2] }, 'Giữ đuôi đầu tiên theo mã C++'), preset('Dãy rỗng', { values: [] }, 'Độ dài 0')], kind: 'array', validate: sequenceValidation, initial: i => ({ values: i.values, secondary: [], secondaryLabel: 'giaTriCuoi' }), simulate: tailsLIS,
};
