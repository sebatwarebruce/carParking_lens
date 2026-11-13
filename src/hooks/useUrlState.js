import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';
/** Filter state kept in the URL so lists are shareable and survive refresh. */
export function useUrlState(defaults = {}) {
  const [sp, setSp] = useSearchParams();
  const state = { ...defaults };
  for (const k of Object.keys(defaults)) if (sp.has(k)) state[k] = sp.get(k);
  const set = useCallback((patch) => {
    setSp((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) => { if (v === '' || v === undefined || v === null || v === defaults[k]) next.delete(k); else next.set(k, String(v)); });
      if (!('page' in patch)) next.delete('page');
      return next;
    }, { replace: true });
  }, [setSp]); // eslint-disable-line react-hooks/exhaustive-deps
  return [state, set];
}
