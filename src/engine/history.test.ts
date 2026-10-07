import { afterEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { FALLBACK_LIMIT, History, type Frame } from './history';

const frame = (step: number, output = false): Frame => ({ state: { values: [step] }, outputCount: output ? 1 : 0,
  event: { action: output ? 'output' : 'update', explanation: 'test', statePatch: { values: [step], outputs: output ? ['1 2 3'] : undefined }, line: 1, cppLine: 1 } });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('history storage', () => {
  it('restores checkpoints, reads output windows, isolates runs and cleans up', async () => {
    vi.stubGlobal('indexedDB', new IDBFactory()); vi.stubGlobal('IDBKeyRange', IDBKeyRange);
    const a = new History(), b = new History(); await a.open(); await b.open();
    await a.put(1, frame(1)); await a.put(2, frame(2, true)); await b.put(1, frame(9));
    expect(await a.get(1)).toEqual(frame(1)); expect(await b.get(1)).toEqual(frame(9));
    expect(await a.getOutputs(0, 8)).toEqual([{ text: '1 2 3', step: 2 }]);
    expect(await a.getOutputs(1, 8)).toEqual([]);
    const run = a.run; await a.close();
    const db = await new Promise<IDBDatabase>(resolve => { const request = indexedDB.open('algo-studio-history', 2); request.onsuccess = () => resolve(request.result); });
    const old = await new Promise(resolve => { const request = db.transaction('frames').objectStore('frames').get([run, 1]); request.onsuccess = () => resolve(request.result); });
    expect(old).toBeUndefined(); db.close(); expect(await b.get(1)).toEqual(frame(9)); await b.close();
  });
  it('bounds the memory fallback, warns, and never evicts existing steps', async () => {
    vi.stubGlobal('indexedDB', undefined);
    const history = new History(); await history.open(); expect(history.warning).toContain('2.000');
    for (let i = 1; i <= FALLBACK_LIMIT; i++) await history.put(i, frame(i));
    await expect(history.put(FALLBACK_LIMIT + 1, frame(9))).rejects.toThrow('đầy');
    expect(await history.get(1)).toEqual(frame(1));
    const retrieved = (await history.get(1))!; retrieved.state.values![0] = 999;
    expect((await history.get(1))!.state.values).toEqual([1]); await history.close();
  });
  it('reports a failed transaction and preserves prior committed frames', async () => {
    vi.stubGlobal('indexedDB', new IDBFactory()); vi.stubGlobal('IDBKeyRange', IDBKeyRange);
    const history = new History(); await history.open(); await history.put(1, frame(1));
    const db = (history as unknown as { db: IDBDatabase }).db;
    const original = db.transaction.bind(db);
    const spy = vi.spyOn(db, 'transaction').mockImplementation((...args: Parameters<IDBDatabase['transaction']>) => {
      const tx = original(...args); queueMicrotask(() => tx.abort()); return tx;
    });
    await expect(history.put(2, frame(2))).rejects.toThrow('Không lưu được'); spy.mockRestore();
    expect(await history.get(1)).toEqual(frame(1)); expect(await history.get(2)).toBeUndefined(); await history.close();
  });
});
