import { DEFAULT_ROLE_PERMISSIONS } from '@/constants/permissions.js';
import { rng, hoursAgo, minutesAgo, iso, normPlate, dayKey } from './util.js';
import { priceSession } from './pricingEngine.js';

export const DEMO_PASSWORD = 'demo1234';

export function buildSeed() {
  const R = rng(7);
  const pick = (arr) => arr[Math.floor(R() * arr.length)];
  const L = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const plate = (type) => (type === 'MOTORCYCLE' ? `RF${100 + Math.floor(R() * 899)}${pick(L.split(''))}` : `R${pick(['A', 'A', 'B', 'D'])}${pick(['D', 'E', 'H', 'C'])} ${100 + Math.floor(R() * 899)} ${pick(L.split(''))}`);

  const organizations = [
    { id: 'o0', name: 'ParkWise Platform', status: 'ACTIVE', timezone: 'Africa/Kigali', currency: 'RWF', lots: 0, users: 1, createdAt: iso(hoursAgo(24 * 200)) },
    { id: 'o1', name: 'Kigali Central Parking', status: 'ACTIVE', timezone: 'Africa/Kigali', currency: 'RWF', lots: 2, users: 6, createdAt: iso(hoursAgo(24 * 90)) },
    { id: 'o2', name: 'Nyamirambo Lots Ltd', status: 'ACTIVE', timezone: 'Africa/Kigali', currency: 'RWF', lots: 1, users: 3, createdAt: iso(hoursAgo(24 * 40)) },
    { id: 'o3', name: 'Musanze Garage Co', status: 'SUSPENDED', timezone: 'Africa/Kigali', currency: 'RWF', lots: 1, users: 2, createdAt: iso(hoursAgo(24 * 20)) },
  ];

  const lots = [
    { id: 'l1', organizationId: 'o1', name: 'Downtown Lot A', address: 'KN 4 Ave, Nyarugenge, Kigali', contact: '+250 788 000 111', timezone: 'Africa/Kigali', status: 'ACTIVE' },
    { id: 'l2', organizationId: 'o1', name: 'Airport Road Lot', address: 'KK 15 Rd, Kanombe, Kigali', contact: '+250 788 000 222', timezone: 'Africa/Kigali', status: 'ACTIVE' },
  ];

  const slots = [];
  const addSlots = (lotId, prefix, count, vehicleType, zone) => {
    for (let i = 1; i <= count; i++) slots.push({ id: `${lotId}-${prefix}${i}`, lotId, slotNumber: `${prefix}-${String(i).padStart(3, '0')}`, zone, vehicleType, status: 'AVAILABLE', version: 0 });
  };
  addSlots('l1', 'A', 24, 'CAR', 'Zone A');
  addSlots('l1', 'B', 8, 'MOTORCYCLE', 'Zone B');
  addSlots('l1', 'C', 4, 'TRUCK', 'Zone C');
  addSlots('l2', 'D', 14, 'ANY', 'Main');
  const setOos = (id, reason) => { const s = slots.find((x) => x.id === id); s.status = 'OUT_OF_SERVICE'; s.outOfServiceReason = reason; };
  setOos('l1-A7', 'Damaged barrier post');
  setOos('l1-C4', 'Surface repair');
  setOos('l2-D3', 'Reserved for maintenance vehicle');

  const mkUser = (id, name, role, extra = {}) => ({ id, name, role, organizationId: 'o1', status: 'ACTIVE', lotIds: ['l1'], createdAt: iso(hoursAgo(24 * 60)), lastLoginAt: iso(hoursAgo(5)), ...extra });
  const users = [
    mkUser('u1', 'Samuel Karekezi', 'SUPER_ADMIN', { email: 'admin@parkwise.demo', phone: '0788100001', organizationId: 'o0', lotIds: [] }),
    mkUser('u2', 'Claudine Uwase', 'PARKING_OWNER', { email: 'owner@parkwise.demo', phone: '0788100002', lotIds: ['l1', 'l2'] }),
    mkUser('u3', 'Eric Habimana', 'MANAGER', { email: 'manager@parkwise.demo', phone: '0788100004', lotIds: ['l1', 'l2'] }),
    mkUser('u4', 'Jean Bosco Niyonzima', 'ATTENDANT', { email: 'attendant@parkwise.demo', phone: '0788100003' }),
    mkUser('u5', 'Aline Mukamana', 'CASHIER', { email: 'cashier@parkwise.demo', phone: '0788100005' }),
    mkUser('u6', 'Patrick Nsengimana', 'ATTENDANT', { email: 'patrick@parkwise.demo', phone: '0788100006' }),
    mkUser('u7', 'Divine Ingabire', 'ATTENDANT', { email: 'disabled@parkwise.demo', phone: '0788100007', status: 'DISABLED' }),
  ].map((u) => ({ ...u, password: DEMO_PASSWORD, permissions: DEFAULT_ROLE_PERMISSIONS[u.role] }));

  const rule = (id, lotId, vehicleType, grace, fb, fp, ab, ap, max, extra = {}) => ({ id, lotId, vehicleType, gracePeriodMinutes: grace, firstBlockMinutes: fb, firstBlockPrice: fp, additionalBlockMinutes: ab, additionalBlockPrice: ap, dailyMaxPrice: max, effectiveFrom: '2026-01-01', status: 'ACTIVE', updatedBy: { id: 'u2', name: 'Claudine Uwase' }, updatedAt: iso(hoursAgo(24 * 30)), ...extra });
  const pricingRules = [
    rule('pr1', 'l1', 'CAR', 10, 60, 500, 60, 300, 4000),
    rule('pr2', 'l1', 'MOTORCYCLE', 10, 60, 200, 60, 100, 1500),
    rule('pr3', 'l1', 'TRUCK', 15, 60, 1000, 60, 600, 8000),
    rule('pr4', 'l2', 'CAR', 10, 60, 600, 60, 400, 5000),
    rule('pr5', 'l2', 'MOTORCYCLE', 10, 60, 250, 60, 150, 1800),
    rule('pr6', 'l2', 'TRUCK', 15, 60, 1200, 60, 700, 9000),
    rule('pr0', 'l1', 'CAR', 5, 60, 400, 60, 250, 3500, { status: 'INACTIVE', effectiveFrom: '2025-06-01', effectiveTo: '2025-12-31' }),
  ];

  const vehicles = [];
  const sessions = [];
  const payments = [];
  const receipts = [];
  const audit = [];
  let n = 100;
  const ticketOf = (ms) => `PKG-${dayKey(iso(ms)).replace(/-/g, '')}-${String(++n).padStart(6, '0')}`;
  const vehicleFor = (plateText, type, phone, owner) => {
    let v = vehicles.find((x) => x.plateNumber === normPlate(plateText));
    if (!v) { v = { id: `v_${vehicles.length + 1}`, plateNumber: normPlate(plateText), displayPlate: plateText.toUpperCase(), vehicleType: type, ownerPhone: phone, ownerName: owner, createdAt: iso(hoursAgo(300)) }; vehicles.push(v); }
    return v;
  };
  const logAudit = (ms, actor, action, entityType, entityId, metadata) => audit.push({ id: `a_${audit.length + 1}`, actor: { id: actor.id, name: actor.name }, action, entityType, entityId, metadata, createdAt: iso(ms), ipAddress: '10.0.0.' + (10 + Math.floor(R() * 40)) });
  const photo = (kind, sess) => ({ key: `demo-${kind}-${sess}`, url: `/api/v1/uploads/photos/demo-${kind}-${sess}`, capturedAt: iso(Date.now()), contentType: 'image/svg+xml', bytes: 2048 });

  const attendants = [users[3], users[5]];
  const owner = users[1];
  const cashier = users[4];
  const rules = (lotId, type) => pricingRules.find((r) => r.lotId === lotId && r.status === 'ACTIVE' && (r.vehicleType === type || type === 'OTHER' && r.vehicleType === 'CAR'));

  // ---- completed sessions over the last 7 days (for reports/history) ----
  const completedCount = 46;
  for (let i = 0; i < completedCount; i++) {
    const type = pick(['CAR', 'CAR', 'CAR', 'CAR', 'MOTORCYCLE', 'TRUCK']);
    const lotId = R() < 0.85 ? 'l1' : 'l2';
    const slot = slots.find((s) => s.lotId === lotId && (s.vehicleType === type || s.vehicleType === 'ANY'));
    const dayBack = i < 9 ? 0 : 1 + Math.floor(R() * 6);
    const entryMs = (dayBack === 0 ? hoursAgo(1 + R() * 9) : hoursAgo(dayBack * 24 + 2 + R() * 10));
    const dur = 20 + Math.floor(R() * 420);
    const exitMs = entryMs + dur * 60000;
    if (exitMs > Date.now() - 600000) continue;
    const r = rules(lotId, type);
    const priced = priceSession(r, dur);
    const plateText = plate(type);
    const v = vehicleFor(plateText, type, `07881${String(10000 + Math.floor(R() * 89999))}`, null);
    const att = pick(attendants);
    const method = pick(['CASH', 'CASH', 'MTN_MOMO', 'MTN_MOMO', 'AIRTEL_MONEY']);
    const sid = `s_${n + 1}`;
    const session = {
      id: sid, ticketNumber: ticketOf(entryMs), status: 'COMPLETED', lotId, vehicleId: v.id, slotId: slot.id, entryTime: iso(entryMs), exitTime: iso(exitMs),
      durationMinutes: dur, amountDue: priced.total, createdBy: att.id, closedBy: (method === 'CASH' ? cashier : att).id, entryPhoto: photo('entry', sid), exitPhoto: photo('exit', sid),
      checkout: null, createdAt: iso(entryMs),
    };
    session.checkout = { pricingRule: { id: r.id, name: `${r.vehicleType} standard`, vehicleType: r.vehicleType }, breakdown: priced.breakdown, total: priced.total, billedUnits: undefined, gracePeriodApplied: priced.gracePeriodApplied, dailyMaxApplied: priced.dailyMaxApplied };
    sessions.push(session);
    if (priced.total > 0) {
      if (R() < 0.1) {
        payments.push({ id: `p_${payments.length + 1}`, sessionId: sid, amount: priced.total, method: 'MTN_MOMO', status: 'FAILED', transactionReference: `TX-${sid}-F`, maskedPhone: '078****210', failureReason: 'Customer did not approve the request', createdAt: iso(exitMs + 60000), initiatedBy: att.id });
      }
      const pid = `p_${payments.length + 1}`;
      payments.push({ id: pid, sessionId: sid, amount: priced.total, method, status: 'SUCCESS', transactionReference: `TX-${sid}`, providerReference: method === 'CASH' ? undefined : `PRV-${1000 + payments.length}`, maskedPhone: method === 'CASH' ? undefined : '078****' + String(100 + Math.floor(R() * 899)), initiatedBy: att.id, confirmedBy: method === 'CASH' ? cashier.id : undefined, createdAt: iso(exitMs + 120000), paidAt: iso(exitMs + 150000) });
      receipts.push({ id: `r_${receipts.length + 1}`, receiptNumber: `RCT-${dayKey(iso(exitMs)).replace(/-/g, '')}-${String(receipts.length + 1).padStart(5, '0')}`, sessionId: sid, paymentId: pid, issuedAt: iso(exitMs + 150000), reprintCount: 0 });
    }
    logAudit(entryMs, att, 'SESSION_CREATED', 'parking_session', sid, { slot: slot.slotNumber });
    logAudit(exitMs + 150000, method === 'CASH' ? cashier : att, 'PAYMENT_SUCCEEDED', 'payment', sid, { method, amount: priced.total });
  }

  // ---- currently parked vehicles (some old enough to look "long") ----
  const activeSpecs = [
    ['CAR', 18, 'l1-A1'], ['CAR', 42, 'l1-A2'], ['CAR', 95, 'l1-A3'], ['CAR', 160, 'l1-A4'], ['MOTORCYCLE', 55, 'l1-B1'], ['MOTORCYCLE', 210, 'l1-B2'],
    ['CAR', 320, 'l1-A5'], ['TRUCK', 130, 'l1-C1'], ['CAR', 28, 'l1-A9'], ['CAR', 75, 'l1-A10'], ['CAR', 2100, 'l1-A11'], ['CAR', 50, 'l2-D1'], ['CAR', 190, 'l2-D2'],
  ];
  activeSpecs.forEach(([type, minsAgo, slotId], idx) => {
    const slot = slots.find((s) => s.id === slotId);
    const entryMs = minutesAgo(minsAgo);
    const plateText = idx === 0 ? 'RAD 123 A' : plate(type);
    const v = vehicleFor(plateText, type, idx === 0 ? '0788123456' : `07884${String(10000 + Math.floor(R() * 89999))}`, idx === 0 ? 'Demo customer' : null);
    const att = pick(attendants);
    const sid = `s_${n + 1}`;
    sessions.push({ id: sid, ticketNumber: idx === 0 ? 'PKG-DEMO-000123' : ticketOf(entryMs), status: 'ACTIVE', lotId: slot.lotId, vehicleId: v.id, slotId: slot.id, entryTime: iso(entryMs), createdBy: att.id, entryPhoto: photo('entry', sid), createdAt: iso(entryMs) });
    slot.status = 'OCCUPIED';
    logAudit(entryMs, att, 'SESSION_CREATED', 'parking_session', sid, { slot: slot.slotNumber });
  });

  // ---- one session already at EXIT_PENDING (cashier queue demo) ----
  {
    const slot = slots.find((s) => s.id === 'l1-A12');
    const entryMs = minutesAgo(250);
    const exitMs = minutesAgo(4);
    const dur = 246;
    const r = rules('l1', 'CAR');
    const priced = priceSession(r, dur);
    const v = vehicleFor('RAE 482 K', 'CAR', '0788777001', 'Marie Claire');
    const sid = `s_${n + 1}`;
    sessions.push({ id: sid, ticketNumber: ticketOf(entryMs), status: 'EXIT_PENDING', lotId: 'l1', vehicleId: v.id, slotId: slot.id, entryTime: iso(entryMs), exitTime: iso(exitMs), durationMinutes: dur, amountDue: priced.total, createdBy: 'u4', entryPhoto: photo('entry', sid), exitPhoto: photo('exit', sid), checkout: { pricingRule: { id: r.id, name: 'CAR standard', vehicleType: 'CAR' }, breakdown: priced.breakdown, total: priced.total, gracePeriodApplied: false, dailyMaxApplied: priced.dailyMaxApplied }, createdAt: iso(entryMs) });
    slot.status = 'OCCUPIED';
  }
  // ---- one session with a failed payment attempt ----
  {
    const slot = slots.find((s) => s.id === 'l1-A13');
    const entryMs = minutesAgo(140);
    const exitMs = minutesAgo(12);
    const dur = 128;
    const r = rules('l1', 'CAR');
    const priced = priceSession(r, dur);
    const v = vehicleFor('RAC 901 M', 'CAR', '0788777002', null);
    const sid = `s_${n + 1}`;
    sessions.push({ id: sid, ticketNumber: ticketOf(entryMs), status: 'PAYMENT_FAILED', lotId: 'l1', vehicleId: v.id, slotId: slot.id, entryTime: iso(entryMs), exitTime: iso(exitMs), durationMinutes: dur, amountDue: priced.total, createdBy: 'u6', entryPhoto: photo('entry', sid), exitPhoto: photo('exit', sid), checkout: { pricingRule: { id: r.id, name: 'CAR standard', vehicleType: 'CAR' }, breakdown: priced.breakdown, total: priced.total }, createdAt: iso(entryMs) });
    payments.push({ id: `p_${payments.length + 1}`, sessionId: sid, amount: priced.total, method: 'AIRTEL_MONEY', status: 'FAILED', transactionReference: `TX-${sid}-F`, maskedPhone: '073****455', failureReason: 'Request expired before the customer approved', createdAt: iso(minutesAgo(9)), initiatedBy: 'u6' });
    slot.status = 'OCCUPIED';
  }

  const notifications = [
    { id: 'n1', severity: 'warning', title: 'Long session', body: 'Ticket for slot A-011 has been parked for more than 24 hours.', sessionId: sessions.find((s) => s.slotId === 'l1-A11')?.id, read: false, createdAt: iso(minutesAgo(30)) },
    { id: 'n2', severity: 'danger', title: 'Payment failed', body: 'Airtel Money payment for slot A-013 was not confirmed.', sessionId: sessions.find((s) => s.slotId === 'l1-A13')?.id, read: false, createdAt: iso(minutesAgo(9)) },
    { id: 'n3', severity: 'info', title: 'Awaiting settlement', body: 'Slot A-012 exited and is waiting for payment.', sessionId: sessions.find((s) => s.slotId === 'l1-A12')?.id, read: false, createdAt: iso(minutesAgo(4)) },
    { id: 'n4', severity: 'info', title: 'Pricing updated', body: 'Car pricing for Downtown Lot A was changed by the owner.', read: true, createdAt: iso(hoursAgo(24 * 30)) },
  ];

  logAudit(hoursAgo(24 * 30), owner, 'PRICING_RULE_CHANGED', 'pricing_rule', 'pr1', { before: { firstBlockPrice: 400 }, after: { firstBlockPrice: 500 } });
  logAudit(hoursAgo(30), users[2], 'SLOT_OVERRIDE', 'parking_slot', 'l1-A7', { before: { status: 'AVAILABLE' }, after: { status: 'OUT_OF_SERVICE' }, reason: 'Damaged barrier post' });
  logAudit(hoursAgo(26), users[2], 'ROLE_CHANGED', 'user', 'u6', { before: { role: 'CASHIER' }, after: { role: 'ATTENDANT' }, reason: 'Moved to gate duty' });
  audit.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const policy = { requireCustomerPhone: true, requirePhotos: true, allowPhotoException: false, longSessionMinutes: 720, currency: 'RWF', timezone: 'Africa/Kigali', capabilities: { notifications: { sms: false }, publicTickets: false } };
  const paymentMethods = [
    { method: 'CASH', label: 'Cash', enabled: true, status: 'READY' },
    { method: 'MTN_MOMO', label: 'MTN MoMo', enabled: true, status: 'SANDBOX' },
    { method: 'AIRTEL_MONEY', label: 'Airtel Money', enabled: true, status: 'SANDBOX' },
    { method: 'CARD', label: 'Card', enabled: false, status: 'NOT_CONFIGURED' },
  ];
  const notifPrefs = { paymentFailed: true, longSession: true, dailySummary: false, channel: 'IN_APP' };
  return { organizations, lots, slots, users, pricingRules, vehicles, sessions, payments, receipts, audit, notifications, policy, paymentMethods, notifPrefs, idemp: new Map(), ticketSeq: n, receiptSeq: receipts.length, paymentSeq: payments.length };
}
