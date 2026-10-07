import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, pick, randomDigits, randomLetters, randomWeights, tokens, need } from './_shared';
import source from '../../webcode/tach-chuoi-con-doi-xung.cpp?raw';

function* palindromes({ s }: { s: string }): Generator<SimulationEvent> {
  const emit = emitter(source), parts: string[] = [];
  const state: VisualState = { values: parts, secondary: s.split(''), secondaryLabel: 'Chuỗi / hai con trỏ' };
  function* go(pos: number): Generator<SimulationEvent> {
    state.variables = { viTri: pos, soDoan: parts.length };
    if (pos === s.length) { state.outputs = [parts.join(' ')]; yield emit('output', `Xuất phân hoạch: ${parts.join(' ')}.`, state, 1, 'inPhanHoach();', parts.length); return; }
    for (let end = pos; end < s.length; end++) {
      let valid = true;
      for (let l = pos, r = end; l < r; l++, r--) {
        state.variables = { viTri: pos, ketThuc: end, l, r };
        yield emit('check', `So sánh s[${l}] = ${s[l]} với s[${r}] = ${s[r]}.`, state, 2, 'if (s[l] != s[r])', parts.length);
        if (s[l] !== s[r]) { valid = false; break; }
      }
      if (!valid) { yield emit('reject', `${s.slice(pos, end + 1)} không đối xứng.`, state, 2, 'if (s[l] != s[r])', parts.length); continue; }
      const piece = s.slice(pos, end + 1); parts.push(piece); state.active = [parts.length - 1];
      yield emit('accept', `Chọn đoạn ${piece}.`, state, 3, 'soDoan++;', parts.length);
      yield* go(end + 1); parts.pop(); state.active = [];
      state.variables = { viTri: pos, soDoan: parts.length };
      yield emit('undo', `Bỏ đoạn ${piece}.`, state, 5, 'soDoan--;', parts.length);
    }
  }
  yield* go(0); state.result = 'Đã liệt kê mọi phân hoạch đối xứng.'; yield emit('complete', state.result, state, 6, 'quayLui(0);');
}

export const tachChuoiConDoiXung: Algorithm = {
  id: 'tach-chuoi-con-doi-xung', title: 'Tách chuỗi đối xứng', category: 'Quay lui', tags: ['Chuỗi', 'Hai con trỏ'], complexity: 'O(n·2^n)', description: 'Phân hoạch thành các đoạn palindrome', goal: 'Mỗi đoạn đọc từ trái hoặc từ phải đều giống nhau.', inputFormat: 'Chuỗi cần phân hoạch.', note: 'Chuỗi rỗng là mở rộng của mô phỏng; cin trong C++ không đọc được chuỗi rỗng.', source, pseudocode: ['Nếu đến cuối chuỗi: in phân hoạch', 'Thử điểm kết thúc; so sánh s[l] và s[r]', 'Chọn đoạn đối xứng; tăng soDoan', 'quayLui(ketThuc + 1)', 'Giảm soDoan để thử đoạn khác', 'Kết thúc duyệt'], presets: [preset('aab', { s: 'aab' }, 'Hai phân hoạch'), preset('abba', { s: 'abba' }, 'Có đoạn đối xứng dài'), preset('Chuỗi rỗng', { s: '' }, 'Một phân hoạch rỗng')], example: `aab`, kind: 'string', validate: i => typeof i?.s === 'string' && i.s.length <= 104 ? null : 'Chuỗi dài tối đa 104 ký tự.', initial: i => ({ values: [], secondary: i.s.split(''), secondaryLabel: 'Chuỗi ban đầu' }), simulate: palindromes,
  parseInput: raw => { const t = tokens(raw); need(t.length === 1, 'Cần đúng một chuỗi chữ.'); return { s: t[0] }; },
  randomInput: () => randomLetters(ri(1, 8), 'aabb'),
};
