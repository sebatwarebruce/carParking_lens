import { ICONS } from './icons.js';
import { P } from './permissions.js';
import { ROLES } from './roles.js';

const O = ROLES.PARKING_OWNER, M = ROLES.MANAGER, A = ROLES.ATTENDANT, C = ROLES.CASHIER, S = ROLES.SUPER_ADMIN;

/** Navigation model (UX guide section 5). `roles` narrows who sees an item; `perm` must also be granted by the server. */
export const NAV_GROUPS = [
  { id: 'home', label: 'Home', items: [
    { to: '/home', label: 'Home', icon: ICONS.home, roles: [A], perm: P.DASHBOARD_VIEW },
    { to: '/dashboard', label: 'Dashboard', icon: ICONS.dashboard, roles: [O, M], perm: P.DASHBOARD_VIEW },
    { to: '/cashier', label: 'Cashier home', icon: ICONS.payments, roles: [C], perm: P.DASHBOARD_VIEW },
    { to: '/platform', label: 'Platform overview', icon: ICONS.dashboard, roles: [S], perm: P.PLATFORM_MANAGE },
  ] },
  { id: 'ops', label: 'Parking operations', items: [
    { to: '/spaces', label: 'Live spaces', icon: ICONS.spaces, perm: P.SLOTS_VIEW },
    { to: '/entry', label: 'Vehicle entry', icon: ICONS.entry, perm: P.SESSIONS_CREATE },
    { to: '/exit', label: 'Vehicle exit', icon: ICONS.exit, perm: P.SESSIONS_CHECKOUT },
    { to: '/sessions', label: 'Active sessions', icon: ICONS.sessions, perm: P.SESSIONS_VIEW },
  ] },
  { id: 'tx', label: 'Transactions', items: [
    { to: '/payments', label: 'Payments', icon: ICONS.payments, perm: P.PAYMENTS_VIEW, labels: { [C]: 'Payment queue' } },
    { to: '/receipts', label: 'Receipts', icon: ICONS.receipt, perm: P.RECEIPTS_VIEW },
  ] },
  { id: 'records', label: 'Records', items: [
    { to: '/history', label: 'Parking history', icon: ICONS.sessions, perm: P.SESSIONS_VIEW, roles: [O, M, A, C] },
    { to: '/vehicles', label: 'Vehicles', icon: ICONS.vehicle.CAR, perm: P.VEHICLES_VIEW },
  ] },
  { id: 'mgmt', label: 'Management', items: [
    { to: '/locations', label: 'Locations and slots', icon: ICONS.locations, roles: [O, M], perm: P.LOTS_VIEW },
    { to: '/pricing', label: 'Pricing rules', icon: ICONS.pricing, perm: P.PRICING_VIEW },
    { to: '/staff', label: 'Staff and roles', icon: ICONS.staff, perm: P.STAFF_VIEW, labels: { [S]: 'Platform users' } },
    { to: '/organizations', label: 'Organizations', icon: ICONS.organizations, perm: P.PLATFORM_MANAGE },
  ] },
  { id: 'insights', label: 'Insights', items: [{ to: '/reports', label: 'Reports', icon: ICONS.reports, perm: P.REPORTS_VIEW, roles: [O, M] }] },
  { id: 'admin', label: 'Administration', items: [
    { to: '/notifications', label: 'Notifications', icon: ICONS.notifications, perm: P.NOTIFICATIONS_VIEW },
    { to: '/audit', label: 'Audit log', icon: ICONS.audit, perm: P.AUDIT_VIEW },
    { to: '/settings', label: 'Settings', icon: ICONS.settings, perm: P.SETTINGS_VIEW },
    { to: '/help', label: 'Help', icon: ICONS.help },
  ] },
];

export function navFor(user) {
  if (!user) return [];
  return NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => (!i.roles || i.roles.includes(user.role)) && (!i.perm || user.permissions.includes(i.perm))).map((i) => ({ ...i, label: i.labels?.[user.role] ?? i.label })),
  })).filter((g) => g.items.length);
}

/** Primary mobile dock per role. "More" always opens the grouped sheet with everything else. `lens` = raised centre action. */
export const DOCK = {
  ATTENDANT: ['/home', '/spaces', { to: '/entry', lens: true, label: 'Entry' }, '/exit'],
  MANAGER: ['/dashboard', '/spaces', { to: '/entry', lens: true, label: 'Entry' }, '/exit'],
  PARKING_OWNER: ['/dashboard', '/spaces', '/sessions', '/reports'],
  CASHIER: ['/cashier', '/payments', '/receipts'],
  SUPER_ADMIN: ['/platform', '/organizations', '/audit'],
};

export const dockFor = (user) => {
  const flat = navFor(user).flatMap((g) => g.items);
  return (DOCK[user.role] || []).map((d) => {
    const spec = typeof d === 'string' ? { to: d } : d;
    const item = flat.find((i) => i.to === spec.to);
    return item ? { ...item, ...spec, label: spec.label || (spec.to === '/home' || spec.to === '/dashboard' || spec.to === '/cashier' || spec.to === '/platform' ? 'Home' : item.label.replace('Vehicle ', '').replace('Live ', '').replace(' sessions', '').replace('Active', 'Parked')) } : null;
  }).filter(Boolean);
};
