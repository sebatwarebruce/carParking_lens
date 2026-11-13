import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, LogOut, MapPin, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { useLot } from '@/context/LotContext.jsx';
import { useTheme } from '@/app/providers/ThemeProvider.jsx';
import { notificationService } from '@/services/notificationService.js';
import { ROLE_LABELS } from '@/constants/roles.js';
import { ICONS } from '@/constants/icons.js';
import { P } from '@/constants/permissions.js';
import { BRAND } from '@/constants/brand.js';
import Modal from '@/components/ui/Modal.jsx';
import Button from '@/components/ui/Button.jsx';
import { Select } from '@/components/forms/Field.jsx';

export function LotSwitcher() {
  const { lots, lotId, setLotId } = useLot();
  if (!lots.length) return null;
  if (lots.length === 1) return <span className="inline-flex min-w-0 items-center gap-1.5 text-sm text-muted"><MapPin size={15} aria-hidden /><span className="truncate">{lots[0].name}</span></span>;
  return (
    <label className="inline-flex min-w-0 items-center gap-1.5 text-sm">
      <MapPin size={15} className="shrink-0 text-muted" aria-hidden /><span className="sr-only">Parking location</span>
      <Select value={lotId || ''} onChange={(e) => setLotId(e.target.value)} className="!h-10 !w-auto max-w-[11rem] !py-0 text-sm">{lots.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select>
    </label>
  );
}

export default function Topbar() {
  const { user, logout, can } = useAuth();
  const { theme, toggle } = useTheme();
  const [menu, setMenu] = useState(false);
  const RoleIcon = ICONS.role[user.role];
  const notifs = useQuery({ queryKey: ['notifications'], queryFn: notificationService.list, enabled: can(P.NOTIFICATIONS_VIEW), refetchInterval: 60_000 });
  const unread = notifs.data?.items?.filter((n) => !n.read).length ?? 0;
  return (
    <header role="banner" className="no-print sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-3 px-4 md:px-6 lg:px-8">
        <span className="font-display text-lg md:hidden">{BRAND.name}</span>
        <div className="min-w-0 flex-1"><LotSwitcher /></div>
        <button onClick={toggle} aria-label={theme === 'dark' ? 'Switch to cream theme' : 'Switch to dark theme'} className="hidden size-11 place-items-center rounded-md text-muted hover:bg-surface2 hover:text-ink sm:grid">{theme === 'dark' ? <Sun size={19} aria-hidden /> : <Moon size={19} aria-hidden />}</button>
        {can(P.NOTIFICATIONS_VIEW) && (
          <Link to="/notifications" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} className="relative grid size-11 place-items-center rounded-md text-muted hover:bg-surface2 hover:text-ink">
            <Bell size={20} aria-hidden />{unread > 0 && <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent">{unread}</span>}
          </Link>
        )}
        <button onClick={() => setMenu(true)} aria-label="Account menu" className="flex h-11 items-center gap-2 rounded-md px-2 hover:bg-surface2">
          <span className="grid size-8 place-items-center rounded-full border border-line bg-surface2 text-accent-text"><RoleIcon size={16} aria-hidden /></span>
          <span className="hidden text-left text-sm leading-tight lg:block"><span className="block font-medium">{user.name}</span><span className="block text-xs text-muted">{ROLE_LABELS[user.role]}</span></span>
        </button>
      </div>
      <Modal open={menu} onClose={() => setMenu(false)} title={user.name} description={`${ROLE_LABELS[user.role]} at ${user.organizationName}`}>
        <div className="space-y-2">
          <Link to="/profile" onClick={() => setMenu(false)} className="neu-key flex min-h-12 items-center gap-2.5 px-3 text-sm"><ICONS.profile size={18} aria-hidden />Profile</Link>
          <Link to="/help" onClick={() => setMenu(false)} className="neu-key flex min-h-12 items-center gap-2.5 px-3 text-sm"><ICONS.help size={18} aria-hidden />Help</Link>
          <Button variant="danger" className="w-full" icon={LogOut} onClick={() => { setMenu(false); logout(); }}>Sign out</Button>
        </div>
      </Modal>
    </header>
  );
}
