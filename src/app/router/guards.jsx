import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.jsx';
import { ROLE_HOME } from '@/constants/roles.js';
import { ForbiddenState } from '@/components/feedback/States.jsx';
import { Aperture } from 'lucide-react';

export function Splash() {
  return <div className="grid min-h-dvh place-items-center bg-bg" role="status" aria-label="Loading"><span className="lens-ring lens-idle grid size-16 place-items-center text-accent-text"><Aperture size={28} aria-hidden /></span></div>;
}

/** UX guard only. The backend rejects unauthorised requests regardless of what the UI shows. */
export function RequireAuth() {
  const { status } = useAuth();
  const loc = useLocation();
  if (status === 'loading') return <Splash />;
  if (status === 'anonymous') return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  return <Outlet />;
}

export function RequirePermission({ perm, anyOf, children }) {
  const { can, canAny } = useAuth();
  const ok = perm ? can(perm) : anyOf ? canAny(anyOf) : true;
  return ok ? children : <ForbiddenState />;
}

export function RoleHome() {
  const { user } = useAuth();
  return <Navigate to={ROLE_HOME[user.role] || '/help'} replace />;
}
