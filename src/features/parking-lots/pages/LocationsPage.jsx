import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPinned, Pencil, Plus } from 'lucide-react';
import { parkingService } from '@/services/parkingService.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { useToast } from '@/app/providers/ToastProvider.jsx';
import { useGuardedMutation } from '@/hooks/useGuardedMutation.js';
import { P } from '@/constants/permissions.js';
import { SLOT_VEHICLE_TYPES } from '@/constants/vehicleTypes.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import Card from '@/components/ui/Card.jsx';
import Button from '@/components/ui/Button.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Alert from '@/components/feedback/Alert.jsx';
import { Field, Input, Select } from '@/components/forms/Field.jsx';
import { EmptyState, QueryState } from '@/components/feedback/States.jsx';

function LotForm({ lot, onClose }) {
  const qc = useQueryClient(); const toast = useToast();
  const [v, setV] = useState({ name: lot?.name ?? '', address: lot?.address ?? '', contact: lot?.contact ?? '' });
  const m = useGuardedMutation(() => (lot ? parkingService.updateLot(lot.id, v) : parkingService.createLot(v)), { onSuccess: () => { qc.invalidateQueries({ queryKey: ['lots'] }); toast.success('Location saved.'); onClose(); } });
  return (
    <Modal open onClose={onClose} variant="sheet" title={lot ? 'Edit location' : 'New location'}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
        <Field label="Name" required>{(p) => <Input {...p} required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />}</Field>
        <Field label="Address">{(p) => <Input {...p} value={v.address} onChange={(e) => setV({ ...v, address: e.target.value })} />}</Field>
        <Field label="Contact phone">{(p) => <Input {...p} type="tel" value={v.contact} onChange={(e) => setV({ ...v, contact: e.target.value })} />}</Field>
        {m.error && <Alert tone="danger" live>{m.error.message}</Alert>}
        <Button type="submit" size="lg" className="w-full" loading={m.isSubmitting}>Save location</Button>
      </form>
    </Modal>
  );
}

function AddSlots({ lot, onClose }) {
  const qc = useQueryClient(); const toast = useToast();
  const [v, setV] = useState({ prefix: 'E', from: 1, to: 10, vehicleType: 'CAR', zone: '' });
  const m = useGuardedMutation(() => parkingService.createSlots(lot.id, { ...v, from: Number(v.from), to: Number(v.to) }), { onSuccess: (r) => { qc.invalidateQueries({ queryKey: ['lots'] }); qc.invalidateQueries({ queryKey: ['slots'] }); toast.success(`${r.length} spaces added.`); onClose(); } });
  const bad = !v.prefix || Number(v.to) < Number(v.from) || Number(v.to) - Number(v.from) > 199;
  return (
    <Modal open onClose={onClose} variant="sheet" title={`Add spaces to ${lot.name}`} description="Numbers already in use are skipped.">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!bad) m.mutate(); }}>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Prefix" required>{(p) => <Input {...p} maxLength={4} value={v.prefix} onChange={(e) => setV({ ...v, prefix: e.target.value.toUpperCase() })} />}</Field>
          <Field label="From" required>{(p) => <Input {...p} inputMode="numeric" value={v.from} onChange={(e) => setV({ ...v, from: e.target.value.replace(/\D/g, '') })} />}</Field>
          <Field label="To" required>{(p) => <Input {...p} inputMode="numeric" value={v.to} onChange={(e) => setV({ ...v, to: e.target.value.replace(/\D/g, '') })} />}</Field>
        </div>
        <Field label="Fits">{(p) => <Select {...p} value={v.vehicleType} onChange={(e) => setV({ ...v, vehicleType: e.target.value })}>{SLOT_VEHICLE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select>}</Field>
        <Field label="Zone (optional)">{(p) => <Input {...p} value={v.zone} onChange={(e) => setV({ ...v, zone: e.target.value })} />}</Field>
        {bad && <p role="alert" className="text-sm text-danger">Check the range: "To" must be at least "From", up to 200 spaces at a time.</p>}
        {m.error && <Alert tone="danger" live>{m.error.message}</Alert>}
        <Button type="submit" size="lg" className="w-full" disabled={bad} loading={m.isSubmitting}>Add spaces</Button>
      </form>
    </Modal>
  );
}

export default function LocationsPage() {
  const { can } = useAuth();
  const q = useQuery({ queryKey: ['lots'], queryFn: parkingService.listLots, staleTime: 60_000 });
  const [edit, setEdit] = useState(null); const [add, setAdd] = useState(null);
  const manage = can(P.LOTS_MANAGE);
  return (
    <>
      <PageHeader title="Locations and slots" description="Parking locations and their capacity." actions={manage && <Button icon={Plus} onClick={() => setEdit({})}>New location</Button>} />
      <QueryState query={q} isEmpty={(d) => !d.length} empty={<EmptyState title="No locations yet" />}>
        {(lots) => <div className="grid gap-3 md:grid-cols-2">{lots.map((l) => (
          <Card key={l.id} className="space-y-3">
            <div className="flex items-start justify-between gap-2"><div className="flex items-center gap-2.5"><span className="grid size-10 place-items-center rounded-md border border-line bg-surface2 text-accent-text"><MapPinned size={20} aria-hidden /></span><div><p className="font-display text-lg leading-tight">{l.name}</p><p className="text-sm text-muted">{l.address}</p></div></div><Badge tone={l.status === 'ACTIVE' ? 'success' : 'neutral'}>{l.status === 'ACTIVE' ? 'Active' : 'Inactive'}</Badge></div>
            <dl className="grid grid-cols-4 gap-2 text-center text-sm">{[['Total', l.capacity.total], ['Free', l.capacity.available], ['Occupied', l.capacity.occupied], ['Out', l.capacity.outOfService]].map(([k, n]) => <div key={k} className="rounded-md border border-line bg-surface2 py-2"><dd className="font-display text-xl tabular">{n}</dd><dt className="text-xs text-muted">{k}</dt></div>)}</dl>
            <div className="flex flex-wrap gap-2"><Button as={Link} to="/spaces" variant="secondary" size="sm">View spaces</Button>{manage && <><Button variant="secondary" size="sm" icon={Plus} onClick={() => setAdd(l)}>Add spaces</Button><Button variant="ghost" size="sm" icon={Pencil} onClick={() => setEdit(l)}>Edit</Button></>}</div>
          </Card>))}</div>}
      </QueryState>
      {edit && <LotForm lot={edit.id ? edit : null} onClose={() => setEdit(null)} />}
      {add && <AddSlots lot={add} onClose={() => setAdd(null)} />}
    </>
  );
}
