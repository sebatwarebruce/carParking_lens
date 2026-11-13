import { db, controls } from '../db.js';
import { ApiError, iso, nextId, paginate, dayKey, hoursAgo, normPhone } from '../util.js';
import { priceSession } from '../pricingEngine.js';
import { P } from '@/constants/permissions.js';
import { requirePerm, scopeLots, lotOf, vehicleOf, slotOf, userRef, audit, receiptDTO, settlePendingIfDue, sessionDTO, lotIdsFor } from './helpers.js';
import { userDTO } from './auth.js';

const inRange = (isoStr, from, to) => { const d = dayKey(isoStr); return (!from || d >= from) && (!to || d <= to); };
const today = () => dayKey(iso());
const daysBack = (n) => dayKey(iso(Date.now() - n * 86400000));

function revenueFor(lots, from, to) {
  const pays = db.payments.filter((p) => p.status === 'SUCCESS' && lots.includes(db.sessions.find((s) => s.id === p.sessionId)?.lotId) && inRange(p.paidAt, from, to));
  const by = { CASH: 0, MTN_MOMO: 0, AIRTEL_MONEY: 0, CARD: 0, BANK: 0 };
  pays.forEach((p) => { by[p.method] += p.amount; });
  const total = pays.reduce((a, p) => a + p.amount, 0);
  return { pays, by, total };
}

export const mgmtHandlers = {
  // ---------- receipts ----------
  listReceipts({ user, query }) {
    requirePerm(user, P.RECEIPTS_VIEW);
    const lots = scopeLots(user, query.lotId);
    let list = db.receipts.filter((r) => lots.includes(db.sessions.find((s) => s.id === r.sessionId)?.lotId));
    if (query.from) list = list.filter((r) => dayKey(r.issuedAt) >= query.from);
    if (query.to) list = list.filter((r) => dayKey(r.issuedAt) <= query.to);
    if (query.q) { const q = String(query.q).toLowerCase(); list = list.filter((r) => { const s = db.sessions.find((x) => x.id === r.sessionId); return r.receiptNumber.toLowerCase().includes(q) || s.ticketNumber.toLowerCase().includes(q) || vehicleOf(s.vehicleId).plateNumber.toLowerCase().includes(q.replace(/[^a-z0-9]/g, '')); }); }
    list = [...list].sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1));
    const page = paginate(list, query);
    return { data: { ...page, items: page.items.map(receiptDTO) } };
  },
  getReceipt({ user, params }) {
    requirePerm(user, P.RECEIPTS_VIEW);
    const r = db.receipts.find((x) => x.id === params.id);
    if (!r) throw new ApiError(404, 'NOT_FOUND', 'Not found');
    return { data: receiptDTO(r) };
  },
  reprintReceipt({ user, params }) {
    requirePerm(user, P.RECEIPTS_REPRINT);
    const r = db.receipts.find((x) => x.id === params.id);
    if (!r) throw new ApiError(404, 'NOT_FOUND', 'Not found');
    r.reprintCount += 1;
    audit(user, 'RECEIPT_REPRINTED', 'receipt', r.id, { count: r.reprintCount });
    return { data: receiptDTO(r) };
  },

  // ---------- pricing ----------
  listPricing({ user, query }) {
    requirePerm(user, P.PRICING_VIEW);
    const lots = scopeLots(user, query.lotId);
    let list = db.pricingRules.filter((r) => lots.includes(r.lotId));
    if (query.vehicleType) list = list.filter((r) => r.vehicleType === query.vehicleType);
    if (query.status) list = list.filter((r) => r.status === query.status);
    return { data: list.map((r) => ({ ...r, lotName: lotOf(r.lotId).name })) };
  },
  createPricing({ user, body }) {
    requirePerm(user, P.PRICING_MANAGE); scopeLots(user, body.lotId);
    const fields = {};
    ['firstBlockMinutes', 'firstBlockPrice', 'additionalBlockMinutes', 'additionalBlockPrice'].forEach((k) => { if (!(Number(body[k]) > 0)) fields[k] = 'Enter a number greater than 0'; });
    if (!(Number(body.gracePeriodMinutes) >= 0)) fields.gracePeriodMinutes = 'Enter 0 or more';
    if (Object.keys(fields).length) throw new ApiError(422, 'VALIDATION_ERROR', 'Invalid', { fields });
    const rule = { id: nextId('pr'), ...body, status: 'ACTIVE', updatedBy: userRef(user.id), updatedAt: iso() };
    // Publishing a new active rule retires the previous one for the same lot + vehicle type (future sessions only).
    db.pricingRules.filter((r) => r.lotId === rule.lotId && r.vehicleType === rule.vehicleType && r.status === 'ACTIVE').forEach((r) => { r.status = 'INACTIVE'; r.effectiveTo = rule.effectiveFrom; });
    db.pricingRules.push(rule);
    audit(user, 'PRICING_RULE_CREATED', 'pricing_rule', rule.id, { after: rule });
    return { status: 201, data: rule };
  },
  updatePricing({ user, params, body }) {
    requirePerm(user, P.PRICING_MANAGE);
    const r = db.pricingRules.find((x) => x.id === params.id);
    if (!r) throw new ApiError(404, 'NOT_FOUND', 'Not found');
    scopeLots(user, r.lotId);
    const before = { ...r };
    Object.assign(r, body, { updatedBy: userRef(user.id), updatedAt: iso() });
    audit(user, 'PRICING_RULE_CHANGED', 'pricing_rule', r.id, { before, after: { ...r } });
    return { data: r };
  },
  previewPricing({ user, body }) {
    requirePerm(user, P.PRICING_VIEW);
    const out = priceSession(body, Number(body.sampleMinutes));
    return { data: { sampleMinutes: Number(body.sampleMinutes), breakdown: out.breakdown, total: out.total, currency: 'RWF' } };
  },

  // ---------- dashboard & reports ----------
  dashboard({ user, query }) {
    requirePerm(user, P.DASHBOARD_VIEW);
    if (user.role === 'SUPER_ADMIN') {
      const orgs = db.organizations.filter((o) => o.id !== 'o0');
      return { data: { kind: 'PLATFORM', generatedAt: iso(), organizations: { total: orgs.length, active: orgs.filter((o) => o.status === 'ACTIVE').length, suspended: orgs.filter((o) => o.status !== 'ACTIVE').length }, lots: db.lots.length + 2, users: db.users.length + 7, recent: orgs.map((o) => ({ id: o.id, name: o.name, status: o.status, lots: o.lots, users: o.users })) } };
    }
    const lots = scopeLots(user, query.lotId);
    const from = query.from || today();
    const to = query.to || today();
    const slots = db.slots.filter((s) => lots.includes(s.lotId));
    db.payments.forEach((p) => settlePendingIfDue(p, controls));
    const { by, total, pays } = revenueFor(lots, from, to);
    const sessions = db.sessions.filter((s) => lots.includes(s.lotId));
    const pending = db.payments.filter((p) => p.status === 'PENDING' && lots.includes(db.sessions.find((s) => s.id === p.sessionId)?.lotId));
    const awaiting = sessions.filter((s) => s.status === 'EXIT_PENDING' || s.status === 'PAYMENT_FAILED');
    const failed = db.payments.filter((p) => p.status === 'FAILED' && lots.includes(db.sessions.find((s) => s.id === p.sessionId)?.lotId) && inRange(p.createdAt, from, to));
    const long = sessions.filter((s) => s.status === 'ACTIVE' && Date.now() - Date.parse(s.entryTime) > db.policy.longSessionMinutes * 60000);
    const revenueByDay = [];
    for (let i = 6; i >= 0; i--) { const d = daysBack(i); revenueByDay.push({ date: d, confirmed: revenueFor(lots, d, d).total }); }
    const occupancyTrend = [];
    for (let i = 11; i >= 0; i--) {
      const end = Date.now() - i * 3600000; const start = end - 3600000;
      const occupied = sessions.filter((s) => Date.parse(s.entryTime) <= end && (!s.exitTime || Date.parse(s.exitTime) >= start) && s.status !== 'CANCELLED').length;
      occupancyTrend.push({ at: iso(end), occupied: Math.min(occupied, slots.length) });
    }
    const recent = sessions.flatMap((s) => [{ id: `${s.id}-in`, type: 'ENTRY', at: s.entryTime, sessionId: s.id, message: `${vehicleOf(s.vehicleId).displayPlate} entered ${slotOf(s.slotId).slotNumber}` }, ...(s.exitTime ? [{ id: `${s.id}-out`, type: 'EXIT', at: s.exitTime, sessionId: s.id, message: `${vehicleOf(s.vehicleId).displayPlate} exited ${slotOf(s.slotId).slotNumber}` }] : [])]).sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 8);
    const alerts = [];
    if (failed.length) alerts.push({ id: 'al1', severity: 'danger', title: `${failed.length} failed payment${failed.length > 1 ? 's' : ''}`, body: 'Review failed attempts in Payments.' });
    if (long.length) alerts.push({ id: 'al2', severity: 'warning', title: `${long.length} long session${long.length > 1 ? 's' : ''}`, body: `Parked more than ${Math.round(db.policy.longSessionMinutes / 60)} hours.` });
    if (awaiting.length) alerts.push({ id: 'al3', severity: 'info', title: `${awaiting.length} awaiting settlement`, body: 'Vehicles exited but payment is not confirmed yet.' });
    const vehiclesToday = sessions.filter((s) => inRange(s.entryTime, from, to)).length;
    return { data: {
      kind: 'LOT', lotId: query.lotId || null, from, to, currency: 'RWF', generatedAt: iso(), basis: 'CONFIRMED',
      spaces: { total: slots.length, available: slots.filter((s) => s.status === 'AVAILABLE').length, occupied: slots.filter((s) => s.status === 'OCCUPIED').length, outOfService: slots.filter((s) => s.status === 'OUT_OF_SERVICE').length },
      vehiclesToday, activeSessions: sessions.filter((s) => s.status === 'ACTIVE').length,
      confirmedRevenue: total, cashRevenue: by.CASH, mobileMoneyRevenue: by.MTN_MOMO + by.AIRTEL_MONEY, averageTicket: pays.length ? Math.round(total / pays.length) : 0,
      pendingPayments: { count: pending.length + awaiting.length, amount: pending.reduce((a, p) => a + p.amount, 0) + awaiting.reduce((a, s) => a + (s.amountDue || 0), 0) },
      failedPayments: { count: failed.length }, longSessions: long.length,
      revenueByMethod: [{ method: 'CASH', amount: by.CASH }, { method: 'MTN_MOMO', amount: by.MTN_MOMO }, { method: 'AIRTEL_MONEY', amount: by.AIRTEL_MONEY }],
      revenueByDay, occupancyTrend, recentActivity: recent, alerts,
      cashier: { queueCount: awaiting.length + pending.length, pendingCount: pending.length, cashConfirmedToday: by.CASH },
    } };
  },
  reportDaily({ user, query }) {
    requirePerm(user, P.REPORTS_VIEW);
    const lots = scopeLots(user, query.lotId); const d = query.date || today();
    const { by, total, pays } = revenueFor(lots, d, d);
    const ss = db.sessions.filter((s) => lots.includes(s.lotId));
    return { data: { date: d, lotId: query.lotId || null, currency: 'RWF', basis: 'CONFIRMED', generatedAt: iso(), sessionsStarted: ss.filter((s) => dayKey(s.entryTime) === d).length, sessionsCompleted: ss.filter((s) => s.status === 'COMPLETED' && s.exitTime && dayKey(s.exitTime) === d).length, confirmedRevenue: total, byMethod: by, paymentCount: pays.length } };
  },
  reportRevenue({ user, query }) {
    requirePerm(user, P.REPORTS_VIEW);
    const lots = scopeLots(user, query.lotId);
    const from = query.from || daysBack(6); const to = query.to || today();
    const rows = [];
    const { total, by } = revenueFor(lots, from, to);
    for (let t = Date.parse(from); t <= Date.parse(to); t += 86400000) {
      const d = dayKey(iso(t + 12 * 3600000)); const r = revenueFor(lots, d, d);
      rows.push({ date: d, amount: r.total, cash: r.by.CASH, mobileMoney: r.by.MTN_MOMO + r.by.AIRTEL_MONEY, count: r.pays.length });
    }
    return { data: { from, to, lotId: query.lotId || null, currency: 'RWF', basis: 'CONFIRMED', generatedAt: iso(), total, byMethod: [{ method: 'CASH', amount: by.CASH }, { method: 'MTN_MOMO', amount: by.MTN_MOMO }, { method: 'AIRTEL_MONEY', amount: by.AIRTEL_MONEY }], rows } };
  },
  reportOccupancy({ user, query }) {
    requirePerm(user, P.REPORTS_VIEW);
    const lots = scopeLots(user, query.lotId);
    const from = query.from || daysBack(6); const to = query.to || today();
    const cap = db.slots.filter((s) => lots.includes(s.lotId) && s.status !== 'OUT_OF_SERVICE').length;
    const ss = db.sessions.filter((s) => lots.includes(s.lotId) && s.status !== 'CANCELLED');
    const rows = [];
    for (let t = Date.parse(from); t <= Date.parse(to); t += 86400000) {
      const d = dayKey(iso(t + 12 * 3600000)); let peak = 0;
      for (let h = 0; h < 24; h++) { const at = Date.parse(`${d}T${String(h).padStart(2, '0')}:00:00+02:00`); peak = Math.max(peak, ss.filter((s) => Date.parse(s.entryTime) <= at && (!s.exitTime || Date.parse(s.exitTime) >= at)).length); }
      rows.push({ date: d, peakOccupied: Math.min(peak, cap), capacity: cap, sessions: ss.filter((s) => dayKey(s.entryTime) === d).length });
    }
    return { data: { from, to, lotId: query.lotId || null, generatedAt: iso(), rows } };
  },
  reportAttendants({ user, query }) {
    requirePerm(user, P.REPORTS_VIEW);
    const lots = scopeLots(user, query.lotId);
    const from = query.from || daysBack(6); const to = query.to || today();
    const staff = db.users.filter((u) => ['ATTENDANT', 'CASHIER', 'MANAGER'].includes(u.role) && u.lotIds.some((l) => lots.includes(l)));
    const rows = staff.map((u) => {
      const entries = db.sessions.filter((s) => s.createdBy === u.id && lots.includes(s.lotId) && inRange(s.entryTime, from, to)).length;
      const confirmed = db.payments.filter((p) => p.status === 'SUCCESS' && (p.confirmedBy === u.id || p.initiatedBy === u.id) && inRange(p.paidAt, from, to));
      return { user: { id: u.id, name: u.name, role: u.role }, entries, paymentsConfirmed: confirmed.length, confirmedAmount: confirmed.reduce((a, p) => a + p.amount, 0) };
    });
    return { data: { from, to, generatedAt: iso(), currency: 'RWF', rows } };
  },
  reportSessions({ user, query }) {
    requirePerm(user, P.REPORTS_VIEW);
    const lots = scopeLots(user, query.lotId);
    const from = query.from || daysBack(6); const to = query.to || today();
    const ss = db.sessions.filter((s) => lots.includes(s.lotId) && inRange(s.entryTime, from, to));
    const done = ss.filter((s) => s.durationMinutes);
    const split = (k) => Object.entries(ss.reduce((a, s) => { const key = k(s); a[key] = (a[key] || 0) + 1; return a; }, {})).map(([label, count]) => ({ label, count }));
    return { data: { from, to, generatedAt: iso(), total: ss.length, completed: ss.filter((s) => s.status === 'COMPLETED').length, active: ss.filter((s) => s.status === 'ACTIVE').length, averageDurationMinutes: done.length ? Math.round(done.reduce((a, s) => a + s.durationMinutes, 0) / done.length) : 0, byVehicleType: split((s) => vehicleOf(s.vehicleId).vehicleType), byStatus: split((s) => s.status) } };
  },

  // ---------- staff ----------
  listStaff({ user, query }) {
    requirePerm(user, P.STAFF_VIEW);
    const orgId = user.organizationId;
    let list = db.users.filter((u) => (user.role === 'SUPER_ADMIN' ? true : u.organizationId === orgId) && (user.role === 'SUPER_ADMIN' ? u.role === 'SUPER_ADMIN' || u.role === 'PARKING_OWNER' : u.role !== 'SUPER_ADMIN'));
    if (query.role) list = list.filter((u) => u.role === query.role);
    if (query.status) list = list.filter((u) => u.status === query.status);
    if (query.q) { const q = String(query.q).toLowerCase(); list = list.filter((u) => u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || normPhone(u.phone).includes(normPhone(q) || '#')); }
    const page = paginate(list, query);
    return { data: { ...page, items: page.items.map(userDTO) } };
  },
  getStaff({ user, params }) {
    requirePerm(user, P.STAFF_VIEW);
    const u = db.users.find((x) => x.id === params.id);
    if (!u) throw new ApiError(404, 'NOT_FOUND', 'Not found');
    const activity = db.audit.filter((a) => a.actor.id === u.id).slice(0, 15);
    return { data: { ...userDTO(u), lotIds: u.lotIds, activity } };
  },
  createStaff({ user, body }) {
    requirePerm(user, P.STAFF_MANAGE);
    const fields = {};
    if (!body.name) fields.name = 'Enter a name';
    if (!body.email && !body.phone) fields.email = 'Enter an email or phone number';
    if (db.users.some((u) => (body.email && u.email === body.email) || (body.phone && normPhone(u.phone) === normPhone(body.phone)))) fields.email = 'This contact is already used';
    if (Object.keys(fields).length) throw new ApiError(422, 'VALIDATION_ERROR', 'Invalid', { fields });
    const { DEFAULT_ROLE_PERMISSIONS } = body._perms || {};
    void DEFAULT_ROLE_PERMISSIONS;
    const u = { id: nextId('u'), name: body.name, email: body.email, phone: body.phone, role: body.role, status: 'ACTIVE', organizationId: user.organizationId, lotIds: body.lotIds || [], createdAt: iso(), password: 'demo1234', permissions: db.users.find((x) => x.role === body.role)?.permissions || [] };
    db.users.push(u);
    audit(user, 'USER_CREATED', 'user', u.id, { role: u.role, lotIds: u.lotIds });
    return { status: 201, data: userDTO(u) };
  },
  updateStaff({ user, params, body }) {
    requirePerm(user, P.STAFF_MANAGE);
    const u = db.users.find((x) => x.id === params.id);
    if (!u) throw new ApiError(404, 'NOT_FOUND', 'Not found');
    if ((body.status && body.status !== u.status) || (body.role && body.role !== u.role)) {
      if (!body.reason || String(body.reason).trim().length < 3) throw new ApiError(422, 'VALIDATION_ERROR', 'Reason required', { fields: { reason: 'A reason is required' } });
    }
    const before = { role: u.role, status: u.status, lotIds: u.lotIds };
    if (body.role) { u.role = body.role; u.permissions = db.users.find((x) => x.role === body.role && x.id !== u.id)?.permissions || u.permissions; }
    if (body.status) u.status = body.status;
    if (body.lotIds) u.lotIds = body.lotIds;
    audit(user, body.status && body.status !== before.status ? (body.status === 'DISABLED' ? 'USER_DISABLED' : 'USER_ENABLED') : body.role ? 'ROLE_CHANGED' : 'LOT_ASSIGNMENT_CHANGED', 'user', u.id, { before, after: { role: u.role, status: u.status, lotIds: u.lotIds }, reason: body.reason });
    return { data: userDTO(u) };
  },
  resetStaff({ user, params }) { requirePerm(user, P.STAFF_MANAGE); audit(user, 'PASSWORD_RESET_REQUESTED', 'user', params.id, {}); return { status: 202, data: null }; },

  // ---------- audit ----------
  listAudit({ user, query }) {
    requirePerm(user, P.AUDIT_VIEW);
    let list = db.audit;
    if (user.role !== 'SUPER_ADMIN') { const ids = new Set(db.users.filter((u) => u.organizationId === user.organizationId).map((u) => u.id)); list = list.filter((a) => ids.has(a.actor.id) || a.actor.id === 'provider'); }
    if (query.action) list = list.filter((a) => a.action === query.action);
    if (query.actorId) list = list.filter((a) => a.actor.id === query.actorId);
    if (query.entityType) list = list.filter((a) => a.entityType === query.entityType);
    if (query.from) list = list.filter((a) => dayKey(a.createdAt) >= query.from);
    if (query.to) list = list.filter((a) => dayKey(a.createdAt) <= query.to);
    if (query.q) { const q = String(query.q).toLowerCase(); list = list.filter((a) => `${a.actor.name} ${a.action} ${a.entityId}`.toLowerCase().includes(q)); }
    const page = paginate(list, query);
    return { data: page };
  },

  // ---------- notifications ----------
  listNotifications({ user }) { requirePerm(user, P.NOTIFICATIONS_VIEW); return { data: { items: db.notifications, page: 1, pageSize: db.notifications.length, total: db.notifications.length } }; },
  readNotification({ params }) { const n = db.notifications.find((x) => x.id === params.id); if (n) n.read = true; return { status: 204, data: null }; },
  readAllNotifications() { db.notifications.forEach((n) => { n.read = true; }); return { status: 204, data: null }; },
  getPrefs() { return { data: db.notifPrefs }; },
  savePrefs({ body }) { Object.assign(db.notifPrefs, body); return { data: db.notifPrefs }; },

  // ---------- settings & organizations ----------
  policy({ user }) { void user; return { data: db.policy }; },
  paymentMethods({ user }) { requirePerm(user, P.SETTINGS_VIEW); return { data: db.paymentMethods }; },
  organization({ user }) { requirePerm(user, P.SETTINGS_VIEW); const o = db.organizations.find((x) => x.id === user.organizationId); return { data: { ...o, receiptFooter: o.receiptFooter || 'Thank you for parking with us.', lots: lotIdsFor(user).length } }; },
  updateOrganization({ user, body }) {
    requirePerm(user, P.SETTINGS_MANAGE);
    const o = db.organizations.find((x) => x.id === user.organizationId);
    const before = { name: o.name, receiptFooter: o.receiptFooter };
    Object.assign(o, ['name', 'receiptFooter'].reduce((a, k) => (body[k] !== undefined ? { ...a, [k]: body[k] } : a), {}));
    audit(user, 'ORGANIZATION_UPDATED', 'organization', o.id, { before, after: { name: o.name, receiptFooter: o.receiptFooter } });
    return { data: o };
  },
  listOrgs({ user }) { requirePerm(user, P.PLATFORM_MANAGE); const l = db.organizations.filter((o) => o.id !== 'o0'); return { data: { items: l, page: 1, pageSize: l.length, total: l.length } }; },
  createOrg({ user, body }) {
    requirePerm(user, P.PLATFORM_MANAGE);
    if (!body.name) throw new ApiError(422, 'VALIDATION_ERROR', 'Invalid', { fields: { name: 'Enter the organization name' } });
    const o = { id: nextId('o'), name: body.name, status: 'ACTIVE', timezone: 'Africa/Kigali', currency: 'RWF', lots: 0, users: 0, createdAt: iso() };
    db.organizations.push(o); audit(user, 'ORGANIZATION_CREATED', 'organization', o.id, { name: o.name });
    return { status: 201, data: o };
  },
  updateOrgById({ user, params, body }) {
    requirePerm(user, P.PLATFORM_MANAGE);
    const o = db.organizations.find((x) => x.id === params.id);
    if (!o) throw new ApiError(404, 'NOT_FOUND', 'Not found');
    if (body.status && body.status !== o.status && !body.reason) throw new ApiError(422, 'VALIDATION_ERROR', 'Reason required', { fields: { reason: 'A reason is required' } });
    const before = { status: o.status }; Object.assign(o, { status: body.status || o.status, name: body.name || o.name });
    audit(user, 'ORGANIZATION_UPDATED', 'organization', o.id, { before, after: { status: o.status }, reason: body.reason });
    return { data: o };
  },
};
void hoursAgo; void sessionDTO;
