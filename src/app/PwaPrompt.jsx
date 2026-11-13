import { useRegisterSW } from 'virtual:pwa-register/react';
import Button from '@/components/ui/Button.jsx';

/** "Update available" prompt. The service worker caches the app shell only, never API data. */
export default function PwaPrompt() {
  const { needRefresh: [need, setNeed], updateServiceWorker } = useRegisterSW();
  if (!need) return null;
  return (
    <div role="status" className="no-print fixed inset-x-3 bottom-28 z-[90] mx-auto flex max-w-md items-center gap-3 rounded-md border border-line bg-raised p-3 shadow-xl md:bottom-4">
      <p className="flex-1 text-sm">A new version is ready.</p>
      <Button size="sm" onClick={() => updateServiceWorker(true)}>Update</Button><Button size="sm" variant="ghost" onClick={() => setNeed(false)}>Later</Button>
    </div>
  );
}
