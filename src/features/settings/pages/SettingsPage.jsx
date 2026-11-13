import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '@/services/settingsService.js';
import { notificationService } from '@/services/notificationService.js';
import { useAuth } from '@/context/AuthContext.jsx';
import { useToast } from '@/app/providers/ToastProvider.jsx';
import { useGuardedMutation } from '@/hooks/useGuardedMutation.js';
import { useUrlState } from '@/hooks/useUrlState.js';
import { P } from '@/constants/permissions.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import Segmented from '@/components/ui/Segmented.jsx';
import Card, { CardTitle } from '@/components/ui/Card.jsx';
import Badge from '@/components/ui/Badge.jsx';
import Button from '@/components/ui/Button.jsx';
import Switch from '@/components/ui/Switch.jsx';
import Alert from '@/components/feedback/Alert.jsx';
import { Field, Input } from '@/components/forms/Field.jsx';
import { QueryState } from '@/components/feedback/States.jsx';
import { PAYMENT_METHODS } from '@/constants/paymentMethods.js';
import { formatMoney } from '@/utils/format.js';

const STATUS = { READY: ['success', 'Ready'], SANDBOX: ['warning', 'Sandbox'], NOT_CONFIGURED: ['neutral', 'Not configured'] };

function OrgTab() {
  const { can } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['settings', 'org'], queryFn: settingsService.organization });
  const policy = useQuery({ queryKey: ['settings', 'policy'], queryFn: settingsService.policy });
  const [draft, setDraft] = useState(null);
  const m = useGuardedMutation((b) => settingsService.updateOrganization(b), { onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); setDraft(null); toast.success('Organization updated.'); } });
  const manage = can(P.SETTINGS_MANAGE);
  return (
    <QueryState query={q} rows={3}>
      {(o) => { const v = draft ?? { name: o.name, receiptFooter: o.receiptFooter }; return (
        <div className="space-y-4">
          <Card className="space-y-4"><CardTitle>Organization</CardTitle>
            <Field label="Business name">{(p) => <Input {...p} value={v.name} disabled={!manage} onChange={(e) => setDraft({ ...v, name: e.target.value })} />}</Field>
            <Field label="Receipt footer" hint="Appears at the bottom of receipts.">{(p) => <Input {...p} value={v.receiptFooter} disabled={!manage} onChange={(e) => setDraft({ ...v, receiptFooter: e.target.value })} />}</Field>
            <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted">Currency</dt><dd>{o.currency}</dd></div><div><dt className="text-muted">Timezone</dt><dd>{o.timezone}</dd></div></dl>
            {manage && <Button disabled={!draft} loading={m.isSubmitting} onClick={() => m.mutate(draft)}>Save changes</Button>}
            {m.error && <Alert tone="danger" live>{m.error.message}</Alert>}
          </Card>
          {policy.data && <Card><CardTitle>Operating policy (set by the server)</CardTitle><dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted">Customer phone at entry</dt><dd>{policy.data.requireCustomerPhone ? 'Required' : 'Optional'}</dd></div><div><dt className="text-muted">Photos</dt><dd>{policy.data.requirePhotos ? 'Required' : 'Optional'}</dd></div><div><dt className="text-muted">Long session alert</dt><dd>{policy.data.longSessionMinutes ? `${policy.data.longSessionMinutes / 60} hours` : 'Off'}</dd></div></dl></Card>}
        </div>); }}
    </QueryState>
  );
}

function PaymentsTab() {
  const q = useQuery({ queryKey: ['settings', 'methods'], queryFn: settingsService.paymentMethods });
  return (
    <Card><CardTitle>Payment methods</CardTitle>
      <Alert tone="info" className="mb-4">Provider credentials are stored on the server and are never shown in the browser. Ask your administrator to change integrations.</Alert>
      <QueryState query={q} rows={3}>{(list) => <ul className="divide-y divide-line">{list.map((m) => { const [tone, label] = STATUS[m.status] ?? ['neutral', m.status]; const I = PAYMENT_METHODS[m.method]?.icon; return (
        <li key={m.method} className="flex items-center justify-between gap-3 py-3"><span className="flex items-center gap-2.5">{I && <I size={18} className="text-accent-text" aria-hidden />}<span className="font-medium">{m.label}</span></span><span className="flex items-center gap-2"><Badge tone={m.enabled ? 'success' : 'neutral'}>{m.enabled ? 'Enabled' : 'Disabled'}</Badge><Badge tone={tone}>{label}</Badge></span></li>); })}</ul>}</QueryState>
    </Card>
  );
}

function NotificationsTab() {
  const toast = useToast();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['notification-prefs'], queryFn: notificationService.getPrefs });
  const m = useGuardedMutation((b) => notificationService.savePrefs(b), { onSuccess: (d) => { qc.setQueryData(['notification-prefs'], d); toast.success('Preferences saved.'); } });
  const rows = [['paymentFailed', 'Failed payments', 'Tell me when a payment is not confirmed.'], ['longSession', 'Long sessions', 'Tell me when a vehicle stays longer than the limit.'], ['dailySummary', 'Daily summary', 'Send an end-of-day summary.']];
  return (
    <Card><CardTitle>Notification preferences</CardTitle>
      <QueryState query={q} rows={3}>{(p) => <ul className="divide-y divide-line">{rows.map(([k, t, d]) => <li key={k} className="flex items-center justify-between gap-4 py-3"><div><p className="font-medium">{t}</p><p className="text-sm text-muted">{d}</p></div><Switch label={t} checked={!!p[k]} disabled={m.isSubmitting} onChange={(v) => m.mutate({ ...p, [k]: v })} /></li>)}</ul>}</QueryState>
    </Card>
  );
}

export default function SettingsPage() {
  const [f, setF] = useUrlState({ tab: 'org' });
  return (
    <>
      <PageHeader title="Settings" description="Organization, payments and notifications." />
      <Segmented label="Settings section" className="mb-4" value={f.tab} onChange={(v) => setF({ tab: v })} options={[{ value: 'org', label: 'Organization' }, { value: 'payments', label: 'Payments' }, { value: 'notifications', label: 'Notifications' }]} />
      <div className="max-w-2xl">{f.tab === 'org' ? <OrgTab /> : f.tab === 'payments' ? <PaymentsTab /> : <NotificationsTab />}</div>
    </>
  );
}
void formatMoney;
