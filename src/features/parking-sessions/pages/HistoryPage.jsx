import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLot } from '@/context/LotContext.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { useDebounce } from '@/hooks/useDebounce.js';
import { useUrlState } from '@/hooks/useUrlState.js';
import { staffService } from '@/services/staffService.js';
import { SESSION_STATUS, PAYMENT_STATUS } from '@/constants/statuses.js';
import { VEHICLE_TYPES, vehicleTypeLabel } from '@/constants/vehicleTypes.js';
import { P } from '@/constants/permissions.js';
import { formatDuration } from '@/utils/format.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import DataTable from '@/components/tables/DataTable.jsx';
import Pagination from '@/components/tables/Pagination.jsx';
import StatusBadge from '@/components/common/StatusBadge.jsx';
import Money from '@/components/common/Money.jsx';
import { Timestamp } from '@/components/common/Time.jsx';
import { Field, Input, Select } from '@/components/forms/Field.jsx';
import { NoResults, EmptyState, QueryState } from '@/components/feedback/States.jsx';
import { useSessionHistory } from '../hooks/useSessions.js';

const PAGE = 15;
export default function HistoryPage() {
  const { lotId, lots } = useLot();
  const { can } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useUrlState({ q: '', from: '', to: '', status: '', paymentStatus: '', vehicleType: '', slot: '', attendantId: '', page: '1' });
  const [text, setText] = useState(f.q);
  const dq = useDebounce(text.trim(), 350);
  const staff = useQuery({ queryKey: ['staff', 'attendants'], queryFn: () => staffService.list({ role: 'ATTENDANT', pageSize: 100 }), enabled: can(P.STAFF_VIEW) });
  const params = { lotId: lots.length > 1 ? lotId : undefined, ...f, q: dq, page: Number(f.page), pageSize: PAGE };
  const q = useSessionHistory(params);
  const filtered = Object.entries(f).some(([k, v]) => k !== 'page' && v) || dq;
  return (
    <>
      <PageHeader title="Parking history" description="Search every past and present session." />
      <div className="mb-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Search">{(p) => <Input {...p} type="search" placeholder="Ticket, plate, phone" value={text} onChange={(e) => { setText(e.target.value); setF({ q: e.target.value }); }} />}</Field>
        <Field label="From">{(p) => <Input {...p} type="date" value={f.from} onChange={(e) => setF({ from: e.target.value })} />}</Field>
        <Field label="To">{(p) => <Input {...p} type="date" value={f.to} onChange={(e) => setF({ to: e.target.value })} />}</Field>
        <Field label="Space">{(p) => <Input {...p} placeholder="e.g. A-012" value={f.slot} onChange={(e) => setF({ slot: e.target.value })} />}</Field>
        <Field label="Session status">{(p) => <Select {...p} value={f.status} onChange={(e) => setF({ status: e.target.value })}><option value="">All</option>{Object.entries(SESSION_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</Select>}</Field>
        <Field label="Payment status">{(p) => <Select {...p} value={f.paymentStatus} onChange={(e) => setF({ paymentStatus: e.target.value })}><option value="">All</option>{Object.entries(PAYMENT_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</Select>}</Field>
        <Field label="Vehicle type">{(p) => <Select {...p} value={f.vehicleType} onChange={(e) => setF({ vehicleType: e.target.value })}><option value="">All</option>{VEHICLE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select>}</Field>
        {can(P.STAFF_VIEW) && <Field label="Attendant">{(p) => <Select {...p} value={f.attendantId} onChange={(e) => setF({ attendantId: e.target.value })}><option value="">All</option>{staff.data?.items.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>}</Field>}
      </div>
      <QueryState query={q} isEmpty={(d) => !d.items.length} empty={filtered ? <NoResults /> : <EmptyState title="No sessions yet" />}>
        {(d) => (
          <>
            <DataTable caption="Parking sessions" rows={d.items} onRowClick={(s) => nav(`/sessions/${s.id}`)} columns={[
              { key: 'p', header: 'Plate', primary: true, cell: (s) => <span className="plate">{s.vehicle.displayPlate}</span> },
              { key: 't', header: 'Ticket', hideOnMobile: true, cell: (s) => <span className="font-mono text-xs">{s.ticketNumber}</span> },
              { key: 'st', header: 'Status', cell: (s) => <StatusBadge status={s.status} /> },
              { key: 'sl', header: 'Space', cell: (s) => s.slot.slotNumber },
              { key: 'v', header: 'Vehicle', hideOnMobile: true, cell: (s) => vehicleTypeLabel(s.vehicle.vehicleType) },
              { key: 'e', header: 'Entered', cell: (s) => <Timestamp iso={s.entryTime} /> },
              { key: 'd', header: 'Duration', cell: (s) => (s.durationMinutes != null ? formatDuration(s.durationMinutes) : '-') },
              { key: 'a', header: 'Amount', className: 'text-right', cell: (s) => (s.amountDue != null ? <Money amount={s.amountDue} /> : '-') },
            ]} />
            <Pagination page={d.page} pageSize={d.pageSize} total={d.total} onChange={(p) => setF({ page: p })} />
          </>
        )}
      </QueryState>
    </>
  );
}
