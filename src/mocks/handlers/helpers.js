import { db } from '../db.js';
import { ApiError, iso, nextId, dayKey } from '../util.js';
import { P } from '@/constants/permissions.js';

export const can = (user, perm) => user.permissions.includes(perm);
export const requirePerm = (user, perm) => { if (!can(user, perm)) throw new ApiError(403, 'FORBIDDEN', 'Forbidden'); };
export const userRef = (id) => { const u = db.users.find((x) => x.id === id); return u ? { id: u.id, name: u.name } : undefined; };
export const lotOf = (id) => db.lots.find((l) => l.id === id);
export const slotOf = (id) => db.slots.find((s) => s.id === id);
export const vehicleOf = (id) => db.vehicles.find((v) => v.id === id);

/** Lots the user may touch. */
export function lotIdsFor(user) {
  if (user.role === 'SUPER_ADMIN') return [];
  if (user.role === 'PARKING_OWNER') return db.lots.filter((l) => l.organizationId === user.organizationId).map((l) => l.id);
  return user.lotIds;
}
export function scopeLots(user, requested) {
  const allowed = lotIdsFor(user);
  if (requested) {
    if (!allowed.includes(requested)) throw new ApiError(403, 'FORBIDDEN', 'Forbidden');
    return [requested];
  }
  return allowed;
}

export function audit(actor, action, entityType, entityId, metadata) {
  db.audit.unshift({ id: nextId('a'), actor: { id: actor.id, name: actor.name }, action, entityType, entityId, metadata, createdAt: iso(), ipAddress: '10.0.0.5' });
}
export function notify(severity, title, body, sessionId) {
  db.notifications.unshift({ id: nextId('n'), severity, title, body, sessionId, read: false, createdAt: iso() });
}

export const photoOut = (p) => (p ? { ...p, uploadedBy: undefined } : undefined);

export function allowedActions(s, user) {
  const out = [];
  const checkoutAmt = s.checkout?.total;
  if (s.status === 'ACTIVE') {
    if (can(user, P.SESSIONS_CHECKOUT)) out.push('CHECKOUT');
    if (can(user, P.SESSIONS_OVERRIDE)) out.push('CANCEL');
  } else if (s.status === 'EXIT_PENDING' || s.status === 'PAYMENT_FAILED') {
    if (can(user, P.PAYMENTS_COLLECT) || can(user, P.PAYMENTS_CONFIRM_CASH)) out.push('PAY');
    if (checkoutAmt === 0 && can(user, P.SESSIONS_CHECKOUT)) out.push('COMPLETE');
    else if (can(user, P.SESSIONS_OVERRIDE)) out.push('COMPLETE');
  } else if (s.status === 'PAYMENT_PENDING' || s.status === 'DISPUTED') {
    if (can(user, P.SESSIONS_OVERRIDE)) out.push('COMPLETE');
  }
  return out;
}

export function checkoutDTO(s) {
  if (!s.checkout) return undefined;
  return {
    entryTime: s.entryTime, exitTime: s.exitTime, durationMinutes: s.durationMinutes,
    pricingRule: s.checkout.pricingRule, breakdown: s.checkout.breakdown, total: s.checkout.total, currency: 'RWF',
    gracePeriodApplied: !!s.checkout.gracePeriodApplied, dailyMaxApplied: !!s.checkout.dailyMaxApplied,
    enabledPaymentMethods: db.paymentMethods.filter((m) => m.enabled).map((m) => m.method),
  };
}

export function paymentDTO(p) {
  const s = db.sessions.find((x) => x.id === p.sessionId);
  return {
    id: p.id, sessionId: p.sessionId, ticketNumber: s?.ticketNumber, amount: p.amount, currency: 'RWF', method: p.method, status: p.status,
    transactionReference: p.transactionReference, providerReference: p.providerReference, maskedPhone: p.maskedPhone,
    initiatedBy: userRef(p.initiatedBy), confirmedBy: userRef(p.confirmedBy), failureReason: p.failureReason,
    createdAt: p.createdAt, paidAt: p.paidAt, expiresAt: p.expiresAt,
  };
}

export function vehicleDTO(v) {
  return { id: v.id, plateNumber: v.plateNumber, displayPlate: v.displayPlate, vehicleType: v.vehicleType, ownerName: v.ownerName, ownerPhone: v.ownerPhone };
}

export function sessionDTO(s, user, { detail = false } = {}) {
  const slot = slotOf(s.slotId);
  const lot = lotOf(s.lotId);
  const receipt = db.receipts.find((r) => r.sessionId === s.id);
  const dto = {
    id: s.id, ticketNumber: s.ticketNumber, status: s.status, lotId: s.lotId, lotName: lot?.name, vehicle: vehicleDTO(vehicleOf(s.vehicleId)),
    slot: { id: slot.id, slotNumber: slot.slotNumber }, entryTime: s.entryTime, exitTime: s.exitTime, durationMinutes: s.durationMinutes,
    amountDue: s.amountDue, currency: 'RWF', entryPhoto: photoOut(s.entryPhoto), exitPhoto: photoOut(s.exitPhoto),
    createdBy: userRef(s.createdBy), closedBy: userRef(s.closedBy), allowedActions: allowedActions(s, user), receiptId: receipt?.id, serverTime: iso(),
  };
  if (detail) {
    dto.payments = db.payments.filter((p) => p.sessionId === s.id).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).map(paymentDTO);
    dto.checkout = checkoutDTO(s);
  }
  return dto;
}

export function receiptDTO(r) {
  const s = db.sessions.find((x) => x.id === r.sessionId);
  const p = db.payments.find((x) => x.id === r.paymentId);
  const v = vehicleOf(s.vehicleId);
  const lot = lotOf(s.lotId);
  const org = db.organizations.find((o) => o.id === lot.organizationId);
  return {
    id: r.id, receiptNumber: r.receiptNumber, ticketNumber: s.ticketNumber, sessionId: s.id, lotName: lot.name, organizationName: org.name,
    vehicle: { plateNumber: v.displayPlate, vehicleType: v.vehicleType }, slotNumber: slotOf(s.slotId).slotNumber, entryTime: s.entryTime, exitTime: s.exitTime,
    durationMinutes: s.durationMinutes, breakdown: (s.checkout?.breakdown || []).map((b) => ({ label: b.label, amount: b.amount })), total: p.amount, currency: 'RWF',
    payment: { method: p.method, transactionReference: p.transactionReference, paidAt: p.paidAt, confirmedBy: userRef(p.confirmedBy || p.initiatedBy)?.name },
    issuedAt: r.issuedAt, reprintCount: r.reprintCount,
  };
}

/** The only place a session completes and a slot is released (one atomic step, as the Blueprint requires). */
export function completeSession(s, actor, paymentId, { reason } = {}) {
  s.status = 'COMPLETED';
  s.closedBy = actor.id;
  const slot = slotOf(s.slotId);
  slot.status = 'AVAILABLE';
  slot.version += 1;
  let receipt = db.receipts.find((r) => r.sessionId === s.id);
  if (!receipt && paymentId) {
    const p = db.payments.find((x) => x.id === paymentId);
    receipt = { id: nextId('r'), receiptNumber: `RCT-${dayKey(iso()).replace(/-/g, '')}-${String(++db.receiptSeq).padStart(5, '0')}`, sessionId: s.id, paymentId, issuedAt: p?.paidAt || iso(), reprintCount: 0 };
    db.receipts.unshift(receipt);
  }
  audit(actor, 'SESSION_COMPLETED', 'parking_session', s.id, { slot: slot.slotNumber, reason });
  return receipt;
}

/** Simulated provider callback for mobile money (DEMO). Resolves lazily when the UI polls. */
export function settlePendingIfDue(p, controls) {
  if (p.status !== 'PENDING' || Date.now() < p.resolveAt) return;
  const s = db.sessions.find((x) => x.id === p.sessionId);
  const fail = controls.momoOutcome === 'fail' || p.maskedPhone?.endsWith('000');
  if (fail) {
    p.status = 'FAILED';
    p.failureReason = 'Customer did not approve the request';
    s.status = 'PAYMENT_FAILED';
    audit({ id: 'provider', name: 'Provider callback' }, 'PAYMENT_FAILED', 'payment', p.id, { method: p.method });
    notify('danger', 'Payment failed', `${p.method === 'MTN_MOMO' ? 'MTN MoMo' : 'Airtel Money'} payment for ${s.ticketNumber} was not confirmed.`, s.id);
  } else {
    p.status = 'SUCCESS';
    p.paidAt = iso();
    p.providerReference = `PRV-${Math.floor(100000 + Math.random() * 899999)}`;
    completeSession(s, { id: p.initiatedBy, name: userRef(p.initiatedBy)?.name }, p.id);
    audit({ id: 'provider', name: 'Provider callback' }, 'PAYMENT_SUCCEEDED', 'payment', p.id, { method: p.method, amount: p.amount });
  }
}
