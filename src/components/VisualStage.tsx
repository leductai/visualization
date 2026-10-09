import { lazy, Suspense, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { CheckCheck, Expand, Maximize2, Pause, Play, Shrink, X, ZoomIn, ZoomOut } from 'lucide-react';
import type { Algorithm, Cell, SimulationEvent, VisualState } from '../engine/types';
import type { LPVertex } from '../engine/types';
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
      {row.map((value, c) => <div key={c} className={`grid-cell ${value === '*' ? 'blocked' : ''} ${cellClass(state, r * columns + c, action)} ${sudoku && c % 3 === 2 && c !== 8 ? 'box-right' : ''} ${sudoku && r % 3 === 2 && r !== 8 ? 'box-bottom' : ''}`} style={heatmap && typeof value === 'number' && value > 0 && !state.active?.includes(r * columns + c) && !state.marked?.includes(r * columns + c) && !state.path?.includes(r * columns + c) ? { backgroundColor: `rgba(55,139,188,${Math.min(.3, Math.log2(value + 1) * .045)})` } : undefined} aria-label={`Ô ${r + 1}, ${c + 1}: ${value}`}>
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

function LPView({ state, action, motion }: { state: VisualState; action?: SimulationEvent['action']; motion: boolean }) {
  const lp = state.lp;
  // Nội suy vị trí đỉnh giữa các bước để chuyển động mượt (đỉnh mới chỉ thêm vào cuối).
  const [disp, setDisp] = useState<(LPVertex & { o: number })[]>([]);
  const prev = useRef<(LPVertex & { o: number })[]>([]);
  useEffect(() => {
    const target = lp?.verts ?? [];
    if (!motion) {
      const snap = target.map(v => ({ ...v, o: 1 }));
      prev.current = snap; setDisp(snap); return;
    }
    const from = prev.current;
    // Đỉnh mới bay ra từ tâm cụm đỉnh cũ (thay vì hiện đột ngột tại chỗ).
    // Đỉnh đầu tiên bay ra từ giữa khung nhìn.
    const viewCenter = { x: (lp!.xmin + lp!.xmax) / 2, y: (lp!.ymin + lp!.ymax) / 2, z: 0 };
    const center = from.length ? {
      x: from.reduce((s, v) => s + v.x, 0) / from.length,
      y: from.reduce((s, v) => s + v.y, 0) / from.length,
      z: from.reduce((s, v) => s + v.z, 0) / from.length,
    } : viewCenter;
    const start = target.map((v, i) => (from[i] ? { ...from[i] } : { ...center, o: 0 }));
    let raf = 0;
    const t0 = performance.now(), dur = 450;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      const next = target.map((v, i) => {
        const s = start[i];
        return { x: s.x + (v.x - s.x) * e, y: s.y + (v.y - s.y) * e, z: s.z + (v.z - s.z) * e, o: s.o + (1 - s.o) * e };
      });
      prev.current = next; setDisp(next);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [lp, motion]);
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
  const cx0 = disp.length ? disp.reduce((s, v) => s + v.x, 0) / disp.length : 0;
  const cy0 = disp.length ? disp.reduce((s, v) => s + v.y, 0) / disp.length : 0;
  const poly = [...disp].sort((p, q) => Math.atan2(p.y - cy0, p.x - cx0) - Math.atan2(q.y - cy0, q.x - cx0));
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
    {lp.lines.map((L, i) => { const [x1, y1, x2, y2] = seg(L.a, L.b, L.c); return <g key={i} className="lp-line-g" style={{ animationDelay: `${i * 90}ms` }}><line x1={x1} y1={y1} x2={x2} y2={y2} className="lp-line"/><text x={x2 - 4} y={y2 - 6} className="lp-line-label">R{i + 1}</text></g>; })}
    {poly.length >= 3 && lp.status !== 'infeasible' && <polygon points={poly.map(v => `${sx(v.x)},${sy(v.y)}`).join(' ')} className="lp-poly"/>}
    <line x1={sx(cx0)} y1={sy(cy0)} x2={sx(ax)} y2={sy(ay)} className="lp-gradient" markerEnd="url(#lp-arrow)"/>
    <defs><marker id="lp-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" className="lp-arrow-head"/></marker></defs>
    {disp.map((v, i) => <g key={i} opacity={v.o} className={`lp-vertex ${i === lp.best ? 'best' : ''} ${state.active?.includes(i) ? 'active' : ''} ${action ? `a-${action}` : ''}`}>
      <circle cx={sx(v.x)} cy={sy(v.y)} r={i === lp.best ? 8 : 5.5}/>
      <text x={sx(v.x) + 10} y={sy(v.y) - 8} className="lp-vertex-label">({lp.verts[i]?.x ?? Math.round(v.x * 10) / 10}, {lp.verts[i]?.y ?? Math.round(v.y * 10) / 10})</text>
    </g>)}
    {disp.length > 0 && (() => { const v = disp[disp.length - 1]; return <g key={lp.verts.length} transform={`translate(${sx(v.x)},${sy(v.y)})`} className="lp-ripple"><circle r="8"/></g>; })()}
    {lp.status !== 'optimal' && <text x={W / 2} y={P} textAnchor="middle" className="lp-status">{lp.status === 'infeasible' ? 'Vô nghiệm' : 'Không giới nội'}</text>}
  </svg>;
}

function GraphView({ state }: { state: VisualState }) {
  const g = state.graph;
  if (!g || g.nodes.length === 0) return null;
  const W = 560, H = 420, P = 52;
  const xs = g.nodes.map(n => n.x), ys = g.nodes.map(n => n.y);
  let xmin = Math.min(...xs) - 1.2, xmax = Math.max(...xs) + 1.2, ymin = Math.min(...ys) - 1.2, ymax = Math.max(...ys) + 1.2;
  if (xmax - xmin < 4) { const m = (xmax + xmin) / 2; xmin = m - 2; xmax = m + 2; }
  if (ymax - ymin < 4) { const m = (ymax + ymin) / 2; ymin = m - 2; ymax = m + 2; }
  const sx = (x: number) => P + (x - xmin) / (xmax - xmin) * (W - 2 * P);
  const sy = (y: number) => H - P - (y - ymin) / (ymax - ymin) * (H - 2 * P);
  const at = (id: number): [number, number] => { const n = g.nodes.find(n => n.id === id)!; return [sx(n.x), sy(n.y)]; };
  const cur = state.active?.[0];
  const curEnds = cur !== undefined && g.edges[cur] ? [g.edges[cur].u, g.edges[cur].v] : [];
  const inTree = new Set(state.marked ?? []);
  return <svg className="graph-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Đồ thị vô hướng có trọng số">
    {g.edges.map((e, k) => {
      const [x1, y1] = at(e.u), [x2, y2] = at(e.v);
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const cls = e.status === 'chosen' ? 'chosen' : e.status === 'current' ? 'current' : e.status === 'skipped' ? 'skipped' : (state.path?.includes(k) ? 'chosen' : 'idle');
      return <g key={k} className={`g-edge ${cls} ${cur === k ? 'active' : ''}`}>
        <line x1={x1} y1={y1} x2={x2} y2={y2}/>
        <text x={mx} y={my - 7} className="g-weight">{e.w}</text>
      </g>;
    })}
    {g.nodes.map(n => {
      const [x, y] = at(n.id);
      const named = n.label !== String(n.id + 1);
      const hot = curEnds.includes(n.id);
      const tree = [...inTree].some(k => g.edges[k] && (g.edges[k].u === n.id || g.edges[k].v === n.id));
      return <g key={n.id} transform={`translate(${x},${y})`} className={`g-node ${hot ? 'active' : ''} ${tree ? 'in-tree' : ''}`}>
        <circle r="17"/><text textAnchor="middle" dominantBaseline="central" className="g-id">{n.id + 1}</text>
        {named && <text textAnchor="middle" y="32" className="g-name">{n.label}</text>}
      </g>;
    })}
  </svg>;
}

export function VisualStage({ algorithm, state, mode, motion, step, action, runKey, onFallback, playback, total, onSeek }: {
  algorithm: Algorithm; state: VisualState; mode: '2d' | '3d'; motion: boolean; step: number; action?: SimulationEvent['action']; runKey: string; onFallback: () => void;
  playback: ScenePlayback; total: number; onSeek: (index: number) => void;
}) {
  const isRecursive = algorithm.category === 'Quay lui';
  const depth = Number(state.variables?.viTri ?? state.variables?.soPhan ?? 0);
  // Thu/phóng sơ đồ 2D: co theo layout nên thanh cuộn cập nhật theo.
  const [zoom, setZoom] = useState(1);
  const bodyRef = useRef<HTMLDivElement>(null);
  const clampZoom = (v: number) => Math.min(2.5, Math.max(0.25, Math.round(v * 20) / 20));
  const fitToScreen = useCallback(() => {
    const el = bodyRef.current;
    if (!el?.parentElement) return;
    const natural = el.scrollWidth / (Number(el.style.zoom) || 1);
    const avail = el.parentElement.clientWidth;
    if (natural > 0 && avail > 0) setZoom(z => (natural > avail + 4 ? clampZoom(avail / natural) : z));
  }, []);
  useEffect(() => {
    setZoom(1);
    const raf = requestAnimationFrame(() => fitToScreen());
    return () => cancelAnimationFrame(raf);
  }, [algorithm.id, mode, state.grid?.[0]?.length, fitToScreen]);
  // Toàn màn hình kiểu player video: phủ kín panel, thêm thanh trượt tiến trình.
  const stageRef = useRef<HTMLDivElement>(null);
  const [fs, setFs] = useState(false);
  useEffect(() => {
    const sync = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  const toggleFs = useCallback(async () => {
    try {
      if (document.fullscreenElement) { await document.exitFullscreen(); return; }
      const panel = stageRef.current?.closest('.stage-panel') as HTMLElement | null;
      if (panel && document.fullscreenEnabled) { await panel.requestFullscreen(); return; }
      throw new Error('no fullscreen api');
    } catch {
      // Dự phòng khi trình duyệt chặn Fullscreen API: phủ kín bằng CSS.
      const panel = stageRef.current?.closest('.stage-panel');
      panel?.classList.toggle('fs-fallback');
      setFs(was => !was);
    }
  }, []);
  const caption = algorithm.category === 'Quay lui' ? (algorithm.kind === 'graph' ? 'QUAY LUI · ĐỒ THỊ' : `QUAY LUI · ${algorithm.kind === 'grid' ? 'BẢNG ĐIỀU KHIỂN' : 'MẢNG LỰA CHỌN'}`)
    : algorithm.category === 'Chia để trị' ? `CHIA ĐỂ TRỊ · ĐỆ QUY`
    : algorithm.category === 'Tối ưu' ? `TỐI ƯU · ĐỒ THỊ X–Y`
    : algorithm.category === 'Quy hoạch động' ? `QUY HOẠCH ĐỘNG · BẢNG DP`
    : algorithm.kind === 'tree' ? 'CÂY GỐC 1' : algorithm.kind === 'timeline' ? 'DỰ ÁN / THỜI GIAN' : algorithm.kind === 'grid' ? 'BẢNG TRẠNG THÁI' : algorithm.kind === 'string' ? 'PHÂN ĐOẠN' : 'CẤU TRÚC DỮ LIỆU';
  return <div ref={stageRef} className={`visual-stage visual-${algorithm.kind} ${mode === '3d' ? 'immersive-stage' : ''}`} data-testid="visual-stage" data-action={action}>
    <div className="stage-caption"><span>{caption}</span><span>{algorithm.complexity}</span></div>
    {mode === '3d' ? <Suspense fallback={<div className="scene-loading"><span className="loading-tiles"><i/><i/><i/></span>{vi.loadingScene}</div>}><Scene3D algorithm={algorithm} state={state} motion={motion} step={step} action={action} runKey={runKey} onFallback={onFallback} playback={playback} onFullscreen={toggleFs} isFs={fs}/></Suspense> : <div className="primary-visual">
    <div className="zoom-bar" role="group" aria-label="Thu phóng sơ đồ 2D">
      <button className="zoom-btn" onClick={() => setZoom(z => clampZoom(z - 0.25))} aria-label="Thu nhỏ sơ đồ" title="Thu nhỏ sơ đồ" disabled={zoom <= 0.25}><ZoomOut size={14}/></button>
      <button className="zoom-btn zoom-value" onClick={() => setZoom(1)} aria-label="Đặt lại cỡ sơ đồ" title="Đặt lại cỡ sơ đồ (100%)">{Math.round(zoom * 100)}%</button>
      <button className="zoom-btn" onClick={() => setZoom(z => clampZoom(z + 0.25))} aria-label="Phóng to sơ đồ" title="Phóng to sơ đồ" disabled={zoom >= 2.5}><ZoomIn size={14}/></button>
      <button className="zoom-btn" onClick={fitToScreen} aria-label="Vừa màn hình" title="Co sơ đồ vừa màn hình"><Maximize2 size={14}/></button>
      <button className="zoom-btn" onClick={toggleFs} aria-label={fs ? vi.exitFullscreen : vi.fullscreen} title={fs ? vi.exitFullscreen : vi.fullscreen}>{fs ? <Shrink size={14}/> : <Expand size={14}/>}</button>
    </div>
    <div className="zoom-body" ref={bodyRef} style={{ zoom }}>
      {state.edges ? <><Tree state={state} action={action}/>{state.grid && <div className="ancestor-table"><span className="data-label">cha[v][k]</span><Grid state={{ grid: state.grid, columnLabels: state.columnLabels, rowLabels: state.values?.map(String) }} action={action}/></div>}</>
        : state.intervals ? <><Timeline state={state} action={action}/><span className="data-label">tongTinChi</span><ArrayRow values={state.values ?? []} state={state} compact action={action}/></>
        : state.graph ? <GraphView state={state}/>
        : state.lp ? <LPView state={state} action={action} motion={motion}/>
        : algorithm.id === 'vach-thuoc' ? <RulerView state={state}/> : state.grid ? <Grid state={state} sudoku={algorithm.id === 'sudoku'} heatmap={algorithm.id === 'duong_di_an_toan' || algorithm.id === 'day-con-chung-dai-nhat'} action={action}/>
        : algorithm.category === 'Quy hoạch động' || algorithm.category === 'Cấu trúc dữ liệu'
          ? <BarRow values={state.values ?? []} labels={state.labels} state={state} action={action} label={algorithm.id === 'truyvantong' ? 'tongTichLuy' : algorithm.id === 'tiem_sach' ? 'giaTriMax' : algorithm.id === 'do_an' ? 'tongTinChi' : algorithm.id === 'daycontangdainhat' || algorithm.id === 'daicontangdainhat2' ? 'Giá trị' : undefined}/>
          : <ArrayRow values={state.values ?? []} labels={state.labels} state={state} action={action}/>}
    </div></div>}
    {state.secondary && (mode === '2d' || Boolean(state.grid) || Boolean(state.edges)) && <div className="secondary-visual"><span className="data-label">{state.secondaryLabel ?? 'Bảng phụ'}</span><ArrayRow values={state.secondary} state={{}} labels={algorithm.id === 'truyvantong' || algorithm.id === 'rut_bai_trung_thuong' ? state.secondary.map((_, i) => String(i)) : undefined} compact/></div>}
    {mode === '3d' && state.secondary && !state.grid && !state.edges && <span className="scene-data-label">{state.secondaryLabel}</span>}
    {mode === '3d' && state.edges && state.grid && <div className="ancestor-table"><span className="data-label">cha[v][k]</span><Grid state={{ grid: state.grid, columnLabels: state.columnLabels, rowLabels: state.values?.map(String) }}/></div>}
    {isRecursive && !state.grid && <div className="recursion-path"><span className="data-label">Độ sâu</span>{Array.from({ length: Math.min(depth + 1, 21) }, (_, i) => <span className={i === depth ? 'current' : ''} key={i}>{i}</span>)}</div>}
    {algorithm.id === 'tinh-diem-mon-hoc' && state.variables?.canDuoi !== undefined && <div className="bounds"><span>Cận khả thi</span><b>{state.variables.canDuoi} … {state.variables.canTren}</b><span>Mục tiêu</span><b>{state.variables.tongThapNhat} … {state.variables.tongCaoNhat}</b></div>}
    {state.result && <div className="result-banner" data-testid="result"><CheckCheck size={18}/><span>Kết quả</span><pre>{state.result}</pre></div>}
    {fs && <div className="fs-player" role="group" aria-label="Trình phát toàn màn hình">
      <button className="fs-btn" onClick={playback.toggle} disabled={!playback.canNext} aria-label={playback.playing ? vi.pause : vi.play} title={playback.playing ? vi.pause : vi.play}>{playback.playing ? <Pause size={17}/> : <Play size={17}/>}</button>
      <input className="fs-slider" aria-label={vi.seekVideo} type="range" min={0} max={Math.max(1, total)} value={step} disabled={!total} onChange={e => onSeek(Number(e.target.value))}/>
      <span className="fs-step">{step} / {total}</span>
      <button className="fs-btn" onClick={toggleFs} aria-label={vi.exitFullscreen} title={vi.exitFullscreen}><X size={17}/></button>
    </div>}
  </div>;
}
