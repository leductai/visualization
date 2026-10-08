import { lazy, Suspense, type CSSProperties } from 'react';
import { CheckCheck } from 'lucide-react';
import type { Algorithm, Cell, SimulationEvent, VisualState } from '../engine/types';
import { vi } from '../i18n/vi';
import type { ScenePlayback } from './Scene3D';

const Scene3D = lazy(() => import('./Scene3D'));

const cellText = (value: Cell) => typeof value === 'boolean' ? value ? '●' : '○' : value === '' ? '·' : String(value);
const cellClass = (state: VisualState, index: number, action?: SimulationEvent['action']) => `${state.marked?.includes(index) ? 'marked' : ''} ${state.path?.includes(index) ? 'path' : ''} ${state.active?.includes(index) ? 'active' : ''} ${state.active?.includes(index) && action ? `a-${action}` : ''}`;

function ArrayRow({ values, state, labels, compact = false, action }: { values: Cell[]; state: VisualState; labels?: string[]; compact?: boolean; action?: SimulationEvent['action'] }) {
  return <div className={`array-row ${compact ? 'compact' : ''}`}>
    {values.length === 0 ? <span className="empty-value">∅</span> : values.map((value, i) => <div className={`array-cell ${cellClass(state, i, action)}`} key={i}>
      <b>{cellText(value)}</b><small>{labels?.[i] ?? i + 1}</small>
    </div>)}
  </div>;
}

function BarRow({ values, state, label, labels, action }: { values: Cell[]; state: VisualState; label?: string; labels?: string[]; action?: SimulationEvent['action'] }) {
  const numeric = values.filter(v => typeof v === 'number') as number[];
  const max = Math.max(1, ...numeric.map(v => Math.abs(v)));
  const allNumeric = numeric.length === values.length;
  if (!allNumeric || values.length === 0) return <ArrayRow values={values} state={state} labels={labels} action={action}/>;
  return <div className="bar-row" role="img" aria-label={label ?? 'Biểu đồ cột'}>
    {label && <span className="data-label">{label}</span>}
    <div className="bar-track">
      {values.map((value, i) => {
        const h = Math.abs(Number(value)) / max * 100;
        return <div className={`bar-col ${cellClass(state, i, action)}`} key={i}>
          <div className="bar-fill" style={{ height: `${Math.max(3, h)}%` }}/>
          <b>{cellText(value)}</b><small>{labels?.[i] ?? i + 1}</small>
        </div>;
      })}
    </div>
  </div>;
}

function Tree({ state, action }: { state: VisualState; action?: SimulationEvent['action'] }) {
  const edges = state.edges ?? [], nodes = state.values ?? [1];
  const children = new Map<number, number[]>(), depths = new Map<number, number>([[1, 0]]), queue = [1];
  const adj = new Map<number, number[]>();
  edges.forEach(([a, b]) => { adj.set(a, [...(adj.get(a) ?? []), b]); adj.set(b, [...(adj.get(b) ?? []), a]); });
  for (let i = 0; i < queue.length; i++) {
    const u = queue[i];
    for (const v of adj.get(u) ?? []) if (!depths.has(v)) { depths.set(v, depths.get(u)! + 1); queue.push(v); children.set(u, [...(children.get(u) ?? []), v]); }
  }
  const levels = Array.from({ length: Math.max(...depths.values()) + 1 }, (_, depth) => queue.filter(v => depths.get(v) === depth));
  const positions = new Map<number, [number, number]>();
  levels.forEach((level, d) => level.forEach((node, i) => positions.set(node, [(i + 1) * 540 / (level.length + 1), 28 + d * 72])));
  return <svg className="tree-svg" viewBox={`0 0 540 ${Math.max(105, levels.length * 72)}`} role="img" aria-label="Cây và đường đi truy vấn">
    {edges.map(([a, b]) => { const pa = positions.get(a)!, pb = positions.get(b)!; const onPath = state.path?.includes(a - 1) && state.path?.includes(b - 1);
      return <line key={`${a}-${b}`} x1={pa[0]} y1={pa[1]} x2={pb[0]} y2={pb[1]} className={onPath ? 'tree-path' : ''}/>;
    })}
    {nodes.map(value => { const node = Number(value), [x, y] = positions.get(node) ?? [0, 0];
      return <g key={node} transform={`translate(${x},${y})`} className={`tree-node ${cellClass(state, node - 1, action)}`}><circle r="18"/><text textAnchor="middle" dominantBaseline="central">{node}</text></g>;
    })}
  </svg>;
}

function Grid({ state, sudoku = false, heatmap = false, action }: { state: VisualState; sudoku?: boolean; heatmap?: boolean; action?: SimulationEvent['action'] }) {
  const columns = state.grid?.[0]?.length ?? 1;
  return <div className={`matrix ${sudoku ? 'sudoku-board' : ''}`} style={{ '--columns': columns } as CSSProperties}>
    {state.columnLabels && <div className="matrix-row column-labels"><span/>{state.columnLabels.map((label, c) => <span key={c}>{label}</span>)}</div>}
    {state.grid?.map((row, r) => <div className="matrix-row" key={r}>
      {state.rowLabels && <span className="row-label">{state.rowLabels[r]}</span>}
      {row.map((value, c) => <div key={c} className={`grid-cell ${value === '*' ? 'blocked' : ''} ${cellClass(state, r * columns + c, action)} ${sudoku && c % 3 === 2 && c !== 8 ? 'box-right' : ''} ${sudoku && r % 3 === 2 && r !== 8 ? 'box-bottom' : ''}`} style={heatmap && typeof value === 'number' && value > 0 && !state.active?.includes(r * columns + c) && !state.marked?.includes(r * columns + c) ? { backgroundColor: `rgba(55,139,188,${Math.min(.3, Math.log2(value + 1) * .045)})` } : undefined} aria-label={`Ô ${r + 1}, ${c + 1}: ${value}`}>
        {value === '*' ? '×' : sudoku && value === 'X' ? '·' : cellText(value)}
      </div>)}
    </div>)}
  </div>;
}

function Timeline({ state, action }: { state: VisualState; action?: SimulationEvent['action'] }) {
  const items = state.intervals ?? [], min = Math.min(...items.map(p => p.start)), max = Math.max(...items.map(p => p.end));
  return <div className="intervals">{items.map((p, i) => <div className={`interval-row ${cellClass(state, i, action)}`} key={i}>
    <span className="interval-index">{i + 1}</span><div className="interval-track"><div className="interval-bar" style={{ marginLeft: `${(p.start - min) / (max - min || 1) * 78}%`, width: `${Math.max(12, (p.end - p.start) / (max - min || 1) * 78)}%` }}>{p.start} → {p.end}</div></div><b>+{p.value}</b>
  </div>)}</div>;
}

function RulerView({ state }: { state: VisualState }) {
  const grid = state.grid;
  if (!grid || grid.length === 0) return null;
  const rows = grid.length, cols = grid[0]?.length ?? 0;
  const marks: (number | null)[] = Array(cols).fill(null);
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const v = grid[r][c];
      if (typeof v === 'number' && v > 0) marks[c] = v;
      else if (typeof v === 'string' && /^d+$/.test(v)) marks[c] = Number(v);
    }
  }
  const activeCols = new Set((state.active ?? []).map(idx => idx % cols));
  return (
    <div className="ruler-wrap" aria-label="Mô hình cây thước">
      <div className="ruler-track">
        {marks.map((h, c) => (
          <div key={c} className={`ruler-tick ${h ? '' : 'empty'} ${activeCols.has(c) ? 'active' : ''}`} style={{ height: h ? `${(h / rows) * 100}%` : '6%' }}>
            {h ? <span className="tick-label">{h}</span> : null}
          </div>
        ))}
      </div>
      <div className="ruler-scale">
        {Array.from({ length: cols }, (_, i) => <span key={i}>{i}</span>)}
      </div>
    </div>
  );
}

function LPView({ state, action }: { state: VisualState; action?: SimulationEvent['action'] }) {
  const lp = state.lp;
  if (!lp) return null;
  const W = 560, H = 420, P = 44;
  const sx = (x: number) => P + (x - lp.xmin) / (lp.xmax - lp.xmin || 1) * (W - 2 * P);
  const sy = (y: number) => H - P - (y - lp.ymin) / (lp.ymax - lp.ymin || 1) * (H - 2 * P);
  const ticks: number[] = [];
  for (let v = Math.ceil(lp.xmin); v <= lp.xmax; v++) ticks.push(v);
  const yticks: number[] = [];
  for (let v = Math.ceil(lp.ymin); v <= lp.ymax; v++) yticks.push(v);
  const seg = (a: number, b: number, c: number): [number, number, number, number] => {
    let x1: number, y1: number, x2: number, y2: number;
    if (Math.abs(b) >= Math.abs(a)) {
      x1 = lp.xmin; y1 = (c - a * x1) / b; x2 = lp.xmax; y2 = (c - a * x2) / b;
    } else {
      y1 = lp.ymin; x1 = (c - b * y1) / a; y2 = lp.ymax; x2 = (c - b * y2) / a;
    }
    return [sx(Math.max(lp.xmin, Math.min(lp.xmax, x1))), sy(Math.max(lp.ymin, Math.min(lp.ymax, y1))),
      sx(Math.max(lp.xmin, Math.min(lp.xmax, x2))), sy(Math.max(lp.ymin, Math.min(lp.ymax, y2)))];
  };
  const cx0 = lp.verts.length ? lp.verts.reduce((s, v) => s + v.x, 0) / lp.verts.length : 0;
  const cy0 = lp.verts.length ? lp.verts.reduce((s, v) => s + v.y, 0) / lp.verts.length : 0;
  const poly = [...lp.verts].sort((p, q) => Math.atan2(p.y - cy0, p.x - cx0) - Math.atan2(q.y - cy0, q.x - cx0));
  const n = Math.hypot(lp.cx, lp.cy) || 1, span = Math.max(lp.xmax - lp.xmin, lp.ymax - lp.ymin);
  const ax = cx0 + lp.cx / n * span * 0.22, ay = cy0 + lp.cy / n * span * 0.22;
  return <svg className="lp-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Miền nghiệm trên mặt phẳng X Y">
    {ticks.map(v => <line key={`gx${v}`} x1={sx(v)} y1={P / 2} x2={sx(v)} y2={H - P} className="lp-grid"/>)}
    {yticks.map(v => <line key={`gy${v}`} x1={P} y1={sy(v)} x2={W - P / 2} y2={sy(v)} className="lp-grid"/>)}
    {ticks.map(v => <text key={`tx${v}`} x={sx(v)} y={H - P + 16} className="lp-tick">{v}</text>)}
    {yticks.map(v => <text key={`ty${v}`} x={P - 8} y={sy(v) + 4} className="lp-tick">{v}</text>)}
    {lp.xmin <= 0 && lp.xmax >= 0 && <line x1={sx(0)} y1={P / 2} x2={sx(0)} y2={H - P} className="lp-axis"/>}
    {lp.ymin <= 0 && lp.ymax >= 0 && <line x1={P} y1={sy(0)} x2={W - P / 2} y2={sy(0)} className="lp-axis"/>}
    <text x={W - P / 2} y={sy(0) - 8} className="lp-axis-label">X</text>
    <text x={sx(0) + 8} y={P / 2 + 6} className="lp-axis-label">Y</text>
    {lp.lines.map((L, i) => { const [x1, y1, x2, y2] = seg(L.a, L.b, L.c); return <g key={i}><line x1={x1} y1={y1} x2={x2} y2={y2} className="lp-line"/><text x={x2 - 4} y={y2 - 6} className="lp-line-label">R{i + 1}</text></g>; })}
    {poly.length >= 3 && lp.status !== 'infeasible' && <polygon points={poly.map(v => `${sx(v.x)},${sy(v.y)}`).join(' ')} className="lp-poly"/>}
    <line x1={sx(cx0)} y1={sy(cy0)} x2={sx(ax)} y2={sy(ay)} className="lp-gradient" markerEnd="url(#lp-arrow)"/>
    <defs><marker id="lp-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" className="lp-arrow-head"/></marker></defs>
    {lp.verts.map((v, i) => <g key={i} className={`lp-vertex ${i === lp.best ? 'best' : ''} ${state.active?.includes(i) ? 'active' : ''} ${action ? `a-${action}` : ''}`}>
      <circle cx={sx(v.x)} cy={sy(v.y)} r={i === lp.best ? 8 : 5.5}/>
      <text x={sx(v.x) + 10} y={sy(v.y) - 8} className="lp-vertex-label">({v.x}, {v.y})</text>
    </g>)}
    {lp.status !== 'optimal' && <text x={W / 2} y={P} textAnchor="middle" className="lp-status">{lp.status === 'infeasible' ? 'Vô nghiệm' : 'Không giới nội'}</text>}
  </svg>;
}

export function VisualStage({ algorithm, state, mode, motion, step, action, runKey, onFallback, playback }: {
  algorithm: Algorithm; state: VisualState; mode: '2d' | '3d'; motion: boolean; step: number; action?: SimulationEvent['action']; runKey: string; onFallback: () => void;
  playback: ScenePlayback;
}) {
  const isRecursive = algorithm.category === 'Quay lui';
  const depth = Number(state.variables?.viTri ?? state.variables?.soPhan ?? 0);
  const caption = algorithm.category === 'Quay lui' ? `QUAY LUI · ${algorithm.kind === 'grid' ? 'BẢNG ĐIỀU KHIỂN' : 'MẢNG LỰA CHỌN'}`
    : algorithm.category === 'Chia để trị' ? `CHIA ĐỂ TRỊ · ĐỆ QUY`
    : algorithm.category === 'Tối ưu' ? `TỐI ƯU · ĐỒ THỊ X–Y`
    : algorithm.category === 'Quy hoạch động' ? `QUY HOẠCH ĐỘNG · BẢNG DP`
    : algorithm.kind === 'tree' ? 'CÂY GỐC 1' : algorithm.kind === 'timeline' ? 'DỰ ÁN / THỜI GIAN' : algorithm.kind === 'grid' ? 'BẢNG TRẠNG THÁI' : algorithm.kind === 'string' ? 'PHÂN ĐOẠN' : 'CẤU TRÚC DỮ LIỆU';
  return <div className={`visual-stage visual-${algorithm.kind} ${mode === '3d' ? 'immersive-stage' : ''}`} data-testid="visual-stage" data-action={action}>
    <div className="stage-caption"><span>{caption}</span><span>{algorithm.complexity}</span></div>
    {mode === '3d' ? <Suspense fallback={<div className="scene-loading"><span className="loading-tiles"><i/><i/><i/></span>{vi.loadingScene}</div>}><Scene3D algorithm={algorithm} state={state} motion={motion} step={step} action={action} runKey={runKey} onFallback={onFallback} playback={playback}/></Suspense> : <div className="primary-visual">
      {state.edges ? <><Tree state={state} action={action}/>{state.grid && <div className="ancestor-table"><span className="data-label">cha[v][k]</span><Grid state={{ grid: state.grid, columnLabels: state.columnLabels, rowLabels: state.values?.map(String) }} action={action}/></div>}</>
        : state.intervals ? <><Timeline state={state} action={action}/><span className="data-label">tongTinChi</span><ArrayRow values={state.values ?? []} state={state} compact action={action}/></>
        : state.lp ? <LPView state={state} action={action}/>
        : algorithm.id === 'vach-thuoc' ? <RulerView state={state}/> : state.grid ? <Grid state={state} sudoku={algorithm.id === 'sudoku'} heatmap={algorithm.id === 'duong_di_an_toan'} action={action}/>
        : algorithm.category === 'Quy hoạch động' || algorithm.category === 'Cấu trúc dữ liệu'
          ? <BarRow values={state.values ?? []} labels={state.labels} state={state} action={action} label={algorithm.id === 'truyvantong' ? 'tongTichLuy' : algorithm.id === 'tiem_sach' ? 'giaTriMax' : algorithm.id === 'do_an' ? 'tongTinChi' : algorithm.id === 'daycontangdainhat' || algorithm.id === 'daicontangdainhat2' ? 'Giá trị' : undefined}/>
          : <ArrayRow values={state.values ?? []} labels={state.labels} state={state} action={action}/>}
    </div>}
    {state.secondary && (mode === '2d' || Boolean(state.grid) || Boolean(state.edges)) && <div className="secondary-visual"><span className="data-label">{state.secondaryLabel ?? 'Bảng phụ'}</span><ArrayRow values={state.secondary} state={{}} labels={algorithm.id === 'truyvantong' || algorithm.id === 'rut_bai_trung_thuong' ? state.secondary.map((_, i) => String(i)) : undefined} compact/></div>}
    {mode === '3d' && state.secondary && !state.grid && !state.edges && <span className="scene-data-label">{state.secondaryLabel}</span>}
    {mode === '3d' && state.edges && state.grid && <div className="ancestor-table"><span className="data-label">cha[v][k]</span><Grid state={{ grid: state.grid, columnLabels: state.columnLabels, rowLabels: state.values?.map(String) }}/></div>}
    {isRecursive && !state.grid && <div className="recursion-path"><span className="data-label">Độ sâu</span>{Array.from({ length: Math.min(depth + 1, 21) }, (_, i) => <span className={i === depth ? 'current' : ''} key={i}>{i}</span>)}</div>}
    {algorithm.id === 'tinh-diem-mon-hoc' && state.variables?.canDuoi !== undefined && <div className="bounds"><span>Cận khả thi</span><b>{state.variables.canDuoi} … {state.variables.canTren}</b><span>Mục tiêu</span><b>{state.variables.tongThapNhat} … {state.variables.tongCaoNhat}</b></div>}
    {state.result && <div className="result-banner" data-testid="result"><CheckCheck size={18}/><span>Kết quả</span><pre>{state.result}</pre></div>}
  </div>;
}
