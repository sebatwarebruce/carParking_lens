import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { settingsService } from '@/services/settingsService.js';
import { useToast } from '@/app/providers/ToastProvider.jsx';
import { useGuardedMutation } from '@/hooks/useGuardedMutation.js';
import { ICONS } from '@/constants/icons.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Modal from '@/components/ui/Modal.jsx';
import DataTable from '@/components/tables/DataTable.jsx';
import ConfirmDialog from '@/components/common/ConfirmDialog.jsx';
import Alert from '@/components/feedback/Alert.jsx';
import { Timestamp } from '@/components/common/Time.jsx';
import { Field, Input } from '@/components/forms/Field.jsx';
import { EmptyState, QueryState } from '@/components/feedback/States.jsx';

export default function OrganizationsPage() {
  const qc = useQueryClient(); const toast = useToast();
  const q = useQuery({ queryKey: ['organizations'], queryFn: settingsService.listOrganizations, staleTime: 30_000 });
  const [adding, setAdding] = useState(false); const [name, setName] = useState('');
  const [target, setTarget] = useState(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ['organizations'] });
  const create = useGuardedMutation(() => settingsService.createOrganization({ name }), { onSuccess: () => { refresh(); setAdding(false); setName(''); toast.success('Organization created.'); } });
  const toggle = useGuardedMutation((reason) => settingsService.updateOrganizationById(target.id, { status: target.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE', reason }), { onSuccess: () => { refresh(); setTarget(null); toast.success('Organization updated.'); } });
  return (
    <>
      <PageHeader title="Organizations" description="Parking companies on the platform." actions={<Button icon={Plus} onClick={() => setAdding(true)}>New organization</Button>} />
      <QueryState query={q} isEmpty={(d) => !d.items.length} empty={<EmptyState title="No organizations yet" />}>
        {(d) => <DataTable caption="Organizations" rows={d.items} onRowClick={setTarget} columns={[
          { key: 'n', header: 'Name', primary: true, cell: (o) => o.name },
          { key: 's', header: 'Status', cell: (o) => <Badge tone={o.status === 'ACTIVE' ? 'success' : 'warning'} icon={o.status === 'ACTIVE' ? ICONS.payment.SUCCESS : ICONS.warning}>{o.status === 'ACTIVE' ? 'Active' : 'Suspended'}</Badge> },
          { key: 'l', header: 'Locations', cell: (o) => o.lots },
          { key: 'u', header: 'Users', cell: (o) => o.users },
          { key: 'c', header: 'Created', hideOnMobile: true, cell: (o) => <Timestamp iso={o.createdAt} /> },
        ]} />}
      </QueryState>
      <Modal open={adding} onClose={() => setAdding(false)} title="New organization">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (name.trim()) create.mutate(); }}>
          <Field label="Organization name" required error={create.error?.fieldErrors?.name}>{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
          {create.error && !create.error.fieldErrors?.name && <Alert tone="danger" live>{create.error.message}</Alert>}
          <Button type="submit" className="w-full" loading={create.isSubmitting} disabled={!name.trim()}>Create organization</Button>
        </form>
      </Modal>
      <ConfirmDialog open={!!target} onClose={() => setTarget(null)} requireReason tone={target?.status === 'ACTIVE' ? 'danger' : 'primary'} loading={toggle.isSubmitting} error={toggle.error}
        title={target?.status === 'ACTIVE' ? `Suspend ${target?.name}?` : `Reactivate ${target?.name}?`} description={target?.status === 'ACTIVE' ? 'Their staff will not be able to operate until reactivated.' : 'Their staff will be able to sign in again.'} confirmLabel={target?.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'} onConfirm={(r) => toggle.mutate(r)} />
    </>
  );
}
