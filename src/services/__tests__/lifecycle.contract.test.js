// Contract test: runs the real service layer against the mock adapter. Point it at a real staging API
// (VITE_USE_MOCKS=false) to validate the backend against the same expectations.
import { describe, it, expect, beforeAll } from 'vitest';
import { installMocks } from '@/mocks/install.js';
import { authService } from '../authService.js';
import { parkingService } from '../parkingService.js';
import { sessionService } from '../sessionService.js';
import { paymentService } from '../paymentService.js';
import { receiptService } from '../receiptService.js';
import { uploadService } from '../uploadService.js';
import { reportService } from '../reportService.js';
import { tokenStore } from '../tokenStore.js';
import { controls } from '@/mocks/db.js';

const login = (who) => authService.login({ identifier: `${who}@parkwise.demo`, password: 'demo1234' });
const photo = () => new File([new Uint8Array(1200)], 'p.jpg', { type: 'image/jpeg' });

describe('parking lifecycle against the API contract', () => {
  beforeAll(() => { installMocks(); });

  it('rejects bad credentials and disabled accounts with stable codes', async () => {
    await expect(authService.login({ identifier: 'attendant@parkwise.demo', password: 'nope' })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    await expect(login('disabled')).rejects.toMatchObject({ code: 'ACCOUNT_DISABLED' });
  });

  it('returns role permissions from /me and enforces them', async () => {
    const { user } = await login('cashier');
    expect(user.role).toBe('CASHIER');
    expect(user.permissions).not.toContain('sessions.create');
    await expect(sessionService.create({})).rejects.toMatchObject({ code: 'FORBIDDEN', kind: 'forbidden' });
  });

  it('entry -> active -> checkout -> cash payment -> receipt, releasing the slot only on completion', async () => {
    const { user } = await login('manager');
    const lotId = user.lots[0].id;
    const slots = await parkingService.listSlots(lotId, { status: 'AVAILABLE', vehicleType: 'CAR' });
    const slot = slots[0];
    const up = await uploadService.uploadVehiclePhoto({ file: photo(), captureType: 'ENTRY', lotId });
    expect(up.url).toBeTruthy();

    const created = await sessionService.create({ lotId, slotId: slot.id, plateNumber: 'RAZ 777 Z', vehicleType: 'CAR', customerPhone: '0788000999', entryPhotoUrl: up.url }, 'k1');
    expect(created.status).toBe('ACTIVE');
    expect(created.ticketNumber).toMatch(/^PKG-\d{8}-\d{6}$/);
    expect(created.entryTime).toBeTruthy();

    const dup = await sessionService.create({ lotId, slotId: slot.id, plateNumber: 'RAZ 777 Z', vehicleType: 'CAR', customerPhone: '0788000999', entryPhotoUrl: up.url }, 'k1');
    expect(dup.id).toBe(created.id); // idempotent

    await expect(sessionService.create({ lotId, slotId: slot.id, plateNumber: 'RAY 111 Y', vehicleType: 'CAR', customerPhone: '0788000998', entryPhotoUrl: up.url })).rejects.toMatchObject({ code: 'SLOT_CONFLICT' });

    const found = await sessionService.search({ q: 'raz777z', lotId });
    expect(found.items.map((s) => s.id)).toContain(created.id);

    const exitUp = await uploadService.uploadVehiclePhoto({ file: photo(), captureType: 'EXIT', lotId });
    const checkout = await sessionService.checkout(created.id, { exitPhotoUrl: exitUp.url }, 'c1');
    expect(Number.isInteger(checkout.total)).toBe(true);
    expect(checkout.total).toBeGreaterThan(0);
    expect(checkout.breakdown.length).toBeGreaterThan(0);

    await expect(paymentService.create(created.id, { method: 'CASH', amount: checkout.total + 1, amountReceived: checkout.total + 1 }, 'pm0')).rejects.toMatchObject({ code: 'AMOUNT_MISMATCH' });
    const pay = await paymentService.create(created.id, { method: 'CASH', amount: checkout.total, amountReceived: checkout.total }, 'pm1');
    expect(pay.status).toBe('SUCCESS');

    const after = await sessionService.get(created.id);
    expect(after.status).toBe('COMPLETED');
    const slotAfter = (await parkingService.listSlots(lotId, {})).find((s) => s.id === slot.id);
    expect(slotAfter.status).toBe('AVAILABLE');
    const receipt = await sessionService.receiptFor(created.id);
    expect(receipt.total).toBe(checkout.total);
    expect((await receiptService.get(receipt.id)).receiptNumber).toBe(receipt.receiptNumber);
  });

  it('mobile money stays PENDING until the (simulated) provider confirms; a second request is blocked', async () => {
    controls.momoDelaySeconds = 0.2;
    await login('manager');
    const lotId = 'l1';
    const slot = (await parkingService.listSlots(lotId, { status: 'AVAILABLE', vehicleType: 'CAR' }))[0];
    const up = await uploadService.uploadVehiclePhoto({ file: photo(), captureType: 'ENTRY', lotId });
    const s = await sessionService.create({ lotId, slotId: slot.id, plateNumber: 'RAB 555 B', vehicleType: 'CAR', customerPhone: '0788000555', entryPhotoUrl: up.url });
    const co = await sessionService.checkout(s.id, { exitPhotoUrl: up.url });
    const pay = await paymentService.create(s.id, { method: 'MTN_MOMO', amount: co.total, phone: '0788123456' }, 'mm1');
    expect(pay.status).toBe('PENDING');
    expect((await sessionService.get(s.id)).status).toBe('PAYMENT_PENDING');
    await expect(paymentService.create(s.id, { method: 'MTN_MOMO', amount: co.total, phone: '0788123456' }, 'mm2')).rejects.toMatchObject({ code: 'PAYMENT_ALREADY_PENDING' });
    await new Promise((r) => setTimeout(r, 400));
    const settled = await paymentService.get(pay.id);
    expect(settled.status).toBe('SUCCESS');
    expect((await sessionService.get(s.id)).status).toBe('COMPLETED');
  });

  it('dashboard separates confirmed revenue from pending and never exceeds confirmed payments', async () => {
    await login('owner');
    const d = await reportService.dashboard({});
    expect(d.basis).toBe('CONFIRMED');
    expect(d.cashRevenue + d.mobileMoneyRevenue).toBe(d.confirmedRevenue);
    expect(d.pendingPayments).toHaveProperty('count');
  });

  it('clears the token on logout', async () => {
    await login('attendant');
    await authService.logout();
    expect(tokenStore.get()).toBeNull();
  });
});
