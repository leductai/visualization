import { useEffect, useState } from 'react';

export function useMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [enabled, setEnabled] = useState(() => { try { return localStorage.getItem('algo-motion') !== 'off'; } catch { return true; } });
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(query.matches); query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  return { motion: enabled && !reduced, reduced,
    toggleMotion: () => setEnabled(value => { try { localStorage.setItem('algo-motion', value ? 'off' : 'on'); } catch { /* Preferences are optional when storage is unavailable. */ } return !value; }),
  };
}
