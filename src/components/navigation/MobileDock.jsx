import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { Ellipsis } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { dockFor } from '@/constants/nav.js';
import { ICONS } from '@/constants/icons.js';
import { clsx } from '@/utils/format.js';
import MoreSheet from './MoreSheet.jsx';

/**
 * Neumorphic phone navigation. Soft dimensional surface, tactile keys, >=48 px targets, labels always visible.
 * Entry/Exit stay one tap away; Entry is the raised "lens" key. Active = quiet pill + accent icon (still clearly distinct).
 */
export default function MobileDock() {
  const { user } = useAuth();
  const [more, setMore] = useState(false);
  const items = dockFor(user);
  return (
    <>
      <nav aria-label="Primary" className="no-print neu fixed inset-x-3 bottom-[max(env(safe-area-inset-bottom),0.75rem)] z-40 md:hidden">
        <ul className="grid items-end px-1.5 py-1.5" style={{ gridTemplateColumns: `repeat(${items.length + 1}, minmax(0, 1fr))` }}>
          {items.map((i) => {
            const Icon = i.lens ? ICONS.lens : i.icon;
            return (
              <li key={i.to} className="flex justify-center">
                <NavLink to={i.to} className={({ isActive }) => clsx('relative flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 rounded-md text-[11px] transition-colors', i.lens && '-mt-6 min-h-[64px]', isActive ? 'font-semibold text-ink' : 'text-muted')}>
                  {({ isActive }) => (
                    <>
                      {isActive && !i.lens && <motion.span layoutId="dock-active" className="absolute inset-0 rounded-md" style={{ background: 'color-mix(in srgb, var(--accent) 11%, transparent)', boxShadow: 'inset 2px 2px 5px var(--neu-dark), inset -2px -2px 5px var(--neu-light)' }} transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}
                      {i.lens ? (
                        <span className={clsx('lens-ring grid size-14 place-items-center bg-accent text-on-accent transition-transform', isActive ? 'scale-95' : '')}><Icon size={26} strokeWidth={1.75} aria-hidden /></span>
                      ) : <Icon size={22} strokeWidth={1.75} aria-hidden className={clsx('relative transition-colors', isActive && 'text-accent-text')} />}
                      <span className="relative">{i.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
          <li className="flex justify-center">
            <button onClick={() => setMore(true)} aria-haspopup="dialog" className="flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 rounded-md text-[11px] text-muted"><Ellipsis size={22} strokeWidth={1.75} aria-hidden />More</button>
          </li>
        </ul>
      </nav>
      <MoreSheet open={more} onClose={() => setMore(false)} />
    </>
  );
}
