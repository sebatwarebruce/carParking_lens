import { NavLink } from 'react-router-dom';
import { LogOut, Moon, Sun } from 'lucide-react';
import Modal from '@/components/ui/Modal.jsx';
import { useAuth } from '@/context/AuthContext.jsx';
import { navFor } from '@/constants/nav.js';
import { ROLE_LABELS } from '@/constants/roles.js';
import { useTheme } from '@/app/providers/ThemeProvider.jsx';

/** Grouped mobile menu (everything not on the dock) + profile, theme and sign out. */
export default function MoreSheet({ open, onClose }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const groups = navFor(user);
  return (
    <Modal open={open} onClose={onClose} variant="sheet" title="Menu" description={`${user?.name} (${ROLE_LABELS[user?.role]})`}>
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.id}>
            <p className="mb-1.5 text-xs font-medium text-muted">{g.label}</p>
            <div className="grid grid-cols-2 gap-2">
              {g.items.map((i) => (
                <NavLink key={i.to} to={i.to} onClick={onClose} className={({ isActive }) => `neu-key flex min-h-12 items-center gap-2.5 px-3 text-sm ${isActive ? 'border-accent-text font-semibold' : ''}`} aria-pressed={undefined}>
                  <i.icon size={18} strokeWidth={1.75} aria-hidden className="text-accent-text" />{i.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2 border-t border-line pt-4">
          <button onClick={toggle} className="neu-key flex min-h-12 items-center gap-2.5 px-3 text-sm">{theme === 'dark' ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}{theme === 'dark' ? 'Cream theme' : 'Dark theme'}</button>
          <button onClick={() => { onClose(); logout(); }} className="neu-key flex min-h-12 items-center gap-2.5 px-3 text-sm text-danger"><LogOut size={18} aria-hidden />Sign out</button>
        </div>
      </div>
    </Modal>
  );
}
