import { useEffect, useState } from 'react';
export function useMediaQuery(query) {
  const [m, setM] = useState(() => (typeof window === 'undefined' ? false : window.matchMedia(query).matches));
  useEffect(() => { const mq = window.matchMedia(query); const f = () => setM(mq.matches); f(); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f); }, [query]);
  return m;
}
export const useIsDesktop = () => useMediaQuery('(min-width: 768px)');
