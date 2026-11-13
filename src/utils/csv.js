// Client-side CSV from rows the SERVER already returned (no recomputation of money).
const esc = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s; // neutralise spreadsheet formula injection
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
export function toCsv(columns, rows) {
  const head = columns.map((c) => esc(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => esc(typeof c.value === 'function' ? c.value(r) : r[c.value])).join(','));
  return [head, ...body].join('\n');
}
export function downloadCsv(filename, columns, rows, meta = []) {
  const prefix = meta.map((m) => esc(m)).join('\n');
  const blob = new Blob([`${prefix ? `${prefix}\n\n` : ''}${toCsv(columns, rows)}`], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
