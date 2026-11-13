import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/authService.js';
import { tokenStore } from '@/services/tokenStore.js';
import { clearDrafts } from '@/utils/drafts.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

/** Status: 'loading' | 'authenticated' | 'anonymous'. `can()` reads the server-provided permissions (UX only). */
export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const [state, setState] = useState({ status: 'loading', user: null, reason: null });

  const reset = useCallback((reason = null) => { tokenStore.clear(); qc.clear(); clearDrafts(); setState({ status: 'anonymous', user: null, reason }); }, [qc]);

  useEffect(() => {
    tokenStore.setExpiredHandler(() => reset('expired'));
    let alive = true;
    (async () => {
      try { await authService.restore(); const user = await authService.me(); if (alive) setState({ status: 'authenticated', user, reason: null }); }
      catch { if (alive) setState({ status: 'anonymous', user: null, reason: null }); }
    })();
    return () => { alive = false; };
  }, [reset]);

  const login = useCallback(async (credentials) => {
    const { user } = await authService.login(credentials);
    qc.clear();
    setState({ status: 'authenticated', user, reason: null });
    return user;
  }, [qc]);
  const logout = useCallback(async () => { try { await authService.logout(); } finally { reset(null); } }, [reset]);

  const value = useMemo(() => ({
    ...state, login, logout,
    can: (perm) => !!state.user?.permissions?.includes(perm),
    canAny: (perms) => perms.some((p) => state.user?.permissions?.includes(p)),
  }), [state, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
