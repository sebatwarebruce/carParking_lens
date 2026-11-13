import { env } from '@/app/config/env.js';
import { SESSION_STATUS } from '@/constants/statuses.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import Card, { CardTitle } from '@/components/ui/Card.jsx';
import Badge from '@/components/ui/Badge.jsx';

const GUIDE = [
  ['Vehicle entry', 'Enter the plate, choose a free space, take the photo, review and confirm. The server issues the ticket and sets the entry time.'],
  ['Vehicle exit', 'Find the vehicle by ticket, plate, phone or QR. Confirm the vehicle, take the exit photo, then review the fee the server calculated.'],
  ['Payment', 'Cash is confirmed by an authorised person. Mobile money stays pending until the provider confirms. Never ask the customer to pay twice while a request is pending.'],
  ['Lost connection', 'If you see "not confirmed as saved", reconnect and check the Active sessions list before repeating the action.'],
];
export default function HelpPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader title="Help" description="Quick guidance for daily work." />
      {GUIDE.map(([t, d]) => <Card key={t}><h2 className="font-display text-lg">{t}</h2><p className="mt-1 text-sm text-muted">{d}</p></Card>)}
      <Card><CardTitle>What the statuses mean</CardTitle><ul className="space-y-2 text-sm">{Object.entries(SESSION_STATUS).map(([k, s]) => <li key={k} className="flex items-center gap-3"><Badge tone={s.tone} icon={s.icon}>{s.label}</Badge></li>)}</ul></Card>
      <Card><CardTitle>Need support?</CardTitle><p className="text-sm text-muted">{env.supportContact ? `Contact: ${env.supportContact}` : 'Ask your manager, or your platform administrator, for support.'}</p></Card>
    </div>
  );
}
