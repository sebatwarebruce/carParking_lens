import { QRCodeSVG } from 'qrcode.react';
import { methodLabel } from '@/constants/paymentMethods.js';
import { formatDateTime, formatDuration, formatMoney } from '@/utils/format.js';
import { ticketUrl } from '@/components/common/QrTicket.jsx';

function Row({ k, v, strong }) {
  return <div className={`flex justify-between gap-4 py-1 text-sm ${strong ? 'font-semibold' : ''}`}><dt className="text-muted">{k}</dt><dd className="text-right tabular">{v}</dd></div>;
}

/** Receipt document. Every figure comes from the server's verified financial record. */
export default function ReceiptView({ r }) {
  return (
    <article className="print-area mx-auto w-full max-w-sm rounded-lg border border-line bg-surface p-6" aria-label={`Receipt ${r.receiptNumber}`}>
      <header className="text-center">
        <p className="font-display text-xl">{r.organizationName}</p>
        <p className="text-sm text-muted">{r.lotName}</p>
        <p className="mt-3 text-sm font-semibold">Parking receipt</p>
        <p className="font-mono text-sm">{r.receiptNumber}</p>
      </header>
      <dl className="mt-4 border-t border-dashed border-line pt-3">
        <Row k="Ticket" v={<span className="font-mono text-xs">{r.ticketNumber}</span>} />
        <Row k="Plate" v={<span className="plate">{r.vehicle.plateNumber}</span>} />
        <Row k="Space" v={r.slotNumber} />
        <Row k="Entry" v={formatDateTime(r.entryTime)} />
        <Row k="Exit" v={formatDateTime(r.exitTime)} />
        <Row k="Duration" v={formatDuration(r.durationMinutes)} />
      </dl>
      <dl className="mt-3 border-t border-dashed border-line pt-3">
        {r.breakdown.map((b, i) => <Row key={i} k={b.label} v={formatMoney(b.amount, r.currency)} />)}
        <div className="mt-2 border-t border-line pt-2"><Row strong k="Total paid" v={<span className="font-display text-xl">{formatMoney(r.total, r.currency)}</span>} /></div>
      </dl>
      <dl className="mt-3 border-t border-dashed border-line pt-3">
        <Row k="Method" v={methodLabel(r.payment.method)} />
        <Row k="Reference" v={<span className="break-all font-mono text-xs">{r.payment.transactionReference}</span>} />
        <Row k="Paid at" v={formatDateTime(r.payment.paidAt)} />
        {r.payment.confirmedBy && <Row k="Confirmed by" v={r.payment.confirmedBy} />}
      </dl>
      <div className="mt-4 flex justify-center"><QRCodeSVG value={ticketUrl(r.ticketNumber)} size={88} bgColor="transparent" fgColor="currentColor" title="Ticket QR" /></div>
      {r.reprintCount > 0 && <p className="mt-3 text-center text-xs text-muted">Reprint number {r.reprintCount}</p>}
    </article>
  );
}
