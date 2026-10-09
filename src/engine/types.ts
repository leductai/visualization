export type Detail = 'easy' | 'detailed';
export type Cell = string | number | boolean;
export interface LPLine { a: number; b: number; c: number; raw: string; }
export interface LPVertex { x: number; y: number; z: number; }
export interface LPState { cx: number; cy: number; sense: 'max' | 'min'; lines: LPLine[]; verts: LPVertex[]; best: number; xmin: number; xmax: number; ymin: number; ymax: number; status: 'optimal' | 'infeasible' | 'unbounded'; }
export interface GraphNode { id: number; label: string; x: number; y: number; }
export interface GraphEdge { u: number; v: number; w: number; status: 'undecided' | 'chosen' | 'skipped' | 'current'; }
export interface GraphState { nodes: GraphNode[]; edges: GraphEdge[]; best: number[]; bestTotal: number | null; }
export interface VisualState { values?: Cell[]; secondary?: Cell[]; secondaryLabel?: string; grid?: Cell[][]; active?: number[]; marked?: number[]; path?: number[]; variables?: Record<string, Cell>; result?: string; labels?: string[]; rowLabels?: string[]; columnLabels?: string[]; edges?: number[][]; outputs?: string[]; intervals?: { start: number; end: number; value: number }[]; lp?: LPState; graph?: GraphState; }
export interface SimulationEvent { action: 'check' | 'accept' | 'reject' | 'update' | 'undo' | 'output' | 'complete'; explanation: string; statePatch: VisualState; line: number; cppLine: number; depth?: number; detail?: boolean; }
export interface Preset { name: string; input: any; summary: string; }
export interface Algorithm { id: string; title: string; category: 'Quay lui' | 'Quy hoạch động' | 'Cấu trúc dữ liệu' | 'Chia để trị' | 'Tối ưu'; tags: string[]; complexity: string; description: string; goal: string; inputFormat: string; note?: string; source: string; pseudocode: string[]; presets: Preset[]; kind: 'grid' | 'array' | 'tree' | 'string' | 'timeline' | 'chart' | 'graph'; example: string; randomInput(): string; validate(input: any): string | null; initial(input: any): VisualState; simulate(input: any): Generator<SimulationEvent>; parseInput(raw: string): any; }
export type WorkerCommand = { type: 'init'; id: string; input: any; detail: Detail } | { type: 'next'; count: number; detail: Detail };
export type WorkerResponse = { type: 'batch'; events: SimulationEvent[]; done: boolean } | { type: 'error'; message: string };
