import { describe, it, expect } from 'vitest';
import { navFor, dockFor } from '@/constants/nav.js';
import { DEFAULT_ROLE_PERMISSIONS } from '@/constants/permissions.js';

const userOf = (role) => ({ role, permissions: DEFAULT_ROLE_PERMISSIONS[role] });
const routes = (role) => navFor(userOf(role)).flatMap((g) => g.items.map((i) => i.to));

describe('role-aware navigation (UX only; the backend enforces)', () => {
  it('attendant sees operations but never pricing, staff, reports or audit', () => {
    const r = routes('ATTENDANT');
    expect(r).toEqual(expect.arrayContaining(['/home', '/entry', '/exit', '/spaces']));
    ['/pricing', '/staff', '/reports', '/audit', '/settings', '/organizations'].forEach((p) => expect(r).not.toContain(p));
  });
  it('cashier gets the payment queue and receipts, not entry/exit', () => {
    const r = routes('CASHIER');
    expect(r).toEqual(expect.arrayContaining(['/cashier', '/payments', '/receipts']));
    ['/entry', '/exit', '/pricing'].forEach((p) => expect(r).not.toContain(p));
    expect(navFor(userOf('CASHIER')).flatMap((g) => g.items).find((i) => i.to === '/payments').label).toBe('Payment queue');
  });
  it('owner manages configuration; manager can operate; super admin is platform-only', () => {
    expect(routes('PARKING_OWNER')).toEqual(expect.arrayContaining(['/dashboard', '/pricing', '/staff', '/reports', '/audit', '/locations']));
    expect(routes('MANAGER')).toEqual(expect.arrayContaining(['/entry', '/exit', '/reports']));
    const s = routes('SUPER_ADMIN');
    expect(s).toEqual(expect.arrayContaining(['/platform', '/organizations']));
    ['/entry', '/exit', '/payments', '/spaces'].forEach((p) => expect(s).not.toContain(p));
  });
  it('keeps Entry and Exit on the phone dock for operators', () => {
    expect(dockFor(userOf('ATTENDANT')).map((d) => d.to)).toEqual(expect.arrayContaining(['/entry', '/exit']));
    expect(dockFor(userOf('ATTENDANT')).find((d) => d.to === '/entry').lens).toBe(true);
  });
});
