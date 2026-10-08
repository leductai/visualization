import type { Algorithm, Cell, SimulationEvent, VisualState } from '../../engine/types';

export type Point = [number, number, number];
export interface SceneNode { key: string; index: number; label: string; caption: string; position: Point; size: Point; color: string; active: boolean; }
export interface SceneLink { from: string; to: string; highlighted: boolean; }
export interface SceneModel { nodes: SceneNode[]; links: SceneLink[]; }

function text(value: Cell, sudoku: boolean) {
  return value === '' || sudoku && value === 'X' ? '·' : typeof value === 'boolean' ? value ? '●' : '○' : String(value);
}

const categoryPalette = {
  'Quay lui': { accent: '#3f9d73', base: '#e8f4ee', edge: '#9cc4b2' },
  'Chia để trị': { accent: '#7c5cbf', base: '#ece7f8', edge: '#b3a3d9' },
  'Quy hoạch động': { accent: '#3b7dbf', base: '#e4edf8', edge: '#99b8d6' },
  'Cấu trúc dữ liệu': { accent: '#c27824', base: '#fbf1e4', edge: '#dab582' },
  'Tối ưu': { accent: '#b0578f', base: '#f7e9f2', edge: '#d3a9c6' },
} as const;

export function buildSceneModel(algorithm: Algorithm, state: VisualState, action?: SimulationEvent['action']): SceneModel {
  const nodes: SceneNode[] = [], links: SceneLink[] = [];
  const palette = categoryPalette[algorithm.category] ?? categoryPalette['Cấu trúc dữ liệu'];
  const activeColor = action === 'reject' ? '#e9a390' : action === 'undo' ? '#b7a7d5' : '#60c2a5';
  const color = (index: number, base: string = palette.base) => state.active?.includes(index) ? activeColor : state.marked?.includes(index) ? '#f0c999' : state.path?.includes(index) ? '#a2d7ee' : base;
  const add = (key: string, index: number, value: Cell, caption: string, x: number, z: number, width = .94, height = .3, base?: string, y = 0) => {
    const nodeBase = base ?? palette.base;
    const active = index >= 0 && (state.active?.includes(index) ?? false);
    nodes.push({ key, index, label: text(value, algorithm.id === 'sudoku'), caption, position: [x, y + height / 2 + (active ? .42 : 0), z], size: [width, height, .94], color: index < 0 ? nodeBase : color(index, nodeBase), active });
  };
  if (algorithm.id === 'quy-hoach-tuyen-tinh' && state.lp) {
    const lp = state.lp;
    const spanX = Math.max(1, lp.xmax - lp.xmin), spanZ = Math.max(1, lp.ymax - lp.ymin);
    const s = Math.min(7.5 / spanX, 7.5 / spanZ);
    const midX = (lp.xmin + lp.xmax) / 2, midY = (lp.ymin + lp.ymax) / 2;
    const X = (x: number) => (x - midX) * s, Z = (y: number) => (y - midY) * s;
    nodes.push({ key: 'lp-base', index: -1, label: '', caption: `Mặt phẳng X–Y · x ${lp.xmin.toFixed(1)}..${lp.xmax.toFixed(1)}`, position: [0, 0.09, 0], size: [spanX * s + 1, 0.18, spanZ * s + 1], color: '#e9e2d2', active: false });
    const cx0 = lp.verts.length ? lp.verts.reduce((t, v) => t + v.x, 0) / lp.verts.length : midX;
    const cy0 = lp.verts.length ? lp.verts.reduce((t, v) => t + v.y, 0) / lp.verts.length : midY;
    const order = lp.verts.map((_, i) => i).sort((p, q) => Math.atan2(lp.verts[p].y - cy0, lp.verts[p].x - cx0) - Math.atan2(lp.verts[q].y - cy0, lp.verts[q].x - cx0));
    lp.verts.forEach((v, i) => {
      const isBest = i === lp.best, isActive = state.active?.includes(i) ?? false;
      const h = isBest ? 1.15 : 0.32;
      nodes.push({
        key: `lp-v${i}`, index: i, label: `(${v.x}, ${v.y})`,
        caption: `Đỉnh ${i + 1} (${v.x}, ${v.y}) · Z = ${v.z}${isBest ? ' · tối ưu' : ''}`,
        position: [X(v.x), 0.18 + h / 2 + (isActive ? 0.42 : 0), Z(v.y)],
        size: [0.52, h, 0.52],
        color: isActive ? activeColor : isBest ? '#259b7c' : state.marked?.includes(i) ? '#f0c999' : '#3b7dbf',
        active: isActive,
      });
    });
    for (let k = 0; k < order.length; k++) {
      const a = order[k], b = order[(k + 1) % order.length];
      if (a !== b) links.push({ from: `lp-v${a}`, to: `lp-v${b}`, highlighted: true });
    }
    const gn = Math.hypot(lp.cx, lp.cy) || 1, reach = Math.max(spanX, spanZ) * 0.22;
    const tx = cx0 + lp.cx / gn * reach, ty = cy0 + lp.cy / gn * reach;
    nodes.push({ key: 'lp-origin', index: -1, label: 'Z', caption: `Hướng tăng Z (${lp.cx}, ${lp.cy})`, position: [X(cx0), 0.3, Z(cy0)], size: [0.5, 0.24, 0.5], color: '#c0392b', active: false });
    nodes.push({ key: 'lp-tip', index: -1, label: '→', caption: `Hướng tăng Z (${lp.cx}, ${lp.cy})`, position: [X(tx), 0.3, Z(ty)], size: [0.5, 0.24, 0.5], color: '#e9a390', active: false });
    links.push({ from: 'lp-origin', to: 'lp-tip', highlighted: true });
    return { nodes, links };
  }
  if (algorithm.id === 'vach-thuoc' && state.grid && state.grid.length > 0 && (state.grid[0]?.length ?? 0) > 0) {
    const rows = state.grid.length, cols = state.grid[0].length;
    const marks: (number | null)[] = Array(cols).fill(null);
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      const v = state.grid[r][c];
      if (typeof v === 'number' && v > 0) marks[c] = Math.max(marks[c] ?? 0, v);
      else if (typeof v === 'string' && /^\d+$/.test(v)) marks[c] = Math.max(marks[c] ?? 0, Number(v));
    }
    const activeCols = new Set((state.active ?? []).map(i => ((i % cols) + cols) % cols));
    const L = cols - 1;
    const baseTop = 0.22, backEdge = -1.5;
    nodes.push({ key: 'ruler-base', index: -1, label: '', caption: `Thước dài ${L} · ${rows} tầng`, position: [0, 0.11, 0.2], size: [cols * 1.02 + 0.5, 0.22, 3.4], color: '#deb86a', active: false });
    for (let c = 0; c < cols; c++) {
      const mark = marks[c], isActive = activeCols.has(c);
      // Vạch nằm dẹt trên mặt thước, dài theo độ cao như thước thật (không dựng đứng).
      const len = mark ? 0.6 + (mark / Math.max(1, rows)) * 1.9 : 0.35;
      const thick = isActive ? 0.06 : 0.035;
      const x = (c - (cols - 1) / 2) * 1.02;
      nodes.push({
        key: `tick-${c}`, index: c, label: '',
        caption: `Vạch ${c} · ${mark ? `cao ${mark}` : 'chưa vạch'}${isActive ? ' · đang xét' : ''}`,
        position: [x, baseTop + thick / 2 + (isActive ? 0.12 : 0), backEdge + len / 2],
        size: [mark ? (mark === rows ? 0.22 : 0.16) : 0.1, thick, len],
        color: isActive ? activeColor : mark ? '#33414f' : '#c9a86a', active: isActive,
      });
      nodes.push({
        key: `scale-${c}`, index: -1, label: String(c), caption: `Vị trí ${c}`,
        position: [x, baseTop + 0.015, 1.45], size: [0.6, 0.03, 0.5],
        color: isActive ? '#ffe9bd' : '#f7ecd2', active: false,
      });
    }
    return { nodes, links };
  }
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
