import { useEffect, useState } from 'react';

export function useMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  // 'system' = theo hệ điều hành (mặc định); 'on'/'off' = người dùng ép tay.
  // Nút luôn bấm được — không còn cảnh bị disabled vĩnh viễn khi hệ thống ép giảm.
  const [choice, setChoice] = useState<'system' | 'on' | 'off'>(() => {
    try {
      const saved = localStorage.getItem('algo-motion');
      if (saved === 'on' || saved === 'off' || saved === 'system') return saved;
      return 'system';
    } catch { return 'system'; }
  });
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(query.matches); query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    try { localStorage.setItem('algo-motion', choice); } catch { /* Preferences are optional when storage is unavailable. */ }
  }, [choice]);
  const motion = choice === 'on' ? true : choice === 'off' ? false : !reduced;
  return { motion, reduced,
    toggleMotion: () => setChoice(motion ? 'off' : 'on'),
  };
}
