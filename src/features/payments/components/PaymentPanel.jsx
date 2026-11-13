import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { paymentService } from '@/services/paymentService.js';
import { useGuardedMutation } from '@/hooks/useGuardedMutation.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { useNetwork } from '@/app/providers/NetworkProvider.jsx';
import { P } from '@/constants/permissions.js';
import { PAYMENT_METHODS, isMobileMoney, methodLabel } from '@/constants/paymentMethods.js';
import { MSG } from '@/constants/messages.js';
import { ICONS } from '@/constants/icons.js';
import { uuid } from '@/utils/ids.js';
import { formatMoney } from '@/utils/format.js';
import Button from '@/components/ui/Button.jsx';
import Alert from '@/components/feedback/Alert.jsx';
import Money from '@/components/common/Money.jsx';
import { Timestamp } from '@/components/common/Time.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { Field, Input } from '@/components/forms/Field.jsx';
import { clsx } from '@/utils/format.js';
import { usePaymentStatus } from '../hooks/usePayments.js';

/**
 * Payment flow. Hard rules:
 *  - "Request payment" means REQUEST SENT, never paid. Success is shown only when the server reports SUCCESS.
 *  - While a payment is PENDING no new request can be made (duplicate-attempt guard).
 *  - Cash needs the `payments.confirmCash` permission; otherwise the session waits for a cashier.
 *  - An Idempotency-Key is created per payment intent and reused for retries of an UNKNOWN (network) outcome.
 */
export default function PaymentPanel({ session, checkout, onSettled }) {
  const { can } = useAuth();
  const { online } = useNetwork();
  const qc = useQueryClient();
  const pending = session.payments?.find((p) => p.status === 'PENDING');
  const lastFailed = !pending && session.payments?.[0]?.status === 'FAILED' ? session.payments[0] : null;
  const methods = checkout.enabledPaymentMethods;
  const [method, setMethod] = useState(null);
  const [phone, setPhone] = useState(session.vehicle.ownerPhone || '');
  const [cashOpen, setCashOpen] = useState(false);
  const [received, setReceived] = useState(String(checkout.total));
  const [unknown, setUnknown] = useState(false);
  const key = useRef(uuid());

  const total = checkout.total;
  const refresh = () => { qc.invalidateQueries({ queryKey: ['sessions'] }); qc.invalidateQueries({ queryKey: ['slots'] }); qc.invalidateQueries({ queryKey: ['payments'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); qc.invalidateQueries({ queryKey: ['receipts'] }); };

  const create = useGuardedMutation((vars) => paymentService.create(session.id, { method: vars.method, amount: total, phone: vars.phone, amountReceived: vars.amountReceived }, key.current), {
    onSuccess: (p) => { setUnknown(false); setCashOpen(false); refresh(); if (p.status === 'SUCCESS') onSettled?.(p); },
    onError: (e) => { if (e.kind === 'network') setUnknown(true); else { key.current = uuid(); if (e.code === 'PAYMENT_ALREADY_PENDING' || e.code === 'SESSION_ALREADY_CLOSED' || e.code === 'AMOUNT_MISMATCH' || e.code === 'INVALID_STATE_TRANSITION') refresh(); } },
  });

  // ----- pending: poll the server -----
  if (pending) return <PendingPanel payment={pending} onTerminal={() => { refresh(); }} />;

  const needsCashier = !can(P.PAYMENTS_CONFIRM_CASH);
  const request = () => {
    if (method === 'CASH') { setReceived(String(total)); setCashOpen(true); return; }
    create.mutate({ method, phone });
  };
  const canCollect = can(P.PAYMENTS_COLLECT);

  return (
    <div className="space-y-4">
      {lastFailed && <Alert tone="danger" live title="Last payment not confirmed">{MSG.paymentFailed}{lastFailed.failureReason ? ` Reason: ${lastFailed.failureReason}.` : ''}</Alert>}
      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium">Payment method</legend>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Payment method">
          {methods.map((m) => {
            const meta = PAYMENT_METHODS[m]; const Icon = meta.icon; const on = method === m;
            const blocked = (m === 'CASH' && needsCashier) || (m !== 'CASH' && !canCollect);
            return (
              <button key={m} type="button" role="radio" aria-checked={on} disabled={blocked} onClick={() => setMethod(m)}
                className={clsx('neu-key flex min-h-16 items-center gap-3 px-4 text-left disabled:opacity-50', on && 'border-accent-text')} aria-pressed={on}>
                <Icon size={22} strokeWidth={1.75} className={on ? 'text-accent-text' : 'text-muted'} aria-hidden /><span className="font-medium">{meta.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {needsCashier && <Alert tone="info">Cash is confirmed by a cashier. Send the customer to the cashier desk, or choose mobile money.</Alert>}

      {isMobileMoney(method) && (
        <Field label="Customer mobile money number" hint="The customer approves the request on their phone." required>
          {(p) => <Input {...p} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="078 123 4567" />}
        </Field>
      )}

      {create.error && !unknown && <Alert tone="danger" live title="Payment not started">{create.error.message}</Alert>}
      {unknown && (
        <Alert tone="warning" live title="Not confirmed">{MSG.networkLost}
          <div className="mt-2 flex flex-wrap gap-2"><Button size="sm" variant="secondary" icon={RefreshCw} onClick={() => { refresh(); }}>Check status</Button><Button size="sm" variant="secondary" onClick={() => create.mutate({ method, phone })}>Retry same request</Button></div>
        </Alert>
      )}
      {!online && <Alert tone="warning">{MSG.offline}</Alert>}

      {method && !(method === 'CASH' && needsCashier) && (
        <Button size="lg" className="w-full" loading={create.isSubmitting} disabled={!online || (isMobileMoney(method) && phone.replace(/\D/g, '').length < 9)} onClick={request}>
          {method === 'CASH' ? 'Confirm cash received' : `Request payment of ${formatMoney(total)}`}
        </Button>
      )}
      {!method && <p className="text-center text-sm text-muted">Choose a payment method to continue.</p>}

      <CashDialog open={cashOpen} onClose={() => setCashOpen(false)} total={total} received={received} setReceived={setReceived} loading={create.isSubmitting} error={create.error}
        onConfirm={() => create.mutate({ method: 'CASH', amountReceived: Number(received) })} />
    </div>
  );
}

function CashDialog({ open, onClose, total, received, setReceived, onConfirm, loading, error }) {
  const n = Number(received);
  const short = !Number.isInteger(n) || n < total;
  const change = !short ? n - total : 0;
  return (
    <Modal open={open} onClose={loading ? undefined : onClose} title="Confirm cash payment" description="This records that you personally received the cash. It is audited under your name."
      footer={<><Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button><Button loading={loading} disabled={short} onClick={onConfirm}>Confirm {formatMoney(total)} received</Button></>}>
      <div className="space-y-4">
        <div className="rounded-md border border-line bg-surface2 p-4 text-center"><p className="text-sm text-muted">Amount due</p><Money amount={total} className="font-display text-4xl" /></div>
        <Field label="Cash received (RWF)" error={received !== '' && short ? 'Amount received must be at least the amount due.' : undefined}>
          {(p) => <Input {...p} inputMode="numeric" value={received} onChange={(e) => setReceived(e.target.value.replace(/\D/g, ''))} />}
        </Field>
        {!short && change > 0 && <p className="text-sm">Change to give back: <strong className="tabular">{formatMoney(change)}</strong></p>}
        {error && <Alert tone="danger" live>{error.message}</Alert>}
      </div>
    </Modal>
  );
}

function PendingPanel({ payment, onTerminal }) {
  const q = usePaymentStatus(payment.id);
  const p = q.data ?? payment;
  const done = useRef(false);
  useEffect(() => { if (p.status !== 'PENDING' && !done.current) { done.current = true; onTerminal(p); } }, [p, onTerminal]);
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <Alert tone="warning" title={`Request sent to ${methodLabel(p.method)}`}>
        {MSG.paymentPending}
      </Alert>
      <dl className="grid grid-cols-2 gap-3 rounded-md border border-line bg-surface2 p-4 text-sm">
        <div><dt className="text-muted">Amount requested</dt><dd className="font-semibold"><Money amount={p.amount} /></dd></div>
        <div><dt className="text-muted">Customer number</dt><dd>{p.maskedPhone || '-'}</dd></div>
        <div><dt className="text-muted">Requested at</dt><dd><Timestamp iso={p.createdAt} /></dd></div>
        <div><dt className="text-muted">Reference</dt><dd className="break-all font-mono text-xs">{p.transactionReference}</dd></div>
      </dl>
      <div className="flex items-center gap-3 text-sm text-muted"><motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="inline-flex"><ICONS.payment.PENDING size={18} aria-hidden /></motion.span>Checking with the provider. This is not paid yet.</div>
      <Button variant="secondary" icon={RefreshCw} loading={q.isFetching} onClick={() => q.refetch()}>Check status</Button>
    </div>
  );
}

export function PaymentConfirmed({ session }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-4 text-center" role="status">
      <span className="mx-auto grid size-16 place-items-center rounded-full border border-success/50 bg-success/10 text-success"><ICONS.payment.SUCCESS size={34} aria-hidden /></span>
      <h2 className="font-display text-2xl">{MSG.paymentConfirmed}</h2>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        {session.receiptId && <Button as={Link} to={`/receipts/${session.receiptId}`}>View receipt</Button>}
        <Button as={Link} to="/exit" variant="secondary">Next vehicle</Button>
      </div>
    </motion.div>
  );
}
