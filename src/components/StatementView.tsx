import type { ReactNode } from 'react';

/** Dựng đề bài gốc (markdown thô / text OCR) thành khối đọc được cho người bình thường. */

const MATH_CMD: Record<string, string> = {
  le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠', cdot: '·', dots: '…',
  cdots: '⋯', ldots: '…', in: '∈', notin: '∉', times: '×', infty: '∞', to: '→',
  cap: '∩', cup: '∪', pm: '±', subset: '⊂',
};
const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', n: 'ⁿ', i: 'ⁱ' };
const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', a: 'ₐ', e: 'ₑ', h: 'ₕ', i: 'ᵢ', j: 'ⱼ', k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ', o: 'ₒ', p: 'ₚ', r: 'ᵣ', s: 'ₛ', t: 'ₜ', u: 'ᵤ', v: 'ᵥ', x: 'ₓ', '+': '₊', '-': '₋' };
const sup = (s: string) => [...s].map(c => SUP[c] ?? c).join('');
const sub = (s: string) => [...s].map(c => SUB[c] ?? c).join('');

/** Biến `$1 \\le n \\le 2 \\cdot 10^5$` thành text đọc được (không cần KaTeX). */
export function formatMathText(s: string): string {
  return s
    .replace(/\\([a-zA-Z]+)/g, (_, c: string) => MATH_CMD[c] ?? c)
    .replace(/\\/g, '')
    .replace(/\^\{([^}]*)\}/g, (_, e: string) => sup(e))
    .replace(/\^([0-9A-Za-z+\-])/g, (_, c: string) => sup(c))
    .replace(/_([0-9A-Za-z])/g, (_, c: string) => sub(c))
    .replace(/[{}]/g, '');
}

export type StatementBlock =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'label'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'data'; lines: string[] }
  | { kind: 'math'; text: string };

const clean = (s: string) => s.replace(/[\u200b-\u200d\ufeff]/g, '').replace(/\s+/g, ' ').trim();
const isDataRow = (t: string) => /[\d]/.test(t) && /^[\d\s+\-.]+$/.test(t);
const isLabelLine = (t: string) => t.length >= 2 && t.length < 25 && (/^[A-ZÀ-Ýa-zà-ỹ]+:?$/.test(t) || /^(Input|Output|Ví dụ|Example|Constrains?)\s*:?$/i.test(t));
const isAllCaps = (t: string) => t.length >= 4 && t.length <= 60 && /[A-ZÀ-Ý]/.test(t) && t === t.toUpperCase() && !/^[|\-*#\d]/.test(t);

/** Hai dòng có thuộc cùng đoạn văn không (nối mảnh OCR kiểu "N / × / M"). */
function sameParagraph(prev: string, next: string): boolean {
  if (!prev) return true;
  if (next.length <= 3 && !/[.:!?…]$/.test(prev)) return true;
  if (/[.:!?…]$/.test(prev)) return /^[a-zà-ỹ0-9(\[{+\-–×·*/<]/.test(next);
  return true;
}

/** Gom câu lặp do OCR ("N × M N×M", "k k quả"). */
function dedup(s: string): string {
  return s
    .replace(/\[\s+/g, '[').replace(/\s+\]/g, ']').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')')
    .replace(/\s*([=<>≤≥]+)\s*/g, '$1')
    .replace(/\b([A-Za-z]) \1\b/g, '$1')
    .replace(/([A-Za-z0-9]+) ([×+\-*/]) ([A-Za-z0-9]+) \1\2\3/g, '$1$2$3')
    .replace(/\s+,/g, ',');
}

export function parseStatement(raw: string): StatementBlock[] {
  const lines = raw.replace(/\r/g, '').split('\n');
  const blocks: StatementBlock[] = [];
  let para = '', prevRaw = '';
  const flushPara = () => { const t = dedup(clean(para)); if (t) blocks.push({ kind: 'paragraph', text: t }); para = ''; prevRaw = ''; };
  const pushTable = (rows: string[][], sep: '|' | '\t') => {
    const cells = rows.map(r => sep === '|' ? r.map(c => clean(c.replace(/<br\s*\/?>/gi, '\n'))) : r.map(clean));
    const data = cells.filter(r => r.some(c => c.length > 0) && !r.every(c => /^:?-+:?$/.test(c)));
    if (!data.length) return;
    blocks.push({ kind: 'table', head: data[0], rows: data.slice(1) });
  };

  let i = 0;
  const takeTable = (isPipe: (t: string) => boolean): string[][] => {
    const rows: string[][] = [];
    while (i < lines.length) {
      const t = clean(lines[i]);
      if (!t || !isPipe(t)) break;
      rows.push(isPipe === isPipeRow ? t.split('|').slice(1, -1) : t.split('\t'));
      i++;
    }
    return rows;
  };
  const isPipeRow = (t: string) => t.startsWith('|');

  while (i < lines.length) {
    const rawLine = lines[i], t = clean(rawLine);
    if (!t) { flushPara(); i++; continue; }
    if (t.startsWith('```')) {
      // Khối code ví dụ (```text ... ```): giữ nguyên từng dòng.
      flushPara();
      const code: string[] = []; i++;
      while (i < lines.length && !clean(lines[i]).startsWith('```')) { const c = lines[i].replace(/\s+$/g, ''); if (c.trim()) code.push(c); i++; }
      i++;
      if (code.length) blocks.push({ kind: 'data', lines: code });
      continue;
    }
    if (t === '\\[') {
      // Công thức trưng bày \[ ... \] (có thể nhiều dòng).
      flushPara();
      const expr: string[] = []; i++;
      while (i < lines.length && clean(lines[i]) !== '\\]') { const c = clean(lines[i]); if (c) expr.push(c); i++; }
      i++;
      if (expr.length) blocks.push({ kind: 'math', text: expr.join(' ') });
      continue;
    }
    const mdHead = t.match(/^(#{1,4})\s+(.*)$/);
    if (mdHead) { flushPara(); blocks.push({ kind: 'heading', level: mdHead[1].length, text: clean(mdHead[2].replace(/:$/, '')) }); i++; continue; }
    if (isPipeRow(t)) { flushPara(); pushTable(takeTable(isPipeRow), '|'); continue; }
    if (t.includes('\t')) { flushPara(); pushTable(takeTable(x => x.includes('\t')), '\t'); continue; }
    const bullet = t.match(/^([-*+]\s+|\d+[.)]\s+)(.*)$/);
    if (bullet) {
      flushPara();
      const ordered = /^\d/.test(bullet[1]);
      const items = [clean(bullet[2])];
      i++;
      while (i < lines.length) {
        const m = clean(lines[i]).match(/^([-*+]\s+|\d+[.)]\s+)(.*)$/);
        if (!m) break;
        items.push(clean(m[2])); i++;
      }
      blocks.push({ kind: 'list', ordered, items });
      continue;
    }
    if (isDataRow(t)) { flushPara(); const rows = [t]; i++; while (i < lines.length && isDataRow(clean(lines[i]))) { rows.push(clean(lines[i])); i++; } blocks.push({ kind: 'data', lines: rows }); continue; }
    if (isLabelLine(t)) { flushPara(); blocks.push({ kind: 'label', text: t.replace(/:$/, '') }); i++; continue; }
    if (isAllCaps(t)) { flushPara(); blocks.push({ kind: 'heading', level: 2, text: t.replace(/:$/, '') }); i++; continue; }
    if (!para || sameParagraph(prevRaw, t)) { para += (para ? ' ' : '') + t; prevRaw = t; }
    else { flushPara(); para = t; prevRaw = t; }
    i++;
  }
  flushPara();
  return blocks;
}

export function inlineNodes(text: string, key: string): ReactNode[] {
  return text.split(/(\$[^$\n]+\$|\\\(.+?\\\))/g).map((part, i) => {
    if (part.length > 2 && part.startsWith('$') && part.endsWith('$')) {
      return <span key={`${key}-${i}`} className="st-math">{formatMathText(part.slice(1, -1))}</span>;
    }
    if (part.length > 4 && part.startsWith('\\(') && part.endsWith('\\)')) {
      return <span key={`${key}-${i}`} className="st-math">{formatMathText(part.slice(2, -2))}</span>;
    }
    return part.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.length > 4 && p.startsWith('**') && p.endsWith('**')
        ? <strong key={`${key}-${i}-${j}`}>{p.slice(2, -2)}</strong>
        : <span key={`${key}-${i}-${j}`}>{p}</span>,
    );
  });
}

const cellLines = (cell: string, key: string): ReactNode[] =>
  cell.split('\n').map((l, i, arr) => <span key={`${key}-${i}`}>{inlineNodes(l, `${key}-${i}`)}{i < arr.length - 1 && <br />}</span>);

export function StatementView({ text }: { text: string }) {
  const blocks = parseStatement(text);
  return <>{blocks.map((b, i) => {
    switch (b.kind) {
      case 'heading': return b.level <= 1
        ? <h4 key={i} className="st-h1">{inlineNodes(b.text, `h${i}`)}</h4>
        : <h5 key={i} className="st-h2">{inlineNodes(b.text, `h${i}`)}</h5>;
      case 'label': return <p key={i} className="st-label">{inlineNodes(b.text, `l${i}`)}</p>;
      case 'paragraph': return <p key={i}>{inlineNodes(b.text, `p${i}`)}</p>;
      case 'list': return b.ordered
        ? <ol key={i}>{b.items.map((it, j) => <li key={j}>{inlineNodes(it, `o${i}-${j}`)}</li>)}</ol>
        : <ul key={i}>{b.items.map((it, j) => <li key={j}>{inlineNodes(it, `u${i}-${j}`)}</li>)}</ul>;
      case 'table': return <table key={i} className="st-table"><thead><tr>{b.head.map((c, j) => <th key={j}>{cellLines(c, `th${i}-${j}`)}</th>)}</tr></thead><tbody>{b.rows.map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j}>{cellLines(c, `td${i}-${k}-${j}`)}</td>)}</tr>)}</tbody></table>;
      case 'data': return <div key={i} className="st-data">{b.lines.map((l, j) => <div key={j}>{l}</div>)}</div>;
      case 'math': return <div key={i} className="st-displaymath"><span className="st-math">{formatMathText(b.text)}</span></div>;
    }
  })}</>;
}
