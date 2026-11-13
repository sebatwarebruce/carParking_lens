import { useIsDesktop } from '@/hooks/useMediaQuery.js';
import { clsx } from '@/utils/format.js';

/**
 * Responsive list: a real <table> on tablet/desktop, stacked cards on phones (no horizontal scrolling).
 * columns: [{ key, header, cell(row), className, primary? }]  primary columns lead each mobile card.
 */
export default function DataTable({ columns, rows, rowKey = (r) => r.id, onRowClick, caption, mobileCard }) {
  const desktop = useIsDesktop();
  if (!desktop) {
    return (
      <ul className="space-y-2.5" aria-label={caption}>
        {rows.map((r) => {
          const inner = mobileCard ? mobileCard(r) : (
            <div className="space-y-1.5">
              {columns.filter((c) => c.primary).map((c) => <div key={c.key} className="font-medium">{c.cell(r)}</div>)}
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                {columns.filter((c) => !c.primary && !c.hideOnMobile).map((c) => <div key={c.key} className="min-w-0"><dt className="text-xs text-muted">{c.header}</dt><dd className="truncate">{c.cell(r)}</dd></div>)}
              </dl>
            </div>
          );
          return (
            <li key={rowKey(r)}>
              {onRowClick ? <button onClick={() => onRowClick(r)} className="block w-full rounded-md border border-line bg-surface p-3.5 text-left transition-colors active:bg-surface2">{inner}</button> : <div className="rounded-md border border-line bg-surface p-3.5">{inner}</div>}
            </li>
          );
        })}
      </ul>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-surface">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead><tr className="border-b border-line text-muted">{columns.map((c) => <th key={c.key} scope="col" className={clsx('px-4 py-3 font-medium', c.className)}>{c.header}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined} onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter') onRowClick(r); } : undefined} tabIndex={onRowClick ? 0 : undefined}
              className={clsx('border-b border-line/60 last:border-0 transition-colors', onRowClick && 'cursor-pointer hover:bg-surface2 focus-visible:bg-surface2')}>
              {columns.map((c) => <td key={c.key} className={clsx('px-4 py-3 align-middle', c.className)}>{c.cell(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
