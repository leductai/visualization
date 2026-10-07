import type { Preset } from '../engine/types';

export const preset = (name: string, input: any, summary: string): Preset => ({ name, input, summary });

export const tokens = (raw: string) => raw.trim().split(/\s+/).filter(Boolean);
export const lines = (raw: string) => raw.replace(/\r/g, '').split('\n').map(l => l.trimEnd());
export const need = (cond: boolean, message: string): void => { if (!cond) throw new Error(message); };

export const ri = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
export const pick = <T>(items: readonly T[]): T => items[ri(0, items.length - 1)];
export const randomDigits = (length: number, from = 1, to = 9) =>
  Array.from({ length }, () => String(ri(from, to))).join('');
export const randomLetters = (length: number, alphabet = 'ABC') =>
  Array.from({ length }, () => pick([...alphabet])).join('');
/** Phân hoạch 100 thành n phần dương (hệ số môn học). */
export const randomWeights = (n: number) => {
  const weights = Array(n).fill(1);
  for (let rest = 100 - n; rest > 0; rest--) weights[ri(0, n - 1)]++;
  return weights;
};

export const safeArray = (values: any, allowEmpty = true) =>
  Array.isArray(values) && (allowEmpty || values.length > 0) && values.length <= 200000 &&
  values.every((x: any) => Number.isSafeInteger(x) && Math.abs(x) <= 1e9);

export const sequenceValidation = (i: any) =>
  safeArray(i?.values) ? null : 'Cần dãy số nguyên an toàn, tối đa 200.000 phần tử.';

export function validateTree(i: any): string | null {
  if (!Number.isInteger(i?.n) || i.n < 1 || i.n > 200000 || !Array.isArray(i.edges) || i.edges.length !== i.n - 1 || !Array.isArray(i.queries)) return 'Cần cây n đỉnh với n−1 cạnh.';
  const pair = (p: any) => Array.isArray(p) && p.length === 2 && p.every((x: any) => Number.isInteger(x) && x >= 1 && x <= i.n);
  if (!i.edges.every(pair) || !i.queries.every(pair)) return 'Đỉnh phải thuộc 1..n.';
  const adjacency: number[][] = Array.from({ length: i.n + 1 }, () => []);
  for (const [a, b] of i.edges) { adjacency[a].push(b); adjacency[b].push(a); }
  const visited = new Set<number>([1]), stack = [1];
  while (stack.length) for (const v of adjacency[stack.pop()!]) if (!visited.has(v)) { visited.add(v); stack.push(v); }
  return visited.size === i.n ? null : 'Các cạnh phải tạo thành cây liên thông.';
}
