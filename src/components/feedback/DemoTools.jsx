import { useState } from 'react';
import { FlaskConical } from 'lucide-react';
import Modal from '@/components/ui/Modal.jsx';
import Button from '@/components/ui/Button.jsx';
import Switch from '@/components/ui/Switch.jsx';
import { env } from '@/app/config/env.js';
import { MSG } from '@/constants/messages.js';
import { useQueryClient } from '@tanstack/react-query';

export function DemoBanner() {
  if (!env.useMocks) return null;
  return <div className="no-print bg-surface2 px-4 py-1 text-center text-xs text-muted" role="note">{MSG.demoBanner}</div>;
}

/** Demo-only controls to rehearse recovery states (slot conflict, upload failure, offline API, failed mobile money). */
export default function DemoTools() {
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);
  const qc = useQueryClient();
  if (!env.useMocks) return null;
  const c = window.__parkwiseMock?.controls;
  if (!c) return null;
  const toggle = (k) => { c[k] = !c[k]; force((n) => n + 1); };
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Open demo controls" className="no-print fixed bottom-24 right-3 z-40 grid size-11 place-items-center rounded-full border border-line bg-raised text-muted shadow-lg md:bottom-4"><FlaskConical size={18} aria-hidden /></button>
      <Modal open={open} onClose={() => setOpen(false)} variant="sheet" title="Demo controls" description="Only available in demo mode. These simulate backend situations so you can test recovery screens.">
        <div className="space-y-4">
          {[['networkDown', 'API unreachable (network error)'], ['forceSlotConflictNext', 'Next entry hits a slot conflict'], ['failNextUpload', 'Next photo upload fails']].map(([k, label]) => (
            <div key={k} className="flex items-center justify-between gap-3"><span className="text-sm">{label}</span><Switch label={label} checked={!!c[k]} onChange={() => toggle(k)} /></div>
          ))}
          <div className="flex items-center justify-between gap-3"><span className="text-sm">Mobile money outcome: {c.momoOutcome === 'fail' ? 'Fails' : 'Succeeds'}</span><Switch label="Mobile money fails" checked={c.momoOutcome === 'fail'} onChange={(v) => { c.momoOutcome = v ? 'fail' : 'success'; force((n) => n + 1); }} /></div>
          <Button variant="secondary" className="w-full" onClick={() => { window.__parkwiseMock.resetDb(); qc.clear(); setOpen(false); }}>Reset demo data</Button>
        </div>
      </Modal>
    </>
  );
}
