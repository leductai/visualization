import type { Preset } from '../engine/types';

export const preset = (name: string, input: any, summary: string): Preset => ({ name, input, summary });

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
