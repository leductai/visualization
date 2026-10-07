import { describe, expect, it } from 'vitest';
import { algorithms, findAlgorithm } from './registry';
import type { VisualState } from '../engine/types';
import { SimulationRunner } from '../worker/runner';

function run(id: string, input: any) {
  const algorithm = findAlgorithm(id);
  expect(algorithm.validate(input)).toBeNull();
  let state = algorithm.initial(input);
  const outputs: string[] = [];
  for (const event of algorithm.simulate(input)) {
    state = { ...state, ...event.statePatch };
    if (event.action === 'output') outputs.push(...event.statePatch.outputs ?? []);
  }
  return { state, outputs };
}

describe('registry and event contract', () => {
  it('contains all 16 original modules', () => {
    expect(algorithms).toHaveLength(16);
    expect(new Set(algorithms.map(a => a.id)).size).toBe(16);
    for (const a of algorithms) {
      expect(a.source).toContain('int main()'); expect(a.pseudocode.length).toBeGreaterThan(0);
      expect(a.presets.length).toBeGreaterThanOrEqual(2);
    }
  });
  for (const a of algorithms) for (const p of a.presets) {
    if (a.id === 'sinh-hoan-vi' && p.input.n === 8) continue;
    it(`${a.id} / ${p.name}: valid input, immutable events, mapped lines, replay`, () => {
      expect(a.validate(p.input)).toBeNull();
      const originalInput = structuredClone(p.input), iterator = a.simulate(p.input);
      const first = iterator.next(); expect(first.done).toBe(false);
      const saved = structuredClone(first.value);
      let state: VisualState = a.initial(p.input), easyState: VisualState = a.initial(p.input), completed = 0;
      const check = (event: NonNullable<typeof first.value>) => {
        expect(event.line).toBeGreaterThan(0); expect(event.line).toBeLessThanOrEqual(a.pseudocode.length);
        expect(event.cppLine).toBeGreaterThan(0); expect(event.cppLine).toBeLessThanOrEqual(a.source.split('\n').length);
        expect(a.source.split('\n')[event.cppLine - 1].trim().length).toBeGreaterThan(0);
        state = { ...state, ...event.statePatch };
        if (!event.detail) easyState = { ...easyState, ...event.statePatch };
        if (event.action === 'complete') completed++;
      };
      check(first.value!);
      for (const event of iterator) check(event);
      expect(completed).toBe(1); expect(state.result).toBeDefined(); expect(easyState).toEqual(state);
      expect(first.value).toEqual(saved); expect(p.input).toEqual(originalInput);
    }, 15000);
  }
});

describe('backtracking semantics', () => {
  it('restores parent variables as well as cells on undo', () => {
    for (const id of ['sinh-hoan-vi', 'liet-ke-tat-ca-hoan-vi', 'tinh-diem-mon-hoc', 'tro-choi-ghep-chu']) {
      const a = findAlgorithm(id), input = id === 'tro-choi-ghep-chu' ? { word: 'CAT', grid: ['CAX'] } : a.presets[0].input;
      let undo = 0;
      for (const event of a.simulate(input)) if (event.action === 'undo') { expect(event.statePatch.variables?.viTri).toBe(event.depth); undo++; }
      expect(undo).toBeGreaterThan(0);
    }
  });
  it('enumerates permutations in ascending DFS order', () => {
    expect(run('sinh-hoan-vi', { n: 3 }).outputs).toEqual(['1 2 3', '1 3 2', '2 1 3', '2 3 1', '3 1 2', '3 2 1']);
    expect(run('sinh-hoan-vi', { n: 0 }).outputs).toEqual(['']);
  });
  it('uses frequencies in descending order and preserves zero behavior', () => {
    expect(run('liet-ke-tat-ca-hoan-vi', { digits: '112' }).outputs).toEqual(['211', '121', '112']);
    expect(run('liet-ke-tat-ca-hoan-vi', { digits: '909' }).outputs).toEqual([]);
  });
  it('finds diagonal words and never reuses a cell', () => {
    expect(run('tro-choi-ghep-chu', { word: 'CAT', grid: ['CXX', 'XAX', 'XXT'] }).outputs).toEqual(['true']);
    expect(run('tro-choi-ghep-chu', { word: 'ABA', grid: ['AB'] }).outputs).toEqual(['false']);
    expect(findAlgorithm('tro-choi-ghep-chu').validate({ word: 'A', grid: ['', 'A'] })).not.toBeNull();
  });
  it('checks palindromes and enumerates cuts in original order', () => {
    expect(run('tach-chuoi-con-doi-xung', { s: 'aab' }).outputs).toEqual(['a a b', 'aa b']);
    expect(run('tach-chuoi-con-doi-xung', { s: '' }).outputs).toEqual(['']);
  });
  it('rejects leading-zero and oversized IP octets', () => {
    expect(run('dia-chi-ip', { s: '25525511135' }).outputs).toEqual(['255.255.11.135', '255.255.111.35']);
    expect(run('dia-chi-ip', { s: '010010' }).outputs).toEqual(['0.10.0.10', '0.100.1.0']);
    expect(run('dia-chi-ip', { s: '999999999999' }).outputs).toEqual([]);
  });
  it('matches brute-force weighted score rounding', () => {
    const expected: string[] = [];
    for (let a = 1; a <= 40; a++) for (let b = 1; b <= 40; b++) if (50 * a + 50 * b >= 3180 && 50 * a + 50 * b <= 3219) expected.push(`${a / 4} ${b / 4}`);
    expect(run('tinh-diem-mon-hoc', { weights: [50, 50], target: 8 }).outputs).toEqual(expected);
    expect(run('tinh-diem-mon-hoc', { weights: [100], target: 0 }).outputs).toEqual([]);
  });
  it('produces a valid mine grid without accessing the absent top row', () => {
    const input = findAlgorithm('do-min').presets[0].input;
    const { state, outputs } = run('do-min', input); expect(outputs).toHaveLength(1);
    const grid = state.grid as number[][];
    for (let r = 0; r < grid.length; r++) for (let c = 0; c < grid[0].length; c++) {
      const sum = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].reduce((total, [i, j]) => total + (grid[i]?.[j] ?? 0), 0);
      expect(sum).toBe(input.target[r][c]);
    }
    expect(run('do-min', { target: [[0, 0, 0]] }).outputs).toEqual(['0 0 0']);
    expect(run('do-min', { target: [[4]] }).outputs).toEqual([]);
    expect(findAlgorithm('do-min').validate({ target: [[1, 2], [1]] })).not.toBeNull();
  });
  it('solves Sudoku, shows backtracking, reports no solution, validates clues', () => {
    const a = findAlgorithm('sudoku'), events = a.simulate(a.presets[0].input); let undo = false, state: VisualState = {};
    for (const e of events) { undo ||= e.action === 'undo'; state = { ...state, ...e.statePatch }; }
    expect(undo).toBe(true);
    const grid = state.grid as string[][];
    for (let i = 0; i < 9; i++) { expect(new Set(grid[i]).size).toBe(9); expect(new Set(grid.map(row => row[i])).size).toBe(9); }
    expect(run('sudoku', a.presets[2].input).state.result).toContain('không có nghiệm');
    const conflict = structuredClone(a.presets[1].input); conflict.grid[0][0] = conflict.grid[0][1]; expect(a.validate(conflict)).not.toBeNull();
  });
});

describe('DP and data structures', () => {
  it('computes prefix sums including negatives and singleton queries', () => {
    expect(run('truyvantong', { values: [3, 1, 4, 1, 5], queries: [[1, 3], [2, 5], [4, 4]] }).outputs).toEqual(['8', '11', '1']);
    expect(run('truyvantong', { values: [-3, 5, -2], queries: [[1, 3]] }).outputs).toEqual(['0']);
  });
  it('never reuses a book', () => {
    expect(run('tiem_sach', { weights: [2], prices: [3], capacity: 4 }).outputs).toEqual(['3']);
    expect(run('tiem_sach', findAlgorithm('tiem_sach').presets[0].input).outputs).toEqual(['13']);
  });
  it('matches edit distance boundaries and operations', () => {
    expect(run('rut_bai_trung_thuong', { a: 'kitten', b: 'sitting' }).outputs).toEqual(['3']);
    expect(run('rut_bai_trung_thuong', { a: '', b: 'abc' }).outputs).toEqual(['3']);
    expect(run('rut_bai_trung_thuong', { a: 'abc', b: '' }).outputs).toEqual(['3']);
    expect(run('rut_bai_trung_thuong', { a: '', b: '' }).outputs).toEqual(['0']);
  });
  it('handles LCA across branches, ancestor/self queries and rejects non-trees', () => {
    expect(run('nguoi_giao_com', findAlgorithm('nguoi_giao_com').presets[0].input).outputs).toEqual(['4', '1', '0']);
    expect(run('nguoi_giao_com', { n: 1, edges: [], queries: [[1, 1]] }).outputs).toEqual(['0']);
    expect(findAlgorithm('nguoi_giao_com').validate({ n: 4, edges: [[1, 2], [2, 3], [3, 1]], queries: [] })).not.toBeNull();
  });
  it('counts safe paths and blocked endpoints', () => {
    expect(run('duong_di_an_toan', { grid: ['...', '...', '...'] }).outputs).toEqual(['6']);
    expect(run('duong_di_an_toan', { grid: ['.*.', '...', '...'] }).outputs).toEqual(['3']);
    expect(run('duong_di_an_toan', { grid: ['*..', '...', '...'] }).outputs).toEqual(['0']);
    expect(run('duong_di_an_toan', { grid: ['..', '.*'] }).outputs).toEqual(['0']);
  });
  it('uses strict interval compatibility', () => {
    expect(run('do_an', { projects: [{ start: 1, end: 2, value: 5 }, { start: 2, end: 3, value: 7 }] }).outputs).toEqual(['7']);
    expect(run('do_an', findAlgorithm('do_an').presets[0].input).outputs).toEqual(['18']);
  });
  it('both LIS variants match an independent quadratic reference', () => {
    const cases = [[], [2, 2, 2], [5, 4, 3], [-3, -1, -2, 0], [3, 1, 2, 5, 4, 6]];
    let seed = 17;
    for (let k = 0; k < 30; k++) cases.push(Array.from({ length: 15 }, () => { seed = (seed * 16807) % 2147483647; return seed % 9 - 4; }));
    for (const values of cases) {
      const dp = values.map(() => 1);
      for (let i = 0; i < values.length; i++) for (let j = 0; j < i; j++) if (values[j] < values[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
      const expected = Math.max(0, ...dp);
      expect(run('daycontangdainhat', { values }).outputs).toEqual([String(expected)]);
      const result = run('daicontangdainhat2', { values }).state;
      expect(Number(result.result!.split('\n')[0])).toBe(expected);
      const indices = result.path ?? []; expect(indices).toHaveLength(expected);
      for (let i = 1; i < indices.length; i++) { expect(indices[i]).toBeGreaterThan(indices[i - 1]); expect(values[indices[i]]).toBeGreaterThan(values[indices[i - 1]]); }
    }
    expect(run('daicontangdainhat2', { values: [2, 2, 2] }).state.path).toEqual([0]);
  });
});

describe('lazy worker runner', () => {
  it('continues lazily and can change detail without resetting', () => {
    const a = findAlgorithm('sinh-hoan-vi'), runner = new SimulationRunner(a.simulate({ n: 8 }));
    const first = runner.next(1, 'easy'); expect(first.done).toBe(false); expect(first.events).toHaveLength(1); expect(first.events[0].action).toBe('accept');
    const second = runner.next(1, 'detailed'); expect(second.events[0].action).toBe('check');
    expect(() => runner.next(100000, 'easy')).toThrow();
  });
  it('marks completion and filters checks while preserving final state', () => {
    const runner = new SimulationRunner(findAlgorithm('sinh-hoan-vi').simulate({ n: 3 }));
    let done = false, outputs = 0;
    while (!done) { const batch = runner.next(4, 'easy'); done = batch.done; for (const e of batch.events) { expect(e.detail).toBe(false); if (e.action === 'output') outputs++; } }
    expect(outputs).toBe(6);
    expect(runner.next(1, 'easy')).toEqual({ type: 'batch', events: [], done: true });
  });
});
