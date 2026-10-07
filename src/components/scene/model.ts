import type { Algorithm, Cell, SimulationEvent, VisualState } from '../../engine/types';

export type Point = [number, number, number];
export interface SceneNode { key: string; index: number; label: string; caption: string; position: Point; size: Point; color: string; active: boolean; }
export interface SceneLink { from: string; to: string; highlighted: boolean; }
export interface SceneModel { nodes: SceneNode[]; links: SceneLink[]; }

function text(value: Cell, sudoku: boolean) {
  return value === '' || sudoku && value === 'X' ? '·' : typeof value === 'boolean' ? value ? '●' : '○' : String(value);
}

export function buildSceneModel(algorithm: Algorithm, state: VisualState, action?: SimulationEvent['action']): SceneModel {
  const nodes: SceneNode[] = [], links: SceneLink[] = [];
  const activeColor = action === 'reject' ? '#e9a390' : action === 'undo' ? '#b7a7d5' : '#60c2a5';
  const color = (index: number, base = '#f8fbfc') => state.active?.includes(index) ? activeColor : state.marked?.includes(index) ? '#f0c999' : state.path?.includes(index) ? '#a2d7ee' : base;
  const add = (key: string, index: number, value: Cell, caption: string, x: number, z: number, width = .94, height = .3, base = '#f8fbfc', y = 0) => {
    const active = index >= 0 && (state.active?.includes(index) ?? false);
    nodes.push({ key, index, label: text(value, algorithm.id === 'sudoku'), caption, position: [x, y + height / 2 + (active ? .42 : 0), z], size: [width, height, .94], color: index < 0 ? base : color(index, base), active });
  };
  if (state.edges) {
    const adjacency = new Map<number, number[]>(), depth = new Map([[1, 0]]), queue = [1];
    for (const [a, b] of state.edges) { if (!adjacency.has(a)) adjacency.set(a, []); if (!adjacency.has(b)) adjacency.set(b, []); adjacency.get(a)!.push(b); adjacency.get(b)!.push(a); }
    for (let i = 0; i < queue.length; i++) for (const v of adjacency.get(queue[i]) ?? []) if (!depth.has(v)) { depth.set(v, depth.get(queue[i])! + 1); queue.push(v); }
    const maxDepth = Math.max(0, ...depth.values());
    for (let d = 0; d <= maxDepth; d++) {
      const row = queue.filter(v => depth.get(v) === d);
      row.forEach((v, i) => add(`node-${v}`, v - 1, v, `Đỉnh ${v} · độ sâu ${d}`, (i - (row.length - 1) / 2) * 1.7, (d - maxDepth / 2) * 1.9, .98, .5, '#daeaf2', (maxDepth - d) * .35));
    }
    state.edges.forEach(([a, b]) => links.push({ from: `node-${a}`, to: `node-${b}`, highlighted: Boolean(state.path?.includes(a - 1) && state.path?.includes(b - 1)) }));
  } else if (state.intervals) {
    const min = Math.min(...state.intervals.map(p => p.start)), max = Math.max(...state.intervals.map(p => p.end)), scale = 7 / (max - min || 1);
    state.intervals.forEach((p, i) => {
      const width = Math.max(.9, (p.end - p.start) * scale);
      add(`project-${i}`, i, `${p.start} → ${p.end}`, `Dự án ${i + 1} · tín chỉ ${p.value} · dp = ${state.values?.[i] ?? 0}`, (p.start - min) * scale + width / 2 - 3.5, (i - (state.intervals!.length - 1) / 2) * 1.22, width, .26 + p.value * .04, '#b8d7e8');
    });
  } else if (state.grid) {
    const rows = state.grid.length, columns = state.grid[0]?.length ?? 0, sudoku = algorithm.id === 'sudoku';
    const gap = (index: number, size: number) => sudoku ? Math.floor(index / 3) * .12 - Math.floor((size - 1) / 3) * .06 : 0;
    state.grid.forEach((row, r) => row.forEach((value, c) => {
      const height = value === '*' ? .9 : algorithm.id === 'duong_di_an_toan' && typeof value === 'number' ? .22 + Math.min(.65, Math.log2(value + 1) * .11) : .28;
      const base = value === '*' ? '#8094a0' : sudoku && (Math.floor(r / 3) + Math.floor(c / 3)) % 2 === 1 ? '#dfeaf0' : '#f8fbfc';
      add(`cell-${r * columns + c}`, r * columns + c, value === '*' ? '×' : value, `${state.rowLabels?.[r] ?? r + 1}, ${state.columnLabels?.[c] ?? c + 1} · ${value}`, c - (columns - 1) / 2 + gap(c, columns), r - (rows - 1) / 2 + gap(r, rows), .92, height, base);
    }));
    state.rowLabels?.forEach((label, r) => add(`axis-row-${r}`, -1, label, `Hàng ${r}: ${label}`, -(columns - 1) / 2 - 1, r - (rows - 1) / 2, .6, .12, '#b8d4e0'));
    state.columnLabels?.forEach((label, c) => add(`axis-column-${c}`, -1, label, `Cột ${c}: ${label}`, c - (columns - 1) / 2, -(rows - 1) / 2 - 1, .6, .12, '#b8d4e0'));
    for (let i = 1; i < (state.path?.length ?? 0); i++) links.push({ from: `cell-${state.path![i - 1]}`, to: `cell-${state.path![i]}`, highlighted: true });
  } else {
    const count = algorithm.id === 'dia-chi-ip' ? 4 : algorithm.kind === 'string' ? Math.max(1, state.secondary?.length ?? 0) : Math.max(1, state.values?.length ?? 0);
    const maximum = Math.max(1, ...(state.values ?? []).map(v => typeof v === 'number' ? Math.abs(v) : 0));
    for (let i = 0; i < count; i++) {
      const value = state.values?.[i] ?? '', height = typeof value === 'number' && algorithm.category !== 'Quay lui' ? .3 + Math.abs(value) / maximum * 1.5 : .55;
      add(`value-${i}`, i, value, `${state.labels?.[i] ?? `Vị trí ${i + 1}`} · ${value || '∅'}`, (i - (count - 1) / 2) * 1.12, -.65, .97, height);
    }
    for (let i = 1; i < (state.path?.length ?? 0); i++) links.push({ from: `value-${state.path![i - 1]}`, to: `value-${state.path![i]}`, highlighted: true });
  }
  if (state.secondary && !state.grid && !state.edges && !state.intervals) {
    state.secondary.forEach((value, i) => add(`secondary-${i}`, -1, value, `${state.secondaryLabel ?? 'Bảng phụ'} [${i}] · ${value}`, (i - (state.secondary!.length - 1) / 2) * .9, 1.15, .74, .22, value === true ? '#8bcbb9' : '#c9dce6'));
  }
  return { nodes, links };
}
