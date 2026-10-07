import { describe, expect, it } from 'vitest';
import { algorithms, findAlgorithm } from '../../algorithms/registry';
import { buildSceneModel } from './model';

describe('3D scene data', () => {
  for (const algorithm of algorithms) for (const preset of algorithm.presets) {
    it(`${algorithm.id} / ${preset.name}: finite, uniquely keyed, readable scene`, () => {
      const model = buildSceneModel(algorithm, algorithm.initial(preset.input));
      expect(model.nodes.length).toBeGreaterThan(0);
      expect(new Set(model.nodes.map(node => node.key)).size).toBe(model.nodes.length);
      for (const node of model.nodes) {
        expect(node.position.every(Number.isFinite)).toBe(true);
        expect(node.size.every(size => Number.isFinite(size) && size > 0)).toBe(true);
        expect(node.label).not.toBe('undefined'); expect(node.caption.length).toBeGreaterThan(0);
      }
      for (const link of model.links) { expect(model.nodes.some(n => n.key === link.from)).toBe(true); expect(model.nodes.some(n => n.key === link.to)).toBe(true); }
    });
  }
  it('raises active cells, marks rejection and preserves word X vs Sudoku blanks', () => {
    const word = findAlgorithm('tro-choi-ghep-chu');
    const state = { ...word.initial(word.presets[0].input), active: [0] };
    const chosen = buildSceneModel(word, state, 'accept'), rejected = buildSceneModel(word, state, 'reject');
    expect(chosen.nodes[0].position[1]).toBeGreaterThan(chosen.nodes[1].position[1]);
    expect(chosen.nodes[0].color).not.toBe(rejected.nodes[0].color);
    expect(chosen.nodes[3].label).toBe('X');
    const sudoku = findAlgorithm('sudoku'); expect(buildSceneModel(sudoku, sudoku.initial(sudoku.presets[0].input)).nodes[2].label).toBe('·');
  });
  it('keeps IP slots stable while partitions change', () => {
    const ip = findAlgorithm('dia-chi-ip'), initial = ip.initial(ip.presets[0].input);
    const count = (state: typeof initial) => buildSceneModel(ip, state).nodes.filter(n => n.key.startsWith('value-')).length;
    expect(count(initial)).toBe(4); expect(count({ ...initial, values: ['255'] })).toBe(4);
  });
  it('highlights actual LCA path edges', () => {
    const tree = findAlgorithm('nguoi_giao_com'), state = tree.initial(tree.presets[0].input);
    const model = buildSceneModel(tree, { ...state, path: [3, 1, 0, 2, 6] });
    expect(model.links.filter(link => link.highlighted)).toHaveLength(4);
  });
});
