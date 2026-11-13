import { useState } from 'react';
import { useLot } from '@/context/LotContext.jsx';
import { useDebounce } from '@/hooks/useDebounce.js';
import { useUrlState } from '@/hooks/useUrlState.js';
import { VEHICLE_TYPES } from '@/constants/vehicleTypes.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import { Input, Select } from '@/components/forms/Field.jsx';
import { EmptyState, NoResults, QueryState } from '@/components/feedback/States.jsx';
import { useActiveSessions } from '../hooks/useSessions.js';
import SessionCard from '../components/SessionCard.jsx';

export default function ActiveSessionsPage() {
  const { lotId } = useLot();
  const [f, setF] = useUrlState({ q: '', vehicleType: '' });
  const [text, setText] = useState(f.q);
  const q = useDebounce(text.trim(), 300);
  const query = useActiveSessions({ lotId, q, vehicleType: f.vehicleType, pageSize: 100 });
  const filtered = q || f.vehicleType;
  return (
    <>
      <PageHeader title="Active sessions" description="Vehicles currently parked or awaiting payment." />
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_14rem]">
        <Input type="search" aria-label="Search sessions" placeholder="Search plate, ticket, phone or space" value={text} onChange={(e) => { setText(e.target.value); setF({ q: e.target.value }); }} />
        <Select aria-label="Vehicle type" value={f.vehicleType} onChange={(e) => setF({ vehicleType: e.target.value })}><option value="">All vehicle types</option>{VEHICLE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select>
      </div>
      <QueryState query={query} isEmpty={(d) => !d.items.length} empty={filtered ? <NoResults /> : <EmptyState title="No active sessions">When a vehicle enters, it appears here.</EmptyState>}>
        {(d) => (<><p className="mb-3 text-sm text-muted tabular">{d.total} session{d.total === 1 ? '' : 's'}</p><div className="grid gap-2.5 lg:grid-cols-2">{d.items.map((s) => <SessionCard key={s.id} session={s} to={`/sessions/${s.id}`} showPhone />)}</div></>)}
      </QueryState>
    </>
  );
}
