import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { vehicleService } from '@/services/vehicleService.js';
import { useDebounce } from '@/hooks/useDebounce.js';
import { vehicleTypeLabel } from '@/constants/vehicleTypes.js';
import { maskPhone } from '@/utils/format.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import DataTable from '@/components/tables/DataTable.jsx';
import Pagination from '@/components/tables/Pagination.jsx';
import Modal from '@/components/ui/Modal.jsx';
import { Input } from '@/components/forms/Field.jsx';
import StatusBadge from '@/components/common/StatusBadge.jsx';
import { Timestamp } from '@/components/common/Time.jsx';
import { EmptyState, NoResults, QueryState } from '@/components/feedback/States.jsx';

function VehicleHistory({ v, onClose }) {
  const q = useQuery({ queryKey: ['vehicles', v.id, 'sessions'], queryFn: () => vehicleService.sessions(v.id, { pageSize: 20 }) });
  return (
    <Modal open onClose={onClose} variant="sheet" title={v.displayPlate} description={`${vehicleTypeLabel(v.vehicleType)}${v.ownerName ? `, ${v.ownerName}` : ''}. Phone ${maskPhone(v.ownerPhone)}`}>
      <QueryState query={q} rows={3} isEmpty={(d) => !d.items.length} empty={<EmptyState title="No visits" />}>
        {(d) => <ul className="divide-y divide-line">{d.items.map((s) => <li key={s.id} className="py-3"><Link to={`/sessions/${s.id}`} onClick={onClose} className="flex items-center justify-between gap-3"><span><span className="block font-mono text-xs">{s.ticketNumber}</span><span className="text-sm text-muted"><Timestamp iso={s.entryTime} /></span></span><StatusBadge status={s.status} /></Link></li>)}</ul>}
      </QueryState>
    </Modal>
  );
}

export default function VehiclesPage() {
  const [text, setText] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const dq = useDebounce(text.trim(), 350);
  const q = useQuery({ queryKey: ['vehicles', dq, page], queryFn: () => vehicleService.list({ q: dq, page, pageSize: 15 }), placeholderData: keepPreviousData, staleTime: 30_000 });
  return (
    <>
      <PageHeader title="Vehicles" description="Search known vehicles and their visit history." />
      <Input type="search" aria-label="Search vehicles" className="mb-4" placeholder="Plate, phone or owner name" value={text} onChange={(e) => { setText(e.target.value); setPage(1); }} />
      <QueryState query={q} isEmpty={(d) => !d.items.length} empty={dq ? <NoResults /> : <EmptyState title="No vehicles yet" />}>
        {(d) => (<>
          <DataTable caption="Vehicles" rows={d.items} onRowClick={setOpen} columns={[
            { key: 'p', header: 'Plate', primary: true, cell: (v) => <span className="plate">{v.displayPlate}</span> },
            { key: 't', header: 'Type', cell: (v) => vehicleTypeLabel(v.vehicleType) },
            { key: 'o', header: 'Owner', cell: (v) => v.ownerName || '-' },
            { key: 'ph', header: 'Phone', cell: (v) => maskPhone(v.ownerPhone) },
            { key: 'v', header: 'Visits', cell: (v) => v.visits },
          ]} />
          <Pagination page={d.page} pageSize={d.pageSize} total={d.total} onChange={setPage} />
        </>)}
      </QueryState>
      {open && <VehicleHistory v={open} onClose={() => setOpen(null)} />}
    </>
  );
}
