import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CircleCheck, CircleX, Info, X } from 'lucide-react';

const Ctx = createContext(null);
export const useToast = () => useContext(Ctx);
const ICON = { success: CircleCheck, danger: CircleX, info: Info };

export default function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const dismiss = useCallback((id) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const push = useCallback((tone, message, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l.slice(-2), { id, tone, message }]);
    setTimeout(() => dismiss(id), opts.duration ?? 5000);
  }, [dismiss]);
  const api = useMemo(() => ({ success: (m, o) => push('success', m, o), error: (m, o) => push('danger', m, o), info: (m, o) => push('info', m, o) }), [push]);
  return (
    <Ctx.Provider value={api}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),0.75rem)] z-[100] flex flex-col items-center gap-2 px-3">
        <AnimatePresence>
          {items.map((t) => {
            const Icon = ICON[t.tone] || Info;
            return (
              <motion.div key={t.id} layout initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className={`tone tone-${t.tone === 'danger' ? 'danger' : t.tone} pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-md bg-raised p-3 shadow-xl`} style={{ background: 'var(--bg-raised)' }}>
                <Icon size={20} className="mt-0.5 shrink-0" aria-hidden />
                <p className="flex-1 text-sm font-medium text-ink">{t.message}</p>
                <button onClick={() => dismiss(t.id)} aria-label="Dismiss message" className="-m-2 grid size-11 place-items-center text-muted"><X size={16} /></button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
