import { env } from '@/app/config/env.js';

/** Integer RWF only. Non-integers indicate a contract bug, so surface them in dev. */
export function formatMoney(amount, currency = env.defaultCurrency) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '-';
  if (env.isDev && !Number.isInteger(amount)) console.warn('[formatMoney] expected integer minor units, got', amount);
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(amount))} ${currency}`;
}

export function formatDateTime(iso, tz = env.defaultTimezone) {
  if (!iso) return '-';
  return new Intl.DateTimeFormat('en-GB', { timeZone: tz, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
}
export function formatTime(iso, tz = env.defaultTimezone) {
  if (!iso) return '-';
  return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
}
export function formatDate(iso, tz = env.defaultTimezone) {
  if (!iso) return '-';
  return new Intl.DateTimeFormat('en-GB', { timeZone: tz, day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso));
}

/** 270 -> "4 h 30 min". Display only; durations are billed by the server. */
export function formatDuration(totalMinutes) {
  if (totalMinutes === null || totalMinutes === undefined) return '-';
  const m = Math.max(0, Math.floor(totalMinutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} min`;
  return r === 0 ? `${h} h` : `${h} h ${r} min`;
}
export function formatElapsed(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`;
}

/** Display-only plate formatting. The raw value sent to the server keeps what the attendant typed (trimmed, uppercased). */
export function displayPlate(p) {
  return (p || '').toUpperCase();
}
export function cleanPlateInput(v) {
  return (v || '').toUpperCase().replace(/[^A-Z0-9 -]/g, '').replace(/\s{2,}/g, ' ');
}

/** 0781234567 -> 078****567 */
export function maskPhone(phone) {
  if (!phone) return '-';
  const d = String(phone).replace(/\s/g, '');
  if (d.length < 7) return d;
  return `${d.slice(0, 3)}****${d.slice(-3)}`;
}

export const todayISO = (tz = env.defaultTimezone) => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
export const clsx = (...a) => a.filter(Boolean).join(' ');

export const daysAgoISO = (n, tz = env.defaultTimezone) => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(Date.now() - n * 86400000));
