# Algorithm Visualizer Web Plan

## Implementation progress (2026-10-05)

- [x] Read and compare all 16 C++ programs and the existing React scaffold.
- [x] Register all 16 modules with Vietnamese content, presets, validation, and lazy simulators.
- [x] Preserve output order, strict LIS/interval comparisons, rolling edit rows, Fenwick operations, DFS/LCA and backtracking undo events.
- [x] Correct the score scaling and mines boundary defect; document differences from unsafe C++ behavior.
- [x] Provide responsive array/string/grid/tree/timeline views, Sudoku conflicts, DP heatmap, and recursion depth/bounds.
- [x] Provide play/pause/step/stop/reset, speed, detail modes, viewed-history seeking and elapsed playback time.
- [x] Highlight and scroll to current C++/pseudocode lines; reset clears highlighting.
- [x] Persist per-run frames/results in IndexedDB with bounded memory fallback, explicit storage errors and virtualized output.
- [x] Add simulator/replay/mapping/registry tests and desktop/mobile browser tests, including accessibility checks.
- [ ] Follow-up: extract remaining inline Vietnamese interface labels and semantic explanations into localization resources.
- [ ] Follow-up: split grouped simulator/content files into per-module directories and expand the recursion-depth view into a full decision tree.

The implementation currently stores a complete serializable frame at each viewed step for direct seeking. Sparse checkpoints plus event patches are a future storage optimization. Browser smoke tests target Chromium; other browser engines have not been verified yet.

## Context and decisions
- The existing project contains 16 C++ programs with paired Vietnamese statements: 8 in `webcode/` and 8 in `webcode2/`; there is no web scaffold.
- Build a new client-side React + TypeScript + Vite application. No accounts, backend, or server execution in MVP.
- Reimplement each existing algorithm as a TypeScript simulator that emits semantic execution events. Preserve the C++ source as reference and provide Vietnamese pseudocode mapped to the same event/code lines; do not execute arbitrary C++ in the browser.
- UI is Vietnamese-first, with labels/content isolated in resources for future English localization.
- Every module has an algorithm-specific visualizer, C++/pseudocode tabs, highlighted current line, explanatory console/log, Run/Pause, Step, Reset, speed, timeline/history, and preset inputs.
- Offer `Dễ hiểu` and `Chi tiết` event modes. Easy mode emits meaningful operations; detailed mode additionally emits checks and variable/table updates.
- Do not impose an artificial step-count cap. Generate events lazily in a Web Worker, support immediate Stop, persist/replay viewed history through IndexedDB where practical, and show explicit resource exhaustion/storage warnings. “Unlimited” means run until completion, user stop, or device/browser resource limits.
- Preserve algorithm-specific semantics and output order from the C++ implementations, including strict LIS comparisons, strict interval compatibility, rolling edit-distance rows, Fenwick operations, and backtracking undo events.

## Module inventory
Implement one registry entry and simulator/visualizer adapter per module:
1. `tro-choi-ghep-chu`: backtracking word search on 8 neighbors; grid/path/visited visualization.
2. `tinh-diem-mon-hoc`: backtracking quarter-point score assignment with weighted lower/upper pruning; decision tree and bounds.
3. `tach-chuoi-con-doi-xung`: backtracking palindrome partitioning; string cuts and two-pointer checks.
4. `sudoku`: first-empty-cell backtracking with row/column/box checks; 9x9 board, candidates, conflicts, placement/undo.
5. `sinh-hoan-vi`: ascending `1..n` permutation backtracking; slots, used markers, recursion tree/output stream.
6. `liet-ke-tat-ca-hoan-vi`: frequency-based descending multiset permutations; counts, duplicate suppression, output stream.
7. `do-min`: first-row exhaustive mine assignment and deterministic row propagation; clue/mine grid and failed clues.
8. `dia-chi-ip`: four-part IPv4 segmentation backtracking; separators, octet values and invalid branches.
9. `truyvantong`: prefix sums and range query subtraction; array/prefix row and highlighted range.
10. `tiem_sach`: 0/1 knapsack one-dimensional descending-capacity DP; capacity table and selected transitions.
11. `rut_bai_trung_thuong`: Levenshtein edit distance with rolling rows; logical matrix plus current row and operation.
12. `nguoi_giao_com`: iterative DFS + binary-lifting LCA; rooted tree, lifts, LCA and final path.
13. `duong_di_an_toan`: obstacle grid path-count DP modulo 1e9+7; heatmap and top/left transitions.
14. `do_an`: weighted interval scheduling sorted by finish time and strict `end < start`; timeline, predecessor and DP.
15. `daycontangdainhat`: strict LIS using coordinate compression + Fenwick prefix maxima; ranks, queries and updates.
16. `daicontangdainhat2`: strict LIS reconstruction with tails/lower-bound-style predecessor links; tails and reconstructed chain.

## Architecture and data flow
1. Create Vite/React/TypeScript project structure with domain boundaries: `algorithms/registry`, `algorithms/<id>/{simulator,visualizer,content}`, `engine`, `worker`, `components`, `styles`, and `i18n` resources.
2. Define shared types for module metadata, validated preset input, immutable visual state, event (`statePatch`, semantic action, explanation key/data, pseudocode line, C++ line range, depth), run status, and worker commands/responses.
3. Define a simulator contract with input validation, initial state, lazy `next()`/generator semantics, event detail filtering, completion/failure status, and deterministic reset. Keep the algorithm logic independent from React.
4. Use a dedicated worker per active simulation or a worker protocol that can cancel safely. The worker yields batches of events on demand rather than materializing an unbounded trace. Main thread owns playback controls and applies events to the visualizer.
5. Store only serializable checkpoints/events needed for timeline seeking. Use IndexedDB for large viewed histories and memory backpressure; evict only with an explicit warning/choice, never silently drop history. Include a bounded in-memory fallback when IndexedDB is unavailable.
6. Registry drives routing/sidebar cards, module metadata, preset selection, visualizer, C++ source, pseudocode, input parser, and simulator factory. Adding a module must not require changes to the global player.
7. Use accessible, responsive layout: module navigation, visual stage, code panel, event console, and playback dock. The visual stage adapts to board/grid/tree/table/timeline variants. Keyboard focus, readable contrast, reduced-motion support, and mobile stacking are required.

## UI behavior
- Landing/module browser groups all 16 problems by topic and shows algorithm tags, complexity, input format, and learning goal.
- Module view has preset selector and input summary; a future extension point for custom input, but MVP only exposes safe validated presets.
- Playback controls: Play/Pause, Next step, Stop, Reset, speed, timeline scrubber, current step/elapsed status, and detail-mode toggle while paused.
- Code panel switches C++/pseudocode. Highlight is derived from event line mapping; pseudocode names match C++ variables where useful (`quayLui`, `daDung`, `dp`, `cha`, etc.).
- Console shows newest semantic explanation, attempted/accepted/rejected/undo action, relevant variables, and completion/no-solution/resource status.
- For very large enumerations, stream generated outputs in a virtualized output panel and do not copy all output into React state.

## Content and correctness requirements
- Import the exact current C++ source into module content and annotate line mappings; preserve original traversal/order and edge-case behavior unless the UI explicitly labels a validation improvement.
- Write concise Vietnamese pseudocode for every module and educational explanations for each event type.
- Add explicit presets that are small enough to inspect fully, plus representative edge cases: Sudoku conflict/backtrack and solved input, empty/no-result cases where applicable, duplicate permutation digits, blocked path, equal LIS values, strict interval boundary, edit-distance empty string, and LCA ancestor/self query.
- Where C++ behavior is inconsistent or unsafe, model valid stated inputs faithfully and surface a clear input/algorithm note rather than silently claiming stronger guarantees. Relevant examples: Sudoku does not report unsatisfiable input; multiset permutation ignores zero; weighted scheduling uses strict `<`; word search assumes rectangular input; fixed array limits exist.

## Validation
- Unit-test each simulator against known outputs and invariants, including event replay producing the same final state as direct algorithm output.
- Test event-to-line mappings: every emitted event has a valid C++ and pseudocode location; code highlight changes on step and reset.
- Test worker cancellation, pause/resume, lazy continuation, timeline seek/checkpoint restore, IndexedDB unavailable/full behavior, and no main-thread blocking on large presets.
- Component/integration-test each visualizer’s core transitions and empty/failure/success states.
- Run TypeScript typecheck, lint, unit tests, production build, and a responsive/accessibility smoke test in desktop and mobile viewports.
- Verify all 16 registry entries are reachable, have source/pseudocode/presets, and render without crashing; add a registry completeness test to prevent future omissions.

## Out of scope for MVP
- Executing arbitrary user-supplied C++ or compiling C++ to WebAssembly.
- User accounts, cloud sessions, teacher dashboards, grading, collaboration, and backend persistence.
- Unlimited durable storage beyond browser/device capacity.
- Full English translation and unrestricted custom-input editors for every algorithm.
