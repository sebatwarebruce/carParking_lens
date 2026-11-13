import { db, controls } from '../db.js';
import { ApiError, iso, nextId, normPlate, normPhone, paginate, dayKey } from '../util.js';
import { priceSession } from '../pricingEngine.js';
import { P } from '@/constants/permissions.js';
import { slotFits } from '@/constants/vehicleTypes.js';
import {
  can, requirePerm, lotOf, slotOf, vehicleOf, userRef, scopeLots, lotIdsFor, audit, notify, sessionDTO, vehicleDTO, paymentDTO,
  checkoutDTO, completeSession, settlePendingIfDue, receiptDTO,
} from './helpers.js';

const lotDTO = (l) => {
  const slots = db.slots.filter((s) => s.lotId === l.id);
  return { ...l, capacity: { total: slots.length, available: slots.filter((s) => s.status === 'AVAILABLE').length, occupied: slots.filter((s) => s.status === 'OCCUPIED').length, outOfService: slots.filter((s) => s.status === 'OUT_OF_SERVICE').length } };
};
const slotDTO = (s, user) => {
  const dto = { id: s.id, lotId: s.lotId, slotNumber: s.slotNumber, zone: s.zone, vehicleType: s.vehicleType, status: s.status, outOfServiceReason: s.outOfServiceReason, version: s.version };
  if (s.status === 'OCCUPIED' && can(user, P.SESSIONS_VIEW)) {
    const sess = db.sessions.find((x) => x.slotId === s.id && !['COMPLETED', 'CANCELLED'].includes(x.status));
    if (sess) dto.currentSession = { id: sess.id, ticketNumber: sess.ticketNumber, plateNumber: vehicleOf(sess.vehicleId).displayPlate };
  }
  return dto;
};

export const opsHandlers = {
  // ---------- lots & slots ----------
  listLots({ user }) { requirePerm(user, P.LOTS_VIEW); return { data: lotIdsFor(user).map((id) => lotDTO(lotOf(id))) }; },
  getLot({ user, params }) { requirePerm(user, P.LOTS_VIEW); scopeLots(user, params.id); return { data: lotDTO(lotOf(params.id)) }; },
  createLot({ user, body }) {
    requirePerm(user, P.LOTS_MANAGE);
    const lot = { id: nextId('l'), organizationId: user.organizationId, name: body.name, address: body.address, contact: body.contact, timezone: 'Africa/Kigali', status: 'ACTIVE' };
    db.lots.push(lot); audit(user, 'LOT_CREATED', 'parking_lot', lot.id, { name: lot.name });
    return { status: 201, data: lotDTO(lot) };
  },
  updateLot({ user, params, body }) {
    requirePerm(user, P.LOTS_MANAGE); scopeLots(user, params.id);
    const lot = lotOf(params.id); const before = { ...lot };
    Object.assign(lot, ['name', 'address', 'contact', 'status'].reduce((a, k) => (body[k] !== undefined ? { ...a, [k]: body[k] } : a), {}));
    audit(user, 'LOT_UPDATED', 'parking_lot', lot.id, { before, after: { ...lot } });
    return { data: lotDTO(lot) };
  },
  listSlots({ user, params, query }) {
    requirePerm(user, P.SLOTS_VIEW); scopeLots(user, params.id);
    let slots = db.slots.filter((s) => s.lotId === params.id);
    if (query.status) slots = slots.filter((s) => s.status === query.status);
    if (query.vehicleType) slots = slots.filter((s) => slotFits(s.vehicleType, query.vehicleType));
    if (query.zone) slots = slots.filter((s) => s.zone === query.zone);
    if (query.q) slots = slots.filter((s) => s.slotNumber.toLowerCase().includes(String(query.q).toLowerCase()));
    return { data: slots.map((s) => slotDTO(s, user)) };
  },
  createSlots({ user, params, body }) {
    requirePerm(user, P.LOTS_MANAGE); scopeLots(user, params.id);
    const created = [];
    for (let i = Number(body.from); i <= Number(body.to); i++) {
      const slotNumber = `${body.prefix}-${String(i).padStart(3, '0')}`;
      if (db.slots.some((s) => s.lotId === params.id && s.slotNumber === slotNumber)) continue;
      const s = { id: nextId('slot'), lotId: params.id, slotNumber, zone: body.zone, vehicleType: body.vehicleType, status: 'AVAILABLE', version: 0 };
      db.slots.push(s); created.push(slotDTO(s, user));
    }
    audit(user, 'SLOTS_CREATED', 'parking_lot', params.id, { count: created.length });
    return { status: 201, data: created };
  },
  updateSlot({ user, params, body }) {
    requirePerm(user, P.SLOTS_MANAGE);
    const slot = slotOf(params.id);
    if (!slot) throw new ApiError(404, 'NOT_FOUND', 'Slot not found');
    scopeLots(user, slot.lotId);
    const before = { status: slot.status, vehicleType: slot.vehicleType, zone: slot.zone };
    if (body.status) {
      if (slot.status === 'OCCUPIED') throw new ApiError(409, 'INVALID_STATE_TRANSITION', 'Occupied slots cannot be changed');
      if (body.status === 'OUT_OF_SERVICE' && !body.reason) throw new ApiError(422, 'VALIDATION_ERROR', 'Reason required', { fields: { reason: 'A reason is required' } });
      slot.status = body.status;
      slot.outOfServiceReason = body.status === 'OUT_OF_SERVICE' ? body.reason : undefined;
    }
    if (body.vehicleType) slot.vehicleType = body.vehicleType;
    if (body.zone !== undefined) slot.zone = body.zone;
    slot.version += 1;
    audit(user, 'SLOT_OVERRIDE', 'parking_slot', slot.id, { before, after: { status: slot.status, vehicleType: slot.vehicleType, zone: slot.zone }, reason: body.reason });
    return { data: slotDTO(slot, user) };
  },

  // ---------- vehicles ----------
  listVehicles({ user, query }) {
    requirePerm(user, P.VEHICLES_VIEW);
    const q = String(query.q || '').toLowerCase();
    const lots = lotIdsFor(user);
    const mine = new Set(db.sessions.filter((s) => lots.includes(s.lotId)).map((s) => s.vehicleId));
    let list = db.vehicles.filter((v) => mine.has(v.id));
    if (q) list = list.filter((v) => v.plateNumber.toLowerCase().includes(normPlate(q).toLowerCase()) || normPhone(v.ownerPhone).includes(normPhone(q)) || (v.ownerName || '').toLowerCase().includes(q));
    const page = paginate(list, query);
    return { data: { ...page, items: page.items.map((v) => ({ ...vehicleDTO(v), visits: db.sessions.filter((s) => s.vehicleId === v.id).length })) } };
  },
  getVehicle({ user, params }) {
    requirePerm(user, P.VEHICLES_VIEW);
    const v = vehicleOf(params.id); if (!v) throw new ApiError(404, 'NOT_FOUND', 'Vehicle not found');
    return { data: { ...vehicleDTO(v), visits: db.sessions.filter((s) => s.vehicleId === v.id).length } };
  },
  vehicleSessions({ user, params, query }) {
    requirePerm(user, P.VEHICLES_VIEW);
    const lots = lotIdsFor(user);
    const list = db.sessions.filter((s) => s.vehicleId === params.id && lots.includes(s.lotId)).sort((a, b) => (a.entryTime < b.entryTime ? 1 : -1));
    const page = paginate(list, query);
    return { data: { ...page, items: page.items.map((s) => sessionDTO(s, user)) } };
  },
  registerVehicle({ user, body }) {
    requirePerm(user, P.VEHICLES_MANAGE);
    const plate = normPlate(body.plateNumber);
    if (db.vehicles.some((v) => v.plateNumber === plate)) throw new ApiError(409, 'DUPLICATE_VEHICLE', 'Vehicle already registered');
    const v = { id: nextId('v'), plateNumber: plate, displayPlate: String(body.plateNumber).toUpperCase(), vehicleType: body.vehicleType, ownerPhone: body.customerPhone, ownerName: body.ownerName };
    db.vehicles.push(v);
    return { status: 201, data: vehicleDTO(v) };
  },

  // ---------- sessions ----------
  createSession({ user, body, headers }) {
    requirePerm(user, P.SESSIONS_CREATE);
    const key = headers['idempotency-key'];
    if (key && db.idemp.has(`entry:${key}`)) return { status: 201, data: db.idemp.get(`entry:${key}`) };
    const fields = {};
    if (!body.plateNumber || normPlate(body.plateNumber).length < 2) fields.plateNumber = 'Enter the plate number';
    if (!body.vehicleType) fields.vehicleType = 'Choose a vehicle type';
    if (db.policy.requireCustomerPhone && !body.customerPhone) fields.customerPhone = 'Enter the customer phone';
    if (db.policy.requirePhotos && !body.entryPhotoUrl) fields.entryPhoto = 'An entry photo is required';
    if (!body.slotId) fields.slotId = 'Choose a space';
    if (Object.keys(fields).length) throw new ApiError(422, 'VALIDATION_ERROR', 'Invalid', { fields });
    scopeLots(user, body.lotId);
    const slot = slotOf(body.slotId);
    if (controls.forceSlotConflictNext) {
      controls.forceSlotConflictNext = false;
      if (slot && slot.status === 'AVAILABLE') { slot.status = 'OCCUPIED'; slot.version += 1; } // another attendant "just took it"
      throw new ApiError(409, 'SLOT_CONFLICT', 'Slot taken', { slotId: body.slotId });
    }
    if (!slot || slot.lotId !== body.lotId) throw new ApiError(404, 'NOT_FOUND', 'Slot not found');
    if (slot.status !== 'AVAILABLE') throw new ApiError(409, 'SLOT_CONFLICT', 'Slot taken', { slotId: slot.id });
    if (!slotFits(slot.vehicleType, body.vehicleType)) throw new ApiError(422, 'VALIDATION_ERROR', 'Incompatible', { fields: { slotId: 'This space does not fit that vehicle type' } });
    const plate = normPlate(body.plateNumber);
    const dup = db.sessions.find((s) => vehicleOf(s.vehicleId).plateNumber === plate && !['COMPLETED', 'CANCELLED'].includes(s.status));
    if (dup) throw new ApiError(409, 'DUPLICATE_ACTIVE_SESSION', 'Already parked', { sessionId: dup.id });
    let v = db.vehicles.find((x) => x.plateNumber === plate);
    if (!v) { v = { id: nextId('v'), plateNumber: plate, displayPlate: String(body.plateNumber).toUpperCase().trim(), vehicleType: body.vehicleType, ownerPhone: body.customerPhone, ownerName: body.ownerName }; db.vehicles.push(v); }
    else { v.ownerPhone = body.customerPhone || v.ownerPhone; v.ownerName = body.ownerName || v.ownerName; }
    const now = Date.now();
    const photoKey = body.entryPhotoUrl ? String(body.entryPhotoUrl).split('/').pop() : null;
    const s = {
      id: nextId('s'), ticketNumber: `PKG-${dayKey(iso(now)).replace(/-/g, '')}-${String(++db.ticketSeq).padStart(6, '0')}`, status: 'ACTIVE', lotId: body.lotId, vehicleId: v.id,
      slotId: slot.id, entryTime: iso(now), createdBy: user.id, createdAt: iso(now),
      entryPhoto: body.entryPhotoUrl ? { key: photoKey, url: body.entryPhotoUrl, capturedAt: iso(now), contentType: 'image/jpeg', bytes: 0 } : undefined,
    };
    db.sessions.unshift(s);
    slot.status = 'OCCUPIED'; slot.version += 1;
    audit(user, 'SESSION_CREATED', 'parking_session', s.id, { slot: slot.slotNumber, plate: v.displayPlate });
    const out = sessionDTO(s, user, { detail: true });
    if (key) db.idemp.set(`entry:${key}`, out);
    return { status: 201, data: out };
  },
  listActive({ user, query }) {
    requirePerm(user, P.SESSIONS_VIEW);
    const lots = scopeLots(user, query.lotId);
    let list = db.sessions.filter((s) => lots.includes(s.lotId) && ['ACTIVE', 'EXIT_PENDING', 'PAYMENT_PENDING', 'PAYMENT_FAILED', 'DISPUTED'].includes(s.status));
    if (query.vehicleType) list = list.filter((s) => vehicleOf(s.vehicleId).vehicleType === query.vehicleType);
    if (query.attendantId) list = list.filter((s) => s.createdBy === query.attendantId);
    if (query.status) list = list.filter((s) => s.status === query.status);
    if (query.q) list = matchQuery(list, query.q);
    list.sort((a, b) => (a.entryTime < b.entryTime ? 1 : -1));
    const page = paginate(list, { pageSize: 100, ...query });
    return { data: { ...page, items: page.items.map((s) => sessionDTO(s, user)) } };
  },
  listSessions({ user, query }) {
    requirePerm(user, P.SESSIONS_VIEW);
    const lots = scopeLots(user, query.lotId);
    let list = db.sessions.filter((s) => lots.includes(s.lotId));
    if (query.status) list = list.filter((s) => s.status === query.status);
    if (query.vehicleType) list = list.filter((s) => vehicleOf(s.vehicleId).vehicleType === query.vehicleType);
    if (query.attendantId) list = list.filter((s) => s.createdBy === query.attendantId);
    if (query.slot) list = list.filter((s) => slotOf(s.slotId).slotNumber.toLowerCase().includes(String(query.slot).toLowerCase()));
    if (query.from) list = list.filter((s) => dayKey(s.entryTime) >= query.from);
    if (query.to) list = list.filter((s) => dayKey(s.entryTime) <= query.to);
    if (query.paymentStatus) list = list.filter((s) => db.payments.some((p) => p.sessionId === s.id && p.status === query.paymentStatus));
    if (query.q) list = matchQuery(list, query.q);
    const dir = String(query.sort || 'entryTime:desc').endsWith('asc') ? 1 : -1;
    list.sort((a, b) => (a.entryTime < b.entryTime ? -dir : dir));
    const page = paginate(list, query);
    return { data: { ...page, items: page.items.map((s) => sessionDTO(s, user)) } };
  },
  searchSessions({ user, query }) {
    requirePerm(user, P.SESSIONS_VIEW);
    const lots = scopeLots(user, query.lotId);
    let q = String(query.q || '').trim();
    if (query.by === 'qr' || /^https?:\/\//i.test(q)) q = q.split('/').filter(Boolean).pop();
    if (!q) return { data: { items: [] } };
    const open = db.sessions.filter((s) => lots.includes(s.lotId) && !['COMPLETED', 'CANCELLED'].includes(s.status));
    const list = matchQuery(open, q, query.by);
    return { data: { items: list.map((s) => sessionDTO(s, user)), page: 1, pageSize: list.length, total: list.length } };
  },
  getSession({ user, params }) {
    requirePerm(user, P.SESSIONS_VIEW);
    const s = db.sessions.find((x) => x.id === params.id);
    if (!s) throw new ApiError(404, 'SESSION_NOT_FOUND', 'Not found');
    scopeLots(user, s.lotId);
    db.payments.filter((p) => p.sessionId === s.id).forEach((p) => settlePendingIfDue(p, controls));
    return { data: sessionDTO(s, user, { detail: true }) };
  },
  checkout({ user, params, body, headers }) {
    requirePerm(user, P.SESSIONS_CHECKOUT);
    const s = db.sessions.find((x) => x.id === params.id);
    if (!s) throw new ApiError(404, 'SESSION_NOT_FOUND', 'Not found');
    scopeLots(user, s.lotId);
    if (['COMPLETED', 'CANCELLED'].includes(s.status)) throw new ApiError(409, 'SESSION_ALREADY_CLOSED', 'Closed');
    if (db.policy.requirePhotos && !body.exitPhotoUrl && !s.exitPhoto) throw new ApiError(422, 'VALIDATION_ERROR', 'Photo required', { fields: { exitPhoto: 'An exit photo is required' } });
    if (s.status !== 'ACTIVE') return { data: { ...checkoutDTO(s), session: sessionDTO(s, user, { detail: true }) } }; // idempotent re-read
    const v = vehicleOf(s.vehicleId);
    const rule = db.pricingRules.find((r) => r.lotId === s.lotId && r.status === 'ACTIVE' && (r.vehicleType === v.vehicleType || (v.vehicleType === 'OTHER' && r.vehicleType === 'CAR')));
    if (!rule) throw new ApiError(422, 'PRICING_UNAVAILABLE', 'No rule');
    const now = Date.now();
    const real = Math.max(1, Math.ceil((now - Date.parse(s.entryTime)) / 60000));
    const dur = Math.max(real, controls.minDemoMinutes); // DEMO ONLY: guarantees a billable duration for fresh entries
    const priced = priceSession(rule, dur);
    const key = body.exitPhotoUrl ? String(body.exitPhotoUrl).split('/').pop() : null;
    s.exitTime = iso(now); s.durationMinutes = dur; s.amountDue = priced.total; s.status = 'EXIT_PENDING';
    if (body.exitPhotoUrl) s.exitPhoto = { key, url: body.exitPhotoUrl, capturedAt: iso(now), contentType: 'image/jpeg', bytes: 0 };
    s.checkout = { pricingRule: { id: rule.id, name: `${rule.vehicleType} standard`, vehicleType: rule.vehicleType }, breakdown: priced.breakdown, total: priced.total, gracePeriodApplied: priced.gracePeriodApplied, dailyMaxApplied: priced.dailyMaxApplied };
    audit(user, 'CHECKOUT_STARTED', 'parking_session', s.id, { amount: priced.total, durationMinutes: dur, ruleId: rule.id });
    void headers;
    return { data: { ...checkoutDTO(s), session: sessionDTO(s, user, { detail: true }) } };
  },
  completeSession({ user, params, body }) {
    const s = db.sessions.find((x) => x.id === params.id);
    if (!s) throw new ApiError(404, 'SESSION_NOT_FOUND', 'Not found');
    scopeLots(user, s.lotId);
    if (['COMPLETED', 'CANCELLED'].includes(s.status)) throw new ApiError(409, 'SESSION_ALREADY_CLOSED', 'Closed');
    const free = s.status === 'EXIT_PENDING' && s.checkout?.total === 0;
    if (!free) requirePerm(user, P.SESSIONS_OVERRIDE); else requirePerm(user, P.SESSIONS_CHECKOUT);
    if (!body.reason || String(body.reason).trim().length < 3) throw new ApiError(422, 'VALIDATION_ERROR', 'Reason required', { fields: { reason: 'A reason is required' } });
    completeSession(s, user, null, { reason: body.reason });
    audit(user, free ? 'SESSION_COMPLETED_NO_FEE' : 'MANUAL_COMPLETION', 'parking_session', s.id, { reason: body.reason });
    return { data: sessionDTO(s, user, { detail: true }) };
  },
  cancelSession({ user, params, body }) {
    requirePerm(user, P.SESSIONS_OVERRIDE);
    const s = db.sessions.find((x) => x.id === params.id);
    if (!s) throw new ApiError(404, 'SESSION_NOT_FOUND', 'Not found');
    scopeLots(user, s.lotId);
    if (s.status !== 'ACTIVE') throw new ApiError(409, 'INVALID_STATE_TRANSITION', 'Only active sessions can be cancelled');
    if (!body.reason || String(body.reason).trim().length < 3) throw new ApiError(422, 'VALIDATION_ERROR', 'Reason required', { fields: { reason: 'A reason is required' } });
    s.status = 'CANCELLED'; s.closedBy = user.id;
    const slot = slotOf(s.slotId); slot.status = 'AVAILABLE'; slot.version += 1;
    audit(user, 'SESSION_CANCELLED', 'parking_session', s.id, { reason: body.reason });
    return { data: sessionDTO(s, user, { detail: true }) };
  },
  sessionReceipt({ user, params }) {
    requirePerm(user, P.RECEIPTS_VIEW);
    const r = db.receipts.find((x) => x.sessionId === params.id);
    if (!r) throw new ApiError(404, 'NOT_FOUND', 'No receipt yet');
    return { data: receiptDTO(r) };
  },

  // ---------- payments ----------
  createPayment({ user, params, body, headers }) {
    const key = headers['idempotency-key'];
    if (key && db.idemp.has(`pay:${key}`)) return { status: 201, data: db.idemp.get(`pay:${key}`) };
    const s = db.sessions.find((x) => x.id === params.id);
    if (!s) throw new ApiError(404, 'SESSION_NOT_FOUND', 'Not found');
    scopeLots(user, s.lotId);
    if (['COMPLETED', 'CANCELLED'].includes(s.status)) throw new ApiError(409, 'SESSION_ALREADY_CLOSED', 'Closed');
    if (db.payments.some((p) => p.sessionId === s.id && p.status === 'PENDING')) throw new ApiError(409, 'PAYMENT_ALREADY_PENDING', 'Pending');
    if (!['EXIT_PENDING', 'PAYMENT_FAILED'].includes(s.status)) throw new ApiError(409, 'INVALID_STATE_TRANSITION', 'Not ready for payment');
    if (!db.paymentMethods.find((m) => m.method === body.method && m.enabled)) throw new ApiError(422, 'VALIDATION_ERROR', 'Method unavailable', { fields: { method: 'That payment method is not enabled' } });
    if (body.amount !== s.checkout.total) throw new ApiError(409, 'AMOUNT_MISMATCH', 'Amount mismatch');
    const base = { id: nextId('p'), sessionId: s.id, amount: s.checkout.total, method: body.method, transactionReference: `TX-${s.id}-${Date.now().toString(36).toUpperCase()}`, initiatedBy: user.id, createdAt: iso() };
    let p;
    if (body.method === 'CASH') {
      requirePerm(user, P.PAYMENTS_CONFIRM_CASH);
      if (!Number.isInteger(body.amountReceived) || body.amountReceived < s.checkout.total) throw new ApiError(422, 'VALIDATION_ERROR', 'Amount received too low', { fields: { amountReceived: 'Amount received must cover the amount due' } });
      p = { ...base, status: 'SUCCESS', paidAt: iso(), confirmedBy: user.id };
      db.payments.unshift(p);
      completeSession(s, user, p.id);
      audit(user, 'PAYMENT_SUCCEEDED', 'payment', p.id, { method: 'CASH', amount: p.amount, amountReceived: body.amountReceived });
    } else {
      requirePerm(user, P.PAYMENTS_COLLECT);
      const digits = String(body.phone || '').replace(/\D/g, '');
      if (digits.length < 9) throw new ApiError(422, 'VALIDATION_ERROR', 'Invalid phone', { fields: { phone: 'Enter the customer mobile money number' } });
      p = { ...base, status: 'PENDING', maskedPhone: `${digits.slice(0, 3)}****${digits.slice(-3)}`, resolveAt: Date.now() + controls.momoDelaySeconds * 1000, expiresAt: iso(Date.now() + 120000) };
      db.payments.unshift(p);
      s.status = 'PAYMENT_PENDING';
      audit(user, 'PAYMENT_REQUESTED', 'payment', p.id, { method: p.method, amount: p.amount });
    }
    const out = paymentDTO(p);
    if (key) db.idemp.set(`pay:${key}`, out);
    return { status: 201, data: out };
  },
  getPayment({ user, params }) {
    requirePerm(user, P.PAYMENTS_VIEW);
    const p = db.payments.find((x) => x.id === params.id);
    if (!p) throw new ApiError(404, 'NOT_FOUND', 'Not found');
    settlePendingIfDue(p, controls);
    return { data: paymentDTO(p) };
  },
  listPayments({ user, query }) {
    requirePerm(user, P.PAYMENTS_VIEW);
    const lots = scopeLots(user, query.lotId);
    let list = db.payments.filter((p) => lots.includes(db.sessions.find((s) => s.id === p.sessionId)?.lotId));
    list.forEach((p) => settlePendingIfDue(p, controls));
    if (query.status) list = list.filter((p) => p.status === query.status);
    if (query.method) list = list.filter((p) => p.method === query.method);
    if (query.from) list = list.filter((p) => dayKey(p.createdAt) >= query.from);
    if (query.to) list = list.filter((p) => dayKey(p.createdAt) <= query.to);
    if (query.q) { const q = String(query.q).toLowerCase(); list = list.filter((p) => p.transactionReference.toLowerCase().includes(q) || db.sessions.find((s) => s.id === p.sessionId).ticketNumber.toLowerCase().includes(q)); }
    list = [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const page = paginate(list, query);
    return { data: { ...page, items: page.items.map(paymentDTO) } };
  },
  paymentQueue({ user, query }) {
    requirePerm(user, P.PAYMENTS_VIEW);
    const lots = scopeLots(user, query.lotId);
    db.payments.forEach((p) => settlePendingIfDue(p, controls));
    const list = db.sessions.filter((s) => lots.includes(s.lotId) && ['EXIT_PENDING', 'PAYMENT_PENDING', 'PAYMENT_FAILED'].includes(s.status)).sort((a, b) => ((a.exitTime || '') < (b.exitTime || '') ? -1 : 1));
    return { data: { items: list.map((s) => sessionDTO(s, user, { detail: true })), page: 1, pageSize: list.length, total: list.length } };
  },
  voidPayment({ user, params, body }) {
    requirePerm(user, P.PAYMENTS_VOID);
    const p = db.payments.find((x) => x.id === params.id);
    if (!p) throw new ApiError(404, 'NOT_FOUND', 'Not found');
    if (!body.reason || String(body.reason).trim().length < 3) throw new ApiError(422, 'VALIDATION_ERROR', 'Reason required', { fields: { reason: 'A reason is required' } });
    if (p.status !== 'SUCCESS') throw new ApiError(409, 'INVALID_STATE_TRANSITION', 'Only confirmed payments can be voided');
    p.status = 'REFUNDED';
    audit(user, 'PAYMENT_VOIDED', 'payment', p.id, { reason: body.reason, amount: p.amount });
    return { data: paymentDTO(p) };
  },

  // ---------- uploads ----------
  uploadPhoto({ user, body }) {
    requirePerm(user, P.SESSIONS_VIEW);
    if (controls.failNextUpload) { controls.failNextUpload = false; throw new ApiError(500, 'INTERNAL_ERROR', 'Upload failed'); }
    const file = body.get('file');
    if (!file || !/^image\//.test(file.type)) throw new ApiError(415, 'UPLOAD_INVALID_TYPE', 'Type');
    if (file.size > 12 * 1024 * 1024) throw new ApiError(413, 'UPLOAD_TOO_LARGE', 'Too large');
    const key = `up_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    db.photoBlobs = db.photoBlobs || new Map();
    db.photoBlobs.set(key, file);
    return { status: 201, data: { key, url: `/api/v1/uploads/photos/${key}`, capturedAt: iso(), contentType: file.type, bytes: file.size, captureType: body.get('captureType') } };
  },
  getPhoto({ user, params }) {
    requirePerm(user, P.SESSIONS_VIEW);
    const blob = db.photoBlobs?.get(params.key);
    if (blob) return { data: blob, raw: true };
    const sid = params.key.split('-').slice(2).join('-');
    const sess = db.sessions.find((s) => s.id === sid);
    const plate = sess ? vehicleOf(sess.vehicleId).displayPlate : 'DEMO';
    const kind = params.key.includes('exit') ? 'Exit' : 'Entry';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2623"/><stop offset="1" stop-color="#121110"/></linearGradient></defs><rect width="640" height="420" fill="url(#g)"/><rect x="120" y="190" width="400" height="110" rx="28" fill="#3a332e"/><rect x="170" y="140" width="300" height="80" rx="22" fill="#4a423b"/><circle cx="200" cy="310" r="38" fill="#0b0b0b" stroke="#C65D25" stroke-width="6"/><circle cx="440" cy="310" r="38" fill="#0b0b0b" stroke="#C65D25" stroke-width="6"/><rect x="250" y="262" width="140" height="40" rx="6" fill="#F5EBD8"/><text x="320" y="291" font-family="monospace" font-size="22" font-weight="700" text-anchor="middle" fill="#101010">${plate}</text><text x="24" y="36" font-family="sans-serif" font-size="16" fill="#E87932">Demo ${kind.toLowerCase()} photo (sample image)</text></svg>`;
    return { data: new Blob([svg], { type: 'image/svg+xml' }), raw: true };
  },
};

function matchQuery(list, rawQ, by) {
  const q = String(rawQ).trim().toLowerCase();
  const plate = normPlate(rawQ).toLowerCase();
  const digits = normPhone(rawQ);
  return list.filter((s) => {
    const v = vehicleOf(s.vehicleId);
    const hit = {
      ticket: s.ticketNumber.toLowerCase().includes(q),
      plate: plate.length >= 2 && v.plateNumber.toLowerCase().includes(plate),
      phone: digits.length >= 4 && normPhone(v.ownerPhone).includes(digits),
      slot: slotOf(s.slotId).slotNumber.toLowerCase() === q || slotOf(s.slotId).slotNumber.toLowerCase().replace('-0', '-').includes(q),
      qr: s.ticketNumber.toLowerCase() === q,
    };
    return by && hit[by] !== undefined ? hit[by] : Object.values(hit).some(Boolean);
  });
}
void userRef;
void notify;
