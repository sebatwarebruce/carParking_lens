import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { receiptService } from '@/services/receiptService.js';
import { useLot } from '@/context/LotContext.jsx';
import { useUrlState } from '@/hooks/useUrlState.js';
import { useDebounce } from '@/hooks/useDebounce.js';
import { methodLabel } from '@/constants/paymentMethods.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import DataTable from '@/components/tables/DataTable.jsx';
import Pagination from '@/components/tables/Pagination.jsx';
import Money from '@/components/common/Money.jsx';
import { Timestamp } from '@/components/common/Time.jsx';
import { Field, Input } from '@/components/forms/Field.jsx';
import { EmptyState, NoResults, QueryState } from '@/components/feedback/States.jsx';

export default function ReceiptsPage() {
  const { lotId, lots } = useLot();
  const nav = useNavigate();
  const [f, setF] = useUrlState({ q: '', from: '', to: '', page: '1' });
  const [text, setText] = useState(f.q);
  const dq = useDebounce(text.trim(), 350);
  const params = { lotId: lots.length > 1 ? lotId : undefined, q: dq, from: f.from, to: f.to, page: Number(f.page), pageSize: 15 };
  const q = useQuery({ queryKey: ['receipts', 'list', params], queryFn: () => receiptService.list(params), placeholderData: keepPreviousData, staleTime: 30_000 });
  return (
    <>
      <PageHeader title="Receipts" description="Issued receipts for confirmed payments." />
      <div className="mb-4 grid gap-2.5 sm:grid-cols-3">
        <Field label="Search">{(p) => <Input {...p} type="search" placeholder="Receipt, ticket or plate" value={text} onChange={(e) => { setText(e.target.value); setF({ q: e.target.value }); }} />}</Field>
        <Field label="From">{(p) => <Input {...p} type="date" value={f.from} onChange={(e) => setF({ from: e.target.value })} />}</Field>
        <Field label="To">{(p) => <Input {...p} type="date" value={f.to} onChange={(e) => setF({ to: e.target.value })} />}</Field>
      </div>
      <QueryState query={q} isEmpty={(d) => !d.items.length} empty={dq || f.from || f.to ? <NoResults /> : <EmptyState title="No receipts yet">Receipts appear after a payment is confirmed.</EmptyState>}>
        {(d) => (<>
          <DataTable caption="Receipts" rows={d.items} onRowClick={(r) => nav(`/receipts/${r.id}`)} columns={[
            { key: 'n', header: 'Receipt', primary: true, cell: (r) => <span className="font-mono text-xs">{r.receiptNumber}</span> },
            { key: 'p', header: 'Plate', cell: (r) => <span className="plate">{r.vehicle.plateNumber}</span> },
            { key: 't', header: 'Total', cell: (r) => <Money amount={r.total} /> },
            { key: 'm', header: 'Method', cell: (r) => methodLabel(r.payment.method) },
            { key: 'd', header: 'Issued', cell: (r) => <Timestamp iso={r.issuedAt} /> },
          ]} />
          <Pagination page={d.page} pageSize={d.pageSize} total={d.total} onChange={(p) => setF({ page: p })} />
        </>)}
      </QueryState>
    </>
  );
}
