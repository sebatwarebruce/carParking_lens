import { useMutation } from '@tanstack/react-query';
import { useRef } from 'react';
import { normalizeError } from '@/services/errors.js';

/**
 * Mutation that cannot be re-entered while in flight (double taps) and always rejects with an AppError.
 * No optimistic updates: financial/state-changing results come only from the server.
 */
export function useGuardedMutation(fn, options = {}) {
  const inflight = useRef(false);
  const m = useMutation({
    ...options,
    mutationFn: async (vars) => {
      if (inflight.current) throw Object.assign(new Error('in-flight'), { code: 'IN_FLIGHT' });
      inflight.current = true;
      try { return await fn(vars); } catch (e) { throw normalizeError(e); } finally { inflight.current = false; }
    },
  });
  return { ...m, isSubmitting: m.isPending };
}
