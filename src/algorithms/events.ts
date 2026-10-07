import type { SimulationEvent, VisualState } from '../engine/types';

export function sourceLine(source: string, fragment: string): number {
  const index = source.split('\n').findIndex(line => line.includes(fragment));
  if (index < 0) throw new Error(`Không tìm thấy dòng C++: ${fragment}`);
  return index + 1;
}

export function emitter(source: string) {
  return (action: SimulationEvent['action'], explanation: string, state: VisualState,
    line: number, fragment: string, depth = 0, detail = action === 'check'): SimulationEvent => ({
    action, explanation, statePatch: structuredClone(state), line,
    cppLine: sourceLine(source, fragment), depth, detail,
  });
}
