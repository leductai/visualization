import type { SimulationEvent, VisualState } from './types';

export interface Frame { event: SimulationEvent; state: VisualState; outputCount: number; }
export interface OutputRecord { text: string; step: number; }
export const FALLBACK_LIMIT = 2000;

export class History {
  private db?: IDBDatabase;
  private memory = new Map<number, Frame>();
  private outputs = new Map<number, OutputRecord>();
  private closed = false;
  readonly run = crypto.randomUUID();
  warning = '';

  async open() {
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('algo-studio-history', 2);
        request.onupgradeneeded = () => {
          for (const name of ['frames', 'outputs']) if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('IndexedDB blocked'));
      });
      if (this.closed) db.close();
      else { this.db = db; db.onversionchange = () => db.close(); }
    } catch {
      this.warning = 'Không mở được IndexedDB. Lịch sử tạm chứa tối đa 2.000 bước; mô phỏng sẽ dừng khi bộ nhớ đầy.';
    }
  }

  async put(index: number, frame: Frame) {
    return this.putMany([{ index, frame }]);
  }

  /** Ghi gộp cả đợt trong MỘT transaction thay vì một transaction mỗi bước. */
  async putMany(entries: { index: number; frame: Frame }[]) {
    if (this.closed) throw new Error('Lịch sử đã đóng.');
    if (!this.db) {
      for (const { index, frame } of entries) {
        if (this.memory.size >= FALLBACK_LIMIT && !this.memory.has(index)) throw new Error('Bộ nhớ lịch sử đã đầy. Đã dừng và giữ nguyên các bước đã xem.');
        this.memory.set(index, structuredClone(frame));
        if (frame.event.action === 'output') this.outputs.set(frame.outputCount, { text: (frame.event.statePatch.outputs ?? []).join('\n'), step: index });
      }
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(['frames', 'outputs'], 'readwrite');
      for (const { index, frame } of entries) {
        tx.objectStore('frames').put(frame, [this.run, index]);
        if (frame.event.action === 'output') tx.objectStore('outputs').put({ text: (frame.event.statePatch.outputs ?? []).join('\n'), step: index }, [this.run, frame.outputCount]);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = tx.onabort = () => reject(new Error('Không lưu được lịch sử, có thể bộ nhớ trình duyệt đã đầy. Đã dừng và giữ nguyên lịch sử.'));
    });
  }

  async get(index: number): Promise<Frame | undefined> {
    if (!this.db) return structuredClone(this.memory.get(index));
    return new Promise((resolve, reject) => {
      const request = this.db!.transaction('frames').objectStore('frames').get([this.run, index]);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getOutputs(offset: number, count: number): Promise<OutputRecord[]> {
    if (!this.db) return Array.from({ length: count }, (_, i) => this.outputs.get(offset + i + 1)).filter((x): x is OutputRecord => Boolean(x));
    return new Promise((resolve, reject) => {
      const range = IDBKeyRange.bound([this.run, offset + 1], [this.run, offset + count]);
      const request = this.db!.transaction('outputs').objectStore('outputs').getAll(range, count);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async close() {
    this.closed = true; this.memory.clear(); this.outputs.clear();
    const db = this.db; this.db = undefined;
    if (!db) return;
    // A run owns its stored history. Release it on reset/unmount, never during playback.
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['frames', 'outputs'], 'readwrite');
        const range = IDBKeyRange.bound([this.run, 0], [this.run, Number.MAX_SAFE_INTEGER]);
        for (const name of ['frames', 'outputs']) tx.objectStore(name).delete(range);
        tx.oncomplete = () => resolve(); tx.onerror = tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
  }
}
