import { db, tokens, refreshSessions, attempts } from '../db.js';
import { ApiError, nextId, normPhone } from '../util.js';
import { audit, lotOf } from './helpers.js';

const SESSION_KEY = 'pw-mock-session'; // DEMO ONLY: stands in for the backend's httpOnly refresh cookie
const store = {
  get: () => { try { return sessionStorage.getItem(SESSION_KEY); } catch { return null; } },
  set: (v) => { try { sessionStorage.setItem(SESSION_KEY, v); } catch { /* ignore */ } },
  del: () => { try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ } },
};

export const userDTO = (u) => {
  const org = db.organizations.find((o) => o.id === u.organizationId);
  const lotIds = u.role === 'PARKING_OWNER' ? db.lots.filter((l) => l.organizationId === u.organizationId).map((l) => l.id) : u.lotIds;
  return {
    id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, status: u.status, organizationId: u.organizationId, organizationName: org?.name,
    permissions: u.permissions, lots: lotIds.map((id) => lotOf(id)).filter(Boolean).map((l) => ({ id: l.id, name: l.name, timezone: l.timezone })), lastLoginAt: u.lastLoginAt,
  };
};
const issue = (u) => { const t = nextId('tok'); tokens.set(t, u.id); return t; };

export const authHandlers = {
  login({ body }) {
    const now = Date.now();
    if (attempts.until > now) throw new ApiError(429, 'RATE_LIMITED', 'Too many attempts', { retryAfterSeconds: Math.ceil((attempts.until - now) / 1000) });
    const id = String(body.identifier || '').trim().toLowerCase();
    const user = db.users.find((u) => u.email?.toLowerCase() === id || normPhone(u.phone) === normPhone(id));
    if (!user || user.password !== body.password) {
      attempts.count += 1;
      if (attempts.count >= 5) { attempts.until = now + 30000; attempts.count = 0; throw new ApiError(429, 'RATE_LIMITED', 'Too many attempts', { retryAfterSeconds: 30 }); }
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }
    attempts.count = 0;
    if (user.status === 'DISABLED') throw new ApiError(403, 'ACCOUNT_DISABLED', 'Account disabled');
    user.lastLoginAt = new Date().toISOString();
    store.set(user.id);
    refreshSessions.add(user.id);
    audit(user, 'LOGIN_SUCCESS', 'user', user.id, {});
    return { data: { accessToken: issue(user), expiresIn: 900, user: userDTO(user) } };
  },
  refresh() {
    const uid = store.get();
    const user = db.users.find((u) => u.id === uid);
    if (!user || user.status !== 'ACTIVE') throw new ApiError(401, 'UNAUTHENTICATED', 'No session');
    return { data: { accessToken: issue(user), expiresIn: 900 } };
  },
  logout() { store.del(); return { status: 204, data: null }; },
  me({ user }) { return { data: userDTO(user) }; },
  providers() { return { data: { social: [{ id: 'google', label: 'Google', enabled: false }, { id: 'apple', label: 'Apple', enabled: false }], passwordReset: true } }; },
  social() { throw new ApiError(501, 'NOT_IMPLEMENTED', 'Social sign-in is not enabled'); },
  forgot() { return { status: 202, data: null }; },
};
