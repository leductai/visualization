import { findAlgorithm } from '../algorithms/registry';
import type { WorkerCommand, WorkerResponse } from '../engine/types';
import { SimulationRunner } from './runner';
let runner: SimulationRunner | undefined;
let busy = false;
self.onmessage = async ({ data }: MessageEvent<WorkerCommand>) => {
  try {
    if (data.type === 'init') {
      const algorithm = findAlgorithm(data.id);
      const error = algorithm.validate(data.input);
      if (error) throw new Error(error);
      runner = new SimulationRunner(algorithm.simulate(data.input));
      return;
    }
    if (busy || !runner) return;
    busy = true;
    self.postMessage(data.type === 'prefetch' ? runner.nextAll(data.detail) : runner.next(data.count, data.detail) satisfies WorkerResponse);
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) } satisfies WorkerResponse);
  } finally { busy = false; }
};
