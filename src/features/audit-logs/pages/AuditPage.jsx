import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { auditService } from '@/services/auditService.js';
import { useUrlState } from '@/hooks/useUrlState.js';
import { useDebounce } from '@/hooks/useDebounce.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import DataTable from '@/components/tables/DataTable.jsx';
import Pagination from '@/components/tables/Pagination.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Badge from '@/components/ui/Badge.jsx';
import { Timestamp } from '@/components/common/Time.jsx';
import { Field, Input, Select } from '@/components/forms/Field.jsx';
import { EmptyState, NoResults, QueryState } from '@/components/feedback/States.jsx';

const ENTITIES = ['parking_session', 'payment', 'parking_slot', 'pricing_rule', 'user', 'receipt', 'organization', 'parking_lot'];
const flat = (o, p = '') => Object.entries(o || {}).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [[`${p}${k}`, String(v)]]));

/** Read-only. Audit records are produced and protected by the backend; the UI never creates them. */
export default function AuditPage() {
  const [f, setF] = useUrlState({ q: '', entityType: '', from: '', to: '', page: '1' });
  const [text, setText] = useState(f.q);
  const dq = useDebounce(text.trim(), 350);
  const [open, setOpen] = useState(null);
  const params = { q: dq, entityType: f.entityType, from: f.from, to: f.to, page: Number(f.page), pageSize: 20 };
  const q = useQuery({ queryKey: ['audit', params], queryFn: () => auditService.list(params), placeholderData: keepPreviousData, staleTime: 15_000 });
  return (
    <>
      <PageHeader title="Audit log" description="Who did what, and when. Records cannot be edited here." />
      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Search">{(p) => <Input {...p} type="search" placeholder="Person, action or record" value={text} onChange={(e) => { setText(e.target.value); setF({ q: e.target.value }); }} />}</Field>
        <Field label="Record type">{(p) => <Select {...p} value={f.entityType} onChange={(e) => setF({ entityType: e.target.value })}><option value="">All</option>{ENTITIES.map((e) => <option key={e} value={e}>{e.replace('_', ' ')}</option>)}</Select>}</Field>
        <Field label="From">{(p) => <Input {...p} type="date" value={f.from} onChange={(e) => setF({ from: e.target.value })} />}</Field>
        <Field label="To">{(p) => <Input {...p} type="date" value={f.to} onChange={(e) => setF({ to: e.target.value })} />}</Field>
      </div>
      <QueryState query={q} isEmpty={(d) => !d.items.length} empty={dq || f.entityType || f.from || f.to ? <NoResults /> : <EmptyState title="No audit events yet" />}>
        {(d) => (<>
          <DataTable caption="Audit events" rows={d.items} onRowClick={setOpen} columns={[
            { key: 'a', header: 'Action', primary: true, cell: (a) => <span className="font-mono text-xs">{a.action}</span> },
            { key: 'u', header: 'Actor', cell: (a) => a.actor.name },
            { key: 'e', header: 'Record', cell: (a) => <span className="text-muted">{a.entityType.replace('_', ' ')} <span className="font-mono text-xs">{a.entityId}</span></span> },
            { key: 't', header: 'When', cell: (a) => <Timestamp iso={a.createdAt} /> },
          ]} />
          <Pagination page={d.page} pageSize={d.pageSize} total={d.total} onChange={(p) => setF({ page: p })} />
        </>)}
      </QueryState>
      {open && (
        <Modal open onClose={() => setOpen(null)} variant="sheet" title={open.action} description={`${open.actor.name} at `}>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3"><dt className="text-muted">When</dt><dd><Timestamp iso={open.createdAt} /></dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Record</dt><dd><Badge>{open.entityType.replace('_', ' ')}</Badge> <span className="font-mono text-xs">{open.entityId}</span></dd></div>
            {open.ipAddress && <div className="flex justify-between gap-3"><dt className="text-muted">Network address</dt><dd className="font-mono text-xs">{open.ipAddress}</dd></div>}
            {open.metadata && flat(open.metadata).length > 0 && <div className="border-t border-line pt-3"><p className="mb-2 font-medium">Details</p>{flat(open.metadata).map(([k, v]) => <div key={k} className="flex justify-between gap-3 py-0.5"><dt className="font-mono text-xs text-muted">{k}</dt><dd className="break-all text-right">{v}</dd></div>)}</div>}
          </dl>
        </Modal>
      )}
    </>
  );
}
