import { useEffect, useRef, useState } from 'react';
import { Expand, Focus, Minus, Pause, Play, Plus, Rotate3d, Shrink, SkipForward } from 'lucide-react';
import type { Algorithm, SimulationEvent, VisualState } from '../engine/types';
import { buildSceneModel } from './scene/model';
import { createScene } from './scene/renderer';
import { vi } from '../i18n/vi';

export interface ScenePlayback { canNext: boolean; playing: boolean; next: () => Promise<void>; toggle: () => void; }

export default function Scene3D({ algorithm, state, action, step, runKey, motion, onFallback, playback, onFullscreen, isFs }: {
  algorithm: Algorithm; state: VisualState; action?: SimulationEvent['action']; step: number; runKey: string; motion: boolean; onFallback: () => void;
  playback: ScenePlayback; onFullscreen: () => void; isFs: boolean;
}) {
  const host = useRef<HTMLDivElement>(null), scene = useRef<ReturnType<typeof createScene> | null>(null);
  const latest = useRef({ algorithm, state, action }); latest.current = { algorithm, state, action };
  const fallback = useRef(onFallback); fallback.current = onFallback;
  const [hover, setHover] = useState(''), [spinning, setSpinning] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const current = latest.current;
    try {
      scene.current = createScene(host.current, buildSceneModel(current.algorithm, current.state, current.action), !motion, setHover, () => fallback.current());
    } catch { fallback.current(); return; }
    setSpinning(false); setHover('');
    return () => { scene.current?.dispose(); scene.current = null; };
  }, [algorithm.id, runKey, motion]);
  useEffect(() => { scene.current?.update(buildSceneModel(algorithm, state, action), true, step); }, [algorithm, state, action, step]);
  return <div className="scene-3d" data-testid="scene-3d">
    <div className="scene-host" ref={host}/>
    <div className="scene-tools" role="group" aria-label={vi.cameraControls}>
      <button className="icon-button" aria-label={vi.resetCamera} title={vi.resetCamera} data-tooltip={vi.resetCamera} onClick={() => scene.current?.reset()}><Focus size={16}/></button>
      <button className="icon-button" aria-label={vi.zoomIn} title={vi.zoomIn} data-tooltip={vi.zoomIn} onClick={() => scene.current?.zoom(1.2)}><Plus size={16}/></button>
      <button className="icon-button" aria-label={vi.zoomOut} title={vi.zoomOut} data-tooltip={vi.zoomOut} onClick={() => scene.current?.zoom(1 / 1.2)}><Minus size={16}/></button>
      <button className={`icon-button ${spinning ? 'on' : ''}`} disabled={!motion} aria-pressed={spinning} aria-label={vi.rotateScene} title={vi.rotateScene} data-tooltip={vi.rotateScene} onClick={() => { scene.current?.spin(!spinning); setSpinning(!spinning); }}><Rotate3d size={16}/></button>
      <button className="icon-button" aria-label={isFs ? vi.exitFullscreen : vi.fullscreen} title={isFs ? vi.exitFullscreen : vi.fullscreen} data-tooltip={isFs ? vi.exitFullscreen : vi.fullscreen} onClick={onFullscreen}>{isFs ? <Shrink size={16}/> : <Expand size={16}/>}</button>
    </div>
    {hover && <div className="scene-inspect">{hover}</div>}
    <div className={`scene-step scene-step-${action ?? 'ready'}`} key={step}><span/>{action ? vi.actions[action] : vi.sceneReady}<small>{vi.step} {step}</small></div>
    <div className="scene-playback" role="group" aria-label={vi.scenePlayback}>
      <button className="icon-button" aria-label={vi.sceneNext} title={vi.sceneNext} disabled={!playback.canNext || playback.playing} onClick={() => void playback.next()}><SkipForward size={16}/></button>
      <button className="icon-button scene-play" aria-label={playback.playing ? vi.scenePause : vi.scenePlay} title={playback.playing ? vi.scenePause : vi.scenePlay} disabled={!playback.canNext} onClick={playback.toggle}>{playback.playing ? <Pause size={16}/> : <Play size={16}/>}</button>
    </div>
    <ol className="sr-only" aria-label={vi.sceneData}>{buildSceneModel(algorithm, state, action).nodes.map(node => <li key={node.key}>{node.caption}</li>)}</ol>
  </div>;
}
