import type { Detail, SimulationEvent } from '../engine/types';

export class SimulationRunner {
  constructor(private iterator: Generator<SimulationEvent>) {}
  next(count: number, detail: Detail) {
    if (!Number.isInteger(count) || count < 1 || count > 64) throw new Error('Kích thước đợt sự kiện không hợp lệ.');
    const events: SimulationEvent[] = [];
    let done = false;
    while (events.length < count) {
      const event = this.iterator.next();
      if (event.done) { done = true; break; }
      if (detail === 'detailed' || !event.value.detail) events.push(event.value);
      if (event.value.action === 'complete') { done = true; break; }
    }
    return { type: 'batch' as const, events, done };
  }
  nextAll(detail: Detail) {
    const events: SimulationEvent[] = [];
    let done = false;
    while (!done) {
      const res = this.next(64, detail);
      events.push(...res.events);
      done = res.done;
    }
    return { type: 'batch' as const, events, done: true };
  }
}
