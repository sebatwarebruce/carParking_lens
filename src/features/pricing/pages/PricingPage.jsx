import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus } from 'lucide-react';
import { pricingService } from '@/services/pricingService.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { useLot } from '@/context/LotContext.jsx';
import { useToast } from '@/app/providers/ToastProvider.jsx';
import { useGuardedMutation } from '@/hooks/useGuardedMutation.js';
import { pricingSchema } from '@/schemas/pricing.js';
import { P } from '@/constants/permissions.js';
import { VEHICLE_TYPES, vehicleTypeLabel } from '@/constants/vehicleTypes.js';
import { ICONS } from '@/constants/icons.js';
import { formatMoney, formatDate, todayISO, formatDuration } from '@/utils/format.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import Card from '@/components/ui/Card.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Alert from '@/components/feedback/Alert.jsx';
import { Field, Input, Select } from '@/components/forms/Field.jsx';
import { EmptyState, QueryState } from '@/components/feedback/States.jsx';

function RuleForm({ rule, onClose }) {
  const { lots } = useLot();
  const qc = useQueryClient();
  const toast = useToast();
  const [preview, setPreview] = useState(null);
  const [mins, setMins] = useState(150);
  const { register, handleSubmit, getValues, trigger, setError, formState: { errors } } = useForm({
    resolver: zodResolver(pricingSchema),
    defaultValues: rule ? { ...rule, dailyMaxPrice: rule.dailyMaxPrice ?? '' } : { lotId: lots[0]?.id, vehicleType: 'CAR', gracePeriodMinutes: 10, firstBlockMinutes: 60, firstBlockPrice: '', additionalBlockMinutes: 60, additionalBlockPrice: '', dailyMaxPrice: '', effectiveFrom: todayISO() },
  });
  const body = (v) => ({ ...v, dailyMaxPrice: v.dailyMaxPrice === '' ? undefined : v.dailyMaxPrice });
  const save = useGuardedMutation((v) => (rule ? pricingService.update(rule.id, body(v)) : pricingService.create(body(v))), {
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pricing'] }); toast.success('Pricing rule saved.'); onClose(); },
    onError: (e) => Object.entries(e.fieldErrors).forEach(([k, m]) => setError(k, { message: m })),
  });
  const runPreview = async () => {
    if (!(await trigger())) return;
    try { setPreview(await pricingService.preview({ ...body(getValues()), sampleMinutes: mins })); } catch { setPreview({ error: true }); }
  };
  const num = (name, label, hint) => <Field label={label} hint={hint} error={errors[name]?.message} required>{(p) => <Input {...p} {...register(name)} inputMode="numeric" />}</Field>;
  return (
    <Modal open onClose={onClose} variant="sheet" title={rule ? 'Edit pricing rule' : 'New pricing rule'} description="Fees are calculated by the server from this rule. Paid sessions keep their original amount.">
      <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Location" error={errors.lotId?.message} required>{(p) => <Select {...p} {...register('lotId')} disabled={!!rule}>{lots.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select>}</Field>
          <Field label="Vehicle type" required>{(p) => <Select {...p} {...register('vehicleType')} disabled={!!rule}>{VEHICLE_TYPES.filter((t) => t.value !== 'OTHER').map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select>}</Field>
        </div>
        {num('gracePeriodMinutes', 'Grace period (minutes)', 'Free time before charging starts.')}
        <div className="grid grid-cols-2 gap-3">{num('firstBlockMinutes', 'First period (minutes)')}{num('firstBlockPrice', 'First period price (RWF)')}</div>
        <div className="grid grid-cols-2 gap-3">{num('additionalBlockMinutes', 'Additional period (minutes)')}{num('additionalBlockPrice', 'Additional price (RWF)')}</div>
        <Field label="Daily maximum (RWF, optional)" error={errors.dailyMaxPrice?.message}>{(p) => <Input {...p} {...register('dailyMaxPrice')} inputMode="numeric" />}</Field>
        <Field label="Effective from" error={errors.effectiveFrom?.message} required>{(p) => <Input {...p} {...register('effectiveFrom')} type="date" />}</Field>
        <div className="rounded-md border border-line bg-surface2 p-3">
          <p className="mb-2 text-sm font-medium">Preview (calculated by the server)</p>
          <div className="flex items-end gap-2"><Field label="Sample stay (minutes)" className="flex-1">{(p) => <Input {...p} inputMode="numeric" value={mins} onChange={(e) => setMins(Number(e.target.value.replace(/\D/g, '')) || 0)} />}</Field><Button type="button" variant="secondary" onClick={runPreview}>Preview</Button></div>
          {preview && !preview.error && <p className="mt-2 text-sm">A {formatDuration(preview.sampleMinutes)} stay costs <strong className="tabular">{formatMoney(preview.total)}</strong>.</p>}
          {preview?.error && <p className="mt-2 text-sm text-danger">Preview is not available right now.</p>}
        </div>
        {save.error && !Object.keys(save.error.fieldErrors).length && <Alert tone="danger" live>{save.error.message}</Alert>}
        <Button type="submit" size="lg" className="w-full" loading={save.isSubmitting}>Save pricing rule</Button>
      </form>
    </Modal>
  );
}

export default function PricingPage() {
  const { can } = useAuth();
  const { lots, lotId } = useLot();
  const q = useQuery({ queryKey: ['pricing', lots.length > 1 ? lotId : 'all'], queryFn: () => pricingService.list({ lotId: lots.length > 1 ? lotId : undefined }), staleTime: 60_000 });
  const [edit, setEdit] = useState(null); // null | {} (new) | rule
  const manage = can(P.PRICING_MANAGE);
  return (
    <>
      <PageHeader title="Pricing rules" description="Billing configuration per location and vehicle type." actions={manage && <Button icon={Plus} onClick={() => setEdit({})}>New rule</Button>} />
      <QueryState query={q} isEmpty={(d) => !d.length} empty={<EmptyState title="No pricing rules">Vehicles cannot be checked out until a rule exists.</EmptyState>}>
        {(rules) => (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rules.map((r) => { const Icon = ICONS.vehicle[r.vehicleType]; return (
              <Card key={r.id} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5"><span className="grid size-10 place-items-center rounded-md border border-line bg-surface2 text-accent-text"><Icon size={20} aria-hidden /></span><div><p className="font-display text-lg leading-tight">{vehicleTypeLabel(r.vehicleType)}</p><p className="text-xs text-muted">{r.lotName}</p></div></div>
                  <Badge tone={r.status === 'ACTIVE' ? 'success' : 'neutral'} icon={r.status === 'ACTIVE' ? ICONS.payment.SUCCESS : ICONS.payment.CANCELLED}>{r.status === 'ACTIVE' ? 'Active' : 'Inactive'}</Badge>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  <div><dt className="text-muted">Grace period</dt><dd>{r.gracePeriodMinutes} min</dd></div>
                  <div><dt className="text-muted">Daily maximum</dt><dd>{r.dailyMaxPrice ? formatMoney(r.dailyMaxPrice) : 'None'}</dd></div>
                  <div><dt className="text-muted">First {r.firstBlockMinutes} min</dt><dd>{formatMoney(r.firstBlockPrice)}</dd></div>
                  <div><dt className="text-muted">Then per {r.additionalBlockMinutes} min</dt><dd>{formatMoney(r.additionalBlockPrice)}</dd></div>
                  <div className="col-span-2"><dt className="text-muted">Effective</dt><dd>{formatDate(r.effectiveFrom)}{r.effectiveTo ? ` to ${formatDate(r.effectiveTo)}` : ' onward'}</dd></div>
                </dl>
                {manage && r.status === 'ACTIVE' && <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEdit(r)}>Edit</Button>}
              </Card>); })}
          </div>
        )}
      </QueryState>
      {edit && <RuleForm rule={edit.id ? edit : null} onClose={() => setEdit(null)} />}
    </>
  );
}
