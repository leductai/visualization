import { useEffect, useRef, useState } from 'react';
import { ListOrdered } from 'lucide-react';
import type { OutputRecord } from '../engine/history';

const ROW_HEIGHT = 40, VISIBLE = 8;
export function OutputPanel({ count, runKey, read, seek }: { count: number; runKey: string; read: (offset: number, count: number) => Promise<OutputRecord[]>; seek: (step: number) => Promise<void> }) {
  const [offset, setOffset] = useState(0), [records, setRecords] = useState<OutputRecord[]>([]), [error, setError] = useState('');
  const viewport = useRef<HTMLDivElement>(null), follow = useRef(true);
  useEffect(() => { setOffset(0); setRecords([]); setError(''); follow.current = true; if (viewport.current) viewport.current.scrollTop = 0; }, [runKey]);
  useEffect(() => {
    if (follow.current && viewport.current) viewport.current.scrollTop = Math.max(0, count * ROW_HEIGHT - viewport.current.clientHeight);
    setOffset(old => Math.min(old, Math.max(0, count - 1)));
  }, [count]);
  useEffect(() => {
    let active = true;
    if (!count || offset >= count) { setRecords([]); return; }
    void read(offset, Math.min(VISIBLE, count - offset)).then(rows => { if (active) setRecords(rows); }).catch(e => { if (active) setError(String(e)); });
    return () => { active = false; };
  }, [count, offset, runKey, read]);
  return <section className="output-panel"><div className="panel-heading"><span><ListOrdered size={16}/> Kết quả xuất</span><span>{count.toLocaleString('vi-VN')} kết quả</span></div>
    {error && <p className="warning" role="alert">{error}</p>}
    <div className="output-viewport" ref={viewport} onScroll={e => { const target = e.currentTarget; setOffset(Math.floor(target.scrollTop / ROW_HEIGHT)); follow.current = target.scrollTop + target.clientHeight >= target.scrollHeight - ROW_HEIGHT; }}>
      {count === 0 ? <div className="output-empty">Chưa có kết quả</div> : <div style={{ height: count * ROW_HEIGHT, position: 'relative' }}><div style={{ position: 'absolute', top: offset * ROW_HEIGHT, width: '100%' }}>
        {records.map((record, i) => <button className="output-row" key={`${offset + i}-${record.step}`} onClick={() => void seek(record.step)} title={record.text || 'Kết quả rỗng'}><small>{offset + i + 1}</small><code>{record.text.replaceAll('\n', ' / ') || '∅'}</code><span>Bước {record.step}</span></button>)}
      </div></div>}
    </div>
  </section>;
}
