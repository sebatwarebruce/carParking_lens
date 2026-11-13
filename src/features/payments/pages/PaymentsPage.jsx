import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useLot } from '@/context/LotContext.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { useUrlState } from '@/hooks/useUrlState.js';
import { useDebounce } from '@/hooks/useDebounce.js';
import { useGuardedMutation } from '@/hooks/useGuardedMutation.js';
import { paymentService } from '@/services/paymentService.js';
import { PAYMENT_STATUS } from '@/constants/statuses.js';
import { PAYMENT_METHODS, methodLabel } from '@/constants/paymentMethods.js';
import { P } from '@/constants/permissions.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import Segmented from '@/components/ui/Segmented.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Button from '@/components/ui/Button.jsx';
import DataTable from '@/components/tables/DataTable.jsx';
import Pagination from '@/components/tables/Pagination.jsx';
import StatusBadge from '@/components/common/StatusBadge.jsx';
import ConfirmDialog from '@/components/common/ConfirmDialog.jsx';
import Money from '@/components/common/Money.jsx';
import { Timestamp } from '@/components/common/Time.jsx';
import { Field, Input, Select } from '@/components/forms/Field.jsx';
import { EmptyState, NoResults, QueryState } from '@/components/feedback/States.jsx';
import PaymentQueue from '../components/PaymentQueue.jsx';
import { usePaymentHistory } from '../hooks/usePayments.js';

function PaymentDetail({ payment, onClose }) {
  const { can } = useAuth();
  const qc = useQueryClient();
  const [voiding, setVoiding] = useState(false);
  const m = useGuardedMutation((reason) => paymentService.void(payment.id, reason), { onSuccess: () => { ['payments', 'dashboard', 'sessions'].forEach((k) => qc.invalidateQueries({ queryKey: [k] })); setVoiding(false); onClose(); } });
  if (!payment) return null;
  return (
    <>
      <Modal open={!voiding} onClose={onClose} variant="sheet" title="Payment details" description={methodLabel(payment.method)}>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div><dt className="text-muted">Amount</dt><dd className="text-lg font-semibold"><Money amount={payment.amount} /></dd></div>
          <div><dt className="text-muted">Status</dt><dd><StatusBadge kind="payment" status={payment.status} /></dd></div>
          <div className="col-span-2"><dt className="text-muted">Transaction reference</dt><dd className="break-all font-mono text-xs">{payment.transactionReference}</dd></div>
          {payment.providerReference && <div className="col-span-2"><dt className="text-muted">Provider reference</dt><dd className="break-all font-mono text-xs">{payment.providerReference}</dd></div>}
          <div><dt className="text-muted">Created</dt><dd><Timestamp iso={payment.createdAt} /></dd></div>
          <div><dt className="text-muted">Paid at</dt><dd>{payment.paidAt ? <Timestamp iso={payment.paidAt} /> : 'Not confirmed'}</dd></div>
          {payment.maskedPhone && <div><dt className="text-muted">Customer number</dt><dd>{payment.maskedPhone}</dd></div>}
          <div><dt className="text-muted">Collected by</dt><dd>{payment.confirmedBy?.name || payment.initiatedBy?.name || '-'}</dd></div>
          {payment.failureReason && <div className="col-span-2"><dt className="text-muted">Failure reason</dt><dd>{payment.failureReason}</dd></div>}
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button as={Link} to={`/exit/${payment.sessionId}`} variant="secondary" onClick={onClose}>Open session</Button>
          {can(P.PAYMENTS_VOID) && payment.status === 'SUCCESS' && <Button variant="danger" onClick={() => setVoiding(true)}>Void payment</Button>}
        </div>
      </Modal>
      <ConfirmDialog open={voiding} onClose={() => setVoiding(false)} title="Void this payment?" description="Voids are audited and remove the amount from confirmed revenue." requireReason tone="danger" confirmLabel="Void payment" loading={m.isSubmitting} error={m.error} onConfirm={(r) => m.mutate(r)} />
    </>
  );
}

export default function PaymentsPage() {
  const { lotId, lots } = useLot();
  const [f, setF] = useUrlState({ tab: 'queue', q: '', status: '', method: '', from: '', to: '', page: '1' });
  const [text, setText] = useState(f.q);
  const dq = useDebounce(text.trim(), 350);
  const [open, setOpen] = useState(null);
  const hist = usePaymentHistory({ lotId: lots.length > 1 ? lotId : undefined, q: dq, status: f.status, method: f.method, from: f.from, to: f.to, page: Number(f.page), pageSize: 15 });
  return (
    <>
      <PageHeader title="Payments" description="Settle waiting vehicles and review every payment attempt." actions={<Segmented label="Payments view" value={f.tab} onChange={(v) => setF({ tab: v })} options={[{ value: 'queue', label: 'Payment queue' }, { value: 'history', label: 'History' }]} />} />
      {f.tab === 'queue' ? <PaymentQueue lotId={lotId} /> : (
        <>
          <div className="mb-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Search">{(p) => <Input {...p} type="search" placeholder="Reference or ticket" value={text} onChange={(e) => { setText(e.target.value); setF({ q: e.target.value }); }} />}</Field>
            <Field label="Status">{(p) => <Select {...p} value={f.status} onChange={(e) => setF({ status: e.target.value })}><option value="">All</option>{Object.entries(PAYMENT_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</Select>}</Field>
            <Field label="Method">{(p) => <Select {...p} value={f.method} onChange={(e) => setF({ method: e.target.value })}><option value="">All</option>{['CASH', 'MTN_MOMO', 'AIRTEL_MONEY'].map((k) => <option key={k} value={k}>{PAYMENT_METHODS[k].label}</option>)}</Select>}</Field>
            <Field label="From">{(p) => <Input {...p} type="date" value={f.from} onChange={(e) => setF({ from: e.target.value })} />}</Field>
            <Field label="To">{(p) => <Input {...p} type="date" value={f.to} onChange={(e) => setF({ to: e.target.value })} />}</Field>
          </div>
          <QueryState query={hist} isEmpty={(d) => !d.items.length} empty={dq || f.status || f.method || f.from || f.to ? <NoResults /> : <EmptyState title="No payments yet" />}>
            {(d) => (<>
              <DataTable caption="Payments" rows={d.items} onRowClick={setOpen} columns={[
                { key: 't', header: 'Ticket', primary: true, cell: (p) => <span className="font-mono text-xs">{p.ticketNumber}</span> },
                { key: 'm', header: 'Method', cell: (p) => methodLabel(p.method) },
                { key: 'a', header: 'Amount', cell: (p) => <Money amount={p.amount} /> },
                { key: 's', header: 'Status', cell: (p) => <StatusBadge kind="payment" status={p.status} /> },
                { key: 'd', header: 'Created', cell: (p) => <Timestamp iso={p.createdAt} /> },
                { key: 'r', header: 'Reference', hideOnMobile: true, cell: (p) => <span className="font-mono text-xs">{p.transactionReference}</span> },
              ]} />
              <Pagination page={d.page} pageSize={d.pageSize} total={d.total} onChange={(p) => setF({ page: p })} />
            </>)}
          </QueryState>
        </>
      )}
      {open && <PaymentDetail payment={open} onClose={() => setOpen(null)} />}
    </>
  );
}
