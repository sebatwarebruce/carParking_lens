import Badge from '@/components/ui/Badge.jsx';
import Money from '@/components/common/Money.jsx';
import { Timestamp } from '@/components/common/Time.jsx';
import { formatDuration } from '@/utils/format.js';

/** Renders EXACTLY what the server's checkout returned. No arithmetic, no rounding, no recalculation here. */
export default function FeeReview({ checkout }) {
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
        <div><dt className="text-muted">Entry</dt><dd><Timestamp iso={checkout.entryTime} /></dd></div>
        <div><dt className="text-muted">Exit (server time)</dt><dd><Timestamp iso={checkout.exitTime} /></dd></div>
        <div><dt className="text-muted">Duration</dt><dd className="font-semibold">{formatDuration(checkout.durationMinutes)}</dd></div>
        <div className="col-span-2 sm:col-span-3"><dt className="text-muted">Pricing rule</dt><dd>{checkout.pricingRule?.name}</dd></div>
      </dl>
      <div className="flex flex-wrap gap-2">
        {checkout.gracePeriodApplied && <Badge tone="info">Grace period applied</Badge>}
        {checkout.dailyMaxApplied && <Badge tone="info">Daily maximum applied</Badge>}
      </div>
      <ul className="divide-y divide-line rounded-md border border-line">
        {checkout.breakdown.map((l, i) => (
          <li key={`${l.code}-${i}`} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
            <span><span className="block font-medium">{l.label}</span>{l.detail && <span className="block text-muted">{l.detail}</span>}</span>
            <Money amount={l.amount} className={l.amount < 0 ? 'text-success' : ''} />
          </li>
        ))}
      </ul>
      <div className="flex items-end justify-between rounded-md border border-line bg-surface2 px-4 py-4">
        <span className="text-sm text-muted">Amount due</span>
        <Money amount={checkout.total} currency={checkout.currency} className="font-display text-4xl" />
      </div>
    </div>
  );
}
