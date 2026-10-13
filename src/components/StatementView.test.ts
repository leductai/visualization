import { describe, expect, it } from 'vitest';
import { formatMathText, inlineNodes, parseStatement } from './StatementView';

describe('statement formatting', () => {
  it('converts LaTeX-ish math to readable text', () => {
    expect(formatMathText('1 \\le n \\le 2 \\cdot 10^5')).toBe('1 ≤ n ≤ 2 · 10⁵');
    expect(formatMathText('a_1, a_2, \\dots, a_n')).toBe('a₁, a₂, …, aₙ');
    expect(formatMathText('i \\in [1 \\dots n]')).toBe('i ∈ [1 … n]');
  });
  it('parses markdown headings, lists and tables', () => {
    const blocks = parseStatement('# DÃY CON\n\nMô tả $a_i$.\n\n## Input:\n\n* Dòng một.\n* Dòng hai.\n\n| A | B |\n|---|---|\n| 1 | 2 |');
    expect(blocks[0]).toEqual({ kind: 'heading', level: 1, text: 'DÃY CON' });
    expect(blocks[1]).toEqual({ kind: 'paragraph', text: 'Mô tả $a_i$.' });
    expect(blocks[2]).toEqual({ kind: 'heading', level: 2, text: 'Input' });
    expect(blocks[3]).toEqual({ kind: 'list', ordered: false, items: ['Dòng một.', 'Dòng hai.'] });
    expect(blocks[4]).toEqual({ kind: 'table', head: ['A', 'B'], rows: [['1', '2']] });
  });
  it('joins OCR fragments split across lines', () => {
    const blocks = parseStatement('Bảng chữ nhật\nN\n×\nM\nkích thước.');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toEqual({ kind: 'paragraph', text: 'Bảng chữ nhật N × M kích thước.' });
  });
  it('renders \\(...\\) inline math like $...$', () => {
    const nodes = inlineNodes('Có \\(n\\) đồ án \\(a_i, b_i, p_i\\).', 'k');
    const maths = nodes.filter((n: any) => n?.props?.className === 'st-math');
    expect(maths.map((n: any) => n.props.children)).toEqual(['n', 'aᵢ, bᵢ, pᵢ']);
  });
  it('parses fenced code and display math', () => {
    const blocks = parseStatement('### Input\n```text\n4\n2 4 4\n```\n\\[\n4 + 3 = 7\n\\]');
    expect(blocks[0]).toEqual({ kind: 'heading', level: 3, text: 'Input' });
    expect(blocks[1]).toEqual({ kind: 'data', lines: ['4', '2 4 4'] });
    expect(blocks[2]).toEqual({ kind: 'math', text: '4 + 3 = 7' });
  });
  it('strips \\text{} and renders hr', () => {
    expect(formatMathText('\\text{LOVE} \\to \\text{MOVE}')).toBe('LOVE → MOVE');
    expect(formatMathText('1.0\\text{s}')).toBe('1.0s');
    expect(parseStatement('a\n\n---\n\nb')).toEqual([
      { kind: 'paragraph', text: 'a' },
      { kind: 'hr' },
      { kind: 'paragraph', text: 'b' },
    ]);
  });
  it('renders `code` spans', () => {
    const nodes = inlineNodes('bốc `LOVE` thành `MOVIE`', 'k');
    const codes = nodes.filter((n: any) => n?.props?.className === 'st-code');
    expect(codes.map((n: any) => n.props.children)).toEqual(['LOVE', 'MOVIE']);
  });
  it('keeps example data rows on separate lines', () => {
    const blocks = parseStatement('Example:\n4 4\n2 0 1 1\n0 2 1 0');
    expect(blocks[0]).toEqual({ kind: 'label', text: 'Example' });
    expect(blocks[1]).toEqual({ kind: 'data', lines: ['4 4', '2 0 1 1', '0 2 1 0'] });
  });
});
