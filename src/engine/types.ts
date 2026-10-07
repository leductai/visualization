export type Detail = 'easy' | 'detailed';
export type Cell = string | number | boolean;
export interface VisualState { values?: Cell[]; secondary?: Cell[]; secondaryLabel?: string; grid?: Cell[][]; active?: number[]; marked?: number[]; path?: number[]; variables?: Record<string, Cell>; result?: string; labels?: string[]; rowLabels?: string[]; columnLabels?: string[]; edges?: number[][]; outputs?: string[]; intervals?: { start: number; end: number; value: number }[]; }
export interface SimulationEvent { action: 'check' | 'accept' | 'reject' | 'update' | 'undo' | 'output' | 'complete'; explanation: string; statePatch: VisualState; line: number; cppLine: number; depth?: number; detail?: boolean; }
export interface Preset { name: string; input: any; summary: string; }
export interface Algorithm { id: string; title: string; category: 'Quay lui' | 'Quy hoạch động' | 'Cấu trúc dữ liệu'; tags: string[]; complexity: string; description: string; goal: string; inputFormat: string; note?: string; source: string; pseudocode: string[]; presets: Preset[]; kind: 'grid' | 'array' | 'tree' | 'string' | 'timeline'; validate(input: any): string | null; initial(input: any): VisualState; simulate(input: any): Generator<SimulationEvent>; }
export type WorkerCommand = { type: 'init'; id: string; input: any; detail: Detail } | { type: 'next'; count: number; detail: Detail };
export type WorkerResponse = { type: 'batch'; events: SimulationEvent[]; done: boolean } | { type: 'error'; message: string };
