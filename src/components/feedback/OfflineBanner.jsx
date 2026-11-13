import { AnimatePresence, motion } from 'motion/react';
import { WifiOff } from 'lucide-react';
import { useNetwork } from '@/app/providers/NetworkProvider.jsx';
import { MSG } from '@/constants/messages.js';

export default function OfflineBanner() {
  const { online } = useNetwork();
  return (
    <AnimatePresence>
      {!online && (
        <motion.div data-offline-banner initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
          <div role="alert" className="tone tone-warning flex items-center gap-2 border-x-0 px-4 py-2 text-sm font-medium text-ink"><WifiOff size={16} aria-hidden /><span><strong>Offline.</strong> {MSG.offline}</span></div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
