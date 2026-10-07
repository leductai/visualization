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

export function VisualStage({ algorithm, state, mode, motion, step, action, runKey, onFallback, playback }: {
  algorithm: Algorithm; state: VisualState; mode: '2d' | '3d'; motion: boolean; step: number; action?: SimulationEvent['action']; runKey: string; onFallback: () => void;
  playback: ScenePlayback;
}) {
  const isRecursive = algorithm.category === 'Quay lui';
  const depth = Number(state.variables?.viTri ?? state.variables?.soPhan ?? 0);
  const caption = algorithm.category === 'Quay lui' ? `QUAY LUI · ${algorithm.kind === 'grid' ? 'BẢNG ĐIỀU KHIỂN' : 'MẢNG LỰA CHỌN'}`
    : algorithm.category === 'Quy hoạch động' ? `QUY HOẠCH ĐỘNG · BẢNG DP`
    : algorithm.kind === 'tree' ? 'CÂY GỐC 1' : algorithm.kind === 'timeline' ? 'DỰ ÁN / THỜI GIAN' : algorithm.kind === 'grid' ? 'BẢNG TRẠNG THÁI' : algorithm.kind === 'string' ? 'PHÂN ĐOẠN' : 'CẤU TRÚC DỮ LIỆU';
  return <div className={`visual-stage visual-${algorithm.kind} ${mode === '3d' ? 'immersive-stage' : ''}`} data-testid="visual-stage" data-action={action}>
    <div className="stage-caption"><span>{caption}</span><span>{algorithm.complexity}</span></div>
    {mode === '3d' ? <Suspense fallback={<div className="scene-loading"><span className="loading-tiles"><i/><i/><i/></span>{vi.loadingScene}</div>}><Scene3D algorithm={algorithm} state={state} motion={motion} step={step} action={action} runKey={runKey} onFallback={onFallback} playback={playback}/></Suspense> : <div className="primary-visual">
      {state.edges ? <><Tree state={state} action={action}/>{state.grid && <div className="ancestor-table"><span className="data-label">cha[v][k]</span><Grid state={{ grid: state.grid, columnLabels: state.columnLabels, rowLabels: state.values?.map(String) }} action={action}/></div>}</>
        : state.intervals ? <><Timeline state={state} action={action}/><span className="data-label">tongTinChi</span><ArrayRow values={state.values ?? []} state={state} compact action={action}/></>
        : state.grid ? <Grid state={state} sudoku={algorithm.id === 'sudoku'} heatmap={algorithm.id === 'duong_di_an_toan'} action={action}/>
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
