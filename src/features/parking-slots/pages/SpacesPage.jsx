import { useMemo, useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { useLot } from '@/context/LotContext.jsx';
import { useUrlState } from '@/hooks/useUrlState.js';
import { useDebounce } from '@/hooks/useDebounce.js';
import { SLOT_STATUS } from '@/constants/statuses.js';
import { SLOT_VEHICLE_TYPES } from '@/constants/vehicleTypes.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import Segmented from '@/components/ui/Segmented.jsx';
import Badge from '@/components/ui/Badge.jsx';
import DataTable from '@/components/tables/DataTable.jsx';
import StatusBadge from '@/components/common/StatusBadge.jsx';
import { Input, Select } from '@/components/forms/Field.jsx';
import { EmptyState, NoResults, QueryState } from '@/components/feedback/States.jsx';
import { useSlots } from '../hooks/useSlots.js';
import SlotTile from '../components/SlotTile.jsx';
import SlotSheet from '../components/SlotSheet.jsx';
import { vehicleTypeLabel } from '@/constants/vehicleTypes.js';

export default function SpacesPage() {
  const { lotId, lot } = useLot();
  const [f, setF] = useUrlState({ status: '', vehicleType: '', q: '', view: 'grid' });
  const [qText, setQText] = useState(f.q);
  const dq = useDebounce(qText, 300);
  const filters = useMemo(() => ({ status: f.status, vehicleType: f.vehicleType, q: dq }), [f.status, f.vehicleType, dq]);
  const all = useSlots(lotId, {});
  const q = useSlots(lotId, filters);
  const [open, setOpen] = useState(null);
  const counts = useMemo(() => (all.data || []).reduce((a, s) => ({ ...a, [s.status]: (a[s.status] || 0) + 1 }), {}), [all.data]);
  const hasFilter = f.status || f.vehicleType || dq;
  return (
    <>
      <PageHeader title="Live spaces" description={`${lot?.name ?? ''}. Updates every few seconds.`} actions={<Segmented label="View" value={f.view} onChange={(v) => setF({ view: v })} options={[{ value: 'grid', label: 'Grid', icon: LayoutGrid }, { value: 'list', label: 'List', icon: List }]} />} />
      <div className="mb-4 flex flex-wrap gap-2" aria-label="Space totals">
        {Object.entries(SLOT_STATUS).map(([k, s]) => <Badge key={k} tone={s.tone} icon={s.icon}>{s.label}: {counts[k] ?? 0}</Badge>)}
      </div>
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_12rem_12rem]">
        <Input type="search" aria-label="Search by space number" placeholder="Search space number" value={qText} onChange={(e) => { setQText(e.target.value); setF({ q: e.target.value }); }} />
        <Select aria-label="Filter by status" value={f.status} onChange={(e) => setF({ status: e.target.value })}><option value="">All statuses</option>{Object.entries(SLOT_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</Select>
        <Select aria-label="Filter by vehicle type" value={f.vehicleType} onChange={(e) => setF({ vehicleType: e.target.value })}><option value="">All vehicle types</option>{SLOT_VEHICLE_TYPES.filter((t) => t.value !== 'ANY').map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select>
      </div>
      <QueryState query={q} isEmpty={(d) => !d.length} empty={hasFilter ? <NoResults /> : <EmptyState title="No spaces configured">Ask the owner to add spaces under Locations and slots.</EmptyState>}>
        {(slots) => f.view === 'grid' ? (
          <ul className="grid grid-cols-2 gap-2.5 min-[480px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6">{slots.map((s) => <li key={s.id}><SlotTile slot={s} onClick={setOpen} /></li>)}</ul>
        ) : (
          <DataTable caption="Parking spaces" rows={slots} onRowClick={setOpen} columns={[
            { key: 'n', header: 'Space', primary: true, cell: (s) => <span className="plate">{s.slotNumber}</span> },
            { key: 's', header: 'Status', cell: (s) => <StatusBadge kind="slot" status={s.status} /> },
            { key: 't', header: 'Fits', cell: (s) => vehicleTypeLabel(s.vehicleType) },
            { key: 'z', header: 'Zone', cell: (s) => s.zone || '-' },
            { key: 'p', header: 'Vehicle', cell: (s) => (s.currentSession ? <span className="plate">{s.currentSession.plateNumber}</span> : '-') },
          ]} />
        )}
      </QueryState>
      {open && <SlotSheet slot={open} onClose={() => setOpen(null)} />}
    </>
  );
}
