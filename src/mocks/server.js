// MOCK SERVER: an Axios adapter that answers like the real REST API (same paths, shapes, errors).
// Installed only when VITE_USE_MOCKS=true. Nothing in services/hooks/components knows it exists.
import { AxiosError } from 'axios';
import { env } from '@/app/config/env.js';
import { db, controls, tokens } from './db.js';
import { ApiError, iso } from './util.js';
import { authHandlers } from './handlers/auth.js';
import { opsHandlers as o } from './handlers/ops.js';
import { mgmtHandlers as m } from './handlers/mgmt.js';

const PUBLIC = new Set(['POST /auth/login', 'POST /auth/refresh', 'POST /auth/logout', 'GET /auth/providers', 'POST /auth/forgot-password', 'GET /settings/policy']);

const routes = [
  ['POST', '/auth/login', authHandlers.login], ['POST', '/auth/refresh', authHandlers.refresh], ['POST', '/auth/logout', authHandlers.logout],
  ['GET', '/auth/providers', authHandlers.providers], ['POST', '/auth/social/:p/start', authHandlers.social], ['POST', '/auth/forgot-password', authHandlers.forgot],
  ['GET', '/me', authHandlers.me],
  ['GET', '/lots', o.listLots], ['POST', '/lots', o.createLot], ['GET', '/lots/:id', o.getLot], ['PATCH', '/lots/:id', o.updateLot],
  ['GET', '/lots/:id/slots', o.listSlots], ['POST', '/lots/:id/slots', o.createSlots], ['PATCH', '/slots/:id', o.updateSlot],
  ['GET', '/vehicles', o.listVehicles], ['POST', '/vehicles', o.registerVehicle], ['GET', '/vehicles/:id', o.getVehicle], ['GET', '/vehicles/:id/sessions', o.vehicleSessions],
  ['POST', '/parking-sessions', o.createSession], ['GET', '/parking-sessions', o.listSessions], ['GET', '/parking-sessions/active', o.listActive], ['GET', '/parking-sessions/search', o.searchSessions],
  ['GET', '/parking-sessions/:id', o.getSession], ['POST', '/parking-sessions/:id/checkout', o.checkout], ['POST', '/parking-sessions/:id/payments', o.createPayment],
  ['POST', '/parking-sessions/:id/complete', o.completeSession], ['POST', '/parking-sessions/:id/cancel', o.cancelSession], ['GET', '/parking-sessions/:id/receipt', o.sessionReceipt],
  ['GET', '/payments', o.listPayments], ['GET', '/payments/queue', o.paymentQueue], ['GET', '/payments/:id', o.getPayment], ['POST', '/payments/:id/void', o.voidPayment],
  ['POST', '/uploads/vehicle-photo', o.uploadPhoto], ['GET', '/uploads/photos/:key', o.getPhoto],
  ['GET', '/receipts', m.listReceipts], ['GET', '/receipts/:id', m.getReceipt], ['POST', '/receipts/:id/reprint', m.reprintReceipt],
  ['GET', '/pricing-rules', m.listPricing], ['POST', '/pricing-rules', m.createPricing], ['POST', '/pricing-rules/preview', m.previewPricing], ['PATCH', '/pricing-rules/:id', m.updatePricing],
  ['GET', '/dashboard/summary', m.dashboard], ['GET', '/reports/daily', m.reportDaily], ['GET', '/reports/revenue', m.reportRevenue], ['GET', '/reports/occupancy', m.reportOccupancy],
  ['GET', '/reports/attendants', m.reportAttendants], ['GET', '/reports/sessions', m.reportSessions],
  ['GET', '/staff', m.listStaff], ['POST', '/staff', m.createStaff], ['GET', '/staff/:id', m.getStaff], ['PATCH', '/staff/:id', m.updateStaff], ['POST', '/staff/:id/reset-password', m.resetStaff],
  ['GET', '/audit-logs', m.listAudit],
  ['GET', '/notifications', m.listNotifications], ['PATCH', '/notifications/read-all', m.readAllNotifications], ['PATCH', '/notifications/:id/read', m.readNotification],
  ['GET', '/me/notification-preferences', m.getPrefs], ['PUT', '/me/notification-preferences', m.savePrefs],
  ['GET', '/settings/policy', m.policy], ['GET', '/settings/payment-methods', m.paymentMethods], ['GET', '/settings/organization', m.organization], ['PATCH', '/settings/organization', m.updateOrganization],
  ['GET', '/organizations', m.listOrgs], ['POST', '/organizations', m.createOrg], ['PATCH', '/organizations/:id', m.updateOrgById],
].map(([method, pattern, handler]) => ({ method, pattern, handler, regex: new RegExp(`^${pattern.replace(/:[a-zA-Z]+/g, '([^/]+)')}$`), keys: [...pattern.matchAll(/:([a-zA-Z]+)/g)].map((x) => x[1]) }));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const header = (config, name) => config.headers?.get?.(name) ?? config.headers?.[name] ?? config.headers?.[name.toLowerCase()];

function respond(config, status, data, extra = {}) {
  const response = { data, status, statusText: String(status), headers: { 'x-server-time': iso(), 'x-request-id': `mock_${Math.random().toString(36).slice(2, 8)}` }, config, request: {} , ...extra };
  const ok = config.validateStatus ? config.validateStatus(status) : status >= 200 && status < 300;
  if (ok) return response;
  throw new AxiosError(`Request failed with status code ${status}`, status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST', config, {}, response);
}

export function createMockAdapter() {
  return async function mockAdapter(config) {
    if (config.signal?.aborted) throw new AxiosError('canceled', 'ERR_CANCELED', config);
    if (controls.networkDown) { await sleep(300); throw new AxiosError('Network Error', 'ERR_NETWORK', config); }
    const lat = env.mockLatencyMs;
    if (lat > 0) await sleep(lat * (0.6 + Math.random() * 0.8));

    let path = (config.url || '').split('?')[0];
    if (path.startsWith(env.apiBaseUrl)) path = path.slice(env.apiBaseUrl.length);
    const method = (config.method || 'get').toUpperCase();
    const hit = routes.find((r) => r.method === method && r.regex.test(path));
    if (!hit) return respond(config, 404, { error: { code: 'NOT_FOUND', message: `No mock route for ${method} ${path}` } });

    let body = config.data;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body ?? {};
    const params = {};
    const match = path.match(hit.regex);
    hit.keys.forEach((k, i) => { params[k === 'p' ? 'provider' : k] = decodeURIComponent(match[i + 1]); });
    const headers = { 'idempotency-key': header(config, 'Idempotency-Key') };

    try {
      let user = null;
      if (!PUBLIC.has(`${method} ${hit.pattern ?? ''}`) && !PUBLIC.has(`${method} ${path}`)) {
        const auth = header(config, 'Authorization');
        const uid = auth ? tokens.get(String(auth).replace('Bearer ', '')) : null;
        user = db.users.find((u) => u.id === uid);
        if (!user) throw new ApiError(401, 'UNAUTHENTICATED', 'Sign in required');
        if (user.status !== 'ACTIVE') throw new ApiError(403, 'ACCOUNT_DISABLED', 'Disabled');
      }
      if (path === '/uploads/vehicle-photo' && config.onUploadProgress) {
        for (const pct of [15, 40, 65, 90, 100]) { await sleep(120); config.onUploadProgress({ loaded: pct, total: 100 }); }
      }
      const out = hit.handler({ user, params, query: config.params || {}, body, headers });
      return respond(config, out.status || 200, out.data, out.raw ? { data: out.data } : {});
    } catch (e) {
      if (e instanceof AxiosError) throw e;
      if (e instanceof ApiError) return respond(config, e.status, { error: { code: e.code, message: e.message, details: e.details, requestId: `mock_${Math.random().toString(36).slice(2, 8)}` } });
      console.error('[mock] unexpected', e);
      return respond(config, 500, { error: { code: 'INTERNAL_ERROR', message: 'Mock server error' } });
    }
  };
}
