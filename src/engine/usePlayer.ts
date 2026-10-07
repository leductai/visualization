import { useCallback, useEffect, useRef, useState } from 'react';
import type { Algorithm, Detail, SimulationEvent, VisualState, WorkerResponse } from './types';
import { History } from './history';

type ConsoleEntry = { explanation: string; step: number; action: SimulationEvent['action']; timestamp: number };

type Status = 'ready' | 'running' | 'paused' | 'complete' | 'stopped';
export function usePlayer(algorithm: Algorithm, preset: number, customInput: any | null = null) {
  const resolve = () => customInput ?? algorithm.presets[preset].input;
  const [state, setState] = useState<VisualState>(() => algorithm.initial(resolve()));
  const [event, setEvent] = useState<SimulationEvent>();
  const [playing, setPlaying] = useState(false), [status, setStatus] = useState<Status>('ready');
  const [step, setStep] = useState(0), [total, setTotal] = useState(0), [outputCount, setOutputCount] = useState(0);
  const [speed, setSpeed] = useState(2), [detail, setDetail] = useState<Detail>('easy');
  const [elapsed, setElapsed] = useState(0);
  const [warning, setWarning] = useState(''), [version, setVersion] = useState(0), [ready, setReady] = useState(false);
  const [consoleHistory, setConsoleHistory] = useState<ConsoleEntry[]>([]);
  const worker = useRef<Worker | null>(null), history = useRef<History | null>(null);
  const busy = useRef(false), position = useRef(0), length = useRef(0), outputLength = useRef(0);
  const loggedUpTo = useRef(0);
  const current = useRef(state), finished = useRef(false), cancelled = useRef(false), generation = useRef(0);
  const pendingSeek = useRef<number | null>(null);
  const prefetching = useRef(false);
  const detailRef = useRef(detail); detailRef.current = detail;

  const logEvent = useCallback((action: SimulationEvent['action'], explanation: string, index: number) => {
    if (index <= loggedUpTo.current) return;
    loggedUpTo.current = index;
    setConsoleHistory(prev => [...prev, { explanation, step: index, action, timestamp: Date.now() }]);
  }, []);

  const applyFrame = useCallback((next: VisualState, nextEvent: SimulationEvent | undefined, index: number, outputs: number) => {
    current.current = next; position.current = index;
    setState(next); setEvent(nextEvent); setStep(index); setOutputCount(outputs);
  }, []);

  useEffect(() => {
    const token = ++generation.current, h = new History(); history.current = h;
    const input = resolve(), initial = algorithm.initial(input);
    applyFrame(initial, undefined, 0, 0); length.current = 0; outputLength.current = 0;
    finished.current = false; cancelled.current = false; busy.current = true; pendingSeek.current = null;
    setPlaying(false); setStatus('ready'); setTotal(0); setWarning(''); setReady(false); setElapsed(0);
    setConsoleHistory([]); loggedUpTo.current = 0;
    const fail = (message: string) => {
      if (token !== generation.current) return;
      setWarning(message); setPlaying(false); setStatus('stopped'); cancelled.current = true;
      worker.current?.terminate(); busy.current = false; prefetching.current = false; setReady(true);
    };
    const validation = algorithm.validate(input);
    if (validation) { fail(validation); return () => { ++generation.current; void h.close(); }; }
    let w: Worker;
    try { w = new Worker(new URL('../worker/simulation.worker.ts', import.meta.url), { type: 'module' }); }
    catch (error) { fail(String(error)); return () => { ++generation.current; void h.close(); }; }
    worker.current = w;
    w.postMessage({ type: 'init', id: algorithm.id, input, detail: detailRef.current });
    void h.open().then(() => {
      if (token === generation.current && !cancelled.current) { setWarning(h.warning); busy.current = false; setReady(true); }
    });
    w.onerror = e => fail(e.message || 'Worker không thể tiếp tục.');
    w.onmessage = async ({ data }: MessageEvent<WorkerResponse>) => {
      if (token !== generation.current || cancelled.current) return;
      if (data.type === 'error') { fail(data.message); return; }
      try {
        if (prefetching.current) {
          prefetching.current = false;
          // Fast-forward: persist every remaining frame but do not render them.
          for (const e of data.events) {
            const next = { ...current.current, ...e.statePatch };
            delete next.outputs;
            const outputs = outputLength.current + (e.action === 'output' ? 1 : 0), index = length.current + 1;
            await h.put(index, { event: e, state: next, outputCount: outputs });
            if (token !== generation.current || cancelled.current) return;
            length.current = index; outputLength.current = outputs;
          }
          finished.current = data.done; setStatus('running');
          applyFrame(algorithm.initial(resolve()), undefined, 0, 0);
          setTotal(length.current);
          busy.current = false; setReady(true);
          return;
        }
        for (const e of data.events) {
          const next = { ...current.current, ...e.statePatch };
          // Output records live in IndexedDB, only the current visual state is retained in React.
          delete next.outputs;
          const outputs = outputLength.current + (e.action === 'output' ? 1 : 0), index = length.current + 1;
          await h.put(index, { event: e, state: next, outputCount: outputs });
          if (token !== generation.current || cancelled.current) return;
          length.current = index; outputLength.current = outputs;
          applyFrame(next, e, index, outputs); setTotal(index);
          if (e.action === 'complete') { finished.current = true; setPlaying(false); setStatus('complete'); }
          logEvent(e.action, e.explanation, index);
        }
        if (data.done) { finished.current = true; setPlaying(false); setStatus('complete'); }
      } catch (error) { fail(error instanceof Error ? error.message : String(error)); }
      if (token === generation.current) busy.current = false;
    };
    return () => { ++generation.current; w.terminate(); void h.close().catch(() => undefined); };
  }, [algorithm, preset, customInput, version, applyFrame, logEvent]);

  const seek = useCallback(async (index: number) => {
    if (index < 0 || index > length.current) return;
    setPlaying(false);
    if (busy.current) { pendingSeek.current = index; return; }
    pendingSeek.current = null; busy.current = true; const token = generation.current;
    try {
      const frame = index ? await history.current?.get(index) : undefined;
      if (token !== generation.current) return;
      if (index && !frame) throw new Error('Không tìm thấy bước trong lịch sử.');
      applyFrame(frame?.state ?? algorithm.initial(resolve()), frame?.event, index, frame?.outputCount ?? 0);
      if (frame?.event) logEvent(frame.event.action, frame.event.explanation, index);
      setStatus(cancelled.current ? 'stopped' : finished.current && index === length.current ? 'complete' : 'paused');
    } catch (error) { if (token === generation.current) setWarning(String(error)); }
    finally { if (token === generation.current) busy.current = false; }
  }, [algorithm, preset, applyFrame, logEvent]);

  useEffect(() => {
    if (!busy.current && pendingSeek.current !== null) void seek(pendingSeek.current);
  }, [state, step, total, ready, playing, seek]);

  const next = useCallback(async () => {
    if (busy.current) return;
    if (position.current < length.current) {
      busy.current = true; const token = generation.current;
      try {
        const frame = await history.current?.get(position.current + 1);
        if (token !== generation.current) return;
        if (!frame) throw new Error('Không tìm thấy bước tiếp theo.');
        applyFrame(frame.state, frame.event, position.current + 1, frame.outputCount);
        if (frame.event) logEvent(frame.event.action, frame.event.explanation, position.current + 1);
        if (position.current === length.current && finished.current) { setPlaying(false); setStatus('complete'); }
      } catch (error) { if (token === generation.current) { setWarning(String(error)); setPlaying(false); } }
      finally { if (token === generation.current) busy.current = false; }
    } else if (!finished.current && !cancelled.current) {
      busy.current = true;
      worker.current?.postMessage({ type: 'next', count: 1, detail: detailRef.current });
      setStatus(currentStatus => currentStatus === 'running' ? 'running' : 'paused');
    } else { setPlaying(false); setStatus(cancelled.current ? 'stopped' : 'complete'); }
  }, [applyFrame, logEvent]);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => void next(), 1000 / speed);
    return () => clearInterval(timer);
  }, [playing, speed, next]);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const timer = setInterval(() => { const now = performance.now(); setElapsed(value => value + now - last); last = now; }, 250);
    return () => clearInterval(timer);
  }, [playing]);

  const canNext = ready && (step < total || (!finished.current && !cancelled.current));
  return { state, event, playing, status, step, total, outputCount, elapsed, speed, setSpeed, detail,
    setDetail: (value: Detail) => { if (!playing) setDetail(value); }, warning, ready, canNext, next, seek,
    readOutputs: useCallback((offset: number, count: number) => history.current?.getOutputs(offset, count) ?? Promise.resolve([]), []),
    consoleHistory,
    runKey: `${algorithm.id}:${preset}:${version}:${customInput ? 'custom' : ''}`,
    reset: () => setVersion(v => v + 1),
    toggle: () => {
      if (!canNext) return;
      if (!finished.current && length.current === 0 && !prefetching.current && !cancelled.current) {
        prefetching.current = true; busy.current = true; setStatus('running');
        worker.current?.postMessage({ type: 'prefetch', detail: detailRef.current });
        setPlaying(true);
      } else {
        setPlaying(v => !v); setStatus(playing ? 'paused' : 'running');
      }
    },
    stop: () => { cancelled.current = true; worker.current?.terminate(); busy.current = false; setReady(true); setPlaying(false); setStatus('stopped'); },
  };
}
