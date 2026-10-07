import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { emitter } from './events';
import { preset, ri, pick, randomDigits, randomLetters, randomWeights, tokens, need } from './_shared';
import source from '../../webcode/dia-chi-ip.cpp?raw';

function* ipAddresses({ s }: { s: string }): Generator<SimulationEvent> {
  const emit = emitter(source), parts: string[] = [];
  const state: VisualState = { values: parts, secondary: s.split(''), secondaryLabel: 'Chuỗi ban đầu' };
  function* go(pos: number, part: number): Generator<SimulationEvent> {
    state.variables = { viTri: pos, soPhan: part };
    if (part === 4) { if (pos === s.length) { state.outputs = [parts.join('.')]; yield emit('output', `Địa chỉ hợp lệ: ${parts.join('.')}.`, state, 1, 'if (viTri == doDai) inDiaChi();', part); } return; }
    const left = s.length - pos, remain = 4 - part;
    yield emit('check', 'Kiểm tra số ký tự và phần còn lại.', state, 2, 'if (soKyTuConLai <', part);
    if (left < remain || left > remain * 3) { yield emit('reject', 'Không đủ hoặc thừa ký tự.', state, 2, 'if (soKyTuConLai <', part); return; }
    for (let len = 1; len <= 3 && pos + len <= s.length; len++) {
      const piece = s.slice(pos, pos + len), value = Number(piece); state.variables = { viTri: pos, soPhan: part, giaTri: value };
      if (len > 1 && s[pos] === '0') { yield emit('reject', `Loại ${piece}: có số 0 đầu.`, state, 3, "if (soKyTu > 1 && s[viTri] == '0')", part); break; }
      if (value > 255) { yield emit('reject', `Loại ${value}: lớn hơn 255.`, state, 3, 'if (giaTri > 255)', part); break; }
      parts[part] = piece; state.active = [part]; yield emit('accept', `Chọn phần ${piece}.`, state, 4, 'phan[soPhan] =', part);
      yield* go(pos + len, part + 1); parts.length = part; state.active = [part];
      state.variables = { viTri: pos, soPhan: part };
      yield emit('undo', 'Trở về để thử cách tách khác.', state, 5, 'quayLui(viTri + soKyTu', part);
    }
  }
  yield* go(0, 0); state.result = 'Kết thúc sinh địa chỉ IP.'; yield emit('complete', state.result, state, 6, 'quayLui(0, 0);');
}

export const diaChiIp: Algorithm = {
  id: 'dia-chi-ip', title: 'Địa chỉ IP', category: 'Quay lui', tags: ['Phân đoạn', 'IPv4'], complexity: 'O(3^4)', description: 'Tách chuỗi số thành địa chỉ IPv4', goal: 'Bốn phần 0..255, không có số 0 đầu phần nhiều chữ số.', inputFormat: 'Chuỗi gồm 1..12 chữ số.', source, pseudocode: ['Nếu đủ 4 phần và hết chuỗi: inDiaChi()', 'Loại nhánh thừa / thiếu ký tự', 'Thử 1..3 ký tự; loại 0 đầu và >255', 'Gán phan[soPhan]', 'quayLui(viTri + soKyTu, soPhan + 1)', 'Kết thúc duyệt'], presets: [preset('25525511135', { s: '25525511135' }, 'Hai địa chỉ hợp lệ'), preset('010010', { s: '010010' }, 'Kiểm tra số 0 đầu'), preset('Không có địa chỉ', { s: '999999999999' }, 'Mọi phần đều >255')], example: `25525511135`, kind: 'string', validate: i => typeof i?.s === 'string' && /^\d{1,12}$/.test(i.s) ? null : 'Cần chuỗi 1..12 chữ số.', initial: i => ({ values: [], secondary: i.s.split(''), secondaryLabel: 'Chuỗi ban đầu' }), simulate: ipAddresses,
  parseInput: raw => { const t = tokens(raw); need(t.length === 1, 'Cần đúng một chuỗi chữ số.'); const s = t[0]; need(/^\d+$/.test(s), 'Chỉ chứa chữ số.'); return { s }; },
  randomInput: () => randomDigits(ri(4, 11), 0, 9),
};
