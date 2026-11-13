import { Aperture } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { navFor } from '@/constants/nav.js';
import { BRAND } from '@/constants/brand.js';
import NavLinkItem from './NavLinkItem.jsx';

/** Tablet: 72 px icon rail. Desktop (lg): full sidebar with grouped sections. */
export default function Sidebar() {
  const { user } = useAuth();
  const groups = navFor(user);
  return (
    <aside className="no-print sticky top-0 z-30 hidden h-dvh w-[76px] shrink-0 flex-col border-r border-line bg-raised md:flex lg:w-64">
      <div className="flex h-16 items-center gap-3 px-4">
        <span className="lens-ring grid size-9 shrink-0 place-items-center bg-bg text-accent-text"><Aperture size={18} aria-hidden /></span>
        <div className="hidden lg:block"><p className="font-display text-lg leading-none">{BRAND.name}</p></div>
      </div>
      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-2 pb-4 scroll-hide">
        {groups.map((g) => (
          <div key={g.id} className="mt-3">
            <p className="hidden px-3 pb-1 text-xs font-medium text-muted lg:block">{g.label}</p>
            <div className="space-y-0.5">{g.items.map((i) => <NavLinkItem key={i.to} item={i} collapsed layoutId="side-active" />)}</div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
