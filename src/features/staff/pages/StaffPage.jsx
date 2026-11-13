import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { staffService } from '@/services/staffService.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { useLot } from '@/context/LotContext.jsx';
import { useToast } from '@/app/providers/ToastProvider.jsx';
import { useGuardedMutation } from '@/hooks/useGuardedMutation.js';
import { useUrlState } from '@/hooks/useUrlState.js';
import { useDebounce } from '@/hooks/useDebounce.js';
import { staffSchema } from '@/schemas/staff.js';
import { P } from '@/constants/permissions.js';
import { ROLE_LABELS, STAFF_ROLES } from '@/constants/roles.js';
import { ICONS } from '@/constants/icons.js';
import { maskPhone } from '@/utils/format.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import DataTable from '@/components/tables/DataTable.jsx';
import ConfirmDialog from '@/components/common/ConfirmDialog.jsx';
import Alert from '@/components/feedback/Alert.jsx';
import { Timestamp } from '@/components/common/Time.jsx';
import { Field, Input, Select } from '@/components/forms/Field.jsx';
import { EmptyState, NoResults, QueryState } from '@/components/feedback/States.jsx';

const roleBadge = (role) => { const I = ICONS.role[role]; return <Badge tone="accent" icon={I}>{ROLE_LABELS[role]}</Badge>; };
const statusBadge = (s) => <Badge tone={s === 'ACTIVE' ? 'success' : 'neutral'} icon={s === 'ACTIVE' ? ICONS.payment.SUCCESS : ICONS.payment.CANCELLED}>{s === 'ACTIVE' ? 'Active' : 'Disabled'}</Badge>;

function AddStaff({ onClose }) {
  const { lots } = useLot();
  const qc = useQueryClient();
  const toast = useToast();
  const { register, handleSubmit, setError, formState: { errors } } = useForm({ resolver: zodResolver(staffSchema), defaultValues: { name: '', email: '', phone: '', role: 'ATTENDANT', lotIds: lots[0] ? [lots[0].id] : [] } });
  const m = useGuardedMutation((v) => staffService.create({ ...v, email: v.email || undefined, phone: v.phone || undefined }), {
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); toast.success('Staff member added.'); onClose(); },
    onError: (e) => Object.entries(e.fieldErrors).forEach(([k, msg]) => setError(k, { message: msg })),
  });
  return (
    <Modal open onClose={onClose} variant="sheet" title="Add staff member" description="They receive sign-in instructions from the system.">
      <form onSubmit={handleSubmit((v) => m.mutate(v))} className="space-y-4" noValidate>
        <Field label="Full name" error={errors.name?.message} required>{(p) => <Input {...p} {...register('name')} autoComplete="off" />}</Field>
        <Field label="Email" error={errors.email?.message}>{(p) => <Input {...p} {...register('email')} type="email" autoComplete="off" />}</Field>
        <Field label="Phone" error={errors.phone?.message}>{(p) => <Input {...p} {...register('phone')} type="tel" autoComplete="off" />}</Field>
        <Field label="Role" required>{(p) => <Select {...p} {...register('role')}>{STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</Select>}</Field>
        <fieldset><legend className="mb-1.5 text-sm font-medium">Assigned locations</legend><div className="space-y-2">{lots.map((l) => <label key={l.id} className="flex min-h-11 items-center gap-3 rounded-md border border-line bg-surface2 px-3.5 text-sm"><input type="checkbox" value={l.id} {...register('lotIds')} className="size-5 accent-[var(--accent)]" />{l.name}</label>)}</div></fieldset>
        {m.error && !Object.keys(m.error.fieldErrors).length && <Alert tone="danger" live>{m.error.message}</Alert>}
        <Button type="submit" size="lg" className="w-full" loading={m.isSubmitting}>Add staff member</Button>
      </form>
    </Modal>
  );
}

function StaffDetail({ id, onClose }) {
  const { can, user: me } = useAuth();
  const { lots } = useLot();
  const qc = useQueryClient();
  const toast = useToast();
  const [confirm, setConfirm] = useState(null);
  const q = useQuery({ queryKey: ['staff', 'one', id], queryFn: () => staffService.get(id) });
  const manage = can(P.STAFF_MANAGE);
  const upd = useGuardedMutation((body) => staffService.update(id, body), { onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); toast.success('Staff member updated.'); setConfirm(null); } });
  const reset = useGuardedMutation(() => staffService.resetPassword(id), { onSuccess: () => toast.success('Password reset requested.') });
  const s = q.data;
  return (
    <>
      <Modal open={!confirm} onClose={onClose} variant="sheet" title={s?.name ?? 'Staff member'} description={s ? `${s.email ?? ''} ${s.phone ? `/ ${maskPhone(s.phone)}` : ''}` : undefined}>
        <QueryState query={q} rows={3}>
          {(u) => (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">{roleBadge(u.role)}{statusBadge(u.status)}</div>
              <p className="text-sm text-muted">Locations: {u.lots.length ? u.lots.map((l) => l.name).join(', ') : 'None'}</p>
              {manage && u.id !== me.id && (
                <div className="space-y-3 border-t border-line pt-4">
                  <Field label="Role">{(p) => <Select {...p} value={u.role} onChange={(e) => setConfirm({ type: 'role', role: e.target.value })}>{STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</Select>}</Field>
                  <fieldset><legend className="mb-1.5 text-sm font-medium">Assigned locations</legend>{lots.map((l) => <label key={l.id} className="mb-2 flex min-h-11 items-center gap-3 rounded-md border border-line bg-surface2 px-3.5 text-sm"><input type="checkbox" className="size-5 accent-[var(--accent)]" checked={u.lotIds?.includes(l.id)} onChange={(e) => upd.mutate({ lotIds: e.target.checked ? [...(u.lotIds || []), l.id] : (u.lotIds || []).filter((x) => x !== l.id) })} />{l.name}</label>)}</fieldset>
                  <div className="flex flex-wrap gap-2">
                    <Button variant={u.status === 'ACTIVE' ? 'danger' : 'primary'} onClick={() => setConfirm({ type: 'status', status: u.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' })}>{u.status === 'ACTIVE' ? 'Disable account' : 'Enable account'}</Button>
                    <Button variant="secondary" loading={reset.isSubmitting} onClick={() => reset.mutate()}>Send password reset</Button>
                  </div>
                </div>
              )}
              <div className="border-t border-line pt-4"><h3 className="mb-2 font-display text-base">Recent activity</h3>
                {u.activity.length === 0 ? <p className="text-sm text-muted">No recorded activity.</p> : <ul className="space-y-1.5 text-sm">{u.activity.slice(0, 8).map((a) => <li key={a.id} className="flex justify-between gap-3"><span className="font-mono text-xs">{a.action}</span><span className="text-muted"><Timestamp iso={a.createdAt} short /></span></li>)}</ul>}
              </div>
            </div>
          )}
        </QueryState>
      </Modal>
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} requireReason tone={confirm?.status === 'DISABLED' ? 'danger' : 'primary'} loading={upd.isSubmitting} error={upd.error}
        title={confirm?.type === 'role' ? `Change role to ${ROLE_LABELS[confirm.role]}?` : confirm?.status === 'DISABLED' ? 'Disable this account?' : 'Enable this account?'}
        description="This changes what they can do and is recorded in the audit log." confirmLabel="Confirm" onConfirm={(reason) => upd.mutate({ ...(confirm.type === 'role' ? { role: confirm.role } : { status: confirm.status }), reason })} />
    </>
  );
}

export default function StaffPage() {
  const { can, user } = useAuth();
  const [f, setF] = useUrlState({ q: '', role: '', status: '', page: '1' });
  const [text, setText] = useState(f.q);
  const dq = useDebounce(text.trim(), 300);
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(null);
  const params = { q: dq, role: f.role, status: f.status, page: Number(f.page), pageSize: 20 };
  const q = useQuery({ queryKey: ['staff', 'list', params], queryFn: () => staffService.list(params), placeholderData: keepPreviousData, staleTime: 60_000 });
  return (
    <>
      <PageHeader title={user.role === 'SUPER_ADMIN' ? 'Platform users' : 'Staff and roles'} description="People who can sign in and what they can do." actions={can(P.STAFF_MANAGE) && user.role !== 'SUPER_ADMIN' && <Button icon={Plus} onClick={() => setAdding(true)}>Add staff</Button>} />
      <div className="mb-4 grid gap-2.5 sm:grid-cols-3">
        <Input type="search" aria-label="Search staff" placeholder="Search name, email or phone" value={text} onChange={(e) => { setText(e.target.value); setF({ q: e.target.value }); }} />
        <Select aria-label="Role" value={f.role} onChange={(e) => setF({ role: e.target.value })}><option value="">All roles</option>{STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</Select>
        <Select aria-label="Status" value={f.status} onChange={(e) => setF({ status: e.target.value })}><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="DISABLED">Disabled</option></Select>
      </div>
      <QueryState query={q} isEmpty={(d) => !d.items.length} empty={dq || f.role || f.status ? <NoResults /> : <EmptyState title="No staff yet" />}>
        {(d) => <DataTable caption="Staff" rows={d.items} onRowClick={(u) => setOpen(u.id)} columns={[
          { key: 'n', header: 'Name', primary: true, cell: (u) => u.name },
          { key: 'r', header: 'Role', cell: (u) => roleBadge(u.role) },
          { key: 's', header: 'Status', cell: (u) => statusBadge(u.status) },
          { key: 'l', header: 'Locations', hideOnMobile: true, cell: (u) => u.lots.map((l) => l.name).join(', ') || '-' },
          { key: 'ls', header: 'Last sign-in', hideOnMobile: true, cell: (u) => <Timestamp iso={u.lastLoginAt} /> },
        ]} />}
      </QueryState>
      {adding && <AddStaff onClose={() => setAdding(false)} />}
      {open && <StaffDetail id={open} onClose={() => setOpen(null)} />}
    </>
  );
}
