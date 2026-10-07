import { useEffect, useRef, useState } from 'react';
import { Activity, BookOpen, Box, ChevronRight, CircleStop, Gauge, Grid2X2, Layers3, Menu, Pause, Play, RotateCcw, Search, SkipBack, SkipForward, Sparkles, X } from 'lucide-react';
import { algorithms, findAlgorithm } from './algorithms/registry';
import { usePlayer } from './engine/usePlayer';
import { vi } from './i18n/vi';
import { VisualStage } from './components/VisualStage';
import { OutputPanel } from './components/OutputPanel';
import { useMotion } from './components/useMotion';
import type { Algorithm } from './engine/types';
import './styles.css';
import './motion.css';

function Sidebar({ selected, select, close }: { selected: Algorithm; select: (a: Algorithm) => void; close: () => void }) {
  const [search, setSearch] = useState('');
  const groups = [...new Set(algorithms.map(a => a.category))];
  const normalized = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('đ', 'd');
  const matches = algorithms.filter(a => normalized(`${a.title} ${a.tags.join(' ')}`).includes(normalized(search)));
  return <aside className="sidebar"><div className="brand"><div className="brand-mark"><Activity size={24}/></div><div><strong>{vi.brand}</strong><small>{vi.tagline}</small></div><button className="icon-button close-nav" onClick={close} title="Đóng thư viện" aria-label="Đóng thư viện"><X size={18}/></button></div>
    <label className="search"><Search size={16}/><input aria-label="Tìm thuật toán" placeholder="Tìm thuật toán…" value={search} onChange={e => setSearch(e.target.value)}/></label>
    <div className="side-label">{vi.library}<span>{algorithms.length}</span></div>
    <nav aria-label="Thư viện thuật toán">{groups.map(group => <section key={group}><div className="group-title">{group}<span>{matches.filter(a => a.category === group).length}</span></div>{matches.filter(a => a.category === group).map(a => <button className={`nav-item ${a.id === selected.id ? 'selected' : ''}`} aria-current={a.id === selected.id ? 'page' : undefined} onClick={() => select(a)} key={a.id}><span className="nav-index">{String(algorithms.indexOf(a) + 1).padStart(2, '0')}</span><span>{a.title}</span>{a.id === selected.id && <ChevronRight size={14}/>}</button>)}</section>)}</nav>
    {!matches.length && <p className="search-empty">Không tìm thấy thuật toán</p>}
    <div className="sidebar-footer"><span className="system-dot"/> 16 bài toán · C++ → mô phỏng</div>
  </aside>;
}

function CodePanel({ algorithm, line, cppLine }: { algorithm: Algorithm; line?: number; cppLine?: number }) {
  const [tab, setTab] = useState<'cpp' | 'pseudo'>('pseudo');
  const code = useRef<HTMLPreElement>(null), selectedLine = tab === 'cpp' ? cppLine : line;
  const lines = tab === 'cpp' ? algorithm.source.replaceAll('\r', '').trimEnd().split('\n') : algorithm.pseudocode;
  useEffect(() => {
    const active = code.current?.querySelector<HTMLElement>('.highlight');
    if (active && code.current) {
      const top = active.getBoundingClientRect().top - code.current.getBoundingClientRect().top + code.current.scrollTop;
      if (top < code.current.scrollTop || top + active.offsetHeight > code.current.scrollTop + code.current.clientHeight) code.current.scrollTop = Math.max(0, top - code.current.clientHeight / 3);
    }
  }, [selectedLine, tab]);
  return <section className="code-panel"><div className="panel-heading"><span><BookOpen size={16}/> {vi.code}</span><span className="line-indicator">{selectedLine ? `Dòng ${selectedLine}` : '—'}</span></div>
    <div className="code-tabs" role="tablist" aria-label="Ngôn ngữ mã"><button role="tab" aria-selected={tab === 'pseudo'} className={tab === 'pseudo' ? 'on' : ''} onClick={() => setTab('pseudo')}>Giả mã</button><button role="tab" aria-selected={tab === 'cpp'} className={tab === 'cpp' ? 'on' : ''} onClick={() => setTab('cpp')}>C++ gốc</button><span>{tab === 'cpp' ? `${lines.length} dòng` : 'Tiếng Việt'}</span></div>
    <pre className="code" ref={code} role="tabpanel" aria-label={tab === 'cpp' ? 'Mã C++' : 'Giả mã'}>{lines.map((text, i) => <code className={selectedLine === i + 1 ? 'highlight' : ''} key={i} aria-current={selectedLine === i + 1 ? 'step' : undefined}><em>{String(i + 1).padStart(2, '0')}</em><span>{text || ' '}</span></code>)}</pre>
  </section>;
}

export default function App() {
  const [algorithm, setAlgorithm] = useState(() => findAlgorithm(window.location.hash.slice(1)));
  const [preset, setPreset] = useState(0), [navOpen, setNavOpen] = useState(false);
  const [mode, setMode] = useState<'2d' | '3d'>(() => { try { return localStorage.getItem('algo-view') === '2d' ? '2d' : '3d'; } catch { return '3d'; } });
  const [graphicsWarning, setGraphicsWarning] = useState('');
  const { motion, reduced, toggleMotion } = useMotion();
  const changeMode = (value: '2d' | '3d') => { setMode(value); setGraphicsWarning(''); try { localStorage.setItem('algo-view', value); } catch { /* The view still works without persistent preferences. */ } };
  const graphicsFallback = () => { setMode('2d'); setGraphicsWarning(vi.graphicsFallback); };
  const player = usePlayer(algorithm, preset);
  const choose = (next: Algorithm) => { setAlgorithm(next); setPreset(0); setNavOpen(false); window.location.hash = next.id; };
  useEffect(() => {
    const onHash = () => { const next = findAlgorithm(window.location.hash.slice(1)); setAlgorithm(current => { if (current.id !== next.id) setPreset(0); return next; }); };
    window.addEventListener('hashchange', onHash); return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const status = vi[player.status];
  return <div className={`app ${navOpen ? 'nav-open' : ''} ${motion ? 'motion-on' : 'motion-off'}`}>
    {navOpen && <button className="nav-backdrop" aria-label="Đóng thư viện" onClick={() => setNavOpen(false)}/>}
    <Sidebar selected={algorithm} select={choose} close={() => setNavOpen(false)}/>
    <main className="main"><header className="topbar"><button className="icon-button open-nav" onClick={() => setNavOpen(true)} title="Thư viện thuật toán" aria-label="Thư viện thuật toán"><Menu size={20}/></button><div><div className="eyebrow">PHÒNG THÍ NGHIỆM / {algorithm.category.toUpperCase()}</div><h1>{algorithm.title}</h1></div><div className="top-actions"><span className="system-dot"/> Cục bộ</div><button className={`icon-button motion-toggle ${motion ? 'on' : ''}`} aria-pressed={motion} disabled={reduced} onClick={toggleMotion} aria-label={reduced ? vi.reducedMotion : motion ? vi.disableMotion : vi.enableMotion} title={reduced ? vi.reducedMotion : motion ? vi.disableMotion : vi.enableMotion} data-tooltip={reduced ? vi.reducedMotion : motion ? vi.disableMotion : vi.enableMotion}><Sparkles size={17}/></button></header>
      <div className="content"><section className="intro" key={algorithm.id}><div><p className="kicker">BÀI TOÁN {String(algorithms.indexOf(algorithm) + 1).padStart(2, '0')} / 16</p><h2>{algorithm.description}</h2><p className="goal">{algorithm.goal}</p><div className="tags">{algorithm.tags.map(tag => <span key={tag}>{tag}</span>)}<span className="complexity">{algorithm.complexity}</span></div></div>
        <div className="preset-box"><label htmlFor="preset">ĐẦU VÀO MẪU</label><select id="preset" value={preset} onChange={e => setPreset(Number(e.target.value))}>{algorithm.presets.map((p, i) => <option value={i} key={p.name}>{p.name}</option>)}</select><small>{algorithm.presets[preset].summary}</small></div>
      </section>
      <details className="input-detail"><summary>Dữ liệu đầu vào</summary><p>{algorithm.inputFormat}</p><pre>{JSON.stringify(algorithm.presets[preset].input, null, 2)}</pre></details>
      {algorithm.note && <p className="algorithm-note">{algorithm.note}</p>}
      <section className={`workspace ${mode === '3d' ? 'workspace-3d' : ''}`}><section className={`stage-panel ${mode === '3d' ? 'stage-3d' : ''}`}><div className="panel-heading"><span><Layers3 size={16}/> {vi.stage}</span><div className="view-switch" role="group" aria-label={vi.viewMode}><button aria-label={vi.view2d} title={vi.view2d} data-tooltip={vi.view2d} aria-pressed={mode === '2d'} onClick={() => changeMode('2d')}><Grid2X2 size={15}/></button><button aria-label={vi.view3d} title={vi.view3d} data-tooltip={vi.view3d} aria-pressed={mode === '3d'} onClick={() => changeMode('3d')}><Box size={16}/></button></div><span className={`status status-${player.status}`}><i/>{status}</span></div><VisualStage algorithm={algorithm} state={player.state} mode={mode} motion={motion} step={player.step} action={player.event?.action} runKey={player.runKey} onFallback={graphicsFallback} playback={player}/><div className="stage-footer"><div className="legend"><span className="legend-active">Đang xét</span><span className="legend-marked">Liên quan</span></div><div className="segmented" role="group" aria-label="Mức độ chi tiết"><button disabled={player.playing} aria-pressed={player.detail === 'easy'} className={player.detail === 'easy' ? 'on' : ''} onClick={() => player.setDetail('easy')}>{vi.easy}</button><button disabled={player.playing} aria-pressed={player.detail === 'detailed'} className={player.detail === 'detailed' ? 'on' : ''} onClick={() => player.setDetail('detailed')}>{vi.detailed}</button></div></div></section>
        <CodePanel algorithm={algorithm} line={player.event?.line} cppLine={player.event?.cppLine}/>
      </section>
      <section className="console"><div className="panel-heading"><span><span className="console-icon">›_</span> {vi.console}</span><span className="step-count">BƯỚC {player.step.toLocaleString('vi-VN')} / {player.total.toLocaleString('vi-VN')}</span></div><div className="console-body" key={`${player.runKey}:${player.step}`}><span className={`action-pill action-${player.event?.action ?? 'update'}`}>{player.event ? vi.actions[player.event.action] : 'Sẵn sàng'}</span><p aria-live="polite">{player.event?.explanation ?? algorithm.presets[preset].summary}</p></div>
        {player.state.variables && <div className="variables">{Object.entries(player.state.variables).map(([key, value]) => <span key={key}><b>{key}</b><code>{String(value)}</code></span>)}</div>}
      </section>
      <div className="timeline-controls"><button className="icon-button" disabled={!player.step} onClick={() => void player.seek(player.step - 1)} aria-label="Bước trước" title="Bước trước"><SkipBack size={17}/></button><input aria-label="Lịch sử thực thi" type="range" min={0} max={Math.max(1, player.total)} value={player.step} disabled={!player.total} onChange={e => void player.seek(Number(e.target.value))}/><span>{player.step} / {player.total}</span></div>
      <footer className="controls"><div className="playback-buttons"><button className="icon-button" onClick={player.reset} title={vi.reset} aria-label={vi.reset}><RotateCcw size={18}/></button><button className="icon-button" onClick={player.stop} title={vi.stop} aria-label={vi.stop} disabled={player.status === 'stopped'}><CircleStop size={18}/></button><button className="step-button" disabled={!player.canNext || player.playing} onClick={() => void player.next()}><SkipForward size={17}/><span>{vi.next}</span></button><button className="play-button" disabled={!player.canNext} onClick={player.toggle}>{player.playing ? <Pause size={17}/> : <Play size={17}/>}<span>{player.playing ? vi.pause : vi.play}</span></button></div><label className="speed"><Gauge size={16}/><span>Tốc độ</span><input aria-label="Tốc độ" type="range" min="0.5" max="16" step="0.5" value={player.speed} onChange={e => player.setSpeed(Number(e.target.value))}/><b>{player.speed}×</b></label></footer>
      {player.warning && <div className="warning" role="alert">{player.warning}</div>}
      {graphicsWarning && <div className="warning" role="alert">{graphicsWarning}</div>}
      <OutputPanel count={player.outputCount} runKey={player.runKey} read={player.readOutputs} seek={player.seek}/>
      <div className="page-footer"><span>{vi.brand}</span><span>Thời gian chạy: {(player.elapsed / 1000).toFixed(1)}s · {algorithm.complexity}</span></div>
    </div></main>
  </div>;
}
