export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message || code);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
let seq = 1000;
export const nextId = (prefix) => `${prefix}_${++seq}`;
export const nowMs = () => Date.now();
export const iso = (ms = Date.now()) => new Date(ms).toISOString();
export const minutesAgo = (m) => Date.now() - m * 60000;
export const hoursAgo = (h) => Date.now() - h * 3600000;
export const dayKey = (isoStr, tz = 'Africa/Kigali') => new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date(isoStr));
export const normPlate = (p) => String(p || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
export const normPhone = (p) => String(p || '').replace(/[^0-9+]/g, '');
export function paginate(list, query) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
  return { items: list.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: list.length };
}
// Small deterministic PRNG so demo data is stable between reloads.
export function rng(seed = 42) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}
