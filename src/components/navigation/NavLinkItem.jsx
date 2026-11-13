import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { clsx } from '@/utils/format.js';

/** Subtle active state: a quiet shared-layout pill, accent icon, heavier label. No glow, no colour flood. */
export default function NavLinkItem({ item, collapsed, layoutId }) {
  const Icon = item.icon;
  return (
    <NavLink to={item.to} title={collapsed ? item.label : undefined} end={item.to === '/'}
      className={({ isActive }) => clsx('relative flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors', isActive ? 'font-semibold text-ink' : 'text-muted hover:text-ink')}>
      {({ isActive }) => (
        <>
          {isActive && <motion.span layoutId={layoutId} className="absolute inset-0 rounded-md border border-line" style={{ background: 'color-mix(in srgb, var(--accent) 11%, var(--bg-raised))' }} transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}
          {isActive && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent" aria-hidden />}
          <Icon size={20} strokeWidth={1.75} aria-hidden className={clsx('relative z-10 shrink-0 transition-colors', isActive && 'text-accent-text')} />
          <span className={clsx('relative z-10 truncate', collapsed && 'sr-only lg:not-sr-only')}>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}
