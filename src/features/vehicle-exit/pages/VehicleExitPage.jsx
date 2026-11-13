import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ScanLine, Search } from 'lucide-react';
import { useLot } from '@/context/LotContext.jsx';
import { useDebounce } from '@/hooks/useDebounce.js';
import { MSG } from '@/constants/messages.js';
import PageHeader from '@/components/common/PageHeader.jsx';
import Button from '@/components/ui/Button.jsx';
import Modal from '@/components/ui/Modal.jsx';
import Card from '@/components/ui/Card.jsx';
import Segmented from '@/components/ui/Segmented.jsx';
import { Input } from '@/components/forms/Field.jsx';
import { EmptyState, ErrorState } from '@/components/feedback/States.jsx';
import { SkeletonRows } from '@/components/ui/Skeleton.jsx';
import { SessionCard, useSessionSearch } from '@/features/parking-sessions/index.js';
import QrScanner from '../components/QrScanner.jsx';

const BY = [{ value: 'auto', label: 'Any' }, { value: 'ticket', label: 'Ticket' }, { value: 'plate', label: 'Plate' }, { value: 'phone', label: 'Phone' }];

export default function VehicleExitPage() {
  const { lotId } = useLot();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [text, setText] = useState(sp.get('q') || '');
  const [by, setBy] = useState('auto');
  const [scan, setScan] = useState(false);
  const q = useDebounce(text.trim(), 350);
  const search = useSessionSearch({ q, by: by === 'auto' ? undefined : by, lotId }, q.length >= 2);
  const items = search.data?.items ?? [];
  useEffect(() => { if (search.data?.items.length === 1 && /^pkg-/i.test(q)) nav(`/exit/${search.data.items[0].id}`); }, [search.data, q, nav]);
  const onScan = useCallback((value) => { setScan(false); setBy('auto'); setText(value); }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Vehicle exit" description="Find the parked vehicle by ticket, plate, phone number or QR code." />
      <Card className="space-y-3">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <Input type="search" aria-label="Search by ticket, plate or phone" autoFocus className="!h-14 pl-11 text-lg" placeholder="Ticket, plate or phone" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Segmented label="Search by" size="sm" value={by} onChange={setBy} options={BY} />
          <Button variant="secondary" icon={ScanLine} onClick={() => setScan(true)}>Scan QR</Button>
        </div>
      </Card>

      <div className="mt-5" aria-live="polite">
        {q.length < 2 ? <EmptyState title="Start typing to search">Enter at least 2 characters, or scan the ticket QR code.</EmptyState>
          : search.isFetching && !search.data ? <SkeletonRows rows={2} />
          : search.isError ? <ErrorState error={search.error} onRetry={() => search.refetch()} />
          : items.length === 0 ? <EmptyState title="No match">{MSG.noSession}</EmptyState>
          : (
            <div className="space-y-2.5">
              {items.length > 1 && <p className="text-sm text-muted">{items.length} sessions match. Choose the right vehicle.</p>}
              {items.map((s) => <SessionCard key={s.id} session={s} to={`/exit/${s.id}`} showPhone />)}
            </div>
          )}
      </div>
      <p className="mt-6 text-center text-sm text-muted">Waiting for payment instead? <Link to="/payments" className="text-accent-text hover:underline">Open the payment queue</Link></p>
      <Modal open={scan} onClose={() => setScan(false)} title="Scan ticket QR" variant="sheet">{scan && <QrScanner onResult={onScan} />}</Modal>
    </div>
  );
}
